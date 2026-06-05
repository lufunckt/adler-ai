"""Structured clinical intelligence engine for Adler.

This module intentionally does not behave like a free-form chatbot. It turns
session inputs into validated, versioned JSON that can be reused by maps,
timelines, documents, risk scoring and future AI providers.
"""

from __future__ import annotations

from collections import Counter
from datetime import datetime, timezone
import json
from uuid import uuid4

from fastapi import HTTPException
from pydantic import BaseModel, Field, ValidationError
from sqlalchemy import desc, func
from sqlalchemy.orm import Session

from backend.models.adler_clinical import (
    AdlerSessionNoteDraft,
    AdlerAppointmentConfirmation,
    AdlerClinicalAnalysis,
    AdlerClinicalSession,
    AdlerEngagementFlag,
    AdlerEvolutionSnapshot,
    AdlerGeneratedDocument,
    AdlerPharmacogeneticsResult,
    AdlerRiskScore,
    AdlerWhatsappCheckin,
)
from backend.schemas.clinical_intelligence import (
    ClinicalAlert,
    ClinicalAnalysisJSON,
    ClinicalAnalysisRead,
    ClinicalEdgeType,
    ClinicalEvolutionMarker,
    ClinicalHypothesis,
    ClinicalIntelligenceApproach,
    ClinicalMapEdge,
    ClinicalMapNode,
    ClinicalMechanism,
    ClinicalPattern,
    ClinicalRelation,
    ClinicalSessionInput,
    DocumentDraftRequest,
    DropoutRiskResponse,
    EvolutionStatus,
    EvolutionSnapshotHistoryItem,
    PatientProgressReportResponse,
    PharmacogeneticsRequest,
    PharmacogeneticsRequestResponse,
    RiskScoreHistoryItem,
    WhatsappCheckinCreate,
    WhatsappCheckinRead,
)
from backend.services.adler_ai_router import try_generate_structured
from backend.services.adler_store import get_patient


RULES_ENGINE_NAME = "adler_rules_v1"


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


def _slug(value: str) -> str:
    return (
        value.strip()
        .lower()
        .replace(" ", "_")
        .replace("/", "_")
        .replace("-", "_")
        .replace(".", "")
    )[:80] or "item"


def _first(values: list[str], fallback: str) -> str:
    return values[0] if values else fallback


def _contains_any(values: list[str], needles: tuple[str, ...]) -> bool:
    blob = " ".join(values).lower()
    return any(needle in blob for needle in needles)


def _node(node_id: str, label: str, node_type: str, weight: int, source_session: int) -> dict:
    return {
        "id": node_id,
        "label": label,
        "type": node_type,
        "weight": weight,
        "source_session": source_session,
    }


def _edge(
    edge_id: str,
    source: str,
    target: str,
    edge_type: ClinicalEdgeType,
    strength: int,
    rationale: str,
) -> dict:
    return {
        "id": edge_id,
        "source": source,
        "target": target,
        "type": edge_type,
        "strength": strength,
        "rationale": rationale,
    }


class AIClinicalAnalysisPayload(BaseModel):
    padroes: list[ClinicalPattern] = Field(default_factory=list)
    distorcoes_ou_mecanismos: list[ClinicalMechanism] = Field(default_factory=list)
    relacoes: list[ClinicalRelation] = Field(default_factory=list)
    hipoteses: list[ClinicalHypothesis] = Field(default_factory=list)
    alertas: list[ClinicalAlert] = Field(default_factory=list)
    mapa_nodes: list[ClinicalMapNode] = Field(default_factory=list)
    mapa_edges: list[ClinicalMapEdge] = Field(default_factory=list)
    evolucao: ClinicalEvolutionMarker


class AIEvolutionSummaryPayload(BaseModel):
    principais_mudancas: list[str] = Field(default_factory=list)
    padroes_persistentes: list[str] = Field(default_factory=list)
    padroes_em_reducao: list[str] = Field(default_factory=list)
    novos_riscos: list[str] = Field(default_factory=list)
    resposta_ao_tratamento: str


class AIDraftSection(BaseModel):
    titulo: str
    conteudo: str


class AIDocumentDraftPayload(BaseModel):
    sections: list[AIDraftSection] = Field(default_factory=list)


class AIProgressReportPayload(BaseModel):
    sections: list[AIDraftSection] = Field(default_factory=list)


def _approach_mechanisms(payload: ClinicalSessionInput) -> list[dict]:
    symptom = _first(payload.sintomas, "sintoma central")
    behavior = _first(payload.comportamentos, "resposta de enfrentamento")

    if payload.abordagem_clinica == "cbt":
        return [
            {
                "id": "cbt_catastrofizacao",
                "nome": "Catastrofizacao / superestimacao de ameaca",
                "tipo": "distorcao_cognitiva",
                "descricao": f"O sintoma '{symptom}' parece amplificado por previsao de desfecho grave.",
                "alvo_terapeutico": "reestruturacao cognitiva, exposicao e prevencao de resposta",
                "confidence": 78,
            },
            {
                "id": "cbt_neutralizacao",
                "nome": "Neutralizacao compulsiva",
                "tipo": "comportamento_mantenedor",
                "descricao": f"'{behavior}' reduz ansiedade no curto prazo e mantem o ciclo no longo prazo.",
                "alvo_terapeutico": "reduzir segurancas e treinar tolerancia a incerteza",
                "confidence": 82,
            },
        ]

    if payload.abordagem_clinica == "psychoanalysis":
        return [
            {
                "id": "psy_anulacao",
                "nome": "Anulacao magica",
                "tipo": "mecanismo_de_defesa",
                "descricao": f"A resposta '{behavior}' funciona como tentativa simbolica de desfazer angustia.",
                "alvo_terapeutico": "simbolizacao do conflito e elaboracao da angustia",
                "confidence": 74,
            },
            {
                "id": "psy_isolamento_afeto",
                "nome": "Isolamento do afeto",
                "tipo": "mecanismo_de_defesa",
                "descricao": "Conteudos ameacadores aparecem dissociados da experiencia afetiva imediata.",
                "alvo_terapeutico": "ampliar ligacao entre narrativa, afeto e transferencia",
                "confidence": 69,
            },
        ]

    return [
        {
            "id": "psych_pharmacodynamics",
            "nome": "Resposta farmacodinamica parcial",
            "tipo": "farmacodinamica",
            "descricao": "Sintomas persistem apesar de sinal de resposta, sugerindo monitoramento dimensional.",
            "alvo_terapeutico": "acompanhar eficacia, eventos adversos e adesao ao protocolo",
            "confidence": 76,
        },
        {
            "id": "psych_pharmacokinetics",
            "nome": "Janela farmacocinetica a monitorar",
            "tipo": "farmacocinetica",
            "descricao": "Horario, adesao, interacoes e metabolismo podem alterar exposicao medicamentosa.",
            "alvo_terapeutico": "revisar dose, horario, exames e interacoes quando aplicavel",
            "confidence": 72,
        },
    ]


