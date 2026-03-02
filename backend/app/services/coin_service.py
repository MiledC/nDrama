"""Coin package business logic."""

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.coin_package import CoinPackage


async def list_packages(
    db: AsyncSession,
    *,
    include_inactive: bool = True,
) -> list[CoinPackage]:
    """List all coin packages, ordered by sort_order."""
    query = select(CoinPackage)

    if not include_inactive:
        query = query.where(CoinPackage.is_active.is_(True))

    query = query.order_by(CoinPackage.sort_order, CoinPackage.name)

    result = await db.execute(query)
    return list(result.scalars().all())


async def get_package(db: AsyncSession, package_id: uuid.UUID) -> CoinPackage | None:
    """Fetch a single coin package by ID."""
    result = await db.execute(
        select(CoinPackage).where(CoinPackage.id == package_id)
    )
    return result.scalar_one_or_none()


async def create_package(
    db: AsyncSession,
    *,
    name: str,
    coin_amount: int,
    price_sar: float,
    created_by: uuid.UUID,
    description: str | None = None,
    sort_order: int = 0,
) -> CoinPackage:
    """Create a new coin package."""
    package = CoinPackage(
        name=name,
        description=description,
        coin_amount=coin_amount,
        price_sar=price_sar,
        sort_order=sort_order,
        created_by=created_by,
    )
    db.add(package)
    await db.commit()
    await db.refresh(package)
    return package


async def update_package(
    db: AsyncSession,
    package_id: uuid.UUID,
    **fields,
) -> CoinPackage | None:
    """Update coin package fields. Returns None if not found."""
    result = await db.execute(
        select(CoinPackage).where(CoinPackage.id == package_id)
    )
    package = result.scalar_one_or_none()
    if package is None:
        return None

    for key, value in fields.items():
        if hasattr(package, key):
            setattr(package, key, value)

    await db.commit()
    await db.refresh(package)
    return package


async def deactivate_package(db: AsyncSession, package_id: uuid.UUID) -> bool:
    """Soft-delete a coin package (set is_active=false). Returns False if not found."""
    result = await db.execute(
        select(CoinPackage).where(CoinPackage.id == package_id)
    )
    package = result.scalar_one_or_none()
    if package is None:
        return False

    package.is_active = False
    await db.commit()
    return True
