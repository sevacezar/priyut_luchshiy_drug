"""Session domain entity."""

from datetime import datetime, timezone
from typing import Optional

from pydantic import BaseModel, Field


class Session(BaseModel):
    """Session entity representing a user session."""

    id: Optional[str] = Field(None, description="Session ID (generated)")
    user_id: str = Field(..., description="User ID associated with this session")
    ip_address: str = Field(..., description="IP address of the client")
    user_agent: str = Field(..., description="User-Agent header from the client")
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        description="Session creation timestamp",
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        description="Last update timestamp",
    )
    expires_at: datetime = Field(
        ..., description="Session expiration timestamp"
    )

