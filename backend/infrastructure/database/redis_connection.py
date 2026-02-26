"""Redis connection initialization."""

import redis.asyncio as redis

from backend.config import settings


async def init_redis() -> redis.Redis:
    """Initialize Redis connection.

    Returns:
        Redis async client instance

    Raises:
        Exception: If Redis connection fails
    """
    if settings.redis_url:
        # Use connection URL if provided
        client = redis.from_url(
            settings.redis_url,
            decode_responses=False,  # We'll handle JSON encoding/decoding ourselves
        )
    else:
        # Use individual settings
        client = redis.Redis(
            host=settings.redis_host,
            port=settings.redis_port,
            password=settings.redis_password if settings.redis_password else None,
            db=settings.redis_db,
            decode_responses=False,  # We'll handle JSON encoding/decoding ourselves
        )

    # Test connection
    await client.ping()

    return client

