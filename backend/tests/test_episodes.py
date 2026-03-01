"""Tests for episode CRUD endpoints."""

import uuid

import httpx
import pytest
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.episode import Episode, EpisodeStatus
from app.models.user import User
from tests.factories import make_episode, make_series


@pytest.mark.asyncio
async def test_create_episode(
    admin_client: httpx.AsyncClient, db_session: AsyncSession, admin_user: User
):
    """Create episode → 201, returns episode."""
    series = make_series(created_by=admin_user.id)
    db_session.add(series)
    await db_session.commit()

    response = await admin_client.post(
        f"/api/series/{series.id}/episodes",
        json={
            "title": "Episode One",
            "description": "The first episode",
            "episode_number": 1,
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Episode One"
    assert data["description"] == "The first episode"
    assert data["episode_number"] == 1
    assert data["status"] == "draft"
    assert data["series_id"] == str(series.id)
    assert data["created_by"] == str(admin_user.id)
    assert "id" in data
    assert "created_at" in data

    # Verify in DB
    result = await db_session.execute(
        select(Episode).where(Episode.id == uuid.UUID(data["id"]))
    )
    episode = result.scalar_one()
    assert episode.title == "Episode One"


@pytest.mark.asyncio
async def test_create_episode_auto_number(
    admin_client: httpx.AsyncClient, db_session: AsyncSession, admin_user: User
):
    """Auto-number: next episode gets incremented number."""
    series = make_series(created_by=admin_user.id)
    db_session.add(series)
    await db_session.commit()

    # Create first episode with explicit number
    ep1 = make_episode(series_id=series.id, created_by=admin_user.id, episode_number=1)
    db_session.add(ep1)
    await db_session.commit()

    # Create second episode without number → should auto-assign 2
    response = await admin_client.post(
        f"/api/series/{series.id}/episodes",
        json={"title": "Auto Numbered"},
    )
    assert response.status_code == 201
    assert response.json()["episode_number"] == 2


@pytest.mark.asyncio
async def test_create_episode_duplicate_number(
    admin_client: httpx.AsyncClient, db_session: AsyncSession, admin_user: User
):
    """Duplicate episode number within series → 409."""
    series = make_series(created_by=admin_user.id)
    db_session.add(series)
    await db_session.commit()

    ep1 = make_episode(series_id=series.id, created_by=admin_user.id, episode_number=1)
    db_session.add(ep1)
    await db_session.commit()

    response = await admin_client.post(
        f"/api/series/{series.id}/episodes",
        json={"title": "Duplicate", "episode_number": 1},
    )
    assert response.status_code == 409
    assert "already exists" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_list_episodes(
    admin_client: httpx.AsyncClient, db_session: AsyncSession, admin_user: User
):
    """List episodes for series → 200, ordered list."""
    series = make_series(created_by=admin_user.id)
    db_session.add(series)
    await db_session.commit()

    # Create episodes in random order
    for num in [3, 1, 2]:
        ep = make_episode(
            series_id=series.id,
            created_by=admin_user.id,
            episode_number=num,
            title=f"Episode {num}",
        )
        db_session.add(ep)
    await db_session.commit()

    response = await admin_client.get(f"/api/series/{series.id}/episodes")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 3
    # Verify ordering by episode_number
    numbers = [item["episode_number"] for item in data["items"]]
    assert numbers == [1, 2, 3]


@pytest.mark.asyncio
async def test_get_episode(
    admin_client: httpx.AsyncClient, db_session: AsyncSession, admin_user: User
):
    """Get episode detail → 200."""
    series = make_series(created_by=admin_user.id)
    db_session.add(series)
    await db_session.commit()

    ep = make_episode(
        series_id=series.id,
        created_by=admin_user.id,
        episode_number=1,
        title="Detail Episode",
    )
    db_session.add(ep)
    await db_session.commit()

    response = await admin_client.get(f"/api/episodes/{ep.id}")
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Detail Episode"
    assert data["episode_number"] == 1
    assert data["series_id"] == str(series.id)


@pytest.mark.asyncio
async def test_get_nonexistent_episode(admin_client: httpx.AsyncClient):
    """Get nonexistent episode → 404."""
    response = await admin_client.get(f"/api/episodes/{uuid.uuid4()}")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_update_episode(
    admin_client: httpx.AsyncClient, db_session: AsyncSession, admin_user: User
):
    """Update episode → 200."""
    series = make_series(created_by=admin_user.id)
    db_session.add(series)
    await db_session.commit()

    ep = make_episode(
        series_id=series.id,
        created_by=admin_user.id,
        episode_number=1,
        title="Old Title",
    )
    db_session.add(ep)
    await db_session.commit()

    response = await admin_client.patch(
        f"/api/episodes/{ep.id}",
        json={"title": "New Title", "description": "Updated desc"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "New Title"
    assert data["description"] == "Updated desc"
    assert data["episode_number"] == 1  # unchanged


@pytest.mark.asyncio
async def test_delete_episode(
    admin_client: httpx.AsyncClient, db_session: AsyncSession, admin_user: User
):
    """Delete episode → 204."""
    series = make_series(created_by=admin_user.id)
    db_session.add(series)
    await db_session.commit()

    ep = make_episode(series_id=series.id, created_by=admin_user.id, episode_number=1)
    db_session.add(ep)
    await db_session.commit()

    response = await admin_client.delete(f"/api/episodes/{ep.id}")
    assert response.status_code == 204

    # Verify deleted from DB
    result = await db_session.execute(select(Episode).where(Episode.id == ep.id))
    assert result.scalar_one_or_none() is None


@pytest.mark.asyncio
async def test_create_episode_nonexistent_series(admin_client: httpx.AsyncClient):
    """Create episode in nonexistent series → 404."""
    response = await admin_client.post(
        f"/api/series/{uuid.uuid4()}/episodes",
        json={"title": "Orphan Episode"},
    )
    assert response.status_code == 404
    assert "series not found" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_list_episodes_nonexistent_series(admin_client: httpx.AsyncClient):
    """List episodes for nonexistent series → 404."""
    response = await admin_client.get(f"/api/series/{uuid.uuid4()}/episodes")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_update_episode_status(
    admin_client: httpx.AsyncClient, db_session: AsyncSession, admin_user: User
):
    """Episode status transitions work correctly."""
    series = make_series(created_by=admin_user.id)
    db_session.add(series)
    await db_session.commit()

    ep = make_episode(series_id=series.id, created_by=admin_user.id, episode_number=1)
    db_session.add(ep)
    await db_session.commit()

    # Update status from draft to published
    response = await admin_client.patch(
        f"/api/episodes/{ep.id}",
        json={"status": "published"},
    )
    assert response.status_code == 200
    assert response.json()["status"] == "published"

    # Verify in DB
    await db_session.refresh(ep)
    assert ep.status == EpisodeStatus.published


@pytest.mark.asyncio
async def test_episodes_unauthenticated(client: httpx.AsyncClient):
    """Unauthenticated requests return 401."""
    response = await client.get(f"/api/series/{uuid.uuid4()}/episodes")
    assert response.status_code == 401
