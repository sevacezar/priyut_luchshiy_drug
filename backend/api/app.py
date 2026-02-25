"""FastAPI application setup with Clean Architecture."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.api.middleware.exception_handler import (
    auth_exception_handler,
    authorization_exception_handler,
)
from backend.config import settings
from backend.domain.exceptions.auth_exceptions import (
    AuthenticationError,
    AuthorizationError,
)
from backend.logger import get_logger

logger = get_logger(__name__)


def create_app() -> FastAPI:
    """Create and configure FastAPI application.

    Returns:
        Configured FastAPI application instance
    """
    app = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        debug=settings.debug,
    )

    # CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_allow_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Register exception handlers for domain exceptions
    # This maps domain exceptions to HTTP responses
    app.add_exception_handler(AuthenticationError, auth_exception_handler)
    app.add_exception_handler(AuthorizationError, authorization_exception_handler)

    # Include routers
    # from backend.api.routes import auth, pets
    # app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
    # app.include_router(pets.router, prefix="/api/pets", tags=["pets"])

    @app.get("/health")
    async def health_check():
        """Health check endpoint."""
        return {"status": "ok"}

    return app

