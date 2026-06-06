from sqlalchemy.orm import Session
from backend.core.database import SessionLocal
from backend.services.adler_science_v2 import search_dsm_criteria, search_validated_medications
from backend.services.clinical_intelligence_v2 import fill_official_document

def verify():
    db = SessionLocal()
    try:
        # 1. Verify DSM Rigor
        dsm = search_dsm_criteria(db, "TAG")
        assert len(dsm) > 0
        assert "Ansiedade" in dsm[0]["content"]["criteria_a"]
        print("DSM Rigor Verified: ✓")

        # 2. Verify Med Evidence
        meds = search_validated_medications(db, "Sertralina")
        assert len(meds) > 0
        print("Med Evidence Verified: ✓")

        # 3. Verify Template Filling (Dry Run)
        res = fill_official_document(db, "system", "template-atestado-psicologico-cfp", "daniel-r", mode="manual")
        assert res["title"] == "Atestado Psicológico (CFP 06/2019)"
        assert res["mode"] == "manual"
        print("Template Filling logic Verified: ✓")

    finally:
        db.close()

if __name__ == "__main__":
    verify()
