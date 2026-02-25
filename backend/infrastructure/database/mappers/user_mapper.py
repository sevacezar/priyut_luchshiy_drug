"""Mapper between User domain entity and UserModel infrastructure model."""

from bson import ObjectId

from backend.domain.entities.user import User
from backend.infrastructure.database.models.user_model import UserModel


class UserMapper:
    """Mapper for converting between User domain entity and UserModel."""

    @staticmethod
    def to_domain(model: UserModel) -> User:
        """Convert UserModel to User domain entity."""
        return User(
            id=str(model.id) if model.id else None,
            email=model.email,
            password_hash=model.password_hash,
            name=model.name,
            is_admin=model.is_admin,
            is_active=model.is_active,
            created_at=model.created_at,
            updated_at=model.updated_at,
        )

    @staticmethod
    def to_model(entity: User) -> UserModel:
        """Convert User domain entity to UserModel."""
        model_data = entity.model_dump(exclude={"id"})
        model = UserModel(**model_data)
        if entity.id:
            # If entity has an ID, set it as ObjectId for MongoDB
            model.id = ObjectId(entity.id)
        return model

