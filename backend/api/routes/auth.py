"""Authentication routes."""

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, EmailStr, Field

from backend.api.dependencies.container import (
    get_auth_login_use_case,
    get_auth_refresh_use_case,
)
from backend.api.dependencies.request_info import get_client_ip, get_user_agent
from backend.application.use_cases.auth_login import AuthLoginUseCase
from backend.application.use_cases.auth_refresh import AuthRefreshUseCase
from backend.domain.entities.user import User
from backend.domain.exceptions.auth_exceptions import (
    InvalidCredentialsError,
    TokenExpiredError,
    TokenInvalidError,
)
from backend.logger import get_logger

logger = get_logger(__name__)

router = APIRouter(prefix="/auth", tags=["authentication"])


# Request/Response schemas
class LoginRequest(BaseModel):
    """Login request schema."""

    email: EmailStr = Field(..., description="User email address")
    password: str = Field(..., min_length=1, description="User password")


class LoginResponse(BaseModel):
    """Login response schema."""

    access_token: str = Field(..., description="JWT access token")
    refresh_token: str = Field(..., description="JWT refresh token")
    user: dict = Field(..., description="User information (without sensitive data)")


class RefreshRequest(BaseModel):
    """Refresh token request schema."""

    refresh_token: str = Field(..., min_length=1, description="JWT refresh token")


class RefreshResponse(BaseModel):
    """Refresh token response schema."""

    access_token: str = Field(..., description="New JWT access token")
    refresh_token: str = Field(..., description="New JWT refresh token")


class ErrorResponse(BaseModel):
    """Error response schema."""

    detail: str = Field(..., description="Error message")


@router.post(
    "/login",
    response_model=LoginResponse,
    status_code=status.HTTP_200_OK,
    responses={
        400: {"model": ErrorResponse, "description": "Invalid request data"},
        401: {"model": ErrorResponse, "description": "Invalid credentials"},
        500: {"model": ErrorResponse, "description": "Internal server error"},
    },
)
async def login(
    request: LoginRequest,
    http_request: Request,
    login_use_case: AuthLoginUseCase = Depends(get_auth_login_use_case),
    ip_address: str = Depends(get_client_ip),
    user_agent: str = Depends(get_user_agent),
) -> LoginResponse:
    """Login endpoint.

    Authenticates a user with email and password, creates or updates a session,
    and returns access and refresh tokens.

    Args:
        request: Login request with email and password
        http_request: FastAPI request object
        login_use_case: Auth login use case (injected)
        ip_address: Client IP address (extracted from request)
        user_agent: Client User-Agent header (extracted from request)

    Returns:
        LoginResponse with tokens and user information

    Raises:
        HTTPException: 400 if request validation fails
        HTTPException: 401 if credentials are invalid
        HTTPException: 500 if internal error occurs
    """
    try:
        logger.info(
            "Login attempt",
            email=request.email,
            ip_address=ip_address,
            user_agent=user_agent,
        )

        # Validate request
        if not request.email or not request.password:
            logger.warning(
                "Login attempt with missing credentials",
                email=request.email,
                ip_address=ip_address,
            )
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email and password are required",
            )

        # Execute login use case
        result = await login_use_case.execute(
            request.email, request.password, ip_address, user_agent
        )

        logger.info(
            "Login successful",
            user_id=result.user.id,
            email=result.user.email,
            is_admin=result.user.is_admin,
            ip_address=ip_address,
        )

        # Return response
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
        # Invalid credentials - return 401
        logger.warning(
            "Login failed: invalid credentials",
            email=request.email,
            ip_address=ip_address,
            error=str(e),
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e) or "Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except ValueError as e:
        # Validation errors - return 400
        logger.warning(
            "Login failed: validation error",
            email=request.email,
            ip_address=ip_address,
            error=str(e),
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception as e:
        # Unexpected errors - return 500
        logger.error(
            "Login failed: unexpected error",
            email=request.email,
            ip_address=ip_address,
            error=str(e),
            exc_info=True,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred during login",
        ) from e


@router.post(
    "/refresh",
    response_model=RefreshResponse,
    status_code=status.HTTP_200_OK,
    responses={
        400: {"model": ErrorResponse, "description": "Invalid request data"},
        401: {"model": ErrorResponse, "description": "Invalid or expired token"},
        500: {"model": ErrorResponse, "description": "Internal server error"},
    },
)
async def refresh(
    request: RefreshRequest,
    http_request: Request,
    refresh_use_case: AuthRefreshUseCase = Depends(get_auth_refresh_use_case),
    ip_address: str = Depends(get_client_ip),
    user_agent: str = Depends(get_user_agent),
) -> RefreshResponse:
    """Refresh tokens endpoint.

    Validates a refresh token, checks session matches IP and User-Agent,
    updates session expiration, and returns new access and refresh tokens.

    Args:
        request: Refresh request with refresh token
        http_request: FastAPI request object
        refresh_use_case: Auth refresh use case (injected)
        ip_address: Client IP address (extracted from request)
        user_agent: Client User-Agent header (extracted from request)

    Returns:
        RefreshResponse with new access and refresh tokens

    Raises:
        HTTPException: 400 if request validation fails
        HTTPException: 401 if token is invalid, expired, or session mismatch
        HTTPException: 500 if internal error occurs
    """
    try:
        logger.info(
            "Token refresh attempt",
            ip_address=ip_address,
            user_agent=user_agent,
        )

        # Validate request
        if not request.refresh_token:
            logger.warning(
                "Token refresh failed: missing refresh token",
                ip_address=ip_address,
            )
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Refresh token is required",
            )

        # Execute refresh use case
        result = await refresh_use_case.execute(
            request.refresh_token, ip_address, user_agent
        )

        logger.info(
            "Token refresh successful",
            ip_address=ip_address,
            user_agent=user_agent,
        )

        # Return response
        return RefreshResponse(
            access_token=result.access_token,
            refresh_token=result.refresh_token,
        )

    except TokenExpiredError as e:
        # Token expired - return 401
        logger.warning(
            "Token refresh failed: token expired",
            ip_address=ip_address,
            user_agent=user_agent,
            error=str(e),
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e) or "Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except TokenInvalidError as e:
        # Invalid token or session mismatch - return 401
        logger.warning(
            "Token refresh failed: invalid token or session mismatch",
            ip_address=ip_address,
            user_agent=user_agent,
            error=str(e),
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e) or "Invalid token or session mismatch",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except ValueError as e:
        # Validation errors - return 400
        logger.warning(
            "Token refresh failed: validation error",
            ip_address=ip_address,
            user_agent=user_agent,
            error=str(e),
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception as e:
        # Unexpected errors - return 500
        logger.error(
            "Token refresh failed: unexpected error",
            ip_address=ip_address,
            user_agent=user_agent,
            error=str(e),
            exc_info=True,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred during token refresh",
        ) from e

