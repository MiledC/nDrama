"""Global search endpoint for series and episodes."""

from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.episode import Episode
from app.models.series import Series
from app.models.user import User
from app.schemas.search import SearchResponse, SearchResultItem

router = APIRouter(prefix="/api/search", tags=["search"])


@router.get("", response_model=SearchResponse)
async def search(
    _user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    q: str = Query(..., min_length=1, description="Search term"),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
):
    """Search across series and episodes by title/description."""
    pattern = f"%{q}%"

    # Count series matches
    series_count_result = await db.execute(
        select(func.count(Series.id)).where(
            (Series.title.ilike(pattern)) | (Series.description.ilike(pattern))
        )
    )
    series_total = series_count_result.scalar() or 0

    # Count episode matches
    episode_count_result = await db.execute(
        select(func.count(Episode.id)).where(
            (Episode.title.ilike(pattern)) | (Episode.description.ilike(pattern))
        )
    )
    episode_total = episode_count_result.scalar() or 0

    total = series_total + episode_total

    # Fetch series matches
    series_result = await db.execute(
        select(Series)
        .where((Series.title.ilike(pattern)) | (Series.description.ilike(pattern)))
        .limit(per_page)
        .offset((page - 1) * per_page)
    )
    series_rows = series_result.scalars().all()

    # Fetch episode matches (with series title via join)
    remaining = per_page - len(series_rows)
    episode_offset = max(0, (page - 1) * per_page - series_total)

    episodes_with_series = []
    if remaining > 0:
        ep_result = await db.execute(
            select(Episode, Series.title.label("series_title"))
            .join(Series, Episode.series_id == Series.id)
            .where(
                (Episode.title.ilike(pattern)) | (Episode.description.ilike(pattern))
            )
            .limit(remaining)
            .offset(episode_offset)
        )
        episodes_with_series = ep_result.all()

    # Build results
    results: list[SearchResultItem] = []

    for s in series_rows:
        results.append(
            SearchResultItem(
                id=s.id,
                type="series",
                title=s.title,
                description=s.description,
                status=s.status.value if s.status else None,
                thumbnail_url=s.thumbnail_url,
            )
        )

    for row in episodes_with_series:
        ep = row[0]
        series_title = row[1]
        results.append(
            SearchResultItem(
                id=ep.id,
                type="episode",
                title=ep.title,
                description=ep.description,
                series_id=ep.series_id,
                series_title=series_title,
                episode_number=ep.episode_number,
            )
        )

    return SearchResponse(results=results, total=total)
