"""add phone column to subscribers

Revision ID: 77131ff12d7e
Revises: a2b3c4d5e6f7
Create Date: 2026-03-06

"""
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "77131ff12d7e"
down_revision: str | Sequence[str] | None = "a2b3c4d5e6f7"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("subscribers", sa.Column("phone", sa.String(20), nullable=True))
    op.create_index(op.f("ix_subscribers_phone"), "subscribers", ["phone"], unique=True)


def downgrade() -> None:
    op.drop_index(op.f("ix_subscribers_phone"), table_name="subscribers")
    op.drop_column("subscribers", "phone")
