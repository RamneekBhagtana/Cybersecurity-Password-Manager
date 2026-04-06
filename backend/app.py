import os
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from dotenv import load_dotenv
from app.routes import register_routes
from app.routes.passphrase import generator_bp


load_dotenv()

app = Flask(__name__)

app.secret_key = os.getenv('SECRET_KEY', 'dev-key-for-testing-only-123')

app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)
migrate = Migrate(app, db)

register_routes(app)

# 4. Register Routes (The Blueprints)
# This imports the registration function from your routes/__init__.py

@app.route('/')
def index():
    return {"message": "Password Manager API is running!"}

if __name__ == '__main__':
    is_debug = os.getenv('FLASK_DEBUG', 'False').lower() == 'true'
    app.run(host='0.0.0.0', port=5000, debug=is_debug)

