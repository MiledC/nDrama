import enum
import uuid
from typing import TYPE_CHECKING

from sqlalchemy import Column, Enum, ForeignKey, Integer, String, Table, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from app.models.tag import Tag
    from app.models.user import User

# Many-to-many join table
series_tags = Table(
    "series_tags",
    Base.metadata,
    Column("series_id", Uuid, ForeignKey("series.id", ondelete="CASCADE"), primary_key=True),
    Column("tag_id", Uuid, ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True),
)


class SeriesStatus(enum.StrEnum):
    draft = "draft"
    published = "published"
    archived = "archived"


class Series(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "series"

    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(String(2000), nullable=True)
    thumbnail_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    status: Mapped[SeriesStatus] = mapped_column(
        Enum(SeriesStatus), default=SeriesStatus.draft, nullable=False
    )
    free_episode_count: Mapped[int] = mapped_column(Integer, default=3, nullable=False)
    coin_cost_per_episode: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_by: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("users.id"), nullable=False
    )

    tags: Mapped[list["Tag"]] = relationship(
        "Tag",
        secondary=series_tags,
        back_populates="series",
        lazy="selectin",
    )
    creator: Mapped["User"] = relationship("User", lazy="selectin")
