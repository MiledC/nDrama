"""Tests for home sections endpoint."""

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from tests.factories import make_home_section, make_series, make_user


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
