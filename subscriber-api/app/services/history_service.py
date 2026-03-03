import uuid
from datetime import UTC, datetime

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.episode import Episode
from app.models.series import Series
from app.models.watch_history import WatchHistory


async def report_progress(
    db: AsyncSession,
    subscriber_id: uuid.UUID,
    episode_id: uuid.UUID,
    progress_seconds: int,
) -> WatchHistory:
    """Upsert watch progress for a subscriber/episode pair."""
    result = await db.execute(
        select(WatchHistory).where(
            WatchHistory.subscriber_id == subscriber_id,
            WatchHistory.episode_id == episode_id,
        )
    )
    history = result.scalar_one_or_none()

    if history is None:
        # Get episode duration for auto-completion detection
        ep_result = await db.execute(
            select(Episode.duration_seconds).where(Episode.id == episode_id)
        )
        duration = ep_result.scalar_one_or_none()

        history = WatchHistory(
            subscriber_id=subscriber_id,
            episode_id=episode_id,
            progress_seconds=progress_seconds,
            duration_seconds=duration,
            last_watched_at=datetime.now(UTC),
        )
        db.add(history)
    else:
        history.progress_seconds = progress_seconds
        history.last_watched_at = datetime.now(UTC)

        # Cache duration if we didn't have it
        if history.duration_seconds is None:
            ep_result = await db.execute(
                select(Episode.duration_seconds).where(Episode.id == episode_id)
            )
            history.duration_seconds = ep_result.scalar_one_or_none()

    # Auto-complete at 90%
    if (
        history.duration_seconds
        and history.duration_seconds > 0
        and progress_seconds >= history.duration_seconds * 0.9
    ):
        history.completed = True

    await db.commit()
    await db.refresh(history)
    return history


async def get_continue_watching(
    db: AsyncSession,
    subscriber_id: uuid.UUID,
    *,
    offset: int = 0,
    limit: int = 20,
) -> tuple[list[dict], int]:
    """Return recently watched, incomplete episodes."""
    count_query = select(func.count()).where(
        WatchHistory.subscriber_id == subscriber_id,
        WatchHistory.completed.is_(False),
    )
    total = (await db.execute(count_query)).scalar() or 0

    result = await db.execute(
        select(WatchHistory, Episode, Series)
        .join(Episode, WatchHistory.episode_id == Episode.id)
        .join(Series, Episode.series_id == Series.id)
        .where(
            WatchHistory.subscriber_id == subscriber_id,
            WatchHistory.completed.is_(False),
        )
        .order_by(WatchHistory.last_watched_at.desc())
        .offset(offset)
        .limit(limit)
    )
    rows = result.all()

    items = []
    for wh, episode, series in rows:
        items.append({
            "episode_id": episode.id,
            "episode_title": episode.title,
            "series_id": series.id,
            "series_title": series.title,
            "thumbnail_url": episode.thumbnail_url,
            "progress_seconds": wh.progress_seconds,
            "duration_seconds": wh.duration_seconds,
            "completed": wh.completed,
            "last_watched_at": wh.last_watched_at,
        })

    return items, total
