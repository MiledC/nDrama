import uuid
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel


class BalanceResponse(BaseModel):
    balance: int


class CoinPackageResponse(BaseModel):
    id: uuid.UUID
    name: str
    description: str | None = None
    coin_amount: int
    price_sar: Decimal
    sort_order: int

    model_config = {"from_attributes": True}


class PurchaseRequest(BaseModel):
    package_id: uuid.UUID


class SpendRequest(BaseModel):
    episode_id: uuid.UUID


class TransactionResponse(BaseModel):
    id: uuid.UUID
    type: str
    amount: int
    balance_after: int
    description: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class UnlockResponse(BaseModel):
    episode_id: uuid.UUID
    new_balance: int
    transaction_id: uuid.UUID
