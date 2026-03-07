"""Tests for home section CRUD endpoints."""

import uuid

import httpx
import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from tests.factories import (
    make_category,
    make_episode,
    make_home_section,
    make_series,
    make_subscriber,
    make_tag,
    make_user,
    make_watch_history,
)


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


@pytest.mark.asyncio
async def test_update_section_sort_order_only(
    admin_client: httpx.AsyncClient, db_session: AsyncSession
):
    """Test updating only sort_order preserves other fields."""
    s = make_home_section(
        title="Original",
        sort_order=0,
        config={"series_ids": ["abc"]}
    )
    db_session.add(s)
    await db_session.commit()

    response = await admin_client.patch(
        f"/api/home-sections/{s.id}",
        json={"sort_order": 5}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["sort_order"] == 5
    assert data["title"] == "Original"
    assert data["config"]["series_ids"] == ["abc"]


@pytest.mark.asyncio
async def test_update_section_config_only(
    admin_client: httpx.AsyncClient, db_session: AsyncSession
):
    """Test updating only config preserves other fields."""
    s = make_home_section(
        title="Keep Me",
        sort_order=3
    )
    db_session.add(s)
    await db_session.commit()

    response = await admin_client.patch(
        f"/api/home-sections/{s.id}",
        json={"config": {"series_ids": ["x", "y"]}}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["config"]["series_ids"] == ["x", "y"]
    assert data["title"] == "Keep Me"
    assert data["sort_order"] == 3


@pytest.mark.asyncio
async def test_update_section_type_change(
    admin_client: httpx.AsyncClient, db_session: AsyncSession
):
    """Test changing section type."""
    s = make_home_section(type="featured")
    db_session.add(s)
    await db_session.commit()

    response = await admin_client.patch(
        f"/api/home-sections/{s.id}",
        json={"type": "trending"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["type"] == "trending"


@pytest.mark.asyncio
async def test_create_section_complex_config(admin_client: httpx.AsyncClient):
    """Test creating section with complex config containing multiple series."""
    series_ids = [str(uuid.uuid4()) for _ in range(3)]

    response = await admin_client.post(
        "/api/home-sections",
        json={
            "type": "featured",
            "title": "Complex Featured",
            "config": {"series_ids": series_ids},
            "sort_order": 0,
        }
    )
    assert response.status_code == 201
    data = response.json()
    assert len(data["config"]["series_ids"]) == 3
    assert data["config"]["series_ids"] == series_ids


@pytest.mark.asyncio
async def test_list_sections_empty(admin_client: httpx.AsyncClient):
    """Test listing sections when database is empty."""
    response = await admin_client.get("/api/home-sections")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 0
    assert data["items"] == []


@pytest.mark.asyncio
async def test_preview_featured_section(
    admin_client: httpx.AsyncClient, db_session: AsyncSession
):
    """Preview returns resolved series for featured section."""
    user = make_user()
    db_session.add(user)
    await db_session.flush()

    s1 = make_series(user.id, status="published", title="Preview Series")
    db_session.add(s1)
    await db_session.flush()

    section = make_home_section(
        type="featured",
        config={"series_ids": [str(s1.id)]},
    )
    db_session.add(section)
    await db_session.commit()

    response = await admin_client.get(f"/api/home-sections/{section.id}/preview")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["title"] == "Preview Series"
    assert "id" in data[0]
    assert "thumbnail_url" in data[0]


@pytest.mark.asyncio
async def test_preview_section_not_found(admin_client: httpx.AsyncClient):
    """Preview returns 404 for non-existent section."""
    response = await admin_client.get(f"/api/home-sections/{uuid.uuid4()}/preview")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_preview_new_releases_section(
    admin_client: httpx.AsyncClient, db_session: AsyncSession
):
    """Preview returns resolved series for new_releases section."""
    user = make_user()
    db_session.add(user)
    await db_session.flush()

    s1 = make_series(user.id, status="published")
    db_session.add(s1)
    await db_session.flush()

    section = make_home_section(
        type="new_releases",
        config={"days": 14, "limit": 10},
    )
    db_session.add(section)
    await db_session.commit()

    response = await admin_client.get(f"/api/home-sections/{section.id}/preview")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1


@pytest.mark.asyncio
async def test_preview_empty_featured_section(
    admin_client: httpx.AsyncClient, db_session: AsyncSession
):
    """Preview returns empty list for featured section with no series."""
    section = make_home_section(
        type="featured",
        config={"series_ids": []},
    )
    db_session.add(section)
    await db_session.commit()

    response = await admin_client.get(f"/api/home-sections/{section.id}/preview")
    assert response.status_code == 200
    data = response.json()
    assert data == []


@pytest.mark.asyncio
async def test_preview_category_section(
    admin_client: httpx.AsyncClient, db_session: AsyncSession
):
    """Preview returns series matching category tags."""
    user = make_user()
    db_session.add(user)
    await db_session.flush()

    # Create a tag and assign it to both category and series
    tag = make_tag(name="Drama")
    db_session.add(tag)
    await db_session.flush()

    cat = make_category(name="Drama Category", match_mode="any")
    cat.tags.append(tag)
    db_session.add(cat)
    await db_session.flush()

    s1 = make_series(user.id, status="published", title="Cat Series")
    s1.tags.append(tag)
    db_session.add(s1)
    await db_session.flush()

    section = make_home_section(
        type="category",
        config={"category_id": str(cat.id), "limit": 5},
    )
    db_session.add(section)
    await db_session.commit()

    response = await admin_client.get(f"/api/home-sections/{section.id}/preview")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1
    assert data[0]["title"] == "Cat Series"


@pytest.mark.asyncio
async def test_preview_trending_section(
    admin_client: httpx.AsyncClient, db_session: AsyncSession
):
    """Preview returns trending series based on watch history."""
    user = make_user()
    db_session.add(user)
    await db_session.flush()

    # Create a series with an episode
    s1 = make_series(user.id, status="published", title="Trending Series")
    db_session.add(s1)
    await db_session.flush()

    ep1 = make_episode(s1.id, user.id)
    db_session.add(ep1)
    await db_session.flush()

    # Create subscriber and watch history
    sub = make_subscriber()
    db_session.add(sub)
    await db_session.flush()

    wh = make_watch_history(sub.id, ep1.id)
    db_session.add(wh)
    await db_session.flush()

    section = make_home_section(
        type="trending",
        config={"days": 7, "limit": 10},
    )
    db_session.add(section)
    await db_session.commit()

    response = await admin_client.get(f"/api/home-sections/{section.id}/preview")
    assert response.status_code == 200
    data = response.json()
    # Should find the series with watch history
    assert len(data) >= 1
    assert data[0]["title"] == "Trending Series"
