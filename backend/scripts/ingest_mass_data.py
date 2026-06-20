from sqlalchemy.orm import Session
from backend.core.database import SessionLocal
from backend.models.adler_science_knowledge import (
    AdlerStaticScience, AdlerClinicalEvidence, AdlerMedicationRef, AdlerTherapeuticProtocol
)

def ingest():
    db = SessionLocal()
    try:
        # 1. Psychopharmacology (Mass Ingestion)
        meds = [
            {
                "id": "med-sertralina", "generic_name": "Sertralina", "class_name": "ISRS",
                "mechanism": "Inibição seletiva da recaptação de serotonina (SERT).",
                "interactions_json": {"tramadol": "Risco de síndrome serotoninérgica", "aines": "Risco de sangramento"},
                "monitoring_json": {"lab": "Sódio sérico em idosos"}, "source": "Stahl"
            },
            {
                "id": "med-venlafaxina", "generic_name": "Venlafaxina", "class_name": "IRSN",
                "mechanism": "Inibição da recaptação de serotonina e noradrenalina.",
                "interactions_json": {"imao": "Contraindicado", "alerta": "Pode elevar PA"},
                "monitoring_json": {"pressao": "Monitorar PA sistólica"}, "source": "Stahl"
            },
            {
                "id": "med-litio", "generic_name": "Lítio", "class_name": "Estabilizador",
                "mechanism": "Modulação de sistemas de segundo mensageiro e neuroproteção.",
                "interactions_json": {"diureticos": "Aumenta toxicidade", "aines": "Aumenta toxicidade"},
                "monitoring_json": {"litemia": "Nível alvo 0.6-1.2 mEq/L", "funcao_renal": "Creatinina trimestral"}, "source": "Stahl"
            },
            {
                "id": "med-quetiapina", "generic_name": "Quetiapina", "class_name": "Antipsicótico Atípico",
                "mechanism": "Antagonismo D2 e 5HT2A.",
                "interactions_json": {"sedativos": "Aumenta sedação", "alerta": "Prolongamento QT"},
                "monitoring_json": {"glicemia": "Perfil metabólico semestral"}, "source": "Stahl"
            }
        ]

        # 2. Clinical Evidence (Articles & Gold Standard)
        evidence = [
            {
                "id": "ev-tcc-depressao", "source": "NICE Guidelines NG222", "year": 2022,
                "evidence_level": "Padrão Ouro", "subject": "DEPRESSÃO",
                "summary": "TCC é recomendada como tratamento de primeira linha para depressão leve a moderada.",
                "recommendations_json": ["Ativação comportamental", "Reestruturação cognitiva"],
                "reference_icon": "ShieldCheck", "study_link": "https://www.nice.org.uk/guidance/ng222"
            },
            {
                "id": "ev-erp-toc", "source": "APA Practice Guidelines", "year": 2021,
                "evidence_level": "Meta-análise", "subject": "TOC",
                "summary": "Exposição e Prevenção de Resposta (ERP) apresenta o maior tamanho de efeito para TOC.",
                "recommendations_json": ["Hierarquia de exposição", "Prevenção de rituais"],
                "reference_icon": "Book", "study_link": "https://psychiatryonline.org/guidelines"
            }
        ]

        # 3. Therapeutic Protocols (By Approach)
        protocols = [
            {
                "id": "prot-cbt-gen", "name": "Protocolo TCC Clássico", "approach": "cbt",
                "characteristics_json": {
                    "goal": "Reestruturação cognitiva e mudança comportamental",
                    "stance": "Colaborativa e educativa",
                    "techniques": ["Questionamento socrático", "RPD", "Experimentos comportamentais"]
                },
                "indications": "Depressão, Ansiedade, TOC"
            },
            {
                "id": "prot-psycho-gen", "name": "Psicoterapia Psicodinâmica", "approach": "psychoanalysis",
                "characteristics_json": {
                    "goal": "Insight sobre conflitos inconscientes",
                    "stance": "Neutra e analítica",
                    "techniques": ["Associação livre", "Análise da transferência", "Interpretação"]
                },
                "indications": "Transtornos de personalidade, depressão recorrente"
            },
            {
                "id": "prot-schema-gen", "name": "Terapia do Esquema", "approach": "schema",
                "characteristics_json": {
                    "goal": "Modificação de Esquemas Iniciais Desadaptativos",
                    "stance": "Reparentalização limitada",
                    "techniques": ["Cadeiras vazias", "Imagens mentais", "Confrontação empática"]
                },
                "indications": "Casos complexos, Borderline, Narcisista"
            }
        ]

        for m in meds: db.merge(AdlerMedicationRef(**m))
        for e in evidence: db.merge(AdlerClinicalEvidence(**e))
        for p in protocols: db.merge(AdlerTherapeuticProtocol(**p))

        db.commit()
        print("Mass data ingestion complete.")
    finally:
        db.close()

if __name__ == "__main__":
    ingest()
