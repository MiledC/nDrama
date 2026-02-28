import uuid
from datetime import datetime

from pydantic import BaseModel, Field

from app.models.tag import TagCategory


class TagCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    category: TagCategory | None = None


class TagUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=100)
    category: TagCategory | None = None


class TagResponse(BaseModel):
    id: uuid.UUID
    name: str
    category: TagCategory | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
