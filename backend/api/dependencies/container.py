"""Dependency injection container for API dependencies."""

from typing import Annotated, Optional

import redis.asyncio as redis
from fastapi import Depends

from backend.application.repositories.session_repository import SessionRepository
from backend.application.repositories.user_repository import UserRepository
from backend.application.use_cases.auth_login import AuthLoginUseCase
from backend.application.use_cases.auth_refresh import AuthRefreshUseCase
from backend.application.use_cases.auth_verify import AuthVerifyUseCase
from backend.application.use_cases.pet_create import PetCreateUseCase
from backend.application.use_cases.pet_delete import PetDeleteUseCase
from backend.application.use_cases.pet_detail import PetDetailUseCase
from backend.application.use_cases.pet_list import PetListUseCase
from backend.application.use_cases.pet_update import PetUpdateUseCase
from backend.infrastructure.database.redis_connection import init_redis
from backend.infrastructure.repositories.pet_repository_impl import PetRepositoryImpl
from backend.infrastructure.repositories.session_repository_impl import RedisSessionRepository
from backend.infrastructure.repositories.user_repository_impl import UserRepositoryImpl
from backend.infrastructure.services.jwt_service import JWTService
from backend.infrastructure.services.password_service import PasswordService


# Service instances (singletons)
_jwt_service = JWTService()
_password_service = PasswordService()
_user_repository: UserRepository = UserRepositoryImpl()
_pet_repository = PetRepositoryImpl()
_redis_client: Optional[redis.Redis] = None
_session_repository: Optional[SessionRepository] = None


async def get_redis_client() -> redis.Redis:
    """Get Redis client instance (singleton)."""
    global _redis_client
    if _redis_client is None:
        _redis_client = await init_redis()
    return _redis_client


async def get_session_repository(
    redis_client: Annotated[redis.Redis, Depends(get_redis_client)],
) -> SessionRepository:
    """Get session repository instance."""
    global _session_repository
    if _session_repository is None:
        _session_repository = RedisSessionRepository(redis_client)
    return _session_repository


def get_user_repository() -> UserRepository:
    """Get user repository instance."""
    return _user_repository


def get_jwt_service() -> JWTService:
    """Get JWT service instance."""
    return _jwt_service


def get_password_service() -> PasswordService:
    """Get password service instance."""
    return _password_service


def get_pet_repository() -> PetRepositoryImpl:
    """Get pet repository instance."""
    return _pet_repository


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
    session_repository: Annotated[SessionRepository, Depends(get_session_repository)],
) -> AuthLoginUseCase:
    """Get auth login use case instance."""
    return AuthLoginUseCase(
        user_repository, password_service, jwt_service, session_repository
    )


def get_auth_refresh_use_case(
    user_repository: Annotated[UserRepository, Depends(get_user_repository)],
    jwt_service: Annotated[JWTService, Depends(get_jwt_service)],
    session_repository: Annotated[SessionRepository, Depends(get_session_repository)],
) -> AuthRefreshUseCase:
    """Get auth refresh use case instance."""
    return AuthRefreshUseCase(user_repository, jwt_service, session_repository)


def get_pet_list_use_case() -> PetListUseCase:
    """Get pet list use case instance."""
    return PetListUseCase(_pet_repository)


def get_pet_detail_use_case() -> PetDetailUseCase:
    """Get pet detail use case instance."""
    return PetDetailUseCase(_pet_repository)


def get_pet_create_use_case() -> PetCreateUseCase:
    """Get pet create use case instance."""
    return PetCreateUseCase(_pet_repository)


def get_pet_update_use_case() -> PetUpdateUseCase:
    """Get pet update use case instance."""
    return PetUpdateUseCase(_pet_repository)


def get_pet_delete_use_case() -> PetDeleteUseCase:
    """Get pet delete use case instance."""
    return PetDeleteUseCase(_pet_repository)


