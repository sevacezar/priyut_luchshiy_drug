"""Password hashing service."""

import bcrypt


class PasswordService:
    """Service for password hashing and verification."""

    @staticmethod
    def hash_password(password: str) -> str:
        """Hash a password using bcrypt.

        Args:
            password: Plain text password

        Returns:
            Hashed password as string
        """
        salt = bcrypt.gensalt()
        hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
        return hashed.decode("utf-8")

    @staticmethod
    def verify_password(password: str, password_hash: str) -> bool:
        """Verify a password against a hash.

        Args:
            password: Plain text password
            password_hash: Hashed password to verify against

        Returns:
            True if password matches, False otherwise
        """
        return bcrypt.checkpw(
            password.encode("utf-8"), password_hash.encode("utf-8")
        )

