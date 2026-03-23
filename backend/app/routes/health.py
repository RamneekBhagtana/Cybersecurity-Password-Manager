from flask import Blueprint, jsonify

# This name MUST be exactly health_bp
health_bp = Blueprint('health', __name__)

@health_bp.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "ok", "message": "Backend is healthy!"}), 200
