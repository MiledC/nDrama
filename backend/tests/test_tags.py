"""Tests for tag CRUD endpoints."""

import uuid

import httpx
import pytest
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.series import series_tags
from app.models.tag import Tag, TagCategory
from app.models.user import User
from tests.factories import make_series, make_tag


@pytest.mark.asyncio
async def test_create_tag(admin_client: httpx.AsyncClient, db_session: AsyncSession):
    """Test creating a new tag."""
    response = await admin_client.post(
        "/api/tags",
        json={"name": "Action", "category": "genre"},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Action"
    assert data["category"] == "genre"
    assert "id" in data
    assert "created_at" in data
    assert "updated_at" in data

    # Verify in DB
    result = await db_session.execute(select(Tag).where(Tag.id == uuid.UUID(data["id"])))
    tag = result.scalar_one()
    assert tag.name == "Action"
    assert tag.category == TagCategory.genre


@pytest.mark.asyncio
async def test_create_duplicate_tag(admin_client: httpx.AsyncClient, db_session: AsyncSession):
    """Test creating a duplicate tag returns 409."""
    # Create first tag
    tag = make_tag(name="Drama")
    db_session.add(tag)
    await db_session.commit()

    # Try to create duplicate
    response = await admin_client.post(
        "/api/tags",
        json={"name": "Drama", "category": "genre"},
    )
    assert response.status_code == 409
    assert "already exists" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_create_tag_without_category(
    admin_client: httpx.AsyncClient, db_session: AsyncSession
):
    """Test creating a tag without category (should be null)."""
    response = await admin_client.post(
        "/api/tags",
        json={"name": "Uncategorized"},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Uncategorized"
    assert data["category"] is None


@pytest.mark.asyncio
async def test_create_tag_as_editor(editor_client: httpx.AsyncClient):
    """Test that editors can create tags."""
    response = await editor_client.post(
        "/api/tags",
        json={"name": "Comedy", "category": "genre"},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Comedy"


@pytest.mark.asyncio
async def test_create_tag_unauthenticated(client: httpx.AsyncClient):
    """Test creating a tag without authentication returns 401."""
    response = await client.post(
        "/api/tags",
        json={"name": "Horror", "category": "genre"},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_list_tags(admin_client: httpx.AsyncClient, db_session: AsyncSession):
    """Test listing all tags."""
    # Create some tags
    tags = [
        make_tag(name="Adventure", category=TagCategory.genre),
        make_tag(name="Mystery", category=TagCategory.genre),
        make_tag(name="Upbeat", category=TagCategory.mood),
    ]
    for tag in tags:
        db_session.add(tag)
    await db_session.commit()

    response = await admin_client.get("/api/tags")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 3
    # Should be ordered by name
    names = [t["name"] for t in data]
    assert names == ["Adventure", "Mystery", "Upbeat"]


@pytest.mark.asyncio
async def test_list_tags_by_category(admin_client: httpx.AsyncClient, db_session: AsyncSession):
    """Test filtering tags by category."""
    # Create tags with different categories
    tags = [
        make_tag(name="Action", category=TagCategory.genre),
        make_tag(name="Drama", category=TagCategory.genre),
        make_tag(name="Happy", category=TagCategory.mood),
        make_tag(name="Arabic", category=TagCategory.language),
    ]
    for tag in tags:
        db_session.add(tag)
    await db_session.commit()

    # Filter by genre
    response = await admin_client.get("/api/tags", params={"category": "genre"})
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    assert all(t["category"] == "genre" for t in data)

    # Filter by mood
    response = await admin_client.get("/api/tags", params={"category": "mood"})
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["name"] == "Happy"


@pytest.mark.asyncio
async def test_update_tag(admin_client: httpx.AsyncClient, db_session: AsyncSession):
    """Test updating a tag."""
    # Create a tag
    tag = make_tag(name="OldName", category=TagCategory.genre)
    db_session.add(tag)
    await db_session.commit()

    # Update it
    response = await admin_client.patch(
        f"/api/tags/{tag.id}",
        json={"name": "NewName", "category": "mood"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == str(tag.id)
    assert data["name"] == "NewName"
    assert data["category"] == "mood"

    # Verify in DB
    await db_session.refresh(tag)
    assert tag.name == "NewName"
    assert tag.category == TagCategory.mood


@pytest.mark.asyncio
async def test_update_tag_not_found(admin_client: httpx.AsyncClient):
    """Test updating a non-existent tag returns 404."""
    fake_id = uuid.uuid4()
    response = await admin_client.patch(
        f"/api/tags/{fake_id}",
        json={"name": "NewName"},
    )
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_delete_tag(admin_client: httpx.AsyncClient, db_session: AsyncSession):
    """Test deleting a tag."""
    # Create a tag
    tag = make_tag(name="ToDelete")
    db_session.add(tag)
    await db_session.commit()

    # Delete it
    response = await admin_client.delete(f"/api/tags/{tag.id}")
    assert response.status_code == 204

    # Verify it's gone
    result = await db_session.execute(select(Tag).where(Tag.id == tag.id))
    assert result.scalar_one_or_none() is None


@pytest.mark.asyncio
async def test_delete_tag_in_use(
    admin_client: httpx.AsyncClient, db_session: AsyncSession, admin_user: User
):
    """Test deleting a tag that's used by a series returns 409."""
    # Create a tag
    tag = make_tag(name="InUse", category=TagCategory.genre)
    db_session.add(tag)
    await db_session.commit()

    # Create a series that uses the tag
    series = make_series(created_by=admin_user.id, title="Test Series")
    db_session.add(series)
    await db_session.commit()

    # Add tag to series via the join table
    stmt = series_tags.insert().values(series_id=series.id, tag_id=tag.id)
    await db_session.execute(stmt)
    await db_session.commit()

    # Try to delete the tag
    response = await admin_client.delete(f"/api/tags/{tag.id}")
    assert response.status_code == 409
    assert "in use" in response.json()["detail"].lower()

    # Verify tag still exists
    result = await db_session.execute(select(Tag).where(Tag.id == tag.id))
    assert result.scalar_one_or_none() is not None


@pytest.mark.asyncio
async def test_list_categories(admin_client: httpx.AsyncClient, db_session: AsyncSession):
    """Test listing distinct tag categories."""
    # Create tags with various categories
    tags = [
        make_tag(name="Action", category=TagCategory.genre),
        make_tag(name="Drama", category=TagCategory.genre),  # duplicate category
        make_tag(name="Happy", category=TagCategory.mood),
        make_tag(name="Arabic", category=TagCategory.language),
        make_tag(name="NoCategory", category=None),  # null category
    ]
    for tag in tags:
        db_session.add(tag)
    await db_session.commit()

    response = await admin_client.get("/api/tags/categories")
    assert response.status_code == 200
    data = response.json()
    # Should return distinct non-null categories
    assert set(data) == {"genre", "mood", "language"}
    assert None not in data
