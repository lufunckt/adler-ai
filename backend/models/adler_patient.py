"""Durable patient and appointment models for Adler."""

from sqlalchemy import JSON, Column, DateTime, Integer, String, Text, UniqueConstraint, func

from backend.models.base import Base


class AdlerPatient(Base):
    __tablename__ = "adler_patients"
    __table_args__ = (
        UniqueConstraint("tenant_id", "id", name="uq_adler_patient_tenant_id"),
    )

    pk = Column(Integer, primary_key=True, index=True)
    id = Column(String(120), nullable=False, index=True)
    tenant_id = Column(String(120), nullable=False, index=True)
    name = Column(String(180), nullable=False, index=True)
    initials = Column(String(20), nullable=False)
    focus = Column(String(240), nullable=False)
    diagnosis = Column(Text, nullable=False)
    current_protocol = Column(Text, nullable=False)
    default_session = Column(Integer, nullable=False, default=1)
    status = Column(String(40), nullable=False, default="active", index=True)
    profile_json = Column(JSON, nullable=False, default=dict)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class AdlerAppointment(Base):
    __tablename__ = "adler_appointments"
    __table_args__ = (
        UniqueConstraint("tenant_id", "id", name="uq_adler_appointment_tenant_id"),
    )

    pk = Column(Integer, primary_key=True, index=True)
    id = Column(String(120), nullable=False, index=True)
    tenant_id = Column(String(120), nullable=False, index=True)
    patient_id = Column(String(120), nullable=False, index=True)
    time = Column(String(20), nullable=False)
    duration = Column(String(40), nullable=False)
    session_label = Column(String(160), nullable=False)
    mode = Column(String(80), nullable=False)
    room_label = Column(String(120), nullable=False)
    prep_note = Column(Text, nullable=False)
    status = Column(String(40), nullable=False, default="scheduled", index=True)
    sort_order = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
