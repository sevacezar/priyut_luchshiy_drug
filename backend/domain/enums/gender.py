"""Gender enumeration."""

from enum import Enum


class Gender(str, Enum):
    """Gender enumeration."""

    MALE = "male"
    FEMALE = "female"

