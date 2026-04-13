from flask import Blueprint, session, jsonify

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/login', methods=['POST'])
def login():
    # Temp manual login
    session['user_id'] = 1
    session.permanent = True
    return jsonify({"message": "Logged in successfully"}), 200

@auth_bp.route('/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({"message": "Logged out successfully"}), 200