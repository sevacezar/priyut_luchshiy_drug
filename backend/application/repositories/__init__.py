"""Repository interfaces (abstractions)."""

from backend.application.repositories.pet_repository import (
    PetFilters,
    PetRepository,
)

__all__ = ["PetRepository", "PetFilters"]
