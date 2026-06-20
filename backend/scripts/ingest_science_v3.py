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
        # 1. Psychopathology -> Static Science
        psycho_path = SCIENCE_ROOT / "psicopatologia" / "psicopatologias.csv"
        if psycho_path.exists():
            processed_ids = set()
            with open(psycho_path, encoding='utf-8') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    pid = row.get('psicopatologia')
                    if not pid or pid == 'psicopatologia': continue
                    obj_id = f"criteria-{pid}"
                    if obj_id in processed_ids: continue

                    obj = AdlerStaticScience(
                        id=obj_id,
                        source="DSM-5-TR / CID-11",
                        category="criteria",
                        subject=pid.upper(),
                        maturity_level=2,
                        content_json=row
                    )
                    db.merge(obj)
                    processed_ids.add(obj_id)

        # 2. Concepts -> Static Science
        concepts_path = SCIENCE_ROOT / "conceitos" / "conceitos_clinicos.csv"
        if concepts_path.exists():
            processed_ids = set()
            with open(concepts_path, encoding='utf-8') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    concept_name = row.get('conceito')
                    if not concept_name or concept_name == 'conceito': continue
                    cid = concept_name.lower().replace(" ", "_")
                    obj_id = f"concept-{cid}"
                    if obj_id in processed_ids: continue

                    obj = AdlerStaticScience(
                        id=obj_id,
                        source=row.get('fonte', 'Curadoria Adler'),
                        category="concept",
                        subject=concept_name.upper(),
                        maturity_level=1,
                        content_json=row
                    )
                    db.merge(obj)
                    processed_ids.add(obj_id)

        # 3. Medications
        for med in ["sertralina", "litio", "quetiapina", "valproato", "clozapina", "venlafaxina"]:
            obj = AdlerMedicationRef(
                id=f"ref-{med}",
                generic_name=med,
                class_name="Psychotropic",
                maturity_level=4,
                source="Maudsley / Stahl / NICE",
                interactions_json={},
                monitoring_json={}
            )
            db.merge(obj)

        # 4. TOC Evidence
        toc_evidence = AdlerClinicalEvidence(
            id="metapsy-toc-2024",
            source="Metapsy",
            year=2024,
            evidence_level="Meta-analysis",
            subject="TOC",
            maturity_level=5,
            summary="ERP e TCC apresentam as maiores taxas de remissão e resposta em TOC.",
            recommendations_json=["ERP as 1st line", "SSRI high dose for severe cases"]
        )
        db.merge(toc_evidence)

        # 5. ERP Protocol
        erp = AdlerTherapeuticProtocol(
            id="protocol-erp",
            name="Exposição com Prevenção de Resposta",
            approach="cbt",
            maturity_level=3,
            steps_json=["Hierarquia de medos", "Exposição in-vivo", "Prevenção de rituais"],
            indications="Transtorno Obsessivo-Compulsivo"
        )
        db.merge(erp)

        db.commit()
        print("Database science tables (v3) populated successfully with deduplication.")
    except Exception as e:
        db.rollback()
        print(f"Error during ingestion: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    ingest_to_db()
