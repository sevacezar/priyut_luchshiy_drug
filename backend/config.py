"""Application configuration using Pydantic Settings."""

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # MongoDB configuration
    mongodb_host: str = Field(
        default="localhost",
        description="MongoDB host",
    )
    mongodb_port: int = Field(
        default=27017,
        description="MongoDB port",
    )
    mongodb_username: str = Field(
        default="",
        description="MongoDB username (empty for no auth)",
    )
    mongodb_password: str = Field(
        default="",
        description="MongoDB password (empty for no auth)",
    )
    mongodb_database: str = Field(
        default="priyut_luchshiy_drug",
        description="MongoDB database name",
    )

    @property
    def mongodb_url(self) -> str:
        """Build MongoDB connection URL with authentication if provided."""
        if self.mongodb_username and self.mongodb_password:
            # With authentication
            return (
                f"mongodb://{self.mongodb_username}:{self.mongodb_password}"
                f"@{self.mongodb_host}:{self.mongodb_port}/{self.mongodb_database}"
                f"?authSource=admin"
            )
        # Without authentication
        return f"mongodb://{self.mongodb_host}:{self.mongodb_port}/{self.mongodb_database}"

    # Application settings
    environment: str = Field(default="development")
    log_level: str = Field(default="INFO")
    app_name: str = "Clutch Backend"
    app_version: str = "0.1.0"
    debug: bool = Field(default=False)
    cors_allow_origins: list[str] = Field(default=["*"])
    
    # Security
    jwt_secret_key: str = Field(
        default="change-me-in-production",
        description="JWT secret key for token signing (should be set in production)",
    )
    jwt_algorithm: str = Field(default="HS256")
    access_token_expire_seconds: int = Field(default=60 * 5)  # 5 minutes
    refresh_token_expire_seconds: int = Field(default=60 * 60 * 24 * 7)  # 1 week

    # S3 Storage configuration
    s3_endpoint_url: str | None = Field(
        default=None,
        description=(
            "S3 endpoint URL. None for AWS S3, or MinIO URL (e.g., http://localhost:9000)"
        ),
    )
    s3_access_key: str = Field(default="minioadmin", description="S3 access key ID")
    s3_secret_key: str = Field(default="minioadmin", description="S3 secret access key")
    s3_bucket_name: str = Field(default="clutch-storage", description="S3 bucket name")
    s3_region: str = Field(default="us-east-1", description="AWS region (ignored for MinIO)")
    s3_use_ssl: bool = Field(default=True, description="Use SSL/TLS for S3 connections")
    s3_public_base_url: str | None = Field(
        default=None,
        description=(
            "Public base URL for file access. Auto-generated if None. "
            "Override for CDN or custom domain (e.g., https://cdn.example.com)"
        ),
    )
    uploads_base_path: str = Field(
        default="/uploads",
        description="Base path for file uploads served by FastAPI (e.g., /uploads)",
    )
    uploads_key_prefix: str = Field(
        default="uploads",
        description="Prefix for object keys in S3/MinIO (e.g., uploads -> uploads/pets/xxx.png)",
    )
    uploads_max_file_size_bytes: int = Field(
        default=5 * 1024 * 1024,
        description="Max upload file size in bytes (default 5 MiB)",
    )
    uploads_allowed_content_types: list[str] = Field(
        default=["image/jpeg", "image/png", "image/gif", "image/webp"],
        description="Allowed MIME types for image uploads",
    )

    # Redis configuration
    redis_host: str = Field(default="localhost", description="Redis host")
    redis_port: int = Field(default=6379, description="Redis port")
    redis_password: str = Field(default="", description="Redis password (empty for no auth)")
    redis_db: int = Field(default=0, description="Redis database number")
    redis_url: str = Field(
        default="",
        description="Redis connection URL (overrides host/port/password/db if set)",
    )

    # Session configuration
    session_expire_seconds: int = Field(
        default=60 * 60 * 24 * 7,  # 7 days
        description="Session expiration time in seconds",
    )

settings = Settings()
