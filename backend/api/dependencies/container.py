"""Dependency injection container for API dependencies."""

from typing import Annotated

from fastapi import Depends

from backend.application.repositories.user_repository import UserRepository
from backend.application.use_cases.auth_login import AuthLoginUseCase
from backend.application.use_cases.auth_refresh import AuthRefreshUseCase
from backend.application.use_cases.auth_verify import AuthVerifyUseCase
from backend.infrastructure.repositories.user_repository_impl import UserRepositoryImpl
from backend.infrastructure.services.jwt_service import JWTService
from backend.infrastructure.services.password_service import PasswordService


# Service instances (singletons)
_jwt_service = JWTService()
_password_service = PasswordService()
_user_repository: UserRepository = UserRepositoryImpl()


def get_user_repository() -> UserRepository:
    """Get user repository instance."""
    return _user_repository


def get_jwt_service() -> JWTService:
    """Get JWT service instance."""
    return _jwt_service


def get_password_service() -> PasswordService:
    """Get password service instance."""
    return _password_service


def get_auth_verify_use_case(
    user_repository: Annotated[UserRepository, Depends(get_user_repository)],
    jwt_service: Annotated[JWTService, Depends(get_jwt_service)],
) -> AuthVerifyUseCase:
    """Get auth verify use case instance."""
    return AuthVerifyUseCase(user_repository, jwt_service)


def get_auth_login_use_case(
    user_repository: Annotated[UserRepository, Depends(get_user_repository)],
    password_service: Annotated[PasswordService, Depends(get_password_service)],
    jwt_service: Annotated[JWTService, Depends(get_jwt_service)],
) -> AuthLoginUseCase:
    """Get auth login use case instance."""
    return AuthLoginUseCase(user_repository, password_service, jwt_service)


def get_auth_refresh_use_case(
    user_repository: Annotated[UserRepository, Depends(get_user_repository)],
    jwt_service: Annotated[JWTService, Depends(get_jwt_service)],
) -> AuthRefreshUseCase:
    """Get auth refresh use case instance."""
    return AuthRefreshUseCase(user_repository, jwt_service)

