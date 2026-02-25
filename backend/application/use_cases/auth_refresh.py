"""Use case for refreshing access token."""

from backend.application.repositories.user_repository import UserRepository
from backend.domain.entities.user import User
from backend.domain.exceptions.auth_exceptions import (
    TokenExpiredError,
    TokenInvalidError,
)
from backend.infrastructure.services.jwt_service import JWTService


class RefreshResult:
    """Result of token refresh operation."""

    access_token: str
    user: User

    def __init__(self, access_token: str, user: User) -> None:
        """Initialize RefreshResult.

        Args:
            access_token: New JWT access token
            user: User entity
        """
        self.access_token = access_token
        self.user = user


class AuthRefreshUseCase:
    """Use case for refreshing access token."""

    def __init__(
        self, user_repository: UserRepository, jwt_service: JWTService
    ) -> None:
        """Initialize AuthRefreshUseCase.

        Args:
            user_repository: User repository implementation
            jwt_service: JWT service for token validation and creation
        """
        self._user_repository = user_repository
        self._jwt_service = jwt_service

    async def execute(self, refresh_token: str) -> RefreshResult:
        """Execute the refresh token use case.

        Args:
            refresh_token: JWT refresh token

        Returns:
            RefreshResult with new access token and user

        Raises:
            TokenInvalidError: If refresh token is invalid
            TokenExpiredError: If refresh token has expired
        """
        # Verify refresh token
        try:
            payload = self._jwt_service.verify_refresh_token(refresh_token)
        except (TokenInvalidError, TokenExpiredError):
            raise

        # Get user ID from token
        user_id = payload.get("sub")
        if not user_id:
            raise TokenInvalidError("Token missing user ID")

        # Get user
        user = await self._user_repository.get_by_id(user_id)
        if user is None:
            raise TokenInvalidError("User not found")

        # Check if user is active
        if not user.is_active:
            raise TokenInvalidError("User account is inactive")

        # Create new access token
        token_data = {"sub": user.id, "is_admin": user.is_admin}
        access_token = self._jwt_service.create_access_token(data=token_data)

        return RefreshResult(access_token=access_token, user=user)

