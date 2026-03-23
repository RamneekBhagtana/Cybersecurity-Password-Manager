from extensions import db
import uuid
from datetime import datetime

class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.String, primary_key=True)  # UUID from Supabase Auth
    email = db.Column(db.String(255), unique=True, nullable=False)
    display_name = db.Column(db.String(100))
    salt = db.Column(db.String(255), nullable=False)
    failed_attempts = db.Column(db.Integer, default=0)
    locked_until = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow)

    vault_entries = db.relationship('VaultEntry', backref='user', lazy=True)
    tags = db.relationship('Tag', backref='user', lazy=True)
    generator_settings = db.relationship('GeneratorSetting', backref='user', lazy=True)
    security_reports = db.relationship('SecurityReport', backref='user', lazy=True)

class VaultEntry(db.Model):
    __tablename__ = 'vault_entries'

    id = db.Column(db.String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    title = db.Column(db.String(255), nullable=False)
    website_url = db.Column(db.String(500))
    username = db.Column(db.Text)
    password = db.Column(db.Text, nullable=False)
    iv = db.Column(db.String(255), nullable=False)
    auth_tag = db.Column(db.String(255), nullable=False)
    notes = db.Column(db.Text)
    is_favorite = db.Column(db.Boolean, default=False)
    last_used = db.Column(db.DateTime)
    password_changed_at = db.Column(db.DateTime, default=datetime.utcnow)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow)

    vault_entry_tags = db.relationship('VaultEntryTag', backref='vault_entry', cascade="all, delete-orphan", lazy=True)
    security_reports = db.relationship('SecurityReport', backref='vault_entry', lazy=True)

class Tag(db.Model):
    __tablename__ = 'tags'

    id = db.Column(db.String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    __table_args__ = (db.UniqueConstraint('user_id', 'name', name='uq_user_tag_name'),)

    vault_entry_tags = db.relationship('VaultEntryTag', backref='tag', cascade="all, delete-orphan", lazy=True)

class VaultEntryTag(db.Model):
    __tablename__ = 'vault_entry_tags'

    vault_entry_id = db.Column(db.String, db.ForeignKey('vault_entries.id', ondelete='CASCADE'), primary_key=True)
    tag_id = db.Column(db.String, db.ForeignKey('tags.id', ondelete='CASCADE'), primary_key=True)

class GeneratorSetting(db.Model):
    __tablename__ = 'generator_settings'

    id = db.Column(db.String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    setting_name = db.Column(db.String(100), nullable=False, default='default')
    type = db.Column(db.String(20), nullable=False, default='password')
    length = db.Column(db.Integer, default=16)
    use_uppercase = db.Column(db.Boolean, default=True)
    use_lowercase = db.Column(db.Boolean, default=True)
    use_numbers = db.Column(db.Boolean, default=True)
    use_symbols = db.Column(db.Boolean, default=True)
    min_numbers = db.Column(db.Integer, default=1)
    min_symbols = db.Column(db.Integer, default=1)
    word_count = db.Column(db.Integer, default=4)
    separator = db.Column(db.String(5), default='-')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class SecurityReport(db.Model):
    __tablename__ = 'security_reports'

    id = db.Column(db.String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    report_type = db.Column(db.String(50), nullable=False)
    vault_entry_id = db.Column(db.String, db.ForeignKey('vault_entries.id', ondelete='SET NULL'))
    severity = db.Column(db.String(20), nullable=False)
    details = db.Column(db.Text)
    is_resolved = db.Column(db.Boolean, default=False)
    generated_at = db.Column(db.DateTime, default=datetime.utcnow)