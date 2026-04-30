"""CSV importer for the Adler scientific knowledge base."""

from __future__ import annotations

import csv
from dataclasses import dataclass
from pathlib import Path


SCIENCE_ROOT = Path(__file__).resolve().parents[2] / "adler_base_cientifica_template"


@dataclass(frozen=True)
class TableSpec:
    key: str
    output_key: str
    relative_path: str
    required_columns: tuple[str, ...]
    source_column: str | None = None


TABLE_SPECS: tuple[TableSpec, ...] = (
    TableSpec(
        key="documents",
        output_key="documents",
        relative_path="metadados/documentos.csv",
        required_columns=(
            "id",
            "titulo",
            "categoria",
            "subcategoria",
            "fonte",
            "tipo_documento",
            "ano",
            "idioma",
            "medicamento",
            "gene",
            "escala",
            "diagnostico",
            "palavras_chave",
            "arquivo",
        ),
    ),
    TableSpec(
        key="clinical_concepts",
        output_key="clinical_concepts",
        relative_path="conceitos/conceitos_clinicos.csv",
        required_columns=("conceito", "chave_clinica", "aplicacao_pratica", "fonte"),
        source_column="fonte",
    ),
    TableSpec(
        key="interactions",
        output_key="interactions",
        relative_path="interacoes/interacoes_medicamentosas.csv",
        required_columns=(
            "substancia_principal",
            "tipo_interacao",
            "agente_secundario",
            "categoria",
            "efeito",
            "gravidade",
            "conduta",
            "fonte",
        ),
        source_column="fonte",
    ),
    TableSpec(
        key="laboratory_monitoring",
        output_key="laboratory_monitoring",
        relative_path="exames/monitoramento_exames.csv",
        required_columns=(
            "medicamento",
            "exame",
            "frequencia",
            "finalidade",
            "baseline_obrigatorio",
            "alertas",
            "fonte",
        ),
        source_column="fonte",
    ),
    TableSpec(
        key="psychological_scales",
        output_key="psychological_scales",
        relative_path="escalas/escalas_psicologicas.csv",
        required_columns=(
            "nome_sigla",
            "area",
            "indicacao",
            "faixa_etaria",
            "tipo",
            "interpretacao_resumida",
            "arquivo",
        ),
    ),
    TableSpec(
        key="psychopathology",
        output_key="psychopathology",
        relative_path="psicopatologia/psicopatologias.csv",
        required_columns=(
            "psicopatologia",
            "categoria",
            "sintomas_centrais",
            "sintomas_associados",
            "curso_padrao",
            "diagnosticos_diferenciais",
            "abordagens_terapeuticas_indicadas",
            "abordagens_farmacologicas_comuns",
            "escalas_uteis",
            "observacoes_clinicas",
        ),
    ),
    TableSpec(
        key="document_models",
        output_key="document_models",
        relative_path="modelos_de_documentos/modelos_documentos.csv",
        required_columns=(
            "id",
            "titulo",
            "tipo_documento",
            "profissional",
            "uso_clinico",
            "contexto",
            "arquivo",
            "observacoes",
        ),
    ),
)


def _normalize(value: object) -> str:
    return str(value or "").strip().lower()


def _matches(value: str, needle: str | None) -> bool:
    if not needle:
        return True
    return _normalize(needle) in _normalize(value)


def _row_contains(row: dict[str, str], needle: str | None) -> bool:
    if not needle:
        return True
    normalized_needle = _normalize(needle)
    return any(normalized_needle in _normalize(value) for value in row.values())


def _read_csv(spec: TableSpec) -> tuple[list[dict[str, str]], list[dict[str, object]]]:
    path = SCIENCE_ROOT / spec.relative_path
    warnings: list[dict[str, object]] = []

    if not path.exists():
        return [], [
            {
                "table": spec.key,
                "row": None,
                "message": f"Arquivo nao encontrado: {spec.relative_path}",
            }
        ]

    with path.open("r", encoding="utf-8-sig", newline="") as csv_file:
        reader = csv.DictReader(csv_file)
        fieldnames = tuple(reader.fieldnames or ())
        missing_columns = [column for column in spec.required_columns if column not in fieldnames]
        if missing_columns:
            warnings.append(
                {
                    "table": spec.key,
                    "row": None,
                    "message": "Colunas obrigatorias ausentes: " + ", ".join(missing_columns),
                }
            )

        rows = [
            {str(key).strip(): str(value or "").strip() for key, value in row.items()}
            for row in reader
        ]

    return rows, warnings


