import uuid
from datetime import datetime

from pydantic import BaseModel, Field

from app.models.series import SeriesStatus
from app.schemas.tag import TagResponse


class SeriesCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: str | None = Field(None, max_length=2000)
    thumbnail_url: str | None = None
    status: SeriesStatus = SeriesStatus.draft
    free_episode_count: int = Field(3, ge=0)
    coin_cost_per_episode: int = Field(0, ge=0)
    tag_ids: list[uuid.UUID] = Field(default_factory=list)


class SeriesUpdate(BaseModel):
    title: str | None = Field(None, min_length=1, max_length=255)
    description: str | None = Field(None, max_length=2000)
    thumbnail_url: str | None = None
    status: SeriesStatus | None = None
    free_episode_count: int | None = Field(None, ge=0)
    coin_cost_per_episode: int | None = Field(None, ge=0)
    tag_ids: list[uuid.UUID] | None = None


class SeriesResponse(BaseModel):
    id: uuid.UUID
    title: str
    description: str | None
    thumbnail_url: str | None
    status: SeriesStatus
    free_episode_count: int
    coin_cost_per_episode: int
    created_by: uuid.UUID
    tags: list[TagResponse]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class SeriesListResponse(BaseModel):
    items: list[SeriesResponse]
    total: int
    page: int
    per_page: int
