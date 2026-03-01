"""Episode CRUD endpoints."""

import logging
import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.episode import Episode, EpisodeStatus, VideoProviderEnum
from app.models.series import Series
from app.models.user import User
from app.schemas.episode import (
    EpisodeCreate,
    EpisodeListResponse,
    EpisodeResponse,
    EpisodeUpdate,
    VideoUploadResponse,
)
from app.services.video_provider import get_video_provider

logger = logging.getLogger(__name__)

router = APIRouter(tags=["episodes"])


@router.get("/api/series/{series_id}/episodes", response_model=EpisodeListResponse)
async def list_episodes(
    series_id: uuid.UUID,
    _user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
):
    """List episodes for a series, ordered by episode_number."""
    # Verify series exists
    series_result = await db.execute(select(Series).where(Series.id == series_id))
    if series_result.scalar_one_or_none() is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Series not found",
        )

    query = select(Episode).where(Episode.series_id == series_id)
    query = query.order_by(Episode.episode_number.asc())

    # Get total count
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    # Paginate
    offset = (page - 1) * per_page
    query = query.offset(offset).limit(per_page)

    result = await db.execute(query)
    items = result.scalars().all()

    return EpisodeListResponse(
        items=items,
        total=total,
        page=page,
        per_page=per_page,
    )


@router.get("/api/episodes/{episode_id}", response_model=EpisodeResponse)
async def get_episode(
    episode_id: uuid.UUID,
    _user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Get a single episode."""
    result = await db.execute(select(Episode).where(Episode.id == episode_id))
    episode = result.scalar_one_or_none()

    if episode is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Episode not found",
        )

    return episode


@router.post(
    "/api/series/{series_id}/episodes",
    response_model=EpisodeResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_episode(
    series_id: uuid.UUID,
    request: EpisodeCreate,
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Create a new episode in a series."""
    # Verify series exists
    series_result = await db.execute(select(Series).where(Series.id == series_id))
    if series_result.scalar_one_or_none() is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Series not found",
        )

    # Auto-assign episode_number if not provided
    episode_number = request.episode_number
    if episode_number is None:
        max_result = await db.execute(
            select(func.coalesce(func.max(Episode.episode_number), 0)).where(
                Episode.series_id == series_id
            )
        )
        episode_number = (max_result.scalar() or 0) + 1

    episode_data = request.model_dump(exclude={"episode_number"})
    episode = Episode(
        **episode_data,
        series_id=series_id,
        episode_number=episode_number,
        created_by=user.id,
    )

    db.add(episode)
    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Episode number {episode_number} already exists in this series",
        )
    await db.refresh(episode)

    return episode


@router.patch("/api/episodes/{episode_id}", response_model=EpisodeResponse)
async def update_episode(
    episode_id: uuid.UUID,
    request: EpisodeUpdate,
    _user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Update an existing episode."""
    result = await db.execute(select(Episode).where(Episode.id == episode_id))
    episode = result.scalar_one_or_none()

    if episode is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Episode not found",
        )

    update_data = request.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(episode, field, value)

    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Episode number {request.episode_number} already exists in this series",
        )
    await db.refresh(episode)

    return episode


@router.delete("/api/episodes/{episode_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_episode(
    episode_id: uuid.UUID,
    _user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Delete an episode and clean up its video asset."""
    result = await db.execute(select(Episode).where(Episode.id == episode_id))
    episode = result.scalar_one_or_none()

    if episode is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Episode not found",
        )

    # Clean up video asset if one exists
    if episode.video_provider and episode.video_provider_asset_id:
        try:
            provider = get_video_provider(episode.video_provider)
            await provider.delete(episode.video_provider_asset_id)
        except Exception:
            logger.warning(
                "Failed to delete video asset %s from %s",
                episode.video_provider_asset_id,
                episode.video_provider,
            )

    await db.delete(episode)
    await db.commit()


@router.post(
    "/api/episodes/{episode_id}/video",
    response_model=VideoUploadResponse,
)
async def upload_video(
    episode_id: uuid.UUID,
    _user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Create a direct upload URL for video. Client uploads directly to provider."""
    result = await db.execute(select(Episode).where(Episode.id == episode_id))
    episode = result.scalar_one_or_none()

    if episode is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Episode not found",
        )

    # Delete existing video if replacing
    if episode.video_provider_asset_id:
        try:
            old_provider = get_video_provider(episode.video_provider)
            await old_provider.delete(episode.video_provider_asset_id)
        except Exception:
            logger.warning(
                "Failed to delete old video asset %s",
                episode.video_provider_asset_id,
            )

    provider = get_video_provider()
    asset = await provider.create_upload(f"episode-{episode_id}")

    # Update episode with provider info — asset_id may be empty until upload completes
    episode.video_provider = VideoProviderEnum.mux
    episode.video_provider_asset_id = asset.asset_id or None
    episode.video_provider_upload_id = asset.upload_id
    episode.video_playback_id = None
    episode.status = EpisodeStatus.processing

    await db.commit()
    await db.refresh(episode)

    return VideoUploadResponse(
        upload_url=asset.upload_url,
        asset_id=asset.asset_id,
        playback_id=asset.playback_id,
    )


@router.post(
    "/api/episodes/{episode_id}/video/complete",
    response_model=EpisodeResponse,
)
async def complete_video_upload(
    episode_id: uuid.UUID,
    _user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Finalize video upload: fetch asset_id and playback_id from provider."""
    result = await db.execute(select(Episode).where(Episode.id == episode_id))
    episode = result.scalar_one_or_none()

    if episode is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Episode not found",
        )

    if not episode.video_provider_upload_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No video upload in progress for this episode",
        )

    provider = get_video_provider(episode.video_provider)
    details = await provider.get_upload_details(episode.video_provider_upload_id)

    if details.asset_id:
        episode.video_provider_asset_id = details.asset_id
    if details.playback_id:
        episode.video_playback_id = details.playback_id

    # Map provider status to episode status
    if details.status == "ready":
        episode.status = EpisodeStatus.ready
    elif details.status == "errored":
        episode.status = EpisodeStatus.draft

    await db.commit()
    await db.refresh(episode)

    return episode
