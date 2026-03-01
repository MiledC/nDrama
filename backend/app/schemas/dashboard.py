import uuid
from datetime import datetime

from pydantic import BaseModel

from app.models.series import SeriesStatus


class DashboardStats(BaseModel):
    series_count: int
    episode_count: int
    user_count: int
    published_series_count: int


class RecentSeriesItem(BaseModel):
    id: uuid.UUID
    title: str
    status: SeriesStatus
    thumbnail_url: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class DashboardRecent(BaseModel):
    series: list[RecentSeriesItem]
