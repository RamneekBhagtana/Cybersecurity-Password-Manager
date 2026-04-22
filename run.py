from flask import Flask
from dotenv import load_dotenv
import os
from app.routes.generator import generator_bp

# Load environment variables
load_dotenv(dotenv_path=".env", encoding="utf-8")

app = Flask(__name__)
app.register_blueprint(generator_bp, url_prefix="/api")

if __name__ == "__main__":
    debug = os.getenv("FLASK_DEBUG", "0").lower() in ["1", "true", "yes"]
    app.run(debug=debug)