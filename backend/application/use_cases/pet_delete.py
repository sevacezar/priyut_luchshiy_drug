"""Use case for deleting a pet."""

from backend.application.repositories.pet_repository import PetRepository


class PetDeleteUseCase:
    """Use case for deleting a pet."""

    def __init__(self, pet_repository: PetRepository) -> None:
        """Initialize PetDeleteUseCase.

        Args:
            pet_repository: Pet repository implementation
        """
        self._pet_repository = pet_repository

    async def execute(self, pet_id: str) -> bool:
        """Execute the delete pet use case.

        Args:
            pet_id: Pet identifier

        Returns:
            True if deleted successfully, False if pet not found

        Raises:
            ValueError: If pet_id is empty
        """
        if not pet_id:
            raise ValueError("pet_id is required")

        # Verify pet exists before deletion
        existing_pet = await self._pet_repository.get_by_id(pet_id)
        if existing_pet is None:
            return False

        # Delete the pet
        deleted = await self._pet_repository.delete(pet_id)

        return deleted


