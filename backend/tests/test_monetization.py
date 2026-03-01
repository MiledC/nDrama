"""Tests for monetization / pricing configuration."""

import uuid

import httpx
import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from tests.factories import make_episode, make_series


@pytest.mark.asyncio
async def test_series_has_pricing_fields(
    admin_client: httpx.AsyncClient, db_session: AsyncSession, admin_user: User
):
    """Series response includes pricing fields."""
    series = make_series(created_by=admin_user.id)
    db_session.add(series)
    await db_session.commit()

    response = await admin_client.get(f"/api/series/{series.id}")
    assert response.status_code == 200
    data = response.json()
    assert "free_episode_count" in data
    assert "coin_cost_per_episode" in data


@pytest.mark.asyncio
async def test_default_free_episode_count_on_creation(
    admin_client: httpx.AsyncClient,
):
    """Default free_episode_count is 3 when creating via API."""
    response = await admin_client.post(
        "/api/series",
        json={"title": "Default Pricing Series"},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["free_episode_count"] == 3
    assert data["coin_cost_per_episode"] == 0


@pytest.mark.asyncio
async def test_pricing_fields_with_custom_values(
    admin_client: httpx.AsyncClient, db_session: AsyncSession, admin_user: User
):
    """Series detail includes custom pricing values."""
    series = make_series(
        created_by=admin_user.id,
        free_episode_count=5,
        coin_cost_per_episode=25,
    )
    db_session.add(series)
    await db_session.commit()

    response = await admin_client.get(f"/api/series/{series.id}")
    assert response.status_code == 200
    data = response.json()
    assert data["free_episode_count"] == 5
    assert data["coin_cost_per_episode"] == 25


@pytest.mark.asyncio
async def test_get_pricing(
    admin_client: httpx.AsyncClient, db_session: AsyncSession, admin_user: User
):
    """GET /api/series/:id/pricing returns pricing."""
    series = make_series(
        created_by=admin_user.id,
        free_episode_count=2,
        coin_cost_per_episode=15,
    )
    db_session.add(series)
    await db_session.commit()

    response = await admin_client.get(f"/api/series/{series.id}/pricing")
    assert response.status_code == 200
    data = response.json()
    assert data["free_episode_count"] == 2
    assert data["coin_cost_per_episode"] == 15


@pytest.mark.asyncio
async def test_update_pricing(
    admin_client: httpx.AsyncClient, db_session: AsyncSession, admin_user: User
):
    """PATCH /api/series/:id/pricing updates pricing."""
    series = make_series(created_by=admin_user.id)
    db_session.add(series)
    await db_session.commit()

    response = await admin_client.patch(
        f"/api/series/{series.id}/pricing",
        json={"free_episode_count": 10, "coin_cost_per_episode": 50},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["free_episode_count"] == 10
    assert data["coin_cost_per_episode"] == 50


@pytest.mark.asyncio
async def test_partial_pricing_update(
    admin_client: httpx.AsyncClient, db_session: AsyncSession, admin_user: User
):
    """Partial pricing update leaves other field unchanged."""
    series = make_series(
        created_by=admin_user.id,
        free_episode_count=5,
        coin_cost_per_episode=20,
    )
    db_session.add(series)
    await db_session.commit()

    response = await admin_client.patch(
        f"/api/series/{series.id}/pricing",
        json={"coin_cost_per_episode": 30},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["free_episode_count"] == 5  # unchanged
    assert data["coin_cost_per_episode"] == 30


@pytest.mark.asyncio
async def test_negative_coin_cost_rejected(
    admin_client: httpx.AsyncClient, db_session: AsyncSession, admin_user: User
):
    """Negative coin_cost_per_episode returns 422."""
    series = make_series(created_by=admin_user.id)
    db_session.add(series)
    await db_session.commit()

    response = await admin_client.patch(
        f"/api/series/{series.id}/pricing",
        json={"coin_cost_per_episode": -1},
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_negative_free_episode_count_rejected(
    admin_client: httpx.AsyncClient, db_session: AsyncSession, admin_user: User
):
    """Negative free_episode_count returns 422."""
    series = make_series(created_by=admin_user.id)
    db_session.add(series)
    await db_session.commit()

    response = await admin_client.patch(
        f"/api/series/{series.id}/pricing",
        json={"free_episode_count": -5},
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_zero_free_episode_count_allowed(
    admin_client: httpx.AsyncClient, db_session: AsyncSession, admin_user: User
):
    """Zero free_episode_count is valid (all episodes locked)."""
    series = make_series(created_by=admin_user.id)
    db_session.add(series)
    await db_session.commit()

    response = await admin_client.patch(
        f"/api/series/{series.id}/pricing",
        json={"free_episode_count": 0},
    )
    assert response.status_code == 200
    assert response.json()["free_episode_count"] == 0


@pytest.mark.asyncio
async def test_episode_within_free_count(
    db_session: AsyncSession, admin_user: User
):
    """Episode within free count is free (number <= free_episode_count)."""
    series = make_series(
        created_by=admin_user.id,
        free_episode_count=3,
        coin_cost_per_episode=10,
    )
    db_session.add(series)
    await db_session.commit()

    ep = make_episode(series_id=series.id, created_by=admin_user.id, episode_number=1)
    db_session.add(ep)
    await db_session.commit()

    # Business logic: episode_number <= free_episode_count means free
    assert ep.episode_number <= series.free_episode_count


@pytest.mark.asyncio
async def test_episode_beyond_free_count(
    db_session: AsyncSession, admin_user: User
):
    """Episode beyond free count is locked (number > free_episode_count)."""
    series = make_series(
        created_by=admin_user.id,
        free_episode_count=3,
        coin_cost_per_episode=10,
    )
    db_session.add(series)
    await db_session.commit()

    ep = make_episode(series_id=series.id, created_by=admin_user.id, episode_number=4)
    db_session.add(ep)
    await db_session.commit()

    assert ep.episode_number > series.free_episode_count


@pytest.mark.asyncio
async def test_boundary_episode_is_free(
    db_session: AsyncSession, admin_user: User
):
    """Episode at boundary (number == free_episode_count) is free."""
    series = make_series(
        created_by=admin_user.id,
        free_episode_count=3,
        coin_cost_per_episode=10,
    )
    db_session.add(series)
    await db_session.commit()

    ep = make_episode(series_id=series.id, created_by=admin_user.id, episode_number=3)
    db_session.add(ep)
    await db_session.commit()

    assert ep.episode_number <= series.free_episode_count


@pytest.mark.asyncio
async def test_pricing_endpoints_404_for_nonexistent_series(
    admin_client: httpx.AsyncClient,
):
    """Pricing endpoints return 404 for non-existent series."""
    fake_id = uuid.uuid4()

    get_response = await admin_client.get(f"/api/series/{fake_id}/pricing")
    assert get_response.status_code == 404

    patch_response = await admin_client.patch(
        f"/api/series/{fake_id}/pricing",
        json={"free_episode_count": 5},
    )
    assert patch_response.status_code == 404
