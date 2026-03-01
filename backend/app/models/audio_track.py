import uuid
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, ForeignKey, String, UniqueConstraint, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from app.models.episode import Episode


class AudioTrack(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "audio_tracks"
    __table_args__ = (
        UniqueConstraint("episode_id", "language_code", name="uq_audio_track_episode_language"),
    )

    episode_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("episodes.id", ondelete="CASCADE"), nullable=False
    )
    language_code: Mapped[str] = mapped_column(String(10), nullable=False)
    label: Mapped[str] = mapped_column(String(100), nullable=False)
    file_url: Mapped[str] = mapped_column(String(500), nullable=False)
    is_default: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    episode: Mapped["Episode"] = relationship("Episode", lazy="selectin")
