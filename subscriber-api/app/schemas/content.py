import uuid
from datetime import datetime
from typing import Generic, TypeVar

from pydantic import BaseModel

T = TypeVar("T")


class PaginatedResponse(BaseModel, Generic[T]):
    items: list[T]
    total: int
    offset: int
    limit: int


class TagItem(BaseModel):
    id: uuid.UUID
    name: str

    model_config = {"from_attributes": True}


class SeriesListItem(BaseModel):
    id: uuid.UUID
    title: str
    description: str | None = None
    thumbnail_url: str | None = None
    tags: list[TagItem] = []
    free_episode_count: int
    coin_cost_per_episode: int
    created_at: datetime

    model_config = {"from_attributes": True}


class EpisodeListItem(BaseModel):
    id: uuid.UUID
    title: str
    episode_number: int
    thumbnail_url: str | None = None
    is_free: bool
    is_unlocked: bool
    duration_seconds: int | None = None

    model_config = {"from_attributes": True}


class AudioTrackItem(BaseModel):
    id: uuid.UUID
    language_code: str
    label: str
    file_url: str
    is_default: bool

    model_config = {"from_attributes": True}


class SubtitleItem(BaseModel):
    id: uuid.UUID
    language_code: str
    label: str
    file_url: str
    format: str
    is_default: bool

    model_config = {"from_attributes": True}


class SeriesDetail(BaseModel):
    id: uuid.UUID
    title: str
    description: str | None = None
    thumbnail_url: str | None = None
    tags: list[TagItem] = []
    free_episode_count: int
    coin_cost_per_episode: int
    created_at: datetime
    episodes: list[EpisodeListItem] = []

    model_config = {"from_attributes": True}


class EpisodeDetail(BaseModel):
    id: uuid.UUID
    title: str
    description: str | None = None
    episode_number: int
    thumbnail_url: str | None = None
    duration_seconds: int | None = None
    is_free: bool
    is_unlocked: bool
    locked: bool
    playback_url: str | None = None
    audio_tracks: list[AudioTrackItem] = []
    subtitles: list[SubtitleItem] = []
    series_id: uuid.UUID
    coin_cost: int

    model_config = {"from_attributes": True}


class CategoryItem(BaseModel):
    id: uuid.UUID
    name: str
    icon: str | None = None
    description: str | None = None
    sort_order: int
    children: list["CategoryItem"] = []

    model_config = {"from_attributes": True}
