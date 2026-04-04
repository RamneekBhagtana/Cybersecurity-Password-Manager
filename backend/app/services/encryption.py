"""
Task 14 — AES-256-GCM Encryption Service
-----------------------------------------
Provides encrypt() and decrypt() for vault entry data.

Key derivation: Argon2id (OWASP-recommended parameters)
Encryption:     AES-256-GCM (authenticated encryption)
Nonce:          12-byte random, unique per operation, never reused
Storage format: nonce (12 bytes) || ciphertext || auth_tag (16 bytes)
                returned as separate values to match the VaultEntry model

SECURITY INVARIANTS:
  - The encryption key is NEVER stored or logged.
  - Plaintext is NEVER written to logs or error messages.
  - A wrong key or corrupted ciphertext raises DecryptionError immediately.
"""

import os
import logging

from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from argon2.low_level import hash_secret_raw, Type

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Custom exception
# ---------------------------------------------------------------------------

class DecryptionError(Exception):
    """
    Raised when AES-256-GCM authentication tag verification fails.
    This indicates either a wrong key or corrupted ciphertext.
    No plaintext or key material is ever included in this exception.
    """


# ---------------------------------------------------------------------------
# Argon2id parameters (OWASP recommended, as of 2024)
# https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html
# ---------------------------------------------------------------------------

ARGON2_TIME_COST    = 3          # iterations
ARGON2_MEMORY_COST  = 64 * 1024  # 64 MiB in KiB
ARGON2_PARALLELISM  = 4          # threads
ARGON2_HASH_LEN     = 32         # 256-bit output key
ARGON2_TYPE         = Type.ID    # Argon2id variant

# AES-GCM nonce length (96 bits — the NIST-recommended size for GCM)
NONCE_SIZE = 12


# ---------------------------------------------------------------------------
# Key derivation
# ---------------------------------------------------------------------------

def derive_key(master_password: str, salt: bytes) -> bytes:
    """
    Derives a 256-bit AES key from the user's master password using Argon2id.

    Args:
        master_password: The user's plaintext master password.
        salt:            A unique, persistent per-user salt (stored in the
                         User.encryption_salt column, NOT the IV/nonce).

    Returns:
        32-byte derived key (never stored, used only at runtime).

    Notes:
        The returned key must be discarded after use. It is the caller's
        responsibility never to log or persist it.
    """
    if not master_password:
        raise ValueError("Master password must not be empty.")
    if not salt or len(salt) < 16:
        raise ValueError("Salt must be at least 16 bytes.")

    key = hash_secret_raw(
        secret=master_password.encode("utf-8"),
        salt=salt,
        time_cost=ARGON2_TIME_COST,
        memory_cost=ARGON2_MEMORY_COST,
        parallelism=ARGON2_PARALLELISM,
        hash_len=ARGON2_HASH_LEN,
        type=ARGON2_TYPE,
    )
    return key


# ---------------------------------------------------------------------------
# Encryption
# ---------------------------------------------------------------------------

def encrypt(plaintext: str, key: bytes) -> tuple[bytes, bytes, bytes]:
    """
    Encrypts a plaintext string with AES-256-GCM.

    Args:
        plaintext: The credential string to encrypt (may be empty, may contain Unicode).
        key:       A 32-byte AES-256 key (derived via derive_key(), never stored).

    Returns:
        A 3-tuple: (ciphertext, iv, auth_tag)
          - iv (nonce): 12 random bytes, unique per call.
          - ciphertext: the encrypted bytes (without the tag appended).
          - auth_tag:   16-byte GCM authentication tag.

        These map directly to the VaultEntry model columns:
          VaultEntry.encrypted_password, VaultEntry.iv, VaultEntry.auth_tag

    Raises:
        ValueError: If key is not exactly 32 bytes.
    """
    if len(key) != 32:
        raise ValueError("Key must be exactly 32 bytes for AES-256.")

    iv = os.urandom(NONCE_SIZE)  # fresh nonce every call — NEVER reuse
    aesgcm = AESGCM(key)

    # cryptography library appends the 16-byte tag to the end of the output
    ciphertext_with_tag = aesgcm.encrypt(iv, plaintext.encode("utf-8"), None)

    # Split off the trailing 16-byte auth tag so each piece maps to its own
    # database column (matching the VaultEntry model from Task 10).
    ciphertext = ciphertext_with_tag[:-16]
    auth_tag   = ciphertext_with_tag[-16:]

    return ciphertext, iv, auth_tag


# ---------------------------------------------------------------------------
# Decryption
# ---------------------------------------------------------------------------

def decrypt(ciphertext: bytes, iv: bytes, auth_tag: bytes, key: bytes) -> str:
    """
    Decrypts AES-256-GCM ciphertext back to a plaintext string.

    Args:
        ciphertext: The encrypted bytes (VaultEntry.encrypted_password).
        iv:         The 12-byte nonce used during encryption (VaultEntry.iv).
        auth_tag:   The 16-byte GCM auth tag (VaultEntry.auth_tag).
        key:        The 32-byte AES-256 key derived at runtime.

    Returns:
        The original plaintext string.

    Raises:
        DecryptionError: If the authentication tag does not verify — caused by
                         a wrong key, corrupted ciphertext, or tampered auth tag.
                         No plaintext is returned or logged on failure.
        ValueError:      If key is not exactly 32 bytes.
    """
    if len(key) != 32:
        raise ValueError("Key must be exactly 32 bytes for AES-256.")

    aesgcm = AESGCM(key)
    # Reassemble the format the library expects: ciphertext || auth_tag
    combined = ciphertext + auth_tag

    try:
        plaintext_bytes = aesgcm.decrypt(iv, combined, None)
    except Exception:
        # cryptography raises InvalidTag on auth failure.
        # We catch broadly and re-raise as DecryptionError to avoid
        # leaking implementation details or any partial plaintext.
        raise DecryptionError(
            "Decryption failed: authentication tag verification error. "
            "The key may be incorrect or the data may be corrupted."
        )

    return plaintext_bytes.decode("utf-8")