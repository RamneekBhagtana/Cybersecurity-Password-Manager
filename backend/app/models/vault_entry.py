"""
VaultEntry SQLAlchemy model — Task 10
--------------------------------------
Stores AES-256-GCM encrypted vault credentials.

Column layout mirrors the design spec ER diagram:
  entry_id           UUID primary key (server-generated)
  user_id            UUID foreign key → Supabase auth.users
  title              site/service label (plaintext, for display only)
  username           account username (plaintext)
  encrypted_password ciphertext produced by AES-256-GCM encrypt()
  iv                 12-byte nonce used during that encrypt() call
  auth_tag           16-byte GCM authentication tag
  encryption_salt    Argon2id key-derivation salt (per-user, stored once
                     on the user profile — kept here for migration ref)
  notes              optional plaintext notes
  url                optional site URL (plaintext)
  created_at         auto-set on INSERT
  updated_at         auto-updated on every UPDATE
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    Column,
    DateTime,
    ForeignKey,
    LargeBinary,
    String,
    Text,
    event,
)
from sqlalchemy.dialects.postgresql import UUID

from app.extensions import db


def _utcnow() -> datetime:
    """Return an offset-aware UTC datetime."""
    return datetime.now(timezone.utc)


class VaultEntry(db.Model):
    """
    Encrypted password vault entry.

    Encrypted fields
    ----------------
    encrypted_password  : AES-256-GCM ciphertext  (bytea / LargeBinary)
    iv                  : 12-byte random nonce     (bytea / LargeBinary)
    auth_tag            : 16-byte GCM tag          (bytea / LargeBinary)

    These three columns are always written and read together by the
    Encryption service — they are never interpreted individually here.
    """

    __tablename__ = "vault_entries"

    # ------------------------------------------------------------------ #
    #  Primary key                                                         #
    # ------------------------------------------------------------------ #
    entry_id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        nullable=False,
        comment="Surrogate PK — UUID generated server-side",
    )

    # ------------------------------------------------------------------ #
    #  Ownership                                                           #
    # ------------------------------------------------------------------ #
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.user_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="Supabase auth.users UUID — every query must filter by this",
    )

    # ------------------------------------------------------------------ #
    #  Plaintext metadata (never holds passwords)                          #
    # ------------------------------------------------------------------ #
    title = Column(
        String(255),
        nullable=False,
        comment="Human-readable label, e.g. 'GitHub'",
    )
    username = Column(
        String(255),
        nullable=True,
        comment="Account username or email for this entry",
    )
    url = Column(
        String(2048),
        nullable=True,
        comment="Optional site URL",
    )
    notes = Column(
        Text,
        nullable=True,
        comment="Optional freeform notes (stored plaintext)",
    )

    # ------------------------------------------------------------------ #
    #  Encrypted credential — three columns, always used together          #
    # ------------------------------------------------------------------ #
    encrypted_password = Column(
        LargeBinary,          # → PostgreSQL bytea
        nullable=False,
        comment="AES-256-GCM ciphertext of the plaintext password",
    )
    iv = Column(
        LargeBinary,          # → PostgreSQL bytea  (12 bytes for GCM)
        nullable=False,
        comment="Random 12-byte nonce (IV) used for this encryption call",
    )
    auth_tag = Column(
        LargeBinary,          # → PostgreSQL bytea  (16 bytes for GCM)
        nullable=False,
        comment="16-byte GCM authentication tag — verifies ciphertext integrity",
    )

    # ------------------------------------------------------------------ #
    #  Timestamps                                                          #
    # ------------------------------------------------------------------ #
    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=_utcnow,
        comment="Row creation timestamp (UTC)",
    )
    updated_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=_utcnow,
        onupdate=_utcnow,
        comment="Last modification timestamp — auto-updated on every UPDATE",
    )

    # ------------------------------------------------------------------ #
    #  Relationships                                                       #
    # ------------------------------------------------------------------ #
    user = db.relationship(
        "User",
        back_populates="vault_entries",
        lazy="select",
    )
    tags = db.relationship(
        "Tag",
        secondary="vault_entry_tags",
        back_populates="vault_entries",
        lazy="select",
    )

    # ------------------------------------------------------------------ #
    #  Helpers                                                             #
    # ------------------------------------------------------------------ #
    def __repr__(self) -> str:
        return (
            f"<VaultEntry entry_id={self.entry_id} "
            f"user_id={self.user_id} title={self.title!r}>"
        )

    def to_dict(self, include_encrypted: bool = False) -> dict:
        """
        Serialise to a dict suitable for JSON API responses.

        By default the raw encrypted bytes are excluded — the Encryption
        service is responsible for decrypting and returning plaintext to
        the API layer.  Pass include_encrypted=True only for internal use.
        """
        data = {
            "entry_id": str(self.entry_id),
            "user_id": str(self.user_id),
            "title": self.title,
            "username": self.username,
            "url": self.url,
            "notes": self.notes,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "tags": [t.tag_name for t in self.tags] if self.tags else [],
        }
        if include_encrypted:
            data.update(
                {
                    "encrypted_password": self.encrypted_password.hex()
                    if self.encrypted_password
                    else None,
                    "iv": self.iv.hex() if self.iv else None,
                    "auth_tag": self.auth_tag.hex() if self.auth_tag else None,
                }
            )
        return data


# ------------------------------------------------------------------ #
#  SQLAlchemy event: keep updated_at current even on bulk updates     #
# ------------------------------------------------------------------ #
@event.listens_for(VaultEntry, "before_update")
def _set_updated_at(mapper, connection, target):  # noqa: ANN001
    target.updated_at = _utcnow()