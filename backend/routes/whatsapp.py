"""Premium WhatsApp operational endpoints for Adler."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.core.database import get_db
from backend.schemas.whatsapp import (
    AppointmentConfirmationCreate,
    AppointmentConfirmationRead,
    AppointmentReminderCreate,
    CheckinPromptCreate,
    StructuredCheckinCreate,
    StructuredCheckinRead,
    WhatsAppInboundMessageCreate,
    WhatsAppInboundMessageResponse,
    WhatsAppMessageRead,
    WhatsAppPatientDashboardResponse,
    WhatsAppTemplateRead,
)
from backend.services.adler_auth import AdlerTenantContext, resolve_adler_tenant_context
from backend.services.whatsapp_module import (
    create_appointment_reminder,
    create_checkin_prompt,
    create_structured_checkin,
    get_patient_whatsapp_dashboard,
    list_templates,
    record_inbound_message,
    update_appointment_confirmation,
)

router = APIRouter(prefix="/api/adler/whatsapp", tags=["adler-whatsapp"])


def _require_premium(context: AdlerTenantContext) -> None:
    if context.subscription_tier != "premium":
        raise HTTPException(
            status_code=403,
            detail="Modulo WhatsApp disponivel apenas no Adler Premium.",
        )


@router.get("/templates", response_model=list[WhatsAppTemplateRead])
def templates(
    context: AdlerTenantContext = Depends(resolve_adler_tenant_context),
) -> list[WhatsAppTemplateRead]:
    _require_premium(context)
    return list_templates()


@router.post("/messages/inbound", response_model=WhatsAppInboundMessageResponse, status_code=201)
def inbound_message(
    payload: WhatsAppInboundMessageCreate,
    context: AdlerTenantContext = Depends(resolve_adler_tenant_context),
    db: Session = Depends(get_db),
) -> WhatsAppInboundMessageResponse:
    _require_premium(context)
    return record_inbound_message(db=db, tenant_id=context.tenant_id, payload=payload)


@router.post("/appointments/reminders", status_code=201)
def appointment_reminder(
    payload: AppointmentReminderCreate,
    context: AdlerTenantContext = Depends(resolve_adler_tenant_context),
    db: Session = Depends(get_db),
) -> dict:
    _require_premium(context)
    return create_appointment_reminder(db=db, tenant_id=context.tenant_id, payload=payload)


@router.post("/appointments/confirmations", response_model=AppointmentConfirmationRead, status_code=201)
def appointment_confirmation(
    payload: AppointmentConfirmationCreate,
    context: AdlerTenantContext = Depends(resolve_adler_tenant_context),
    db: Session = Depends(get_db),
) -> AppointmentConfirmationRead:
    _require_premium(context)
    return update_appointment_confirmation(db=db, tenant_id=context.tenant_id, payload=payload)


@router.post("/checkins/prompts", response_model=WhatsAppMessageRead, status_code=201)
def checkin_prompt(
    payload: CheckinPromptCreate,
    context: AdlerTenantContext = Depends(resolve_adler_tenant_context),
    db: Session = Depends(get_db),
) -> WhatsAppMessageRead:
    _require_premium(context)
    return create_checkin_prompt(db=db, tenant_id=context.tenant_id, payload=payload)


@router.post("/checkins", response_model=StructuredCheckinRead, status_code=201)
def structured_checkin(
    payload: StructuredCheckinCreate,
    context: AdlerTenantContext = Depends(resolve_adler_tenant_context),
    db: Session = Depends(get_db),
) -> StructuredCheckinRead:
    _require_premium(context)
    return create_structured_checkin(db=db, tenant_id=context.tenant_id, payload=payload)


@router.get("/patients/{patient_id}/dashboard", response_model=WhatsAppPatientDashboardResponse)
def patient_dashboard(
    patient_id: str,
    context: AdlerTenantContext = Depends(resolve_adler_tenant_context),
    db: Session = Depends(get_db),
) -> WhatsAppPatientDashboardResponse:
    _require_premium(context)
    return get_patient_whatsapp_dashboard(db=db, tenant_id=context.tenant_id, patient_id=patient_id)
