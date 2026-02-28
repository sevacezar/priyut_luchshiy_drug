"""Pet repository interface (Protocol)."""

from typing import Optional, Protocol

from pydantic import BaseModel

from backend.domain.entities.pet import Pet
from backend.domain.enums.animal_type import AnimalType
from backend.domain.enums.gender import Gender
from backend.domain.enums.pet_group import PetGroup
from backend.domain.enums.pet_status import PetStatus


class PetFilters(BaseModel):
    """Filters for pet queries."""

    status: Optional[PetStatus] = None
    animal_type: Optional[AnimalType] = None
    gender: Optional[Gender] = None
    groups: Optional[list[PetGroup]] = None
    is_healthy: Optional[bool] = None
    is_vaccinated: Optional[bool] = None
    is_sterilized: Optional[bool] = None
    search_query: Optional[str] = None  # Search in name, appearance_text, etc.
    order_by: Optional[str] = None  # e.g. "created_at", "-created_at", "name", "-name"


class PetRepository(Protocol):
    """Repository interface for Pet entity operations."""

    async def create(self, pet: Pet) -> Pet:
        """Create a new pet.

        Args:
            pet: Pet entity to create (without ID)

        Returns:
            Created pet entity with ID set

        Raises:
            RepositoryError: If creation fails
        """
        ...

    async def get_by_id(self, pet_id: str) -> Optional[Pet]:
        """Get a pet by its ID.

        Args:
            pet_id: Pet identifier

        Returns:
            Pet entity if found, None otherwise
        """
        ...

    async def get_list(
        self,
        skip: int = 0,
        limit: int = 10,
        filters: Optional[PetFilters] = None,
    ) -> list[Pet]:
        """Get a list of pets with pagination and filters.

        Args:
            skip: Number of records to skip (for pagination)
            limit: Maximum number of records to return
            filters: Optional filters to apply

        Returns:
            List of pet entities
        """
        ...

    async def get_count(self, filters: Optional[PetFilters] = None) -> int:
        """Get total count of pets matching filters.

        Args:
            filters: Optional filters to apply

        Returns:
            Total count of pets matching the filters
        """
        ...

    async def update(self, pet: Pet) -> Pet:
        """Update an existing pet.

        Args:
            pet: Pet entity with ID to update

        Returns:
            Updated pet entity

        Raises:
            RepositoryError: If pet not found or update fails
        """
        ...

    async def delete(self, pet_id: str) -> bool:
        """Delete a pet by ID.

        Args:
            pet_id: Pet identifier

        Returns:
            True if deleted, False if not found

        Raises:
            RepositoryError: If deletion fails
        """
        ...

