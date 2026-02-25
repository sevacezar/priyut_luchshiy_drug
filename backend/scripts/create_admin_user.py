#!/usr/bin/env python3
"""Script to create a new admin user.

Usage:
    python -m backend.scripts.create_admin_user <email> <name> <password>
    or
    uv run python -m backend.scripts.create_admin_user <email> <name> <password>
    or
    uv run backend/scripts/create_admin_user.py <email> <name> <password>
"""

import asyncio
import sys
from pathlib import Path

# Add project root to Python path
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

from backend.domain.entities.user import User
from backend.infrastructure.database.connection import init_database
from backend.infrastructure.repositories.user_repository_impl import UserRepositoryImpl
from backend.infrastructure.services.password_service import PasswordService


async def create_admin_user(email: str, name: str, password: str) -> User:
    """Create a new admin user.

    Args:
        email: User email address
        name: User name
        password: Plain text password (will be hashed)

    Returns:
        Created user entity

    Raises:
        ValueError: If user creation fails (e.g., email already exists)
    """
    # Initialize services
    password_service = PasswordService()
    user_repository = UserRepositoryImpl()

    # Check if user already exists
    existing_user = await user_repository.get_by_email(email)
    if existing_user:
        raise ValueError(f"User with email {email} already exists")

    # Hash password
    password_hash = password_service.hash_password(password)

    # Create user entity
    user = User(
        email=email,
        password_hash=password_hash,
        name=name,
        is_admin=True,
        is_active=True,
    )

    # Save user
    created_user = await user_repository.create(user)

    return created_user


async def main() -> None:
    """Main function to run the script."""
    email = "admin@admin.com"
    name = "Admin"
    password = "admin123"

    try:
        # Initialize database connection
        print("Connecting to database...")
        await init_database()
        print("✓ Database connected")

        # Create admin user
        user = await create_admin_user(email, name, password)
        print(f"✓ Admin user created successfully!")
        print(f"  ID: {user.id}")
        print(f"  Email: {user.email}")
        print(f"  Name: {user.name}")
        print(f"  Is Admin: {user.is_admin}")
        print(f"  Is Active: {user.is_active}")
    except ValueError as e:
        print(f"Error: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())

