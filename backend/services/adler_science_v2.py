from sqlalchemy.orm import Session
from backend.models.adler_science_knowledge import (
    AdlerStaticScience,
    AdlerOfficialDocumentTemplate,
    AdlerMedicationRef,
    AdlerClinicalEvidence
)
from sqlalchemy import or_

def search_dsm_criteria(db: Session, query: str):
    records = db.query(AdlerStaticScience).filter(
        AdlerStaticScience.category == "criteria",
        or_(
            AdlerStaticScience.subject.ilike(f"%{query}%"),
            AdlerStaticScience.source.ilike(f"%{query}%")
        )
    ).all()
    return [{
        "id": r.id,
        "subject": r.subject,
        "source": r.source,
        "content": r.content_json
    } for r in records]

def search_validated_medications(db: Session, query: str):
    records = db.query(AdlerMedicationRef).filter(
        or_(
            AdlerMedicationRef.generic_name.ilike(f"%{query}%"),
            AdlerMedicationRef.class_name.ilike(f"%{query}%")
        )
    ).all()

    results = []
    for r in records:
        # Fetch associated evidence
        evidence = db.query(AdlerClinicalEvidence).filter(
            AdlerClinicalEvidence.subject == r.generic_name.upper()
        ).all()

        results.append({
            "id": r.id,
            "generic_name": r.generic_name,
            "class": r.class_name,
            "mechanism": r.mechanism,
            "interactions": r.interactions_json,
            "evidence": [{
                "source": e.source,
                "level": e.evidence_level,
                "summary": e.summary
            } for e in evidence]
        })
    return results

def list_official_templates(db: Session, query: str = None):
    stmt = db.query(AdlerOfficialDocumentTemplate)
    if query:
        stmt = stmt.filter(
            or_(
                AdlerOfficialDocumentTemplate.title.ilike(f"%{query}%"),
                AdlerOfficialDocumentTemplate.document_type.ilike(f"%{query}%")
            )
        )
    records = stmt.all()
    return [{
        "id": r.id,
        "title": r.title,
        "type": r.document_type,
        "source": r.official_source,
        "structure": r.content_structure
    } for r in records]
