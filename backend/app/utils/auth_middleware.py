"""
Task 13: Supabase Token Verification Middleware
Decorator @require_auth that verifies Supabase JWT tokens on protected API routes.
"""

import os
from functools import wraps

import jwt
from flask import g, jsonify, request


def require_auth(f):
    """
    Returns:
        401 - Missing, malformed, or expired token
        403 - Valid token but insufficient permissions
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get("Authorization", None)

        # Check Authorization header exists and is Bearer format
        if not auth_header:
            return jsonify({"error": "Authorization header is missing", "code": 401}), 401

        parts = auth_header.split()

        if parts[0].lower() != "bearer":
            return jsonify({"error": "Authorization header must start with Bearer", "code": 401}), 401

        if len(parts) == 1:
            return jsonify({"error": "Token not found in Authorization header", "code": 401}), 401

        if len(parts) > 2:
            return jsonify({"error": "Authorization header must be: Bearer <token>", "code": 401}), 401

        token = parts[1]

        jwt_secret = os.environ.get("SUPABASE_JWT_SECRET")
        if not jwt_secret:
            return jsonify({"error": "Server misconfiguration: JWT secret not set", "code": 500}), 500

        try:
            payload = jwt.decode(
                token,
                jwt_secret,
                algorithms=["HS256"],
                options={"verify_exp": True},
                audience="authenticated",
            )
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Token has expired", "code": 401}), 401
        except jwt.InvalidTokenError as e:
            return jsonify({"error": f"Invalid token", "code": 401}), 401

        # Extract user ID from 'sub' claim and attach to Flask's g object
        user_id = payload.get("sub")
        if not user_id:
            return jsonify({"error": "Token missing subject (user ID)", "code": 401}), 401

        g.user_id = user_id
        g.token_payload = payload

        return f(*args, **kwargs)

    return decorated_function
