from sqlalchemy.orm import Session
from backend.models.adler_science_knowledge import AdlerTherapeuticProtocol, AdlerClinicalEvidence
from backend.services.clinical_intelligence import create_structured_analysis as original_create_analysis

def create_structured_analysis_with_approach(
    db: Session,
    tenant_id: str,
    payload,
    context
):
    # Fetch Approach Characteristics
    approach = context.primary_approach
    protocol = db.query(AdlerTherapeuticProtocol).filter_by(approach=approach).first()

    # Fetch Evidence for the subject (if applicable)
    evidence = db.query(AdlerClinicalEvidence).all() # Simple retrieval for grounding

    # In a real implementation, we would filter evidence by subject extracted from payload.symptoms

    # Inject context into the original service or handle prompt here
    # For now, we will return the original but this serves as the hook for grounding
    return original_create_analysis(db=db, tenant_id=tenant_id, payload=payload)
