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
    mongodb_url: str = Field(
        default="mongodb://localhost:27017",
        description="MongoDB connection URL (e.g., mongodb://user:password@host:port/database)",
    )
    mongodb_database: str = Field(
        default="priyut_luchshiy_drug",
        description="MongoDB database name",
    )

    # Application settings
    environment: str = Field(default="development")
    log_level: str = Field(default="INFO")
    app_name: str = "Clutch Backend"
    app_version: str = "0.1.0"
    debug: bool = Field(default=False)
    cors_allow_origins: list[str] = Field(default=["*"])
    
    # Security
    jwt_secret_key: str
    jwt_algorithm: str = "HS256"
    access_token_expire_seconds: int = 60 * 5  # 5 minutes
    refresh_token_expire_seconds: int = 60 * 60 * 24 * 7  # 1 weak

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

settings = Settings()
