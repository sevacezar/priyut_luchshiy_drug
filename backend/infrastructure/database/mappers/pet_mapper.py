"""Mapper between Pet domain entity and PetModel infrastructure model."""

from bson import ObjectId

from backend.domain.entities.pet import Pet
from backend.infrastructure.database.models.pet_model import PetModel


class PetMapper:
    """Mapper for converting between Pet domain entity and PetModel."""

    @staticmethod
    def to_domain(model: PetModel) -> Pet:
        """Convert PetModel to Pet domain entity."""
        return Pet(
            id=str(model.id) if model.id else None,
            name=model.name,
            birth_year=model.birth_year,
            animal_type=model.animal_type,
            gender=model.gender,
            appearance_text=model.appearance_text,
            coat_color=model.coat_color,
            coat_type=model.coat_type,
            adult_weight=model.adult_weight,
            adult_height=model.adult_height,
            character_and_behavior_text=model.character_and_behavior_text,
            is_healthy=model.is_healthy,
            is_vaccinated=model.is_vaccinated,
            is_sterilized=model.is_sterilized,
            is_parasite_treated=model.is_parasite_treated,
            health_notes=model.health_notes,
            registration_number=model.registration_number,
            tag_number=model.tag_number,
            tag_color=model.tag_color,
            admission_text=model.admission_text,
            admission_date=model.admission_date,
            capture_place=model.capture_place,
            capture_condition=model.capture_condition,
            additional_conditions=model.additional_conditions,
            status=model.status,
            created_at=model.created_at,
            updated_at=model.updated_at,
            image_urls=model.image_urls,
        )

    @staticmethod
    def to_model(entity: Pet) -> PetModel:
        """Convert Pet domain entity to PetModel."""
        model_data = entity.model_dump(exclude={"id"})
        model = PetModel(**model_data)
        if entity.id:
            # If entity has an ID, set it as ObjectId for MongoDB
            model.id = ObjectId(entity.id)
        return model

