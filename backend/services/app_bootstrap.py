"""Startup helpers for one-time application bootstrap tasks."""

from __future__ import annotations

from sqlalchemy.orm import Session

from backend.core.config import settings
from backend.core.security import hash_password, verify_password
from backend.models.user import User


def ensure_shared_account(db: Session) -> None:
    """Create or refresh the shared clinician account when configured."""
    email = (settings.adler_shared_account_email or "").strip().lower()
    password = settings.adler_shared_account_password

    if not email or not password:
        return

    account = db.query(User).filter(User.email == email).first()
    desired_name = settings.adler_shared_account_name.strip() or "Equipe Adler Demo"

    if account is None:
        db.add(
            User(
                name=desired_name,
                email=email,
                password_hash=hash_password(password),
            )
        )
        db.commit()
        return

    should_commit = False
    if account.name != desired_name:
        account.name = desired_name
        should_commit = True

    if account.password_hash and not verify_password(password, account.password_hash):
        account.password_hash = hash_password(password)
        should_commit = True

    if should_commit:
        db.add(account)
        db.commit()
