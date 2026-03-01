import uuid
from datetime import datetime

from pydantic import BaseModel, Field

from app.models.subtitle import SubtitleFormat


class SubtitleCreate(BaseModel):
    language_code: str = Field(..., min_length=2, max_length=10)
    label: str = Field(..., min_length=1, max_length=100)
    is_default: bool = False


class SubtitleUpdate(BaseModel):
    label: str | None = Field(None, min_length=1, max_length=100)
    is_default: bool | None = None


class SubtitleResponse(BaseModel):
    id: uuid.UUID
    episode_id: uuid.UUID
    language_code: str
    label: str
    file_url: str
    format: SubtitleFormat
    is_default: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class SubtitleListResponse(BaseModel):
    items: list[SubtitleResponse]
    total: int
