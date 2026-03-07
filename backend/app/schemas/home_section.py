import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class HomeSectionCreate(BaseModel):
    type: str = Field(..., pattern="^(featured|trending|new_releases|category)$")
    title: str = Field(..., min_length=1, max_length=255)
    config: dict[str, Any] = Field(default_factory=dict)
    sort_order: int = Field(0, ge=0)
    is_active: bool = True


class HomeSectionUpdate(BaseModel):
    type: str | None = Field(None, pattern="^(featured|trending|new_releases|category)$")
    title: str | None = Field(None, min_length=1, max_length=255)
    config: dict[str, Any] | None = None
    sort_order: int | None = Field(None, ge=0)
    is_active: bool | None = None


class HomeSectionResponse(BaseModel):
    id: uuid.UUID
    type: str
    title: str
    config: dict[str, Any]
    sort_order: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class HomeSectionListResponse(BaseModel):
    items: list[HomeSectionResponse]
    total: int
