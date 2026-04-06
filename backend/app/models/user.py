"""
User model — mirrors Supabase auth.users in the local PostgreSQL schema.

In production, user_id comes from Supabase Auth (UUID).  This table is a
local shadow that lets SQLAlchemy enforce the FK from vault_entries.user_id,
and stores the per-user Argon2id key-derivation salt used by the Encryption
service (Task 14).
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, LargeBinary, String
from sqlalchemy.dialects.postgresql import UUID

from app.extensions import db


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class User(db.Model):
    __tablename__ = "users"

    user_id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        nullable=False,
        comment="Matches Supabase auth.users id (UUID)",
    )
    email = Column(
        String(255),
        unique=True,
        nullable=False,
    )
    # Per-user Argon2id salt for encryption key derivation (Task 14).
    # Never used for password hashing — Supabase handles that separately.
    encryption_salt = Column(
        LargeBinary,
        nullable=True,
        comment="Argon2id KDF salt — set once at registration, never changes",
    )
    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=_utcnow,
    )

    # Relationships
    vault_entries = db.relationship(
        "VaultEntry",
        back_populates="user",
        cascade="all, delete-orphan",
        lazy="select",
    )
    tags = db.relationship(
        "Tag",
        back_populates="user",
        cascade="all, delete-orphan",
        lazy="select",
    )

    def __repr__(self) -> str:
        return f"<User user_id={self.user_id} email={self.email!r}>"