"""Tag CRUD endpoints."""

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.series import series_tags
from app.models.tag import Tag, TagCategory
from app.models.user import User
from app.schemas.tag import TagCreate, TagResponse, TagUpdate

router = APIRouter(prefix="/api/tags", tags=["tags"])


@router.get("", response_model=list[TagResponse])
async def list_tags(
    _user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    category: TagCategory | None = Query(None, description="Filter by category"),
):
    """List all tags, optionally filtered by category."""
    query = select(Tag).order_by(Tag.name)
    if category is not None:
        query = query.where(Tag.category == category)

    result = await db.execute(query)
    return result.scalars().all()


@router.post("", response_model=TagResponse, status_code=status.HTTP_201_CREATED)
async def create_tag(
    request: TagCreate,
    _user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Create a new tag."""
    # Check if tag with same name already exists
    result = await db.execute(select(Tag).where(Tag.name == request.name))
    if result.scalar_one_or_none() is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Tag with name '{request.name}' already exists",
        )

    tag = Tag(
        name=request.name,
        category=request.category,
    )
    db.add(tag)

    try:
        await db.commit()
        await db.refresh(tag)
    except IntegrityError:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Tag with name '{request.name}' already exists",
        )

    return tag


@router.patch("/{tag_id}", response_model=TagResponse)
async def update_tag(
    tag_id: uuid.UUID,
    request: TagUpdate,
    _user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Update an existing tag."""
    result = await db.execute(select(Tag).where(Tag.id == tag_id))
    tag = result.scalar_one_or_none()

    if tag is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tag not found",
        )

    # Check if new name conflicts with existing tag (excluding self)
    if request.name is not None and request.name != tag.name:
        result = await db.execute(
            select(Tag).where(Tag.name == request.name, Tag.id != tag_id)
        )
        if result.scalar_one_or_none() is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Tag with name '{request.name}' already exists",
            )
        tag.name = request.name

    if request.category is not None:
        tag.category = request.category

    await db.commit()
    await db.refresh(tag)
    return tag


@router.delete("/{tag_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_tag(
    tag_id: uuid.UUID,
    _user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Delete a tag. Fails if the tag is in use by any series."""
    result = await db.execute(select(Tag).where(Tag.id == tag_id))
    tag = result.scalar_one_or_none()

    if tag is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tag not found",
        )

    # Check if tag is in use by any series
    count_result = await db.execute(
        select(func.count()).select_from(series_tags).where(series_tags.c.tag_id == tag_id)
    )
    count = count_result.scalar()

    if count > 0:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Tag '{tag.name}' is in use by {count} series and cannot be deleted",
        )

    await db.delete(tag)
    await db.commit()


@router.get("/categories", response_model=list[str])
async def list_categories(
    _user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """List distinct tag categories (excluding null)."""
    result = await db.execute(
        select(Tag.category).distinct().where(Tag.category.is_not(None))
    )
    categories = result.scalars().all()
    # Convert enum values to strings
    return [str(cat.value) if hasattr(cat, 'value') else str(cat) for cat in categories]
