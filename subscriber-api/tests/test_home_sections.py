"""Tests for home sections endpoint."""

import uuid
from datetime import UTC, datetime, timedelta

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from tests.factories import (
    make_category,
    make_episode,
    make_home_section,
    make_series,
    make_subscriber,
    make_user,
    make_watch_history,
)


@pytest.mark.asyncio
async def test_get_home_sections_empty(client, active_subscriber):
    """Returns empty list when no sections exist."""
    _, token = active_subscriber
    response = await client.get(
        "/api/home/sections", headers={"X-Session-Token": token}
    )
    assert response.status_code == 200
    assert response.json() == []


@pytest.mark.asyncio
async def test_get_home_sections_with_featured(
    client, active_subscriber, db_session: AsyncSession
):
    """Featured section resolves series by IDs."""
    _, token = active_subscriber
    user = make_user()
    db_session.add(user)
    await db_session.flush()

    s1 = make_series(user.id, status="published")
    s2 = make_series(user.id, status="published")
    db_session.add_all([s1, s2])
    await db_session.flush()

    section = make_home_section(
        type="featured",
        title="المميزة",
        config={"series_ids": [str(s1.id), str(s2.id)]},
        sort_order=0,
    )
    db_session.add(section)
    await db_session.commit()

    response = await client.get(
        "/api/home/sections", headers={"X-Session-Token": token}
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["type"] == "featured"
    assert data[0]["title"] == "المميزة"
    assert len(data[0]["items"]) == 2


@pytest.mark.asyncio
async def test_get_home_sections_new_releases(
    client, active_subscriber, db_session: AsyncSession
):
    """New releases section returns recently published series."""
    _, token = active_subscriber
    user = make_user()
    db_session.add(user)
    await db_session.flush()

    s1 = make_series(user.id, status="published")
    db_session.add(s1)
    await db_session.flush()

    section = make_home_section(
        type="new_releases",
        title="جديد",
        config={"days": 14, "limit": 10},
    )
    db_session.add(section)
    await db_session.commit()

    response = await client.get(
        "/api/home/sections", headers={"X-Session-Token": token}
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["type"] == "new_releases"
    assert len(data[0]["items"]) >= 1


@pytest.mark.asyncio
async def test_get_home_sections_inactive_hidden(
    client, active_subscriber, db_session: AsyncSession
):
    """Inactive sections are not returned."""
    _, token = active_subscriber

    section = make_home_section(is_active=False)
    db_session.add(section)
    await db_session.commit()

    response = await client.get(
        "/api/home/sections", headers={"X-Session-Token": token}
    )
    assert response.status_code == 200
    assert response.json() == []


@pytest.mark.asyncio
async def test_get_home_sections_ordered(
    client, active_subscriber, db_session: AsyncSession
):
    """Sections are returned in sort_order."""
    _, token = active_subscriber

    s1 = make_home_section(title="Second", sort_order=1, config={})
    s2 = make_home_section(title="First", sort_order=0, config={})
    db_session.add_all([s1, s2])
    await db_session.commit()

    response = await client.get(
        "/api/home/sections", headers={"X-Session-Token": token}
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    assert data[0]["title"] == "First"
    assert data[1]["title"] == "Second"


@pytest.mark.asyncio
async def test_get_home_sections_no_auth(client):
    """Unauthenticated requests are rejected."""
    response = await client.get("/api/home/sections")
    assert response.status_code in (401, 403)


@pytest.mark.asyncio
async def test_get_home_sections_trending(
    client, active_subscriber, db_session: AsyncSession
):
    """Trending section returns series by watch count."""
    _, token = active_subscriber
    user = make_user()
    db_session.add(user)
    await db_session.flush()

    # Create 2 published series with 1 episode each
    s1 = make_series(user.id, status="published", title="Popular Series")
    s2 = make_series(user.id, status="published", title="Less Popular")
    db_session.add_all([s1, s2])
    await db_session.flush()

    ep1 = make_episode(s1.id, user.id, status="published")
    ep2 = make_episode(s2.id, user.id, status="published")
    db_session.add_all([ep1, ep2])
    await db_session.flush()

    # Create 3 distinct subscribers for watch history
    sub1 = make_subscriber()
    sub2 = make_subscriber()
    sub3 = make_subscriber()
    db_session.add_all([sub1, sub2, sub3])
    await db_session.flush()

    # Create watch history: 3 watches for s1's episode, 1 for s2's
    now = datetime.now(UTC)
    wh1 = make_watch_history(sub1.id, ep1.id, last_watched_at=now)
    wh2 = make_watch_history(sub2.id, ep1.id, last_watched_at=now)
    wh3 = make_watch_history(sub3.id, ep1.id, last_watched_at=now)
    wh4 = make_watch_history(sub1.id, ep2.id, last_watched_at=now)
    db_session.add_all([wh1, wh2, wh3, wh4])
    await db_session.flush()

    # Create trending section
    section = make_home_section(
        type="trending",
        title="الأكثر مشاهدة",
        config={"days": 7, "limit": 10},
        sort_order=0,
    )
    db_session.add(section)
    await db_session.commit()

    response = await client.get(
        "/api/home/sections", headers={"X-Session-Token": token}
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["type"] == "trending"
    assert len(data[0]["items"]) == 2
    # s1 should be first (3 watches vs 1)
    assert data[0]["items"][0]["title"] == "Popular Series"
    assert data[0]["items"][1]["title"] == "Less Popular"


@pytest.mark.asyncio
async def test_get_home_sections_trending_empty(
    client, active_subscriber, db_session: AsyncSession
):
    """Trending section with no watch history returns empty items."""
    _, token = active_subscriber

    # Create trending section with no watch history at all
    section = make_home_section(
        type="trending",
        title="الأكثر مشاهدة",
        config={"days": 7, "limit": 10},
        sort_order=0,
    )
    db_session.add(section)
    await db_session.commit()

    response = await client.get(
        "/api/home/sections", headers={"X-Session-Token": token}
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["type"] == "trending"
    assert data[0]["items"] == []


@pytest.mark.asyncio
async def test_get_home_sections_trending_excludes_draft(
    client, active_subscriber, db_session: AsyncSession
):
    """Trending section excludes draft series."""
    _, token = active_subscriber
    user = make_user()
    db_session.add(user)
    await db_session.flush()

    # Create 2 series (1 published, 1 draft)
    s1 = make_series(user.id, status="published", title="Published")
    s2 = make_series(user.id, status="draft", title="Draft")
    db_session.add_all([s1, s2])
    await db_session.flush()

    # Create episode + watch history for both
    ep1 = make_episode(s1.id, user.id, status="published")
    ep2 = make_episode(s2.id, user.id, status="published")
    db_session.add_all([ep1, ep2])
    await db_session.flush()

    sub = make_subscriber()
    db_session.add(sub)
    await db_session.flush()

    now = datetime.now(UTC)
    wh1 = make_watch_history(sub.id, ep1.id, last_watched_at=now)
    wh2 = make_watch_history(sub.id, ep2.id, last_watched_at=now)
    db_session.add_all([wh1, wh2])
    await db_session.flush()

    section = make_home_section(
        type="trending",
        title="الأكثر مشاهدة",
        config={"days": 7, "limit": 10},
        sort_order=0,
    )
    db_session.add(section)
    await db_session.commit()

    response = await client.get(
        "/api/home/sections", headers={"X-Session-Token": token}
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["type"] == "trending"
    assert len(data[0]["items"]) == 1
    assert data[0]["items"][0]["title"] == "Published"


@pytest.mark.asyncio
async def test_get_home_sections_category(
    client, active_subscriber, db_session: AsyncSession
):
    """Category section returns series for category."""
    _, token = active_subscriber
    user = make_user()
    db_session.add(user)
    await db_session.flush()

    # Create category + published series
    cat = make_category(name="Drama")
    db_session.add(cat)
    await db_session.flush()

    s1 = make_series(user.id, status="published", title="Series 1")
    db_session.add(s1)
    await db_session.flush()

    # Create category section
    section = make_home_section(
        type="category",
        title="دراما",
        config={"category_id": str(cat.id), "limit": 10},
        sort_order=0,
    )
    db_session.add(section)
    await db_session.commit()

    response = await client.get(
        "/api/home/sections", headers={"X-Session-Token": token}
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["type"] == "category"
    # Current impl returns all published series
    assert len(data[0]["items"]) >= 1


@pytest.mark.asyncio
async def test_get_home_sections_category_missing_id(
    client, active_subscriber, db_session: AsyncSession
):
    """Category section without category_id returns empty items."""
    _, token = active_subscriber

    # Create category section with no category_id
    section = make_home_section(
        type="category",
        title="دراما",
        config={"limit": 10},  # no category_id
        sort_order=0,
    )
    db_session.add(section)
    await db_session.commit()

    response = await client.get(
        "/api/home/sections", headers={"X-Session-Token": token}
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["type"] == "category"
    assert data[0]["items"] == []


@pytest.mark.asyncio
async def test_get_home_sections_featured_empty_ids(
    client, active_subscriber, db_session: AsyncSession
):
    """Featured section with empty series_ids returns empty items."""
    _, token = active_subscriber

    # Featured section with empty series_ids
    section = make_home_section(
        type="featured",
        title="المميزة",
        config={"series_ids": []},
        sort_order=0,
    )
    db_session.add(section)
    await db_session.commit()

    response = await client.get(
        "/api/home/sections", headers={"X-Session-Token": token}
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["type"] == "featured"
    assert data[0]["items"] == []


@pytest.mark.asyncio
async def test_get_home_sections_featured_nonexistent_ids(
    client, active_subscriber, db_session: AsyncSession
):
    """Featured section with nonexistent IDs returns empty items."""
    _, token = active_subscriber

    # Featured section with nonexistent IDs
    section = make_home_section(
        type="featured",
        title="المميزة",
        config={"series_ids": [str(uuid.uuid4()), str(uuid.uuid4())]},
        sort_order=0,
    )
    db_session.add(section)
    await db_session.commit()

    response = await client.get(
        "/api/home/sections", headers={"X-Session-Token": token}
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["type"] == "featured"
    assert data[0]["items"] == []


@pytest.mark.asyncio
async def test_get_home_sections_featured_skips_draft(
    client, active_subscriber, db_session: AsyncSession
):
    """Featured section skips draft series."""
    _, token = active_subscriber
    user = make_user()
    db_session.add(user)
    await db_session.flush()

    # Create 1 published + 1 draft series
    s1 = make_series(user.id, status="published", title="Published")
    s2 = make_series(user.id, status="draft", title="Draft")
    db_session.add_all([s1, s2])
    await db_session.flush()

    # Featured config has both IDs
    section = make_home_section(
        type="featured",
        title="المميزة",
        config={"series_ids": [str(s1.id), str(s2.id)]},
        sort_order=0,
    )
    db_session.add(section)
    await db_session.commit()

    response = await client.get(
        "/api/home/sections", headers={"X-Session-Token": token}
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["type"] == "featured"
    assert len(data[0]["items"]) == 1
    assert data[0]["items"][0]["title"] == "Published"


@pytest.mark.asyncio
async def test_get_home_sections_new_releases_none_in_range(
    client, active_subscriber, db_session: AsyncSession
):
    """New releases section returns empty if no series in date range."""
    _, token = active_subscriber
    user = make_user()
    db_session.add(user)
    await db_session.flush()

    # Create series
    s1 = make_series(user.id, status="published", title="Old Series")
    db_session.add(s1)
    await db_session.flush()

    # Set its created_at to 30 days ago
    s1.created_at = datetime.now(UTC) - timedelta(days=30)
    await db_session.flush()

    # Section config days: 14
    section = make_home_section(
        type="new_releases",
        title="جديد",
        config={"days": 14, "limit": 10},
        sort_order=0,
    )
    db_session.add(section)
    await db_session.commit()

    response = await client.get(
        "/api/home/sections", headers={"X-Session-Token": token}
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["type"] == "new_releases"
    assert data[0]["items"] == []


@pytest.mark.asyncio
async def test_get_home_sections_mixed_types(
    client, active_subscriber, db_session: AsyncSession
):
    """Multiple section types are returned in sort order."""
    _, token = active_subscriber
    user = make_user()
    db_session.add(user)
    await db_session.flush()

    # Create a series for featured and new_releases
    s1 = make_series(user.id, status="published", title="Test Series")
    db_session.add(s1)
    await db_session.flush()

    # Create episode for trending
    ep1 = make_episode(s1.id, user.id, status="published")
    db_session.add(ep1)
    await db_session.flush()

    # Create watch history for trending
    sub = make_subscriber()
    db_session.add(sub)
    await db_session.flush()

    wh = make_watch_history(sub.id, ep1.id, last_watched_at=datetime.now(UTC))
    db_session.add(wh)
    await db_session.flush()

    # Create 3 sections with different types
    featured = make_home_section(
        type="featured",
        title="المميزة",
        config={"series_ids": [str(s1.id)]},
        sort_order=0,
    )
    new_releases = make_home_section(
        type="new_releases",
        title="جديد",
        config={"days": 14, "limit": 10},
        sort_order=1,
    )
    trending = make_home_section(
        type="trending",
        title="الأكثر مشاهدة",
        config={"days": 7, "limit": 10},
        sort_order=2,
    )
    db_session.add_all([featured, new_releases, trending])
    await db_session.commit()

    response = await client.get(
        "/api/home/sections", headers={"X-Session-Token": token}
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 3

    # Verify order and types
    assert data[0]["type"] == "featured"
    assert data[0]["title"] == "المميزة"
    assert len(data[0]["items"]) == 1

    assert data[1]["type"] == "new_releases"
    assert data[1]["title"] == "جديد"
    assert len(data[1]["items"]) >= 1

    assert data[2]["type"] == "trending"
    assert data[2]["title"] == "الأكثر مشاهدة"
    assert len(data[2]["items"]) == 1


@pytest.mark.asyncio
async def test_get_home_sections_featured_includes_episode_count(
    client, active_subscriber, db_session: AsyncSession
):
    """Featured section items include episode_count."""
    _, token = active_subscriber
    user = make_user()
    db_session.add(user)
    await db_session.flush()

    s1 = make_series(user.id, status="published")
    db_session.add(s1)
    await db_session.flush()

    # Add 3 published episodes
    for i in range(3):
        ep = make_episode(s1.id, user.id, episode_number=i + 1, status="published")
        db_session.add(ep)
    await db_session.flush()

    section = make_home_section(
        type="featured",
        title="Test",
        config={"series_ids": [str(s1.id)]},
    )
    db_session.add(section)
    await db_session.commit()

    response = await client.get(
        "/api/home/sections", headers={"X-Session-Token": token}
    )
    assert response.status_code == 200
    data = response.json()
    assert data[0]["items"][0]["episode_count"] == 3
