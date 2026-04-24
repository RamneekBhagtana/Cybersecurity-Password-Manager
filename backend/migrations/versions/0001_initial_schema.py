"""base schema anchor — represents 93f749a4212d (added cascade delete to tags)

Revision ID: 93f749a4212d
Revises:
Create Date: 2026-03-22

This stub represents the latest migration that was applied to the database
before Alembic was set up under backend/migrations/. The schema it covers
(including the cascade-delete-on-tags change) already exists in the database;
this entry exists only so Alembic can locate the revision stored in the
alembic_version table and continue the chain forward.
"""

revision = '93f749a4212d'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    pass  # Schema already exists — nothing to do


def downgrade():
    pass
