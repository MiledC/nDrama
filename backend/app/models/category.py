import uuid
from typing import TYPE_CHECKING

from sqlalchemy import Column, ForeignKey, Integer, String, Table, Text, UniqueConstraint, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from app.models.tag import Tag

# Join table for category-tag many-to-many
category_tags = Table(
    "category_tags",
    Base.metadata,
    Column("category_id", Uuid, ForeignKey("categories.id", ondelete="CASCADE"), primary_key=True),
    Column("tag_id", Uuid, ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True),
)


class Category(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "categories"
    __table_args__ = (
        UniqueConstraint("parent_id", "name", name="uq_category_parent_name"),
    )

    name: Mapped[str] = mapped_column(String(100), nullable=False)
    icon: Mapped[str | None] = mapped_column(String(50), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    parent_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid, ForeignKey("categories.id", ondelete="CASCADE"), nullable=True
    )
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    match_mode: Mapped[str] = mapped_column(String(5), nullable=False, default="any")

    # Self-referential relationships
    parent: Mapped["Category | None"] = relationship(
        "Category",
        remote_side="Category.id",
        back_populates="children",
    )
    children: Mapped[list["Category"]] = relationship(
        "Category",
        back_populates="parent",
        cascade="all, delete-orphan",
        order_by="Category.sort_order",
    )

    # Many-to-many to Tags
    tags: Mapped[list["Tag"]] = relationship(
        "Tag",
        secondary=category_tags,
        lazy="selectin",
    )
