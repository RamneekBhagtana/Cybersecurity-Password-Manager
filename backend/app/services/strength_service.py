from zxcvbn import zxcvbn

SCORE_LABELS = {
    1: "Very Weak",
    2: "Weak",
    3: "Fair",
    4: "Strong",
    5: "Very Strong"
}

#password strength analysis
def check_strength(password: str) -> dict:
    if not password: 
        raise ValueError("Password cannot be empty.")   
    if len(password) < 8:
        raise ValueError("Password must be at least 8 characters long.")
    if len(password) > 24:
        raise ValueError("Password must be no more than 24 characters long.")
    
    result = zxcvbn(password)
    score = result['score'] + 1  

    character_types = {
        "has_upper": any(c.isupper() for c in password),
        "has_lower": any(c.islower() for c in password),
        "has_digit": any(c.isdigit() for c in password),
        "has_special": any(not c.isalnum() for c in password),
    }

    crack_time = result.get("crack_times_display", {}).get("offline_slow_hashing_1e4_per_second", "N/A")
    feedback = result.get("feedback", {})

    return {
        "score": score,
        "label": SCORE_LABELS.get(score, "Unknown"),
        "character_types": character_types,
        "crack_time": crack_time,
        "feedback": {
            "warning": feedback.get("warning", ""),
            "suggestions": feedback.get("suggestions", [])
        },
        "length": len(password)
    }