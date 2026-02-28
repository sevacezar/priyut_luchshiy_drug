"""API routes."""

from backend.api.routes.auth import router as auth_router
from backend.api.routes.pets import router as pets_router
from backend.api.routes.uploads import router as uploads_router

__all__ = ["auth_router", "pets_router", "uploads_router"]

