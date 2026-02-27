"""FastAPI application setup with Clean Architecture."""

from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.api.dependencies.container import get_redis_client
from backend.api.middleware.exception_handler import (
    auth_exception_handler,
    authorization_exception_handler,
)
from backend.config import settings
from backend.domain.exceptions.auth_exceptions import (
    AuthenticationError,
    AuthorizationError,
)
from backend.infrastructure.database.connection import init_database
from backend.logger import get_logger

logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Lifespan context manager for startup and shutdown events.

    Args:
        app: FastAPI application instance

    Yields:
        None (control is yielded to the application)
    """
    # Startup
    try:
        logger.info("Initializing database connection...")
        await init_database()
        logger.info("Database connection initialized successfully")

        logger.info("Initializing Redis connection...")
        # Initialize Redis client via container (singleton pattern)
        await get_redis_client()
        logger.info("Redis connection initialized successfully")
    except Exception as e:
        logger.error(
            "Failed to initialize database connections",
            error=str(e),
            exc_info=True,
        )
        raise

    yield

    # Shutdown
    logger.info("Shutting down application...")


def create_app() -> FastAPI:
    """Create and configure FastAPI application.

    Returns:
        Configured FastAPI application instance
    """
    app = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        debug=settings.debug,
        lifespan=lifespan,
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
    from backend.api.routes import auth_router

    app.include_router(auth_router, prefix="/api")

    @app.get("/health")
    async def health_check():
        """Health check endpoint."""
        return {"status": "ok"}

    return app


# Create app instance for uvicorn
app = create_app()

