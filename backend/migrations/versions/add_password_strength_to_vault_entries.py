"""add password_strength to vault_entries

Revision ID: a1b2c3d4e5f6
Revises: 93f749a4212d
Create Date: 2026-04-23

"""
from alembic import op
import sqlalchemy as sa

revision = 'a1b2c3d4e5f6'
down_revision = '93f749a4212d'
branch_labels = None
depends_on = None


def upgrade():
    # IF NOT EXISTS makes this safe whether the column was added manually or not.
    op.execute(
        "ALTER TABLE vault_entries ADD COLUMN IF NOT EXISTS "
        "password_strength INTEGER"
    )


def downgrade():
    op.drop_column('vault_entries', 'password_strength')
