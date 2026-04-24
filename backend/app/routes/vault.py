#Task 15 — Password Vault CRUD API

import hashlib
import os
import re
from flask import Blueprint, request, jsonify, g
from app.extensions import db
from app.models.vault_entry import VaultEntry
from app.models.tag import Tag
from app.models.user import User
from app.services.encryption import encrypt, decrypt, derive_key, DecryptionError
from app.utils.auth import require_auth

vault_bp = Blueprint("vault", __name__, url_prefix="/vault")


def _compute_strength(password: str) -> int:
    """
    Return 1 (Weak) – 4 (Strong).

    Passphrases (alphabetic words joined by a common separator) are scored
    by word count:  2=Weak  3=Fair  4=Good  5+=Strong

    Regular passwords are scored by character-complexity criteria:
      • ≥ 16 characters
      • at least one uppercase letter
      • at least one digit
      • at least one special character
    """
    # Passphrase detection — split on a single repeated separator character
    for sep in ('-', '_', '.', ' ', '|'):
        parts = password.split(sep)
        if len(parts) >= 2 and all(p.isalpha() and len(p) >= 2 for p in parts):
            word_count = len(parts)
            if word_count <= 2:
                return 1  # Weak
            if word_count == 3:
                return 2  # Fair
            if word_count == 4:
                return 3  # Good
            return 4      # Strong (5+ words)

    # Regular password scoring
    score = 0
    if len(password) >= 16:
        score += 1
    if re.search(r'[A-Z]', password):
        score += 1
    if re.search(r'[0-9]', password):
        score += 1
    if re.search(r'[^A-Za-z0-9]', password):
        score += 1
    return max(1, score)


# Internal helpers

def _derive_key_from_request(data: dict):
    master_password = data.get("master_password", "").strip()
    if not master_password:
        return None, (
            jsonify({"error": {"code": "400", "message": "master_password is required.", "details": {}}}),
            400,
        )

    user = User.query.filter_by(user_id=g.user_id).first()

    if user is None:
        # User authenticated via Supabase but has no local shadow row yet.
        # Auto-provision: generate a persistent salt and create the record.
        email = getattr(g, "token_payload", {}).get("email", f"{g.user_id}@unknown")
        salt = os.urandom(32)
        user = User(user_id=g.user_id, email=email, encryption_salt=salt)
        db.session.add(user)
        db.session.commit()

    if not user.encryption_salt:
        # Existing row but salt was never set — generate and persist it now.
        user.encryption_salt = os.urandom(32)
        db.session.commit()

    key = derive_key(master_password, user.encryption_salt)
    return key, None


def _resolve_tags(tag_names: list, user_id) -> list:
    tags = []
    seen = set()
    for name in tag_names:
        name = name.strip()
        if not name or name in seen:
            continue
        seen.add(name)
        tag = Tag.query.filter_by(user_id=user_id, tag_name=name).first()
        if tag is None:
            tag = Tag(user_id=user_id, tag_name=name)
            db.session.add(tag)
            db.session.flush()
        tags.append(tag)
    return tags


def _serialize_summary(entry: VaultEntry) -> dict:
    return {
        "entry_id": str(entry.entry_id),
        "title": entry.title,
        "username": entry.username,
        "url": entry.url,
        "tags": [t.tag_name for t in entry.tags],
        "password_strength": entry.password_strength,
        "created_at": entry.created_at.isoformat() if entry.created_at else None,
        "updated_at": entry.updated_at.isoformat() if entry.updated_at else None,
    }


def _serialize_detail(entry: VaultEntry, key: bytes) -> tuple:
    try:
        password_plaintext = decrypt(
            entry.encrypted_password,
            entry.iv,
            entry.auth_tag,
            key,
        )
    except DecryptionError:
        return None, (
            jsonify({"error": {"code": "400", "message": "Decryption failed. Check your master password.", "details": {}}}),
            400,
        )

    return {
        "entry_id": str(entry.entry_id),
        "title": entry.title,
        "username": entry.username,
        "url": entry.url,
        "notes": entry.notes,
        "password": password_plaintext,
        "tags": [t.tag_name for t in entry.tags],
        "created_at": entry.created_at.isoformat() if entry.created_at else None,
        "updated_at": entry.updated_at.isoformat() if entry.updated_at else None,
    }, None



# GET /vault — list all entries (no passwords)

@vault_bp.route("", methods=["GET"])
@require_auth
def get_vault():
    """Returns all vault entries for the authenticated user. No passwords included.
    Also returns reused_count — number of entries whose password hash appears
    more than once (requires password_hash to have been populated at save time).
    """
    entries = (
        VaultEntry.query
        .filter_by(user_id=g.user_id)
        .order_by(VaultEntry.title)
        .all()
    )

    # Count how many entries share a password_hash with at least one other entry.
    hash_counts: dict[str, int] = {}
    for e in entries:
        if e.password_hash:
            hash_counts[e.password_hash] = hash_counts.get(e.password_hash, 0) + 1
    reused_count = sum(1 for e in entries if e.password_hash and hash_counts[e.password_hash] > 1)

    return jsonify({
        "entries": [_serialize_summary(e) for e in entries],
        "reused_count": reused_count,
    }), 200


# POST /vault — create a new entry

