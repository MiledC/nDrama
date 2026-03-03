import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, UniqueConstraint, Uuid, func
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, UUIDMixin


class WatchHistory(Base, UUIDMixin):
    __tablename__ = "watch_history"
    __table_args__ = (
        UniqueConstraint("subscriber_id", "episode_id", name="uq_subscriber_episode_history"),
    )

    subscriber_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("subscribers.id", ondelete="CASCADE"), nullable=False, index=True
    )
    episode_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("episodes.id", ondelete="CASCADE"), nullable=False, index=True
    )
    progress_seconds: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    duration_seconds: Mapped[int | None] = mapped_column(Integer, nullable=True)
    completed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    last_watched_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
