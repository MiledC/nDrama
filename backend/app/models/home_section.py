import enum

from sqlalchemy import Boolean, Integer, String
from sqlalchemy.dialects.postgresql import JSON
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin, UUIDMixin


class HomeSectionType(enum.StrEnum):
    featured = "featured"
    trending = "trending"
    new_releases = "new_releases"
    category = "category"


class HomeSection(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "home_sections"

    type: Mapped[str] = mapped_column(
        String(20), nullable=False
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    config: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
