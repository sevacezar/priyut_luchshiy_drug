"""Use case for retrieving an image by path (image_url)."""

from backend.application.services.file_storage import FileStorage
from backend.config import settings


class GetImageUseCase:
    """Retrieve image bytes and content type by path (image_url suffix)."""

    def __init__(self, file_storage: FileStorage) -> None:
        self._storage = file_storage

    def _path_to_key(self, path: str) -> str:
        """Convert URL path segment to storage key.

        Path is the part after /api/v1/uploads/, e.g. "pets/1.png".
        Key in storage is e.g. "uploads/pets/1.png".
        """
        path = path.lstrip("/")
        prefix = settings.uploads_key_prefix.strip("/")
        if path.startswith(prefix + "/"):
            return path
        return f"{prefix}/{path}" if prefix else path

    async def execute(self, path: str) -> tuple[bytes, str] | None:
        """Get image by path.

        Args:
            path: Path segment (e.g. "pets/1.png" or "uploads/pets/1.png").

        Returns:
            (content, content_type) if found, None otherwise.
        """
        key = self._path_to_key(path)
        return await self._storage.get(key)
