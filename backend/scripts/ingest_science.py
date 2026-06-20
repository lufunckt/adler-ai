import csv
import json
from pathlib import Path

SCIENCE_ROOT = Path(__file__).resolve().parents[2] / "adler_base_cientifica_template"
OUTPUT_FILE = Path(__file__).resolve().parents[1] / "data" / "science_consolidated.json"

def ingest():
    data = {
        "concepts": [],
        "psychopathology": [],
        "interactions": [],
        "monitoring": []
    }

    # Ingest Concepts
    concepts_path = SCIENCE_ROOT / "conceitos" / "conceitos_clinicos.csv"
    if concepts_path.exists():
        with open(concepts_path, encoding='utf-8') as f:
            reader = csv.DictReader(f)
            data["concepts"] = list(reader)

    # Ingest Psychopathology
    psycho_path = SCIENCE_ROOT / "psicopatologia" / "psicopatologias.csv"
    if psycho_path.exists():
        with open(psycho_path, encoding='utf-8') as f:
            reader = csv.DictReader(f)
            data["psychopathology"] = list(reader)

    # Ingest Interactions
    inter_path = SCIENCE_ROOT / "interacoes" / "interacoes_medicamentosas.csv"
    if inter_path.exists():
        with open(inter_path, encoding='utf-8') as f:
            reader = csv.DictReader(f)
            data["interactions"] = list(reader)

    # Ingest Monitoring
    monit_path = SCIENCE_ROOT / "exames" / "monitoramento_exames.csv"
    if monit_path.exists():
        with open(monit_path, encoding='utf-8') as f:
            reader = csv.DictReader(f)
            data["monitoring"] = list(reader)

    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_FILE, "w", encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    print(f"Science base consolidated into {OUTPUT_FILE}")

if __name__ == "__main__":
    ingest()
