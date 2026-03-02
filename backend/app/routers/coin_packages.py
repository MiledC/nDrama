"""Coin package CRUD endpoints (admin panel)."""

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth import get_current_user, require_admin
from app.models.user import User
from app.schemas.coin_package import (
    CoinPackageCreate,
    CoinPackageListResponse,
    CoinPackageResponse,
    CoinPackageUpdate,
)
from app.services import coin_service

router = APIRouter(prefix="/api/coin-packages", tags=["coin-packages"])


@router.get("", response_model=CoinPackageListResponse)
async def list_packages(
    _user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """List all coin packages."""
    packages = await coin_service.list_packages(db)
    return CoinPackageListResponse(items=packages, total=len(packages))


@router.post("", response_model=CoinPackageResponse, status_code=status.HTTP_201_CREATED)
async def create_package(
    request: CoinPackageCreate,
    admin: Annotated[User, Depends(require_admin)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Create a new coin package. Admin only."""
    return await coin_service.create_package(
        db,
        name=request.name,
        description=request.description,
        coin_amount=request.coin_amount,
        price_sar=request.price_sar,
        sort_order=request.sort_order,
        created_by=admin.id,
    )


@router.patch("/{package_id}", response_model=CoinPackageResponse)
async def update_package(
    package_id: uuid.UUID,
    request: CoinPackageUpdate,
    _admin: Annotated[User, Depends(require_admin)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Update a coin package. Admin only."""
    update_data = request.model_dump(exclude_unset=True)
    package = await coin_service.update_package(db, package_id, **update_data)
    if package is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Coin package not found"
        )
    return package


@router.delete("/{package_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_package(
    package_id: uuid.UUID,
    _admin: Annotated[User, Depends(require_admin)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Soft-delete a coin package (set is_active=false). Admin only."""
    found = await coin_service.deactivate_package(db, package_id)
    if not found:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Coin package not found"
        )
