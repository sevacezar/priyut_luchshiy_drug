"""Use case for deleting an image by path (image_url)."""

from backend.application.services.file_storage import FileStorage
from backend.config import settings


class DeleteImageUseCase:
    """Delete image by path (image_url suffix)."""

    def __init__(self, file_storage: FileStorage) -> None:
        self._storage = file_storage

    def _path_to_key(self, path: str) -> str:
        path = path.lstrip("/")
        prefix = settings.uploads_key_prefix.strip("/")
        if path.startswith(prefix + "/"):
            return path
        return f"{prefix}/{path}" if prefix else path

    async def execute(self, path: str) -> bool:
        """Delete image by path.

        Args:
            path: Path segment (e.g. "pets/1.png" or "uploads/pets/1.png").

        Returns:
            True if deleted, False if not found.
        """
        key = self._path_to_key(path)
        return await self._storage.delete(key)
