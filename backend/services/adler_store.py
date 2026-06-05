"""Durable store and workspace builders for Adler AI."""

from __future__ import annotations

import json
from copy import deepcopy
from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4

from fastapi import HTTPException, UploadFile
from sqlalchemy.orm import Session

from backend.models.adler_patient import AdlerAppointment, AdlerPatient
from backend.models.adler_workspace import AdlerTenantDocument, AdlerTenantNote
from backend.models.adler_clinical import AdlerClinicalAnalysis
from backend.schemas.adler import ClinicalApproach, PatientStatus
from backend.services.adler_auth import AdlerTenantContext

# Nota: Mantemos perfis de abordagem e clinician profile fixos por enquanto,
# pois representam metadados do sistema ou do plano.
CLINICIAN_PROFILE = {
    "name": "Érico Lopes",
    "initials": "EL",
    "credentials": "CRP 07/12345",
    "role": "Psicólogo Clínico",
    "primary_approach": "schema",
    "primary_approach_label": "Terapia do Esquema",
    "subscription_tier": "standard",
    "allowed_approaches": ["schema"],
    "notifications": 0,
    "focus_label": "Atendimento clínico adulto",
}

APPROACH_PROFILES: dict[ClinicalApproach, dict] = {
    "schema": {
        "summary": "O paciente {name} apresenta evolução estável na sessão {session}. O foco atual na Terapia do Esquema está na redução da hipercriticidade e fortalecimento do Adulto Saudável.",
        "clinical_frame": "Observa-se ativação recorrente de esquemas de 'Padrões Inflexíveis' e 'Privação Emocional' em contextos de pressão laboral.",
        "risk_label": "Monitoramento de Autoexigência",
        "risk_base": 32,
        "insights": [
            ("Vulnerabilidade de Esquema", "O paciente {name} demonstra maior consciência dos modos críticos."),
            ("Conexão Terapêutica", "Aliança sólida favorece o trabalho de reparentalização."),
        ],
    },
    "cbt": {
        "summary": "O paciente {name} completou a sessão {session}. Progressos notáveis na reestruturação cognitiva e manejo de ansiedade situacional.",
        "clinical_frame": "Identificação de pensamentos automáticos catastróficos e experimentos comportamentais bem-sucedidos.",
        "risk_label": "Gestão de Ansiedade",
        "risk_base": 28,
        "insights": [
            ("Flexibilidade Cognitiva", "{name} começa a questionar evidências de distorções."),
            ("Adesão", "Excelente compromisso com as tarefas de casa."),
        ],
    },
}

DEFAULT_NOTES = """• Bem-vindo ao Adler AI. Utilize este espaço para suas anotações rápidas."""

def _utc_now() -> datetime:
    return datetime.now(timezone.utc)

def _patient_record_to_registry_item(record: AdlerPatient) -> dict:
    return {
        "id": record.id,
        "name": record.name,
        "initials": record.initials,
        "focus": record.focus,
        "diagnosis": record.diagnosis,
        "current_protocol": record.current_protocol,
        "default_session": record.default_session,
        "status": record.status,
    }

def _patient_record_to_payload(record: AdlerPatient) -> dict:
    return {
        "id": record.id,
        "name": record.name,
        "initials": record.initials,
        "focus": record.focus,
        "diagnosis": record.diagnosis,
        "current_protocol": record.current_protocol,
        "default_session": record.default_session,
        "status": record.status,
        "recorder_title": f"Sessão {record.default_session} // Em andamento",
        "recorder_duration": "00:00",
        "recorder_summary": "Aguardando análise da sessão.",
        "transcripts": [],
        "primary_medication": None,
        "secondary_medication": None,
        "genetics": None,
        "pharmacokinetic": None,
        "pharmacodynamic": None,
        "interactions": [],
        "differential_alert": None,
    }

def _appointment_record_to_payload(record: AdlerAppointment, patient_name: str) -> dict:
    return {
        "id": record.id,
        "patient_id": record.patient_id,
        "patient_name": patient_name,
        "time": record.time,
        "duration": record.duration,
        "session_label": record.session_label,
        "mode": record.mode,
        "room_label": record.room_label,
        "prep_note": record.prep_note,
        "status": record.status,
    }

def _note_record_to_payload(record: AdlerTenantNote) -> dict:
    return {
        "value": record.value,
        "updated_at": record.updated_at.isoformat() if record.updated_at else None,
    }

