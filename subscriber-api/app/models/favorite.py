import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, UniqueConstraint, Uuid, func
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, UUIDMixin


class Favorite(Base, UUIDMixin):
    __tablename__ = "favorites"
    __table_args__ = (
        UniqueConstraint("subscriber_id", "series_id", name="uq_subscriber_series_favorite"),
    )

    subscriber_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("subscribers.id", ondelete="CASCADE"), nullable=False, index=True
    )
    series_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("series.id", ondelete="CASCADE"), nullable=False, index=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
