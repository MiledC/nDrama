"""Subscriber management endpoints (admin panel)."""

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth import get_current_user, require_admin
from app.models.subscriber import SubscriberStatus
from app.models.user import User
from app.schemas.subscriber import (
    CoinAdjustmentRequest,
    CoinTransactionListResponse,
    SubscriberListResponse,
    SubscriberResponse,
    SubscriberUpdate,
)
from app.services import subscriber_service

router = APIRouter(prefix="/api/subscribers", tags=["subscribers"])


@router.get("", response_model=SubscriberListResponse)
async def list_subscribers(
    _user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    search: str | None = Query(None),
    status_filter: SubscriberStatus | None = Query(None, alias="status"),
    country: str | None = Query(None),
):
    """List subscribers with pagination, search, and filters."""
    return await subscriber_service.list_subscribers(
        db,
        page=page,
        per_page=per_page,
        search=search,
        status=status_filter,
        country=country,
    )


@router.get("/{subscriber_id}", response_model=SubscriberResponse)
async def get_subscriber(
    subscriber_id: uuid.UUID,
    _user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Get a single subscriber by ID."""
    subscriber = await subscriber_service.get_subscriber(db, subscriber_id)
    if subscriber is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Subscriber not found"
        )
    return subscriber


@router.patch("/{subscriber_id}", response_model=SubscriberResponse)
async def update_subscriber(
    subscriber_id: uuid.UUID,
    request: SubscriberUpdate,
    _admin: Annotated[User, Depends(require_admin)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Update subscriber status or admin notes. Admin only."""
    update_data = request.model_dump(exclude_unset=True)
    subscriber = await subscriber_service.update_subscriber(
        db, subscriber_id, **update_data
    )
    if subscriber is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Subscriber not found"
        )
    return subscriber


@router.get("/{subscriber_id}/transactions", response_model=CoinTransactionListResponse)
async def get_subscriber_transactions(
    subscriber_id: uuid.UUID,
    _user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
):
    """Get paginated transaction history for a subscriber."""
    return await subscriber_service.get_subscriber_transactions(
        db, subscriber_id, page=page, per_page=per_page
    )


@router.post(
    "/{subscriber_id}/adjust-coins",
    response_model=SubscriberResponse,
    status_code=status.HTTP_200_OK,
)
async def adjust_coins(
    subscriber_id: uuid.UUID,
    request: CoinAdjustmentRequest,
    admin: Annotated[User, Depends(require_admin)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Adjust a subscriber's coin balance. Admin only."""
    try:
        await subscriber_service.adjust_coins(
            db,
            subscriber_id,
            amount=request.amount,
            description=request.description,
            admin_user_id=admin.id,
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    # Return updated subscriber
    subscriber = await subscriber_service.get_subscriber(db, subscriber_id)
    return subscriber
