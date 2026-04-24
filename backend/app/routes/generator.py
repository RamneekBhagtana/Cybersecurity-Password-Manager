import pathlib
import secrets
import string
from flask import Blueprint, request, jsonify
from app.utils.auth import require_auth

generator_bp = Blueprint("generator", __name__, url_prefix="/generator")

# ── EFF Long Wordlist ─────────────────────────────────────────────
# Loaded once at import time from eff_long.txt (8,000+ words).
# Falls back to a small inline list only if the file is missing.
_WORDLIST_PATH = pathlib.Path(__file__).parent.parent.parent / "eff_long.txt"

def _load_eff_wordlist() -> list[str]:
    words: list[str] = []
    with _WORDLIST_PATH.open(encoding="utf-8") as fh:
        for line in fh:
            parts = line.strip().split("\t")
            if len(parts) == 2:
                words.append(parts[1])
    return words

try:
    _WORDS = _load_eff_wordlist()
except Exception:
    # Fallback — should not happen in a correctly deployed environment.
    _WORDS = [
        "apple", "bridge", "cactus", "dolphin", "eagle", "forest",
        "guitar", "hammer", "island", "jungle", "kitten", "lemon",
        "mountain", "noodle", "ocean", "pillow", "quartz", "river",
        "silver", "tiger", "umbrella", "valley", "window", "yellow",
    ]


@generator_bp.route("/password", methods=["POST"])
@require_auth
def generate_password():
    data = request.get_json() or {}
    length = int(data.get("length", 16))
    length = max(8, min(128, length))  # clamp

    charset = ""
    if data.get("include_uppercase", True):
        charset += string.ascii_uppercase
    if data.get("include_lowercase", True):
        charset += string.ascii_lowercase
    if data.get("include_numbers", True):
        charset += string.digits
    if data.get("include_symbols", True):
        charset += "!@#$%^&*"
    if not charset:
        charset = string.ascii_lowercase

    password = "".join(secrets.choice(charset) for _ in range(length))
    return jsonify({"password": password})


@generator_bp.route("/passphrase", methods=["POST"])
@require_auth
def generate_passphrase():
    data = request.get_json() or {}
    count = int(data.get("words", 4))
    count = max(2, min(5, count))
    separator = data.get("separator", "-")
    capitalize = bool(data.get("capitalize", False))

    chosen = [secrets.choice(_WORDS) for _ in range(count)]
    if capitalize:
        chosen = [w.capitalize() for w in chosen]

    return jsonify({"passphrase": separator.join(chosen)})
