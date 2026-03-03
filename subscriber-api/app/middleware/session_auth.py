import uuid

from fastapi import Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.subscriber import Subscriber, SubscriberStatus
from app.redis import get_session


async def get_current_subscriber(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> Subscriber:
    """Validate session token and return the subscriber.

    Any authenticated subscriber (anonymous or active) is allowed.
    """
    token = request.headers.get("X-Session-Token")
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing session token",
        )

    subscriber_id = await get_session(token)
    if subscriber_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired session token",
        )

    result = await db.execute(
        select(Subscriber).where(Subscriber.id == uuid.UUID(subscriber_id))
    )
    subscriber = result.scalar_one_or_none()

    if subscriber is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Subscriber not found",
        )

    if subscriber.status in (SubscriberStatus.suspended, SubscriberStatus.banned):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Account is {subscriber.status.value}",
        )

    # Store token on request for logout
    request.state.session_token = token
    return subscriber


async def require_active_subscriber(
    subscriber: Subscriber = Depends(get_current_subscriber),
) -> Subscriber:
    """Only registered (active) subscribers allowed."""
    if subscriber.status != SubscriberStatus.active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Registration required",
        )
    return subscriber
