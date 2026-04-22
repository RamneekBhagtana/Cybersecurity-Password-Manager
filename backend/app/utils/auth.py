import os
from functools import wraps
import jwt
from jwt import PyJWKClient
from flask import g, jsonify, request

# ── JWKS client (cached) ──────────────────────────────────────────
_jwks_client: PyJWKClient | None = None


def _get_jwks_client() -> PyJWKClient:
    """Lazy-load and cache a PyJWKClient pointed at Supabase's JWKS endpoint."""
    global _jwks_client
    if _jwks_client is None:
        supabase_url = os.getenv("SUPABASE_URL")
        if not supabase_url:
            raise RuntimeError("SUPABASE_URL is not set in environment.")
        jwks_url = f"{supabase_url.rstrip('/')}/auth/v1/.well-known/jwks.json"
        _jwks_client = PyJWKClient(jwks_url, cache_keys=True)
    return _jwks_client


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
            # Inspect the token header to choose the right verification path
            unverified_header = jwt.get_unverified_header(token)
            alg = unverified_header.get("alg", "")

            if alg in ("ES256", "RS256"):
                # Modern Supabase projects: asymmetric signing, verify via JWKS
                jwks_client = _get_jwks_client()
                signing_key = jwks_client.get_signing_key_from_jwt(token).key

                payload = jwt.decode(
                    token,
                    signing_key,
                    algorithms=[alg],
                    audience="authenticated",
                    options={"verify_exp": True},
                )
            elif alg == "HS256":
                # Legacy Supabase projects: shared JWT secret
                jwt_secret = os.getenv("SUPABASE_JWT_SECRET")
                if not jwt_secret:
                    return jsonify({
                        "error": {
                            "code": "500",
                            "message": "Server misconfiguration: SUPABASE_JWT_SECRET not set.",
                            "details": {},
                        }
                    }), 500

                payload = jwt.decode(
                    token,
                    jwt_secret,
                    algorithms=["HS256"],
                    audience="authenticated",
                    options={"verify_exp": True},
                )
            else:
                return jsonify({
                    "error": {
                        "code": "401",
                        "message": f"Unsupported token algorithm: {alg}",
                        "details": {},
                    }
                }), 401

            # Extract the Supabase user_id (stored in the 'sub' claim)
            g.user_id = payload.get("sub")
            if not g.user_id:
                raise ValueError("No 'sub' claim in token.")

        except jwt.ExpiredSignatureError:
            return jsonify({
                "error": {
                    "code": "401",
                    "message": "Token has expired.",
                    "details": {},
                }
            }), 401
        except Exception as exc:
            # Log the exact reason for debugging (remove the print in production)
            print(f"[AUTH ERROR] {type(exc).__name__}: {exc}", flush=True)
            return jsonify({
                "error": {
                    "code": "401",
                    "message": "Invalid or expired token.",
                    "details": {},
                }
            }), 401

        return fn(*args, **kwargs)
    return wrapper