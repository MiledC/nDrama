import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr

from app.models.user import UserRole


class UserResponse(BaseModel):
    id: uuid.UUID
    email: str
    name: str
    role: UserRole
    is_active: bool
    oauth_provider: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class InviteUserRequest(BaseModel):
    email: EmailStr
    name: str
    password: str
    role: UserRole = UserRole.editor


class ChangeRoleRequest(BaseModel):
    role: UserRole


class ChangeActiveRequest(BaseModel):
    is_active: bool
