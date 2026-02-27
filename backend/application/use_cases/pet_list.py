"""Use case for listing pets with filters and pagination."""

from typing import Optional

from backend.application.repositories.pet_repository import PetFilters, PetRepository
from backend.domain.entities.pet import Pet


class PetListResult:
    """Result of pet list query with pagination."""

    pets: list[Pet]
    total_count: int
    skip: int
    limit: int

    def __init__(
        self, pets: list[Pet], total_count: int, skip: int, limit: int
    ) -> None:
        """Initialize PetListResult.

        Args:
            pets: List of pet entities
            total_count: Total count of pets matching filters
            skip: Number of records skipped
            limit: Maximum number of records returned
        """
        self.pets = pets
        self.total_count = total_count
        self.skip = skip
        self.limit = limit


class PetListUseCase:
    """Use case for listing pets with filters and pagination."""

    def __init__(self, pet_repository: PetRepository) -> None:
        """Initialize PetListUseCase.

        Args:
            pet_repository: Pet repository implementation
        """
        self._pet_repository = pet_repository

    async def execute(
        self,
        skip: int = 0,
        limit: int = 10,
        filters: Optional[PetFilters] = None,
    ) -> PetListResult:
        """Execute the list pets use case.

        Args:
            skip: Number of records to skip (for pagination)
            limit: Maximum number of records to return
            filters: Optional filters to apply

        Returns:
            PetListResult containing pets, total count, and pagination info

        Raises:
            ValueError: If skip or limit are invalid
        """
        if skip < 0:
            raise ValueError("skip must be non-negative")
        if limit <= 0:
            raise ValueError("limit must be positive")
        if limit > 100:
            raise ValueError("limit cannot exceed 100")

        pets = await self._pet_repository.get_list(skip=skip, limit=limit, filters=filters)
        total_count = await self._pet_repository.get_count(filters=filters)

        return PetListResult(
            pets=pets, total_count=total_count, skip=skip, limit=limit
        )


