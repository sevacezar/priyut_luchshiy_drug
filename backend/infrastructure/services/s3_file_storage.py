"""S3-compatible file storage implementation (MinIO)."""

from typing import Any

import aioboto3
from botocore.exceptions import ClientError

from backend.application.services.file_storage import FileStorage
from backend.config import settings


class S3FileStorage:
    """File storage implementation using S3-compatible API (MinIO)."""

    def __init__(
        self,
        *,
        endpoint_url: str | None = None,
        access_key: str | None = None,
        secret_key: str | None = None,
        bucket_name: str | None = None,
        region: str | None = None,
        use_ssl: bool | None = None,
    ) -> None:
        self._endpoint_url = endpoint_url or settings.s3_endpoint_url
        self._access_key = access_key or settings.s3_access_key
        self._secret_key = secret_key or settings.s3_secret_key
        self._bucket_name = bucket_name or settings.s3_bucket_name
        self._region = region or settings.s3_region
        self._use_ssl = use_ssl if use_ssl is not None else settings.s3_use_ssl
        self._session = aioboto3.Session()

    def _client_kwargs(self) -> dict[str, Any]:
        kwargs: dict[str, Any] = {
            "aws_access_key_id": self._access_key,
            "aws_secret_access_key": self._secret_key,
            "region_name": self._region,
        }
        if self._endpoint_url:
            kwargs["endpoint_url"] = self._endpoint_url
        return kwargs

    async def _ensure_bucket(self) -> None:
        async with self._session.client("s3", **self._client_kwargs()) as client:
            try:
                create_kwargs: dict[str, Any] = {"Bucket": self._bucket_name}
                if self._region and self._region != "us-east-1":
                    create_kwargs["CreateBucketConfiguration"] = {
                        "LocationConstraint": self._region
                    }
                await client.create_bucket(**create_kwargs)
            except ClientError as e:
                if e.response["Error"]["Code"] not in (
                    "BucketAlreadyExists",
                    "BucketAlreadyOwnedByYou",
                ):
                    raise

    async def upload(
        self,
        content: bytes,
        key: str,
        content_type: str,
    ) -> str:
        await self._ensure_bucket()
        async with self._session.client("s3", **self._client_kwargs()) as client:
            await client.put_object(
                Bucket=self._bucket_name,
                Key=key,
                Body=content,
                ContentType=content_type,
            )
        return key

    async def get(self, key: str) -> tuple[bytes, str] | None:
        async with self._session.client("s3", **self._client_kwargs()) as client:
            try:
                resp = await client.get_object(Bucket=self._bucket_name, Key=key)
            except ClientError as e:
                if e.response["Error"]["Code"] in ("404", "NoSuchKey"):
                    return None
                raise
            content_type = resp.get("ContentType") or "application/octet-stream"
            async with resp["Body"] as stream:
                body = await stream.read()
            return (body, content_type)

    async def delete(self, key: str) -> bool:
        async with self._session.client("s3", **self._client_kwargs()) as client:
            try:
                await client.head_object(Bucket=self._bucket_name, Key=key)
            except ClientError as e:
                if e.response["Error"]["Code"] in ("404", "NoSuchKey"):
                    return False
                raise
            await client.delete_object(Bucket=self._bucket_name, Key=key)
        return True
