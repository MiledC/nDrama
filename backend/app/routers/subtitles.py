"""Subtitle CRUD endpoints."""

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Form, HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.episode import Episode
from app.models.subtitle import Subtitle, SubtitleFormat
from app.models.user import User
from app.schemas.subtitle import (
    SubtitleListResponse,
    SubtitleResponse,
    SubtitleUpdate,
)
from app.services.file_storage import S3Storage

router = APIRouter(tags=["subtitles"])

storage = S3Storage()

ALLOWED_SUBTITLE_TYPES = {
    "text/vtt": SubtitleFormat.vtt,
    "application/x-subrip": SubtitleFormat.srt,
    "text/srt": SubtitleFormat.srt,
    "text/plain": None,  # Need to detect from extension
}
MAX_SUBTITLE_FILE_SIZE = 5 * 1024 * 1024  # 5 MB


def _detect_subtitle_format(filename: str | None, content_type: str) -> SubtitleFormat:
    """Detect subtitle format from content type or file extension."""
    if content_type in ("text/vtt", "application/vtt"):
        return SubtitleFormat.vtt
    if content_type in ("application/x-subrip", "text/srt"):
        return SubtitleFormat.srt

    # Fall back to extension
    if filename:
        ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
        if ext == "vtt":
            return SubtitleFormat.vtt
        if ext == "srt":
            return SubtitleFormat.srt

    raise HTTPException(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        detail="Invalid subtitle format. Only SRT and VTT files are allowed.",
    )


@router.get(
    "/api/episodes/{episode_id}/subtitles", response_model=SubtitleListResponse
)
async def list_subtitles(
    episode_id: uuid.UUID,
    _user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """List subtitles for an episode."""
    episode_result = await db.execute(select(Episode).where(Episode.id == episode_id))
    if episode_result.scalar_one_or_none() is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Episode not found"
        )

    result = await db.execute(
        select(Subtitle)
        .where(Subtitle.episode_id == episode_id)
        .order_by(Subtitle.created_at.asc())
    )
    items = result.scalars().all()

    return SubtitleListResponse(items=items, total=len(items))


@router.post(
    "/api/episodes/{episode_id}/subtitles",
    response_model=SubtitleResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_subtitle(
    episode_id: uuid.UUID,
    file: UploadFile,
    language_code: Annotated[str, Form()],
    label: Annotated[str, Form()],
    _user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    is_default: Annotated[bool, Form()] = False,
):
    """Upload a subtitle file for an episode."""
    # Verify episode exists
    episode_result = await db.execute(select(Episode).where(Episode.id == episode_id))
    if episode_result.scalar_one_or_none() is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Episode not found"
        )

    # Detect format from content type / extension
    subtitle_format = _detect_subtitle_format(file.filename, file.content_type)

    # Read and validate file size
    data = await file.read()
    if len(data) > MAX_SUBTITLE_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"File too large. Maximum size: {MAX_SUBTITLE_FILE_SIZE // (1024 * 1024)}MB",
        )

    # Upload file to S3
    file_url = await storage.upload(
        data, file.filename or f"subtitle.{subtitle_format.value}", file.content_type,
        prefix="subtitles",
    )

    # If setting as default, clear other defaults for this episode
    if is_default:
        existing = await db.execute(
            select(Subtitle).where(
                Subtitle.episode_id == episode_id, Subtitle.is_default.is_(True)
            )
        )
        for sub in existing.scalars().all():
            sub.is_default = False

    subtitle = Subtitle(
        episode_id=episode_id,
        language_code=language_code,
        label=label,
        file_url=file_url,
        format=subtitle_format,
        is_default=is_default,
    )

    db.add(subtitle)
    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        await storage.delete(file_url)
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Subtitle for language '{language_code}' already exists for this episode",
        )
    await db.refresh(subtitle)

    return subtitle


@router.patch("/api/subtitles/{subtitle_id}", response_model=SubtitleResponse)
async def update_subtitle(
    subtitle_id: uuid.UUID,
    request: SubtitleUpdate,
    _user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Update a subtitle's metadata."""
    result = await db.execute(select(Subtitle).where(Subtitle.id == subtitle_id))
    subtitle = result.scalar_one_or_none()

    if subtitle is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Subtitle not found"
        )

    update_data = request.model_dump(exclude_unset=True)

    # If setting as default, clear other defaults for this episode
    if update_data.get("is_default") is True:
        existing = await db.execute(
            select(Subtitle).where(
                Subtitle.episode_id == subtitle.episode_id,
                Subtitle.is_default.is_(True),
                Subtitle.id != subtitle_id,
            )
        )
        for other_sub in existing.scalars().all():
            other_sub.is_default = False

    for field, value in update_data.items():
        setattr(subtitle, field, value)

    await db.commit()
    await db.refresh(subtitle)

    return subtitle


@router.delete("/api/subtitles/{subtitle_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_subtitle(
    subtitle_id: uuid.UUID,
    _user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Delete a subtitle and its file from storage."""
    result = await db.execute(select(Subtitle).where(Subtitle.id == subtitle_id))
    subtitle = result.scalar_one_or_none()

    if subtitle is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Subtitle not found"
        )

    # Delete file from S3
    await storage.delete(subtitle.file_url)

    await db.delete(subtitle)
    await db.commit()
