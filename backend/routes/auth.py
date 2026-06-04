"""Authentication routes for the Adler AI."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy.orm import Session

from backend.core.database import get_db
from backend.core.security import create_session_token, hash_password, hash_token, verify_password
from backend.models.user import User
from backend.models.user_session import UserSession
from backend.routes.deps import get_current_user
from backend.schemas.auth import AuthResponse, LoginPayload, RegisterPayload, UserRead


SESSION_DURATION_DAYS = 30

router = APIRouter(prefix="/api/auth", tags=["auth"])


def _create_auth_response(user: User, db: Session) -> AuthResponse:
    raw_token = create_session_token()
    expires_at = datetime.now(timezone.utc) + timedelta(days=SESSION_DURATION_DAYS)
    db.add(UserSession(user_id=user.id, token_hash=hash_token(raw_token), expires_at=expires_at))
    db.commit()
    db.refresh(user)
    return AuthResponse(token=raw_token, user=user)


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterPayload, db: Session = Depends(get_db)) -> AuthResponse:
    existing = db.query(User).filter(User.email == payload.email.lower()).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    user = User(
        name=payload.name.strip(),
        email=payload.email.lower(),
        password_hash=hash_password(payload.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return _create_auth_response(user, db)


@router.post("/login", response_model=AuthResponse)
def login(payload: LoginPayload, db: Session = Depends(get_db)) -> AuthResponse:
    user = db.query(User).filter(User.email == payload.email.lower()).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    return _create_auth_response(user, db)


@router.get("/me", response_model=UserRead)
def me(user: User = Depends(get_current_user)) -> User:
    return user


@router.post("/logout")
def logout(
    authorization: str | None = Header(default=None),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict[str, str]:
    _ = user
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ", 1)[1].strip()
        session = db.query(UserSession).filter(UserSession.token_hash == hash_token(token)).first()
        if session:
            db.delete(session)
            db.commit()
    return {"status": "logged_out"}
