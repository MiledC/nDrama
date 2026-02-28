"""create episodes table

Revision ID: a1b2c3d4e5f6
Revises: 9c5a06152636
Create Date: 2026-02-28 20:00:00.000000

"""
from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: str | Sequence[str] | None = '9c5a06152636'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table('episodes',
    sa.Column('series_id', sa.Uuid(), nullable=False),
    sa.Column('title', sa.String(length=255), nullable=False),
    sa.Column('description', sa.String(length=2000), nullable=True),
    sa.Column('episode_number', sa.Integer(), nullable=False),
    sa.Column('thumbnail_url', sa.String(length=500), nullable=True),
    sa.Column('status', sa.Enum('draft', 'processing', 'ready', 'published',
              name='episodestatus'), nullable=False),
    sa.Column('video_provider', sa.Enum('mux', name='videoproviderenum'), nullable=True),
    sa.Column('video_provider_asset_id', sa.String(length=255), nullable=True),
    sa.Column('video_playback_id', sa.String(length=255), nullable=True),
    sa.Column('duration_seconds', sa.Integer(), nullable=True),
    sa.Column('created_by', sa.Uuid(), nullable=False),
    sa.Column('id', sa.Uuid(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True),
              server_default=sa.text('now()'), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True),
              server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['series_id'], ['series.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['created_by'], ['users.id']),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('series_id', 'episode_number', name='uq_series_episode_number')
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table('episodes')
    op.execute("DROP TYPE IF EXISTS episodestatus")
    op.execute("DROP TYPE IF EXISTS videoproviderenum")
