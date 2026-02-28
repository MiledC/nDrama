from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, UploadFile, status

from app.middleware.auth import get_current_user
from app.models.user import User
from app.services.file_storage import S3Storage

router = APIRouter(prefix="/api/upload", tags=["upload"])

storage = S3Storage()

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB


@router.post("/thumbnail")
async def upload_thumbnail(
    file: UploadFile,
    _user: Annotated[User, Depends(get_current_user)],
):
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid file type. Allowed: {', '.join(ALLOWED_IMAGE_TYPES)}",
        )

    data = await file.read()
    if len(data) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"File too large. Maximum size: {MAX_FILE_SIZE // (1024 * 1024)}MB",
        )

    url = await storage.upload(data, file.filename or "upload.bin", file.content_type)
    return {"url": url}
