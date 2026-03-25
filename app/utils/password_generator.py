from zxcvbn import zxcvbn
import string
import secrets

SPECIAL_CHARS = "!@#$%^&*_"


def generate_password(
    length=16,
    include_uppercase=True,
    include_lowercase=True,
    include_numbers=True,
    include_special=True,
    min_numbers=1,
    min_special=1
):
    # -------------------------
    # VALIDATION
    # -------------------------
    if length < 8 or length > 24:
        raise ValueError("Password length must be between 8 and 24")

    if not (include_uppercase or include_lowercase or include_numbers or include_special):
        raise ValueError("At least one character type must be selected")

    if min_numbers + min_special > length:
        raise ValueError("Minimum counts exceed total length")

    # -------------------------
    # BUILD CHARACTER POOL
    # -------------------------
    char_pool = ""

    if include_uppercase:
        char_pool += string.ascii_uppercase
    if include_lowercase:
        char_pool += string.ascii_lowercase
    if include_numbers:
        char_pool += string.digits
    if include_special:
        char_pool += SPECIAL_CHARS

    password_chars = []

    # -------------------------
    # REQUIRED NUMBERS
    # -------------------------
    for _ in range(min_numbers):
        password_chars.append(secrets.choice(string.digits))

    # -------------------------
    # REQUIRED SPECIALS
    # -------------------------
    for _ in range(min_special):
        password_chars.append(secrets.choice(SPECIAL_CHARS))

    # -------------------------
    # FILL THE REST
    # -------------------------
    remaining = length - len(password_chars)

    for _ in range(remaining):
        password_chars.append(secrets.choice(char_pool))

    # -------------------------
    # SHUFFLE
    # -------------------------
    secrets.SystemRandom().shuffle(password_chars)

    password = "".join(password_chars)

    strength = zxcvbn(password)

    return {
        "password": password,
        "strength": {
            "score": strength["score"],
            "feedback": strength["feedback"]
        }
    }
