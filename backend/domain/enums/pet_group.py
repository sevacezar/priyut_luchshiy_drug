"""Pet group enumeration (shelter categories)."""

from enum import Enum


class PetGroup(str, Enum):
    """Pet group - category for listing/filtering. A pet can belong to several groups."""

    LOOKING_FOR_GUARDIANS = "Ищем опекунов"
    OLD_TIMERS = "Старички"
    SMALLEST = "Самые маленькие"
    MEDIUM = "Средние"
    LARGE = "Крупные"
    FOR_EXPERIENCED_OWNERS = "Для опытных владельцев"
    SHY = "Трусишки"
