import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class ReportProgressRequest(BaseModel):
    progress_seconds: int = Field(..., ge=0)


class WatchHistoryItem(BaseModel):
    episode_id: uuid.UUID
    episode_title: str
    series_id: uuid.UUID
    series_title: str
    thumbnail_url: str | None = None
    progress_seconds: int
    duration_seconds: int | None = None
    completed: bool
    last_watched_at: datetime
