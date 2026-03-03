import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.session_auth import require_active_subscriber
from app.models.subscriber import Subscriber
from app.schemas.content import PaginatedResponse
from app.schemas.favorites import FavoriteSeriesItem
from app.services import favorite_service

router = APIRouter(prefix="/api/favorites", tags=["favorites"])


@router.get("", response_model=PaginatedResponse[FavoriteSeriesItem])
async def list_favorites(
    offset: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    subscriber: Subscriber = Depends(require_active_subscriber),
    db: AsyncSession = Depends(get_db),
):
    """List favorited series."""
    items, total = await favorite_service.list_favorites(
        db, subscriber.id, offset=offset, limit=limit
    )
    return PaginatedResponse(
        items=[FavoriteSeriesItem(**item) for item in items],
        total=total,
        offset=offset,
        limit=limit,
    )


@router.post("/{series_id}", status_code=status.HTTP_201_CREATED)
async def add_favorite(
    series_id: uuid.UUID,
    subscriber: Subscriber = Depends(require_active_subscriber),
    db: AsyncSession = Depends(get_db),
):
    """Add series to favorites."""
    try:
        await favorite_service.add_favorite(db, subscriber.id, series_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    return {"status": "ok"}


@router.delete("/{series_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_favorite(
    series_id: uuid.UUID,
    subscriber: Subscriber = Depends(require_active_subscriber),
    db: AsyncSession = Depends(get_db),
):
    """Remove series from favorites."""
    await favorite_service.remove_favorite(db, subscriber.id, series_id)
