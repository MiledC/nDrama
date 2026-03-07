"""Tests for home section CRUD endpoints."""

import uuid

import httpx
import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from tests.factories import make_home_section


@pytest.mark.asyncio
async def test_list_sections(
    admin_client: httpx.AsyncClient, db_session: AsyncSession
):
    """Test listing all home sections."""
    s1 = make_home_section(title="Featured", sort_order=0)
    s2 = make_home_section(title="Trending", type="trending", sort_order=1)
    db_session.add_all([s1, s2])
    await db_session.commit()

    response = await admin_client.get("/api/home-sections")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 2
    assert len(data["items"]) == 2
    assert data["items"][0]["title"] == "Featured"
    assert data["items"][1]["title"] == "Trending"


@pytest.mark.asyncio
async def test_list_sections_as_editor(
    editor_client: httpx.AsyncClient, db_session: AsyncSession
):
    """Editors can view sections."""
    s = make_home_section()
    db_session.add(s)
    await db_session.commit()

    response = await editor_client.get("/api/home-sections")
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_list_sections_no_auth(client: httpx.AsyncClient):
    """Unauthenticated requests are rejected."""
    response = await client.get("/api/home-sections")
    assert response.status_code in (401, 403)


@pytest.mark.asyncio
async def test_create_section(admin_client: httpx.AsyncClient):
    """Admin can create a home section."""
    response = await admin_client.post(
        "/api/home-sections",
        json={
            "type": "featured",
            "title": "المميزة",
            "config": {"series_ids": [str(uuid.uuid4())]},
            "sort_order": 0,
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["type"] == "featured"
    assert data["title"] == "المميزة"
    assert data["is_active"] is True
    assert len(data["config"]["series_ids"]) == 1


@pytest.mark.asyncio
async def test_create_section_all_types(admin_client: httpx.AsyncClient):
    """All section types can be created."""
    types_configs = [
        ("featured", {"series_ids": []}),
        ("trending", {"days": 7, "limit": 10}),
        ("new_releases", {"days": 14, "limit": 10}),
        ("category", {"category_id": str(uuid.uuid4()), "limit": 10}),
    ]
    for section_type, config in types_configs:
        response = await admin_client.post(
            "/api/home-sections",
            json={"type": section_type, "title": f"Test {section_type}", "config": config},
        )
        assert response.status_code == 201, f"Failed for type {section_type}"
        assert response.json()["type"] == section_type


@pytest.mark.asyncio
async def test_create_section_invalid_type(admin_client: httpx.AsyncClient):
    """Invalid section type is rejected."""
    response = await admin_client.post(
        "/api/home-sections",
        json={"type": "invalid_type", "title": "Bad Type", "config": {}},
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_create_section_editor_rejected(editor_client: httpx.AsyncClient):
    """Editors cannot create sections."""
    response = await editor_client.post(
        "/api/home-sections",
        json={"type": "featured", "title": "Attempt", "config": {}},
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_update_section(
    admin_client: httpx.AsyncClient, db_session: AsyncSession
):
    """Admin can update a home section."""
    s = make_home_section(title="Old Title")
    db_session.add(s)
    await db_session.commit()

    response = await admin_client.patch(
        f"/api/home-sections/{s.id}",
        json={"title": "New Title", "is_active": False},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "New Title"
    assert data["is_active"] is False


@pytest.mark.asyncio
async def test_update_section_editor_rejected(
    editor_client: httpx.AsyncClient, db_session: AsyncSession
):
    """Editors cannot update sections."""
    s = make_home_section()
    db_session.add(s)
    await db_session.commit()

    response = await editor_client.patch(
        f"/api/home-sections/{s.id}",
        json={"title": "Hack"},
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_update_section_not_found(admin_client: httpx.AsyncClient):
    """Test 404 on non-existent section."""
    response = await admin_client.patch(
        f"/api/home-sections/{uuid.uuid4()}",
        json={"title": "Ghost"},
    )
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_delete_section(
    admin_client: httpx.AsyncClient, db_session: AsyncSession
):
    """Admin can delete a home section."""
    s = make_home_section()
    db_session.add(s)
    await db_session.commit()

    response = await admin_client.delete(f"/api/home-sections/{s.id}")
    assert response.status_code == 204

    # Verify actually deleted
    response = await admin_client.get("/api/home-sections")
    data = response.json()
    found = [i for i in data["items"] if i["id"] == str(s.id)]
    assert len(found) == 0


@pytest.mark.asyncio
async def test_delete_section_editor_rejected(
    editor_client: httpx.AsyncClient, db_session: AsyncSession
):
    """Editors cannot delete sections."""
    s = make_home_section()
    db_session.add(s)
    await db_session.commit()

    response = await editor_client.delete(f"/api/home-sections/{s.id}")
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_delete_section_not_found(admin_client: httpx.AsyncClient):
    """Test 404 on non-existent section."""
    response = await admin_client.delete(f"/api/home-sections/{uuid.uuid4()}")
    assert response.status_code == 404
