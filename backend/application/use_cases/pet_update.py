"""Use case for updating a pet."""

from backend.application.repositories.pet_repository import PetRepository
from backend.domain.entities.pet import Pet


class PetUpdateUseCase:
    """Use case for updating a pet."""

    def __init__(self, pet_repository: PetRepository) -> None:
        """Initialize PetUpdateUseCase.

        Args:
            pet_repository: Pet repository implementation
        """
        self._pet_repository = pet_repository

    async def execute(self, pet: Pet) -> Pet:
        """Execute the update pet use case.

        Args:
            pet: Pet entity with ID to update

        Returns:
            Updated pet entity

        Raises:
            ValueError: If pet ID is missing or pet not found
        """
        if not pet.id:
            raise ValueError("Pet ID is required for update")

        # Verify pet exists
        existing_pet = await self._pet_repository.get_by_id(pet.id)
        if existing_pet is None:
            raise ValueError(f"Pet with ID {pet.id} not found")

        # Update the pet
        updated_pet = await self._pet_repository.update(pet)

        return updated_pet
