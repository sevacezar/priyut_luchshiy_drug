"""Authentication and authorization domain exceptions."""


class AuthenticationError(Exception):
    """Base exception for authentication errors."""

    pass


class InvalidCredentialsError(AuthenticationError):
    """Raised when credentials are invalid."""

    pass


class TokenInvalidError(AuthenticationError):
    """Raised when token is invalid."""

    pass


class TokenExpiredError(AuthenticationError):
    """Raised when token has expired."""

    pass


class AuthorizationError(Exception):
    """Raised when user is not authorized to perform an action."""

    pass

