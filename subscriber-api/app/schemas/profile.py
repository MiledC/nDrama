from pydantic import BaseModel, Field

from app.schemas.auth import SubscriberProfile  # noqa: F401 — re-export


class UpdateProfileRequest(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=255)
    avatar_url: str | None = Field(None, max_length=500)
    country: str | None = Field(None, min_length=2, max_length=2)
    language: str | None = Field(None, min_length=2, max_length=5)
