"""User MongoDB model - infrastructure layer."""

from datetime import datetime, timezone

from beanie import Document
from pydantic import EmailStr, Field


class UserModel(Document):
    """MongoDB document model for users (infrastructure layer)."""

    # Authentication
    email: EmailStr = Field(..., description="User email address")
    password_hash: str = Field(..., description="Hashed password")

    # Profile
    name: str = Field(..., description="User name", min_length=1, max_length=255)

    # Permissions
    is_admin: bool = Field(default=False, description="Whether user is an administrator")
    is_active: bool = Field(default=True, description="Whether user account is active")

    # Metadata
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        description="Creation timestamp",
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        description="Last update timestamp",
    )

    def update_timestamp(self) -> None:
        """Update the updated_at timestamp. Call this before saving updates."""
        self.updated_at = datetime.now(timezone.utc)

    class Settings:
        """Beanie document settings."""

        name = "users"  # Collection name in MongoDB
        indexes = [
            [("email", 1)],  # Unique index on email
        ]

    def __repr__(self) -> str:
        """String representation of the user."""
        return f"UserModel(email={self.email}, name={self.name})"