def _validate_documents(rows: list[dict[str, str]]) -> list[dict[str, object]]:
    warnings: list[dict[str, object]] = []
    seen: set[str] = set()

    for index, row in enumerate(rows, start=2):
        document_id = row.get("id", "")
        if not document_id:
            warnings.append({"table": "documents", "row": index, "message": "Documento sem id."})
            continue
        if document_id in seen:
            warnings.append(
                {
                    "table": "documents",
                    "row": index,
                    "message": f"Documento duplicado: {document_id}",
                }
            )
        seen.add(document_id)

        source = _normalize(row.get("fonte"))
        if source in {"", "fonte_pendente", "a preencher"}:
            warnings.append(
                {
                    "table": "documents",
                    "row": index,
                    "message": f"Fonte cientifica pendente para {document_id}.",
                }
            )

    return warnings


def _validate_source_links(
    *,
    document_ids: set[str],
    rows: list[dict[str, str]],
    source_column: str,
    table: str,
) -> list[dict[str, object]]:
    warnings: list[dict[str, object]] = []

    for index, row in enumerate(rows, start=2):
        source_id = row.get(source_column, "")
        if not source_id:
            warnings.append({"table": table, "row": index, "message": "Linha sem fonte."})
            continue
        if source_id not in document_ids:
            warnings.append(
                {
                    "table": table,
                    "row": index,
                    "message": f"Fonte '{source_id}' nao existe em documentos.csv.",
                }
            )

    return warnings


def _filter_documents(
    rows: list[dict[str, str]],
    *,
    categoria: str | None,
    medicamento: str | None,
    gene: str | None,
    escala: str | None,
    diagnostico: str | None,
    query: str | None,
) -> list[dict[str, str]]:
    return [
        row
        for row in rows
        if _row_contains(row, query)
        and _matches(row.get("categoria", "") + " " + row.get("subcategoria", ""), categoria)
        and _matches(row.get("medicamento", ""), medicamento)
        and _matches(row.get("gene", ""), gene)
        and _matches(row.get("escala", ""), escala)
        and _matches(row.get("diagnostico", ""), diagnostico)
    ]


def _filter_rows(
    rows: list[dict[str, str]],
    *,
    query: str | None = None,
    medication_fields: tuple[str, ...] = (),
    medication: str | None = None,
    gene_field: str | None = None,
    gene: str | None = None,
    scale_fields: tuple[str, ...] = (),
    scale: str | None = None,
    category_field: str | None = None,
    category: str | None = None,
    severity_field: str | None = None,
    severity: str | None = None,
    diagnosis_fields: tuple[str, ...] = (),
    diagnosis: str | None = None,
    approach_field: str | None = None,
    approach: str | None = None,
) -> list[dict[str, str]]:
    filtered: list[dict[str, str]] = []

    for row in rows:
        medication_blob = " ".join(row.get(field, "") for field in medication_fields)
        scale_blob = " ".join(row.get(field, "") for field in scale_fields)
        diagnosis_blob = " ".join(row.get(field, "") for field in diagnosis_fields)

        if not _row_contains(row, query):
            continue
        if medication_fields and not _matches(medication_blob, medication):
            continue
        if gene_field and not _matches(row.get(gene_field, ""), gene):
            continue
        if scale_fields and not _matches(scale_blob, scale):
            continue
        if category_field and not _matches(row.get(category_field, ""), category):
            continue
        if severity_field and not _matches(row.get(severity_field, ""), severity):
            continue
        if diagnosis_fields and not _matches(diagnosis_blob, diagnosis):
            continue
        if approach_field and not _matches(row.get(approach_field, ""), approach):
            continue

        filtered.append(row)

    return filtered


def _filter_contextual_rows(
    rows: list[dict[str, str]],
    *,
    query: str | None = None,
    terms: tuple[str | None, ...] = (),
) -> list[dict[str, str]]:
    filtered = []
    active_terms = [term for term in terms if term]

    for row in rows:
        if not _row_contains(row, query):
            continue
        if any(not _row_contains(row, term) for term in active_terms):
            continue
        filtered.append(row)

    return filtered


