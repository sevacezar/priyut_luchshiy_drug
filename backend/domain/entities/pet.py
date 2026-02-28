"""Pet entity - domain model for pets."""

from datetime import datetime, timezone
from typing import Optional

from pydantic import BaseModel, Field, field_validator

from backend.domain.enums.animal_type import AnimalType
from backend.domain.enums.gender import Gender
from backend.domain.enums.pet_group import PetGroup
from backend.domain.enums.pet_status import PetStatus


class Pet(BaseModel):
    """Pet entity representing an animal in the shelter."""

    # ID (set by repository/infrastructure layer)
    id: Optional[str] = Field(None, description="Pet ID (set by database)")

    # Basic information
    name: str = Field(..., description="Pet name", min_length=1, max_length=255)
    birth_year: Optional[int] = Field(
        None,
        description="Year of birth",
        ge=1900,
    )

    @field_validator("birth_year")
    @classmethod
    def validate_birth_year(cls, v: Optional[int]) -> Optional[int]:
        """Validate that birth year is not in the future."""
        if v is not None and v > datetime.now(timezone.utc).year:
            raise ValueError("Birth year cannot be in the future")
        return v

    animal_type: AnimalType = Field(
        ..., description="Type of animal (dog, cat)"
    )
    gender: Optional[Gender] = Field(
        None, description="Gender (male, female)"
    )

    # Appearance
    appearance_text: Optional[str] = Field(None, description="Appearance description")
    coat_color: Optional[str] = Field(None, description="Coat color", max_length=100)
    coat_type: Optional[str] = Field(None, description="Coat type", max_length=100)
    adult_weight: Optional[str] = Field(None, description="Adult weight", max_length=50)
    adult_height: Optional[str] = Field(None, description="Adult height", max_length=50)

    # Character and behavior
    character_and_behavior_text: Optional[str] = Field(
        None, description="Character and behavior description"
    )

    # Health information
    is_healthy: bool = Field(default=True, description="Is the pet healthy")
    is_vaccinated: bool = Field(default=False, description="Is the pet vaccinated")
    is_sterilized: bool = Field(default=False, description="Is the pet sterilized")
    is_parasite_treated: bool = Field(
        default=False, description="Is the pet treated for parasites"
    )
    health_notes: Optional[str] = Field(None, description="Health notes")

    # Registration
    registration_number: Optional[str] = Field(
        None, description="Registration number", max_length=50
    )
    tag_number: Optional[str] = Field(None, description="Tag number", max_length=50)
    tag_color: Optional[str] = Field(None, description="Tag color", max_length=50)

    # Admission history
    admission_text: Optional[str] = Field(None, description="Admission description")
    admission_date: Optional[datetime] = Field(None, description="Admission date")
    capture_place: Optional[str] = Field(
        None, description="Place where pet was captured", max_length=255
    )
    capture_condition: Optional[str] = Field(
        None, description="Condition when captured"
    )

    # Additional conditions
    additional_conditions: Optional[str] = Field(
        None, description="Additional conditions or requirements"
    )

    # Groups (shelter categories; a pet can have several)
    groups: list[PetGroup] = Field(
        default_factory=list,
        description="Pet groups (e.g. Старички, Крупные)",
    )

    # Status
    status: PetStatus = Field(
        default=PetStatus.AVAILABLE,
        description="Current status of the pet",
    )

    # Metadata
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        description="Creation timestamp",
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        description="Last update timestamp",
    )

    # Images
    image_urls: list[str] = Field(
        default_factory=list, description="List of pet image URLs"
    )

    def __repr__(self) -> str:
        """String representation of the pet."""
        return f"{self.animal_type} {self.name}"

