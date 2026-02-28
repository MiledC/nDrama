import enum
import uuid
from typing import TYPE_CHECKING

from sqlalchemy import Enum, ForeignKey, Integer, String, UniqueConstraint, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from app.models.series import Series
    from app.models.user import User


class EpisodeStatus(enum.StrEnum):
    draft = "draft"
    processing = "processing"
    ready = "ready"
    published = "published"


class VideoProviderEnum(enum.StrEnum):
    mux = "mux"


class Episode(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "episodes"
    __table_args__ = (
        UniqueConstraint("series_id", "episode_number", name="uq_series_episode_number"),
    )

    series_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("series.id", ondelete="CASCADE"), nullable=False
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(String(2000), nullable=True)
    episode_number: Mapped[int] = mapped_column(Integer, nullable=False)
    thumbnail_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    status: Mapped[EpisodeStatus] = mapped_column(
        Enum(EpisodeStatus), default=EpisodeStatus.draft, nullable=False
    )
    video_provider: Mapped[VideoProviderEnum | None] = mapped_column(
        Enum(VideoProviderEnum), nullable=True
    )
    video_provider_asset_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    video_playback_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    duration_seconds: Mapped[int | None] = mapped_column(Integer, nullable=True)
    created_by: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("users.id"), nullable=False
    )

    series: Mapped["Series"] = relationship("Series", lazy="selectin")
    creator: Mapped["User"] = relationship("User", lazy="selectin")
