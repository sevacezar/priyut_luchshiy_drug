"""Admin user routes: CRUD and listing endpoints."""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Path, Query, status
from pydantic import BaseModel, EmailStr, Field

from backend.api.dependencies.auth import get_admin_user
from backend.api.dependencies.container import get_password_service, get_user_repository
from backend.application.repositories.user_repository import UserFilters, UserRepository
from backend.domain.entities.user import User
from backend.infrastructure.services.password_service import PasswordService


router = APIRouter(prefix="/users", tags=["users"])


class UserResponse(BaseModel):
    """Public user response schema."""

    id: str | None
    email: EmailStr
    name: str
    is_admin: bool
    is_active: bool
    created_at: str
    updated_at: str


class UserListResponse(BaseModel):
    """Paginated user list response."""

    items: list[UserResponse]
    total_count: int
    skip: int
    limit: int


class UserCreateRequest(BaseModel):
    """User create request schema."""

    email: EmailStr
    password: str = Field(..., min_length=6, max_length=255)
    name: str = Field(..., min_length=1, max_length=255)
    is_admin: bool = False
    is_active: bool = True


class UserUpdateRequest(BaseModel):
    """User update request schema."""

    email: Optional[EmailStr] = None
    password: Optional[str] = Field(None, min_length=6, max_length=255)
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    is_admin: Optional[bool] = None
    is_active: Optional[bool] = None


def serialize_user(user: User) -> UserResponse:
    """Map domain user to public response schema."""
    return UserResponse(
        id=user.id,
        email=user.email,
        name=user.name,
        is_admin=user.is_admin,
        is_active=user.is_active,
        created_at=user.created_at.isoformat(),
        updated_at=user.updated_at.isoformat(),
    )


@router.get("", response_model=UserListResponse, status_code=status.HTTP_200_OK)
async def list_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    is_admin: Optional[bool] = Query(None),
    is_active: Optional[bool] = Query(None),
    search_query: Optional[str] = Query(None),
    order_by: Optional[str] = Query(None),
    _admin: User = Depends(get_admin_user),
    user_repository: UserRepository = Depends(get_user_repository),
) -> UserListResponse:
    """List users with filters, ordering, and pagination (admin only)."""
    filters = UserFilters(
        is_admin=is_admin,
        is_active=is_active,
        search_query=search_query,
        order_by=order_by,
    )
    users = await user_repository.get_list(skip=skip, limit=limit, filters=filters)
    total_count = await user_repository.get_count(filters=filters)
    return UserListResponse(
        items=[serialize_user(user) for user in users],
        total_count=total_count,
        skip=skip,
        limit=limit,
    )


@router.get("/{user_id}", response_model=UserResponse, status_code=status.HTTP_200_OK)
async def get_user(
    user_id: str = Path(..., description="User ID"),
    _admin: User = Depends(get_admin_user),
    user_repository: UserRepository = Depends(get_user_repository),
) -> UserResponse:
    """Get user detail by ID (admin only)."""
    user = await user_repository.get_by_id(user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return serialize_user(user)


@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    payload: UserCreateRequest,
    _admin: User = Depends(get_admin_user),
    user_repository: UserRepository = Depends(get_user_repository),
    password_service: PasswordService = Depends(get_password_service),
) -> UserResponse:
    """Create a user (admin only)."""
    user = User(
        email=payload.email,
        password_hash=password_service.hash_password(payload.password),
        name=payload.name,
        is_admin=payload.is_admin,
        is_active=payload.is_active,
    )
    created = await user_repository.create(user)
    return serialize_user(created)


@router.patch("/{user_id}", response_model=UserResponse, status_code=status.HTTP_200_OK)
async def update_user(
    user_id: str,
    payload: UserUpdateRequest,
    _admin: User = Depends(get_admin_user),
    user_repository: UserRepository = Depends(get_user_repository),
    password_service: PasswordService = Depends(get_password_service),
) -> UserResponse:
    """Update a user (admin only)."""
    existing = await user_repository.get_by_id(user_id)
    if existing is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    update_data = payload.model_dump(exclude_unset=True, exclude={"password"})
    if payload.password:
        update_data["password_hash"] = password_service.hash_password(payload.password)

    updated_user = existing.model_copy(update=update_data)
    updated_user.id = user_id
    result = await user_repository.update(updated_user)
    return serialize_user(result)


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: str,
    admin_user: User = Depends(get_admin_user),
    user_repository: UserRepository = Depends(get_user_repository),
) -> None:
    """Delete a user (admin only)."""
    if admin_user.id == user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot delete your own account",
        )

    deleted = await user_repository.delete(user_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return None
