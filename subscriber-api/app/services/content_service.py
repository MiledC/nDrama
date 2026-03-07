import uuid
from datetime import UTC, datetime, timedelta

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.audio_track import AudioTrack
from app.models.category import Category
from app.models.episode import Episode, EpisodeStatus
from app.models.episode_unlock import EpisodeUnlock
from app.models.home_section import HomeSection
from app.models.series import Series, SeriesStatus
from app.models.subtitle import Subtitle
from app.models.watch_history import WatchHistory


async def list_series(
    db: AsyncSession,
    *,
    offset: int = 0,
    limit: int = 20,
    search: str | None = None,
    category_id: uuid.UUID | None = None,
) -> tuple[list[Series], int]:
    """List published series with pagination."""
    query = select(Series).where(Series.status == SeriesStatus.published)

    if search:
        pattern = f"%{search}%"
        query = query.where(Series.title.ilike(pattern))

    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    # Paginate
    query = query.order_by(Series.created_at.desc()).offset(offset).limit(limit)
    result = await db.execute(query)
    items = list(result.scalars().all())

    return items, total


async def get_series(
    db: AsyncSession,
    series_id: uuid.UUID,
    subscriber_id: uuid.UUID,
) -> tuple[Series | None, list[dict]]:
    """Get series with episode list including unlock status."""
    result = await db.execute(
        select(Series).where(
            Series.id == series_id,
            Series.status == SeriesStatus.published,
        )
    )
    series = result.scalar_one_or_none()
    if series is None:
        return None, []

    # Get episodes
    ep_result = await db.execute(
        select(Episode)
        .where(
            Episode.series_id == series_id,
            Episode.status == EpisodeStatus.published,
        )
        .order_by(Episode.episode_number)
    )
    episodes = list(ep_result.scalars().all())

    # Get unlock status for all episodes
    unlock_result = await db.execute(
        select(EpisodeUnlock.episode_id).where(
            EpisodeUnlock.subscriber_id == subscriber_id,
            EpisodeUnlock.episode_id.in_([e.id for e in episodes]),
        )
    )
    unlocked_ids = {row[0] for row in unlock_result.all()}

    episode_items = []
    for ep in episodes:
        is_free = ep.episode_number <= series.free_episode_count
        episode_items.append({
            "id": ep.id,
            "title": ep.title,
            "episode_number": ep.episode_number,
            "thumbnail_url": ep.thumbnail_url,
            "is_free": is_free,
            "is_unlocked": is_free or ep.id in unlocked_ids,
            "duration_seconds": ep.duration_seconds,
        })

    return series, episode_items


async def list_episodes(
    db: AsyncSession,
    series_id: uuid.UUID,
    subscriber_id: uuid.UUID,
    *,
    offset: int = 0,
    limit: int = 20,
) -> tuple[list[dict], int]:
    """List episodes for a series with unlock status."""
    # Get series for free_episode_count
    series_result = await db.execute(
        select(Series).where(
            Series.id == series_id,
            Series.status == SeriesStatus.published,
        )
    )
    series = series_result.scalar_one_or_none()
    if series is None:
        return [], 0

    # Count
    count_query = select(func.count()).where(
        Episode.series_id == series_id,
        Episode.status == EpisodeStatus.published,
    )
    total = (await db.execute(count_query)).scalar() or 0

    # Episodes
    ep_result = await db.execute(
        select(Episode)
        .where(
            Episode.series_id == series_id,
            Episode.status == EpisodeStatus.published,
        )
        .order_by(Episode.episode_number)
        .offset(offset)
        .limit(limit)
    )
    episodes = list(ep_result.scalars().all())

    # Unlocks
    unlock_result = await db.execute(
        select(EpisodeUnlock.episode_id).where(
            EpisodeUnlock.subscriber_id == subscriber_id,
            EpisodeUnlock.episode_id.in_([e.id for e in episodes]),
        )
    )
    unlocked_ids = {row[0] for row in unlock_result.all()}

    items = []
    for ep in episodes:
        is_free = ep.episode_number <= series.free_episode_count
        items.append({
            "id": ep.id,
            "title": ep.title,
            "episode_number": ep.episode_number,
            "thumbnail_url": ep.thumbnail_url,
            "is_free": is_free,
            "is_unlocked": is_free or ep.id in unlocked_ids,
            "duration_seconds": ep.duration_seconds,
        })

    return items, total


