"""Exception handler middleware for mapping domain exceptions to HTTP responses."""

from fastapi import Request, status
from fastapi.responses import JSONResponse

from backend.domain.exceptions.auth_exceptions import (
    AuthenticationError,
    AuthorizationError,
    InvalidCredentialsError,
    TokenExpiredError,
    TokenInvalidError,
)


async def auth_exception_handler(request: Request, exc: AuthenticationError) -> JSONResponse:
    """Handle authentication exceptions.

    Maps domain authentication exceptions to appropriate HTTP responses.

    Args:
        request: FastAPI request object
        exc: Authentication exception

    Returns:
        JSONResponse with appropriate status code and error message
    """
    if isinstance(exc, TokenExpiredError):
        return JSONResponse(
            status_code=status.HTTP_401_UNAUTHORIZED,
            content={"detail": "Token has expired"},
            headers={"WWW-Authenticate": "Bearer"},
        )
    if isinstance(exc, TokenInvalidError):
        return JSONResponse(
            status_code=status.HTTP_401_UNAUTHORIZED,
            content={"detail": "Could not validate credentials"},
            headers={"WWW-Authenticate": "Bearer"},
        )
    if isinstance(exc, InvalidCredentialsError):
        return JSONResponse(
            status_code=status.HTTP_401_UNAUTHORIZED,
            content={"detail": str(exc) or "Invalid credentials"},
            headers={"WWW-Authenticate": "Bearer"},
        )
    # Generic authentication error
    return JSONResponse(
        status_code=status.HTTP_401_UNAUTHORIZED,
        content={"detail": "Authentication required"},
        headers={"WWW-Authenticate": "Bearer"},
    )


async def authorization_exception_handler(
    request: Request, exc: AuthorizationError
) -> JSONResponse:
    """Handle authorization exceptions.

    Maps domain authorization exceptions to appropriate HTTP responses.

    Args:
        request: FastAPI request object
        exc: Authorization exception

    Returns:
        JSONResponse with 403 status code
    """
    return JSONResponse(
        status_code=status.HTTP_403_FORBIDDEN,
        content={"detail": str(exc) or "Not enough permissions"},
    )

