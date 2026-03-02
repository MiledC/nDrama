import uuid
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field


class CoinPackageCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: str | None = Field(None, max_length=500)
    coin_amount: int = Field(..., gt=0)
    price_sar: Decimal = Field(..., gt=0, decimal_places=2)
    sort_order: int = Field(0, ge=0)


class CoinPackageUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=100)
    description: str | None = Field(None, max_length=500)
    coin_amount: int | None = Field(None, gt=0)
    price_sar: Decimal | None = Field(None, gt=0, decimal_places=2)
    is_active: bool | None = None
    sort_order: int | None = Field(None, ge=0)


class CoinPackageResponse(BaseModel):
    id: uuid.UUID
    name: str
    description: str | None
    coin_amount: int
    price_sar: Decimal
    is_active: bool
    sort_order: int
    created_by: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class CoinPackageListResponse(BaseModel):
    items: list[CoinPackageResponse]
    total: int
