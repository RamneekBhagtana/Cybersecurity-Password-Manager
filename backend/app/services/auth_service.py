from functools import wraps
from flask import Blueprint, session, jsonify

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/login', methods=['POST'])
def mock_login():
    # Dummy user for testing
    session['user_id'] = 123
    session.permanent = True # REMOVE BEFORE LAUNCH 
    return jsonify({"message": "Successfully logged in (Mock)"}), 200

@auth_bp.route('/logout', methods=['POST'])
def mock_logout():
    session.clear()
    return jsonify({"message": "Successfully logged out"}), 200

def require_auth(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({"error": "Authentication required. Please log in."}), 401
        
        return f(*args, **kwargs)
    
    return decorated_function