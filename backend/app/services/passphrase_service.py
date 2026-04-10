import secrets
from zxcvbn import zxcvbn
import os

def load_words():
    base_path = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
    path = os.path.join(base_path, 'eff_long.txt')
    with open(path, 'r') as f:
        # Get words
        return [line.split()[1] for line in f if line.strip()]

# Word list from EFF
WORD_LIST = load_words()

def generate_secure_passphrase(word_count=3, separator="_", capitalize=True, include_number=True):
    """
    Business logic for generating the passphrase.
    """
    if word_count < 3 or word_count > 10:
        raise ValueError("Word count must be between 3 and 10")
    # 1. Cryptographically secure selection
    selected_words = [secrets.choice(WORD_LIST) for _ in range(word_count)]
    
    # 2. Capitalization
    if capitalize:
        selected_words = [word.capitalize() for word in selected_words]
    
    # 3. Append random digit
    if include_number:
        random_index = secrets.randbelow(len(selected_words))
        random_digit = str(secrets.randbelow(10))
        selected_words[random_index] += random_digit
        
    passphrase = separator.join(selected_words)
    
    # 4. Strength analysis
    strength_results = zxcvbn(passphrase)
    
    return {
        "passphrase": passphrase,
        "strength": {
            "score": strength_results['score'],
            "feedback": strength_results['feedback'],
            "crack_times": strength_results['crack_times_display']
        }
    }