def _analysis_payload_from_baseline(analysis: ClinicalAnalysisJSON) -> dict[str, object]:
    return {
        "padroes": [item.model_dump(mode="json") for item in analysis.padroes],
        "distorcoes_ou_mecanismos": [item.model_dump(mode="json") for item in analysis.distorcoes_ou_mecanismos],
        "relacoes": [item.model_dump(mode="json") for item in analysis.relacoes],
        "hipoteses": [item.model_dump(mode="json") for item in analysis.hipoteses],
        "alertas": [item.model_dump(mode="json") for item in analysis.alertas],
        "mapa_nodes": [item.model_dump(mode="json") for item in analysis.mapa.get("nodes", [])],
        "mapa_edges": [item.model_dump(mode="json") for item in analysis.mapa.get("edges", [])],
        "evolucao": analysis.evolucao.model_dump(mode="json"),
    }


def _analysis_from_ai_payload(
    payload: AIClinicalAnalysisPayload,
    *,
    tenant_id: str,
    patient_id: str,
    session_number: int,
    approach: ClinicalIntelligenceApproach,
    engine_name: str,
) -> ClinicalAnalysisJSON:
    return ClinicalAnalysisJSON(
        padroes=payload.padroes,
        distorcoes_ou_mecanismos=payload.distorcoes_ou_mecanismos,
        relacoes=payload.relacoes,
        hipoteses=payload.hipoteses,
        alertas=payload.alertas,
        mapa={
            "nodes": payload.mapa_nodes,
            "edges": payload.mapa_edges,
        },
        evolucao=payload.evolucao,
        metadados={
            "tenant_id": tenant_id,
            "patient_id": patient_id,
            "session_number": session_number,
            "approach": approach,
            "engine": engine_name,
            "structured_only": True,
        },
    )


def _analysis_route_prompt(payload: ClinicalSessionInput, baseline: ClinicalAnalysisJSON) -> tuple[str, str]:
    system_prompt = (
        "You are Adler AI's clinical structuring layer. "
        "Return grounded JSON only. "
        "Use only the provided session information and the baseline analysis. "
        "Do not invent diagnoses, medications, timelines, suicidal content, or causal claims that are not supported by the input. "
        "Keep the tone concise, clinically useful, and in Brazilian Portuguese. "
        "Preserve enum values exactly as requested by the schema."
    )
    user_prompt = (
        "Task: refine a structured psychotherapy/psychiatry session analysis.\n\n"
        "Rules:\n"
        "- Keep the output faithful to the patient input.\n"
        "- Improve clarity, prioritization, and organization.\n"
        "- Keep IDs short and stable in snake_case.\n"
        "- The evolution status must reflect the session content.\n"
        "- Include only clinically plausible relations and alerts.\n\n"
        f"Session input JSON:\n{json.dumps(payload.model_dump(mode='json'), ensure_ascii=True)}\n\n"
        f"Baseline structured analysis JSON:\n{json.dumps(_analysis_payload_from_baseline(baseline), ensure_ascii=True)}"
    )
    return system_prompt, user_prompt


