import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.session_auth import get_current_subscriber
from app.models.subscriber import Subscriber
from app.schemas.content import CategoryItem, PaginatedResponse, SeriesListItem
from app.services import content_service

router = APIRouter(prefix="/api/categories", tags=["categories"])


@router.get("/tree", response_model=list[CategoryItem])
async def get_category_tree(
    _subscriber: Subscriber = Depends(get_current_subscriber),
    db: AsyncSession = Depends(get_db),
):
    """Get category tree."""
    categories = await content_service.get_category_tree(db)
    return [CategoryItem(**c) for c in categories]


@router.get(
    "/{category_id}/series",
    response_model=PaginatedResponse[SeriesListItem],
)
async def get_category_series(
    category_id: uuid.UUID,
    offset: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    _subscriber: Subscriber = Depends(get_current_subscriber),
    db: AsyncSession = Depends(get_db),
):
    """Get published series in a category."""
    items, total = await content_service.get_category_series(
        db, category_id, offset=offset, limit=limit
    )
    return PaginatedResponse(
        items=[SeriesListItem.model_validate(s) for s in items],
        total=total,
        offset=offset,
        limit=limit,
    )
