"""Session repository implementation using Redis."""

import json
from datetime import datetime, timezone
from typing import Optional
from uuid import uuid4

import redis.asyncio as redis

from backend.application.repositories.session_repository import SessionRepository
from backend.config import settings
from backend.domain.entities.session import Session


class RedisSessionRepository:
    """Redis implementation of SessionRepository."""

    def __init__(self, redis_client: redis.Redis) -> None:
        """Initialize Redis session repository.

        Args:
            redis_client: Redis async client instance
        """
        self._redis = redis_client
        self._key_prefix = "session:"

    def _get_key(self, session_id: str) -> str:
        """Get Redis key for a session ID."""
        return f"{self._key_prefix}{session_id}"

    def _get_user_session_key(self, user_id: str, ip_address: str, user_agent: str) -> str:
        """Get Redis key for user session lookup."""
        # Create a hash of IP and User-Agent for the key
        import hashlib
        combined = f"{user_id}:{ip_address}:{user_agent}"
        hash_value = hashlib.sha256(combined.encode()).hexdigest()
        return f"{self._key_prefix}user:{hash_value}"

    async def create(self, session: Session) -> Session:
        """Create a new session.

        Args:
            session: Session entity to create (without ID)

        Returns:
            Created session entity with ID set
        """
        # Generate session ID
        session_id = str(uuid4())
        session.id = session_id

        # Serialize session data
        session_data = session.model_dump(mode="json")
        session_data["created_at"] = session.created_at.isoformat()
        session_data["updated_at"] = session.updated_at.isoformat()
        session_data["expires_at"] = session.expires_at.isoformat()

        # Calculate TTL (time to live) in seconds
        ttl = int((session.expires_at - datetime.now(timezone.utc)).total_seconds())
        if ttl <= 0:
            raise ValueError("Session expiration time must be in the future")

        # Store session by ID
        await self._redis.setex(
            self._get_key(session_id),
            ttl,
            json.dumps(session_data),
        )

        # Store session ID lookup by user_id, IP, User-Agent
        # This allows us to find existing sessions for the same user/IP/User-Agent combo
        user_session_key = self._get_user_session_key(
            session.user_id, session.ip_address, session.user_agent
        )
        await self._redis.setex(
            user_session_key, ttl, session_id.encode() if isinstance(session_id, str) else session_id
        )

        return session

    async def get_by_id(self, session_id: str) -> Optional[Session]:
        """Get a session by its ID.

        Args:
            session_id: Session identifier

        Returns:
            Session entity if found, None otherwise
        """
        data = await self._redis.get(self._get_key(session_id))
        if data is None:
            return None

        session_dict = json.loads(data)
        # Parse datetime strings
        session_dict["created_at"] = datetime.fromisoformat(session_dict["created_at"])
        session_dict["updated_at"] = datetime.fromisoformat(session_dict["updated_at"])
        session_dict["expires_at"] = datetime.fromisoformat(session_dict["expires_at"])

        return Session(**session_dict)

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
        # Get session ID from lookup key
        user_session_key = self._get_user_session_key(user_id, ip_address, user_agent)
        session_id_bytes = await self._redis.get(user_session_key)
        if session_id_bytes is None:
            return None

        # Decode session ID
        session_id = (
            session_id_bytes.decode() if isinstance(session_id_bytes, bytes) else session_id_bytes
        )

        # Get session by ID
        return await self.get_by_id(session_id)

    async def update(self, session: Session) -> Session:
        """Update an existing session.

        Args:
            session: Session entity with ID to update

        Returns:
            Updated session entity

        Raises:
            ValueError: If session not found or update fails
        """
        if not session.id:
            raise ValueError("Session ID is required for update")

        # Check if session exists
        existing = await self.get_by_id(session.id)
        if existing is None:
            raise ValueError(f"Session with ID {session.id} not found")

        # Update timestamps
        session.updated_at = datetime.now(timezone.utc)

        # Serialize session data
        session_data = session.model_dump(mode="json")
        session_data["created_at"] = session.created_at.isoformat()
        session_data["updated_at"] = session.updated_at.isoformat()
        session_data["expires_at"] = session.expires_at.isoformat()

        # Calculate new TTL
        ttl = int((session.expires_at - datetime.now(timezone.utc)).total_seconds())
        if ttl <= 0:
            raise ValueError("Session expiration time must be in the future")

        # Update session
        await self._redis.setex(
            self._get_key(session.id),
            ttl,
            json.dumps(session_data),
        )

        # Update lookup key TTL
        user_session_key = self._get_user_session_key(
            session.user_id, session.ip_address, session.user_agent
        )
        await self._redis.setex(
            user_session_key,
            ttl,
            session.id.encode() if isinstance(session.id, str) else session.id,
        )

        return session

    async def rotate(self, session: Session) -> Session:
        """Rotate an existing session by issuing a new session ID and invalidating the old one.

        This enforces single-use refresh tokens: after rotation, the old `session_id`
        embedded in the previous refresh token no longer exists in Redis.

        Args:
            session: Existing session entity with `id` set. `expires_at` should already
                be updated by the caller.

        Returns:
            Rotated session entity with a new ID.

        Raises:
            ValueError: If session not found or rotation fails.
        """
        if not session.id:
            raise ValueError("Session ID is required for rotation")

        # Ensure the old session exists
        existing = await self.get_by_id(session.id)
        if existing is None:
            raise ValueError(f"Session with ID {session.id} not found")

        old_session_id = session.id
        new_session_id = str(uuid4())

        # Keep original creation time, update updated_at
        rotated_session = session.model_copy()
        rotated_session.id = new_session_id
        rotated_session.created_at = existing.created_at
        rotated_session.updated_at = datetime.now(timezone.utc)

        # Serialize rotated session data
        session_data = rotated_session.model_dump(mode="json")
        session_data["created_at"] = rotated_session.created_at.isoformat()
        session_data["updated_at"] = rotated_session.updated_at.isoformat()
        session_data["expires_at"] = rotated_session.expires_at.isoformat()

        ttl = int((rotated_session.expires_at - datetime.now(timezone.utc)).total_seconds())
        if ttl <= 0:
            raise ValueError("Session expiration time must be in the future")

        user_session_key = self._get_user_session_key(
            rotated_session.user_id,
            rotated_session.ip_address,
            rotated_session.user_agent,
        )

        # Best-effort atomic rotation using a pipeline.
        # This prevents normal sequential reuse of old refresh tokens.
        async with self._redis.pipeline(transaction=True) as pipe:
            await (
                pipe.setex(self._get_key(new_session_id), ttl, json.dumps(session_data))
                .setex(
                    user_session_key,
                    ttl,
                    new_session_id.encode() if isinstance(new_session_id, str) else new_session_id,
                )
                .delete(self._get_key(old_session_id))
                .execute()
            )

        return rotated_session

    async def delete(self, session_id: str) -> bool:
        """Delete a session by its ID.

        Args:
            session_id: Session identifier

        Returns:
            True if session was deleted, False otherwise
        """
        session = await self.get_by_id(session_id)
        if session is None:
            return False

        # Delete session
        await self._redis.delete(self._get_key(session_id))

        # Delete lookup key
        user_session_key = self._get_user_session_key(
            session.user_id, session.ip_address, session.user_agent
        )
        await self._redis.delete(user_session_key)

        return True

    async def delete_expired(self) -> int:
        """Delete all expired sessions.

        Note: Redis automatically expires keys, so this is mainly for cleanup
        of lookup keys. In practice, expired sessions are automatically removed.

        Returns:
            Number of deleted sessions (0 for Redis as it auto-expires)
        """
        # Redis automatically expires keys, so we don't need to manually delete
        # But we can scan for expired sessions if needed
        # For now, return 0 as Redis handles expiration automatically
        return 0


# Type check: ensure implementation matches protocol
def _check_implementation() -> None:
    """Type check helper to ensure RedisSessionRepository implements SessionRepository."""
    # This would require a Redis client, so we skip the actual check
    pass

