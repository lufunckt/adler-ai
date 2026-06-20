from sqlalchemy.orm import Session
from backend.core.database import SessionLocal
from backend.models.adler_science_knowledge import AdlerStaticScience

def ingest_dsm():
    db: Session = SessionLocal()
    try:
        data = [
            {
                "id": "criteria-depressao-dsm5",
                "source": "DSM-5-TR",
                "category": "criteria",
                "subject": "Depressão Maior",
                "maturity_level": 5,
                "content_json": {
                    "criteria_a": "5 ou mais sintomas por 2 semanas",
                    "symptoms": ["Humor deprimido", "Anedonia", "Alteração de peso/sono", "Agitação/retardo", "Fadiga", "Culpa/inutilidade", "Dificuldade de concentração", "Pensamentos de morte"],
                    "impairment": "Sofrimento clinicamente significativo",
                    "exclusion": "Não atribuível a substância ou luto (com critério clínico)"
                }
            },
            {
                "id": "criteria-tag-dsm5",
                "source": "DSM-5-TR",
                "category": "criteria",
                "subject": "TAG",
                "maturity_level": 5,
                "content_json": {
                    "criteria_a": "Ansiedade excessiva por pelo menos 6 meses",
                    "symptoms": ["Inquietude", "Fadiga", "Dificuldade de concentração", "Irritabilidade", "Tensão muscular", "Perturbação do sono"],
                    "control": "Dificuldade em controlar a preocupação"
                }
            }
        ]
        for item in data:
            obj = AdlerStaticScience(**item)
            db.merge(obj)
        db.commit()
        print("DSM-5 data ingested.")
    finally:
        db.close()

if __name__ == "__main__":
    ingest_dsm()
