"""Read-only reference model for the tags table (owned by admin backend)."""

import enum

from sqlalchemy import Enum, String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin, UUIDMixin


class TagCategory(enum.StrEnum):
    genre = "genre"
    mood = "mood"
    language = "language"


class Tag(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "tags"

    name: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    category: Mapped[TagCategory | None] = mapped_column(Enum(TagCategory), nullable=True)
