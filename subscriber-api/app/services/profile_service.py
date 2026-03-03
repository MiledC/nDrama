from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.subscriber import Subscriber, SubscriberStatus
from app.redis import delete_all_sessions


async def get_profile(db: AsyncSession, subscriber_id) -> Subscriber | None:
    """Return subscriber profile."""
    result = await db.execute(
        select(Subscriber).where(Subscriber.id == subscriber_id)
    )
    return result.scalar_one_or_none()


async def update_profile(
    db: AsyncSession, subscriber: Subscriber, **fields
) -> Subscriber:
    """Update subscriber profile fields."""
    allowed = {"name", "avatar_url", "country", "language"}
    for key, value in fields.items():
        if key in allowed and value is not None:
            setattr(subscriber, key, value)
    await db.commit()
    await db.refresh(subscriber)
    return subscriber


async def delete_account(db: AsyncSession, subscriber: Subscriber) -> None:
    """Soft-delete account and revoke all sessions."""
    subscriber.status = SubscriberStatus.banned  # Use banned as soft-delete state
    await db.commit()
    await delete_all_sessions(str(subscriber.id))
