import enum
from datetime import datetime

from sqlalchemy import DateTime, Enum, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin, UUIDMixin


class SubscriberStatus(enum.StrEnum):
    anonymous = "anonymous"
    active = "active"
    suspended = "suspended"
    banned = "banned"


class Subscriber(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "subscribers"

    email: Mapped[str | None] = mapped_column(
        String(255), unique=True, index=True, nullable=True
    )
    name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    country: Mapped[str | None] = mapped_column(String(2), nullable=True)
    avatar_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    device_id: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    status: Mapped[SubscriberStatus] = mapped_column(
        Enum(SubscriberStatus), default=SubscriberStatus.anonymous, nullable=False
    )
    coin_balance: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    registered_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    last_active_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    admin_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
