"""Dependencies for extracting request information (IP, User-Agent)."""

from fastapi import Request


def get_client_ip(request: Request) -> str:
    """Extract client IP address from request.

    Handles proxies and load balancers by checking X-Forwarded-For header first,
    then falls back to request.client.host.

    Args:
        request: FastAPI request object

    Returns:
        Client IP address
    """
    # Check for forwarded IP (from proxy/load balancer)
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        # X-Forwarded-For can contain multiple IPs, take the first one
        return forwarded_for.split(",")[0].strip()

    # Check for real IP header
    real_ip = request.headers.get("X-Real-IP")
    if real_ip:
        return real_ip

    # Use request.client.host as primary method
    if request.client:
        return request.client.host

    return "unknown"


def get_user_agent(request: Request) -> str:
    """Extract User-Agent header from request.

    Args:
        request: FastAPI request object

    Returns:
        User-Agent string or empty string if not present
    """
    return request.headers.get("User-Agent", "")

