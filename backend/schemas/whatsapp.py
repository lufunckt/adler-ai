"""Schemas for the premium Adler WhatsApp operations module."""

from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


WhatsAppIntent = Literal[
    "appointment_request",
    "appointment_confirmation",
    "appointment_cancellation",
    "structured_checkin",
    "sensitive_or_complex",
    "unknown",
]
AppointmentConfirmationStatus = Literal["pending", "confirmed", "cancelled", "no_response", "missed"]
EngagementSeverity = Literal["low", "moderate", "high"]


class WhatsAppMessageRead(BaseModel):
    id: int
    patient_id: str | None
    direction: str
    intent: str | None
    body: str
    structured_payload: dict[str, object]
    safety_classification: str
    clinical_boundary_notice: str
    created_at: datetime


class WhatsAppInboundMessageCreate(BaseModel):
    body: str = Field(min_length=1)
    patient_id: str | None = None
    phone_hash: str | None = None
    external_message_id: str | None = None


class WhatsAppInboundMessageResponse(BaseModel):
    inbound: WhatsAppMessageRead
    detected_intent: WhatsAppIntent
    safe_reply: str
    should_notify_clinician: bool
    created_flags: list[str]


class WhatsAppTemplateRead(BaseModel):
    key: str
    purpose: str
    body: str
    clinical_boundary: str


class AppointmentReminderCreate(BaseModel):
    patient_id: str
    appointment_id: str
    scheduled_at: datetime
    patient_name: str | None = None


class AppointmentConfirmationCreate(BaseModel):
    patient_id: str
    appointment_id: str
    status: AppointmentConfirmationStatus
    response_text: str | None = None


class AppointmentConfirmationRead(BaseModel):
    id: int
    patient_id: str
    appointment_id: str | None
    scheduled_at: datetime | None
    reminder_sent_at: datetime | None
    status: str
    response_text: str | None
    created_at: datetime


class CheckinPromptCreate(BaseModel):
    patient_id: str
    patient_name: str | None = None


class StructuredCheckinCreate(BaseModel):
    patient_id: str
    mood: int | None = Field(default=None, ge=0, le=10)
    anxiety: int | None = Field(default=None, ge=0, le=10)
    sleep: int | None = Field(default=None, ge=0, le=10)
    adherence: int | None = Field(default=None, ge=0, le=10)
    notes: str | None = None
    phone_hash: str | None = None


class StructuredCheckinRead(BaseModel):
    id: int
    patient_id: str
    mood: int | None
    anxiety: int | None
    sleep: int | None
    adherence: int | None
    notes: str | None
    consent_status: str
    created_at: datetime


class EngagementFlagRead(BaseModel):
    id: int
    patient_id: str
    flag_type: str
    severity: EngagementSeverity
    source: str
    evidence_json: dict[str, object]
    recommended_action: str
    created_at: datetime


class WhatsAppPatientDashboardResponse(BaseModel):
    patient_id: str
    recent_messages: list[WhatsAppMessageRead]
    confirmations: list[AppointmentConfirmationRead]
    checkins: list[StructuredCheckinRead]
    engagement_flags: list[EngagementFlagRead]
    positioning_notice: str
