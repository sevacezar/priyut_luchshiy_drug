"""Animal type enumeration."""

from enum import Enum


class AnimalType(str, Enum):
    """Animal type enumeration."""

    DOG = "dog"
    CAT = "cat"

