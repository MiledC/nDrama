import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.session_auth import get_current_subscriber
from app.models.subscriber import Subscriber
from app.schemas.content import (
    EpisodeListItem,
    PaginatedResponse,
    SeriesDetail,
    SeriesListItem,
    TagItem,
)
from app.services import content_service

router = APIRouter(prefix="/api/series", tags=["series"])


@router.get("", response_model=PaginatedResponse[SeriesListItem])
async def list_series(
    offset: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    search: str | None = None,
    _subscriber: Subscriber = Depends(get_current_subscriber),
    db: AsyncSession = Depends(get_db),
):
    """List published series."""
    items, total = await content_service.list_series(
        db, offset=offset, limit=limit, search=search
    )
    return PaginatedResponse(
        items=[SeriesListItem.model_validate(s) for s in items],
        total=total,
        offset=offset,
        limit=limit,
    )


@router.get("/{series_id}", response_model=SeriesDetail)
async def get_series(
    series_id: uuid.UUID,
    subscriber: Subscriber = Depends(get_current_subscriber),
    db: AsyncSession = Depends(get_db),
):
    """Get series detail with episode list."""
    series, episodes = await content_service.get_series(db, series_id, subscriber.id)
    if series is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Series not found")
    return SeriesDetail(
        id=series.id,
        title=series.title,
        description=series.description,
        thumbnail_url=series.thumbnail_url,
        tags=[TagItem.model_validate(t) for t in series.tags],
        free_episode_count=series.free_episode_count,
        coin_cost_per_episode=series.coin_cost_per_episode,
        created_at=series.created_at,
        episodes=[EpisodeListItem(**ep) for ep in episodes],
    )


@router.get(
    "/{series_id}/episodes",
    response_model=PaginatedResponse[EpisodeListItem],
)
async def list_episodes(
    series_id: uuid.UUID,
    offset: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    subscriber: Subscriber = Depends(get_current_subscriber),
    db: AsyncSession = Depends(get_db),
):
    """List episodes for a series with unlock status."""
    items, total = await content_service.list_episodes(
        db, series_id, subscriber.id, offset=offset, limit=limit
    )
    return PaginatedResponse(
        items=[EpisodeListItem(**ep) for ep in items],
        total=total,
        offset=offset,
        limit=limit,
    )
