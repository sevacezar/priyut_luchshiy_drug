#!/usr/bin/env python3
"""Seed pets with downloaded images.

Usage:
    uv run python -m backend.scripts.seed_pets_with_images
    uv run python -m backend.scripts.seed_pets_with_images --data-file backend/scripts/data/pets_seed_ru.json
"""

import argparse
import asyncio
import json
import mimetypes
import sys
from pathlib import Path
from urllib.parse import urlparse
from urllib.request import Request, urlopen

# Add project root to Python path
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

from backend.application.use_cases.delete_image import DeleteImageUseCase
from backend.application.use_cases.pet_create import PetCreateUseCase
from backend.application.use_cases.upload_image import UploadImageUseCase
from backend.config import settings
from backend.domain.entities.pet import Pet
from backend.infrastructure.database.connection import init_database
from backend.infrastructure.database.models.pet_model import PetModel
from backend.infrastructure.repositories.pet_repository_impl import PetRepositoryImpl
from backend.infrastructure.services.s3_file_storage import S3FileStorage

DEFAULT_DATA_FILE = Path("backend/scripts/data/pets_seed_ru.json")


def _sniff_content_type(content: bytes) -> str:
    """Best-effort MIME sniffing for common image signatures."""
    if content.startswith(b"\xff\xd8\xff"):
        return "image/jpeg"
    if content.startswith(b"\x89PNG\r\n\x1a\n"):
        return "image/png"
    if content.startswith((b"GIF87a", b"GIF89a")):
        return "image/gif"
    if len(content) > 12 and content[:4] == b"RIFF" and content[8:12] == b"WEBP":
        return "image/webp"
    return "application/octet-stream"


def _detect_content_type(url: str, header_content_type: str | None, content: bytes) -> str:
    """Resolve content type from header, URL extension, and byte signature."""
    if header_content_type:
        normalized = header_content_type.split(";", 1)[0].strip().lower()
        if normalized in settings.uploads_allowed_content_types:
            return normalized

    guessed_from_ext, _ = mimetypes.guess_type(urlparse(url).path)
    if guessed_from_ext in settings.uploads_allowed_content_types:
        return guessed_from_ext

    sniffed = _sniff_content_type(content)
    if sniffed in settings.uploads_allowed_content_types:
        return sniffed

    raise ValueError(
        f"Не удалось определить разрешенный content_type для URL: {url}. "
        f"Допустимые типы: {settings.uploads_allowed_content_types}"
    )


def _download_image(url: str, timeout_seconds: int) -> tuple[bytes, str]:
    """Download image from URL and return bytes + content type."""
    request = Request(
        url,
        headers={
            "User-Agent": "Mozilla/5.0 (compatible; PetSeeder/1.0)",
            "Accept": "image/*,*/*;q=0.8",
        },
    )
    with urlopen(request, timeout=timeout_seconds) as response:
        content = response.read()
        header_content_type = response.headers.get("Content-Type")

    if not content:
        raise ValueError(f"Пустой ответ при скачивании изображения: {url}")

    content_type = _detect_content_type(url, header_content_type, content)
    return content, content_type


def _load_seed_data(path: Path) -> list[dict]:
    """Load seed JSON and return pets array."""
    payload = json.loads(path.read_text(encoding="utf-8"))
    pets = payload.get("pets")
    if not isinstance(pets, list):
        raise ValueError("JSON должен содержать массив pets")
    return pets


async def _find_existing_pet(pet_payload: dict) -> PetModel | None:
    """Find existing pet by stable identity fields to avoid duplicates."""
    return await PetModel.find_one(
        {
            "name": pet_payload.get("name"),
            "animal_type": pet_payload.get("animal_type"),
            "birth_year": pet_payload.get("birth_year"),
        }
    )


