"""Uploads API: serve and upload images (S3/MinIO)."""

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from fastapi.responses import Response

from backend.api.dependencies.auth import get_admin_user
from backend.api.dependencies.container import (
    get_delete_image_use_case,
    get_get_image_use_case,
    get_upload_image_use_case,
)
from backend.application.use_cases.delete_image import DeleteImageUseCase
from backend.application.use_cases.get_image import GetImageUseCase
from backend.application.use_cases.upload_image import UploadImageUseCase
from backend.domain.entities.user import User

router = APIRouter(prefix="/uploads", tags=["uploads"])


def _safe_path(path: str) -> bool:
    """Reject path traversal (e.g. '..')."""
    return ".." not in path and not path.strip().startswith("/")


@router.get("/{path:path}")
async def get_image(
    path: str,
    use_case: GetImageUseCase = Depends(get_get_image_use_case),
) -> Response:
    """Return image bytes by path (image_url). Example: GET /api/v1/uploads/pets/1.png."""
    if not _safe_path(path):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid path",
        )
    result = await use_case.execute(path)
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Image not found",
        )
    content, media_type = result
    return Response(content=content, media_type=media_type)


@router.post("", status_code=status.HTTP_201_CREATED)
async def upload_image(
    _admin: User = Depends(get_admin_user),
    file: UploadFile = File(..., description="Image file"),
    use_case: UploadImageUseCase = Depends(get_upload_image_use_case),
) -> dict[str, str]:
    """Upload an image; returns image_url for use in API/DB. Admin only."""
    content_type = file.content_type or "application/octet-stream"
    content = await file.read()
    try:
        image_url = await use_case.execute(
            content=content,
            content_type=content_type,
            subpath="pets",
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    return {"image_url": image_url}


@router.delete("/{path:path}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_image(
    path: str,
    _admin: User = Depends(get_admin_user),
    use_case: DeleteImageUseCase = Depends(get_delete_image_use_case),
) -> None:
    """Delete image by path (image_url). Admin only. Returns 404 if not found."""
    if not _safe_path(path):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid path",
        )
    deleted = await use_case.execute(path)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Image not found",
        )