def _build_structured_analysis_rules(payload: ClinicalSessionInput, tenant_id: str) -> ClinicalAnalysisJSON:
    symptom = _first(payload.sintomas, "sintoma principal")
    emotion = _first(payload.emocoes, "emocao dominante")
    event = _first(payload.eventos, "evento clinico relevante")
    behavior = _first(payload.comportamentos, "comportamento observado")
    medication = _first(payload.medicacao, "sem medicacao registrada")
    session = payload.session_number

    event_id = f"evento_{_slug(event)}"
    emotion_id = f"emocao_{_slug(emotion)}"
    behavior_id = f"comportamento_{_slug(behavior)}"
    pattern_id = f"padrao_{_slug(symptom)}"
    hypothesis_id = f"hipotese_{payload.abordagem_clinica}_{session}"

    padroes = [
        ClinicalPattern(
            id=pattern_id,
            nome=f"Padrao recorrente associado a {symptom}",
            categoria="sintoma_comportamento",
            descricao=f"Na sessao {session}, '{symptom}' aparece conectado a '{emotion}' e '{behavior}'.",
            evidencia=[*payload.sintomas[:3], *payload.comportamentos[:2]],
            recorrencia=min(92, 45 + session * 2),
        )
    ]

    mechanisms = [
        ClinicalMechanism.model_validate(item)
        for item in _approach_mechanisms(payload)
    ]

    relacoes = [
        ClinicalRelation(
            id=f"rel_{event_id}_{emotion_id}",
            origem=event,
            destino=emotion,
            tipo="gatilho",
            intensidade=4,
            racional="Evento descrito antecede aumento emocional na narrativa da sessao.",
        ),
        ClinicalRelation(
            id=f"rel_{emotion_id}_{behavior_id}",
            origem=emotion,
            destino=behavior,
            tipo="reforco",
            intensidade=4,
            racional="A emocao aumenta a probabilidade da resposta comportamental de alivio imediato.",
        ),
        ClinicalRelation(
            id=f"rel_{behavior_id}_{pattern_id}",
            origem=behavior,
            destino=symptom,
            tipo="recorrencia",
            intensidade=3,
            racional="A resposta reduz desconforto no curto prazo e contribui para manutencao do padrao.",
        ),
    ]

    hypotheses = [
        ClinicalHypothesis(
            id=hypothesis_id,
            descricao=(
                "Hipotese estruturada: o caso se mantem por ciclo entre gatilho, emocao, "
                "comportamento regulatorio e consequencia de curto prazo."
            ),
            status="ativa",
            suporte=[symptom, emotion, behavior],
            proxima_acao=_next_clinical_action(payload.abordagem_clinica, medication),
            confidence=74,
        )
    ]

    alerts = _build_alerts(payload)

    nodes = [
        _node(event_id, event, "evento", 68, session),
        _node(emotion_id, emotion, "emocao", 72, session),
        _node(behavior_id, behavior, "comportamento", 76, session),
        _node(pattern_id, symptom, "padrao", 82, session),
        _node(hypothesis_id, "Hipotese clinica ativa", "hipotese", 64, session),
    ]
    edges = [
        _edge("edge_event_emotion", event_id, emotion_id, "gatilho", 4, "Evento antecede resposta emocional."),
        _edge("edge_emotion_behavior", emotion_id, behavior_id, "reforco", 4, "Emocao aumenta resposta regulatoria."),
        _edge("edge_behavior_pattern", behavior_id, pattern_id, "recorrencia", 3, "Resposta mantem padrao longitudinal."),
        _edge("edge_pattern_hypothesis", pattern_id, hypothesis_id, "consequencia", 3, "Padrao sustenta hipotese ativa."),
    ]

    analysis = ClinicalAnalysisJSON(
        padroes=padroes,
        distorcoes_ou_mecanismos=mechanisms,
        relacoes=relacoes,
        hipoteses=hypotheses,
        alertas=alerts,
        mapa={
            "nodes": [ClinicalMapNode.model_validate(node) for node in nodes],
            "edges": [ClinicalMapEdge.model_validate(edge) for edge in edges],
        },
        evolucao=_build_evolution_marker(payload, alerts),
        metadados={
            "tenant_id": tenant_id,
            "patient_id": payload.patient_id,
            "session_number": session,
            "approach": payload.abordagem_clinica,
            "engine": RULES_ENGINE_NAME,
            "structured_only": True,
        },
    )
    return analysis


def _build_structured_analysis(payload: ClinicalSessionInput, tenant_id: str) -> tuple[ClinicalAnalysisJSON, str]:
    baseline = _build_structured_analysis_rules(payload, tenant_id)
    system_prompt, user_prompt = _analysis_route_prompt(payload, baseline)
    ai_payload, selection, _error = try_generate_structured(
        task="session_analysis",
        schema_model=AIClinicalAnalysisPayload,
        system_prompt=system_prompt,
        user_prompt=user_prompt,
        temperature=0.1,
        max_output_tokens=2200,
    )
    if ai_payload is None:
        return baseline, RULES_ENGINE_NAME

    analysis = _analysis_from_ai_payload(
        ai_payload,
        tenant_id=tenant_id,
        patient_id=payload.patient_id,
        session_number=payload.session_number,
        approach=payload.abordagem_clinica,
        engine_name=selection.engine_name,
    )
    return analysis, selection.engine_name


def _next_clinical_action(approach: ClinicalIntelligenceApproach, medication: str) -> str:
    if approach == "cbt":
        return "Planejar experimento comportamental com escala antes/depois e prevencao de resposta."
    if approach == "psychoanalysis":
        return "Explorar funcao defensiva do sintoma e sua repeticao na relacao terapeutica."
    return f"Revisar resposta, adesao, eventos adversos e necessidade de exames ligados a {medication}."


def _build_alerts(payload: ClinicalSessionInput) -> list[ClinicalAlert]:
    alerts: list[ClinicalAlert] = []
    clinical_blob = [
        *payload.sintomas,
        *payload.emocoes,
        *payload.eventos,
        *payload.comportamentos,
        *payload.medicacao,
        payload.observacoes or "",
    ]

    if _contains_any(clinical_blob, ("suicid", "morte", "autoextermin", "autoles")):
        alerts.append(
            ClinicalAlert(
                id="alert_safety",
                severidade="critica",
                titulo="Sinal de seguranca clinica",
                descricao="Termos de risco autolesivo ou morte foram detectados na sessao.",
                acao_sugerida="Aplicar protocolo de risco, plano de seguranca e avaliacao imediata.",
            )
        )

    if _contains_any(payload.medicacao, ("litio", "lítio", "valpro", "carbamazepina", "quetiapina")):
        alerts.append(
            ClinicalAlert(
                id="alert_labs",
                severidade="alta",
                titulo="Monitoramento laboratorial indicado",
                descricao="Medicacao registrada exige acompanhamento de exames conforme protocolo.",
                acao_sugerida="Verificar exames baseline, periodicidade e sinais de toxicidade.",
            )
        )

    if _contains_any(clinical_blob, ("abandono", "desmarcou", "faltou", "sem retorno", "baixa adesao")):
        alerts.append(
            ClinicalAlert(
                id="alert_retention",
                severidade="moderada",
                titulo="Risco de desengajamento",
                descricao="A sessao contem sinais de baixa adesao ou afastamento do tratamento.",
                acao_sugerida="Programar follow-up breve e remover barreiras praticas de continuidade.",
            )
        )

    return alerts


