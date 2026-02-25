"""JWT token service."""

from datetime import datetime, timedelta, timezone
from typing import Optional

from jose import JWTError, jwt

from backend.config import settings
from backend.domain.exceptions.auth_exceptions import (
    TokenExpiredError,
    TokenInvalidError,
)


class JWTService:
    """Service for JWT token creation and validation."""

    @staticmethod
    def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
        """Create an access token.

        Args:
            data: Data to encode in the token
            expires_delta: Optional expiration time delta

        Returns:
            Encoded JWT token
        """
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.now(timezone.utc) + expires_delta
        else:
            expire = datetime.now(timezone.utc) + timedelta(
                seconds=settings.access_token_expire_seconds
            )
        to_encode.update({"exp": expire, "iat": datetime.now(timezone.utc)})
        encoded_jwt = jwt.encode(
            to_encode, settings.jwt_secret_key, algorithm=settings.jwt_algorithm
        )
        return encoded_jwt

    @staticmethod
    def create_refresh_token(data: dict) -> str:
        """Create a refresh token.

        Args:
            data: Data to encode in the token

        Returns:
            Encoded JWT refresh token
        """
        to_encode = data.copy()
        expire = datetime.now(timezone.utc) + timedelta(
            seconds=settings.refresh_token_expire_seconds
        )
        to_encode.update({"exp": expire, "iat": datetime.now(timezone.utc), "type": "refresh"})
        encoded_jwt = jwt.encode(
            to_encode, settings.jwt_secret_key, algorithm=settings.jwt_algorithm
        )
        return encoded_jwt

    @staticmethod
    def decode_token(token: str) -> dict:
        """Decode and validate a JWT token.

        Args:
            token: JWT token to decode

        Returns:
            Decoded token payload

        Raises:
            TokenInvalidError: If token is invalid
            TokenExpiredError: If token has expired
        """
        try:
            payload = jwt.decode(
                token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm]
            )
            return payload
        except jwt.ExpiredSignatureError:
            raise TokenExpiredError("Token has expired")
        except JWTError as e:
            raise TokenInvalidError(f"Invalid token: {str(e)}")

    @staticmethod
    def verify_refresh_token(token: str) -> dict:
        """Verify that a token is a valid refresh token.

        Args:
            token: JWT token to verify

        Returns:
            Decoded token payload

        Raises:
            TokenInvalidError: If token is not a refresh token or is invalid
            TokenExpiredError: If token has expired
        """
        payload = JWTService.decode_token(token)
        if payload.get("type") != "refresh":
            raise TokenInvalidError("Token is not a refresh token")
        return payload

