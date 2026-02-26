"""Use case for user login."""

from datetime import datetime, timedelta, timezone

from backend.application.repositories.session_repository import SessionRepository
from backend.application.repositories.user_repository import UserRepository
from backend.config import settings
from backend.domain.entities.session import Session
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
        session_repository: SessionRepository,
    ) -> None:
        """Initialize AuthLoginUseCase.

        Args:
            user_repository: User repository implementation
            password_service: Password service for verification
            jwt_service: JWT service for token creation
            session_repository: Session repository implementation
        """
        self._user_repository = user_repository
        self._password_service = password_service
        self._jwt_service = jwt_service
        self._session_repository = session_repository

    async def execute(
        self, email: str, password: str, ip_address: str, user_agent: str
    ) -> LoginResult:
        """Execute the login use case.

        Args:
            email: User email address
            password: User password
            ip_address: Client IP address
            user_agent: Client User-Agent header

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

        # Get or create session
        existing_session = await self._session_repository.get_by_user_ip_user_agent(
            user.id, ip_address, user_agent
        )

        if existing_session:
            # Update existing session
            existing_session.expires_at = datetime.now(timezone.utc) + timedelta(
                seconds=settings.session_expire_seconds
            )
            session = await self._session_repository.update(existing_session)
        else:
            # Create new session
            session = Session(
                user_id=user.id,
                ip_address=ip_address,
                user_agent=user_agent,
                expires_at=datetime.now(timezone.utc)
                + timedelta(seconds=settings.session_expire_seconds),
            )
            session = await self._session_repository.create(session)

        # Create tokens with session_id
        token_data = {
            "sub": user.id,
            "is_admin": user.is_admin,
            "session_id": session.id,
        }
        access_token = self._jwt_service.create_access_token(data=token_data)
        refresh_token = self._jwt_service.create_refresh_token(data=token_data)

        return LoginResult(
            access_token=access_token, refresh_token=refresh_token, user=user
        )

