"""Schemas for Adler structured clinical intelligence."""

from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field, field_validator


ClinicalIntelligenceApproach = Literal["cbt", "psychoanalysis", "psychiatry"]
ClinicalNodeType = Literal[
    "evento",
    "crenca",
    "emocao",
    "comportamento",
    "consequencia",
    "padrao",
    "hipotese",
]
ClinicalEdgeType = Literal["causa", "gatilho", "reforco", "consequencia", "recorrencia"]
EvolutionStatus = Literal["melhorando", "estavel", "piorando", "atencao_necessaria"]
DropoutRiskLevel = Literal["baixo", "moderado", "alto"]
DocumentType = Literal[
    "prontuario_estruturado",
    "soap",
    "laudo_clinico",
    "laudo_pericial",
    "relatorio_clinico",
    "encaminhamento",
    "atestado",
    "pedido_judicial_medicamento",
]


class ClinicalSessionInput(BaseModel):
    patient_id: str = Field(min_length=2)
    session_number: int = Field(ge=1)
    occurred_at: datetime | None = None
    sintomas: list[str] = Field(default_factory=list)
    emocoes: list[str] = Field(default_factory=list)
    eventos: list[str] = Field(default_factory=list)
    comportamentos: list[str] = Field(default_factory=list)
    medicacao: list[str] = Field(default_factory=list)
    tempo: str | None = None

class PharmacogeneticsUpdate(BaseModel):
    status: str
    phenotype: str | None = None
    result_json: dict | None = None

    abordagem_clinica: ClinicalIntelligenceApproach
    observacoes: str | None = None

    @field_validator("sintomas", "emocoes", "eventos", "comportamentos", "medicacao")
    @classmethod
    def normalize_list(cls, value: list[str]) -> list[str]:
        return [item.strip() for item in value if item and item.strip()]


class ClinicalPattern(BaseModel):
    id: str
    nome: str
    categoria: str
    descricao: str
    evidencia: list[str] = Field(default_factory=list)
    recorrencia: int = Field(ge=0, le=100)


class ClinicalMechanism(BaseModel):
    id: str
    nome: str
    tipo: str
    descricao: str
    alvo_terapeutico: str
    confidence: int = Field(ge=0, le=100)


class ClinicalRelation(BaseModel):
    id: str
    origem: str
    destino: str
    tipo: ClinicalEdgeType
    intensidade: int = Field(ge=1, le=5)
    racional: str


class ClinicalHypothesis(BaseModel):
    id: str
    descricao: str
    status: Literal["ativa", "em_observacao", "reduzida", "descartada"]
    suporte: list[str] = Field(default_factory=list)
    proxima_acao: str
    confidence: int = Field(ge=0, le=100)


class ClinicalAlert(BaseModel):
    id: str
    severidade: Literal["baixa", "moderada", "alta", "critica"]
    titulo: str
    descricao: str
    acao_sugerida: str


class ClinicalMapNode(BaseModel):
    id: str
    label: str
    type: ClinicalNodeType
    weight: int = Field(ge=1, le=100)
    source_session: int


class ClinicalMapEdge(BaseModel):
    id: str
    source: str
    target: str
    type: ClinicalEdgeType
    strength: int = Field(ge=1, le=5)
    rationale: str


class ClinicalEvolutionMarker(BaseModel):
    status: EvolutionStatus
    principais_mudancas: list[str] = Field(default_factory=list)
    padroes_persistentes: list[str] = Field(default_factory=list)
    padroes_em_reducao: list[str] = Field(default_factory=list)
    novos_riscos: list[str] = Field(default_factory=list)
    resposta_ao_tratamento: str


class ClinicalAnalysisJSON(BaseModel):
    schema_version: str = "adler.clinical_analysis.v1"
    padroes: list[ClinicalPattern]
    distorcoes_ou_mecanismos: list[ClinicalMechanism]
    relacoes: list[ClinicalRelation]
    hipoteses: list[ClinicalHypothesis]
    alertas: list[ClinicalAlert]
    mapa: dict[str, list[ClinicalMapNode] | list[ClinicalMapEdge]]
    evolucao: ClinicalEvolutionMarker
    metadados: dict[str, str | int | float | bool | None]


