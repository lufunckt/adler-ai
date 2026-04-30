"""Aggregate router package for the backend."""

from backend.routes.adler import router as adler_router
from backend.routes.auth import router as auth_router
from backend.routes.clinical_intelligence import router as clinical_intelligence_router
from backend.routes.whatsapp import router as whatsapp_router

__all__ = [
    "adler_router",
    "whatsapp_router",
    "auth_router",
    "clinical_intelligence_router",
]
