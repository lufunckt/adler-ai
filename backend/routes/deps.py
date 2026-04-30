"""Shared route dependencies."""

from __future__ import annotations

from datetime import datetime, timezone

from fastapi import Depends, Header, HTTPException, status
from sqlalchemy.orm import Session

from backend.core.database import get_db
from backend.core.security import hash_token
from backend.models.user import User
from backend.models.user_session import UserSession


def get_current_user(
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db),
) -> User:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing auth token")

    token = authorization.split(" ", 1)[1].strip()
    session = (
        db.query(UserSession)
        .filter(UserSession.token_hash == hash_token(token))
        .filter(UserSession.expires_at > datetime.now(timezone.utc))
        .first()
    )
    if not session:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid session")
    return session.user
