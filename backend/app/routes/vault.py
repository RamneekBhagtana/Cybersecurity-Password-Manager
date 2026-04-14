#Task 15 — Password Vault CRUD API

from flask import Blueprint, request, jsonify, g
from app.extensions import db
from app.models.vault_entry import VaultEntry
from app.models.tag import Tag
from app.models.user import User
from app.services.encryption import encrypt, decrypt, derive_key, DecryptionError
from app.utils.auth import require_auth

vault_bp = Blueprint("vault", __name__, url_prefix="/vault")


# Internal helpers

def _derive_key_from_request(data: dict):
    master_password = data.get("master_password", "").strip()
    if not master_password:
        return None, (
            jsonify({"error": {"code": "400", "message": "master_password is required.", "details": {}}}),
            400,
        )

    user = User.query.filter_by(user_id=g.user_id).first()
    if not user or not user.encryption_salt:
        return None, (
            jsonify({"error": {"code": "400", "message": "User encryption salt not found. Complete registration first.", "details": {}}}),
            400,
        )

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
    """Returns all vault entries for the authenticated user. No passwords included."""
    entries = (
        VaultEntry.query
        .filter_by(user_id=g.user_id)
        .order_by(VaultEntry.title)
        .all()
    )
    return jsonify({"entries": [_serialize_summary(e) for e in entries]}), 200


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
    All fields optional except master_password.
    If password is provided it is re-encrypted with the derived key.
    """
    entry = VaultEntry.query.filter_by(entry_id=entry_id, user_id=g.user_id).first()
    if entry is None:
        return jsonify({"error": {"code": "404", "message": "Vault entry not found.", "details": {}}}), 404

    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": {"code": "400", "message": "Request body must be JSON.", "details": {}}}), 400

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

    if "tags" in data:
        entry.tags = _resolve_tags(data["tags"], g.user_id)

    db.session.commit()
    return jsonify({"updated": True}), 200


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