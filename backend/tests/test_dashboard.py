"""Tests for dashboard API endpoints."""

import pytest

from app.models.series import SeriesStatus
from tests.factories import make_episode, make_series


@pytest.mark.asyncio
async def test_dashboard_stats(admin_client, db_session, admin_user):
    """GET /api/dashboard/stats returns correct counts."""
    # Create test data
    s1 = make_series(created_by=admin_user.id, status=SeriesStatus.published)
    s2 = make_series(created_by=admin_user.id, status=SeriesStatus.draft)
    ep1 = make_episode(series_id=s1.id, created_by=admin_user.id, episode_number=1)
    ep2 = make_episode(series_id=s1.id, created_by=admin_user.id, episode_number=2)
    db_session.add_all([s1, s2, ep1, ep2])
    await db_session.commit()

    response = await admin_client.get("/api/dashboard/stats")
    assert response.status_code == 200

    data = response.json()
    assert data["series_count"] == 2
    assert data["episode_count"] == 2
    # admin_user was created by fixture, so user_count includes them
    assert data["user_count"] >= 1
    assert data["published_series_count"] == 1


@pytest.mark.asyncio
async def test_dashboard_recent_activity(admin_client, db_session, admin_user):
    """GET /api/dashboard/recent returns latest series ordered by updated_at."""
    series_list = []
    for i in range(12):
        s = make_series(created_by=admin_user.id, title=f"Series {i}")
        series_list.append(s)
    db_session.add_all(series_list)
    await db_session.commit()

    response = await admin_client.get("/api/dashboard/recent")
    assert response.status_code == 200

    data = response.json()
    assert len(data["series"]) <= 10


@pytest.mark.asyncio
async def test_dashboard_empty_state(admin_client):
    """Dashboard stats return zeros when DB is empty (except the test user)."""
    response = await admin_client.get("/api/dashboard/stats")
    assert response.status_code == 200

    data = response.json()
    assert data["series_count"] == 0
    assert data["episode_count"] == 0
    assert data["published_series_count"] == 0

    response = await admin_client.get("/api/dashboard/recent")
    assert response.status_code == 200
    assert response.json()["series"] == []


@pytest.mark.asyncio
async def test_dashboard_unauthenticated(client):
    """Dashboard endpoints require authentication."""
    response = await client.get("/api/dashboard/stats")
    assert response.status_code in (401, 403)

    response = await client.get("/api/dashboard/recent")
    assert response.status_code in (401, 403)
