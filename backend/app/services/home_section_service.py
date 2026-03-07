"""Home section business logic."""

import uuid
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.home_section import HomeSection


async def list_sections(db: AsyncSession) -> list[HomeSection]:
    """List all home sections, ordered by sort_order."""
    query = select(HomeSection).order_by(HomeSection.sort_order, HomeSection.created_at)
    result = await db.execute(query)
    return list(result.scalars().all())


async def get_section(db: AsyncSession, section_id: uuid.UUID) -> HomeSection | None:
    """Fetch a single home section by ID."""
    result = await db.execute(
        select(HomeSection).where(HomeSection.id == section_id)
    )
    return result.scalar_one_or_none()


async def create_section(
    db: AsyncSession,
    *,
    type: str,
    title: str,
    config: dict[str, Any] | None = None,
    sort_order: int = 0,
    is_active: bool = True,
) -> HomeSection:
    """Create a new home section."""
    section = HomeSection(
        type=type,
        title=title,
        config=config or {},
        sort_order=sort_order,
        is_active=is_active,
    )
    db.add(section)
    await db.commit()
    await db.refresh(section)
    return section


async def update_section(
    db: AsyncSession,
    section_id: uuid.UUID,
    **fields,
) -> HomeSection | None:
    """Update home section fields. Returns None if not found."""
    result = await db.execute(
        select(HomeSection).where(HomeSection.id == section_id)
    )
    section = result.scalar_one_or_none()
    if section is None:
        return None

    for key, value in fields.items():
        if hasattr(section, key):
            setattr(section, key, value)

    await db.commit()
    await db.refresh(section)
    return section


async def delete_section(db: AsyncSession, section_id: uuid.UUID) -> bool:
    """Delete a home section. Returns False if not found."""
    result = await db.execute(
        select(HomeSection).where(HomeSection.id == section_id)
    )
    section = result.scalar_one_or_none()
    if section is None:
        return False

    await db.delete(section)
    await db.commit()
    return True