def load_scientific_base(
    *,
    query: str | None = None,
    categoria: str | None = None,
    medicamento: str | None = None,
    gene: str | None = None,
    escala: str | None = None,
    diagnostico: str | None = None,
    abordagem: str | None = None,
    gravidade: str | None = None,
) -> dict[str, object]:
    raw_tables: dict[str, list[dict[str, str]]] = {}
    warnings: list[dict[str, object]] = []

    for spec in TABLE_SPECS:
        rows, table_warnings = _read_csv(spec)
        raw_tables[spec.output_key] = rows
        warnings.extend(table_warnings)

    documents = raw_tables["documents"]
    document_ids = {row.get("id", "") for row in documents if row.get("id")}
    warnings.extend(_validate_documents(documents))

    for spec in TABLE_SPECS:
        if spec.source_column:
            warnings.extend(
                _validate_source_links(
                    document_ids=document_ids,
                    rows=raw_tables[spec.output_key],
                    source_column=spec.source_column,
                    table=spec.key,
                )
            )

    filtered_documents = _filter_documents(
        documents,
        categoria=categoria,
        medicamento=medicamento,
        gene=gene,
        escala=escala,
        diagnostico=diagnostico,
        query=query,
    )
    clinical_concepts = _filter_contextual_rows(
        raw_tables["clinical_concepts"],
        query=query,
        terms=(medicamento, gene, escala, diagnostico, abordagem),
    )
    interactions = _filter_rows(
        raw_tables["interactions"],
        query=query,
        medication_fields=("substancia_principal", "agente_secundario"),
        medication=medicamento,
        severity_field="gravidade",
        severity=gravidade,
    )
    laboratory_monitoring = _filter_rows(
        raw_tables["laboratory_monitoring"],
        query=query,
        medication_fields=("medicamento",),
        medication=medicamento,
    )
    psychological_scales = _filter_rows(
        [] if medicamento or gene or gravidade else raw_tables["psychological_scales"],
        query=query,
        scale_fields=("nome_sigla", "area"),
        scale=escala,
        category_field="area",
        category=categoria,
    )
    psychopathology = _filter_rows(
        raw_tables["psychopathology"],
        query=query,
        medication_fields=("abordagens_farmacologicas_comuns",),
        medication=medicamento,
        scale_fields=("escalas_uteis",),
        scale=escala,
        category_field="categoria",
        category=categoria,
        diagnosis_fields=("psicopatologia", "diagnosticos_diferenciais"),
        diagnosis=diagnostico,
        approach_field="abordagens_terapeuticas_indicadas",
        approach=abordagem,
    )
    document_models = _filter_contextual_rows(
        raw_tables["document_models"],
        query=query,
        terms=(categoria, diagnostico, abordagem),
    )

    summary = {
        "documents": len(filtered_documents),
        "document_models": len(document_models),
        "clinical_concepts": len(clinical_concepts),
        "interactions": len(interactions),
        "laboratory_monitoring": len(laboratory_monitoring),
        "psychological_scales": len(psychological_scales),
        "psychopathology": len(psychopathology),
        "warnings": len(warnings),
    }

    return {
        "clinical_concepts": clinical_concepts,
        "document_models": document_models,
        "documents": filtered_documents,
        "filters": {
            "abordagem": abordagem,
            "categoria": categoria,
            "diagnostico": diagnostico,
            "escala": escala,
            "gene": gene,
            "gravidade": gravidade,
            "medicamento": medicamento,
            "query": query,
        },
        "interactions": interactions,
        "laboratory_monitoring": laboratory_monitoring,
        "psychological_scales": psychological_scales,
        "psychopathology": psychopathology,
        "root": str(SCIENCE_ROOT),
        "summary": summary,
        "warnings": warnings,
    }


def list_document_models(
    *,
    query: str | None = None,
    tipo_documento: str | None = None,
    profissional: str | None = None,
    contexto: str | None = None,
) -> list[dict[str, str]]:
    rows, _warnings = _read_csv(
        TableSpec(
            key="document_models",
            output_key="document_models",
            relative_path="modelos_de_documentos/modelos_documentos.csv",
            required_columns=(
                "id",
                "titulo",
                "tipo_documento",
                "profissional",
                "uso_clinico",
                "contexto",
                "arquivo",
                "observacoes",
            ),
        )
    )
    return [
        row
        for row in rows
        if _row_contains(row, query)
        and _matches(row.get("tipo_documento", ""), tipo_documento)
        and _matches(row.get("profissional", ""), profissional)
        and _matches(row.get("contexto", ""), contexto)
    ]


def get_document_model_path(model_id: str) -> tuple[dict[str, str], Path] | None:
    for model in list_document_models():
        if model.get("id") != model_id:
            continue
        relative_file = model.get("arquivo", "")
        path = (SCIENCE_ROOT / "modelos_de_documentos" / relative_file).resolve()
        models_dir = (SCIENCE_ROOT / "modelos_de_documentos").resolve()
        if not str(path).startswith(str(models_dir)) or not path.exists():
            return None
        return model, path
    return None
