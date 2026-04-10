#Unit and Integration Tests for Task 18

import json
import pytest

from app.services.strength_service import check_strength, SCORE_LABELS
from app import create_app
from app.config import TestConfig


class TestCheckStrengthService:

    def test_known_weak_password(self):
        result = check_strength("password1")
        assert result["score"] in (1, 2)

    def test_known_weak_short(self):
        result = check_strength("abcdefgh")
        assert result["score"] <= 2

    def test_known_strong_password(self):
        result = check_strength("Tr0ub4dor&3")
        assert result["score"] >= 3

    def test_score_label_mapping(self):
        for score, label in SCORE_LABELS.items():
            assert isinstance(label, str)
        assert SCORE_LABELS[1] == "Very Weak"
        assert SCORE_LABELS[5] == "Very Strong"

    def test_empty_string(self):
        with pytest.raises(ValueError, match="empty"):
            check_strength("")

    def test_none_raises_value_error(self):
        with pytest.raises(ValueError, match="empty"):
            check_strength(None)

    def test_password_below_min_length(self):
        with pytest.raises(ValueError, match="at least 8"):
            check_strength("Ab1!")

    def test_password_exceeds_max_length(self):
        with pytest.raises(ValueError, match="24"):
            check_strength("aB3!" * 10)

    def test_password_at_min_length(self):
        result = check_strength("abcdefgh")
        assert result["length"] == 8

    def test_password_at_max_length(self):
        result = check_strength("aB3!" * 6)
        assert result["length"] == 24

    def test_character_types_all_true(self):
        result = check_strength("Abcde1!x")
        ct = result["character_types"]
        assert ct["has_upper"] is True
        assert ct["has_lower"] is True
        assert ct["has_digit"] is True
        assert ct["has_special"] is True

    def test_character_types_only_lower(self):
        result = check_strength("abcdefgh")
        ct = result["character_types"]
        assert ct["has_upper"] is False
        assert ct["has_lower"] is True
        assert ct["has_digit"] is False
        assert ct["has_special"] is False

    def test_response_schema_keys(self):
        result = check_strength("SomePass1!")
        for key in ("score", "label", "crack_time", "feedback", "length", "character_types"):
            assert key in result
        assert "warning" in result["feedback"]
        assert "suggestions" in result["feedback"]

    def test_password_not_in_result(self):
        pw = "SuperSecret99!"
        result = check_strength(pw)
        assert pw not in json.dumps(result)

    def test_unicode_password(self):
        result = check_strength("pässwörд!")
        assert "score" in result
        assert result["length"] > 0




# Flask integration tests

from app.config import TestConfig


@pytest.fixture
def client():
    app = create_app(TestConfig)
    with app.test_client() as c:
        yield c


AUTH_HEADER = {"Authorization": "Bearer stub-token", "Content-Type": "application/json"}


class TestStrengthEndpoint:

    def test_weak_password_returns_low_score(self, client):
        resp = client.post("/password/strength", json={"password": "password1"}, headers=AUTH_HEADER)
        assert resp.status_code == 200
        assert resp.get_json()["score"] in (1, 2)

    def test_strong_password_returns_high_score(self, client):
        resp = client.post("/password/strength", json={"password": "Tr0ub4dor&3"}, headers=AUTH_HEADER)
        assert resp.status_code == 200
        assert resp.get_json()["score"] >= 3

    def test_empty_password(self, client):
        resp = client.post("/password/strength", json={"password": ""}, headers=AUTH_HEADER)
        assert resp.status_code == 400
        assert "empty" in resp.get_json()["error"].lower()

    def test_password_below_min_length(self, client):
        resp = client.post("/password/strength", json={"password": "Ab1!"}, headers=AUTH_HEADER)
        assert resp.status_code == 400
        assert "at least 8" in resp.get_json()["error"].lower()

    def test_password_exceeds_max_length(self, client):
        resp = client.post("/password/strength", json={"password": "aB3!" * 10}, headers=AUTH_HEADER)
        assert resp.status_code == 400
        assert "24" in resp.get_json()["error"]

    def test_password_at_max_length(self, client):
        resp = client.post("/password/strength", json={"password": "aB3!" * 6}, headers=AUTH_HEADER)
        assert resp.status_code == 200
        assert resp.get_json()["length"] == 24

    def test_missing_password_field(self, client):
        resp = client.post("/password/strength", json={"wrong_key": "oops"}, headers=AUTH_HEADER)
        assert resp.status_code == 400

    def test_non_string_password(self, client):
        resp = client.post("/password/strength", json={"password": 12345}, headers=AUTH_HEADER)
        assert resp.status_code == 400

    def test_no_body(self, client):
        resp = client.post("/password/strength", headers=AUTH_HEADER)
        assert resp.status_code == 400

    def test_missing_auth_header(self, client):
        resp = client.post("/password/strength", json={"password": "test"})
        assert resp.status_code == 401

    def test_malformed_auth_header(self, client):
        resp = client.post(
            "/password/strength",
            json={"password": "test"},
            headers={"Authorization": "NotBearer token", "Content-Type": "application/json"},
        )
        assert resp.status_code == 401

    def test_password_not_echoed_in_response(self, client):
        secret = "MyS3cr3tP@ss!"
        resp = client.post("/password/strength", json={"password": secret}, headers=AUTH_HEADER)
        assert resp.status_code == 200
        assert secret not in resp.get_data(as_text=True)

    def test_response_contains_all_fields(self, client):
        resp = client.post("/password/strength", json={"password": "Hello123!"}, headers=AUTH_HEADER)
        data = resp.get_json()
        for key in ("score", "label", "crack_time", "feedback", "length", "character_types"):
            assert key in data

    def test_feedback_structure(self, client):
        resp = client.post("/password/strength", json={"password": "password1"}, headers=AUTH_HEADER)
        fb = resp.get_json()["feedback"]
        assert "warning" in fb
        assert "suggestions" in fb
        assert isinstance(fb["suggestions"], list)