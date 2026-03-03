import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.session_auth import get_current_subscriber
from app.models.subscriber import Subscriber
from app.schemas.content import EpisodeDetail
from app.services import content_service

router = APIRouter(prefix="/api/episodes", tags=["episodes"])


@router.get("/{episode_id}", response_model=EpisodeDetail)
async def get_episode(
    episode_id: uuid.UUID,
    subscriber: Subscriber = Depends(get_current_subscriber),
    db: AsyncSession = Depends(get_db),
):
    """Get episode detail. Stream URL included only if free/unlocked."""
    episode = await content_service.get_episode(db, episode_id, subscriber.id)
    if episode is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Episode not found"
        )
    return EpisodeDetail(**episode)
