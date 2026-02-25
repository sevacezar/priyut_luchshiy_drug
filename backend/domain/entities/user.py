"""User entity - domain model for users."""

from datetime import datetime, timezone
from typing import Optional

from pydantic import BaseModel, EmailStr, Field


class User(BaseModel):
    """User entity representing a system user."""

    # ID (set by repository/infrastructure layer)
    id: Optional[str] = Field(None, description="User ID (set by database)")

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

    def __repr__(self) -> str:
        """String representation of the user."""
        return f"User(email={self.email}, name={self.name})"

