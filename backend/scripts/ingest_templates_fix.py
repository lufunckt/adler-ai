from sqlalchemy.orm import Session
from backend.core.database import SessionLocal
from backend.models.adler_science_knowledge import AdlerOfficialDocumentTemplate

def ingest_templates():
    db: Session = SessionLocal()
    try:
        data = [
            {
                "id": "template-atestado-psicologico-cfp",
                "title": "Atestado Psicológico (CFP 06/2019)",
                "document_type": "atestado",
                "official_source": "Conselho Federal de Psicologia",
                "maturity_level": 5,
                "content_structure": {
                    "header": "Identificação do Psicólogo",
                    "patient_info": "Nome, CPF, Data de Nascimento",
                    "body": "Finalidade e declaração de acompanhamento",
                    "signature": "Local, data e assinatura com CRP"
                }
            },
            {
                "id": "template-laudo-pericial-forense",
                "title": "Laudo Pericial Forense (Padrão Criminal)",
                "document_type": "laudo",
                "official_source": "Adler Forensic Base",
                "maturity_level": 4,
                "content_structure": {
                    "header": "Dados Processuais",
                    "methodology": "Entrevistas, testes e análise documental",
                    "analysis": "Exame das funções psíquicas",
                    "conclusion": "Capacidade civil/criminal"
                }
            }
        ]
        for item in data:
            obj = AdlerOfficialDocumentTemplate(**item)
            db.merge(obj)
        db.commit()
        print("Official templates ingested.")
    finally:
        db.close()

if __name__ == "__main__":
    ingest_templates()
