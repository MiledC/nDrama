"""Tests for category CRUD endpoints."""

import uuid

import httpx
import pytest
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.category import Category, category_tags
from app.models.series import series_tags
from app.models.tag import TagCategory
from app.models.user import User
from tests.factories import make_category, make_series, make_tag


@pytest.mark.asyncio
async def test_create_root_category(admin_client: httpx.AsyncClient, db_session: AsyncSession):
    """Test creating a root category."""
    response = await admin_client.post(
        "/api/categories",
        json={
            "name": "Action & Adventure",
            "icon": "🚀",
            "description": "High-energy content",
            "match_mode": "any",
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Action & Adventure"
    assert data["icon"] == "🚀"
    assert data["description"] == "High-energy content"
    assert data["parent_id"] is None
    assert data["match_mode"] == "any"
    assert data["tags"] == []
    assert "id" in data
    assert "created_at" in data
    assert "updated_at" in data

    # Verify in DB
    result = await db_session.execute(select(Category).where(Category.id == uuid.UUID(data["id"])))
    category = result.scalar_one()
    assert category.name == "Action & Adventure"
    assert category.parent_id is None


@pytest.mark.asyncio
async def test_create_subcategory(admin_client: httpx.AsyncClient, db_session: AsyncSession):
    """Test creating a subcategory under a root category."""
    # Create parent category
    parent = make_category(name="Entertainment", icon="🎬")
    db_session.add(parent)
    await db_session.commit()

    # Create subcategory
    response = await admin_client.post(
        "/api/categories",
        json={
            "name": "Movies",
            "icon": "🎞️",
            "description": "Full-length films",
            "parent_id": str(parent.id),
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Movies"
    assert data["parent_id"] == str(parent.id)


@pytest.mark.asyncio
async def test_create_category_with_tags(
    admin_client: httpx.AsyncClient, db_session: AsyncSession
):
    """Test creating a category with initial tags."""
    # Create some tags
    tag1 = make_tag(name="Sci-Fi", category=TagCategory.genre)
    tag2 = make_tag(name="Fantasy", category=TagCategory.genre)
    db_session.add(tag1)
    db_session.add(tag2)
    await db_session.commit()

    # Create category with tags
    response = await admin_client.post(
        "/api/categories",
        json={
            "name": "Speculative Fiction",
            "tag_ids": [str(tag1.id), str(tag2.id)],
            "match_mode": "all",
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Speculative Fiction"
    assert data["match_mode"] == "all"
    assert len(data["tags"]) == 2
    tag_names = {t["name"] for t in data["tags"]}
    assert tag_names == {"Sci-Fi", "Fantasy"}


@pytest.mark.asyncio
async def test_create_category_nesting_too_deep(
    admin_client: httpx.AsyncClient, db_session: AsyncSession
):
    """Test that creating a category more than 2 levels deep fails."""
    # Create root category
    root = make_category(name="Root")
    db_session.add(root)
    await db_session.commit()

    # Create subcategory
    sub = make_category(name="Sub", parent_id=root.id)
    db_session.add(sub)
    await db_session.commit()

    # Try to create sub-subcategory (should fail)
    response = await admin_client.post(
        "/api/categories",
        json={"name": "SubSub", "parent_id": str(sub.id)},
    )
    assert response.status_code == 400
    assert "parent must be a root category" in response.json()["detail"]


@pytest.mark.asyncio
async def test_create_category_invalid_match_mode(admin_client: httpx.AsyncClient):
    """Test that invalid match_mode is rejected."""
    response = await admin_client.post(
        "/api/categories",
        json={"name": "Invalid", "match_mode": "invalid"},
    )
    assert response.status_code == 422  # Pydantic validation error


@pytest.mark.asyncio
async def test_create_category_as_editor(editor_client: httpx.AsyncClient):
    """Test that editors can create categories."""
    response = await editor_client.post(
        "/api/categories",
        json={"name": "Editor Category"},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Editor Category"


@pytest.mark.asyncio
async def test_create_category_unauthenticated(client: httpx.AsyncClient):
    """Test creating a category without authentication returns 401."""
    response = await client.post(
        "/api/categories",
        json={"name": "Unauthenticated"},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_get_category(admin_client: httpx.AsyncClient, db_session: AsyncSession):
    """Test getting a single category with its tags and children."""
    # Create parent category with tags
    parent = make_category(name="Parent", icon="📁")
    tag1 = make_tag(name="Tag1")
    tag2 = make_tag(name="Tag2")
    db_session.add_all([parent, tag1, tag2])
    await db_session.commit()

    # Add tags to parent via the join table
    await db_session.execute(category_tags.insert().values(category_id=parent.id, tag_id=tag1.id))
    await db_session.execute(category_tags.insert().values(category_id=parent.id, tag_id=tag2.id))
    await db_session.commit()

    # Create child categories
    child1 = make_category(name="Child1", parent_id=parent.id, sort_order=1)
    child2 = make_category(name="Child2", parent_id=parent.id, sort_order=0)
    db_session.add_all([child1, child2])
    await db_session.commit()

    # Get the parent category
    response = await admin_client.get(f"/api/categories/{parent.id}")
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Parent"
    assert data["icon"] == "📁"
    assert len(data["tags"]) == 2
    tag_names = {t["name"] for t in data["tags"]}
    assert tag_names == {"Tag1", "Tag2"}


@pytest.mark.asyncio
async def test_get_category_not_found(admin_client: httpx.AsyncClient):
    """Test getting a non-existent category returns 404."""
    fake_id = uuid.uuid4()
    response = await admin_client.get(f"/api/categories/{fake_id}")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_list_categories(admin_client: httpx.AsyncClient, db_session: AsyncSession):
    """Test listing all categories flat."""
    # Create categories with different sort orders
    cat1 = make_category(name="Cat1", sort_order=2)
    cat2 = make_category(name="Cat2", sort_order=0)
    cat3 = make_category(name="Cat3", sort_order=1)
    db_session.add_all([cat1, cat2, cat3])
    await db_session.commit()

    response = await admin_client.get("/api/categories")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 3
    # Should be ordered by sort_order
    names = [c["name"] for c in data]
    assert names == ["Cat2", "Cat3", "Cat1"]


@pytest.mark.asyncio
async def test_get_category_tree(client: httpx.AsyncClient, db_session: AsyncSession):
    """Test getting the category tree (public endpoint)."""
    # Create root categories
    root1 = make_category(name="Root1", sort_order=1)
    root2 = make_category(name="Root2", sort_order=0)
    db_session.add_all([root1, root2])
    await db_session.commit()

    # Create subcategories
    sub1_1 = make_category(name="Sub1-1", parent_id=root1.id, sort_order=0)
    sub1_2 = make_category(name="Sub1-2", parent_id=root1.id, sort_order=1)
    sub2_1 = make_category(name="Sub2-1", parent_id=root2.id, sort_order=0)
    db_session.add_all([sub1_1, sub1_2, sub2_1])
    await db_session.commit()

    # Get tree (no auth required)
    response = await client.get("/api/categories/tree")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2  # Only root categories at top level

    # Check ordering
    assert data[0]["name"] == "Root2"  # sort_order=0
    assert data[1]["name"] == "Root1"  # sort_order=1

    # Check children
    assert len(data[0]["children"]) == 1
    assert data[0]["children"][0]["name"] == "Sub2-1"

    assert len(data[1]["children"]) == 2
    assert data[1]["children"][0]["name"] == "Sub1-1"  # sort_order=0
    assert data[1]["children"][1]["name"] == "Sub1-2"  # sort_order=1


@pytest.mark.asyncio
async def test_update_category(admin_client: httpx.AsyncClient, db_session: AsyncSession):
    """Test updating a category."""
    # Create a category
    category = make_category(name="OldName", icon="🔴", description="Old desc", match_mode="any")
    db_session.add(category)
    await db_session.commit()

    # Update it
    response = await admin_client.patch(
        f"/api/categories/{category.id}",
        json={
            "name": "NewName",
            "icon": "🟢",
            "description": "New description",
            "sort_order": 5,
            "match_mode": "all",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == str(category.id)
    assert data["name"] == "NewName"
    assert data["icon"] == "🟢"
    assert data["description"] == "New description"
    assert data["sort_order"] == 5
    assert data["match_mode"] == "all"

    # Verify in DB
    await db_session.refresh(category)
    assert category.name == "NewName"
    assert category.icon == "🟢"
    assert category.sort_order == 5
    assert category.match_mode == "all"


@pytest.mark.asyncio
async def test_update_category_not_found(admin_client: httpx.AsyncClient):
    """Test updating a non-existent category returns 404."""
    fake_id = uuid.uuid4()
    response = await admin_client.patch(
        f"/api/categories/{fake_id}",
        json={"name": "NewName"},
    )
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_update_category_invalid_match_mode(
    admin_client: httpx.AsyncClient, db_session: AsyncSession
):
    """Test updating with invalid match_mode returns 400."""
    category = make_category(name="TestCategory")
    db_session.add(category)
    await db_session.commit()

    response = await admin_client.patch(
        f"/api/categories/{category.id}",
        json={"match_mode": "invalid"},
    )
    assert response.status_code == 422  # Pydantic validation


@pytest.mark.asyncio
async def test_delete_category(admin_client: httpx.AsyncClient, db_session: AsyncSession):
    """Test deleting a category."""
    # Create a category
    category = make_category(name="ToDelete")
    db_session.add(category)
    await db_session.commit()

    # Delete it
    response = await admin_client.delete(f"/api/categories/{category.id}")
    assert response.status_code == 204

    # Verify it's gone
    result = await db_session.execute(select(Category).where(Category.id == category.id))
    assert result.scalar_one_or_none() is None


@pytest.mark.asyncio
async def test_delete_category_with_children(
    admin_client: httpx.AsyncClient, db_session: AsyncSession
):
    """Test deleting a category with subcategories returns 409."""
    # Create parent and child
    parent = make_category(name="Parent")
    db_session.add(parent)
    await db_session.commit()

    child = make_category(name="Child", parent_id=parent.id)
    db_session.add(child)
    await db_session.commit()

    # Try to delete parent
    response = await admin_client.delete(f"/api/categories/{parent.id}")
    assert response.status_code == 409
    assert "Cannot delete category with subcategories" in response.json()["detail"]

    # Verify parent still exists
    result = await db_session.execute(select(Category).where(Category.id == parent.id))
    assert result.scalar_one_or_none() is not None


@pytest.mark.asyncio
async def test_delete_category_not_found(admin_client: httpx.AsyncClient):
    """Test deleting a non-existent category returns 404."""
    fake_id = uuid.uuid4()
    response = await admin_client.delete(f"/api/categories/{fake_id}")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_set_category_tags(admin_client: httpx.AsyncClient, db_session: AsyncSession):
    """Test setting tags for a category."""
    # Create category and tags
    category = make_category(name="TestCategory")
    tag1 = make_tag(name="Tag1")
    tag2 = make_tag(name="Tag2")
    tag3 = make_tag(name="Tag3")
    db_session.add_all([category, tag1, tag2, tag3])
    await db_session.commit()

    # Set initial tags
    response = await admin_client.put(
        f"/api/categories/{category.id}/tags",
        json={"tag_ids": [str(tag1.id), str(tag2.id)]},
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data["tags"]) == 2
    tag_names = {t["name"] for t in data["tags"]}
    assert tag_names == {"Tag1", "Tag2"}

    # Replace tags
    response = await admin_client.put(
        f"/api/categories/{category.id}/tags",
        json={"tag_ids": [str(tag3.id)]},
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data["tags"]) == 1
    assert data["tags"][0]["name"] == "Tag3"

    # Clear tags
    response = await admin_client.put(
        f"/api/categories/{category.id}/tags",
        json={"tag_ids": []},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["tags"] == []


@pytest.mark.asyncio
async def test_set_category_tags_not_found(admin_client: httpx.AsyncClient):
    """Test setting tags for a non-existent category returns 404."""
    fake_id = uuid.uuid4()
    response = await admin_client.put(
        f"/api/categories/{fake_id}/tags",
        json={"tag_ids": []},
    )
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_set_category_tags_invalid_tag(
    admin_client: httpx.AsyncClient, db_session: AsyncSession
):
    """Test setting invalid tag IDs returns 400."""
    category = make_category(name="TestCategory")
    db_session.add(category)
    await db_session.commit()

    fake_tag_id = uuid.uuid4()
    response = await admin_client.put(
        f"/api/categories/{category.id}/tags",
        json={"tag_ids": [str(fake_tag_id)]},
    )
    assert response.status_code == 400
    assert "tags not found" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_reorder_categories(admin_client: httpx.AsyncClient, db_session: AsyncSession):
    """Test batch reordering categories."""
    # Create categories
    cat1 = make_category(name="Cat1", sort_order=0)
    cat2 = make_category(name="Cat2", sort_order=1)
    cat3 = make_category(name="Cat3", sort_order=2)
    db_session.add_all([cat1, cat2, cat3])
    await db_session.commit()

    # Reorder them
    response = await admin_client.patch(
        "/api/categories/reorder",
        json={
            "items": [
                {"id": str(cat1.id), "sort_order": 2},
                {"id": str(cat2.id), "sort_order": 0},
                {"id": str(cat3.id), "sort_order": 1},
            ]
        },
    )
    assert response.status_code == 204

    # Verify new order
    await db_session.refresh(cat1)
    await db_session.refresh(cat2)
    await db_session.refresh(cat3)
    assert cat1.sort_order == 2
    assert cat2.sort_order == 0
    assert cat3.sort_order == 1


@pytest.mark.asyncio
async def test_get_category_series_any_match(
    client: httpx.AsyncClient, db_session: AsyncSession, admin_user: User
):
    """Test getting series for a category with match_mode='any'."""
    # Create tags
    tag1 = make_tag(name="Action")
    tag2 = make_tag(name="Adventure")
    tag3 = make_tag(name="Drama")
    db_session.add_all([tag1, tag2, tag3])
    await db_session.commit()

    # Create category with tags (match_mode='any')
    category = make_category(name="ActionAdventure", match_mode="any")
    category.tags = [tag1, tag2]
    db_session.add(category)
    await db_session.commit()

    # Create series with different tag combinations
    series1 = make_series(created_by=admin_user.id, title="Series1")  # Has tag1
    series2 = make_series(created_by=admin_user.id, title="Series2")  # Has tag2
    series3 = make_series(created_by=admin_user.id, title="Series3")  # Has both tag1 and tag2
    series4 = make_series(created_by=admin_user.id, title="Series4")  # Has tag3 (not in category)
    db_session.add_all([series1, series2, series3, series4])
    await db_session.commit()

    # Add tags to series via join table
    await db_session.execute(series_tags.insert().values(series_id=series1.id, tag_id=tag1.id))
    await db_session.execute(series_tags.insert().values(series_id=series2.id, tag_id=tag2.id))
    await db_session.execute(series_tags.insert().values(series_id=series3.id, tag_id=tag1.id))
    await db_session.execute(series_tags.insert().values(series_id=series3.id, tag_id=tag2.id))
    await db_session.execute(series_tags.insert().values(series_id=series4.id, tag_id=tag3.id))
    await db_session.commit()

    # Get series for category (public endpoint)
    response = await client.get(f"/api/categories/{category.id}/series")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 3  # series1, series2, series3 (not series4)
    assert len(data["items"]) == 3
    titles = {s["title"] for s in data["items"]}
    assert titles == {"Series1", "Series2", "Series3"}


@pytest.mark.asyncio
async def test_get_category_series_all_match(
    client: httpx.AsyncClient, db_session: AsyncSession, admin_user: User
):
    """Test getting series for a category with match_mode='all'."""
    # Create tags
    tag1 = make_tag(name="Action")
    tag2 = make_tag(name="Adventure")
    db_session.add_all([tag1, tag2])
    await db_session.commit()

    # Create category with tags (match_mode='all')
    category = make_category(name="ActionAdventure", match_mode="all")
    category.tags = [tag1, tag2]
    db_session.add(category)
    await db_session.commit()

    # Create series with different tag combinations
    series1 = make_series(created_by=admin_user.id, title="Series1")  # Has only tag1
    series2 = make_series(created_by=admin_user.id, title="Series2")  # Has only tag2
    series3 = make_series(created_by=admin_user.id, title="Series3")  # Has both tag1 and tag2
    db_session.add_all([series1, series2, series3])
    await db_session.commit()

    # Add tags to series
    await db_session.execute(series_tags.insert().values(series_id=series1.id, tag_id=tag1.id))
    await db_session.execute(series_tags.insert().values(series_id=series2.id, tag_id=tag2.id))
    await db_session.execute(series_tags.insert().values(series_id=series3.id, tag_id=tag1.id))
    await db_session.execute(series_tags.insert().values(series_id=series3.id, tag_id=tag2.id))
    await db_session.commit()

    # Get series for category
    response = await client.get(f"/api/categories/{category.id}/series")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 1  # Only series3 has both tags
    assert len(data["items"]) == 1
    assert data["items"][0]["title"] == "Series3"


@pytest.mark.asyncio
async def test_get_category_series_with_subcategories(
    client: httpx.AsyncClient, db_session: AsyncSession, admin_user: User
):
    """Test that parent category aggregates tags from subcategories."""
    # Create tags
    tag1 = make_tag(name="ParentTag")
    tag2 = make_tag(name="Child1Tag")
    tag3 = make_tag(name="Child2Tag")
    db_session.add_all([tag1, tag2, tag3])
    await db_session.commit()

    # Create parent category with one tag
    parent = make_category(name="Parent", match_mode="any")
    parent.tags = [tag1]
    db_session.add(parent)
    await db_session.commit()

    # Create child categories with their own tags
    child1 = make_category(name="Child1", parent_id=parent.id)
    child1.tags = [tag2]
    child2 = make_category(name="Child2", parent_id=parent.id)
    child2.tags = [tag3]
    db_session.add_all([child1, child2])
    await db_session.commit()

    # Create series with different tags
    series1 = make_series(created_by=admin_user.id, title="Series1")  # Has parent tag
    series2 = make_series(created_by=admin_user.id, title="Series2")  # Has child1 tag
    series3 = make_series(created_by=admin_user.id, title="Series3")  # Has child2 tag
    series4 = make_series(created_by=admin_user.id, title="Series4")  # Has no relevant tags
    db_session.add_all([series1, series2, series3, series4])
    await db_session.commit()

    # Add tags to series
    await db_session.execute(series_tags.insert().values(series_id=series1.id, tag_id=tag1.id))
    await db_session.execute(series_tags.insert().values(series_id=series2.id, tag_id=tag2.id))
    await db_session.execute(series_tags.insert().values(series_id=series3.id, tag_id=tag3.id))
    await db_session.commit()

    # Get series for parent category (should include all three)
    response = await client.get(f"/api/categories/{parent.id}/series")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 3
    titles = {s["title"] for s in data["items"]}
    assert titles == {"Series1", "Series2", "Series3"}


@pytest.mark.asyncio
async def test_get_category_series_pagination(
    client: httpx.AsyncClient, db_session: AsyncSession, admin_user: User
):
    """Test pagination for category series endpoint."""
    # Create tag and category
    tag = make_tag(name="TestTag")
    db_session.add(tag)
    await db_session.commit()

    category = make_category(name="TestCategory")
    category.tags = [tag]
    db_session.add(category)
    await db_session.commit()

    # Create multiple series with the tag
    series_list = []
    for i in range(5):
        series = make_series(created_by=admin_user.id, title=f"Series{i}")
        series_list.append(series)
        db_session.add(series)
    await db_session.commit()

    # Add tag to all series
    for series in series_list:
        await db_session.execute(series_tags.insert().values(series_id=series.id, tag_id=tag.id))
    await db_session.commit()

    # Test pagination
    url = f"/api/categories/{category.id}/series"
    response = await client.get(url, params={"page": 1, "per_page": 2})
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 5
    assert data["page"] == 1
    assert data["per_page"] == 2
    assert len(data["items"]) == 2

    # Get second page
    response = await client.get(url, params={"page": 2, "per_page": 2})
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 5
    assert data["page"] == 2
    assert len(data["items"]) == 2

    # Get third page
    response = await client.get(url, params={"page": 3, "per_page": 2})
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 5
    assert data["page"] == 3
    assert len(data["items"]) == 1


@pytest.mark.asyncio
async def test_get_category_series_empty(client: httpx.AsyncClient, db_session: AsyncSession):
    """Test getting series for a category with no tags returns empty."""
    # Create category without tags
    category = make_category(name="EmptyCategory")
    db_session.add(category)
    await db_session.commit()

    response = await client.get(f"/api/categories/{category.id}/series")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 0
    assert data["items"] == []


@pytest.mark.asyncio
async def test_get_category_series_not_found(client: httpx.AsyncClient):
    """Test getting series for non-existent category returns empty."""
    fake_id = uuid.uuid4()
    response = await client.get(f"/api/categories/{fake_id}/series")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 0
    assert data["items"] == []
