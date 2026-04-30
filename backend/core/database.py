"""Database helpers that expose a session and initialize the schema."""

import os

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import NullPool

from backend.core.config import settings
from backend.models.base import Base


_connect_args = {}
_engine_kwargs = {
    "future": True,
    "pool_pre_ping": True,
}

if settings.database_url.startswith("sqlite"):
    _connect_args["check_same_thread"] = False
elif os.getenv("VERCEL"):
    _engine_kwargs["poolclass"] = NullPool

engine = create_engine(
    settings.database_url,
    connect_args=_connect_args,
    **_engine_kwargs,
)

SessionLocal = sessionmaker(bind=engine, autoflush=False, future=True, expire_on_commit=False)


def init_db() -> None:
    """Create tables based on SQLAlchemy models."""
    # Import model package so all declarative classes are registered on Base.metadata.
    import backend.models  # noqa: F401

    Base.metadata.create_all(bind=engine)


def get_db():
    """Yield a database session for dependency injection."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
