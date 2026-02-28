"""Tests for series CRUD endpoints."""

import uuid

import httpx
import pytest
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.series import Series, SeriesStatus, series_tags
from app.models.tag import TagCategory
from app.models.user import User
from tests.factories import make_series, make_tag


@pytest.mark.asyncio
async def test_create_series(
    admin_client: httpx.AsyncClient, db_session: AsyncSession, admin_user: User
):
    """Test creating a new series."""
    response = await admin_client.post(
        "/api/series",
        json={
            "title": "New Test Series",
            "description": "A great new series",
            "status": "draft",
            "free_episode_count": 5,
            "coin_cost_per_episode": 20,
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "New Test Series"
    assert data["description"] == "A great new series"
    assert data["status"] == "draft"
    assert data["free_episode_count"] == 5
    assert data["coin_cost_per_episode"] == 20
    assert data["created_by"] == str(admin_user.id)
    assert "id" in data
    assert "created_at" in data
    assert "updated_at" in data
    assert data["tags"] == []

    # Verify in DB
    result = await db_session.execute(select(Series).where(Series.id == uuid.UUID(data["id"])))
    series = result.scalar_one()
    assert series.title == "New Test Series"
    assert series.created_by == admin_user.id


@pytest.mark.asyncio
async def test_create_series_with_tags(
    admin_client: httpx.AsyncClient, db_session: AsyncSession, admin_user: User
):
    """Test creating a series with tags."""
    # Create some tags
    tag1 = make_tag(name="Action", category=TagCategory.genre)
    tag2 = make_tag(name="Arabic", category=TagCategory.language)
    db_session.add_all([tag1, tag2])
    await db_session.commit()

    response = await admin_client.post(
        "/api/series",
        json={
            "title": "Series with Tags",
            "description": "Has multiple tags",
            "tag_ids": [str(tag1.id), str(tag2.id)],
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Series with Tags"
    assert len(data["tags"]) == 2
    tag_names = {tag["name"] for tag in data["tags"]}
    assert tag_names == {"Action", "Arabic"}


@pytest.mark.asyncio
async def test_create_series_unauthenticated(client: httpx.AsyncClient):
    """Test creating a series without authentication returns 401."""
    response = await client.post(
        "/api/series",
        json={"title": "Unauthorized Series"},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_list_series_paginated(
    admin_client: httpx.AsyncClient, db_session: AsyncSession, admin_user: User
):
    """Test listing series with pagination."""
    # Create 25 series
    series_list = []
    for i in range(25):
        series = make_series(created_by=admin_user.id, title=f"Series {i:02d}")
        series_list.append(series)
    db_session.add_all(series_list)
    await db_session.commit()

    # Get first page (default 20 per page)
    response = await admin_client.get("/api/series")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 25
    assert data["page"] == 1
    assert data["per_page"] == 20
    assert len(data["items"]) == 20

    # Get second page
    response = await admin_client.get("/api/series", params={"page": 2})
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 25
    assert data["page"] == 2
    assert data["per_page"] == 20
    assert len(data["items"]) == 5

    # Test custom per_page
    response = await admin_client.get("/api/series", params={"per_page": 10})
    assert response.status_code == 200
    data = response.json()
    assert data["per_page"] == 10
    assert len(data["items"]) == 10


@pytest.mark.asyncio
async def test_list_series_filter_by_status(
    admin_client: httpx.AsyncClient, db_session: AsyncSession, admin_user: User
):
    """Test filtering series by status."""
    # Create series with different statuses
    draft = make_series(created_by=admin_user.id, title="Draft", status=SeriesStatus.draft)
    published = make_series(
        created_by=admin_user.id, title="Published", status=SeriesStatus.published
    )
    archived = make_series(created_by=admin_user.id, title="Archived", status=SeriesStatus.archived)
    db_session.add_all([draft, published, archived])
    await db_session.commit()

    # Filter by published status
    response = await admin_client.get("/api/series", params={"status": "published"})
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 1
    assert data["items"][0]["title"] == "Published"
    assert data["items"][0]["status"] == "published"


@pytest.mark.asyncio
async def test_list_series_filter_by_tag(
    admin_client: httpx.AsyncClient, db_session: AsyncSession, admin_user: User
):
    """Test filtering series by tag."""
    # Create tags
    tag1 = make_tag(name="Action", category=TagCategory.genre)
    tag2 = make_tag(name="Drama", category=TagCategory.genre)
    db_session.add_all([tag1, tag2])

    # Create series
    series1 = make_series(created_by=admin_user.id, title="Action Series")
    series2 = make_series(created_by=admin_user.id, title="Drama Series")
    series3 = make_series(created_by=admin_user.id, title="No Tags")
    db_session.add_all([series1, series2, series3])
    await db_session.commit()

    # Add tags to series via join table
    await db_session.execute(series_tags.insert().values(series_id=series1.id, tag_id=tag1.id))
    await db_session.execute(series_tags.insert().values(series_id=series2.id, tag_id=tag2.id))
    await db_session.commit()

    # Filter by Action tag
    response = await admin_client.get("/api/series", params={"tag": str(tag1.id)})
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 1
    assert data["items"][0]["title"] == "Action Series"


@pytest.mark.asyncio
async def test_list_series_search(
    admin_client: httpx.AsyncClient, db_session: AsyncSession, admin_user: User
):
    """Test searching series by title and description."""
    # Create series with searchable content
    series1 = make_series(
        created_by=admin_user.id,
        title="The Amazing Spider-Man",
        description="A web-slinging hero",
    )
    series2 = make_series(
        created_by=admin_user.id, title="Batman Begins", description="The Dark Knight rises"
    )
    series3 = make_series(
        created_by=admin_user.id, title="Superman", description="Amazing powers from Krypton"
    )
    db_session.add_all([series1, series2, series3])
    await db_session.commit()

    # Search for "amazing" (should match series1 by title and series3 by description)
    response = await admin_client.get("/api/series", params={"search": "amazing"})
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 2
    titles = {item["title"] for item in data["items"]}
    assert titles == {"The Amazing Spider-Man", "Superman"}

    # Search for "batman" (should match series2 by title)
    response = await admin_client.get("/api/series", params={"search": "batman"})
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 1
    assert data["items"][0]["title"] == "Batman Begins"


@pytest.mark.asyncio
async def test_get_series(
    admin_client: httpx.AsyncClient, db_session: AsyncSession, admin_user: User
):
    """Test getting a single series with tags."""
    # Create tags and series
    tag1 = make_tag(name="Action", category=TagCategory.genre)
    tag2 = make_tag(name="Adventure", category=TagCategory.genre)
    db_session.add_all([tag1, tag2])

    series = make_series(
        created_by=admin_user.id,
        title="Test Series",
        description="A test description",
        status=SeriesStatus.published,
        free_episode_count=3,
        coin_cost_per_episode=15,
    )
    db_session.add(series)
    await db_session.commit()

    # Add tags to series
    await db_session.execute(series_tags.insert().values(series_id=series.id, tag_id=tag1.id))
    await db_session.execute(series_tags.insert().values(series_id=series.id, tag_id=tag2.id))
    await db_session.commit()

    # Get the series
    response = await admin_client.get(f"/api/series/{series.id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == str(series.id)
    assert data["title"] == "Test Series"
    assert data["description"] == "A test description"
    assert data["status"] == "published"
    assert data["free_episode_count"] == 3
    assert data["coin_cost_per_episode"] == 15
    assert data["created_by"] == str(admin_user.id)
    assert len(data["tags"]) == 2
    tag_names = {tag["name"] for tag in data["tags"]}
    assert tag_names == {"Action", "Adventure"}


@pytest.mark.asyncio
async def test_get_nonexistent_series(admin_client: httpx.AsyncClient):
    """Test getting a non-existent series returns 404."""
    fake_id = uuid.uuid4()
    response = await admin_client.get(f"/api/series/{fake_id}")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_update_series_title(
    admin_client: httpx.AsyncClient, db_session: AsyncSession, admin_user: User
):
    """Test updating a series title."""
    # Create a series
    series = make_series(created_by=admin_user.id, title="Old Title", description="Old Description")
    db_session.add(series)
    await db_session.commit()

    # Update the title
    response = await admin_client.patch(
        f"/api/series/{series.id}",
        json={"title": "New Title"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == str(series.id)
    assert data["title"] == "New Title"
    assert data["description"] == "Old Description"  # Should remain unchanged

    # Verify in DB
    await db_session.refresh(series)
    assert series.title == "New Title"
    assert series.description == "Old Description"


@pytest.mark.asyncio
async def test_update_series_tags(
    admin_client: httpx.AsyncClient, db_session: AsyncSession, admin_user: User
):
    """Test updating series tags (replace entirely)."""
    # Create tags
    tag1 = make_tag(name="OldTag1")
    tag2 = make_tag(name="OldTag2")
    tag3 = make_tag(name="NewTag1")
    tag4 = make_tag(name="NewTag2")
    db_session.add_all([tag1, tag2, tag3, tag4])

    # Create series with initial tags
    series = make_series(created_by=admin_user.id, title="Series with Tags")
    db_session.add(series)
    await db_session.commit()

    # Add initial tags
    await db_session.execute(series_tags.insert().values(series_id=series.id, tag_id=tag1.id))
    await db_session.execute(series_tags.insert().values(series_id=series.id, tag_id=tag2.id))
    await db_session.commit()

    # Update with new tags (should replace, not append)
    response = await admin_client.patch(
        f"/api/series/{series.id}",
        json={"tag_ids": [str(tag3.id), str(tag4.id)]},
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data["tags"]) == 2
    tag_names = {tag["name"] for tag in data["tags"]}
    assert tag_names == {"NewTag1", "NewTag2"}

    # Verify in DB
    result = await db_session.execute(
        select(Series)
        .options(selectinload(Series.tags))
        .where(Series.id == series.id)
    )
    series = result.scalar_one()
    assert len(series.tags) == 2
    db_tag_names = {tag.name for tag in series.tags}
    assert db_tag_names == {"NewTag1", "NewTag2"}


@pytest.mark.asyncio
async def test_update_series_status(
    admin_client: httpx.AsyncClient, db_session: AsyncSession, admin_user: User
):
    """Test updating series status."""
    # Create a draft series
    series = make_series(created_by=admin_user.id, title="Draft Series", status=SeriesStatus.draft)
    db_session.add(series)
    await db_session.commit()

    # Update to published
    response = await admin_client.patch(
        f"/api/series/{series.id}",
        json={"status": "published"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "published"

    # Verify in DB
    await db_session.refresh(series)
    assert series.status == SeriesStatus.published


@pytest.mark.asyncio
async def test_delete_series(
    admin_client: httpx.AsyncClient, db_session: AsyncSession, admin_user: User
):
    """Test archiving a series (soft delete)."""
    # Create a series
    series = make_series(created_by=admin_user.id, title="To Archive")
    db_session.add(series)
    await db_session.commit()

    # Archive it
    response = await admin_client.delete(f"/api/series/{series.id}")
    assert response.status_code == 204

    # Verify series is archived, not deleted
    get_response = await admin_client.get(f"/api/series/{series.id}")
    assert get_response.status_code == 200
    assert get_response.json()["status"] == "archived"


@pytest.mark.asyncio
async def test_delete_nonexistent_series(admin_client: httpx.AsyncClient):
    """Test deleting a non-existent series returns 404."""
    fake_id = uuid.uuid4()
    response = await admin_client.delete(f"/api/series/{fake_id}")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()
