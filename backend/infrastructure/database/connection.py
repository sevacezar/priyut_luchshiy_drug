"""Database connection initialization for Beanie."""

from motor.motor_asyncio import AsyncIOMotorClient

from beanie import init_beanie

from backend.config import settings
from backend.infrastructure.database.models.pet_model import PetModel
from backend.infrastructure.database.models.user_model import UserModel


async def init_database() -> None:
    """Initialize Beanie database connection.

    This function should be called at application startup to:
    1. Connect to MongoDB
    2. Initialize Beanie with document models
    3. Create indexes

    Raises:
        Exception: If database connection fails
    """
    # Create Motor client
    client = AsyncIOMotorClient(settings.mongodb_url)

    # Initialize Beanie with document models
    await init_beanie(
        database=client[settings.mongodb_database],
        document_models=[PetModel, UserModel],
    )

