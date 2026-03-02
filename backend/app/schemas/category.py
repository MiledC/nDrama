"""Category schemas for request validation and response serialization."""

import uuid
from datetime import datetime

from pydantic import BaseModel, Field

from app.schemas.tag import TagResponse


class CategoryCreate(BaseModel):
    """Request body for creating a category."""

    name: str = Field(..., min_length=1, max_length=100)
    icon: str | None = Field(None, max_length=50)
    description: str | None = None
    parent_id: uuid.UUID | None = None
    tag_ids: list[uuid.UUID] = Field(default_factory=list)
    match_mode: str = Field("any", pattern="^(any|all)$")


class CategoryUpdate(BaseModel):
    """Request body for updating a category."""

    name: str | None = Field(None, min_length=1, max_length=100)
    icon: str | None = None
    description: str | None = None
    sort_order: int | None = None
    match_mode: str | None = Field(None, pattern="^(any|all)$")


class CategoryResponse(BaseModel):
    """Response model for a single category."""

    id: uuid.UUID
    name: str
    icon: str | None
    description: str | None
    parent_id: uuid.UUID | None
    sort_order: int
    match_mode: str
    tags: list[TagResponse]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class CategoryTreeNode(BaseModel):
    """Response model for hierarchical category tree."""

    id: uuid.UUID
    name: str
    icon: str | None
    description: str | None
    sort_order: int
    match_mode: str
    tags: list[TagResponse]
    children: list["CategoryTreeNode"] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class CategoryReorderItem(BaseModel):
    """Single item in reorder request."""

    id: uuid.UUID
    sort_order: int


class CategoryReorderRequest(BaseModel):
    """Request body for batch reordering categories."""

    items: list[CategoryReorderItem]


class SetTagsRequest(BaseModel):
    """Request body for setting category tags."""

    tag_ids: list[uuid.UUID]
