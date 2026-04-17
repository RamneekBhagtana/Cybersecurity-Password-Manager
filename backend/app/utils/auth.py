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

        jwt_secret = os.getenv("SUPABASE_JWT_SECRET")
        if not jwt_secret:
            return jsonify({
                "error": {
                    "code": "500",
                    "message": "Server misconfiguration: JWT secret not set.",
                    "details": {},
                }
            }), 500

        try:
            payload = jwt.decode(
                token,
                jwt_secret,
                algorithms=["HS256"],
                options={"verify_exp": True},
                audience="authenticated",   # ← Supabase JWTs use this audience
            )
            g.user_id = payload.get("sub")
            if not g.user_id:
                raise ValueError("No sub claim in token.")
        except jwt.ExpiredSignatureError:
            return jsonify({
                "error": {"code": "401", "message": "Token has expired.", "details": {}}
            }), 401
        except Exception:
            return jsonify({
                "error": {"code": "401", "message": "Invalid or expired token.", "details": {}}
            }), 401

        return fn(*args, **kwargs)
    return wrapper