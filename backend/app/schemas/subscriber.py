import uuid
from datetime import datetime

from pydantic import BaseModel, Field

from app.models.coin_transaction import TransactionType
from app.models.subscriber import SubscriberStatus


class SubscriberUpdate(BaseModel):
    status: SubscriberStatus | None = None
    admin_notes: str | None = None


class CoinAdjustmentRequest(BaseModel):
    amount: int = Field(..., description="Positive to credit, negative to debit")
    description: str = Field(..., min_length=1, max_length=500)


class SubscriberResponse(BaseModel):
    id: uuid.UUID
    email: str | None
    name: str | None
    country: str | None
    avatar_url: str | None
    device_id: str
    status: SubscriberStatus
    coin_balance: int
    registered_at: datetime | None
    last_active_at: datetime | None
    admin_notes: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class SubscriberListResponse(BaseModel):
    items: list[SubscriberResponse]
    total: int
    page: int
    per_page: int


class CoinTransactionResponse(BaseModel):
    id: uuid.UUID
    subscriber_id: uuid.UUID
    type: TransactionType
    amount: int
    balance_after: int
    reference_type: str | None
    reference_id: uuid.UUID | None
    description: str | None
    created_by: uuid.UUID | None
    created_at: datetime

    model_config = {"from_attributes": True}


class CoinTransactionListResponse(BaseModel):
    items: list[CoinTransactionResponse]
    total: int
    page: int
    per_page: int
