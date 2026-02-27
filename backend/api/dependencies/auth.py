"""Authentication dependencies for FastAPI."""

from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from backend.api.dependencies.container import get_auth_verify_use_case
from backend.application.use_cases.auth_verify import AuthVerifyUseCase
from backend.domain.entities.user import User
from backend.domain.exceptions.auth_exceptions import (
    AuthorizationError,
    TokenExpiredError,
    TokenInvalidError,
)

security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    verify_use_case: AuthVerifyUseCase = Depends(get_auth_verify_use_case),
) -> User:
    """FastAPI dependency to get current authenticated user.

    This dependency:
    1. Extracts the Bearer token from the Authorization header
    2. Uses AuthVerifyUseCase to validate the token and get the user
    3. Maps domain exceptions to HTTP exceptions

    Args:
        credentials: HTTP Bearer token credentials
        verify_use_case: Auth verify use case (injected via DI)

    Returns:
        Current authenticated user

    Raises:
        HTTPException: 401 if authentication fails
    """
    token = credentials.credentials

    try:
        user = await verify_use_case.execute(token)
        if user is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return user
    except TokenExpiredError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except TokenInvalidError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_optional_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(
        HTTPBearer(auto_error=False)
    ),
    verify_use_case: AuthVerifyUseCase = Depends(get_auth_verify_use_case),
) -> Optional[User]:
    """FastAPI dependency to get current user (optional, no error if missing).

    This dependency is useful for endpoints that work both for authenticated
    and unauthenticated users (e.g., public content with optional personalization).

    Args:
        credentials: HTTP Bearer token credentials (optional)
        verify_use_case: Auth verify use case (injected via DI)

    Returns:
        Current authenticated user if token is valid, None otherwise
    """
    if not credentials:
        return None

    token = credentials.credentials

    try:
        return await verify_use_case.execute(token)
    except (TokenExpiredError, TokenInvalidError):
        return None


async def get_admin_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """FastAPI dependency to get current admin user.

    This dependency:
    1. Requires authentication (uses get_current_user)
    2. Checks if user has admin privileges
    3. Returns 403 if user is not an admin

    Args:
        current_user: Current authenticated user (from get_current_user)

    Returns:
        Current authenticated admin user

    Raises:
        HTTPException: 403 if user is not an admin
    """
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions",
        )
    return current_user

