import pytest
from app.services.passphrase_service import generate_secure_passphrase

# 1. Test Default Generation
def test_default_generation():
    # Calling with no arguments should use your defaults (e.g., count=3, sep='_')
    result = generate_secure_passphrase()
    words = result['passphrase'].split('_')
    assert len(words) == 3
    assert result['strength']['score'] >= 0

# 2. Test Custom Options (Separator & Capitalization)
def test_custom_options():
    result = generate_secure_passphrase(word_count=4, separator='-', capitalize=True)
    words = result['passphrase'].split('-')
    assert len(words) == 4
    # Check if the first letter of the first word is uppercase
    assert words[0][0].isupper()

# 3. Test Word Count Validation
def test_word_count_limits():
    # This assumes your service raises a ValueError for invalid counts
    with pytest.raises(ValueError):
        generate_secure_passphrase(word_count=2) # Too low
    with pytest.raises(ValueError):
        generate_secure_passphrase(word_count=11) # Too high

# 4. Test All Option Combinations (Including Number)
def test_include_number_logic():
    result = generate_secure_passphrase(word_count=3, include_number=True)
    # Ensure at least one character in the whole string is a digit
    assert any(char.isdigit() for char in result['passphrase'])

# 5. Test zxcvbn Integration (Strength Object)
def test_strength_object_format():
    result = generate_secure_passphrase()
    assert 'passphrase' in result
    assert 'strength' in result
    assert 'score' in result['strength']