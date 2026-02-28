"""Series CRUD endpoints."""

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.series import Series, SeriesStatus, series_tags
from app.models.tag import Tag
from app.models.user import User
from app.schemas.series import SeriesCreate, SeriesListResponse, SeriesResponse, SeriesUpdate

router = APIRouter(prefix="/api/series", tags=["series"])


@router.get("", response_model=SeriesListResponse)
async def list_series(
    _user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    status: SeriesStatus | None = Query(None, alias="status", description="Filter by status"),
    tag: uuid.UUID | None = Query(None, description="Filter by tag ID"),
    search: str | None = Query(None, description="Search in title and description"),
    sort: str = Query("created_at", description="Sort field"),
):
    """List series with pagination, filtering, and search."""
    # Build base query
    query = select(Series).options(selectinload(Series.tags))

    # Apply filters
    if status is not None:
        query = query.where(Series.status == status)

    if tag is not None:
        # Filter by tag using EXISTS subquery for efficiency
        query = query.where(
            select(1)
            .select_from(series_tags)
            .where(
                series_tags.c.series_id == Series.id,
                series_tags.c.tag_id == tag,
            )
            .exists()
        )

    if search:
        search_pattern = f"%{search}%"
        query = query.where(
            (Series.title.ilike(search_pattern)) | (Series.description.ilike(search_pattern))
        )

    # Apply sorting (default descending)
    if hasattr(Series, sort):
        sort_column = getattr(Series, sort)
        query = query.order_by(sort_column.desc())
    else:
        query = query.order_by(Series.created_at.desc())

    # Get total count
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    # Apply pagination
    offset = (page - 1) * per_page
    query = query.offset(offset).limit(per_page)

    # Execute query
    result = await db.execute(query)
    items = result.scalars().all()

    return SeriesListResponse(
        items=items,
        total=total,
        page=page,
        per_page=per_page,
    )


@router.get("/{series_id}", response_model=SeriesResponse)
async def get_series(
    series_id: uuid.UUID,
    _user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Get a single series with tags."""
    result = await db.execute(
        select(Series)
        .options(selectinload(Series.tags))
        .where(Series.id == series_id)
    )
    series = result.scalar_one_or_none()

    if series is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Series not found",
        )

    return series


@router.post("", response_model=SeriesResponse, status_code=status.HTTP_201_CREATED)
async def create_series(
    request: SeriesCreate,
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Create a new series."""
    # Create series instance
    series_data = request.model_dump(exclude={"tag_ids"})
    series = Series(**series_data, created_by=user.id)

    # Handle tags if provided
    if request.tag_ids:
        # Fetch tags
        result = await db.execute(
            select(Tag).where(Tag.id.in_(request.tag_ids))
        )
        tags = result.scalars().all()

        # Verify all tags were found
        if len(tags) != len(request.tag_ids):
            found_ids = {tag.id for tag in tags}
            missing_ids = set(request.tag_ids) - found_ids
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Tags not found: {missing_ids}",
            )

        series.tags = tags

    db.add(series)
    await db.commit()
    await db.refresh(series)

    return series


@router.patch("/{series_id}", response_model=SeriesResponse)
async def update_series(
    series_id: uuid.UUID,
    request: SeriesUpdate,
    _user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Update an existing series."""
    # Fetch the series
    result = await db.execute(
        select(Series)
        .options(selectinload(Series.tags))
        .where(Series.id == series_id)
    )
    series = result.scalar_one_or_none()

    if series is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Series not found",
        )

    # Update fields (only those that were provided)
    update_data = request.model_dump(exclude_unset=True, exclude={"tag_ids"})
    for field, value in update_data.items():
        setattr(series, field, value)

    # Handle tag updates separately if provided
    if request.tag_ids is not None:
        # Fetch new tags
        result = await db.execute(
            select(Tag).where(Tag.id.in_(request.tag_ids))
        )
        tags = result.scalars().all()

        # Verify all tags were found
        if len(tags) != len(request.tag_ids):
            found_ids = {tag.id for tag in tags}
            missing_ids = set(request.tag_ids) - found_ids
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Tags not found: {missing_ids}",
            )

        # Replace tags entirely
        series.tags = tags

    await db.commit()
    await db.refresh(series)

    return series


@router.delete("/{series_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_series(
    series_id: uuid.UUID,
    _user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Archive a series (soft delete)."""
    result = await db.execute(select(Series).where(Series.id == series_id))
    series = result.scalar_one_or_none()

    if series is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Series not found",
        )

    series.status = SeriesStatus.archived
    await db.commit()
