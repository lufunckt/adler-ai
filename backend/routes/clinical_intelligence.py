"""Routes for Adler structured clinical intelligence."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.core.database import get_db
from backend.schemas.clinical_intelligence import (
    AbandonmentRiskDecisionResponse,
    ClinicalAnalysisCreateResponse,
    ClinicalAnalysisListResponse,
    ClinicalEvolutionResponse,
    ClinicalIntelligenceApproach,
    ClinicalMapResponse,
    ClinicalSessionInput,
    DocumentDraftRequest,
    DocumentDraftResponse,
    EvolutionDecisionResponse,
    EvolutionSnapshotHistoryResponse,
    PatientProgressReportResponse,
    PharmacogeneticsRequest,
    PharmacogeneticsRequestResponse,
    RiskScoreHistoryResponse,
    PharmacogeneticsUpdate,
    WhatsappCheckinCreate,
    WhatsappCheckinRead,
)
from backend.services.adler_auth import AdlerTenantContext, resolve_adler_tenant_context
from backend.services.clinical_intelligence import (
    build_clinical_map,
    build_evolution_snapshot,
    build_patient_progress_report,
    calculate_dropout_risk,
    create_document_draft,
    create_structured_analysis,
    create_whatsapp_checkin,
    update_pharmacogenetics_result,
    list_evolution_history,
    list_patient_analyses,
    list_risk_history,
    request_pharmacogenetics,
)

router = APIRouter(prefix="/api/adler/intelligence", tags=["adler-intelligence"])


def _require_premium(context: AdlerTenantContext) -> None:
    if context.subscription_tier != "premium":
        raise HTTPException(
            status_code=403,
            detail="Modulo disponivel apenas no Adler Premium.",
        )


@router.post("/sessions/analyze", response_model=ClinicalAnalysisCreateResponse, status_code=201)
def analyze_session(
    payload: ClinicalSessionInput,
    context: AdlerTenantContext = Depends(resolve_adler_tenant_context),
    db: Session = Depends(get_db),
) -> dict:
    """Create a validated structured analysis and update longitudinal signals."""

    _require_premium(context)
    analysis_record = create_structured_analysis(
        db=db,
        tenant_id=context.tenant_id,
        payload=payload,
    )

    # Recalculate longitudinal intelligence immediately after a new session enters the system.
    build_evolution_snapshot(db=db, tenant_id=context.tenant_id, patient_id=payload.patient_id)
    calculate_dropout_risk(db=db, tenant_id=context.tenant_id, patient_id=payload.patient_id)

    return {
        "persisted": True,
        "analysis_record": analysis_record,
    }


@router.get("/patients/{patient_id}/analyses", response_model=ClinicalAnalysisListResponse)
def patient_analyses(
    patient_id: str,
    approach: ClinicalIntelligenceApproach | None = None,
    context: AdlerTenantContext = Depends(resolve_adler_tenant_context),
    db: Session = Depends(get_db),
) -> dict:
    _require_premium(context)
    analyses = list_patient_analyses(
        db=db,
        tenant_id=context.tenant_id,
        patient_id=patient_id,
        approach=approach,
    )
    return {
        "patient_id": patient_id,
        "count": len(analyses),
        "analyses": analyses,
    }


@router.get("/patients/{patient_id}/clinical-map", response_model=ClinicalMapResponse)
def patient_clinical_map(
    patient_id: str,
    context: AdlerTenantContext = Depends(resolve_adler_tenant_context),
    db: Session = Depends(get_db),
) -> dict:
    _require_premium(context)
    nodes, edges, analysis_count = build_clinical_map(
        db=db,
        tenant_id=context.tenant_id,
        patient_id=patient_id,
    )
    return {
        "patient_id": patient_id,
        "nodes": nodes,
        "edges": edges,
        "source_analysis_count": analysis_count,
    }


@router.get("/patients/{patient_id}/evolution", response_model=ClinicalEvolutionResponse)
def patient_evolution(
    patient_id: str,
    context: AdlerTenantContext = Depends(resolve_adler_tenant_context),
    db: Session = Depends(get_db),
) -> dict:
    _require_premium(context)
    marker, sessions, snapshot_id = build_evolution_snapshot(
        db=db,
        tenant_id=context.tenant_id,
        patient_id=patient_id,
    )
    return {
        "patient_id": patient_id,
        "status": marker.status,
        "summary": marker,
        "sessions_compared": sessions,
        "snapshot_id": snapshot_id,
    }


@router.get("/patients/{patient_id}/evolution/decision", response_model=EvolutionDecisionResponse)
def patient_evolution_decision(
    patient_id: str,
    context: AdlerTenantContext = Depends(resolve_adler_tenant_context),
    db: Session = Depends(get_db),
) -> dict:
    """Return the compact decision payload requested by the product layer."""

    _require_premium(context)
    marker, sessions, snapshot_id = build_evolution_snapshot(
        db=db,
        tenant_id=context.tenant_id,
        patient_id=patient_id,
    )
    status_geral = "atencao" if marker.status == "atencao_necessaria" else marker.status
    return {
        "patient_id": patient_id,
        "status_geral": status_geral,
        "principais_mudancas": marker.principais_mudancas,
        "padroes_persistentes": marker.padroes_persistentes,
        "novos_riscos": marker.novos_riscos,
        "tendencias": [
            marker.resposta_ao_tratamento,
            "Comparacao baseada em analises estruturadas por sessao.",
        ],
        "sessions_compared": sessions,
        "snapshot_id": snapshot_id,
    }


@router.get("/patients/{patient_id}/abandonment-risk", response_model=AbandonmentRiskDecisionResponse)
def patient_abandonment_risk(
    patient_id: str,
    context: AdlerTenantContext = Depends(resolve_adler_tenant_context),
    db: Session = Depends(get_db),
) -> dict:
    _require_premium(context)
    risk = calculate_dropout_risk(db=db, tenant_id=context.tenant_id, patient_id=patient_id)
    return {
        "patient_id": patient_id,
        "risco_abandono": risk.classification,
        "score": risk.score,
        "fatores_identificados": risk.factors,
        "sugestoes_acao": [risk.recommendation],
        "risk_score_id": risk.risk_score_id,
    }


@router.get("/patients/{patient_id}/evolution-history", response_model=EvolutionSnapshotHistoryResponse)
def patient_evolution_history(
    patient_id: str,
    limit: int = 20,
    context: AdlerTenantContext = Depends(resolve_adler_tenant_context),
    db: Session = Depends(get_db),
) -> dict:
    _require_premium(context)
    snapshots = list_evolution_history(
        db=db,
        tenant_id=context.tenant_id,
        patient_id=patient_id,
        limit=limit,
    )
    return {
        "patient_id": patient_id,
        "count": len(snapshots),
        "snapshots": snapshots,
    }


@router.get("/patients/{patient_id}/risk-history", response_model=RiskScoreHistoryResponse)
def patient_risk_history(
    patient_id: str,
    limit: int = 30,
    context: AdlerTenantContext = Depends(resolve_adler_tenant_context),
    db: Session = Depends(get_db),
) -> dict:
    _require_premium(context)
    scores = list_risk_history(
        db=db,
        tenant_id=context.tenant_id,
        patient_id=patient_id,
        limit=limit,
    )
    return {
        "patient_id": patient_id,
        "count": len(scores),
        "scores": scores,
    }


@router.post("/documents/draft", response_model=DocumentDraftResponse, status_code=201)
def document_draft(
    payload: DocumentDraftRequest,
    context: AdlerTenantContext = Depends(resolve_adler_tenant_context),
    db: Session = Depends(get_db),
) -> dict:
    _require_premium(context)
    return create_document_draft(db=db, tenant_id=context.tenant_id, payload=payload)


@router.get("/patients/{patient_id}/patient-report", response_model=PatientProgressReportResponse)
def patient_progress_report(
    patient_id: str,
    context: AdlerTenantContext = Depends(resolve_adler_tenant_context),
    db: Session = Depends(get_db),
) -> PatientProgressReportResponse:
    _require_premium(context)
    return build_patient_progress_report(db=db, tenant_id=context.tenant_id, patient_id=patient_id)


@router.post("/pharmacogenetics/request", response_model=PharmacogeneticsRequestResponse, status_code=201)
def pharmacogenetics_request(
    payload: PharmacogeneticsRequest,
    context: AdlerTenantContext = Depends(resolve_adler_tenant_context),
    db: Session = Depends(get_db),
) -> PharmacogeneticsRequestResponse:
    _require_premium(context)
    return request_pharmacogenetics(db=db, tenant_id=context.tenant_id, payload=payload)
@router.put("/pharmacogenetics/{request_id}", response_model=PharmacogeneticsRequestResponse)
def update_pharmacogenetics(
    request_id: str,
    payload: PharmacogeneticsUpdate,
    context: AdlerTenantContext = Depends(resolve_adler_tenant_context),
    db: Session = Depends(get_db),
) -> dict:
    _require_premium(context)
    return update_pharmacogenetics_result(db=db, tenant_id=context.tenant_id, request_id=request_id, payload=payload)



@router.post("/whatsapp/checkins", response_model=WhatsappCheckinRead, status_code=201)
def whatsapp_checkin(
    payload: WhatsappCheckinCreate,
    context: AdlerTenantContext = Depends(resolve_adler_tenant_context),
    db: Session = Depends(get_db),
) -> WhatsappCheckinRead:
    _require_premium(context)
    return create_whatsapp_checkin(db=db, tenant_id=context.tenant_id, payload=payload)

# Document Filling V2
from backend.services.clinical_intelligence_v2 import fill_official_document
from backend.schemas.science_v2 import DocumentFillRequest, DocumentFillResponse

@router.post("/documents/fill", response_model=DocumentFillResponse)
def document_fill(
    payload: DocumentFillRequest,
    context: AdlerTenantContext = Depends(resolve_adler_tenant_context),
    db: Session = Depends(get_db)
):
    _require_premium(context)
    result = fill_official_document(
        db=db,
        tenant_id=context.tenant_id,
        template_id=payload.template_id,
        patient_id=payload.patient_id,
        session_number=payload.session_number,
        mode=payload.mode
    )
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    return result
