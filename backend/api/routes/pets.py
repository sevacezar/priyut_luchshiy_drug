"""Pet routes: CRUD and listing endpoints."""

from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Path, Query, status
from pydantic import BaseModel, Field

from backend.api.dependencies.auth import get_admin_user
from backend.api.dependencies.container import (
    get_pet_create_use_case,
    get_pet_delete_use_case,
    get_pet_detail_use_case,
    get_pet_list_use_case,
    get_pet_update_use_case,
)
from backend.application.repositories.pet_repository import PetFilters
from backend.application.use_cases.pet_create import PetCreateUseCase
from backend.application.use_cases.pet_delete import PetDeleteUseCase
from backend.application.use_cases.pet_detail import PetDetailUseCase
from backend.application.use_cases.pet_list import PetListResult, PetListUseCase
from backend.application.use_cases.pet_update import PetUpdateUseCase
from backend.domain.entities.pet import Pet
from backend.domain.entities.user import User
from backend.domain.enums.animal_type import AnimalType
from backend.domain.enums.gender import Gender
from backend.domain.enums.pet_group import PetGroup
from backend.domain.enums.pet_status import PetStatus


router = APIRouter(prefix="/pets", tags=["pets"])


class PetBaseSchema(BaseModel):
    """Base schema for pet data used in create and update."""

    name: str = Field(..., description="Pet name", min_length=1, max_length=255)
    birth_year: Optional[int] = Field(
        None,
        description="Year of birth (>= 1900, not in the future)",
        ge=1900,
    )
    animal_type: AnimalType = Field(..., description="Type of animal (dog, cat)")
    gender: Optional[Gender] = Field(None, description="Gender (male, female)")

    # Appearance
    appearance_text: Optional[str] = Field(
        None, description="Appearance description"
    )
    coat_color: Optional[str] = Field(None, description="Coat color", max_length=100)
    coat_type: Optional[str] = Field(None, description="Coat type", max_length=100)
    adult_weight: Optional[str] = Field(
        None, description="Adult weight", max_length=50
    )
    adult_height: Optional[str] = Field(
        None, description="Adult height", max_length=50
    )

    # Character and behavior
    character_and_behavior_text: Optional[str] = Field(
        None, description="Character and behavior description"
    )

    # Health information
    is_healthy: Optional[bool] = Field(
        default=True, description="Is the pet healthy"
    )
    is_vaccinated: Optional[bool] = Field(
        default=False, description="Is the pet vaccinated"
    )
    is_sterilized: Optional[bool] = Field(
        default=False, description="Is the pet sterilized"
    )
    is_parasite_treated: Optional[bool] = Field(
        default=False, description="Is the pet treated for parasites"
    )
    health_notes: Optional[str] = Field(None, description="Health notes")

    # Registration
    registration_number: Optional[str] = Field(
        None, description="Registration number", max_length=50
    )
    tag_number: Optional[str] = Field(
        None, description="Tag number", max_length=50
    )
    tag_color: Optional[str] = Field(None, description="Tag color", max_length=50)

    # Admission history
    admission_text: Optional[str] = Field(
        None, description="Admission description"
    )
    admission_date: Optional[datetime] = Field(
        None, description="Admission date"
    )
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

    # Groups (shelter categories; pet can have several)
    groups: Optional[list[PetGroup]] = Field(
        default_factory=list,
        description="Pet groups (e.g. Старички, Крупные)",
    )

    # Status
    status: Optional[PetStatus] = Field(
        default=PetStatus.AVAILABLE,
        description="Current status of the pet",
    )

    # Images
    image_urls: Optional[list[str]] = Field(
        default_factory=list, description="List of pet image URLs"
    )


class PetCreateRequest(PetBaseSchema):
    """Request schema for creating a pet."""

    pass


class PetUpdateRequest(PetBaseSchema):
    """Request schema for updating a pet (partial update)."""

    # All fields are optional for PATCH-like behavior
    name: Optional[str] = Field(None, description="Pet name", min_length=1, max_length=255)
    animal_type: Optional[AnimalType] = Field(
        None, description="Type of animal (dog, cat)"
    )
    groups: Optional[list[PetGroup]] = Field(
        None, description="Pet groups (omit to leave unchanged)",
    )


