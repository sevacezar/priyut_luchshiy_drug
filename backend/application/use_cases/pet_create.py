"""Use case for creating a new pet."""

from backend.application.repositories.pet_repository import PetRepository
from backend.domain.entities.pet import Pet


class PetCreateUseCase:
    """Use case for creating a new pet."""

    def __init__(self, pet_repository: PetRepository) -> None:
        """Initialize PetCreateUseCase.

        Args:
            pet_repository: Pet repository implementation
        """
        self._pet_repository = pet_repository

    async def execute(self, pet: Pet) -> Pet:
        """Execute the create pet use case.

        Args:
            pet: Pet entity to create (without ID)

        Returns:
            Created pet entity with ID set
        """
        # ID must not be set on creation; repository is responsible for assigning it
        pet.id = None
        created_pet = await self._pet_repository.create(pet)
        return created_pet