def _document_record_to_payload(record: AdlerTenantDocument) -> dict:
    return {
        "id": record.id,
        "patient_id": record.patient_id,
        "patient_name": record.patient_name,
        "name": record.name,
        "mime_type": record.mime_type,
        "size_bytes": record.size_bytes,
        "uploaded_at": record.uploaded_at.isoformat(),
    }

def get_clinician_profile(context: AdlerTenantContext) -> dict:
    return deepcopy(CLINICIAN_PROFILE)

def ensure_patient_seed(db: Session, tenant_id: str) -> None:
    """Garante que o tenant tenha pacientes iniciais se estiver vazio."""
    count = db.query(AdlerPatient).filter(AdlerPatient.tenant_id == tenant_id).count()
    if count > 0:
        return

    # Seed de pacientes
    patients = [
        AdlerPatient(
            id="sarah-m",
            tenant_id=tenant_id,
            name="Sarah M.",
            initials="SM",
            focus="OCD / health anxiety",
            diagnosis="Obsessive-compulsive spectrum",
            current_protocol="CBT exposure",
            default_session=18,
            status="active",
        ),
        AdlerPatient(
            id="daniel-r",
            tenant_id=tenant_id,
            name="Daniel R.",
            initials="DR",
            focus="Major depression",
            diagnosis="Depressive episode",
            current_protocol="Behavioral activation",
            default_session=16,
            status="active",
        ),
    ]
    db.add_all(patients)

    # Seed de agenda
    appointments = [
        AdlerAppointment(
            id=str(uuid4()),
            tenant_id=tenant_id,
            patient_id="daniel-r",
            time="09:00",
            duration="50 min",
            session_label="Sessão de continuidade",
            mode="Online",
            room_label="Sala Atlas",
            prep_note="Revisar ativação comportamental.",
            status="completed",
            sort_order=1,
        ),
        AdlerAppointment(
            id=str(uuid4()),
            tenant_id=tenant_id,
            patient_id="sarah-m",
            time="11:00",
            duration="50 min",
            session_label="Sessão focada em rituais",
            mode="Presencial",
            room_label="Consultório 02",
            prep_note="Checar resposta à exposição.",
            status="next",
            sort_order=2,
        ),
    ]
    db.add_all(appointments)
    db.commit()

def _load_or_create_notes_record(db: Session, tenant_id: str) -> AdlerTenantNote:
    record = db.query(AdlerTenantNote).filter(AdlerTenantNote.tenant_id == tenant_id).first()
    if not record:
        record = AdlerTenantNote(
            tenant_id=tenant_id,
            value=DEFAULT_NOTES,
            updated_at=_utc_now(),
        )
        db.add(record)
        db.commit()
        db.refresh(record)
    return record

def load_notes(db: Session, tenant_id: str) -> dict:
    record = _load_or_create_notes_record(db, tenant_id)
    return _note_record_to_payload(record)

def save_notes(db: Session, tenant_id: str, value: str) -> dict:
    record = _load_or_create_notes_record(db, tenant_id)
    record.value = value
    record.updated_at = _utc_now()
    db.add(record)
    db.commit()
    db.refresh(record)
    return _note_record_to_payload(record)

def list_patients(
    search: str | None = None,
    status: str = "all",
    db: Session | None = None,
    tenant_id: str | None = None,
) -> list[dict]:
    if db is None or tenant_id is None:
        raise HTTPException(status_code=500, detail="Banco de dados não disponível.")

    ensure_patient_seed(db, tenant_id)
    query = db.query(AdlerPatient).filter(AdlerPatient.tenant_id == tenant_id)
    if status != "all":
        query = query.filter(AdlerPatient.status == status)

    records = query.order_by(AdlerPatient.name.asc()).all()
    results = [_patient_record_to_registry_item(record) for record in records]

    normalized_search = (search or "").strip().lower()
    if normalized_search:
        results = [
            p for p in results
            if normalized_search in p["name"].lower() or
               normalized_search in p["focus"].lower() or
               normalized_search in p["diagnosis"].lower()
        ]
    return results

def get_patient(patient_id: str, db: Session | None = None, tenant_id: str | None = None) -> dict:
    if db is None or tenant_id is None:
        raise HTTPException(status_code=500, detail="Banco de dados não disponível.")

    ensure_patient_seed(db, tenant_id)
    record = db.query(AdlerPatient).filter(
        AdlerPatient.tenant_id == tenant_id,
        AdlerPatient.id == patient_id
    ).first()

    if not record:
        raise HTTPException(status_code=404, detail="Paciente não encontrado.")
    return _patient_record_to_payload(record)

