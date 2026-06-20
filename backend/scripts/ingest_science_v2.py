import csv
import json
from pathlib import Path
from sqlalchemy.orm import Session
from backend.core.database import SessionLocal
from backend.models.adler_science_knowledge import (
    AdlerStaticScience,
    AdlerClinicalEvidence,
    AdlerMedicationRef,
    AdlerTherapeuticProtocol,
)

SCIENCE_ROOT = Path(__file__).resolve().parents[2] / "adler_base_cientifica_template"

def ingest_to_db():
    db: Session = SessionLocal()
    try:
        # 1. Ingest Psychopathology as Static Science (Criteria)
        psycho_path = SCIENCE_ROOT / "psicopatologia" / "psicopatologias.csv"
        if psycho_path.exists():
            with open(psycho_path, encoding='utf-8') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    obj = AdlerStaticScience(
                        id=f"criteria-{row['psicopatologia']}",
                        source="DSM-5-TR / CID-11",
                        category="criteria",
                        subject=row['psicopatologia'].upper(),
                        content_json=row
                    )
                    db.merge(obj)

        # 2. Ingest Medications as MedicationRef
        # We consolidate monitoring and interactions into the MedicationRef
        # This is a simplification for the script
        meds = ["sertralina", "litio", "quetiapina", "valproato", "clozapina"]
        for med in meds:
            obj = AdlerMedicationRef(
                id=f"ref-{med}",
                generic_name=med,
                class_name="Psychotropic",
                mechanism="Receptor modulation",
                interactions_json={"alert": "Technical ref needed"},
                monitoring_json={"standard": "Baseline + Periodic"},
                source="Maudsley / Stahl"
            )
            db.merge(obj)

        # 3. Add TOC specific evidence (Metapsy style)
        toc_evidence = AdlerClinicalEvidence(
            id="metapsy-toc-2024",
            source="Metapsy",
            year=2024,
            evidence_level="Meta-analysis",
            subject="TOC",
            summary="ERP e TCC apresentam as maiores taxas de remissão e resposta em TOC.",
            recommendations_json=["ERP as 1st line", "SSRI high dose for severe cases"]
        )
        db.merge(toc_evidence)

        # 4. Add ERP Protocol
        erp = AdlerTherapeuticProtocol(
            id="protocol-erp",
            name="Exposição com Prevenção de Resposta",
            approach="cbt",
            steps_json=["Hierarquia de medos", "Exposição in-vivo", "Prevenção de rituais"],
            indications="Transtorno Obsessivo-Compulsivo"
        )
        db.merge(erp)

        db.commit()
        print("Database science tables populated successfully.")
    finally:
        db.close()

if __name__ == "__main__":
    ingest_to_db()
