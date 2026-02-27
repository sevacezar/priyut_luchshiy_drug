"""Pet repository implementation using Beanie."""

from typing import Optional

from beanie import PydanticObjectId

from backend.application.repositories.pet_repository import PetFilters, PetRepository
from backend.domain.entities.pet import Pet
from backend.infrastructure.database.mappers.pet_mapper import PetMapper
from backend.infrastructure.database.models.pet_model import PetModel


class PetRepositoryImpl:
    """Beanie implementation of PetRepository."""

    async def create(self, pet: Pet) -> Pet:
        """Create a new pet.

        Args:
            pet: Pet entity to create (without ID)

        Returns:
            Created pet entity with ID set

        Raises:
            Exception: If creation fails
        """
        model = PetMapper.to_model(pet)
        created_model = await model.insert()
        return PetMapper.to_domain(created_model)

    async def get_by_id(self, pet_id: str) -> Optional[Pet]:
        """Get a pet by its ID.

        Args:
            pet_id: Pet identifier

        Returns:
            Pet entity if found, None otherwise
        """
        try:
            object_id = PydanticObjectId(pet_id)
        except Exception:
            return None

        model = await PetModel.get(object_id)
        if model is None:
            return None

        return PetMapper.to_domain(model)

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
        # Build query conditions
        query_conditions: dict = {}

        if filters:
            if filters.status:
                query_conditions["status"] = filters.status
            if filters.animal_type:
                query_conditions["animal_type"] = filters.animal_type
            if filters.gender:
                query_conditions["gender"] = filters.gender
            if filters.is_healthy is not None:
                query_conditions["is_healthy"] = filters.is_healthy
            if filters.is_vaccinated is not None:
                query_conditions["is_vaccinated"] = filters.is_vaccinated
            if filters.is_sterilized is not None:
                query_conditions["is_sterilized"] = filters.is_sterilized
            if filters.search_query:
                # Search in name, appearance_text, character_and_behavior_text
                query_conditions["$or"] = [
                    {"name": {"$regex": filters.search_query, "$options": "i"}},
                    {
                        "appearance_text": {
                            "$regex": filters.search_query,
                            "$options": "i",
                        }
                    },
                    {
                        "character_and_behavior_text": {
                            "$regex": filters.search_query,
                            "$options": "i",
                        }
                    },
                ]

        query = PetModel.find(query_conditions)

        # Apply ordering if requested
        if filters and filters.order_by:
            order_expr = filters.order_by  # e.g. "created_at" or "-created_at"
            order_field = order_expr[1:] if order_expr.startswith("-") else order_expr

            # Basic allowlist of sortable fields to avoid arbitrary field injection
            sortable_fields = {
                "name",
                "created_at",
                "updated_at",
                "birth_year",
                "admission_date",
                "status",
                "animal_type",
                "gender",
            }
            if order_field in sortable_fields:
                # Beanie supports string-based sort expressions with +/- prefixes
                # like .sort("-created_at", "+name")
                query = query.sort(order_expr)

        models = await query.skip(skip).limit(limit).to_list()
        return [PetMapper.to_domain(model) for model in models]

    async def get_count(self, filters: Optional[PetFilters] = None) -> int:
        """Get total count of pets matching filters.

        Args:
            filters: Optional filters to apply

        Returns:
            Total count of pets matching the filters
        """
        # Build query conditions
        query_conditions: dict = {}

        if filters:
            if filters.status:
                query_conditions["status"] = filters.status
            if filters.animal_type:
                query_conditions["animal_type"] = filters.animal_type
            if filters.gender:
                query_conditions["gender"] = filters.gender
            if filters.is_healthy is not None:
                query_conditions["is_healthy"] = filters.is_healthy
            if filters.is_vaccinated is not None:
                query_conditions["is_vaccinated"] = filters.is_vaccinated
            if filters.is_sterilized is not None:
                query_conditions["is_sterilized"] = filters.is_sterilized
            if filters.search_query:
                # Search in name, appearance_text, character_and_behavior_text
                query_conditions["$or"] = [
                    {"name": {"$regex": filters.search_query, "$options": "i"}},
                    {
                        "appearance_text": {
                            "$regex": filters.search_query,
                            "$options": "i",
                        }
                    },
                    {
                        "character_and_behavior_text": {
                            "$regex": filters.search_query,
                            "$options": "i",
                        }
                    },
                ]

        query = PetModel.find(query_conditions)
        return await query.count()

    async def update(self, pet: Pet) -> Pet:
        """Update an existing pet.

        Args:
            pet: Pet entity with ID to update

        Returns:
            Updated pet entity

        Raises:
            ValueError: If pet not found
        """
        if not pet.id:
            raise ValueError("Pet ID is required for update")

        try:
            object_id = PydanticObjectId(pet.id)
        except Exception as e:
            raise ValueError(f"Invalid pet ID: {pet.id}") from e

        existing_model = await PetModel.get(object_id)
        if existing_model is None:
            raise ValueError(f"Pet with ID {pet.id} not found")

        # Update timestamp
        existing_model.update_timestamp()

        # Update fields from the pet entity
        update_data = pet.model_dump(
            exclude={"id", "created_at"}, exclude_none=True
        )
        update_data["updated_at"] = existing_model.updated_at

        # Update the model
        for key, value in update_data.items():
            setattr(existing_model, key, value)

        updated_model = await existing_model.save()

        return PetMapper.to_domain(updated_model)

    async def delete(self, pet_id: str) -> bool:
        """Delete a pet by ID.

        Args:
            pet_id: Pet identifier

        Returns:
            True if deleted, False if not found

        Raises:
            Exception: If deletion fails
        """
        try:
            object_id = PydanticObjectId(pet_id)
        except Exception:
            return False

        model = await PetModel.get(object_id)
        if model is None:
            return False

        await model.delete()
        return True


# Type check: ensure implementation matches protocol
def _check_implementation() -> None:
    """Type check helper to ensure PetRepositoryImpl implements PetRepository."""
    _: PetRepository = PetRepositoryImpl()

