"""User repository interface (Protocol)."""

from typing import Optional, Protocol

from backend.domain.entities.user import User


class UserRepository(Protocol):
    """Repository interface for User entity operations."""

    async def create(self, user: User) -> User:
        """Create a new user.

        Args:
            user: User entity to create (without ID)

        Returns:
            Created user entity with ID set

        Raises:
            RepositoryError: If creation fails (e.g., email already exists)
        """
        ...

    async def get_by_id(self, user_id: str) -> Optional[User]:
        """Get a user by its ID.

        Args:
            user_id: User identifier

        Returns:
            User entity if found, None otherwise
        """
        ...

    async def get_by_email(self, email: str) -> Optional[User]:
        """Get a user by email address.

        Args:
            email: User email address

        Returns:
            User entity if found, None otherwise
        """
        ...

    async def update(self, user: User) -> User:
        """Update an existing user.

        Args:
            user: User entity with ID to update

        Returns:
            Updated user entity

        Raises:
            RepositoryError: If user not found or update fails
        """
        ...

