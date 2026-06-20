from sqlalchemy.orm import Session
from backend.core.database import SessionLocal
from backend.services.adler_science_v2 import search_dsm_criteria, search_validated_medications, list_official_templates

def test():
    db = SessionLocal()
    try:
        print("Testing DSM Search (Depressão):")
        dsm = search_dsm_criteria(db, "Depressão")
        print(dsm)

        print("\nTesting Med Search (Sertralina):")
        # Ingest a sample med first to be sure
        from backend.models.adler_science_knowledge import AdlerMedicationRef
        db.merge(AdlerMedicationRef(id="med-sertralina", generic_name="Sertralina", class_name="ISRS", mechanism="Inibição da recaptação de serotonina"))
        db.commit()

        meds = search_validated_medications(db, "Sertralina")
        print(meds)

        print("\nTesting Templates List:")
        templates = list_official_templates(db)
        print(templates)
    finally:
        db.close()

if __name__ == "__main__":
    test()
