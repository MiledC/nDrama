"""Dashboard stats and recent activity endpoints."""

from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.episode import Episode
from app.models.series import Series, SeriesStatus
from app.models.user import User
from app.schemas.dashboard import DashboardRecent, DashboardStats

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/stats", response_model=DashboardStats)
async def get_stats(
    _user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Return aggregate counts for the dashboard."""
    series_count = (await db.execute(select(func.count(Series.id)))).scalar() or 0
    episode_count = (await db.execute(select(func.count(Episode.id)))).scalar() or 0
    user_count = (await db.execute(select(func.count(User.id)))).scalar() or 0
    published_series_count = (
        await db.execute(
            select(func.count(Series.id)).where(Series.status == SeriesStatus.published)
        )
    ).scalar() or 0

    return DashboardStats(
        series_count=series_count,
        episode_count=episode_count,
        user_count=user_count,
        published_series_count=published_series_count,
    )


@router.get("/recent", response_model=DashboardRecent)
async def get_recent(
    _user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Return the 10 most recently updated series."""
    result = await db.execute(
        select(Series).order_by(Series.updated_at.desc()).limit(10)
    )
    series = result.scalars().all()
    return DashboardRecent(series=series)