class PetListResponse(BaseModel):
    """Response schema for pet list with pagination."""

    items: list[Pet]
    total_count: int
    skip: int
    limit: int


@router.get(
    "",
    response_model=PetListResponse,
    status_code=status.HTTP_200_OK,
)
async def list_pets(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(10, ge=1, le=100, description="Maximum number of records"),
    status_filter: Optional[PetStatus] = Query(
        None, alias="status", description="Filter by pet status"
    ),
    animal_type: Optional[AnimalType] = Query(
        None, description="Filter by animal type"
    ),
    gender: Optional[Gender] = Query(None, description="Filter by gender"),
    is_healthy: Optional[bool] = Query(
        None, description="Filter by health status"
    ),
    is_vaccinated: Optional[bool] = Query(
        None, description="Filter by vaccination status"
    ),
    is_sterilized: Optional[bool] = Query(
        None, description="Filter by sterilization status"
    ),
    groups: Optional[list[PetGroup]] = Query(
        None, description="Filter by groups (pet has at least one of these)"
    ),
    search_query: Optional[str] = Query(
        None, description="Search text in name, appearance, character fields"
    ),
    order_by: Optional[str] = Query(
        None,
        description=(
            "Ordering field, e.g. 'created_at', '-created_at', "
            "'name', '-name'. Only allowlisted fields are used."
        ),
    ),
    use_case: PetListUseCase = Depends(get_pet_list_use_case),
) -> PetListResponse:
    """List pets with filters, ordering, and pagination (public endpoint)."""
    filters = PetFilters(
        status=status_filter,
        animal_type=animal_type,
        gender=gender,
        is_healthy=is_healthy,
        is_vaccinated=is_vaccinated,
        is_sterilized=is_sterilized,
        groups=groups,
        search_query=search_query,
        order_by=order_by,
    )
    result: PetListResult = await use_case.execute(
        skip=skip,
        limit=limit,
        filters=filters,
    )
    return PetListResponse(
        items=result.pets,
        total_count=result.total_count,
        skip=result.skip,
        limit=result.limit,
    )


@router.get(
    "/{pet_id}",
    response_model=Pet,
    status_code=status.HTTP_200_OK,
)
async def get_pet_detail(
    pet_id: str = Path(..., description="Pet ID"),
    use_case: PetDetailUseCase = Depends(get_pet_detail_use_case),
) -> Pet:
    """Get pet details by ID (public endpoint)."""
    pet = await use_case.execute(pet_id)
    if pet is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pet not found",
        )
    return pet


@router.post(
    "",
    response_model=Pet,
    status_code=status.HTTP_201_CREATED,
)
async def create_pet(
    payload: PetCreateRequest,
    admin_user: User = Depends(get_admin_user),
    use_case: PetCreateUseCase = Depends(get_pet_create_use_case),
) -> Pet:
    """Create a new pet (admin only)."""
    # Map request DTO to domain entity
    pet_data = payload.model_dump()
    pet = Pet(**pet_data)
    created = await use_case.execute(pet)
    return created


@router.patch(
    "/{pet_id}",
    response_model=Pet,
    status_code=status.HTTP_200_OK,
)
async def update_pet(
    pet_id: str = Path(..., description="Pet ID"),
    payload: PetUpdateRequest = ...,
    admin_user: User = Depends(get_admin_user),
    detail_use_case: PetDetailUseCase = Depends(get_pet_detail_use_case),
    update_use_case: PetUpdateUseCase = Depends(get_pet_update_use_case),
) -> Pet:
    """Update an existing pet (admin only, partial update)."""
    existing = await detail_use_case.execute(pet_id)
    if existing is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pet not found",
        )

    update_data = payload.model_dump(exclude_unset=True)
    # admission_date is modeled as str in DTO; let domain model handle parsing if needed
    updated_pet = existing.model_copy(update=update_data)
    updated_pet.id = pet_id

    result = await update_use_case.execute(updated_pet)
    return result


@router.delete(
    "/{pet_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_pet(
    pet_id: str = Path(..., description="Pet ID"),
    admin_user: User = Depends(get_admin_user),
    use_case: PetDeleteUseCase = Depends(get_pet_delete_use_case),
) -> None:
    """Delete a pet by ID (admin only)."""
    deleted = await use_case.execute(pet_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pet not found",
        )
    # 204 No Content
    return None



