"""Category business logic."""

import uuid

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.category import Category, category_tags
from app.models.series import Series, series_tags
from app.models.tag import Tag


async def create_category(
    db: AsyncSession,
    *,
    name: str,
    icon: str | None = None,
    description: str | None = None,
    parent_id: uuid.UUID | None = None,
    tag_ids: list[uuid.UUID] | None = None,
    match_mode: str = "any",
) -> Category:
    """Create a category. Validates parent is a root category."""
    # If parent_id given, verify it exists and is a root category
    if parent_id is not None:
        result = await db.execute(select(Category).where(Category.id == parent_id))
        parent = result.scalar_one_or_none()
        if parent is None:
            raise ValueError("Parent category not found")
        if parent.parent_id is not None:
            raise ValueError("Cannot nest more than 2 levels deep — parent must be a root category")

    # Validate match_mode
    if match_mode not in ("any", "all"):
        raise ValueError("match_mode must be 'any' or 'all'")

    category = Category(
        name=name,
        icon=icon,
        description=description,
        parent_id=parent_id,
        match_mode=match_mode,
    )

    # Handle tags
    if tag_ids:
        result = await db.execute(select(Tag).where(Tag.id.in_(tag_ids)))
        tags = result.scalars().all()
        if len(tags) != len(tag_ids):
            raise ValueError("One or more tags not found")
        category.tags = list(tags)

    db.add(category)
    await db.commit()
    await db.refresh(category)
    return category


async def get_category(db: AsyncSession, category_id: uuid.UUID) -> Category | None:
    """Fetch a single category with tags and children eagerly loaded."""
    result = await db.execute(
        select(Category)
        .options(
            selectinload(Category.tags),
            selectinload(Category.children).selectinload(Category.tags),
        )
        .where(Category.id == category_id)
    )
    return result.scalar_one_or_none()


async def list_categories(db: AsyncSession) -> list[Category]:
    """List all categories flat, ordered by sort_order."""
    result = await db.execute(
        select(Category)
        .options(selectinload(Category.tags))
        .order_by(Category.sort_order)
    )
    return list(result.scalars().all())


async def get_category_tree(db: AsyncSession) -> list[Category]:
    """Get root categories with children nested, ordered by sort_order."""
    result = await db.execute(
        select(Category)
        .options(
            selectinload(Category.tags),
            selectinload(Category.children).options(
                selectinload(Category.tags),
                selectinload(Category.children)  # Load grandchildren too (though shouldn't exist)
            ),
        )
        .where(Category.parent_id.is_(None))
        .order_by(Category.sort_order)
    )
    return list(result.scalars().all())


async def update_category(
    db: AsyncSession,
    category_id: uuid.UUID,
    **fields,
) -> Category | None:
    """Update category fields. Returns None if not found."""
    result = await db.execute(
        select(Category).where(Category.id == category_id)
    )
    category = result.scalar_one_or_none()
    if category is None:
        return None

    for key, value in fields.items():
        if key == "match_mode" and value not in ("any", "all"):
            raise ValueError("match_mode must be 'any' or 'all'")
        if hasattr(category, key):
            setattr(category, key, value)

    await db.commit()
    await db.refresh(category)
    return category


async def delete_category(db: AsyncSession, category_id: uuid.UUID) -> bool:
    """Delete a category. Raises ValueError if it has subcategories. Returns False if not found."""
    result = await db.execute(
        select(Category)
        .options(selectinload(Category.children))
        .where(Category.id == category_id)
    )
    category = result.scalar_one_or_none()
    if category is None:
        return False

    if category.children:
        raise ValueError("Cannot delete category with subcategories — delete children first")

    await db.delete(category)
    await db.commit()
    return True


async def set_category_tags(
    db: AsyncSession,
    category_id: uuid.UUID,
    tag_ids: list[uuid.UUID],
) -> Category | None:
    """Replace all tags for a category. Returns None if category not found."""
    result = await db.execute(
        select(Category).options(selectinload(Category.tags)).where(Category.id == category_id)
    )
    category = result.scalar_one_or_none()
    if category is None:
        return None

    if tag_ids:
        result = await db.execute(select(Tag).where(Tag.id.in_(tag_ids)))
        tags = list(result.scalars().all())
        if len(tags) != len(tag_ids):
            raise ValueError("One or more tags not found")
        category.tags = tags
    else:
        category.tags = []

    await db.commit()
    await db.refresh(category)
    return category


async def reorder_categories(
    db: AsyncSession,
    items: list[dict],  # [{"id": uuid, "sort_order": int}, ...]
) -> None:
    """Batch update sort_order for multiple categories."""
    for item in items:
        result = await db.execute(
            select(Category).where(Category.id == item["id"])
        )
        category = result.scalar_one_or_none()
        if category is not None:
            category.sort_order = item["sort_order"]
    await db.commit()


async def get_category_series(
    db: AsyncSession,
    category_id: uuid.UUID,
    page: int = 1,
    per_page: int = 20,
) -> dict:
    """Resolve series for a category based on its tags and match_mode.

    For parent categories: aggregates tags from self + all subcategories.
    Returns {items: list[Series], total: int, page: int, per_page: int}.
    """
    # Fetch category with children and all tags
    result = await db.execute(
        select(Category)
        .options(
            selectinload(Category.tags),
            selectinload(Category.children).selectinload(Category.tags),
        )
        .where(Category.id == category_id)
    )
    category = result.scalar_one_or_none()
    if category is None:
        return {"items": [], "total": 0, "page": page, "per_page": per_page}

    # Collect all tag IDs (own tags + subcategory tags)
    tag_ids = {tag.id for tag in category.tags}
    for child in category.children:
        for tag in child.tags:
            tag_ids.add(tag.id)

    if not tag_ids:
        return {"items": [], "total": 0, "page": page, "per_page": per_page}

    # Build query based on match_mode
    query = select(Series).options(selectinload(Series.tags))

    if category.match_mode == "all":
        # ALL: series must have every tag
        for tid in tag_ids:
            query = query.where(
                select(1)
                .select_from(series_tags)
                .where(
                    series_tags.c.series_id == Series.id,
                    series_tags.c.tag_id == tid,
                )
                .exists()
            )
    else:
        # ANY: series has at least one tag
        query = query.where(
            select(1)
            .select_from(series_tags)
            .where(
                series_tags.c.series_id == Series.id,
                series_tags.c.tag_id.in_(tag_ids),
            )
            .exists()
        )

    # Count
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    # Paginate
    offset = (page - 1) * per_page
    query = query.order_by(Series.created_at.desc()).offset(offset).limit(per_page)

    result = await db.execute(query)
    items = list(result.scalars().all())

    return {"items": items, "total": total, "page": page, "per_page": per_page}