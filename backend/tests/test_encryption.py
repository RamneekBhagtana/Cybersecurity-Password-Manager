"""
Unit tests for Task 14 — AES-256-GCM Encryption Service

Coverage:
  - encrypt/decrypt round-trip (standard, empty string, Unicode)
  - Wrong key raises DecryptionError (no plaintext leaked)
  - Corrupted ciphertext raises DecryptionError
  - Corrupted auth tag raises DecryptionError
  - Unique nonce per encryption call (never reused)
  - Key derivation (Argon2id) produces consistent output for same inputs
  - Key derivation produces different output for different salts
  - ValueError on invalid key length
  - ValueError on empty master password
"""

import os
import pytest

from app.services.encryption import (
    decrypt,
    derive_key,
    encrypt,
    DecryptionError,
    NONCE_SIZE,
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def make_key() -> bytes:
    """Return a valid random 32-byte key for tests that don't need Argon2."""
    return os.urandom(32)


# ---------------------------------------------------------------------------
# Round-trip tests
# ---------------------------------------------------------------------------

class TestRoundTrip:
    def test_basic_roundtrip(self):
        key = make_key()
        plaintext = "MyS3cretP@ssword!"
        ciphertext, iv, auth_tag = encrypt(plaintext, key)
        assert decrypt(ciphertext, iv, auth_tag, key) == plaintext

    def test_empty_string_roundtrip(self):
        """Empty string is a valid vault entry (e.g. no password stored yet)."""
        key = make_key()
        ciphertext, iv, auth_tag = encrypt("", key)
        assert decrypt(ciphertext, iv, auth_tag, key) == ""

    def test_unicode_roundtrip(self):
        """Passwords may contain non-ASCII characters."""
        key = make_key()
        plaintext = "pässwörD_中文_🔐"
        ciphertext, iv, auth_tag = encrypt(plaintext, key)
        assert decrypt(ciphertext, iv, auth_tag, key) == plaintext

    def test_long_password_roundtrip(self):
        key = make_key()
        plaintext = "x" * 1024
        ciphertext, iv, auth_tag = encrypt(plaintext, key)
        assert decrypt(ciphertext, iv, auth_tag, key) == plaintext

    def test_special_characters_roundtrip(self):
        key = make_key()
        plaintext = r"!@#$%^&*()_+-=[]{}|;':\",./<>?"
        ciphertext, iv, auth_tag = encrypt(plaintext, key)
        assert decrypt(ciphertext, iv, auth_tag, key) == plaintext


# ---------------------------------------------------------------------------
# Wrong key / corruption tests
# ---------------------------------------------------------------------------

class TestAuthenticationFailures:
    def test_wrong_key_raises_decryption_error(self):
        key_a = make_key()
        key_b = make_key()  # different key
        ciphertext, iv, auth_tag = encrypt("secret", key_a)
        with pytest.raises(DecryptionError):
            decrypt(ciphertext, iv, auth_tag, key_b)

    def test_corrupted_ciphertext_raises_decryption_error(self):
        key = make_key()
        ciphertext, iv, auth_tag = encrypt("secret", key)
        # Flip a byte in the ciphertext
        bad_ciphertext = bytes([ciphertext[0] ^ 0xFF]) + ciphertext[1:]
        with pytest.raises(DecryptionError):
            decrypt(bad_ciphertext, iv, auth_tag, key)

    def test_corrupted_auth_tag_raises_decryption_error(self):
        key = make_key()
        ciphertext, iv, auth_tag = encrypt("secret", key)
        bad_tag = bytes([auth_tag[0] ^ 0xFF]) + auth_tag[1:]
        with pytest.raises(DecryptionError):
            decrypt(ciphertext, iv, bad_tag, key)

    def test_corrupted_iv_raises_decryption_error(self):
        key = make_key()
        ciphertext, iv, auth_tag = encrypt("secret", key)
        bad_iv = bytes([iv[0] ^ 0xFF]) + iv[1:]
        with pytest.raises(DecryptionError):
            decrypt(ciphertext, bad_iv, auth_tag, key)

    def test_decryption_error_message_contains_no_plaintext(self):
        """Ensure error message never leaks the plaintext."""
        key_a = make_key()
        key_b = make_key()
        plaintext = "TopSecretPassword"
        ciphertext, iv, auth_tag = encrypt(plaintext, key_a)
        with pytest.raises(DecryptionError) as exc_info:
            decrypt(ciphertext, iv, auth_tag, key_b)
        assert plaintext not in str(exc_info.value)


# ---------------------------------------------------------------------------
# Nonce uniqueness
# ---------------------------------------------------------------------------

class TestNonceUniqueness:
    def test_unique_nonce_per_encryption(self):
        """Each encryption call must produce a different nonce."""
        key = make_key()
        plaintext = "same plaintext"
        results = [encrypt(plaintext, key) for _ in range(100)]
        ivs = [iv for _, iv, _ in results]
        # All nonces must be unique
        assert len(set(ivs)) == 100, "Nonce collision detected — CRITICAL security failure"

    def test_nonce_is_correct_length(self):
        key = make_key()
        _, iv, _ = encrypt("test", key)
        assert len(iv) == NONCE_SIZE  # must be 12 bytes

    def test_auth_tag_is_16_bytes(self):
        key = make_key()
        _, _, auth_tag = encrypt("test", key)
        assert len(auth_tag) == 16

    def test_same_plaintext_different_ciphertext(self):
        """Same plaintext + key must produce different ciphertext (due to unique nonce)."""
        key = make_key()
        ct1, _, _ = encrypt("hello", key)
        ct2, _, _ = encrypt("hello", key)
        assert ct1 != ct2


# ---------------------------------------------------------------------------
# Input validation
# ---------------------------------------------------------------------------

class TestInputValidation:
    def test_encrypt_rejects_short_key(self):
        with pytest.raises(ValueError):
            encrypt("hello", b"tooshort")

    def test_decrypt_rejects_short_key(self):
        key = make_key()
        ct, iv, tag = encrypt("hello", key)
        with pytest.raises(ValueError):
            decrypt(ct, iv, tag, b"tooshort")


# ---------------------------------------------------------------------------
# Key derivation (Argon2id)
# ---------------------------------------------------------------------------

class TestKeyDerivation:
    def test_derive_key_is_32_bytes(self):
        salt = os.urandom(16)
        key = derive_key("masterpassword", salt)
        assert len(key) == 32

    def test_derive_key_deterministic(self):
        """Same password + salt always produces the same key."""
        salt = os.urandom(16)
        key1 = derive_key("masterpassword", salt)
        key2 = derive_key("masterpassword", salt)
        assert key1 == key2

    def test_derive_key_different_salt_different_key(self):
        salt1 = os.urandom(16)
        salt2 = os.urandom(16)
        key1 = derive_key("masterpassword", salt1)
        key2 = derive_key("masterpassword", salt2)
        assert key1 != key2

    def test_derive_key_different_password_different_key(self):
        salt = os.urandom(16)
        key1 = derive_key("password1", salt)
        key2 = derive_key("password2", salt)
        assert key1 != key2

    def test_derive_key_empty_password_raises(self):
        with pytest.raises(ValueError):
            derive_key("", os.urandom(16))

    def test_derive_key_short_salt_raises(self):
        with pytest.raises(ValueError):
            derive_key("masterpassword", b"short")

    def test_full_pipeline_with_derived_key(self):
        """End-to-end: derive key from master password, encrypt, decrypt."""
        salt = os.urandom(16)
        key = derive_key("MyMasterP@ss!", salt)
        plaintext = "github_password_abc123"
        ciphertext, iv, auth_tag = encrypt(plaintext, key)

        # Re-derive at 'runtime' (simulates what happens on each request)
        key_rederived = derive_key("MyMasterP@ss!", salt)
        result = decrypt(ciphertext, iv, auth_tag, key_rederived)
        assert result == plaintext