def get_dashboard(db: Session, context: AdlerTenantContext) -> dict:
    ensure_patient_seed(db, context.tenant_id)
    notes_payload = load_notes(db, context.tenant_id)

    patient_records = db.query(AdlerPatient).filter(AdlerPatient.tenant_id == context.tenant_id).all()
    patients_by_id = {record.id: record for record in patient_records}

    active_count = sum(1 for p in patient_records if p.status == "active")
    inactive_count = sum(1 for p in patient_records if p.status == "inactive")

    appointments = db.query(AdlerAppointment).filter(
        AdlerAppointment.tenant_id == context.tenant_id
    ).order_by(AdlerAppointment.sort_order.asc(), AdlerAppointment.time.asc()).all()

    schedule = [
        _appointment_record_to_payload(
            record,
            patients_by_id[record.patient_id].name if record.patient_id in patients_by_id else "Paciente"
        )
        for record in appointments
    ]

    return {
        "clinician": get_clinician_profile(context),
        "notes": notes_payload["value"],
        "recent_notes": [],
        "schedule": schedule,
        "tasks": [],
        "summary": {
            "active_patients": active_count,
            "inactive_patients": inactive_count,
            "pending_tasks": 0,
            "sessions_today": len(schedule),
            "notes_last_updated_at": notes_payload["updated_at"],
        },
    }

def bootstrap_payload(db: Session, context: AdlerTenantContext) -> dict:
    return {
        "dashboard": get_dashboard(db, context),
        "documents": list_documents(db, context.tenant_id),
        "patients": list_patients(db=db, tenant_id=context.tenant_id),
    }

def _risk_snapshot(approach: ClinicalApproach, session: int) -> dict:
    profile = APPROACH_PROFILES.get(approach, APPROACH_PROFILES["schema"])
    base_score = int(profile["risk_base"])
    progression = max(0, 18 - session)
    score = min(72, base_score + progression * 3)
    severity = "critical" if score >= 60 else "elevated" if score >= 45 else "stable"

    return {
        "focus_label": profile["risk_label"],
        "note": "Análise de risco longitudinal baseada no histórico de sessões.",
        "score": score,
        "severity": severity,
    }

def build_workspace_snapshot(
    patient_id: str,
    approach: ClinicalApproach,
    session: int | None = None,
    db: Session | None = None,
    tenant_id: str | None = None,
) -> dict:
    patient = get_patient(patient_id, db=db, tenant_id=tenant_id)
    selected_session = session or int(patient["default_session"])
    first_name = patient["name"].split(" ")[0]
    profile = APPROACH_PROFILES.get(approach, APPROACH_PROFILES["schema"])

    # Tenta buscar analise real se db estiver disponivel
    real_analysis = None
    if db is not None and tenant_id is not None:
        real_analysis = db.query(AdlerClinicalAnalysis).filter(
            AdlerClinicalAnalysis.tenant_id == tenant_id,
            AdlerClinicalAnalysis.patient_id == patient_id,
            AdlerClinicalAnalysis.session_number == selected_session
        ).order_by(AdlerClinicalAnalysis.version.desc()).first()

    insights = []
    summary_text = profile["summary"].format(name=first_name, session=selected_session)
    clinical_frame = profile["clinical_frame"]

    if real_analysis and real_analysis.analysis_json:
        data = real_analysis.analysis_json
        if data.get("resumo_executivo"):
            summary_text = data["resumo_executivo"]
        if data.get("quadro_clinico"):
            clinical_frame = data["quadro_clinico"]

        # Converte hipoteses ou alertas reais em insights se existirem
        real_insights = data.get("hipoteses", []) + data.get("alertas", [])
        for idx, item in enumerate(real_insights[:4], start=1):
            insights.append({
                "id": f"real-{idx}",
                "title": item.get("titulo") or item.get("descricao") or "Insight Clínico",
                "description": item.get("descricao") or item.get("justificativa") or "",
                "confidence": item.get("confianca", 80)
            })

    # Fallback/Complemento com insights do profile se necessário
    if len(insights) < 2:
        for idx, (title, desc) in enumerate(profile["insights"], start=1):
            insights.append({
                "id": f"{approach}-{idx}",
                "title": title,
                "description": desc.format(name=first_name),
                "confidence": 85 - (idx * 5),
            })

    return {
        "approach": approach,
        "patient": patient,
        "selected_session": selected_session,
        "summary": summary_text,
        "clinical_frame": clinical_frame,
        "insights": insights,
        "risk": _risk_snapshot(approach, selected_session),
    }

