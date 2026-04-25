import logging
import os
from dotenv import load_dotenv
from flask import Flask

from .extensions import db, migrate, cors

load_dotenv()

logger = logging.getLogger(__name__)


def create_app():
    flask_app = Flask(__name__)
    flask_app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv("DATABASE_URL")
    flask_app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    # Warn loudly at startup if critical env vars are missing so developers
    # don't spend time chasing confusing runtime errors.
    if not os.getenv("SUPABASE_URL"):
        logger.warning("SUPABASE_URL is not set — JWT verification will fail.")
    if not os.getenv("DATABASE_URL"):
        logger.warning("DATABASE_URL is not set — database connections will fail.")

    # Bind extensions to this Flask app instance
    db.init_app(flask_app)
    migrate.init_app(flask_app, db)

    # CORS: restrict to origins listed in CORS_ORIGINS (comma-separated).
    # Defaults to localhost only; set CORS_ORIGINS=* only if truly needed.
    raw_origins = os.getenv("CORS_ORIGINS", "http://localhost:5000,http://localhost:19006")
    allowed_origins = [o.strip() for o in raw_origins.split(",") if o.strip()]
    cors.init_app(
        flask_app,
        resources={r"/*": {"origins": allowed_origins, "allow_headers": ["Authorization", "Content-Type"]}},
    )

    # Register blueprints
    from .routes.vault import vault_bp
    flask_app.register_blueprint(vault_bp)

    from .routes.generator import generator_bp
    flask_app.register_blueprint(generator_bp)

    return flask_app
