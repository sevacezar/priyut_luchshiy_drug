"""Example auth routes showing Clean Architecture pattern.

This file demonstrates how to use use cases and dependencies in routes.
"""

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, EmailStr

from backend.api.dependencies.auth import get_admin_user, get_current_user
from backend.api.dependencies.container import (
    get_auth_login_use_case,
    get_auth_refresh_use_case,
)
from backend.api.dependencies.request_info import get_client_ip, get_user_agent
from backend.application.repositories.pet_repository import PetFilters, PetRepository
from backend.application.use_cases.auth_login import AuthLoginUseCase
from backend.application.use_cases.auth_refresh import AuthRefreshUseCase
from backend.domain.entities.user import User
from backend.domain.exceptions.auth_exceptions import InvalidCredentialsError

router = APIRouter()
security = HTTPBearer()


# Request/Response schemas (DTOs)
class LoginRequest(BaseModel):
    """Login request schema."""

    email: EmailStr
    password: str


class LoginResponse(BaseModel):
    """Login response schema."""

    access_token: str
    refresh_token: str
    user: dict  # User data (without password_hash)


class RefreshRequest(BaseModel):
    """Refresh token request schema."""

    refresh_token: str


class RefreshResponse(BaseModel):
    """Refresh token response schema."""

    access_token: str
    refresh_token: str


@router.post("/login", response_model=LoginResponse)
async def login(
    request: LoginRequest,
    http_request: Request,
    login_use_case: AuthLoginUseCase = Depends(get_auth_login_use_case),
    ip_address: str = Depends(get_client_ip),
    user_agent: str = Depends(get_user_agent),
):
    """Login endpoint.

    This endpoint:
    1. Takes email and password
    2. Uses AuthLoginUseCase (business logic)
    3. Returns tokens and user data

    Domain exceptions are automatically converted to HTTP errors
    via the exception handler middleware.
    """
    try:
        result = await login_use_case.execute(
            request.email, request.password, ip_address, user_agent
        )
        return LoginResponse(
            access_token=result.access_token,
            refresh_token=result.refresh_token,
            user={
                "id": result.user.id,
                "email": result.user.email,
                "name": result.user.name,
                "is_admin": result.user.is_admin,
                "is_active": result.user.is_active,
            },
        )
    except InvalidCredentialsError as e:
        # This will be caught by exception handler, but you can also handle it explicitly
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
        )


@router.post("/refresh", response_model=RefreshResponse)
async def refresh(
    request: RefreshRequest,
    http_request: Request,
    refresh_use_case: AuthRefreshUseCase = Depends(get_auth_refresh_use_case),
    ip_address: str = Depends(get_client_ip),
    user_agent: str = Depends(get_user_agent),
):
    """Refresh tokens endpoint.

    Uses AuthRefreshUseCase to validate refresh token and issue new access and refresh tokens.
    Validates session matches IP address and User-Agent.
    """
    result = await refresh_use_case.execute(request.refresh_token, ip_address, user_agent)
    return RefreshResponse(
        access_token=result.access_token, refresh_token=result.refresh_token
    )


@router.get("/me")
async def get_current_user_info(
    current_user: User = Depends(get_current_user),
):
    """Get current user information.

    This endpoint demonstrates:
    1. Using get_current_user dependency (handles authentication)
    2. Domain exceptions are automatically converted to HTTP 401
    3. Returns user entity from domain layer
    """
    return {
        "id": current_user.id,
        "email": current_user.email,
        "name": current_user.name,
        "is_admin": current_user.is_admin,
        "is_active": current_user.is_active,
    }


@router.get("/admin-only")
async def admin_only_endpoint(
    admin_user: User = Depends(get_admin_user),
):
    """Admin-only endpoint example.

    This endpoint demonstrates:
    1. Using get_admin_user dependency (requires admin role)
    2. Automatically returns 403 if user is not admin
    3. Uses domain User entity
    """
    return {
        "message": "This is an admin-only endpoint",
        "user": {
            "id": admin_user.id,
            "email": admin_user.email,
            "name": admin_user.name,
        },
    }


