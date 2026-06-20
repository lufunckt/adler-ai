from sqlalchemy.orm import Session
from backend.core.database import SessionLocal
from backend.models.adler_science_knowledge import AdlerOfficialDocumentTemplate

def ingest_templates():
    db: Session = SessionLocal()
    try:
        templates = [
            AdlerOfficialDocumentTemplate(
                id="atestado-psicologico-cfp",
                title="Atestado Psicológico (Modelo Oficial CFP)",
                document_type="atestado",
                official_source="Conselho Federal de Psicologia",
                maturity_level=5,
                content_structure={
                    "fields": [
                        {"name": "identificacao", "label": "Identificação do Solicitante", "type": "text"},
                        {"name": "finalidade", "label": "Finalidade", "type": "textarea"},
                        {"name": "diagnostico_cid", "label": "Diagnóstico (opcional/CID)", "type": "text"},
                        {"name": "conclusao", "label": "Conclusão e Parecer", "type": "textarea"}
                    ]
                }
            ),
            AdlerOfficialDocumentTemplate(
                id="laudo-pericial-medico",
                title="Laudo Pericial (Modelo Padrão)",
                document_type="laudo_pericial",
                official_source="Diretrizes Periciais",
                maturity_level=4,
                content_structure={
                    "fields": [
                        {"name": "historico", "label": "Histórico Clínico-Ocupacional", "type": "textarea"},
                        {"name": "exame_estado_mental", "label": "Exame do Estado Mental", "type": "textarea"},
                        {"name": "discussao", "label": "Discussão e Nexo", "type": "textarea"},
                        {"name": "conclusao", "label": "Conclusão", "type": "textarea"}
                    ]
                }
            )
        ]
        for t in templates:
            db.merge(t)
        db.commit()
        print("Official templates ingested.")
    finally:
        db.close()

if __name__ == "__main__":
    ingest_templates()
