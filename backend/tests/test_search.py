"""Tests for global search API endpoint."""

import pytest

from tests.factories import make_episode, make_series


@pytest.mark.asyncio
async def test_search_series_by_title(admin_client, db_session, admin_user):
    """Search returns matching series by title."""
    s = make_series(created_by=admin_user.id, title="Desert Storm")
    db_session.add(s)
    await db_session.commit()

    response = await admin_client.get("/api/search", params={"q": "Desert"})
    assert response.status_code == 200

    data = response.json()
    assert data["total"] >= 1
    series_results = [r for r in data["results"] if r["type"] == "series"]
    assert any(r["title"] == "Desert Storm" for r in series_results)


@pytest.mark.asyncio
async def test_search_episodes_by_title(admin_client, db_session, admin_user):
    """Search returns matching episodes by title."""
    s = make_series(created_by=admin_user.id, title="My Series")
    db_session.add(s)
    await db_session.flush()

    ep = make_episode(
        series_id=s.id, created_by=admin_user.id, title="Pilot Episode", episode_number=1
    )
    db_session.add(ep)
    await db_session.commit()

    response = await admin_client.get("/api/search", params={"q": "Pilot"})
    assert response.status_code == 200

    data = response.json()
    episode_results = [r for r in data["results"] if r["type"] == "episode"]
    assert len(episode_results) >= 1
    assert episode_results[0]["title"] == "Pilot Episode"
    assert episode_results[0]["series_title"] == "My Series"


@pytest.mark.asyncio
async def test_search_combined(admin_client, db_session, admin_user):
    """Search returns both series and episode matches."""
    s = make_series(created_by=admin_user.id, title="Storm Rising")
    db_session.add(s)
    await db_session.flush()

    ep = make_episode(
        series_id=s.id,
        created_by=admin_user.id,
        title="The Storm Begins",
        episode_number=1,
    )
    db_session.add(ep)
    await db_session.commit()

    response = await admin_client.get("/api/search", params={"q": "Storm"})
    assert response.status_code == 200

    data = response.json()
    types = {r["type"] for r in data["results"]}
    assert "series" in types
    assert "episode" in types


@pytest.mark.asyncio
async def test_search_empty_query(admin_client):
    """Search with empty query returns 422 validation error."""
    response = await admin_client.get("/api/search", params={"q": ""})
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_search_no_results(admin_client, db_session, admin_user):
    """Search returns empty results when nothing matches."""
    s = make_series(created_by=admin_user.id, title="Desert Storm")
    db_session.add(s)
    await db_session.commit()

    response = await admin_client.get("/api/search", params={"q": "zzzznonexistent"})
    assert response.status_code == 200

    data = response.json()
    assert data["results"] == []
    assert data["total"] == 0


@pytest.mark.asyncio
async def test_search_pagination(admin_client, db_session, admin_user):
    """Search pagination returns correct page and total."""
    # Create 5 series with matching titles
    for i in range(5):
        s = make_series(created_by=admin_user.id, title=f"Alpha Series {i}")
        db_session.add(s)
    await db_session.commit()

    # Request page 1 with per_page=2
    response = await admin_client.get(
        "/api/search", params={"q": "Alpha", "page": 1, "per_page": 2}
    )
    assert response.status_code == 200

    data = response.json()
    assert len(data["results"]) == 2
    assert data["total"] == 5

    # Request page 2
    response = await admin_client.get(
        "/api/search", params={"q": "Alpha", "page": 2, "per_page": 2}
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data["results"]) == 2


@pytest.mark.asyncio
async def test_search_unauthenticated(client):
    """Search endpoint requires authentication."""
    response = await client.get("/api/search", params={"q": "test"})
    assert response.status_code in (401, 403)
