"""Durable workspace storage for Adler notes and uploaded documents."""

from sqlalchemy import Column, DateTime, Integer, LargeBinary, String, Text, func

from backend.models.base import Base


class AdlerTenantNote(Base):
    __tablename__ = "adler_tenant_notes"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(String(120), nullable=False, unique=True, index=True)
    value = Column(Text, nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class AdlerTenantDocument(Base):
    __tablename__ = "adler_tenant_documents"

    id = Column(String(64), primary_key=True, index=True)
    tenant_id = Column(String(120), nullable=False, index=True)
    patient_id = Column(String(120), nullable=True, index=True)
    patient_name = Column(String(180), nullable=True)
    name = Column(String(240), nullable=False)
    mime_type = Column(String(120), nullable=False)
    size_bytes = Column(Integer, nullable=False)
    file_bytes = Column(LargeBinary, nullable=False)
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
