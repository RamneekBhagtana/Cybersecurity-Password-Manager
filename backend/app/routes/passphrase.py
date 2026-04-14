from flask import Blueprint, request, jsonify # type: ignore
from app.services.passphrase_service import generate_secure_passphrase # type: ignore
from app.services.auth_service import require_auth # type: ignore

generator_bp = Blueprint('generator', __name__)

@generator_bp.route('/generate/passphrase', methods=['POST'])
@require_auth
def handle_passphrase_generation():
    data = request.get_json(silent=True) or {}
    
    # Set it up
    word_count = data.get('word_count', 3)
    separator = data.get('separator', '_')
    capitalize = data.get('capitalize', True)
    include_number = data.get('include_number', True)

    # Great wall of validation... type, length, separator, etc. >:)
    if not isinstance(word_count, int):
        return jsonify({"error": "word_count must be an integer"}), 400
    
    if not isinstance(separator, str):
        return jsonify({"error": "separator must be a string"}), 400
    
    if not isinstance(capitalize, bool) or not isinstance(include_number, bool):
        return jsonify({"error": "capitalize and include_number must be booleans"}), 400

    if not (3 <= word_count <= 10):
        return jsonify({"error": "Word count must be between 3 and 10"}), 400
    
    if len(separator) < 1 or len(separator) > 2:
        return jsonify({"error": "Separator must be 1-2 characters"}), 400
    
    allowed_separators = ['_', '-', '.', '!', "*", "~", "@", "#", "$", "&", "=", "+"]
    if not isinstance(separator, str) or separator not in allowed_separators:
        return jsonify({"error": f"separator must be one of: {allowed_separators}"}), 400
    
    # Jarvis, GENERATE!
    result = generate_secure_passphrase(word_count, separator, capitalize, include_number)
    
    return jsonify(result), 200
