from flask import Flask;
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
import os
from dotenv import load_dotenv
from flask import jsonify

load_dotenv()

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL')

db = SQLAlchemy(app)
migrate = Migrate(app, db)

@app.route('/')
def index():
    return "Backend is running!"

@app.route("/api/health")
def health_check():
    return jsonify({"status": "ok", "message": "Backend is healthy!"}), 200
