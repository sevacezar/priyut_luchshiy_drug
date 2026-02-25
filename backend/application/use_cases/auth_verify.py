"""Use case for verifying access token and getting current user."""

from typing import Optional

from backend.application.repositories.user_repository import UserRepository
from backend.domain.entities.user import User
from backend.domain.exceptions.auth_exceptions import (
    TokenExpiredError,
    TokenInvalidError,
)
from backend.infrastructure.services.jwt_service import JWTService


class AuthVerifyUseCase:
    """Use case for verifying access token and getting current user."""

    def __init__(
        self, user_repository: UserRepository, jwt_service: JWTService
    ) -> None:
        """Initialize AuthVerifyUseCase.

        Args:
            user_repository: User repository implementation
            jwt_service: JWT service for token validation
        """
        self._user_repository = user_repository
        self._jwt_service = jwt_service

    async def execute(self, token: str) -> Optional[User]:
        """Execute the verify token use case.

        Args:
            token: JWT access token

        Returns:
            User entity if token is valid, None otherwise

        Raises:
            TokenInvalidError: If token is invalid
            TokenExpiredError: If token has expired
        """
        try:
            payload = self._jwt_service.decode_token(token)
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

        return user

