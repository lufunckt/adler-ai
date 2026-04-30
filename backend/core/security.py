"""Security helpers for password hashing and opaque session tokens."""

from __future__ import annotations

import hashlib
import hmac
import secrets


PBKDF2_ITERATIONS = 150_000


def hash_password(password: str) -> str:
    """Hash a password using PBKDF2-HMAC-SHA256."""
    salt = secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt.encode("utf-8"),
        PBKDF2_ITERATIONS,
    ).hex()
    return f"pbkdf2_sha256${PBKDF2_ITERATIONS}${salt}${digest}"


def verify_password(password: str, stored_hash: str) -> bool:
    """Verify a plain password against a stored PBKDF2 hash."""
    try:
        algorithm, rounds, salt, digest = stored_hash.split("$", 3)
    except ValueError:
        return False
    if algorithm != "pbkdf2_sha256":
        return False
    calculated = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt.encode("utf-8"),
        int(rounds),
    ).hex()
    return hmac.compare_digest(calculated, digest)


def create_session_token() -> str:
    """Create a secure session token for client-side storage."""
    return secrets.token_urlsafe(32)


def hash_token(token: str) -> str:
    """Hash a session token before storing it."""
    return hashlib.sha256(token.encode("utf-8")).hexdigest()