def _build_evolution_marker(payload: ClinicalSessionInput, alerts: list[ClinicalAlert]) -> ClinicalEvolutionMarker:
    clinical_blob = [*payload.sintomas, *payload.emocoes, *payload.comportamentos, payload.observacoes or ""]
    has_improvement = _contains_any(clinical_blob, ("melhor", "redu", "menos", "remissao", "estabil"))
    has_worsening = _contains_any(clinical_blob, ("pior", "aumento", "crise", "recaida", "insônia intensa"))
    has_critical_alert = any(alert.severidade in {"alta", "critica"} for alert in alerts)

    if has_critical_alert:
        status: EvolutionStatus = "atencao_necessaria"
    elif has_worsening and not has_improvement:
        status = "piorando"
    elif has_improvement:
        status = "melhorando"
    else:
        status = "estavel"

    return ClinicalEvolutionMarker(
        status=status,
        principais_mudancas=[
            "Analise estruturada gerada a partir dos campos clinicos da sessao.",
            "Dados ficam disponiveis para mapa, timeline, documentos e alertas.",
        ],
        padroes_persistentes=payload.sintomas[:3] or ["padrao clinico a monitorar"],
        padroes_em_reducao=["sinais de melhora registrados"] if has_improvement else [],
        novos_riscos=[alert.titulo for alert in alerts],
        resposta_ao_tratamento=(
            "Ha indicios de resposta positiva ao plano atual."
            if status == "melhorando"
            else "Manter monitoramento longitudinal antes de inferir resposta sustentada."
        ),
    )


def _to_analysis_read(record: AdlerClinicalAnalysis) -> ClinicalAnalysisRead:
    return ClinicalAnalysisRead(
        id=record.id,
        patient_id=record.patient_id,
        session_id=record.session_id,
        session_number=record.session_number,
        approach=record.approach,
        version=record.version,
        status=record.status,
        engine=record.engine,
        analysis=ClinicalAnalysisJSON.model_validate(record.analysis_json),
        created_at=record.created_at,
    )


