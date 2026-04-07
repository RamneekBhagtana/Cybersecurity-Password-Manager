from flask import Blueprint
from .passphrase import generator_bp
from .auth import auth_bp

def register_routes(app):
    app.register_blueprint(generator_bp, url_prefix='/api/v1')
    app.register_blueprint(auth_bp, url_prefix='/api/v1/auth')
