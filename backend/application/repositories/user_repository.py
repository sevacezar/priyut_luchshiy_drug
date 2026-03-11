"""User repository interface (Protocol)."""

from typing import Optional, Protocol

from pydantic import BaseModel

from backend.domain.entities.user import User


class UserFilters(BaseModel):
    """Filters for user queries."""

    is_admin: Optional[bool] = None
    is_active: Optional[bool] = None
    search_query: Optional[str] = None
    order_by: Optional[str] = None


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

    async def get_list(
        self,
        skip: int = 0,
        limit: int = 10,
        filters: Optional[UserFilters] = None,
    ) -> list[User]:
        """Get a list of users with pagination and filters."""
        ...

    async def get_count(self, filters: Optional[UserFilters] = None) -> int:
        """Get total count of users matching filters."""
        ...

    async def delete(self, user_id: str) -> bool:
        """Delete a user by ID."""
        ...
