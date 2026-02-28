"""Use case for uploading an image and returning its image_url."""

import uuid

from backend.application.services.file_storage import FileStorage
from backend.config import settings

EXT_BY_CONTENT_TYPE = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/gif": "gif",
    "image/webp": "webp",
}


class UploadImageUseCase:
    """Upload image to storage and return the image_url (key) for API/DB."""

    def __init__(self, file_storage: FileStorage) -> None:
        self._storage = file_storage

    def _build_key(self, subpath: str, content_type: str) -> str:
        prefix = settings.uploads_key_prefix.strip("/")
        ext = EXT_BY_CONTENT_TYPE.get(content_type, "bin")
        name = f"{uuid.uuid4().hex}.{ext}"
        return f"{prefix}/{subpath.strip('/')}/{name}".replace("//", "/")

    async def execute(
        self,
        content: bytes,
        content_type: str,
        subpath: str = "pets",
    ) -> str:
        """Validate, upload, and return image_url.

        Args:
            content: Raw file bytes.
            content_type: MIME type (must be in allowed list).
            subpath: Logical folder under uploads (e.g. pets).

        Returns:
            image_url key, e.g. "uploads/pets/<uuid>.png".

        Raises:
            ValueError: If content type not allowed or file too large.
        """
        if content_type not in settings.uploads_allowed_content_types:
            raise ValueError(
                f"Content type not allowed. Allowed: {settings.uploads_allowed_content_types}"
            )
        if len(content) > settings.uploads_max_file_size_bytes:
            raise ValueError(
                f"File too large. Max size: {settings.uploads_max_file_size_bytes} bytes"
            )
        key = self._build_key(subpath, content_type)
        return await self._storage.upload(content, key, content_type)
