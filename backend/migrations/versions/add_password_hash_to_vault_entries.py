"""add password_hash to vault_entries

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-04-24

"""
from alembic import op
import sqlalchemy as sa

revision = 'b2c3d4e5f6a7'
down_revision = 'a1b2c3d4e5f6'
branch_labels = None
depends_on = None


def upgrade():
    op.execute(
        "ALTER TABLE vault_entries ADD COLUMN IF NOT EXISTS "
        "password_hash VARCHAR(64)"
    )


def downgrade():
    op.drop_column('vault_entries', 'password_hash')