async def get_episode(
    db: AsyncSession,
    episode_id: uuid.UUID,
    subscriber_id: uuid.UUID,
) -> dict | None:
    """Get episode detail with stream URL if unlocked/free."""
    result = await db.execute(
        select(Episode)
        .options(selectinload(Episode.series))
        .where(
            Episode.id == episode_id,
            Episode.status == EpisodeStatus.published,
        )
    )
    episode = result.scalar_one_or_none()
    if episode is None:
        return None

    series = episode.series
    is_free = episode.episode_number <= series.free_episode_count

    # Check unlock
    unlock_result = await db.execute(
        select(EpisodeUnlock).where(
            EpisodeUnlock.subscriber_id == subscriber_id,
            EpisodeUnlock.episode_id == episode_id,
        )
    )
    is_unlocked = unlock_result.scalar_one_or_none() is not None
    locked = not is_free and not is_unlocked

    # Get audio tracks and subtitles only if accessible
    audio_tracks = []
    subtitles = []
    playback_url = None

    if not locked:
        at_result = await db.execute(
            select(AudioTrack).where(AudioTrack.episode_id == episode_id)
        )
        audio_tracks = [
            {
                "id": at.id,
                "language_code": at.language_code,
                "label": at.label,
                "file_url": at.file_url,
                "is_default": at.is_default,
            }
            for at in at_result.scalars().all()
        ]

        st_result = await db.execute(
            select(Subtitle).where(Subtitle.episode_id == episode_id)
        )
        subtitles = [
            {
                "id": st.id,
                "language_code": st.language_code,
                "label": st.label,
                "file_url": st.file_url,
                "format": st.format.value,
                "is_default": st.is_default,
            }
            for st in st_result.scalars().all()
        ]

        if episode.video_playback_id:
            playback_url = f"https://stream.mux.com/{episode.video_playback_id}.m3u8"

    return {
        "id": episode.id,
        "title": episode.title,
        "description": episode.description,
        "episode_number": episode.episode_number,
        "thumbnail_url": episode.thumbnail_url,
        "duration_seconds": episode.duration_seconds,
        "is_free": is_free,
        "is_unlocked": is_free or is_unlocked,
        "locked": locked,
        "playback_url": playback_url,
        "audio_tracks": audio_tracks,
        "subtitles": subtitles,
        "series_id": series.id,
        "coin_cost": series.coin_cost_per_episode,
    }


async def get_category_tree(db: AsyncSession) -> list[dict]:
    """Get category tree (top-level categories with children loaded)."""
    # Load all categories at once to avoid lazy-load issues
    result = await db.execute(
        select(Category).order_by(Category.sort_order)
    )
    all_categories = list(result.scalars().all())

    # Build tree in memory
    roots = []
    children_map: dict[uuid.UUID, list] = {}

    for cat in all_categories:
        if cat.parent_id is None:
            roots.append(cat)
        else:
            children_map.setdefault(cat.parent_id, []).append(cat)

    def _to_dict(cat: Category) -> dict:
        return {
            "id": cat.id,
            "name": cat.name,
            "icon": cat.icon,
            "description": cat.description,
            "sort_order": cat.sort_order,
            "children": [_to_dict(c) for c in children_map.get(cat.id, [])],
        }

    return [_to_dict(r) for r in roots]


async def get_category_series(
    db: AsyncSession,
    category_id: uuid.UUID,
    *,
    offset: int = 0,
    limit: int = 20,
) -> tuple[list[Series], int]:
    """Get published series in a category (matches by tags)."""
    # For now, return published series — category-tag matching
    # can be refined later based on category's match_mode
    query = select(Series).where(Series.status == SeriesStatus.published)

    count_query = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_query)).scalar() or 0

    query = query.order_by(Series.created_at.desc()).offset(offset).limit(limit)
    result = await db.execute(query)
    items = list(result.scalars().all())

    return items, total


async def get_home_sections(db: AsyncSession) -> list[dict]:
    """Get active home sections with resolved series data."""
    result = await db.execute(
        select(HomeSection)
        .where(HomeSection.is_active.is_(True))
        .order_by(HomeSection.sort_order, HomeSection.created_at)
    )
    sections = list(result.scalars().all())

    # Batch-query episode counts for all published series
    ep_count_result = await db.execute(
        select(
            Episode.series_id,
            func.count(Episode.id).label("ep_count"),
        )
        .where(Episode.status == EpisodeStatus.published)
        .group_by(Episode.series_id)
    )
    episode_counts = {row[0]: row[1] for row in ep_count_result.all()}

    resolved = []
    for section in sections:
        items = await _resolve_section(db, section, episode_counts)
        resolved.append({
            "id": section.id,
            "type": section.type,
            "title": section.title,
            "items": items,
        })

    return resolved


