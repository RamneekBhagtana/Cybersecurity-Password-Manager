import pytest
from app.utils.password_generator import generate_password


# Test 1: Default generation
def test_default_password():
    result = generate_password()
    assert len(result["password"]) == 16


# Test 2: Custom length
def test_custom_length():
    result = generate_password(length=12)
    assert len(result["password"]) == 12


# Test 3: Minimum length boundary
def test_min_length():
    result = generate_password(length=8)
    assert len(result["password"]) == 8


# Test 4: Maximum length boundary
def test_max_length():
    result = generate_password(length=24)
    assert len(result["password"]) == 24


# Test 5: Invalid length (too small)
def test_invalid_length():
    with pytest.raises(ValueError):
        generate_password(length=5)


# Test 6: Constraint satisfaction (numbers + special)
def test_min_constraints():
    result = generate_password(length=12, min_numbers=3, min_special=2)

    password = result["password"]

    numbers = sum(c.isdigit() for c in password)
    specials = sum(c in "!@#$%^&*_" for c in password)

    assert numbers >= 3
    assert specials >= 2


# Test 7: Length above max
def test_length_above_max():
    with pytest.raises(ValueError):
        generate_password(length=25)


# Test 8: All character types disabled
def test_no_character_types():
    with pytest.raises(ValueError):
        generate_password(
            include_uppercase=False,
            include_lowercase=False,
            include_numbers=False,
            include_special=False
        )


# Test 9: Invalid min constraints
def test_invalid_min_constraints():
    with pytest.raises(ValueError):
        generate_password(length=10, min_numbers=6, min_special=5)