class ClinicalAnalysisRead(BaseModel):
    id: int
    patient_id: str
    session_id: int
    session_number: int
    approach: ClinicalIntelligenceApproach
    version: int
    status: str
    engine: str
    analysis: ClinicalAnalysisJSON
    created_at: datetime


class ClinicalAnalysisCreateResponse(BaseModel):
    persisted: bool
    analysis_record: ClinicalAnalysisRead


class ClinicalAnalysisListResponse(BaseModel):
    analyses: list[ClinicalAnalysisRead]
    count: int
    patient_id: str


class ClinicalMapResponse(BaseModel):
    patient_id: str
    nodes: list[ClinicalMapNode]
    edges: list[ClinicalMapEdge]
    source_analysis_count: int


class ClinicalEvolutionResponse(BaseModel):
    patient_id: str
    status: EvolutionStatus
    summary: ClinicalEvolutionMarker
    sessions_compared: list[int]
    snapshot_id: int | None = None


class EvolutionDecisionResponse(BaseModel):
    patient_id: str
    status_geral: Literal["melhorando", "estavel", "piorando", "atencao"]
    principais_mudancas: list[str]
    padroes_persistentes: list[str]
    novos_riscos: list[str]
    tendencias: list[str]
    sessions_compared: list[int]
    snapshot_id: int | None = None


class DropoutRiskResponse(BaseModel):
    patient_id: str
    score: int = Field(ge=0, le=100)
    classification: DropoutRiskLevel
    factors: list[str]
    recommendation: str
    risk_score_id: int | None = None


class AbandonmentRiskDecisionResponse(BaseModel):
    patient_id: str
    risco_abandono: DropoutRiskLevel
    score: int = Field(ge=0, le=100)
    fatores_identificados: list[str]
    sugestoes_acao: list[str]
    risk_score_id: int | None = None


class EvolutionSnapshotHistoryItem(BaseModel):
    id: int
    patient_id: str
    from_session: int | None
    to_session: int | None
    status: str
    summary: dict[str, object]
    created_at: datetime


class RiskScoreHistoryItem(BaseModel):
    id: int
    patient_id: str
    session_number: int | None
    risk_type: str
    score: int
    classification: str
    factors: list[str]
    recommendation: str
    created_at: datetime


class EvolutionSnapshotHistoryResponse(BaseModel):
    patient_id: str
    count: int
    snapshots: list[EvolutionSnapshotHistoryItem]


class RiskScoreHistoryResponse(BaseModel):
    patient_id: str
    count: int
    scores: list[RiskScoreHistoryItem]


class DocumentDraftRequest(BaseModel):
    document_type: DocumentType
    patient_id: str = Field(min_length=2)
    session_number: int | None = Field(default=None, ge=1)
    profissional: Literal["psicologo", "psiquiatra", "outro"] = "psicologo"
    filtros: list[str] = Field(default_factory=list)
    medicamento_solicitado: str | None = None
    destinatario: str | None = None


class DocumentDraftResponse(BaseModel):
    id: int
    title: str
    status: str
    draft: dict[str, object]
    safety_notice: str


class PatientProgressReportResponse(BaseModel):
    patient_id: str
    title: str
    shareable: bool
    sections: list[dict[str, object]]


class PharmacogeneticsRequest(BaseModel):
    patient_id: str
    medication: str
    gene: str | None = None
    partner_lab: str | None = None


class PharmacogeneticsRequestResponse(BaseModel):
    status: str
    request_id: str
    message: str
    next_steps: list[str]


class WhatsappCheckinCreate(BaseModel):
    patient_id: str
    mood: int | None = Field(default=None, ge=0, le=10)
    anxiety: int | None = Field(default=None, ge=0, le=10)
    sleep: int | None = Field(default=None, ge=0, le=10)
    adherence: int | None = Field(default=None, ge=0, le=10)
    notes: str | None = None
    consent_status: Literal["consented", "pending", "revoked"] = "consented"


class WhatsappCheckinRead(BaseModel):
    id: int
    patient_id: str
    mood: int | None
    anxiety: int | None
    sleep: int | None
    adherence: int | None
    notes: str | None
    consent_status: str
    created_at: datetime
