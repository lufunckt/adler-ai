"""Routes for the Adler clinical demo backend."""

from __future__ import annotations

from typing import Literal

from fastapi import APIRouter, Depends, File, Form, HTTPException, Response, UploadFile
from fastapi.responses import FileResponse, StreamingResponse
from sqlalchemy.orm import Session

from backend.core.config import settings
from backend.core.database import get_db
from backend.schemas.adler import (
    BootstrapRead,
    ClinicalApproach,
    DashboardRead,
    DocumentMetaRead,
    NotesRead,
    NotesUpdate,
    PatientRead,
    PatientRegistryItemRead,
    ScientificBaseRead,
    WorkspaceSnapshotRead,
)
from backend.services.adler_science import (
    get_document_model_path,
    list_document_models,
    load_scientific_base,
)
from backend.services.medication_search import search_medication
from backend.services.adler_store import (
    bootstrap_payload,
    build_patients_csv,
    build_workspace_snapshot,
    delete_document,
    get_dashboard,
    get_document_blob,
    get_patient,
    get_clinician_profile,
    list_documents,
    list_patients,
    load_notes,
    save_document,
    save_notes,
)
from backend.services.adler_auth import AdlerTenantContext, resolve_adler_tenant_context

router = APIRouter(prefix="/api/adler", tags=["adler"])


@router.get("/health")
def health_check() -> dict[str, str]:
    return {
        "status": "ok",
        "service": "adler",
        "storage_mode": settings.adler_storage_mode,
        "ai_provider": settings.adler_ai_provider,
        "file_provider": settings.adler_file_provider,
        "supabase_configured": "yes" if settings.supabase_url else "no",
    }


@router.get("/bootstrap", response_model=BootstrapRead)
def bootstrap(
    context: AdlerTenantContext = Depends(resolve_adler_tenant_context),
    db: Session = Depends(get_db),
) -> dict:
    return bootstrap_payload(db, context)


@router.get("/dashboard", response_model=DashboardRead)
def dashboard(
    context: AdlerTenantContext = Depends(resolve_adler_tenant_context),
    db: Session = Depends(get_db),
) -> dict:
    return get_dashboard(db, context)


@router.get("/clinician")
def clinician(context: AdlerTenantContext = Depends(resolve_adler_tenant_context)) -> dict:
    return {
        "tenant_id": context.tenant_id,
        "user_id": context.user_id,
        "auth_mode": context.auth_mode,
        **get_clinician_profile(context),
    }


@router.get("/patients", response_model=list[PatientRegistryItemRead])
def patients(
    search: str | None = None,
    status: Literal["active", "inactive", "all"] = "all",
    context: AdlerTenantContext = Depends(resolve_adler_tenant_context),
    db: Session = Depends(get_db),
) -> list[dict]:
    return list_patients(search=search, status=status, db=db, tenant_id=context.tenant_id)


@router.get("/patients/{patient_id}", response_model=PatientRead)
def patient_detail(
    patient_id: str,
    context: AdlerTenantContext = Depends(resolve_adler_tenant_context),
    db: Session = Depends(get_db),
) -> dict:
    return get_patient(patient_id, db=db, tenant_id=context.tenant_id)


@router.get("/workspace/{patient_id}", response_model=WorkspaceSnapshotRead)
def workspace_snapshot(
    patient_id: str,
    approach: ClinicalApproach = "schema",
    session: int | None = None,
    context: AdlerTenantContext = Depends(resolve_adler_tenant_context),
    db: Session = Depends(get_db),
) -> dict:
    clinician_profile = get_clinician_profile(context)
    if approach not in clinician_profile["allowed_approaches"]:
        raise HTTPException(
            status_code=403,
            detail="Esta abordagem nao esta disponivel no plano atual do clinico.",
        )

    return build_workspace_snapshot(
        patient_id,
        approach,
        session=session,
        db=db,
        tenant_id=context.tenant_id,
    )


@router.get("/notes", response_model=NotesRead)
def notes(
    context: AdlerTenantContext = Depends(resolve_adler_tenant_context),
    db: Session = Depends(get_db),
) -> dict:
    return load_notes(db, context.tenant_id)


