from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from backend.core.database import get_db
from backend.core.config import settings

router = APIRouter(prefix="/api/health", tags=["health"])

@router.get("")
def detailed_health_check(db: Session = Depends(get_db)):
    db_status = "ok"
    try:
        db.execute(text("SELECT 1"))
    except Exception as e:
        print(f"DB Health Error: {e}")
        db_status = "error"

    return {
        "status": "active",
        "environment": "production" if settings.is_production else "development",
        "database": db_status,
        "version": "2.0.0-beta"
    }
