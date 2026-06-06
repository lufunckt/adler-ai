from sqlalchemy.orm import Session
from backend.models.adler_science_knowledge import AdlerOfficialDocumentTemplate
from backend.schemas.clinical_intelligence import DocumentDraftRequest
from backend.services.adler_store import get_patient
from backend.services.clinical_intelligence import create_document_draft

def fill_official_document(
    db: Session,
    tenant_id: str,
    template_id: str,
    patient_id: str,
    session_number: int = None,
    mode: str = "ai"
):
    template = db.query(AdlerOfficialDocumentTemplate).filter_by(id=template_id).first()
    if not template:
        return {"error": "Template not found"}

    patient = get_patient(patient_id, db=db, tenant_id=tenant_id)

    if mode == "manual":
        return {
            "template_id": template_id,
            "title": template.title,
            "patient_name": patient.get("name"),
            "content": "",
            "structure": template.content_structure,
            "mode": "manual"
        }

    # AI Mode: Bridge to existing draft service with template context
    # We can refine the prompt later to follow template.content_structure
    draft_payload = DocumentDraftRequest(
        patient_id=patient_id,
        session_number=session_number,
        document_type=template.document_type
    )

    draft = create_document_draft(db=db, tenant_id=tenant_id, payload=draft_payload)

    return {
        "template_id": template_id,
        "title": template.title,
        "patient_name": patient.get("name"),
        "content": draft.get("content"),
        "structure": template.content_structure,
        "mode": "ai"
    }
