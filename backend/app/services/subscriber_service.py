"""Subscriber business logic."""

import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.coin_transaction import CoinTransaction, TransactionType
from app.models.subscriber import Subscriber, SubscriberStatus


async def list_subscribers(
    db: AsyncSession,
    *,
    page: int = 1,
    per_page: int = 20,
    search: str | None = None,
    status: SubscriberStatus | None = None,
    country: str | None = None,
) -> dict:
    """List subscribers with pagination, search, and filters."""
    query = select(Subscriber)

    if search:
        pattern = f"%{search}%"
        query = query.where(
            (Subscriber.name.ilike(pattern)) | (Subscriber.email.ilike(pattern))
        )

    if status is not None:
        query = query.where(Subscriber.status == status)

    if country is not None:
        query = query.where(Subscriber.country == country)

    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    # Paginate
    offset = (page - 1) * per_page
    query = query.order_by(Subscriber.created_at.desc()).offset(offset).limit(per_page)

    result = await db.execute(query)
    items = list(result.scalars().all())

    return {"items": items, "total": total, "page": page, "per_page": per_page}


async def get_subscriber(db: AsyncSession, subscriber_id: uuid.UUID) -> Subscriber | None:
    """Fetch a single subscriber by ID."""
    result = await db.execute(
        select(Subscriber).where(Subscriber.id == subscriber_id)
    )
    return result.scalar_one_or_none()


async def update_subscriber(
    db: AsyncSession,
    subscriber_id: uuid.UUID,
    **fields,
) -> Subscriber | None:
    """Update subscriber fields (status, admin_notes). Returns None if not found."""
    result = await db.execute(
        select(Subscriber).where(Subscriber.id == subscriber_id)
    )
    subscriber = result.scalar_one_or_none()
    if subscriber is None:
        return None

    for key, value in fields.items():
        if hasattr(subscriber, key):
            setattr(subscriber, key, value)

    await db.commit()
    await db.refresh(subscriber)
    return subscriber


async def adjust_coins(
    db: AsyncSession,
    subscriber_id: uuid.UUID,
    *,
    amount: int,
    description: str,
    admin_user_id: uuid.UUID,
) -> CoinTransaction:
    """Credit or debit coins for a subscriber.

    Creates a transaction record and updates balance atomically.
    Raises ValueError if debit would result in negative balance.
    Raises ValueError if subscriber not found.
    """
    result = await db.execute(
        select(Subscriber).where(Subscriber.id == subscriber_id)
    )
    subscriber = result.scalar_one_or_none()
    if subscriber is None:
        raise ValueError("Subscriber not found")

    new_balance = subscriber.coin_balance + amount
    if new_balance < 0:
        raise ValueError("Insufficient coin balance")

    subscriber.coin_balance = new_balance

    transaction = CoinTransaction(
        subscriber_id=subscriber_id,
        type=TransactionType.adjustment,
        amount=amount,
        balance_after=new_balance,
        reference_type="admin",
        created_by=admin_user_id,
        description=description,
    )
    db.add(transaction)

    await db.commit()
    await db.refresh(transaction)
    return transaction


async def get_subscriber_transactions(
    db: AsyncSession,
    subscriber_id: uuid.UUID,
    *,
    page: int = 1,
    per_page: int = 20,
    type_filter: TransactionType | None = None,
) -> dict:
    """Get paginated transaction history for a subscriber."""
    query = select(CoinTransaction).where(
        CoinTransaction.subscriber_id == subscriber_id
    )

    if type_filter is not None:
        query = query.where(CoinTransaction.type == type_filter)

    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    # Paginate (newest first)
    offset = (page - 1) * per_page
    query = query.order_by(CoinTransaction.created_at.desc()).offset(offset).limit(per_page)

    result = await db.execute(query)
    items = list(result.scalars().all())

    return {"items": items, "total": total, "page": page, "per_page": per_page}
