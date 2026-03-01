"""Audio track CRUD endpoints."""

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Form, HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.audio_track import AudioTrack
from app.models.episode import Episode
from app.models.user import User
from app.schemas.audio_track import (
    AudioTrackListResponse,
    AudioTrackResponse,
    AudioTrackUpdate,
)
from app.services.file_storage import S3Storage

router = APIRouter(tags=["audio-tracks"])

storage = S3Storage()

ALLOWED_AUDIO_TYPES = {"audio/mpeg", "audio/aac", "audio/wav", "audio/mp4", "audio/ogg"}
MAX_AUDIO_FILE_SIZE = 100 * 1024 * 1024  # 100 MB


@router.get(
    "/api/episodes/{episode_id}/audio-tracks", response_model=AudioTrackListResponse
)
async def list_audio_tracks(
    episode_id: uuid.UUID,
    _user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """List audio tracks for an episode."""
    episode_result = await db.execute(select(Episode).where(Episode.id == episode_id))
    if episode_result.scalar_one_or_none() is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Episode not found"
        )

    result = await db.execute(
        select(AudioTrack)
        .where(AudioTrack.episode_id == episode_id)
        .order_by(AudioTrack.created_at.asc())
    )
    items = result.scalars().all()

    return AudioTrackListResponse(items=items, total=len(items))


@router.post(
    "/api/episodes/{episode_id}/audio-tracks",
    response_model=AudioTrackResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_audio_track(
    episode_id: uuid.UUID,
    file: UploadFile,
    language_code: Annotated[str, Form()],
    label: Annotated[str, Form()],
    _user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    is_default: Annotated[bool, Form()] = False,
):
    """Upload an audio track for an episode."""
    # Verify episode exists
    episode_result = await db.execute(select(Episode).where(Episode.id == episode_id))
    if episode_result.scalar_one_or_none() is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Episode not found"
        )

    # Validate file type
    if file.content_type not in ALLOWED_AUDIO_TYPES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid file type. Allowed: {', '.join(ALLOWED_AUDIO_TYPES)}",
        )

    # Read and validate file size
    data = await file.read()
    if len(data) > MAX_AUDIO_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"File too large. Maximum size: {MAX_AUDIO_FILE_SIZE // (1024 * 1024)}MB",
        )

    # Upload file to S3
    file_url = await storage.upload(
        data, file.filename or "audio.mp3", file.content_type, prefix="audio-tracks"
    )

    # If setting as default, clear other defaults for this episode
    if is_default:
        existing = await db.execute(
            select(AudioTrack).where(
                AudioTrack.episode_id == episode_id, AudioTrack.is_default.is_(True)
            )
        )
        for track in existing.scalars().all():
            track.is_default = False

    audio_track = AudioTrack(
        episode_id=episode_id,
        language_code=language_code,
        label=label,
        file_url=file_url,
        is_default=is_default,
    )

    db.add(audio_track)
    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        # Clean up uploaded file
        await storage.delete(file_url)
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Audio track for language '{language_code}' already exists for this episode",
        )
    await db.refresh(audio_track)

    return audio_track


@router.patch("/api/audio-tracks/{track_id}", response_model=AudioTrackResponse)
async def update_audio_track(
    track_id: uuid.UUID,
    request: AudioTrackUpdate,
    _user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Update an audio track's metadata."""
    result = await db.execute(select(AudioTrack).where(AudioTrack.id == track_id))
    track = result.scalar_one_or_none()

    if track is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Audio track not found"
        )

    update_data = request.model_dump(exclude_unset=True)

    # If setting as default, clear other defaults for this episode
    if update_data.get("is_default") is True:
        existing = await db.execute(
            select(AudioTrack).where(
                AudioTrack.episode_id == track.episode_id,
                AudioTrack.is_default.is_(True),
                AudioTrack.id != track_id,
            )
        )
        for other_track in existing.scalars().all():
            other_track.is_default = False

    for field, value in update_data.items():
        setattr(track, field, value)

    await db.commit()
    await db.refresh(track)

    return track


@router.delete("/api/audio-tracks/{track_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_audio_track(
    track_id: uuid.UUID,
    _user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Delete an audio track and its file from storage."""
    result = await db.execute(select(AudioTrack).where(AudioTrack.id == track_id))
    track = result.scalar_one_or_none()

    if track is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Audio track not found"
        )

    # Delete file from S3
    await storage.delete(track.file_url)

    await db.delete(track)
    await db.commit()
