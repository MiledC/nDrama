"""Resolve home section config into series preview data."""

import uuid
from datetime import UTC, datetime, timedelta

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.home_section import HomeSection
from app.models.series import Series


async def resolve_section_preview(
    db: AsyncSession, section: HomeSection
) -> list[dict]:
    """Resolve a home section's config into series preview data."""
    config = section.config or {}
    section_type = section.type

    if section_type == "featured":
        return await _resolve_featured(db, config)
    elif section_type == "new_releases":
        return await _resolve_new_releases(db, config)
    elif section_type == "trending":
        return await _resolve_trending(db, config)
    elif section_type == "category":
        return await _resolve_category(db, config)
    return []


async def _resolve_featured(db: AsyncSession, config: dict) -> list[dict]:
    """Resolve featured section by fetching specific series IDs."""
    series_ids = config.get("series_ids", [])
    if not series_ids:
        return []

    # Convert string IDs to UUIDs
    uuid_ids = [uuid.UUID(str(sid)) for sid in series_ids]

    result = await db.execute(
        select(Series).where(
            Series.id.in_(uuid_ids),
            Series.status == "published",
        )
    )
    series_list = list(result.scalars().all())

    # Preserve the order from config
    order_map = {str(sid): i for i, sid in enumerate(series_ids)}
    series_list.sort(key=lambda s: order_map.get(str(s.id), 999))

    return [_series_to_preview(s) for s in series_list]


async def _resolve_new_releases(db: AsyncSession, config: dict) -> list[dict]:
    """Resolve new releases by fetching recently created series."""
    days = config.get("days", 14)
    limit = config.get("limit", 10)
    cutoff = datetime.now(UTC) - timedelta(days=days)

    result = await db.execute(
        select(Series)
        .where(Series.status == "published", Series.created_at >= cutoff)
        .order_by(Series.created_at.desc())
        .limit(limit)
    )
    return [_series_to_preview(s) for s in result.scalars().all()]


async def _resolve_trending(db: AsyncSession, config: dict) -> list[dict]:
    """Resolve trending series based on recent watch history."""
    from app.models.episode import Episode
    from app.models.watch_history import WatchHistory

    days = config.get("days", 7)
    limit = config.get("limit", 10)
    cutoff = datetime.now(UTC) - timedelta(days=days)

    # Find series with most watches in the last N days
    result = await db.execute(
        select(Episode.series_id, func.count(WatchHistory.id).label("cnt"))
        .join(WatchHistory, WatchHistory.episode_id == Episode.id)
        .join(Series, Series.id == Episode.series_id)
        .where(WatchHistory.last_watched_at >= cutoff, Series.status == "published")
        .group_by(Episode.series_id)
        .order_by(func.count(WatchHistory.id).desc())
        .limit(limit)
    )
    trending_ids = [row[0] for row in result.all()]

    if not trending_ids:
        return []

    # Fetch the series details
    series_result = await db.execute(
        select(Series).where(Series.id.in_(trending_ids))
    )
    series_map = {s.id: s for s in series_result.scalars().all()}

    # Preserve trending order
    return [_series_to_preview(series_map[sid]) for sid in trending_ids if sid in series_map]


async def _resolve_category(db: AsyncSession, config: dict) -> list[dict]:
    """Resolve category section by fetching series in a category.

    Note: Category filtering is simplified for now since category-series
    relationships aren't fully implemented yet.
    """
    category_id = config.get("category_id")
    limit = config.get("limit", 10)

    if not category_id:
        return []

    # For now, just return recent published series
    # TODO: Filter by actual category when category-series relationship is implemented
    result = await db.execute(
        select(Series)
        .where(Series.status == "published")
        .order_by(Series.created_at.desc())
        .limit(limit)
    )
    return [_series_to_preview(s) for s in result.scalars().all()]


def _series_to_preview(series: Series) -> dict:
    """Convert a Series model to a preview dict."""
    return {
        "id": str(series.id),
        "title": series.title,
        "thumbnail_url": series.thumbnail_url,
    }
