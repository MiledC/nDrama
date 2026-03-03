import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.favorite import Favorite
from app.models.series import Series, SeriesStatus


async def list_favorites(
    db: AsyncSession,
    subscriber_id: uuid.UUID,
    *,
    offset: int = 0,
    limit: int = 20,
) -> tuple[list[dict], int]:
    """List favorited series, newest first."""
    count_query = select(func.count()).where(
        Favorite.subscriber_id == subscriber_id
    )
    total = (await db.execute(count_query)).scalar() or 0

    result = await db.execute(
        select(Favorite, Series)
        .join(Series, Favorite.series_id == Series.id)
        .where(
            Favorite.subscriber_id == subscriber_id,
            Series.status == SeriesStatus.published,
        )
        .order_by(Favorite.created_at.desc())
        .offset(offset)
        .limit(limit)
    )
    rows = result.all()

    items = []
    for fav, series in rows:
        items.append({
            "id": series.id,
            "title": series.title,
            "description": series.description,
            "thumbnail_url": series.thumbnail_url,
            "tags": series.tags,
            "favorited_at": fav.created_at,
        })

    return items, total


async def add_favorite(
    db: AsyncSession,
    subscriber_id: uuid.UUID,
    series_id: uuid.UUID,
) -> None:
    """Add series to favorites (idempotent)."""
    # Check series exists and is published
    result = await db.execute(
        select(Series).where(
            Series.id == series_id,
            Series.status == SeriesStatus.published,
        )
    )
    if result.scalar_one_or_none() is None:
        raise ValueError("Series not found")

    # Check if already favorited
    existing = await db.execute(
        select(Favorite).where(
            Favorite.subscriber_id == subscriber_id,
            Favorite.series_id == series_id,
        )
    )
    if existing.scalar_one_or_none() is not None:
        return  # Already favorited — idempotent

    fav = Favorite(subscriber_id=subscriber_id, series_id=series_id)
    db.add(fav)
    await db.commit()


async def remove_favorite(
    db: AsyncSession,
    subscriber_id: uuid.UUID,
    series_id: uuid.UUID,
) -> None:
    """Remove series from favorites (idempotent)."""
    result = await db.execute(
        select(Favorite).where(
            Favorite.subscriber_id == subscriber_id,
            Favorite.series_id == series_id,
        )
    )
    fav = result.scalar_one_or_none()
    if fav is not None:
        await db.delete(fav)
        await db.commit()
