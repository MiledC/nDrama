import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.session_auth import get_current_subscriber, require_active_subscriber
from app.models.subscriber import Subscriber
from app.schemas.content import PaginatedResponse
from app.schemas.history import ReportProgressRequest, WatchHistoryItem
from app.services import history_service

router = APIRouter(prefix="/api/history", tags=["history"])


@router.get("", response_model=PaginatedResponse[WatchHistoryItem])
async def get_continue_watching(
    offset: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    subscriber: Subscriber = Depends(require_active_subscriber),
    db: AsyncSession = Depends(get_db),
):
    """Continue watching list — active subscribers only."""
    items, total = await history_service.get_continue_watching(
        db, subscriber.id, offset=offset, limit=limit
    )
    return PaginatedResponse(
        items=[WatchHistoryItem(**item) for item in items],
        total=total,
        offset=offset,
        limit=limit,
    )


@router.post("/{episode_id}", status_code=status.HTTP_200_OK)
async def report_progress(
    episode_id: uuid.UUID,
    request: ReportProgressRequest,
    subscriber: Subscriber = Depends(get_current_subscriber),
    db: AsyncSession = Depends(get_db),
):
    """Report playback progress — any authenticated subscriber."""
    await history_service.report_progress(
        db, subscriber.id, episode_id, request.progress_seconds
    )
    return {"status": "ok"}