def list_documents(db: Session, tenant_id: str, patient_id: str | None = None) -> list[dict]:
    query = db.query(AdlerTenantDocument).filter(AdlerTenantDocument.tenant_id == tenant_id)
    if patient_id:
        query = query.filter(AdlerTenantDocument.patient_id == patient_id)

    records = query.order_by(AdlerTenantDocument.uploaded_at.desc()).all()
    return [_document_record_to_payload(record) for record in records]

def save_document(db: Session, tenant_id: str, file: UploadFile, patient_id: str | None) -> dict:
    if file.content_type not in {"application/pdf", "application/x-pdf"}:
        raise HTTPException(status_code=400, detail="Apenas PDFs são aceitos.")

    file_id = str(uuid4())
    raw = file.file.read()

    patient_name = None
    if patient_id:
        patient_name = get_patient(patient_id, db=db, tenant_id=tenant_id)["name"]

    record = AdlerTenantDocument(
        id=file_id,
        tenant_id=tenant_id,
        patient_id=patient_id,
        patient_name=patient_name,
        name=file.filename or f"documento-{file_id}.pdf",
        mime_type=file.content_type or "application/pdf",
        size_bytes=len(raw),
        file_bytes=raw,
        uploaded_at=_utc_now(),
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return _document_record_to_payload(record)

def get_document_blob(db: Session, tenant_id: str, document_id: str) -> tuple[dict, bytes]:
    record = db.query(AdlerTenantDocument).filter(
        AdlerTenantDocument.tenant_id == tenant_id,
        AdlerTenantDocument.id == document_id
    ).first()

    if not record:
        raise HTTPException(status_code=404, detail="Documento não encontrado.")

    return _document_record_to_payload(record), bytes(record.file_bytes)

def delete_document(db: Session, tenant_id: str, document_id: str) -> None:
    record = db.query(AdlerTenantDocument).filter(
        AdlerTenantDocument.tenant_id == tenant_id,
        AdlerTenantDocument.id == document_id
    ).first()

    if not record:
        raise HTTPException(status_code=404, detail="Documento não encontrado.")

    db.delete(record)
    db.commit()

def build_patients_csv(db: Session | None = None, tenant_id: str | None = None) -> str:
    lines = ['"nome","status","foco","diagnostico","protocolo_atual"']
    patients = list_patients(db=db, tenant_id=tenant_id)
    for patient in patients:
        row = [
            patient["name"],
            patient["status"],
            patient["focus"],
            patient["diagnosis"],
            patient["current_protocol"],
        ]
        escaped_row = [f'"{str(value).replace(chr(34), chr(34) * 2)}"' for value in row]
        lines.append(",".join(escaped_row))
    return "\n".join(lines)

def create_patient(db: Session, tenant_id: str, payload: PatientCreate) -> dict:
    patient_id = str(uuid4())[:8]
    initials = "".join(p[0] for p in payload.name.split()[:2]).upper()

    record = AdlerPatient(
        id=patient_id,
        tenant_id=tenant_id,
        name=payload.name,
        initials=initials,
        focus=payload.focus or "Avaliação inicial",
        diagnosis="Em investigação",
        current_protocol="Avaliação inicial",
        default_session=1,
        status="active",
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return _patient_record_to_registry_item(record)

def create_appointment(db: Session, tenant_id: str, payload: AppointmentCreate) -> dict:
    # Se nao houver id mas houver nome, tentamos achar ou criamos um paciente basico
    p_id = payload.patient_id
    p_name = payload.patient_name or "Paciente"

    if not p_id and payload.patient_name:
        existing = db.query(AdlerPatient).filter(
            AdlerPatient.tenant_id == tenant_id,
            AdlerPatient.name == payload.patient_name
        ).first()
        if existing:
            p_id = existing.id
        else:
            new_p = create_patient(db, tenant_id, PatientCreate(name=payload.patient_name))
            p_id = new_p["id"]
            p_name = new_p["name"]

    record = AdlerAppointment(
        id=str(uuid4()),
        tenant_id=tenant_id,
        patient_id=p_id or "unknown",
        time=payload.time,
        duration=payload.duration,
        session_label=payload.session_label,
        mode=payload.mode,
        room_label=payload.room_label,
        prep_note=payload.prep_note,
        status="scheduled",
        sort_order=99,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return _appointment_record_to_payload(record, p_name)
