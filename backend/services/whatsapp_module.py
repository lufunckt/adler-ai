"""Premium WhatsApp operational module for Adler.

The module records operational contact and structured check-ins. It never
provides therapy, diagnosis, medication guidance or emergency support.
"""

from __future__ import annotations

from datetime import datetime, timezone

from fastapi import HTTPException
from sqlalchemy import desc
from sqlalchemy.orm import Session

from backend.models.adler_clinical import (
    AdlerAppointmentConfirmation,
    AdlerEngagementFlag,
    AdlerWhatsappCheckin,
    AdlerWhatsappMessage,
)
from backend.schemas.whatsapp import (
    AppointmentConfirmationCreate,
    AppointmentConfirmationRead,
    AppointmentReminderCreate,
    CheckinPromptCreate,
    EngagementFlagRead,
    StructuredCheckinCreate,
    StructuredCheckinRead,
    WhatsAppInboundMessageCreate,
    WhatsAppInboundMessageResponse,
    WhatsAppIntent,
    WhatsAppMessageRead,
    WhatsAppPatientDashboardResponse,
    WhatsAppTemplateRead,
)


BOUNDARY_NOTICE = (
    "Canal operacional. Nao substitui consulta, nao oferece aconselhamento clinico "
    "e nao deve ser usado para emergencias."
)

TEMPLATES = {
    "appointment_reminder": {
        "purpose": "Lembrete e confirmacao de consulta",
        "body": (
            "Ola, {patient_name}. Lembrete da sua consulta Adler em {scheduled_at}. "
            "Responda 1 para confirmar ou 2 para remarcar/cancelar. "
            "Este canal e apenas operacional."
        ),
    },
    "checkin_prompt": {
        "purpose": "Check-in estruturado entre sessoes",
        "body": (
            "Check-in rapido Adler: humor 0-10, ansiedade 0-10, sono 0-10 e adesao 0-10. "
            "Exemplo: humor 6, ansiedade 4, sono 7, adesao 8. "
            "Este canal nao substitui atendimento clinico."
        ),
    },
    "scheduling_next_step": {
        "purpose": "Encaminhar pedido de agendamento",
        "body": (
            "Recebemos seu pedido de agendamento. O profissional ou a agenda do Adler "
            "seguira com opcoes de horario. Este canal nao realiza consulta."
        ),
    },
}


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


def _read_message(record: AdlerWhatsappMessage) -> WhatsAppMessageRead:
    return WhatsAppMessageRead(
        id=record.id,
        patient_id=record.patient_id,
        direction=record.direction,
        intent=record.intent,
        body=record.body,
        structured_payload=record.structured_payload or {},
        safety_classification=record.safety_classification,
        clinical_boundary_notice=record.clinical_boundary_notice,
        created_at=record.created_at,
    )


def _read_confirmation(record: AdlerAppointmentConfirmation) -> AppointmentConfirmationRead:
    return AppointmentConfirmationRead(
        id=record.id,
        patient_id=record.patient_id,
        appointment_id=record.appointment_id,
        scheduled_at=record.scheduled_at,
        reminder_sent_at=record.reminder_sent_at,
        status=record.status,
        response_text=record.response_text,
        created_at=record.created_at,
    )


