import enum
from typing import TYPE_CHECKING

from sqlalchemy import Enum, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from app.models.series import Series


class TagCategory(enum.StrEnum):
    genre = "genre"
    mood = "mood"
    language = "language"


class Tag(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "tags"

    name: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    category: Mapped[TagCategory | None] = mapped_column(Enum(TagCategory), nullable=True)

    series: Mapped[list["Series"]] = relationship(
        "Series",
        secondary="series_tags",
        back_populates="tags",
        viewonly=True,
    )
