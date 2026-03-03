import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


class DeviceRegisterRequest(BaseModel):
    device_id: str = Field(..., min_length=1, max_length=255)


class DeviceRegisterResponse(BaseModel):
    session_token: str
    subscriber_id: uuid.UUID


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)
    name: str = Field(..., min_length=1, max_length=255)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class SubscriberProfile(BaseModel):
    id: uuid.UUID
    email: str | None = None
    name: str | None = None
    country: str | None = None
    language: str | None = None
    avatar_url: str | None = None
    status: str
    coin_balance: int
    registered_at: datetime | None = None
    last_active_at: datetime | None = None

    model_config = {"from_attributes": True}


class AuthResponse(BaseModel):
    session_token: str
    subscriber: SubscriberProfile
