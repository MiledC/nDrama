import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, UniqueConstraint, Uuid, func
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, UUIDMixin


class EpisodeUnlock(Base, UUIDMixin):
    __tablename__ = "episode_unlocks"
    __table_args__ = (
        UniqueConstraint("subscriber_id", "episode_id", name="uq_subscriber_episode_unlock"),
    )

    subscriber_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("subscribers.id", ondelete="CASCADE"), nullable=False, index=True
    )
    episode_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("episodes.id", ondelete="CASCADE"), nullable=False, index=True
    )
    coin_transaction_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("coin_transactions.id"), nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
