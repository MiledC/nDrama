import uuid

from pydantic import BaseModel


class SearchResultItem(BaseModel):
    id: uuid.UUID
    type: str  # "series" or "episode"
    title: str
    description: str | None
    # series-specific
    status: str | None = None
    thumbnail_url: str | None = None
    # episode-specific
    series_id: uuid.UUID | None = None
    series_title: str | None = None
    episode_number: int | None = None


class SearchResponse(BaseModel):
    results: list[SearchResultItem]
    total: int
