"""Home section CRUD endpoints (admin panel)."""

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth import get_current_user, require_admin
from app.models.user import User
from app.schemas.home_section import (
    HomeSectionCreate,
    HomeSectionListResponse,
    HomeSectionResponse,
    HomeSectionUpdate,
)
from app.services import home_section_resolver, home_section_service

router = APIRouter(prefix="/api/home-sections", tags=["home-sections"])


@router.get("", response_model=HomeSectionListResponse)
async def list_sections(
    _user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """List all home sections."""
    sections = await home_section_service.list_sections(db)
    return HomeSectionListResponse(items=sections, total=len(sections))


@router.post("", response_model=HomeSectionResponse, status_code=status.HTTP_201_CREATED)
async def create_section(
    request: HomeSectionCreate,
    _admin: Annotated[User, Depends(require_admin)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Create a new home section. Admin only."""
    return await home_section_service.create_section(
        db,
        type=request.type,
        title=request.title,
        config=request.config,
        sort_order=request.sort_order,
        is_active=request.is_active,
    )


@router.patch("/{section_id}", response_model=HomeSectionResponse)
async def update_section(
    section_id: uuid.UUID,
    request: HomeSectionUpdate,
    _admin: Annotated[User, Depends(require_admin)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Update a home section. Admin only."""
    update_data = request.model_dump(exclude_unset=True)
    section = await home_section_service.update_section(db, section_id, **update_data)
    if section is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Home section not found"
        )
    return section


@router.delete("/{section_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_section(
    section_id: uuid.UUID,
    _admin: Annotated[User, Depends(require_admin)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Delete a home section. Admin only."""
    found = await home_section_service.delete_section(db, section_id)
    if not found:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Home section not found"
        )


@router.get("/{section_id}/preview")
async def preview_section(
    section_id: uuid.UUID,
    _user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Preview resolved series for a home section."""
    section = await home_section_service.get_section(db, section_id)
    if section is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Home section not found"
        )
    return await home_section_resolver.resolve_section_preview(db, section)
