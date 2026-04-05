"""
Tag model + vault_entry_tags many-to-many join table (Task 11 stub).

Included here so VaultEntry.tags relationship resolves without Task 11
being merged first.  Task 11 (Andre) owns this file — this is a minimal
scaffold so migrations compile cleanly.
"""

import uuid

from sqlalchemy import Column, ForeignKey, String, Table
from sqlalchemy.dialects.postgresql import UUID

from app.extensions import db


# Many-to-many association table — no model class needed
vault_entry_tags = Table(
    "vault_entry_tags",
    db.metadata,
    Column(
        "id",
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    ),
    Column(
        "entry_id",
        UUID(as_uuid=True),
        ForeignKey("vault_entries.entry_id", ondelete="CASCADE"),
        nullable=False,
    ),
    Column(
        "tag_id",
        UUID(as_uuid=True),
        ForeignKey("tags.tag_id", ondelete="CASCADE"),
        nullable=False,
    ),
)


class Tag(db.Model):
    __tablename__ = "tags"

    tag_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.user_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    tag_name = Column(String(100), nullable=False)

    user = db.relationship("User", back_populates="tags")
    vault_entries = db.relationship(
        "VaultEntry",
        secondary="vault_entry_tags",
        back_populates="tags",
        lazy="select",
    )

    def __repr__(self) -> str:
        return f"<Tag tag_id={self.tag_id} name={self.tag_name!r}>"