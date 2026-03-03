"""add subscriber api tables (episode_unlocks, favorites, watch_history) and subscriber columns

Revision ID: a2b3c4d5e6f7
Revises: 1fececdb868f
Create Date: 2026-03-03 12:00:00.000000

"""
from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = 'a2b3c4d5e6f7'
down_revision: str | Sequence[str] | None = '1fececdb868f'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add new columns to subscribers table
    op.add_column(
        'subscribers',
        sa.Column('password_hash', sa.String(length=255), nullable=True),
    )
    op.add_column(
        'subscribers',
        sa.Column('language', sa.String(length=5), nullable=True, server_default='ar'),
    )

    # Create episode_unlocks table
    op.create_table(
        'episode_unlocks',
        sa.Column('subscriber_id', sa.Uuid(), nullable=False),
        sa.Column('episode_id', sa.Uuid(), nullable=False),
        sa.Column('coin_transaction_id', sa.Uuid(), nullable=False),
        sa.Column(
            'created_at', sa.DateTime(timezone=True),
            server_default=sa.text('now()'), nullable=False,
        ),
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.ForeignKeyConstraint(
            ['subscriber_id'], ['subscribers.id'], ondelete='CASCADE',
        ),
        sa.ForeignKeyConstraint(
            ['episode_id'], ['episodes.id'], ondelete='CASCADE',
        ),
        sa.ForeignKeyConstraint(
            ['coin_transaction_id'], ['coin_transactions.id'],
        ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint(
            'subscriber_id', 'episode_id', name='uq_subscriber_episode_unlock',
        ),
    )
    op.create_index(
        op.f('ix_episode_unlocks_subscriber_id'),
        'episode_unlocks', ['subscriber_id'], unique=False,
    )
    op.create_index(
        op.f('ix_episode_unlocks_episode_id'),
        'episode_unlocks', ['episode_id'], unique=False,
    )

    # Create favorites table
    op.create_table(
        'favorites',
        sa.Column('subscriber_id', sa.Uuid(), nullable=False),
        sa.Column('series_id', sa.Uuid(), nullable=False),
        sa.Column(
            'created_at', sa.DateTime(timezone=True),
            server_default=sa.text('now()'), nullable=False,
        ),
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.ForeignKeyConstraint(
            ['subscriber_id'], ['subscribers.id'], ondelete='CASCADE',
        ),
        sa.ForeignKeyConstraint(
            ['series_id'], ['series.id'], ondelete='CASCADE',
        ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint(
            'subscriber_id', 'series_id', name='uq_subscriber_series_favorite',
        ),
    )
    op.create_index(
        op.f('ix_favorites_subscriber_id'),
        'favorites', ['subscriber_id'], unique=False,
    )
    op.create_index(
        op.f('ix_favorites_series_id'),
        'favorites', ['series_id'], unique=False,
    )

    # Create watch_history table
    op.create_table(
        'watch_history',
        sa.Column('subscriber_id', sa.Uuid(), nullable=False),
        sa.Column('episode_id', sa.Uuid(), nullable=False),
        sa.Column('progress_seconds', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('duration_seconds', sa.Integer(), nullable=True),
        sa.Column('completed', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column(
            'last_watched_at', sa.DateTime(timezone=True),
            server_default=sa.text('now()'), nullable=False,
        ),
        sa.Column(
            'created_at', sa.DateTime(timezone=True),
            server_default=sa.text('now()'), nullable=False,
        ),
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.ForeignKeyConstraint(
            ['subscriber_id'], ['subscribers.id'], ondelete='CASCADE',
        ),
        sa.ForeignKeyConstraint(
            ['episode_id'], ['episodes.id'], ondelete='CASCADE',
        ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint(
            'subscriber_id', 'episode_id', name='uq_subscriber_episode_history',
        ),
    )
    op.create_index(
        op.f('ix_watch_history_subscriber_id'),
        'watch_history', ['subscriber_id'], unique=False,
    )
    op.create_index(
        op.f('ix_watch_history_episode_id'),
        'watch_history', ['episode_id'], unique=False,
    )


def downgrade() -> None:
    """Downgrade schema."""
    # Drop watch_history
    op.drop_index(op.f('ix_watch_history_episode_id'), table_name='watch_history')
    op.drop_index(op.f('ix_watch_history_subscriber_id'), table_name='watch_history')
    op.drop_table('watch_history')

    # Drop favorites
    op.drop_index(op.f('ix_favorites_series_id'), table_name='favorites')
    op.drop_index(op.f('ix_favorites_subscriber_id'), table_name='favorites')
    op.drop_table('favorites')

    # Drop episode_unlocks
    op.drop_index(op.f('ix_episode_unlocks_episode_id'), table_name='episode_unlocks')
    op.drop_index(op.f('ix_episode_unlocks_subscriber_id'), table_name='episode_unlocks')
    op.drop_table('episode_unlocks')

    # Remove subscriber columns
    op.drop_column('subscribers', 'language')
    op.drop_column('subscribers', 'password_hash')
