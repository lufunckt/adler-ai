"""Scientific knowledge base models for Adler AI - Gold Standard Structure."""

from sqlalchemy import Column, DateTime, Integer, String, Text, JSON, func, Boolean
from backend.models.base import Base

class AdlerStaticScience(Base):
    """Type 1 Knowledge: DSM, CID, Stahl, etc."""
    __tablename__ = "adler_static_science"

    id = Column(String(120), primary_key=True)
    source = Column(String(80), index=True)
    category = Column(String(80), index=True)
    subject = Column(String(180), index=True)
    maturity_level = Column(Integer, default=1)
    content_json = Column(JSON, nullable=False)
    reference_icon = Column(String(80)) # lucide icon name
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class AdlerClinicalEvidence(Base):
    """Type 2 Knowledge: Metapsy, NICE, Meta-analysis."""
    __tablename__ = "adler_clinical_evidence"

    id = Column(String(120), primary_key=True)
    source = Column(String(180), index=True)
    year = Column(Integer)
    evidence_level = Column(String(40))
    subject = Column(String(180), index=True)
    maturity_level = Column(Integer, default=1)
    summary = Column(Text)
    recommendations_json = Column(JSON)
    reference_icon = Column(String(80))
    study_link = Column(String(255))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class AdlerMedicationRef(Base):
    """Technical medication reference."""
    __tablename__ = "adler_medication_refs"

    id = Column(String(120), primary_key=True)
    generic_name = Column(String(180), index=True)
    class_name = Column(String(120))
    mechanism = Column(Text)
    maturity_level = Column(Integer, default=1)
    interactions_json = Column(JSON)
    monitoring_json = Column(JSON)
    source = Column(String(120))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class AdlerTherapeuticProtocol(Base):
    """Therapeutic frameworks like ERP, CBT, DBT."""
    __tablename__ = "adler_therapeutic_protocols"

    id = Column(String(80), primary_key=True)
    name = Column(String(120), index=True)
    approach = Column(String(80), index=True) # 'cbt', 'schema', 'psychoanalysis'
    characteristics_json = Column(JSON) # goals, techniques, stance
    maturity_level = Column(Integer, default=1)
    steps_json = Column(JSON)
    indications = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class AdlerKnowledgeStaging(Base):
    """Staging area for IA-extracted knowledge before human approval."""
    __tablename__ = "adler_knowledge_staging"

    id = Column(Integer, primary_key=True, index=True)
    raw_text = Column(Text)
    extracted_json = Column(JSON)
    target_table = Column(String(80))
    status = Column(String(40), default="pending_review")
    clinician_id = Column(String(120))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class AdlerClinicianProfile(Base):
    """Clinician profile and access level."""
    __tablename__ = "adler_clinician_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String(120), index=True, unique=True)
    primary_approach = Column(String(80))
    is_premium = Column(Boolean, default=False)
    onboarding_completed = Column(Boolean, default=False)
    writing_style = Column(String(80))
    preferred_structure = Column(String(80))
    focus_bias = Column(String(80))
    document_style = Column(String(80))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class AdlerClinicianBehaviorLog(Base):
    """Behavior tracking."""
    __tablename__ = "adler_clinician_behavior_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String(120), index=True)
    session_id = Column(Integer, index=True)
    action_type = Column(String(80))
    original_content = Column(Text)
    edited_content = Column(Text)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

class AdlerClinicianPreferenceModel(Base):
    """Preference model."""
    __tablename__ = "adler_clinician_preference_models"

    user_id = Column(String(120), primary_key=True)
    summary_profile = Column(JSON)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class AdlerOfficialDocumentTemplate(Base):
    """Official templates."""
    __tablename__ = "adler_document_templates"

    id = Column(String(80), primary_key=True)
    title = Column(String(240), nullable=False)
    document_type = Column(String(80), index=True)
    official_source = Column(String(180))
    content_structure = Column(JSON)
    maturity_level = Column(Integer, default=1)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
