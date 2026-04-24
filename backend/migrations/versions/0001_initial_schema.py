"""initial schema

Revision ID: 0001_initial_schema
Revises:
Create Date: 2026-01-01

This is a stub migration that represents the schema that already exists in the
database (created via schema.sql / Supabase SQL Editor). It contains no
upgrade/downgrade logic — its only purpose is to give Alembic a revision entry
to anchor subsequent migrations against.
"""

revision = '0001_initial_schema'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    pass  # Schema already exists — nothing to do


def downgrade():
    pass
