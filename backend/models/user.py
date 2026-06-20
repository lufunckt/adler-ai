"""Authenticated user model for the Adler AI."""

from sqlalchemy import Column, DateTime, Integer, String, func, Boolean
from sqlalchemy.orm import relationship

from backend.models.base import Base


class User(Base):
    __tablename__ = "crm_users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False)
    email = Column(String(200), nullable=False, unique=True, index=True)
    password_hash = Column(String(255), nullable=False)
    is_approved = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    sessions = relationship("UserSession", back_populates="user", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<User id={self.id} email={self.email} approved={self.is_approved}>"
