"""Category CRUD endpoints."""

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.user import User
from app.schemas.category import (
    CategoryCreate,
    CategoryReorderRequest,
    CategoryResponse,
    CategoryTreeNode,
    CategoryUpdate,
    SetTagsRequest,
)
from app.schemas.series import SeriesListResponse
from app.services import category_service

router = APIRouter(prefix="/api/categories", tags=["categories"])


@router.get("/tree", response_model=list[CategoryTreeNode])
async def get_category_tree(
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Get the full category tree. Public endpoint for browsing."""
    return await category_service.get_category_tree(db)


@router.get("", response_model=list[CategoryResponse])
async def list_categories(
    _user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """List all categories flat."""
    return await category_service.list_categories(db)


@router.post("", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
async def create_category(
    request: CategoryCreate,
    _user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Create a new category."""
    try:
        category = await category_service.create_category(
            db,
            name=request.name,
            icon=request.icon,
            description=request.description,
            parent_id=request.parent_id,
            tag_ids=request.tag_ids if request.tag_ids else None,
            match_mode=request.match_mode,
        )
        return category
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.patch("/reorder", status_code=status.HTTP_204_NO_CONTENT)
async def reorder_categories(
    request: CategoryReorderRequest,
    _user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Batch update sort_order for categories."""
    items = [{"id": item.id, "sort_order": item.sort_order} for item in request.items]
    await category_service.reorder_categories(db, items)


@router.get("/{category_id}", response_model=CategoryResponse)
async def get_category(
    category_id: uuid.UUID,
    _user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Get a single category with tags and subcategories."""
    category = await category_service.get_category(db, category_id)
    if category is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
    return category


@router.patch("/{category_id}", response_model=CategoryResponse)
async def update_category(
    category_id: uuid.UUID,
    request: CategoryUpdate,
    _user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Update a category."""
    update_data = request.model_dump(exclude_unset=True)
    try:
        category = await category_service.update_category(db, category_id, **update_data)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    if category is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
    return category


@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_category(
    category_id: uuid.UUID,
    _user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Delete a category. Fails if it has subcategories."""
    try:
        found = await category_service.delete_category(db, category_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))
    if not found:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")


@router.put("/{category_id}/tags", response_model=CategoryResponse)
async def set_category_tags(
    category_id: uuid.UUID,
    request: SetTagsRequest,
    _user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Replace all tags for a category."""
    try:
        category = await category_service.set_category_tags(db, category_id, request.tag_ids)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    if category is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
    return category


@router.get("/{category_id}/series", response_model=SeriesListResponse)
async def get_category_series(
    category_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
):
    """Get series under a category. Public endpoint."""
    result = await category_service.get_category_series(db, category_id, page, per_page)
    return result