def _read_checkin(record: AdlerWhatsappCheckin) -> StructuredCheckinRead:
    return StructuredCheckinRead(
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


def _read_flag(record: AdlerEngagementFlag) -> EngagementFlagRead:
    return EngagementFlagRead(
        id=record.id,
        patient_id=record.patient_id,
        flag_type=record.flag_type,
        severity=record.severity,
        source=record.source,
        evidence_json=record.evidence_json or {},
        recommended_action=record.recommended_action,
        created_at=record.created_at,
    )


def _detect_intent(body: str) -> WhatsAppIntent:
    text = body.lower()
    if any(term in text for term in ("suic", "morte", "emergencia", "autoex", "me machucar")):
        return "sensitive_or_complex"
    if any(term in text for term in ("marcar", "agendar", "horario", "consulta", "remarcar")):
        return "appointment_request"
    if any(term in text for term in ("cancelar", "desmarcar", "nao vou", "não vou")):
        return "appointment_cancellation"
    if text.strip() in {"1", "sim", "confirmo", "confirmado", "ok"}:
        return "appointment_confirmation"
    if any(term in text for term in ("humor", "ansiedade", "sono", "adesao", "adesão")):
        return "structured_checkin"
    return "unknown"


def _safe_reply(intent: WhatsAppIntent) -> str:
    if intent == "sensitive_or_complex":
        return (
            "Recebemos sua mensagem. Este canal nao substitui atendimento clinico nem emergencial. "
            "Procure seu profissional pelo canal apropriado; em risco imediato, busque servico de emergencia."
        )
    if intent == "appointment_request":
        return TEMPLATES["scheduling_next_step"]["body"]
    if intent == "appointment_confirmation":
        return "Confirmacao recebida. Este canal e apenas operacional."
    if intent == "appointment_cancellation":
        return "Recebemos sua solicitacao. A agenda sera atualizada e o profissional podera acompanhar."
    if intent == "structured_checkin":
        return "Check-in recebido. As respostas serao registradas para acompanhamento pelo profissional."
    return "Mensagem recebida. Este canal e operacional; para temas clinicos, fale com seu profissional."


def _create_flag(
    *,
    db: Session,
    tenant_id: str,
    patient_id: str,
    flag_type: str,
    severity: str,
    source: str,
    evidence: dict[str, object],
    recommended_action: str,
) -> AdlerEngagementFlag:
    flag = AdlerEngagementFlag(
        tenant_id=tenant_id,
        patient_id=patient_id,
        flag_type=flag_type,
        severity=severity,
        source=source,
        evidence_json=evidence,
        recommended_action=recommended_action,
    )
    db.add(flag)
    db.flush()
    return flag


def list_templates() -> list[WhatsAppTemplateRead]:
    return [
        WhatsAppTemplateRead(
            key=key,
            purpose=value["purpose"],
            body=value["body"],
            clinical_boundary=BOUNDARY_NOTICE,
        )
        for key, value in TEMPLATES.items()
    ]


def record_inbound_message(
    *,
    db: Session,
    tenant_id: str,
    payload: WhatsAppInboundMessageCreate,
) -> WhatsAppInboundMessageResponse:
    intent = _detect_intent(payload.body)
    safety = "boundary_required" if intent == "sensitive_or_complex" else "operational"
    message = AdlerWhatsappMessage(
        tenant_id=tenant_id,
        patient_id=payload.patient_id,
        external_message_id=payload.external_message_id,
        direction="inbound",
        phone_hash=payload.phone_hash,
        intent=intent,
        body=payload.body,
        structured_payload={"detected_intent": intent},
        safety_classification=safety,
        clinical_boundary_notice=BOUNDARY_NOTICE,
    )
    db.add(message)
    db.flush()

    flags: list[AdlerEngagementFlag] = []
    if payload.patient_id and intent == "sensitive_or_complex":
        flags.append(
            _create_flag(
                db=db,
                tenant_id=tenant_id,
                patient_id=payload.patient_id,
                flag_type="sensitive_message",
                severity="high",
                source="whatsapp",
                evidence={"message_id": message.id, "body": payload.body[:240]},
                recommended_action="Revisar mensagem e acionar protocolo clinico adequado fora do WhatsApp.",
            )
        )
    if payload.patient_id and intent == "appointment_cancellation":
        flags.append(
            _create_flag(
                db=db,
                tenant_id=tenant_id,
                patient_id=payload.patient_id,
                flag_type="cancellation_signal",
                severity="moderate",
                source="whatsapp",
                evidence={"message_id": message.id},
                recommended_action="Oferecer remarcacao simples e acompanhar risco de abandono.",
            )
        )

    db.commit()
    db.refresh(message)
    for flag in flags:
        db.refresh(flag)

    return WhatsAppInboundMessageResponse(
        inbound=_read_message(message),
        detected_intent=intent,
        safe_reply=_safe_reply(intent),
        should_notify_clinician=intent in {"sensitive_or_complex", "appointment_cancellation"},
        created_flags=[flag.flag_type for flag in flags],
    )


def create_appointment_reminder(
    *,
    db: Session,
    tenant_id: str,
    payload: AppointmentReminderCreate,
) -> dict:
    reminder_body = TEMPLATES["appointment_reminder"]["body"].format(
        patient_name=payload.patient_name or "paciente",
        scheduled_at=payload.scheduled_at.strftime("%d/%m/%Y %H:%M"),
    )
    confirmation = AdlerAppointmentConfirmation(
        tenant_id=tenant_id,
        patient_id=payload.patient_id,
        appointment_id=payload.appointment_id,
        scheduled_at=payload.scheduled_at,
        reminder_sent_at=_utc_now(),
        status="pending",
    )
    message = AdlerWhatsappMessage(
        tenant_id=tenant_id,
        patient_id=payload.patient_id,
        direction="outbound",
        intent="appointment_confirmation",
        template_key="appointment_reminder",
        body=reminder_body,
        structured_payload={"appointment_id": payload.appointment_id},
        safety_classification="operational",
        clinical_boundary_notice=BOUNDARY_NOTICE,
    )
    db.add(confirmation)
    db.add(message)
    db.commit()
    db.refresh(confirmation)
    db.refresh(message)
    return {
        "confirmation": _read_confirmation(confirmation),
        "message": _read_message(message),
        "provider_status": "prepared_for_whatsapp_provider",
    }


def update_appointment_confirmation(
    *,
    db: Session,
    tenant_id: str,
    payload: AppointmentConfirmationCreate,
) -> AppointmentConfirmationRead:
    record = (
        db.query(AdlerAppointmentConfirmation)
        .filter(AdlerAppointmentConfirmation.tenant_id == tenant_id)
        .filter(AdlerAppointmentConfirmation.patient_id == payload.patient_id)
        .filter(AdlerAppointmentConfirmation.appointment_id == payload.appointment_id)
        .order_by(desc(AdlerAppointmentConfirmation.created_at))
        .first()
    )
    if not record:
        record = AdlerAppointmentConfirmation(
            tenant_id=tenant_id,
            patient_id=payload.patient_id,
            appointment_id=payload.appointment_id,
        )
        db.add(record)
        db.flush()

    record.status = payload.status
    record.response_text = payload.response_text

    if payload.status in {"cancelled", "missed", "no_response"}:
        severity = "high" if payload.status == "missed" else "moderate"
        _create_flag(
            db=db,
            tenant_id=tenant_id,
            patient_id=payload.patient_id,
            flag_type=f"appointment_{payload.status}",
            severity=severity,
            source="appointment_confirmation",
            evidence={"appointment_id": payload.appointment_id, "status": payload.status},
            recommended_action="Realizar contato ativo e facilitar remarcacao para reduzir abandono.",
        )

    db.commit()
    db.refresh(record)
    return _read_confirmation(record)


def create_checkin_prompt(
    *,
    db: Session,
    tenant_id: str,
    payload: CheckinPromptCreate,
) -> WhatsAppMessageRead:
    body = TEMPLATES["checkin_prompt"]["body"]
    message = AdlerWhatsappMessage(
        tenant_id=tenant_id,
        patient_id=payload.patient_id,
        direction="outbound",
        intent="structured_checkin",
        template_key="checkin_prompt",
        body=body,
        structured_payload={"patient_name": payload.patient_name},
        safety_classification="operational",
        clinical_boundary_notice=BOUNDARY_NOTICE,
    )
    db.add(message)
    db.commit()
    db.refresh(message)
    return _read_message(message)


def create_structured_checkin(
    *,
    db: Session,
    tenant_id: str,
    payload: StructuredCheckinCreate,
) -> StructuredCheckinRead:
    checkin = AdlerWhatsappCheckin(
        tenant_id=tenant_id,
        patient_id=payload.patient_id,
        mood=payload.mood,
        anxiety=payload.anxiety,
        sleep=payload.sleep,
        adherence=payload.adherence,
        notes=payload.notes,
        consent_status="consented",
    )
    message = AdlerWhatsappMessage(
        tenant_id=tenant_id,
        patient_id=payload.patient_id,
        direction="inbound",
        phone_hash=payload.phone_hash,
        intent="structured_checkin",
        body=payload.notes or "check-in estruturado",
        structured_payload=payload.model_dump(mode="json"),
        safety_classification="operational",
        clinical_boundary_notice=BOUNDARY_NOTICE,
    )
    db.add(checkin)
    db.add(message)
    db.flush()

    if (payload.anxiety is not None and payload.anxiety >= 8) or (
        payload.adherence is not None and payload.adherence <= 4
    ):
        _create_flag(
            db=db,
            tenant_id=tenant_id,
            patient_id=payload.patient_id,
            flag_type="checkin_desengajamento",
            severity="moderate",
            source="whatsapp_checkin",
            evidence=payload.model_dump(mode="json"),
            recommended_action="Avaliar necessidade de follow-up humano e revisar barreiras de adesao.",
        )

    db.commit()
    db.refresh(checkin)
    return _read_checkin(checkin)


def get_patient_whatsapp_dashboard(
    *,
    db: Session,
    tenant_id: str,
    patient_id: str,
) -> WhatsAppPatientDashboardResponse:
    messages = (
        db.query(AdlerWhatsappMessage)
        .filter(AdlerWhatsappMessage.tenant_id == tenant_id)
        .filter(AdlerWhatsappMessage.patient_id == patient_id)
        .order_by(desc(AdlerWhatsappMessage.created_at))
        .limit(10)
        .all()
    )
    confirmations = (
        db.query(AdlerAppointmentConfirmation)
        .filter(AdlerAppointmentConfirmation.tenant_id == tenant_id)
        .filter(AdlerAppointmentConfirmation.patient_id == patient_id)
        .order_by(desc(AdlerAppointmentConfirmation.created_at))
        .limit(10)
        .all()
    )
    checkins = (
        db.query(AdlerWhatsappCheckin)
        .filter(AdlerWhatsappCheckin.tenant_id == tenant_id)
        .filter(AdlerWhatsappCheckin.patient_id == patient_id)
        .order_by(desc(AdlerWhatsappCheckin.created_at))
        .limit(10)
        .all()
    )
    flags = (
        db.query(AdlerEngagementFlag)
        .filter(AdlerEngagementFlag.tenant_id == tenant_id)
        .filter(AdlerEngagementFlag.patient_id == patient_id)
        .filter(AdlerEngagementFlag.resolved_at.is_(None))
        .order_by(desc(AdlerEngagementFlag.created_at))
        .limit(10)
        .all()
    )

    return WhatsAppPatientDashboardResponse(
        patient_id=patient_id,
        recent_messages=[_read_message(item) for item in messages],
        confirmations=[_read_confirmation(item) for item in confirmations],
        checkins=[_read_checkin(item) for item in checkins],
        engagement_flags=[_read_flag(item) for item in flags],
        positioning_notice="Modulo premium operacional: agenda, lembretes e check-ins. Nao e consulta automatizada.",
    )
