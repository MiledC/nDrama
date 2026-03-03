from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.session_auth import get_current_subscriber, require_active_subscriber
from app.models.subscriber import Subscriber
from app.schemas.auth import SubscriberProfile
from app.schemas.profile import UpdateProfileRequest
from app.services import profile_service

router = APIRouter(prefix="/api/me", tags=["profile"])


@router.get("", response_model=SubscriberProfile)
async def get_profile(
    subscriber: Subscriber = Depends(get_current_subscriber),
):
    """Get current subscriber profile."""
    return SubscriberProfile.model_validate(subscriber)


@router.patch("", response_model=SubscriberProfile)
async def update_profile(
    request: UpdateProfileRequest,
    subscriber: Subscriber = Depends(require_active_subscriber),
    db: AsyncSession = Depends(get_db),
):
    """Update profile fields. Active subscribers only."""
    update_data = request.model_dump(exclude_unset=True)
    subscriber = await profile_service.update_profile(db, subscriber, **update_data)
    return SubscriberProfile.model_validate(subscriber)


@router.delete("", status_code=status.HTTP_204_NO_CONTENT)
async def delete_account(
    subscriber: Subscriber = Depends(require_active_subscriber),
    db: AsyncSession = Depends(get_db),
):
    """Soft-delete account. Active subscribers only."""
    await profile_service.delete_account(db, subscriber)
