"""Use case for user login."""

from backend.application.repositories.user_repository import UserRepository
from backend.domain.entities.user import User
from backend.domain.exceptions.auth_exceptions import InvalidCredentialsError
from backend.infrastructure.services.jwt_service import JWTService
from backend.infrastructure.services.password_service import PasswordService


class LoginResult:
    """Result of login operation."""

    access_token: str
    refresh_token: str
    user: User

    def __init__(self, access_token: str, refresh_token: str, user: User) -> None:
        """Initialize LoginResult.

        Args:
            access_token: JWT access token
            refresh_token: JWT refresh token
            user: Authenticated user entity
        """
        self.access_token = access_token
        self.refresh_token = refresh_token
        self.user = user


class AuthLoginUseCase:
    """Use case for user authentication/login."""

    def __init__(
        self,
        user_repository: UserRepository,
        password_service: PasswordService,
        jwt_service: JWTService,
    ) -> None:
        """Initialize AuthLoginUseCase.

        Args:
            user_repository: User repository implementation
            password_service: Password service for verification
            jwt_service: JWT service for token creation
        """
        self._user_repository = user_repository
        self._password_service = password_service
        self._jwt_service = jwt_service

    async def execute(self, email: str, password: str) -> LoginResult:
        """Execute the login use case.

        Args:
            email: User email address
            password: User password

        Returns:
            LoginResult with tokens and user

        Raises:
            InvalidCredentialsError: If credentials are invalid
        """
        # Find user by email
        user = await self._user_repository.get_by_email(email)
        if user is None:
            raise InvalidCredentialsError("Invalid email or password")

        # Check if user is active
        if not user.is_active:
            raise InvalidCredentialsError("User account is inactive")

        # Verify password
        if not self._password_service.verify_password(password, user.password_hash):
            raise InvalidCredentialsError("Invalid email or password")

        # Create tokens
        token_data = {"sub": user.id, "is_admin": user.is_admin}
        access_token = self._jwt_service.create_access_token(data=token_data)
        refresh_token = self._jwt_service.create_refresh_token(data=token_data)

        return LoginResult(
            access_token=access_token, refresh_token=refresh_token, user=user
        )

