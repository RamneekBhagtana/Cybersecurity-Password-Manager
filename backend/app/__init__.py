import os
from dotenv import load_dotenv
from flask import Flask

from .extensions import db, migrate, cors

load_dotenv()


def create_app():
    flask_app = Flask(__name__)
    flask_app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv("DATABASE_URL")
    flask_app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    # Bind extensions to this Flask app instance
    db.init_app(flask_app)
    migrate.init_app(flask_app, db)
    cors.init_app(
        flask_app,
        resources={r"/*": {"origins": "*", "allow_headers": ["Authorization", "Content-Type"]}},
    )

    # Register blueprints
    from .routes.vault import vault_bp
    flask_app.register_blueprint(vault_bp)

    from .routes.generator import generator_bp
    flask_app.register_blueprint(generator_bp)
    # ...any other blueprints

    return flask_app
