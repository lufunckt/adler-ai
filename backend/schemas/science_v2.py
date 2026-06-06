from pydantic import BaseModel
from typing import List, Dict, Optional, Any

class DSMCriteriaRead(BaseModel):
    id: str
    subject: str
    source: str
    content: Dict[str, Any]

class MedicationValidatedRead(BaseModel):
    id: str
    generic_name: str
    class_name: str
    mechanism: str
    interactions: Optional[Dict[str, Any]]
    evidence: List[Dict[str, Any]]

class OfficialTemplateRead(BaseModel):
    id: str
    title: str
    type: str
    source: str
    structure: Dict[str, Any]

class DocumentFillRequest(BaseModel):
    template_id: str
    patient_id: str
    session_number: Optional[int] = None
    mode: str = "ai"

class DocumentFillResponse(BaseModel):
    template_id: str
    title: str
    patient_name: str
    content: str
    structure: Dict[str, Any]
    mode: str
