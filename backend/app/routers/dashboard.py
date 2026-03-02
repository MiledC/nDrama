"""Dashboard stats and recent activity endpoints."""

from datetime import UTC, date, datetime
from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.coin_transaction import CoinTransaction
from app.models.episode import Episode
from app.models.series import Series, SeriesStatus
from app.models.subscriber import Subscriber, SubscriberStatus
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

    # Subscriber stats
    subscriber_total = (
        await db.execute(select(func.count(Subscriber.id)))
    ).scalar() or 0
    subscriber_active = (
        await db.execute(
            select(func.count(Subscriber.id)).where(
                Subscriber.status == SubscriberStatus.active
            )
        )
    ).scalar() or 0
    subscriber_anonymous = (
        await db.execute(
            select(func.count(Subscriber.id)).where(
                Subscriber.status == SubscriberStatus.anonymous
            )
        )
    ).scalar() or 0
    subscriber_suspended = (
        await db.execute(
            select(func.count(Subscriber.id)).where(
                Subscriber.status.in_([SubscriberStatus.suspended, SubscriberStatus.banned])
            )
        )
    ).scalar() or 0

    # Coin economy stats
    coins_in_circulation = (
        await db.execute(select(func.coalesce(func.sum(Subscriber.coin_balance), 0)))
    ).scalar() or 0
    today_start = datetime.combine(date.today(), datetime.min.time(), tzinfo=UTC)
    transactions_today = (
        await db.execute(
            select(func.count(CoinTransaction.id)).where(
                CoinTransaction.created_at >= today_start
            )
        )
    ).scalar() or 0

    return DashboardStats(
        series_count=series_count,
        episode_count=episode_count,
        user_count=user_count,
        published_series_count=published_series_count,
        subscriber_total=subscriber_total,
        subscriber_active=subscriber_active,
        subscriber_anonymous=subscriber_anonymous,
        subscriber_suspended=subscriber_suspended,
        coins_in_circulation=coins_in_circulation,
        transactions_today=transactions_today,
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
