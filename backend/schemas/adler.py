"""Schemas for the Adler clinical intelligence API."""

from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


ClinicalApproach = Literal[
    "psychiatry",
    "cbt",
    "schema",
    "psychoanalysis",
    "couples",
    "generalist",
    "systemic",
]
PatientStatus = Literal["active", "inactive"]
SubscriptionTier = Literal["standard", "premium"]


class ClinicianProfileRead(BaseModel):
    allowed_approaches: list[ClinicalApproach]
    credentials: str
    focus_label: str
    initials: str
    name: str
    notifications: int
    primary_approach: ClinicalApproach
    primary_approach_label: str
    role: str
    subscription_tier: SubscriptionTier


class ScheduleItemRead(BaseModel):
    duration: str
    mode: str
    patient_id: str
    patient_name: str
    prep_note: str
    room_label: str
    session_label: str
    status: Literal["completed", "next", "scheduled"]
    time: str


class TaskItemRead(BaseModel):
    id: str
    label: str
    priority: Literal["alta", "media", "rotina"]
    status: Literal["done", "pending"]


class PatientRegistryItemRead(BaseModel):
    current_protocol: str
    default_session: int
    diagnosis: str
    focus: str
    id: str
    initials: str
    name: str
    status: PatientStatus


class MedicationEntryRead(BaseModel):
    alert: str | None = None
    dose: str
    efficacy: int | None = None
    efficacy_label: str | None = None
    highlight: str | None = None
    subtitle: str
    title: str


class PharmacologyLensRead(BaseModel):
    detail: str
    label: str
    value: str


class GeneticsProfileRead(BaseModel):
    badge: str
    compatibility: int
    gene: str
    gradient_end: str
    gradient_start: str
    phenotype: str
    summary: str


class DifferentialAlertRead(BaseModel):
    note: str
    session: int


class TranscriptSegmentRead(BaseModel):
    id: str
    speaker: str
    text: str
    timestamp: str


class RecorderRead(BaseModel):
    duration: str
    summary: str
    title: str
    transcript_segments: list[TranscriptSegmentRead]


class LaboratoryMonitoringItemRead(BaseModel):
    frequency: str
    last_result: str
    name: str
    purpose: str
    status: Literal["alert", "due", "ok"]


class LaboratoryMonitoringProfileRead(BaseModel):
    alert_symptoms: str
    baseline: str
    interaction_note: str
    maintenance_schedule: str
    medication: str
    start_schedule: str
    tests: list[LaboratoryMonitoringItemRead]


class MedicationInteractionItemRead(BaseModel):
    category: Literal["alimento", "alerta", "sinergia"]
    counterpart: str
    effect: str
    guidance: str
    severity: Literal["alto", "moderado", "protetor"]
    title: str


class HarmReductionProfileRead(BaseModel):
    active_substances: list[str]
    current_stage: str
    goals: list[str]
    red_flags: str
    safety_plan: list[str]
    support_network: str


class PatientRead(BaseModel):
    current_protocol: str
    default_session: int
    diagnosis: str
    differential_alert: DifferentialAlertRead
    focus: str
    genetics: GeneticsProfileRead
    harm_reduction: HarmReductionProfileRead | None = None
    id: str
    initials: str
    interactions: list[MedicationInteractionItemRead] = Field(default_factory=list)
    labs: LaboratoryMonitoringProfileRead | None = None
    medications: dict[str, MedicationEntryRead]
    name: str
    pharmacology: dict[str, PharmacologyLensRead]
    recorder: RecorderRead
    status: PatientStatus


class InsightRead(BaseModel):
    confidence: int
    description: str
    id: str
    title: str


class RiskSnapshotRead(BaseModel):
    focus_label: str
    note: str
    score: int
    severity: Literal["critical", "elevated", "stable"]


class WorkspaceSnapshotRead(BaseModel):
    approach: ClinicalApproach
    clinical_frame: str
    insights: list[InsightRead]
    patient: PatientRead
    selected_session: int
    summary: str
    risk: RiskSnapshotRead


class DashboardSummaryRead(BaseModel):
    active_patients: int
    inactive_patients: int
    notes_last_updated_at: datetime
    pending_tasks: int
    sessions_today: int


class DashboardRead(BaseModel):
    clinician: ClinicianProfileRead
    notes: str
    recent_notes: list[dict[str, str]]
    schedule: list[ScheduleItemRead]
    summary: DashboardSummaryRead
    tasks: list[TaskItemRead]


class NotesRead(BaseModel):
    updated_at: datetime
    value: str


class NotesUpdate(BaseModel):
    value: str


class DocumentMetaRead(BaseModel):
    id: str
    mime_type: str
    name: str
    patient_id: str | None = None
    patient_name: str | None = None
    size_bytes: int
    uploaded_at: datetime


class BootstrapRead(BaseModel):
    dashboard: DashboardRead
    documents: list[DocumentMetaRead]
    patients: list[PatientRegistryItemRead]


class ScientificWarningRead(BaseModel):
    message: str
    row: int | None = None
    table: str


class ScientificBaseRead(BaseModel):
    auth_mode: str
    clinical_concepts: list[dict[str, str]]
    document_models: list[dict[str, str]]
    documents: list[dict[str, str]]
    filters: dict[str, str | None]
    interactions: list[dict[str, str]]
    laboratory_monitoring: list[dict[str, str]]
    psychological_scales: list[dict[str, str]]
    psychopathology: list[dict[str, str]]
    root: str
    summary: dict[str, int]
    tenant_id: str
    warnings: list[ScientificWarningRead]
