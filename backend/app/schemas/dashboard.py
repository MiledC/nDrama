import uuid
from datetime import datetime

from pydantic import BaseModel

from app.models.series import SeriesStatus


class DashboardStats(BaseModel):
    series_count: int
    episode_count: int
    user_count: int
    published_series_count: int
    subscriber_total: int = 0
    subscriber_active: int = 0
    subscriber_anonymous: int = 0
    subscriber_suspended: int = 0
    coins_in_circulation: int = 0
    transactions_today: int = 0


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
