"""add subscribers coin_transactions coin_packages tables

Revision ID: 1fececdb868f
Revises: 1d0d625fbba3
Create Date: 2026-03-02 17:03:35.974809

"""
from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = '1fececdb868f'
down_revision: str | Sequence[str] | None = '1d0d625fbba3'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        'subscribers',
        sa.Column('email', sa.String(length=255), nullable=True),
        sa.Column('name', sa.String(length=255), nullable=True),
        sa.Column('country', sa.String(length=2), nullable=True),
        sa.Column('avatar_url', sa.String(length=500), nullable=True),
        sa.Column('device_id', sa.String(length=255), nullable=False),
        sa.Column(
            'status',
            sa.Enum('anonymous', 'active', 'suspended', 'banned',
                    name='subscriberstatus'),
            nullable=False,
        ),
        sa.Column('coin_balance', sa.Integer(), nullable=False),
        sa.Column('registered_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('last_active_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('admin_notes', sa.Text(), nullable=True),
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column(
            'created_at', sa.DateTime(timezone=True),
            server_default=sa.text('now()'), nullable=False,
        ),
        sa.Column(
            'updated_at', sa.DateTime(timezone=True),
            server_default=sa.text('now()'), nullable=False,
        ),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(
        op.f('ix_subscribers_device_id'), 'subscribers',
        ['device_id'], unique=False,
    )
    op.create_index(
        op.f('ix_subscribers_email'), 'subscribers',
        ['email'], unique=True,
    )
    op.create_table(
        'coin_packages',
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('description', sa.String(length=500), nullable=True),
        sa.Column('coin_amount', sa.Integer(), nullable=False),
        sa.Column(
            'price_sar', sa.Numeric(precision=10, scale=2), nullable=False,
        ),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('sort_order', sa.Integer(), nullable=False),
        sa.Column('created_by', sa.Uuid(), nullable=False),
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column(
            'created_at', sa.DateTime(timezone=True),
            server_default=sa.text('now()'), nullable=False,
        ),
        sa.Column(
            'updated_at', sa.DateTime(timezone=True),
            server_default=sa.text('now()'), nullable=False,
        ),
        sa.ForeignKeyConstraint(['created_by'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_table(
        'coin_transactions',
        sa.Column('subscriber_id', sa.Uuid(), nullable=False),
        sa.Column(
            'type',
            sa.Enum('purchase', 'spend', 'refund', 'promo', 'adjustment',
                    name='transactiontype'),
            nullable=False,
        ),
        sa.Column('amount', sa.Integer(), nullable=False),
        sa.Column('balance_after', sa.Integer(), nullable=False),
        sa.Column('reference_type', sa.String(length=50), nullable=True),
        sa.Column('reference_id', sa.Uuid(), nullable=True),
        sa.Column('description', sa.String(length=500), nullable=True),
        sa.Column('created_by', sa.Uuid(), nullable=True),
        sa.Column(
            'created_at', sa.DateTime(timezone=True),
            server_default=sa.text('now()'), nullable=False,
        ),
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.ForeignKeyConstraint(['created_by'], ['users.id']),
        sa.ForeignKeyConstraint(
            ['subscriber_id'], ['subscribers.id'], ondelete='CASCADE',
        ),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(
        op.f('ix_coin_transactions_subscriber_id'),
        'coin_transactions', ['subscriber_id'], unique=False,
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(
        op.f('ix_coin_transactions_subscriber_id'),
        table_name='coin_transactions',
    )
    op.drop_table('coin_transactions')
    op.drop_table('coin_packages')
    op.drop_index(op.f('ix_subscribers_email'), table_name='subscribers')
    op.drop_index(op.f('ix_subscribers_device_id'), table_name='subscribers')
    op.drop_table('subscribers')
