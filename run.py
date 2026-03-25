import os
from flask import Flask
from app.routes.generator import generator_bp

app = Flask(__name__)

app.register_blueprint(generator_bp)

if __name__ == "__main__":
    debug = os.getenv("FLASK_DEBUG", "0").lower() in ["1", "true", "yes"]
    app.run(debug=debug)