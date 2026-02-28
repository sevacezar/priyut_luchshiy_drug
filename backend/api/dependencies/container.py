"""Dependency injection container for API dependencies."""

from typing import Annotated, Optional

import redis.asyncio as redis
from fastapi import Depends

from backend.application.repositories.session_repository import SessionRepository
from backend.application.repositories.user_repository import UserRepository
from backend.application.services.file_storage import FileStorage
from backend.application.use_cases.auth_login import AuthLoginUseCase
from backend.application.use_cases.auth_refresh import AuthRefreshUseCase
from backend.application.use_cases.auth_verify import AuthVerifyUseCase
from backend.application.use_cases.pet_create import PetCreateUseCase
from backend.application.use_cases.pet_delete import PetDeleteUseCase
from backend.application.use_cases.pet_detail import PetDetailUseCase
from backend.application.use_cases.pet_list import PetListUseCase
from backend.application.use_cases.pet_update import PetUpdateUseCase
from backend.application.use_cases.delete_image import DeleteImageUseCase
from backend.application.use_cases.get_image import GetImageUseCase
from backend.application.use_cases.upload_image import UploadImageUseCase
from backend.infrastructure.database.redis_connection import init_redis
from backend.infrastructure.repositories.pet_repository_impl import PetRepositoryImpl
from backend.infrastructure.repositories.session_repository_impl import RedisSessionRepository
from backend.infrastructure.repositories.user_repository_impl import UserRepositoryImpl
from backend.infrastructure.services.jwt_service import JWTService
from backend.infrastructure.services.password_service import PasswordService
from backend.infrastructure.services.s3_file_storage import S3FileStorage


# Service instances (singletons)
_jwt_service = JWTService()
_password_service = PasswordService()
_user_repository: UserRepository = UserRepositoryImpl()
_pet_repository = PetRepositoryImpl()
_file_storage: Optional[FileStorage] = None
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


def get_file_storage() -> FileStorage:
    """Get file storage instance (S3/MinIO)."""
    global _file_storage
    if _file_storage is None:
        _file_storage = S3FileStorage()
    return _file_storage


def get_upload_image_use_case(
    storage: Annotated[FileStorage, Depends(get_file_storage)],
) -> UploadImageUseCase:
    """Get upload image use case instance."""
    return UploadImageUseCase(storage)


def get_get_image_use_case(
    storage: Annotated[FileStorage, Depends(get_file_storage)],
) -> GetImageUseCase:
    """Get get image use case instance."""
    return GetImageUseCase(storage)


def get_delete_image_use_case(
    storage: Annotated[FileStorage, Depends(get_file_storage)],
) -> DeleteImageUseCase:
    """Get delete image use case instance."""
    return DeleteImageUseCase(storage)


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


