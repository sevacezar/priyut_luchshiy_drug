"""Pet status enumeration."""

from enum import Enum


class PetStatus(str, Enum):
    """Pet status enumeration."""

    AVAILABLE = "available"
    ADOPTED = "adopted"
    RESERVED = "reserved"
    UNDER_TREATMENT = "under_treatment"
    TEMPORARILY_UNAVAILABLE = "temporarily_unavailable"

