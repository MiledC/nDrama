import uuid
from datetime import datetime

from pydantic import BaseModel, Field

from app.models.episode import EpisodeStatus, VideoProviderEnum


class EpisodeCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: str | None = Field(None, max_length=2000)
    episode_number: int | None = Field(None, ge=1)
    thumbnail_url: str | None = None
    status: EpisodeStatus = EpisodeStatus.draft


class EpisodeUpdate(BaseModel):
    title: str | None = Field(None, min_length=1, max_length=255)
    description: str | None = Field(None, max_length=2000)
    episode_number: int | None = Field(None, ge=1)
    thumbnail_url: str | None = None
    status: EpisodeStatus | None = None


class EpisodeResponse(BaseModel):
    id: uuid.UUID
    series_id: uuid.UUID
    title: str
    description: str | None
    episode_number: int
    thumbnail_url: str | None
    status: EpisodeStatus
    video_provider: VideoProviderEnum | None
    video_provider_asset_id: str | None
    video_playback_id: str | None
    duration_seconds: int | None
    created_by: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class EpisodeListResponse(BaseModel):
    items: list[EpisodeResponse]
    total: int
    page: int
    per_page: int


class VideoUploadResponse(BaseModel):
    upload_url: str
    asset_id: str
    playback_id: str | None = None
