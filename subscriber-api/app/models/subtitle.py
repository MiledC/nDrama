"""Read-only reference model for the subtitles table (owned by admin backend)."""

import enum
import uuid

from sqlalchemy import Boolean, Enum, ForeignKey, String, UniqueConstraint, Uuid
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin, UUIDMixin


class SubtitleFormat(enum.StrEnum):
    srt = "srt"
    vtt = "vtt"


class Subtitle(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "subtitles"
    __table_args__ = (
        UniqueConstraint("episode_id", "language_code", name="uq_subtitle_episode_language"),
    )

    episode_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("episodes.id", ondelete="CASCADE"), nullable=False
    )
    language_code: Mapped[str] = mapped_column(String(10), nullable=False)
    label: Mapped[str] = mapped_column(String(100), nullable=False)
    file_url: Mapped[str] = mapped_column(String(500), nullable=False)
    format: Mapped[SubtitleFormat] = mapped_column(Enum(SubtitleFormat), nullable=False)
    is_default: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