@vault_bp.route("", methods=["POST"])
@require_auth
def create_vault_entry():
    """
    Creates a new vault entry.
    Required: title, password, master_password
    Optional: username, url, notes, tags (list of strings)
    """
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": {"code": "400", "message": "Request body must be JSON.", "details": {}}}), 400

    errors = {}
    title    = data.get("title", "").strip()
    password = data.get("password", "").strip()
    if not title:
        errors["title"] = "title is required."
    if not password:
        errors["password"] = "password is required."
    if errors:
        return jsonify({"error": {"code": "400", "message": "Validation failed.", "details": errors}}), 400

    key, err = _derive_key_from_request(data)
    if err:
        return err

    ciphertext, iv, auth_tag = encrypt(password, key)

    entry = VaultEntry(
        user_id=g.user_id,
        title=title,
        username=data.get("username", "").strip() or None,
        url=data.get("url", "").strip() or None,
        notes=data.get("notes", "").strip() or None,
        encrypted_password=ciphertext,
        iv=iv,
        auth_tag=auth_tag,
        password_strength=_compute_strength(password),
        password_hash=hashlib.sha256(password.encode()).hexdigest(),
    )
    db.session.add(entry)
    db.session.flush()

    tag_names = data.get("tags", [])
    if tag_names:
        entry.tags = _resolve_tags(tag_names, g.user_id)

    db.session.commit()

    return jsonify({
        "entry_id": str(entry.entry_id),
        "title": entry.title,
        "username": entry.username,
        "created_at": entry.created_at.isoformat(),
    }), 201



# GET /vault/<entry_id> — single entry with decrypted password

@vault_bp.route("/<uuid:entry_id>", methods=["GET"])
@require_auth
def get_vault_entry(entry_id):
    """
    Returns a single vault entry including the decrypted password.
    Requires master_password in the JSON body.
    """
    entry = VaultEntry.query.filter_by(entry_id=entry_id, user_id=g.user_id).first()
    if entry is None:
        return jsonify({"error": {"code": "404", "message": "Vault entry not found.", "details": {}}}), 404

    data = request.get_json(silent=True) or {}
    key, err = _derive_key_from_request(data)
    if err:
        return err

    detail, err = _serialize_detail(entry, key)
    if err:
        return err

    return jsonify(detail), 200



# PUT /vault/<entry_id> — update an existing entry


@vault_bp.route("/<uuid:entry_id>", methods=["PUT"])
@require_auth
def update_vault_entry(entry_id):
    """
    Updates an existing vault entry. Only the owning user may update.
    master_password is only required when a new password is provided.
    """
    entry = VaultEntry.query.filter_by(entry_id=entry_id, user_id=g.user_id).first()
    if entry is None:
        return jsonify({"error": {"code": "404", "message": "Vault entry not found.", "details": {}}}), 404

    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": {"code": "400", "message": "Request body must be JSON.", "details": {}}}), 400

    # Only derive the encryption key when the password is actually being changed.
    key = None
    if "password" in data:
        key, err = _derive_key_from_request(data)
        if err:
            return err

    if "title" in data:
        title = data["title"].strip()
        if not title:
            return jsonify({"error": {"code": "400", "message": "title cannot be empty.", "details": {}}}), 400
        entry.title = title

    if "username" in data:
        entry.username = data["username"].strip() or None

    if "url" in data:
        entry.url = data["url"].strip() or None

    if "notes" in data:
        entry.notes = data["notes"].strip() or None

    if "password" in data:
        new_password = data["password"].strip()
        if not new_password:
            return jsonify({"error": {"code": "400", "message": "password cannot be empty.", "details": {}}}), 400
        ciphertext, iv, auth_tag = encrypt(new_password, key)
        entry.encrypted_password = ciphertext
        entry.iv = iv
        entry.auth_tag = auth_tag
        entry.password_strength = _compute_strength(new_password)
        entry.password_hash = hashlib.sha256(new_password.encode()).hexdigest()

    if "tags" in data:
        entry.tags = _resolve_tags(data["tags"], g.user_id)

    db.session.commit()
    return jsonify({"updated": True}), 200


# POST /vault/recompute-strengths — decrypt all entries and score password strength

@vault_bp.route("/recompute-strengths", methods=["POST"])
@require_auth
def recompute_strengths():
    """
    Decrypts every vault entry for the authenticated user and (re)computes
    password_strength.  Requires master_password in the JSON body.
    Returns {updated, failed}.
    """
    data = request.get_json(silent=True) or {}
    key, err = _derive_key_from_request(data)
    if err:
        return err

    entries = VaultEntry.query.filter_by(user_id=g.user_id).all()
    updated = 0
    failed = 0
    for entry in entries:
        try:
            plaintext = decrypt(entry.encrypted_password, entry.iv, entry.auth_tag, key)
            entry.password_strength = _compute_strength(plaintext)
            entry.password_hash = hashlib.sha256(plaintext.encode()).hexdigest()
            updated += 1
        except DecryptionError:
            failed += 1

    db.session.commit()
    return jsonify({"updated": updated, "failed": failed}), 200


# DELETE /vault/<entry_id> — delete an entry

@vault_bp.route("/<uuid:entry_id>", methods=["DELETE"])
@require_auth
def delete_vault_entry(entry_id):
    entry = VaultEntry.query.filter_by(entry_id=entry_id, user_id=g.user_id).first()
    if entry is None:
        return jsonify({"error": {"code": "404", "message": "Vault entry not found.", "details": {}}}), 404

    db.session.delete(entry)
    db.session.commit()
    return jsonify({"deleted": True}), 200