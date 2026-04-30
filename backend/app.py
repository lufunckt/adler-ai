"""FastAPI application entry point."""

from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from fastapi.staticfiles import StaticFiles

from backend.core.config import settings
from backend.core.database import SessionLocal, init_db
from backend.routes import (
    adler_router,
    auth_router,
    clinical_intelligence_router,
    whatsapp_router,
)
from backend.services.app_bootstrap import ensure_shared_account

app = FastAPI(title=settings.app_name, version="0.1.0")
dashboard_dir = Path(__file__).resolve().parent / "static"

allow_all_origins = "*" in settings.adler_cors_origins

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if allow_all_origins else list(settings.adler_cors_origins),
    allow_credentials=not allow_all_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup() -> None:
    init_db()
    db = SessionLocal()
    try:
        ensure_shared_account(db)
    finally:
        db.close()


@app.get("/", summary="Service health check")
def root() -> dict[str, str]:
    return {
        "status": "ok",
        "service": settings.app_name,
        "docs": "/docs",
        "health": "/api/adler/health",
    }


@app.get("/health", summary="Generic service health check")
def generic_health_check() -> dict[str, str]:
    return {"status": "ok", "service": settings.app_name}


@app.get("/app", include_in_schema=False)
def app_root() -> RedirectResponse:
    return RedirectResponse(url="/app/" if dashboard_dir.exists() else "/docs")


app.include_router(auth_router)
app.include_router(adler_router)
app.include_router(clinical_intelligence_router)
app.include_router(whatsapp_router)

if dashboard_dir.exists():
    app.mount("/app", StaticFiles(directory=dashboard_dir, html=True), name="crm-app")
