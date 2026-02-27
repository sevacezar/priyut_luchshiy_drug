"""Use case for refreshing access and refresh tokens."""

from datetime import datetime, timedelta, timezone

from backend.application.repositories.session_repository import SessionRepository
from backend.application.repositories.user_repository import UserRepository
from backend.config import settings
from backend.domain.entities.user import User
from backend.domain.exceptions.auth_exceptions import (
    TokenExpiredError,
    TokenInvalidError,
)
from backend.infrastructure.services.jwt_service import JWTService


class RefreshResult:
    """Result of token refresh operation."""

    access_token: str
    refresh_token: str
    user: User

    def __init__(self, access_token: str, refresh_token: str, user: User) -> None:
        """Initialize RefreshResult.

        Args:
            access_token: New JWT access token
            refresh_token: New JWT refresh token
            user: User entity
        """
        self.access_token = access_token
        self.refresh_token = refresh_token
        self.user = user


class AuthRefreshUseCase:
    """Use case for refreshing access and refresh tokens."""

    def __init__(
        self,
        user_repository: UserRepository,
        jwt_service: JWTService,
        session_repository: SessionRepository,
    ) -> None:
        """Initialize AuthRefreshUseCase.

        Args:
            user_repository: User repository implementation
            jwt_service: JWT service for token validation and creation
            session_repository: Session repository implementation
        """
        self._user_repository = user_repository
        self._jwt_service = jwt_service
        self._session_repository = session_repository

    async def execute(
        self, refresh_token: str, ip_address: str, user_agent: str
    ) -> RefreshResult:
        """Execute the refresh token use case.

        Args:
            refresh_token: JWT refresh token
            ip_address: Client IP address
            user_agent: Client User-Agent header

        Returns:
            RefreshResult with new access token, refresh token, and user

        Raises:
            TokenInvalidError: If refresh token is invalid or session mismatch
            TokenExpiredError: If refresh token has expired
        """
        # Verify refresh token
        try:
            payload = self._jwt_service.verify_refresh_token(refresh_token)
        except (TokenInvalidError, TokenExpiredError):
            raise

        # Get user ID and session ID from token
        user_id = payload.get("sub")
        session_id = payload.get("session_id")

        if not user_id:
            raise TokenInvalidError("Token missing user ID")
        if not session_id:
            raise TokenInvalidError("Token missing session ID")

        # Get user
        user = await self._user_repository.get_by_id(user_id)
        if user is None:
            raise TokenInvalidError("User not found")

        # Check if user is active
        if not user.is_active:
            raise TokenInvalidError("User account is inactive")

        # Get session
        session = await self._session_repository.get_by_id(session_id)
        if session is None:
            raise TokenInvalidError("Session not found or expired")

        # Validate session matches user, IP, and User-Agent
        if session.user_id != user_id:
            raise TokenInvalidError("Session user mismatch")
        if session.ip_address != ip_address:
            raise TokenInvalidError("Session IP address mismatch")
        if session.user_agent != user_agent:
            raise TokenInvalidError("Session User-Agent mismatch")

        # Check if session is expired
        if session.expires_at < datetime.now(timezone.utc):
            await self._session_repository.delete(session_id)
            raise TokenInvalidError("Session expired")

        # Rotate session ID on every refresh to make refresh tokens single-use.
        # Old refresh token contains the old session_id and will stop working after rotation.
        session.expires_at = datetime.now(timezone.utc) + timedelta(
            seconds=settings.session_expire_seconds
        )
        rotated_session = await self._session_repository.rotate(session)

        # Create new tokens with rotated session_id
        token_data = {
            "sub": user.id,
            "is_admin": user.is_admin,
            "session_id": rotated_session.id,
        }
        access_token = self._jwt_service.create_access_token(data=token_data)
        new_refresh_token = self._jwt_service.create_refresh_token(data=token_data)

        return RefreshResult(
            access_token=access_token, refresh_token=new_refresh_token, user=user
        )

