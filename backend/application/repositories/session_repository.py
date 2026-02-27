"""Session repository interface (Protocol)."""

from datetime import datetime
from typing import Optional, Protocol

from backend.domain.entities.session import Session


class SessionRepository(Protocol):
    """Repository interface for Session entity operations."""

    async def create(self, session: Session) -> Session:
        """Create a new session.

        Args:
            session: Session entity to create (without ID)

        Returns:
            Created session entity with ID set
        """
        ...

    async def get_by_id(self, session_id: str) -> Optional[Session]:
        """Get a session by its ID.

        Args:
            session_id: Session identifier

        Returns:
            Session entity if found, None otherwise
        """
        ...

    async def get_by_user_ip_user_agent(
        self, user_id: str, ip_address: str, user_agent: str
    ) -> Optional[Session]:
        """Get a session by user_id, IP address, and User-Agent.

        Args:
            user_id: User identifier
            ip_address: Client IP address
            user_agent: Client User-Agent header

        Returns:
            Session entity if found, None otherwise
        """
        ...

    async def update(self, session: Session) -> Session:
        """Update an existing session.

        Args:
            session: Session entity with ID to update

        Returns:
            Updated session entity

        Raises:
            ValueError: If session not found or update fails
        """
        ...

    async def rotate(self, session: Session) -> Session:
        """Rotate (replace) an existing session with a new session ID.

        This is used to enforce **single-use refresh tokens**. The current refresh token
        contains the existing `session_id`. During refresh we:
        - validate the session
        - create a new session record with a new ID (same user/IP/User-Agent)
        - delete the old session record
        - update the user/IP/User-Agent lookup to point to the new session ID

        Args:
            session: Existing session entity (must have `id`) with updated fields
                (e.g., refreshed `expires_at`)

        Returns:
            Rotated session entity with a new ID set

        Raises:
            ValueError: If session not found or rotation fails
        """
        ...

    async def delete(self, session_id: str) -> bool:
        """Delete a session by its ID.

        Args:
            session_id: Session identifier

        Returns:
            True if session was deleted, False otherwise
        """
        ...

    async def delete_expired(self) -> int:
        """Delete all expired sessions.

        Returns:
            Number of deleted sessions
        """
        ...

