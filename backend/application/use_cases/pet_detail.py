"""Use case for getting pet details."""

from typing import Optional

from backend.application.repositories.pet_repository import PetRepository
from backend.domain.entities.pet import Pet


class PetDetailUseCase:
    """Use case for getting pet details by ID."""

    def __init__(self, pet_repository: PetRepository) -> None:
        """Initialize PetDetailUseCase.

        Args:
            pet_repository: Pet repository implementation
        """
        self._pet_repository = pet_repository

    async def execute(self, pet_id: str) -> Optional[Pet]:
        """Execute the get pet detail use case.

        Args:
            pet_id: Pet identifier

        Returns:
            Pet entity if found, None otherwise
        """
        if not pet_id:
            raise ValueError("pet_id is required")

        return await self._pet_repository.get_by_id(pet_id=pet_id)


