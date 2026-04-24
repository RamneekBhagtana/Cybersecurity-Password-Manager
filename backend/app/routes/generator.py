import secrets
import string
from flask import Blueprint, request, jsonify
from app.utils.auth import require_auth

generator_bp = Blueprint("generator", __name__, url_prefix="/generator")


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
    # Tiny wordlist; full EFF list is 7776 words — Task 17's real impl
    words = ["apple", "bridge", "cactus", "dolphin", "eagle", "forest",
             "guitar", "hammer", "island", "jungle", "kitten", "lemon",
             "mountain", "noodle", "ocean", "pillow", "quartz", "river",
             "silver", "tiger", "umbrella", "valley", "window", "yellow"]

    data = request.get_json() or {}
    count = int(data.get("words", 4))
    count = max(3, min(10, count))
    separator = data.get("separator", "-")
    capitalize = bool(data.get("capitalize", False))

    chosen = [secrets.choice(words) for _ in range(count)]
    if capitalize:
        chosen = [w.capitalize() for w in chosen]

    return jsonify({"passphrase": separator.join(chosen)})