async def _resolve_section(
    db: AsyncSession, section: HomeSection, episode_counts: dict,
) -> list[dict]:
    """Resolve a home section's config into series data."""
    config = section.config or {}
    section_type = section.type

    if section_type == "featured":
        return await _resolve_featured(db, config, episode_counts)
    elif section_type == "new_releases":
        return await _resolve_new_releases(db, config, episode_counts)
    elif section_type == "trending":
        return await _resolve_trending(db, config, episode_counts)
    elif section_type == "category":
        return await _resolve_category(db, config, episode_counts)
    return []


async def _resolve_featured(db: AsyncSession, config: dict, episode_counts: dict) -> list[dict]:
    """Fetch series by explicit IDs."""
    series_ids = config.get("series_ids", [])
    if not series_ids:
        return []

    # Convert string IDs to UUIDs for the query
    uuid_ids = [uuid.UUID(str(sid)) for sid in series_ids]

    result = await db.execute(
        select(Series).where(
            Series.id.in_(uuid_ids),
            Series.status == SeriesStatus.published,
        )
    )
    series_list = list(result.scalars().all())

    # Preserve the admin-defined order
    order_map = {str(sid): i for i, sid in enumerate(series_ids)}
    series_list.sort(key=lambda s: order_map.get(str(s.id), 999))

    return [_series_to_dict(s, episode_counts) for s in series_list]


async def _resolve_new_releases(db: AsyncSession, config: dict, episode_counts: dict) -> list[dict]:
    """Query recently published series."""
    days = config.get("days", 14)
    limit = config.get("limit", 10)
    cutoff = datetime.now(UTC) - timedelta(days=days)

    result = await db.execute(
        select(Series)
        .where(
            Series.status == SeriesStatus.published,
            Series.created_at >= cutoff,
        )
        .order_by(Series.created_at.desc())
        .limit(limit)
    )
    return [_series_to_dict(s, episode_counts) for s in result.scalars().all()]


async def _resolve_trending(db: AsyncSession, config: dict, episode_counts: dict) -> list[dict]:
    """Query most-watched series in recent days."""
    days = config.get("days", 7)
    limit = config.get("limit", 10)
    cutoff = datetime.now(UTC) - timedelta(days=days)

    result = await db.execute(
        select(
            Episode.series_id,
            func.count(WatchHistory.id).label("watch_count"),
        )
        .join(WatchHistory, WatchHistory.episode_id == Episode.id)
        .join(Series, Series.id == Episode.series_id)
        .where(
            WatchHistory.last_watched_at >= cutoff,
            Series.status == SeriesStatus.published,
        )
        .group_by(Episode.series_id)
        .order_by(func.count(WatchHistory.id).desc())
        .limit(limit)
    )
    trending_ids = [row[0] for row in result.all()]

    if not trending_ids:
        return []

    series_result = await db.execute(
        select(Series).where(Series.id.in_(trending_ids))
    )
    series_map = {s.id: s for s in series_result.scalars().all()}

    return [
        _series_to_dict(series_map[sid], episode_counts)
        for sid in trending_ids if sid in series_map
    ]


async def _resolve_category(db: AsyncSession, config: dict, episode_counts: dict) -> list[dict]:
    """Query published series in a category."""
    category_id = config.get("category_id")
    limit = config.get("limit", 10)
    if not category_id:
        return []

    items, _ = await get_category_series(db, uuid.UUID(str(category_id)), limit=limit)
    return [_series_to_dict(s, episode_counts) for s in items]


def _series_to_dict(series: Series, episode_counts: dict | None = None) -> dict:
    """Convert a Series model to a dict for home section response."""
    return {
        "id": str(series.id),
        "title": series.title,
        "description": series.description,
        "thumbnail_url": series.thumbnail_url,
        "free_episode_count": series.free_episode_count,
        "coin_cost_per_episode": series.coin_cost_per_episode,
        "episode_count": (episode_counts or {}).get(series.id, 0),
    }
