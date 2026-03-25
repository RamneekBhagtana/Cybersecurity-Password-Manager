from app.middleware.auth import require_auth
from flask import Blueprint, request, jsonify
from app.utils.password_generator import generate_password

generator_bp = Blueprint("generator", __name__)


@generator_bp.route("/generate/password", methods=["POST"])
@require_auth
def generate_password_endpoint():
    data = request.get_json() or {}

    try:
        result = generate_password(
    length=data.get("length", 16),
    include_uppercase=data.get("include_uppercase", True),
    include_lowercase=data.get("include_lowercase", True),
    include_numbers=data.get("include_numbers", True),
    include_special=data.get("include_special", True),
    min_numbers=data.get("min_numbers", 1),
    min_special=data.get("min_special", 1)
)

        return jsonify(result)

    except ValueError as e:
        return jsonify({
            "error": str(e)
        }), 400