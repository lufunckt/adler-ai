"""Clinical intelligence persistence models for Adler."""

from sqlalchemy import JSON, Column, DateTime, Integer, String, Text, UniqueConstraint, func

from backend.models.base import Base


class AdlerClinicalSession(Base):
    __tablename__ = "adler_clinical_sessions"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(String(120), nullable=False, index=True)
    patient_id = Column(String(120), nullable=False, index=True)
    session_number = Column(Integer, nullable=False, index=True)
    approach = Column(String(40), nullable=False, index=True)
    occurred_at = Column(DateTime(timezone=True), nullable=False)
    symptoms_json = Column(JSON, nullable=False, default=list)
    emotions_json = Column(JSON, nullable=False, default=list)
    events_json = Column(JSON, nullable=False, default=list)
    behaviors_json = Column(JSON, nullable=False, default=list)
    medication_json = Column(JSON, nullable=False, default=list)
    time_context = Column(String(240), nullable=True)
    source = Column(String(80), nullable=False, default="clinical_input")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class AdlerClinicalAnalysis(Base):
    __tablename__ = "adler_clinical_analysis_json"
    __table_args__ = (
        UniqueConstraint(
            "tenant_id",
            "patient_id",
            "session_number",
            "approach",
            "version",
            name="uq_adler_analysis_version",
        ),
    )

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(String(120), nullable=False, index=True)
    patient_id = Column(String(120), nullable=False, index=True)
    session_id = Column(Integer, nullable=False, index=True)
    session_number = Column(Integer, nullable=False, index=True)
    approach = Column(String(40), nullable=False, index=True)
    version = Column(Integer, nullable=False, default=1)
    status = Column(String(40), nullable=False, default="validated")
    engine = Column(String(80), nullable=False, default="adler_rules_v1")
    analysis_json = Column(JSON, nullable=False)
    validation_errors = Column(JSON, nullable=False, default=list)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class AdlerRiskScore(Base):
    __tablename__ = "adler_risk_scores"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(String(120), nullable=False, index=True)
    patient_id = Column(String(120), nullable=False, index=True)
    session_id = Column(Integer, nullable=True, index=True)
    session_number = Column(Integer, nullable=True, index=True)
    risk_type = Column(String(80), nullable=False, index=True)
    score = Column(Integer, nullable=False)
    classification = Column(String(40), nullable=False)
    factors_json = Column(JSON, nullable=False, default=list)
    recommendation = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class AdlerEvolutionSnapshot(Base):
    __tablename__ = "adler_evolution_snapshots"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(String(120), nullable=False, index=True)
    patient_id = Column(String(120), nullable=False, index=True)
    from_session = Column(Integer, nullable=True)
    to_session = Column(Integer, nullable=True)
    status = Column(String(60), nullable=False)
    summary_json = Column(JSON, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class AdlerGeneratedDocument(Base):
    __tablename__ = "adler_generated_documents"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(String(120), nullable=False, index=True)
    patient_id = Column(String(120), nullable=False, index=True)
    session_id = Column(Integer, nullable=True, index=True)
    document_type = Column(String(80), nullable=False, index=True)
    title = Column(String(240), nullable=False)
    parameters_json = Column(JSON, nullable=False, default=dict)
    draft_json = Column(JSON, nullable=False)
    status = Column(String(40), nullable=False, default="draft_requires_clinician_review")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class AdlerPharmacogeneticsResult(Base):
    __tablename__ = "adler_pharmacogenetics_results"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(String(120), nullable=False, index=True)
    patient_id = Column(String(120), nullable=False, index=True)
    gene = Column(String(80), nullable=False, index=True)
    phenotype = Column(String(160), nullable=False)
    source_lab = Column(String(180), nullable=True)
    result_json = Column(JSON, nullable=False, default=dict)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class AdlerWhatsappCheckin(Base):
    __tablename__ = "adler_whatsapp_checkins"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(String(120), nullable=False, index=True)
    patient_id = Column(String(120), nullable=False, index=True)
    mood = Column(Integer, nullable=True)
    anxiety = Column(Integer, nullable=True)
    sleep = Column(Integer, nullable=True)
    adherence = Column(Integer, nullable=True)
    notes = Column(Text, nullable=True)
    consent_status = Column(String(80), nullable=False, default="consented")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class AdlerWhatsappMessage(Base):
    __tablename__ = "adler_whatsapp_messages"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(String(120), nullable=False, index=True)
    patient_id = Column(String(120), nullable=True, index=True)
    external_message_id = Column(String(180), nullable=True, index=True)
    direction = Column(String(20), nullable=False, index=True)
    channel = Column(String(40), nullable=False, default="whatsapp")
    phone_hash = Column(String(180), nullable=True, index=True)
    intent = Column(String(80), nullable=True, index=True)
    template_key = Column(String(120), nullable=True)
    body = Column(Text, nullable=False)
    structured_payload = Column(JSON, nullable=False, default=dict)
    safety_classification = Column(String(80), nullable=False, default="operational")
    clinical_boundary_notice = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class AdlerAppointmentConfirmation(Base):
    __tablename__ = "adler_appointment_confirmations"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(String(120), nullable=False, index=True)
    patient_id = Column(String(120), nullable=False, index=True)
    appointment_id = Column(String(120), nullable=True, index=True)
    scheduled_at = Column(DateTime(timezone=True), nullable=True)
    reminder_sent_at = Column(DateTime(timezone=True), nullable=True)
    status = Column(String(40), nullable=False, default="pending", index=True)
    response_text = Column(Text, nullable=True)
    source_message_id = Column(Integer, nullable=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class AdlerEngagementFlag(Base):
    __tablename__ = "adler_engagement_flags"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(String(120), nullable=False, index=True)
    patient_id = Column(String(120), nullable=False, index=True)
    flag_type = Column(String(80), nullable=False, index=True)
    severity = Column(String(40), nullable=False, index=True)
    source = Column(String(80), nullable=False)
    evidence_json = Column(JSON, nullable=False, default=dict)
    recommended_action = Column(Text, nullable=False)
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
