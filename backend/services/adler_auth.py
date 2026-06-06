"""Authentication and tenant resolution helpers for Adler."""

from __future__ import annotations

from dataclasses import asdict, dataclass
from datetime import datetime, timezone

import httpx
from fastapi import Depends, Header, HTTPException, status
from sqlalchemy.orm import Session

from backend.core.config import settings
from backend.core.database import get_db
from backend.core.security import hash_token
from backend.models.user import User
from backend.models.user_session import UserSession
from backend.models.adler_science_knowledge import AdlerClinicianProfile


@dataclass(frozen=True)
class AdlerTenantContext:
    auth_mode: str
    clinician_name: str
    credentials: str
    email: str | None
    focus_label: str
    initials: str
    notifications: int
    primary_approach: str
    primary_approach_label: str
    role: str
    subscription_tier: str
    tenant_id: str
    user_id: str
    writing_style: str = "balanced"
    preferred_structure: str = "technical"

    def profile_payload(self) -> dict[str, object]:
        payload = asdict(self)
        payload.pop("auth_mode", None)
        payload.pop("tenant_id", None)
        payload.pop("user_id", None)
        payload.pop("email", None)
        return payload


def _demo_context() -> AdlerTenantContext:
    return AdlerTenantContext(
        auth_mode="demo",
        clinician_name="Érico Lopes",
        credentials="CRP 07/12345",
        email="erico@adler.demo",
        focus_label="Atendimento clínico adulto",
        initials="EL",
        notifications=3,
        primary_approach="schema",
        primary_approach_label="Terapia do Esquema",
        role="Psicólogo Clínico",
        subscription_tier="premium" if profile and profile.is_premium else "standard",
        tenant_id="demo-erico",
        user_id="demo-erico",
        writing_style="detailed",
        preferred_structure="technical"
    )


def _context_from_local_user(user: User, profile: AdlerClinicianProfile | None = None) -> AdlerTenantContext:
    full_name = user.name.strip() or "Clinico Adler"
    initials = "".join(part[0] for part in full_name.split()[:2]).upper() or "AD"

    return AdlerTenantContext(
        auth_mode="local-auth",
        clinician_name=full_name,
        credentials="Registro nao informado",
        email=user.email,
        focus_label="Atendimento clinico",
        initials=initials,
        notifications=0,
        primary_approach=profile.primary_approach if profile else "schema",
        primary_approach_label="Terapia do Esquema" if not profile or profile.primary_approach == "schema" else profile.primary_approach.upper(),
        role="Profissional clinico",
        subscription_tier="premium" if profile and profile.is_premium else "standard",
        tenant_id=f"user-{user.id}",
        user_id=str(user.id),
        writing_style=profile.writing_style if profile else "balanced",
        preferred_structure=profile.preferred_structure if profile else "technical"
    )


async def _supabase_user_from_token(token: str) -> dict:
    if not settings.supabase_url or not settings.supabase_anon_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Supabase ainda não configurado no ambiente.",
        )

    url = f"{settings.supabase_url.rstrip('/')}/auth/v1/user"
    headers = {
        "Authorization": f"Bearer {token}",
        "apikey": settings.supabase_anon_key,
    }

    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.get(url, headers=headers)

    if response.status_code >= 400:
        raise HTTPException(
            status_code=401,
            detail="Sessão Supabase inválida ou expirada.",
        )

    return response.json()


def _context_from_supabase_user(user_payload: dict) -> AdlerTenantContext:
    metadata = (
        user_payload.get("user_metadata")
        or user_payload.get("raw_user_meta_data")
        or {}
    )
    app_metadata = user_payload.get("app_metadata") or {}
    full_name = metadata.get("full_name") or metadata.get("name") or "Clínico Adler"
    initials = "".join(part[0] for part in full_name.split()[:2]).upper() or "AD"
    tenant_id = (
        metadata.get("clinic_id")
        or metadata.get("tenant_id")
        or app_metadata.get("tenant_id")
        or user_payload.get("id")
    )

    return AdlerTenantContext(
        auth_mode="supabase",
        clinician_name=full_name,
        credentials=metadata.get("credentials") or metadata.get("crp") or metadata.get("crm") or "Registro não informado",
        email=user_payload.get("email"),
        focus_label=metadata.get("focus_label") or "Atendimento clínico",
        initials=metadata.get("initials") or initials,
        notifications=int(metadata.get("notifications") or 0),
        primary_approach=metadata.get("primary_approach") or "schema",
        primary_approach_label=metadata.get("primary_approach_label") or "Terapia do Esquema",
        role=metadata.get("role") or "Profissional clínico",
        subscription_tier=metadata.get("subscription_tier") or app_metadata.get("subscription_tier") or "premium",
        tenant_id=str(tenant_id),
        user_id=str(user_payload.get("id")),
    )


async def resolve_adler_tenant_context(
    authorization: str | None = Header(default=None),
    x_adler_tenant_id: str | None = Header(default=None),
    db: Session = Depends(get_db),
) -> AdlerTenantContext:
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ", 1)[1].strip()
        local_session = (
            db.query(UserSession)
            .filter(UserSession.token_hash == hash_token(token))
            .filter(UserSession.expires_at > datetime.now(timezone.utc))
            .first()
        )
        if local_session:
            profile = db.query(AdlerClinicianProfile).filter(AdlerClinicianProfile.user_id == str(local_session.user_id)).first()
            return _context_from_local_user(local_session.user, profile)

        if settings.supabase_url and settings.supabase_anon_key:
            user_payload = await _supabase_user_from_token(token)
            return _context_from_supabase_user(user_payload)

        raise HTTPException(
            status_code=401,
            detail="Sessao invalida ou expirada.",
        )

    if x_adler_tenant_id:
        demo = _demo_context()
        return AdlerTenantContext(
            auth_mode="tenant-header",
            clinician_name=demo.clinician_name,
            credentials=demo.credentials,
            email=demo.email,
            focus_label=demo.focus_label,
            initials=demo.initials,
            notifications=demo.notifications,
            primary_approach=demo.primary_approach,
            primary_approach_label=demo.primary_approach_label,
            role=demo.role,
            subscription_tier=demo.subscription_tier,
            tenant_id=x_adler_tenant_id,
            user_id=x_adler_tenant_id,
            writing_style=demo.writing_style,
            preferred_structure=demo.preferred_structure
        )

    return _demo_context()