async def seed_pets(
    data_file: Path,
    timeout_seconds: int,
    skip_existing: bool,
    strict_images: bool,
) -> None:
    """Seed pets from JSON, downloading and uploading images via use cases."""
    print("Connecting to database...")
    await init_database()
    print("✓ Database connected")

    storage = S3FileStorage()
    upload_use_case = UploadImageUseCase(storage)
    delete_image_use_case = DeleteImageUseCase(storage)
    pet_create_use_case = PetCreateUseCase(PetRepositoryImpl())

    records = _load_seed_data(data_file)
    print(f"Loaded seed file: {data_file} ({len(records)} pets)")

    created_count = 0
    skipped_count = 0
    failed_count = 0

    for idx, raw_record in enumerate(records, start=1):
        pet_payload = dict(raw_record)
        source_urls = pet_payload.pop("image_sources", None)
        pet_name = pet_payload.get("name", f"#{idx}")

        print(f"[{idx}/{len(records)}] Processing: {pet_name}")

        if not isinstance(source_urls, list) or len(source_urls) != 3:
            print(f"  ✗ {pet_name}: image_sources must contain exactly 3 URLs")
            failed_count += 1
            continue

        if skip_existing:
            existing = await _find_existing_pet(pet_payload)
            if existing is not None:
                print(f"  ↷ Skipped existing pet: {pet_name}")
                skipped_count += 1
                continue

        uploaded_keys: list[str] = []
        image_errors: list[str] = []
        try:
            for image_url in source_urls:
                try:
                    content, content_type = await asyncio.to_thread(
                        _download_image,
                        image_url,
                        timeout_seconds,
                    )
                    image_key = await upload_use_case.execute(
                        content=content,
                        content_type=content_type,
                        subpath="pets",
                    )
                    uploaded_keys.append(image_key)
                except Exception as image_exc:  # noqa: BLE001
                    image_errors.append(f"{image_url} -> {image_exc}")

            if image_errors and strict_images:
                raise ValueError(
                    "Не удалось загрузить все изображения: " + "; ".join(image_errors)
                )
            if not uploaded_keys:
                raise ValueError("Не удалось загрузить ни одного изображения")

            pet = Pet(**pet_payload, image_urls=uploaded_keys)
            created = await pet_create_use_case.execute(pet)
            if image_errors:
                print(
                    f"  ✓ Created pet: {created.name} (id={created.id}), "
                    f"uploaded {len(uploaded_keys)}/3 images"
                )
            else:
                print(f"  ✓ Created pet: {created.name} (id={created.id})")
            created_count += 1

        except Exception as exc:  # noqa: BLE001
            print(f"  ✗ Failed for {pet_name}: {exc}")
            failed_count += 1

            # Rollback uploaded images for this pet on failure
            for key in uploaded_keys:
                try:
                    await delete_image_use_case.execute(key)
                except Exception:  # noqa: BLE001
                    pass

            continue

    print("\nSeed completed")
    print(f"  Created: {created_count}")
    print(f"  Skipped: {skipped_count}")
    print(f"  Failed:  {failed_count}")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Seed pets and upload images")
    parser.add_argument(
        "--data-file",
        type=Path,
        default=DEFAULT_DATA_FILE,
        help="Path to JSON seed file (default: backend/scripts/data/pets_seed_ru.json)",
    )
    parser.add_argument(
        "--timeout-seconds",
        type=int,
        default=30,
        help="HTTP timeout for each image download",
    )
    parser.add_argument(
        "--skip-existing",
        action=argparse.BooleanOptionalAction,
        default=True,
        help="Skip pets that already exist by (name, animal_type, birth_year)",
    )
    parser.add_argument(
        "--strict-images",
        action=argparse.BooleanOptionalAction,
        default=True,
        help="If enabled, fail pet creation when any image cannot be downloaded/uploaded",
    )
    return parser.parse_args()


async def main() -> None:
    args = parse_args()
    if not args.data_file.exists():
        raise FileNotFoundError(f"Seed file not found: {args.data_file}")

    await seed_pets(
        data_file=args.data_file,
        timeout_seconds=args.timeout_seconds,
        skip_existing=args.skip_existing,
        strict_images=args.strict_images,
    )


if __name__ == "__main__":
    asyncio.run(main())
