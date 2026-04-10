from functools import wraps
from flask import Blueprint, request, jsonify, g
from app.services.strength_service import check_strength
import logging

strength_bp = Blueprint('strength', __name__)
logger = logging.getLogger(__name__)

#Auth Middleware
def require_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization', "")
        if not auth_header.startswith("Bearer "):
            return jsonify({"error": "Missing or invalid authorization header"}), 401
        g.user_id = "stub_user_id"  # In a real app, decode the token to get the user ID - this is just a placeholder until we implement authentication (T13) 
        return f(*args, **kwargs)
    return decorated

@strength_bp.route('/password/strength', methods=['POST'])
@require_auth
def strength_checker():
    data = request.get_json(silent=True)

    if data is None or "password" not in data:
        return jsonify({"error": "Must include a password"}), 400
    password = data["password"]

    if not isinstance(password, str):
        return jsonify({"error": "Password must be a string"}), 400
    
    try:
        result = check_strength(password)
    except ValueError as exc:
        logger.exception("Error while checking password strength")
        return jsonify({"error": "Invalid password"}), 400
    
    return jsonify(result), 200