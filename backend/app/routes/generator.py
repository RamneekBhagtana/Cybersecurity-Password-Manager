import secrets
import string
import math
from flask import Blueprint, request, jsonify
from app.utils.auth import require_auth

generator_bp = Blueprint("generator", __name__, url_prefix="/generator")


def calculate_strength(length, charset_size):
    entropy = length * math.log2(charset_size) if charset_size > 0 else 0

    if entropy < 40:
        level = "weak"
    elif entropy < 60:
        level = "medium"
    else:
        level = "strong"

    return {
        "entropy": round(entropy, 2),
        "level": level
    }


def load_eff_words():
    try:
        with open("eff_long.txt") as f:
            return [line.strip().split()[-1] for line in f.readlines()]
    except:
        return ["secure", "vault", "random", "token"]


@generator_bp.route("/password", methods=["POST"])
@require_auth
def generate_password():
    data = request.get_json() or {}

    length = max(8, min(128, int(data.get("length", 16))))

    include_upper = data.get("include_uppercase", True)
    include_lower = data.get("include_lowercase", True)
    include_numbers = data.get("include_numbers", True)
    include_special = data.get("include_special", True)

    min_numbers = int(data.get("min_numbers", 0))
    min_special = int(data.get("min_special", 0))

    charset = ""
    if include_upper:
        charset += string.ascii_uppercase
    if include_lower:
        charset += string.ascii_lowercase
    if include_numbers:
        charset += string.digits
    if include_special:
        charset += "!@#$%^&*"

    if not charset:
        return jsonify({"error": "At least one character type required"}), 400

    password_chars = []

    for _ in range(min_numbers):
        password_chars.append(secrets.choice(string.digits))

    for _ in range(min_special):
        password_chars.append(secrets.choice("!@#$%^&*"))

    while len(password_chars) < length:
        password_chars.append(secrets.choice(charset))

    secrets.SystemRandom().shuffle(password_chars)
    password = "".join(password_chars)

    return jsonify({
        "password": password,
        "strength": calculate_strength(length, len(charset))
    })


@generator_bp.route("/passphrase", methods=["POST"])
@require_auth
def generate_passphrase():
    words_list = load_eff_words()

    data = request.get_json() or {}

    count = max(3, min(10, int(data.get("words", 4))))
    separator = data.get("separator", "-")

    if len(separator) < 1 or len(separator) > 2:
        return jsonify({"error": "Separator must be 1-2 characters"}), 400

    capitalize = bool(data.get("capitalize", False))
    include_number = bool(data.get("include_number", False))

    chosen = [secrets.choice(words_list) for _ in range(count)]
    if capitalize:
        chosen = [w.capitalize() for w in chosen]
    if include_number:
        digit = str(secrets.randbelow(10))
        chosen[-1] = chosen[-1] + digit

    return jsonify({
        "passphrase": separator.join(chosen),
        "strength": calculate_strength(count, len(words_list))
    })