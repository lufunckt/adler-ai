"""Service to interact with the database-backed scientific knowledge base."""

from __future__ import annotations
from typing import Any, Literal
from sqlalchemy.orm import Session
from backend.models.adler_science_knowledge import (
    AdlerStaticScience,
    AdlerClinicalEvidence,
    AdlerMedicationRef,
    AdlerTherapeuticProtocol,
    AdlerKnowledgeStaging
)

def get_clinical_criteria(db: Session, subject: str) -> dict | None:
    record = db.query(AdlerStaticScience).filter(
        AdlerStaticScience.category == "criteria",
        AdlerStaticScience.subject == subject.upper()
    ).first()
    return record.content_json if record else None

def list_concepts_by_keywords(db: Session, keywords: list[str]) -> list[dict]:
    # Simple search for MVP
    records = db.query(AdlerStaticScience).filter(AdlerStaticScience.category == "concept").all()
    results = []
    for r in records:
        content = str(r.content_json).lower()
        if any(kw.lower() in content for kw in keywords):
            results.append(r.content_json)
    return results

def get_medication_ref(db: Session, generic_name: str) -> dict | None:
    record = db.query(AdlerMedicationRef).filter(
        AdlerMedicationRef.generic_name == generic_name.lower()
    ).first()
    if not record: return None
    return {
        "id": record.id,
        "name": record.generic_name,
        "class": record.class_name,
        "mechanism": record.mechanism,
        "interactions": record.interactions_json,
        "monitoring": record.monitoring_json,
        "maturity": record.maturity_level
    }

def get_evidence_for_subject(db: Session, subject: str) -> list[dict]:
    records = db.query(AdlerClinicalEvidence).filter(
        AdlerClinicalEvidence.subject == subject.upper()
    ).all()
    return [{
        "source": r.source,
        "level": r.evidence_level,
        "summary": r.summary,
        "recommendations": r.recommendations_json,
        "maturity": r.maturity_level
    } for r in records]

def get_protocol_by_approach(db: Session, approach: str, subject: str) -> dict | None:
    record = db.query(AdlerTherapeuticProtocol).filter(
        AdlerTherapeuticProtocol.approach == approach,
        AdlerTherapeuticProtocol.indications.contains(subject)
    ).first()
    if not record: return None
    return {
        "name": record.name,
        "steps": record.steps_json,
        "maturity": record.maturity_level
    }

# Compatibility helper for transition
def load_scientific_base(*args, **kwargs):
    return {
        "clinical_concepts": [],
        "psychopathology": [],
        "interactions": [],
        "laboratory_monitoring": [],
        "document_models": []
    }

def list_document_models(*args, **kwargs):
    return []

def get_document_model_path(*args, **kwargs):
    return None

def ingest_raw_science_text(*args, **kwargs):
    return {"status": "success"}
