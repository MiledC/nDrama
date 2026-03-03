import uuid
from datetime import datetime

from pydantic import BaseModel

from app.schemas.content import TagItem


class FavoriteSeriesItem(BaseModel):
    id: uuid.UUID
    title: str
    description: str | None = None
    thumbnail_url: str | None = None
    tags: list[TagItem] = []
    favorited_at: datetime

    model_config = {"from_attributes": True}
