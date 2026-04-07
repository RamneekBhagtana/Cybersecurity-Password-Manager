import os
from functools import wraps
import jwt
from flask import g, jsonify, request


def require_auth(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return jsonify({
                "error": {
                    "code": "401",
                    "message": "Missing or malformed Authorization header.",
                    "details": {},
                }
            }), 401

        token = auth_header.split(" ", 1)[1]

        try:
            secret = os.getenv("SUPABASE_JWT_SECRET", "stub-secret")
            payload = jwt.decode(
                token,
                secret,
                algorithms=["HS256"],
                options={"verify_exp": True},
            )
            g.user_id = payload.get("sub")
            if not g.user_id:
                raise ValueError("No sub claim in token.")
        except Exception:
            return jsonify({
                "error": {
                    "code": "401",
                    "message": "Invalid or expired token.",
                    "details": {},
                }
            }), 401

        return fn(*args, **kwargs)
    return wrapper