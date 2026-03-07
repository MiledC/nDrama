"""Home sections endpoint for mobile app."""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.session_auth import get_current_subscriber
from app.models.subscriber import Subscriber
from app.services import content_service

router = APIRouter(prefix="/api/home", tags=["home"])


@router.get("/sections")
async def get_home_sections(
    _subscriber: Subscriber = Depends(get_current_subscriber),
    db: AsyncSession = Depends(get_db),
):
    """Get active home sections with resolved series data."""
    return await content_service.get_home_sections(db)
