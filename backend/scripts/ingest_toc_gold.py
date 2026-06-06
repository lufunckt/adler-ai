import json
from sqlalchemy.orm import Session
from backend.core.database import SessionLocal
from backend.models.adler_science_knowledge import (
    AdlerStaticScience,
    AdlerClinicalEvidence,
    AdlerMedicationRef,
    AdlerTherapeuticProtocol,
)

def ingest_toc():
    db: Session = SessionLocal()
    try:
        # 1. DSM-5-TR Criteria for TOC
        dsm_toc = AdlerStaticScience(
            id="criteria-toc-dsm5tr",
            source="DSM-5-TR",
            category="criteria",
            subject="TOC",
            maturity_level=5,
            content_json={
                "core_symptoms": ["Obsessões", "Compulsões"],
                "time_requirement": "Pelo menos 1 hora por dia",
                "distress_level": "Sofrimento clinicamente significativo ou prejuízo no funcionamento",
                "exclusion_criteria": ["Não atribuível a substância ou condição médica"]
            }
        )
        db.merge(dsm_toc)

        # 2. NICE Guidelines Evidence (Metapsy style)
        nice_toc = AdlerClinicalEvidence(
            id="evidence-toc-nice-2024",
            source="NICE / Metapsy",
            year=2024,
            evidence_level="Meta-analysis / Guideline",
            subject="TOC",
            maturity_level=5,
            summary="TCC (especialmente ERP) é o tratamento de primeira escolha. ISRS em doses altas são eficazes em casos moderados a graves.",
            recommendations_json=[
                "Oferecer TCC incluindo ERP a todos os pacientes.",
                "ISRS se a resposta à TCC for insuficiente.",
                "Clomipramina como 2ª linha após falha de dois ISRS."
            ]
        )
        db.merge(nice_toc)

        # 3. Stahl / Maudsley Pharmacology
        sertralina_ref = AdlerMedicationRef(
            id="ref-sertralina-stahl",
            generic_name="sertralina",
            class_name="ISRS",
            mechanism="Inibição seletiva da recaptação de serotonina (SERT)",
            maturity_level=5,
            source="Stahl's Essential Psychopharmacology",
            interactions_json={
                "tramadol": "Alto risco de síndrome serotoninérgica",
                "aines": "Risco de sangramento gastrointestinal"
            },
            monitoring_json={
                "baseline": "Função hepática (opcional)",
                "periodic": "Sódio em idosos (risco de hiponatremia)"
            }
        )
        db.merge(sertralina_ref)

        clomipramina_ref = AdlerMedicationRef(
            id="ref-clomipramina-stahl",
            generic_name="clomipramina",
            class_name="Tricíclico (TCA)",
            mechanism="Inibição da recaptação de serotonina e norepinefrina",
            maturity_level=5,
            source="Stahl's Essential Psychopharmacology",
            interactions_json={
                "anti-arrítmicos": "Risco de prolongamento do intervalo QT",
                "álcool": "Sedação profunda"
            },
            monitoring_json={
                "baseline": "ECG (intervalo QTc)",
                "periodic": "Nível sérico de clomipramina/norclomipramina"
            }
        )
        db.merge(clomipramina_ref)

        # 4. ERP Protocol
        erp_protocol = AdlerTherapeuticProtocol(
            id="protocol-erp-gold",
            name="Exposição com Prevenção de Resposta (ERP)",
            approach="cbt",
            maturity_level=5,
            steps_json=[
                "Identificação de obsessões e gatilhos",
                "Construção da hierarquia de medos (0-100 SUDs)",
                "Exposição gradual aos estímulos",
                "Prevenção rigorosa de rituais/neutralização",
                "Treino de aceitação da incerteza"
            ],
            indications="Transtorno Obsessivo-Compulsivo (TOC)"
        )
        db.merge(erp_protocol)

        db.commit()
        print("Gold Standard TOC science populated successfully.")
    except Exception as e:
        db.rollback()
        print(f"Error: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    ingest_toc()
