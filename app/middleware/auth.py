import os
from functools import wraps
from flask import request, jsonify

# Load API key from environment
API_KEY = (os.getenv("API_KEY") or "").strip()

def require_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        key = (request.headers.get("x-api-key") or "").strip()
        if not API_KEY or key != API_KEY:
            return jsonify({"error": "Unauthorized"}), 401
        return f(*args, **kwargs)
    return decorated