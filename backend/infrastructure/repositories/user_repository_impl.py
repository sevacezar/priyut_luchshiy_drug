"""User repository implementation using Beanie."""

from typing import Optional

from beanie import PydanticObjectId

from backend.application.repositories.user_repository import UserRepository
from backend.domain.entities.user import User
from backend.infrastructure.database.mappers.user_mapper import UserMapper
from backend.infrastructure.database.models.user_model import UserModel


class UserRepositoryImpl:
    """Beanie implementation of UserRepository."""

    async def create(self, user: User) -> User:
        """Create a new user.

        Args:
            user: User entity to create (without ID)

        Returns:
            Created user entity with ID set

        Raises:
            ValueError: If email already exists or creation fails
        """
        # Check if user with this email already exists
        existing_user = await UserModel.find_one({"email": user.email})
        if existing_user:
            raise ValueError(f"User with email {user.email} already exists")

        model = UserMapper.to_model(user)
        created_model = await model.insert()
        return UserMapper.to_domain(created_model)

    async def get_by_id(self, user_id: str) -> Optional[User]:
        """Get a user by its ID.

        Args:
            user_id: User identifier

        Returns:
            User entity if found, None otherwise
        """
        try:
            object_id = PydanticObjectId(user_id)
        except Exception:
            return None

        model = await UserModel.get(object_id)
        if model is None:
            return None

        return UserMapper.to_domain(model)

    async def get_by_email(self, email: str) -> Optional[User]:
        """Get a user by email address.

        Args:
            email: User email address

        Returns:
            User entity if found, None otherwise
        """
        model = await UserModel.find_one({"email": email})
        if model is None:
            return None

        return UserMapper.to_domain(model)

    async def update(self, user: User) -> User:
        """Update an existing user.

        Args:
            user: User entity with ID to update

        Returns:
            Updated user entity

        Raises:
            ValueError: If user not found or update fails
        """
        if not user.id:
            raise ValueError("User ID is required for update")

        try:
            object_id = PydanticObjectId(user.id)
        except Exception as e:
            raise ValueError(f"Invalid user ID: {user.id}") from e

        existing_model = await UserModel.get(object_id)
        if existing_model is None:
            raise ValueError(f"User with ID {user.id} not found")

        # Check if email is being changed and if new email already exists
        if user.email != existing_model.email:
            email_exists = await UserModel.find_one({"email": user.email})
            if email_exists:
                raise ValueError(f"User with email {user.email} already exists")

        # Update timestamp
        existing_model.update_timestamp()

        # Update fields from the user entity
        update_data = user.model_dump(
            exclude={"id", "created_at"}, exclude_none=True
        )
        update_data["updated_at"] = existing_model.updated_at

        # Update the model
        for key, value in update_data.items():
            setattr(existing_model, key, value)

        updated_model = await existing_model.save()

        return UserMapper.to_domain(updated_model)


# Type check: ensure implementation matches protocol
def _check_implementation() -> None:
    """Type check helper to ensure UserRepositoryImpl implements UserRepository."""
    _: UserRepository = UserRepositoryImpl()

