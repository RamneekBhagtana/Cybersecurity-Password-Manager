from functools import wraps
from flask import request, jsonify

API_KEY = "mysecretkey123"  # you can change this later


def require_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        key = request.headers.get("x-api-key")

        if key != API_KEY:
            return jsonify({"error": "Unauthorized"}), 401

        return f(*args, **kwargs)

    return decorated