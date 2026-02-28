"""File storage port (abstract interface for S3/MinIO)."""

from typing import Protocol


class FileStorage(Protocol):
    """Port for storing and retrieving files (e.g. S3/MinIO)."""

    async def upload(
        self,
        content: bytes,
        key: str,
        content_type: str,
    ) -> str:
        """Upload file content and return the stored object key (image_url).

        Args:
            content: Raw file bytes.
            key: Object key (path) in storage, e.g. "uploads/pets/uuid.png".
            content_type: MIME type, e.g. "image/png".

        Returns:
            The key (image_url) to use in API and DB, e.g. "uploads/pets/uuid.png".
        """
        ...

    async def get(self, key: str) -> tuple[bytes, str] | None:
        """Retrieve file content by key.

        Args:
            key: Object key (path), e.g. "uploads/pets/1.png".

        Returns:
            (content, content_type) if found, None otherwise.
        """
        ...

    async def delete(self, key: str) -> bool:
        """Delete file by key.

        Args:
            key: Object key (path), e.g. "uploads/pets/1.png".

        Returns:
            True if deleted, False if object did not exist.
        """
        ...