def create_structured_analysis(
    *,
    db: Session,
    tenant_id: str,
    payload: ClinicalSessionInput,
) -> ClinicalAnalysisRead:
    occurred_at = payload.occurred_at or _utc_now()
    session = AdlerClinicalSession(
        tenant_id=tenant_id,
        patient_id=payload.patient_id,
        session_number=payload.session_number,
        approach=payload.abordagem_clinica,
        occurred_at=occurred_at,
        symptoms_json=payload.sintomas,
        emotions_json=payload.emocoes,
        events_json=payload.eventos,
        behaviors_json=payload.comportamentos,
        medication_json=payload.medicacao,
        time_context=payload.tempo,
        source="structured_clinical_input",
    )
    db.add(session)
    db.flush()

    try:
        analysis, engine_name = _build_structured_analysis(payload, tenant_id)
    except ValidationError as exc:
        db.rollback()
        raise HTTPException(status_code=422, detail=exc.errors()) from exc

    latest_version = (
        db.query(func.max(AdlerClinicalAnalysis.version))
        .filter(AdlerClinicalAnalysis.tenant_id == tenant_id)
        .filter(AdlerClinicalAnalysis.patient_id == payload.patient_id)
        .filter(AdlerClinicalAnalysis.session_number == payload.session_number)
        .filter(AdlerClinicalAnalysis.approach == payload.abordagem_clinica)
        .scalar()
        or 0
    )

    record = AdlerClinicalAnalysis(
        tenant_id=tenant_id,
        patient_id=payload.patient_id,
        session_id=session.id,
        session_number=payload.session_number,
        approach=payload.abordagem_clinica,
        version=int(latest_version) + 1,
        status="validated",
        engine=engine_name,
        analysis_json=analysis.model_dump(mode="json"),
        validation_errors=[],
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return _to_analysis_read(record)


def list_patient_analyses(
    *,
    db: Session,
    tenant_id: str,
    patient_id: str,
    approach: ClinicalIntelligenceApproach | None = None,
) -> list[ClinicalAnalysisRead]:
    query = (
        db.query(AdlerClinicalAnalysis)
        .filter(AdlerClinicalAnalysis.tenant_id == tenant_id)
        .filter(AdlerClinicalAnalysis.patient_id == patient_id)
    )
    if approach:
        query = query.filter(AdlerClinicalAnalysis.approach == approach)

    records = query.order_by(AdlerClinicalAnalysis.session_number.asc(), AdlerClinicalAnalysis.version.asc()).all()
    return [_to_analysis_read(record) for record in records]


def build_clinical_map(
    *,
    db: Session,
    tenant_id: str,
    patient_id: str,
) -> tuple[list[ClinicalMapNode], list[ClinicalMapEdge], int]:
    analyses = list_patient_analyses(db=db, tenant_id=tenant_id, patient_id=patient_id)
    node_by_id: dict[str, ClinicalMapNode] = {}
    edge_by_id: dict[str, ClinicalMapEdge] = {}

    for analysis_record in analyses:
        analysis = analysis_record.analysis
        for raw_node in analysis.mapa.get("nodes", []):
            node = ClinicalMapNode.model_validate(raw_node)
            existing = node_by_id.get(node.id)
            if not existing or node.weight > existing.weight:
                node_by_id[node.id] = node

        for raw_edge in analysis.mapa.get("edges", []):
            edge = ClinicalMapEdge.model_validate(raw_edge)
            existing = edge_by_id.get(edge.id)
            if not existing or edge.strength > existing.strength:
                edge_by_id[edge.id] = edge

    return list(node_by_id.values()), list(edge_by_id.values()), len(analyses)


def _analysis_summary_for_prompt(item: ClinicalAnalysisRead) -> dict[str, object]:
    return {
        "session_number": item.session_number,
        "approach": item.approach,
        "engine": item.engine,
        "padroes": [pattern.nome for pattern in item.analysis.padroes[:4]],
        "hipoteses": [hypothesis.descricao for hypothesis in item.analysis.hipoteses[:3]],
        "alertas": [alert.titulo for alert in item.analysis.alertas[:4]],
        "status_evolucao": item.analysis.evolucao.status,
        "resposta_ao_tratamento": item.analysis.evolucao.resposta_ao_tratamento,
    }


def _build_evolution_marker_rules(
    analyses: list[ClinicalAnalysisRead],
) -> tuple[ClinicalEvolutionMarker, list[int]]:
    if not analyses:
        marker = ClinicalEvolutionMarker(
            status="atencao_necessaria",
            principais_mudancas=["Ainda nao ha analises estruturadas suficientes para comparar sessoes."],
            padroes_persistentes=[],
            padroes_em_reducao=[],
            novos_riscos=["sem base longitudinal estruturada"],
            resposta_ao_tratamento="Registrar ao menos duas sessoes para estimar resposta longitudinal.",
        )
        return marker, []

    session_numbers = sorted({item.session_number for item in analyses})
    alert_counter = Counter(
        alert.titulo
        for item in analyses
        for alert in item.analysis.alertas
        if alert.severidade in {"moderada", "alta", "critica"}
    )
    pattern_counter = Counter(
        pattern.nome
        for item in analyses
        for pattern in item.analysis.padroes
    )

    latest = analyses[-1].analysis.evolucao
    high_alerts = [name for name, count in alert_counter.items() if count >= 1]
    persistent_patterns = [name for name, count in pattern_counter.items() if count >= 2] or [
        pattern.nome for pattern in analyses[-1].analysis.padroes
    ]

    status = latest.status
    if len(session_numbers) >= 2 and latest.status == "estavel" and not high_alerts:
        status = "melhorando"
    if high_alerts and latest.status != "melhorando":
        status = "atencao_necessaria"

    marker = ClinicalEvolutionMarker(
        status=status,
        principais_mudancas=[
            f"{len(session_numbers)} sessao(oes) estruturadas comparadas.",
            "Analise longitudinal usa somente JSON validado e versionado.",
        ],
        padroes_persistentes=persistent_patterns[:5],
        padroes_em_reducao=latest.padroes_em_reducao,
        novos_riscos=high_alerts[:5],
        resposta_ao_tratamento=latest.resposta_ao_tratamento,
    )
    return marker, session_numbers


def _enhance_evolution_marker_with_ai(
    analyses: list[ClinicalAnalysisRead],
    baseline: ClinicalEvolutionMarker,
    session_numbers: list[int],
) -> tuple[ClinicalEvolutionMarker, str]:
    if not analyses:
        return baseline, RULES_ENGINE_NAME

    system_prompt = (
        "You are Adler AI's longitudinal review layer. "
        "Refine the summary using only the provided baseline and structured sessions. "
        "Return JSON only, in Brazilian Portuguese, with concise and clinically useful language. "
        "Do not change the global status because it was already decided by deterministic logic."
    )
    user_prompt = (
        "Task: improve a longitudinal clinical summary.\n\n"
        f"Baseline summary JSON:\n{json.dumps(baseline.model_dump(mode='json'), ensure_ascii=True)}\n\n"
        f"Sessions compared: {json.dumps(session_numbers, ensure_ascii=True)}\n\n"
        "Structured session summaries JSON:\n"
        f"{json.dumps([_analysis_summary_for_prompt(item) for item in analyses[-6:]], ensure_ascii=True)}"
    )
    ai_payload, selection, _error = try_generate_structured(
        task="evolution_summary",
        schema_model=AIEvolutionSummaryPayload,
        system_prompt=system_prompt,
        user_prompt=user_prompt,
        temperature=0.1,
        max_output_tokens=900,
    )
    if ai_payload is None:
        return baseline, RULES_ENGINE_NAME

    return (
        ClinicalEvolutionMarker(
            status=baseline.status,
            principais_mudancas=ai_payload.principais_mudancas or baseline.principais_mudancas,
            padroes_persistentes=ai_payload.padroes_persistentes or baseline.padroes_persistentes,
            padroes_em_reducao=ai_payload.padroes_em_reducao or baseline.padroes_em_reducao,
            novos_riscos=ai_payload.novos_riscos or baseline.novos_riscos,
            resposta_ao_tratamento=ai_payload.resposta_ao_tratamento or baseline.resposta_ao_tratamento,
        ),
        selection.engine_name,
    )


def build_evolution_snapshot(
    *,
    db: Session,
    tenant_id: str,
    patient_id: str,
) -> tuple[ClinicalEvolutionMarker, list[int], int | None]:
    analyses = list_patient_analyses(db=db, tenant_id=tenant_id, patient_id=patient_id)
    marker, session_numbers = _build_evolution_marker_rules(analyses)
    if not analyses:
        return marker, session_numbers, None

    marker, engine_name = _enhance_evolution_marker_with_ai(analyses, marker, session_numbers)

    snapshot = AdlerEvolutionSnapshot(
        tenant_id=tenant_id,
        patient_id=patient_id,
        from_session=session_numbers[0],
        to_session=session_numbers[-1],
        status=marker.status,
        summary_json={**marker.model_dump(mode="json"), "engine": engine_name},
    )
    db.add(snapshot)
    db.commit()
    db.refresh(snapshot)
    return marker, session_numbers, snapshot.id


def calculate_dropout_risk(
    *,
    db: Session,
    tenant_id: str,
    patient_id: str,
) -> DropoutRiskResponse:
    analyses = list_patient_analyses(db=db, tenant_id=tenant_id, patient_id=patient_id)
    checkins = (
        db.query(AdlerWhatsappCheckin)
        .filter(AdlerWhatsappCheckin.tenant_id == tenant_id)
        .filter(AdlerWhatsappCheckin.patient_id == patient_id)
        .order_by(desc(AdlerWhatsappCheckin.created_at))
        .limit(6)
        .all()
    )
    negative_confirmations = (
        db.query(AdlerAppointmentConfirmation)
        .filter(AdlerAppointmentConfirmation.tenant_id == tenant_id)
        .filter(AdlerAppointmentConfirmation.patient_id == patient_id)
        .filter(AdlerAppointmentConfirmation.status.in_(("cancelled", "missed", "no_response")))
        .count()
    )
    open_engagement_flags = (
        db.query(AdlerEngagementFlag)
        .filter(AdlerEngagementFlag.tenant_id == tenant_id)
        .filter(AdlerEngagementFlag.patient_id == patient_id)
        .filter(AdlerEngagementFlag.resolved_at.is_(None))
        .count()
    )

    score = 18
    factors: list[str] = []

    if not analyses:
        score += 25
        factors.append("Sem analises estruturadas recentes no Adler.")
    else:
        latest = analyses[-1]
        latest_alerts = latest.analysis.alertas
        if any(alert.id == "alert_retention" for alert in latest_alerts):
            score += 25
            factors.append("Sinais de baixa adesao ou afastamento foram detectados.")
        if latest.analysis.evolucao.status in {"piorando", "atencao_necessaria"}:
            score += 18
            factors.append("Evolucao clinica recente exige atencao.")
        if latest.session_number <= 3:
            score += 8
            factors.append("Paciente ainda esta no inicio do vinculo terapeutico.")

    low_checkins = [
        item for item in checkins
        if (item.mood is not None and item.mood <= 3)
        or (item.anxiety is not None and item.anxiety >= 8)
        or (item.adherence is not None and item.adherence <= 4)
    ]
    if low_checkins:
        score += 18
        factors.append("Check-ins recentes sugerem piora, ansiedade alta ou baixa adesao.")
    if negative_confirmations >= 2:
        score += 20
        factors.append("Cancelamentos, ausencias ou falta de resposta aparecem de forma recorrente.")
    elif negative_confirmations == 1:
        score += 10
        factors.append("Ha um sinal operacional recente de cancelamento, ausencia ou nao resposta.")
    if open_engagement_flags:
        score += min(24, open_engagement_flags * 8)
        factors.append("Existem flags abertas de desengajamento no modulo operacional.")

    score = min(100, score)
    classification = "alto" if score >= 70 else "moderado" if score >= 40 else "baixo"
    recommendation = (
        "Enviar follow-up humano, validar barreiras de continuidade e antecipar reengajamento."
        if classification == "alto"
        else "Monitorar proximas sessoes e considerar check-in leve com consentimento."
        if classification == "moderado"
        else "Manter acompanhamento regular."
    )

    risk = AdlerRiskScore(
        tenant_id=tenant_id,
        patient_id=patient_id,
        session_id=analyses[-1].session_id if analyses else None,
        session_number=analyses[-1].session_number if analyses else None,
        risk_type="abandono_tratamento",
        score=score,
        classification=classification,
        factors_json=factors,
        recommendation=recommendation,
    )
    db.add(risk)
    db.commit()
    db.refresh(risk)

    return DropoutRiskResponse(
        patient_id=patient_id,
        score=score,
        classification=classification,
        factors=factors or ["Nenhum fator critico identificado no momento."],
        recommendation=recommendation,
        risk_score_id=risk.id,
    )


def list_evolution_history(
    *,
    db: Session,
    tenant_id: str,
    patient_id: str,
    limit: int = 20,
) -> list[EvolutionSnapshotHistoryItem]:
    records = (
        db.query(AdlerEvolutionSnapshot)
        .filter(AdlerEvolutionSnapshot.tenant_id == tenant_id)
        .filter(AdlerEvolutionSnapshot.patient_id == patient_id)
        .order_by(desc(AdlerEvolutionSnapshot.created_at))
        .limit(limit)
        .all()
    )
    return [
        EvolutionSnapshotHistoryItem(
            id=record.id,
            patient_id=record.patient_id,
            from_session=record.from_session,
            to_session=record.to_session,
            status=record.status,
            summary=record.summary_json or {},
            created_at=record.created_at,
        )
        for record in records
    ]


def list_risk_history(
    *,
    db: Session,
    tenant_id: str,
    patient_id: str,
    limit: int = 30,
) -> list[RiskScoreHistoryItem]:
    records = (
        db.query(AdlerRiskScore)
        .filter(AdlerRiskScore.tenant_id == tenant_id)
        .filter(AdlerRiskScore.patient_id == patient_id)
        .order_by(desc(AdlerRiskScore.created_at))
        .limit(limit)
        .all()
    )
    return [
        RiskScoreHistoryItem(
            id=record.id,
            patient_id=record.patient_id,
            session_number=record.session_number,
            risk_type=record.risk_type,
            score=record.score,
            classification=record.classification,
            factors=record.factors_json or [],
            recommendation=record.recommendation,
            created_at=record.created_at,
        )
        for record in records
    ]


def _document_sections_rules(
    *,
    payload: DocumentDraftRequest,
    clinical_basis: dict[str, object],
) -> list[dict[str, object]]:
    sections: list[dict[str, object]] = [
        {"titulo": "Identificacao", "conteudo": clinical_basis},
        {
            "titulo": "Base clinica utilizada",
            "conteudo": "Rascunho gerado a partir de dados estruturados do paciente e analises JSON validadas.",
        },
    ]

    if payload.document_type == "pedido_judicial_medicamento":
        sections.extend(
            [
                {
                    "titulo": "Justificativa tecnica",
                    "conteudo": (
                        f"Paciente necessita de {payload.medicamento_solicitado or 'medicamento solicitado'} "
                        "por falha, indisponibilidade ou inadequacao das alternativas padronizadas, "
                        "conforme revisao manual do profissional."
                    ),
                },
                {
                    "titulo": "Riscos da nao utilizacao",
                    "conteudo": "Grave comprometimento do bem-estar, risco de piora funcional e prolongamento do sofrimento clinico.",
                },
                {
                    "titulo": "Declaracao critica",
                    "conteudo": (
                        "Este rascunho exige validacao do medico prescritor, posologia formal, CID, "
                        "historico terapeutico e assinatura profissional."
                    ),
                },
            ]
        )
    elif payload.document_type == "encaminhamento":
        sections.append(
            {
                "titulo": "Objetivo do encaminhamento",
                "conteudo": payload.destinatario
                or "Solicitar avaliacao complementar e cuidado integrado, preservando sigilo e consentimento.",
            }
        )
    else:
        sections.append(
            {
                "titulo": "Conclusao assistida",
                "conteudo": "Sintese deve ser revisada, editada e validada pelo profissional antes de emissao.",
            }
        )

    return sections


def _enhance_document_sections_with_ai(
    *,
    payload: DocumentDraftRequest,
    patient: dict,
    selected_analysis: ClinicalAnalysisRead | None,
    baseline_sections: list[dict[str, object]],
) -> tuple[list[dict[str, object]], str]:
    system_prompt = (
        "You are Adler AI's assisted clinical drafting layer. "
        "Write concise draft sections in Brazilian Portuguese using only the provided data. "
        "Do not produce a final legal or clinical document. "
        "Return JSON only and keep every section clinically conservative."
    )
    selected_payload = selected_analysis.analysis.model_dump(mode="json") if selected_analysis else None
    user_prompt = (
        "Task: improve the narrative sections of an assisted clinical draft.\n\n"
        f"Document type: {payload.document_type}\n"
        f"Patient context JSON:\n{json.dumps({'name': patient['name'], 'diagnosis': patient['diagnosis'], 'current_protocol': patient['current_protocol']}, ensure_ascii=True)}\n\n"
        f"Selected analysis JSON:\n{json.dumps(selected_payload, ensure_ascii=True)}\n\n"
        f"Baseline sections JSON:\n{json.dumps(baseline_sections, ensure_ascii=True)}"
    )
    ai_payload, selection, _error = try_generate_structured(
        task="document_draft",
        schema_model=AIDocumentDraftPayload,
        system_prompt=system_prompt,
        user_prompt=user_prompt,
        temperature=0.15,
        max_output_tokens=1200,
    )
    if ai_payload is None or not ai_payload.sections:
        return baseline_sections, RULES_ENGINE_NAME

    enhanced_sections: list[dict[str, object]] = list(baseline_sections[:2])
    enhanced_sections.extend(
        {"titulo": section.titulo, "conteudo": section.conteudo}
        for section in ai_payload.sections
    )
    return enhanced_sections, selection.engine_name


def create_document_draft(
    *,
    db: Session,
    tenant_id: str,
    payload: DocumentDraftRequest,
) -> dict:
    patient = get_patient(payload.patient_id, db=db, tenant_id=tenant_id)
    analyses = list_patient_analyses(db=db, tenant_id=tenant_id, patient_id=payload.patient_id)
    selected = None
    if payload.session_number is not None:
        selected = next((item for item in reversed(analyses) if item.session_number == payload.session_number), None)
    selected = selected or (analyses[-1] if analyses else None)
    analysis = selected.analysis if selected else None

    title_by_type = {
        "prontuario_estruturado": "Prontuario estruturado assistido",
        "soap": "Nota SOAP assistida",
        "laudo_clinico": "Laudo clinico assistido",
        "laudo_pericial": "Laudo pericial assistido",
        "relatorio_clinico": "Relatorio clinico assistido",
        "encaminhamento": "Relatorio de encaminhamento",
        "atestado": "Atestado assistido",
        "pedido_judicial_medicamento": "Pedido judicial de medicamento",
    }
    title = title_by_type[payload.document_type]

    clinical_basis = {
        "paciente": patient["name"],
        "diagnostico_registrado": patient["diagnosis"],
        "protocolo_atual": patient["current_protocol"],
        "sessao_base": selected.session_number if selected else None,
        "hipoteses": [item.descricao for item in analysis.hipoteses] if analysis else [],
        "alertas": [item.titulo for item in analysis.alertas] if analysis else [],
    }
    baseline_sections = _document_sections_rules(payload=payload, clinical_basis=clinical_basis)
    sections, engine_name = _enhance_document_sections_with_ai(
        payload=payload,
        patient=patient,
        selected_analysis=selected,
        baseline_sections=baseline_sections,
    )

    draft = {
        "document_type": payload.document_type,
        "profissional": payload.profissional,
        "filtros": payload.filtros,
        "sections": sections,
        "engine": engine_name,
        "required_review": True,
        "not_final_document": True,
    }

    record = AdlerGeneratedDocument(
        tenant_id=tenant_id,
        patient_id=payload.patient_id,
        session_id=selected.session_id if selected else None,
        document_type=payload.document_type,
        title=title,
        parameters_json=payload.model_dump(mode="json"),
        draft_json=draft,
        status="draft_requires_clinician_review",
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return {
        "id": record.id,
        "title": title,
        "status": record.status,
        "draft": draft,
        "safety_notice": "O Adler gera rascunhos assistidos; o documento final depende de revisao, edicao e validacao do clinico.",
    }


def _progress_report_sections_rules(
    *,
    marker: ClinicalEvolutionMarker,
    sessions: list[int],
    dropout: DropoutRiskResponse,
) -> list[dict[str, object]]:
    return [
        {
            "titulo": "Resumo em linguagem simples",
            "conteudo": marker.resposta_ao_tratamento,
        },
        {
            "titulo": "Sessoes consideradas",
            "conteudo": sessions,
        },
        {
            "titulo": "Padroes persistentes",
            "conteudo": marker.padroes_persistentes,
        },
        {
            "titulo": "Status atual",
            "conteudo": marker.status,
        },
        {
            "titulo": "Continuidade do cuidado",
            "conteudo": {
                "risco_de_abandono": dropout.classification,
                "recomendacao": dropout.recommendation,
            },
        },
    ]


def _enhance_progress_report_sections_with_ai(
    *,
    patient: dict,
    marker: ClinicalEvolutionMarker,
    sessions: list[int],
    dropout: DropoutRiskResponse,
    baseline_sections: list[dict[str, object]],
) -> tuple[list[dict[str, object]], str]:
    system_prompt = (
        "You are Adler AI's shareable progress report layer. "
        "Create short, clear, clinician-safe section text in Brazilian Portuguese. "
        "Use only the provided structured data. "
        "Do not promise outcomes or invent symptoms."
    )
    user_prompt = (
        "Task: improve a patient progress report while keeping it concise and shareable.\n\n"
        f"Patient JSON:\n{json.dumps({'name': patient['name'], 'diagnosis': patient['diagnosis'], 'current_protocol': patient['current_protocol']}, ensure_ascii=True)}\n\n"
        f"Evolution marker JSON:\n{json.dumps(marker.model_dump(mode='json'), ensure_ascii=True)}\n\n"
        f"Sessions JSON:\n{json.dumps(sessions, ensure_ascii=True)}\n\n"
        f"Dropout risk JSON:\n{json.dumps(dropout.model_dump(mode='json'), ensure_ascii=True)}\n\n"
        f"Baseline sections JSON:\n{json.dumps(baseline_sections, ensure_ascii=True)}"
    )
    ai_payload, selection, _error = try_generate_structured(
        task="patient_report",
        schema_model=AIProgressReportPayload,
        system_prompt=system_prompt,
        user_prompt=user_prompt,
        temperature=0.12,
        max_output_tokens=1100,
    )
    if ai_payload is None or not ai_payload.sections:
        return baseline_sections, RULES_ENGINE_NAME

    enhanced_sections: list[dict[str, object]] = []
    for index, baseline in enumerate(baseline_sections):
        if index < len(ai_payload.sections):
            section = ai_payload.sections[index]
            if isinstance(baseline.get("conteudo"), str):
                enhanced_sections.append({"titulo": section.titulo or baseline["titulo"], "conteudo": section.conteudo})
                continue
        enhanced_sections.append(baseline)
    return enhanced_sections, selection.engine_name


def build_patient_progress_report(
    *,
    db: Session,
    tenant_id: str,
    patient_id: str,
) -> PatientProgressReportResponse:
    patient = get_patient(patient_id, db=db, tenant_id=tenant_id)
    marker, sessions, _snapshot_id = build_evolution_snapshot(db=db, tenant_id=tenant_id, patient_id=patient_id)
    dropout = calculate_dropout_risk(db=db, tenant_id=tenant_id, patient_id=patient_id)
    baseline_sections = _progress_report_sections_rules(marker=marker, sessions=sessions, dropout=dropout)
    sections, _engine_name = _enhance_progress_report_sections_with_ai(
        patient=patient,
        marker=marker,
        sessions=sessions,
        dropout=dropout,
        baseline_sections=baseline_sections,
    )

    return PatientProgressReportResponse(
        patient_id=patient_id,
        title=f"Relatorio de evolucao de {patient['name']}",
        shareable=True,
        sections=sections,
    )


def request_pharmacogenetics(
    *,
    db: Session,
    tenant_id: str,
    payload: PharmacogeneticsRequest,
) -> PharmacogeneticsRequestResponse:
    request_id = f"pgx-{uuid4().hex[:10]}"
    result = AdlerPharmacogeneticsResult(
        tenant_id=tenant_id,
        patient_id=payload.patient_id,
        gene=payload.gene or "painel_psiquiatrico",
        phenotype="aguardando_resultado_externo",
        source_lab=payload.partner_lab or "laboratorio_parceiro_a_definir",
        result_json={
            "request_id": request_id,
            "medication": payload.medication,
            "status": "requested",
            "ethical_boundary": "Adler nao realiza teste genetico; apenas interpreta resultado externo enviado.",
        },
    )
    db.add(result)
    db.commit()

    return PharmacogeneticsRequestResponse(
        status="requested",
        request_id=request_id,
        message="Solicitacao preparada para laboratorio parceiro ou upload posterior do laudo externo.",
        next_steps=[
            "Obter consentimento do paciente.",
            "Enviar link ou guia de coleta do laboratorio parceiro.",
            "Inserir resultado externo para correlacionar com medicacao, resposta clinica e efeitos adversos.",
        ],
    )


def create_whatsapp_checkin(
    *,
    db: Session,
    tenant_id: str,
    payload: WhatsappCheckinCreate,
) -> WhatsappCheckinRead:
    if payload.consent_status != "consented":
        raise HTTPException(
            status_code=422,
            detail="Check-ins por WhatsApp exigem consentimento ativo do paciente.",
        )

    record = AdlerWhatsappCheckin(
        tenant_id=tenant_id,
        patient_id=payload.patient_id,
        mood=payload.mood,
        anxiety=payload.anxiety,
        sleep=payload.sleep,
        adherence=payload.adherence,
        notes=payload.notes,
        consent_status=payload.consent_status,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return WhatsappCheckinRead(
        id=record.id,
        patient_id=record.patient_id,
        mood=record.mood,
        anxiety=record.anxiety,
        sleep=record.sleep,
        adherence=record.adherence,
        notes=record.notes,
        consent_status=record.consent_status,
        created_at=record.created_at,
    )

def upsert_session_note_draft(db: Session, tenant_id: str, payload: SessionNoteDraftCreate) -> AdlerSessionNoteDraft:
    record = db.query(AdlerSessionNoteDraft).filter(
        AdlerSessionNoteDraft.tenant_id == tenant_id,
        AdlerSessionNoteDraft.patient_id == payload.patient_id
    ).first()

    if record:
        record.content = payload.content
    else:
        record = AdlerSessionNoteDraft(
            tenant_id=tenant_id,
            patient_id=payload.patient_id,
            content=payload.content
        )
        db.add(record)

    db.commit()
    db.refresh(record)
    return record