@router.put("/notes", response_model=NotesRead)
def update_notes(
    payload: NotesUpdate,
    context: AdlerTenantContext = Depends(resolve_adler_tenant_context),
    db: Session = Depends(get_db),
) -> dict:
    return save_notes(db, context.tenant_id, payload.value)


@router.get("/documents", response_model=list[DocumentMetaRead])
def documents(
    patient_id: str | None = None,
    context: AdlerTenantContext = Depends(resolve_adler_tenant_context),
    db: Session = Depends(get_db),
) -> list[dict]:
    return list_documents(db, context.tenant_id, patient_id=patient_id)


@router.post("/documents/upload", response_model=DocumentMetaRead, status_code=201)
def upload_document(
    file: UploadFile = File(...),
    patient_id: str | None = Form(default=None),
    context: AdlerTenantContext = Depends(resolve_adler_tenant_context),
    db: Session = Depends(get_db),
) -> dict:
    return save_document(db, context.tenant_id, file, patient_id=patient_id)


@router.get("/documents/{document_id}/download")
def download_document(
    document_id: str,
    context: AdlerTenantContext = Depends(resolve_adler_tenant_context),
    db: Session = Depends(get_db),
) -> Response:
    meta, raw = get_document_blob(db, context.tenant_id, document_id)
    return Response(
        content=raw,
        media_type=meta["mime_type"],
        headers={"Content-Disposition": f'attachment; filename="{meta["name"]}"'},
    )


@router.delete("/documents/{document_id}")
def remove_document(
    document_id: str,
    context: AdlerTenantContext = Depends(resolve_adler_tenant_context),
    db: Session = Depends(get_db),
) -> dict[str, str]:
    delete_document(db, context.tenant_id, document_id)
    return {"status": "deleted"}


@router.get("/export/patients.csv")
def export_patients_csv(
    context: AdlerTenantContext = Depends(resolve_adler_tenant_context),
    db: Session = Depends(get_db),
) -> StreamingResponse:
    csv_payload = build_patients_csv(db=db, tenant_id=context.tenant_id)
    return StreamingResponse(
        iter([csv_payload]),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": 'attachment; filename="adler-pacientes.csv"'},
    )


@router.get("/medications/search")
def medication_search(
    q: str,
    context: AdlerTenantContext = Depends(resolve_adler_tenant_context),
) -> dict:
    if len(q.strip()) < 2:
        raise HTTPException(
            status_code=422,
            detail="Informe ao menos 2 caracteres para buscar um medicamento.",
        )

    return {
        "auth_mode": context.auth_mode,
        "tenant_id": context.tenant_id,
        **search_medication(q),
    }


@router.get("/science/base", response_model=ScientificBaseRead)
def scientific_base(
    q: str | None = None,
    categoria: str | None = None,
    medicamento: str | None = None,
    gene: str | None = None,
    escala: str | None = None,
    diagnostico: str | None = None,
    abordagem: str | None = None,
    gravidade: str | None = None,
    context: AdlerTenantContext = Depends(resolve_adler_tenant_context),
) -> dict:
    payload = load_scientific_base(
        query=q,
        categoria=categoria,
        medicamento=medicamento,
        gene=gene,
        escala=escala,
        diagnostico=diagnostico,
        abordagem=abordagem,
        gravidade=gravidade,
    )
    return {
        "auth_mode": context.auth_mode,
        "tenant_id": context.tenant_id,
        **payload,
    }


@router.get("/science/document-models")
def document_models(
    q: str | None = None,
    tipo_documento: str | None = None,
    profissional: str | None = None,
    contexto: str | None = None,
    context: AdlerTenantContext = Depends(resolve_adler_tenant_context),
) -> dict:
    models = list_document_models(
        query=q,
        tipo_documento=tipo_documento,
        profissional=profissional,
        contexto=contexto,
    )
    return {
        "auth_mode": context.auth_mode,
        "tenant_id": context.tenant_id,
        "count": len(models),
        "models": models,
    }


@router.get("/science/document-models/{model_id}/download")
def download_document_model(model_id: str) -> FileResponse:
    result = get_document_model_path(model_id)
    if not result:
        raise HTTPException(status_code=404, detail="Modelo de documento nao encontrado.")

    model, path = result
    return FileResponse(
        path,
        media_type="application/pdf",
        filename=model.get("arquivo") or f"{model_id}.pdf",
    )
