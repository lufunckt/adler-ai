"""Medication search helpers for Adler.

The public APIs are used as validation/normalization aids. The clinical
interpretation stays anchored in Adler's curated CSV base so the demo remains
usable when public networks are unavailable.
"""

from __future__ import annotations

from typing import Any

import httpx

from backend.services.adler_science import load_scientific_base


RXNAV_DRUGS_URL = "https://rxnav.nlm.nih.gov/REST/drugs.json"
OPENFDA_LABEL_URL = "https://api.fda.gov/drug/label.json"

MEDICATION_ALIASES = {
    "alcool": "alcohol",
    "álcool": "alcohol",
    "bupropiona": "bupropion",
    "carbamazepina": "carbamazepine",
    "fluoxetina": "fluoxetine",
    "ibuprofeno": "ibuprofen",
    "lamotrigina": "lamotrigine",
    "litio": "lithium",
    "lítio": "lithium",
    "lorazepam": "lorazepam",
    "naltrexona": "naltrexone",
    "quetiapina": "quetiapine",
    "sertralina": "sertraline",
    "venlafaxina": "venlafaxine",
}

LOCAL_MEDICATION_NAMES = {
    "alcohol": "alcool",
    "bupropion": "bupropiona",
    "carbamazepine": "carbamazepina",
    "fluoxetine": "fluoxetina",
    "ibuprofen": "ibuprofeno",
    "lamotrigine": "lamotrigina",
    "lithium": "litio",
    "lorazepam": "lorazepam",
    "naltrexone": "naltrexona",
    "quetiapine": "quetiapina",
    "sertraline": "sertralina",
    "venlafaxine": "venlafaxina",
}

MEDICATION_EVIDENCE_PROFILES: dict[str, dict[str, Any]] = {
    "sertraline": {
        "display_name": "Sertralina",
        "class_name": "ISRS",
        "mechanism": "Inibicao seletiva do transportador de serotonina (SERT), com aumento de disponibilidade serotoninergica sinaptica.",
        "initial_dose": "25-50 mg/dia conforme tolerabilidade e indicacao clinica.",
        "max_dose": "Ate 200 mg/dia em adultos, com titulacao gradual e revisao clinica.",
        "indications": [
            "Transtorno depressivo maior",
            "TOC",
            "Transtorno do panico",
            "TEPT",
            "TAG conforme contexto clinico",
        ],
        "gold_standard": [
            "1a linha para depressao e transtornos ansiosos em diretrizes psiquiatricas internacionais.",
            "Em TOC, pode exigir dose mais alta e tempo de resposta maior que em depressao.",
            "Combinar com psicoterapia estruturada quando ha prejuizo funcional ou resposta parcial.",
        ],
        "clinical_trials": [
            "Evidencia robusta para depressao e ansiedade; perfil de seguranca cardiovascular geralmente favoravel frente a triciclicos.",
            "Monitorar ativacao inicial, sintomas gastrointestinais, disfuncao sexual e risco de virada maniaca em vulnerabilidade bipolar.",
        ],
        "pharmacokinetics": [
            "Metabolismo hepatico com participacao de CYP2C19, CYP2D6, CYP2B6 e CYP3A4.",
            "Meia-vida aproximada de 24-32h; metabolito desmetilsertralina tem atividade clinica menor.",
            "Inibicao leve a moderada de CYP2D6 pode elevar exposicao de substratos sensiveis.",
        ],
        "pharmacodynamics": [
            "Ganho terapeutico esperado por modulacao serotoninergica progressiva.",
            "Risco farmacodinamico de sindrome serotoninergica quando combinada a IMAO, linezolida, triptanos ou outros serotoninergicos.",
            "Associacao com sedativos pode ampliar lentificacao, sonolencia ou prejuizo psicomotor.",
        ],
        "personalization_criteria": [
            "Historia de bipolaridade antes de antidepressivo.",
            "Efeitos adversos sexuais, gastrointestinais e sono.",
            "Interacoes com outros serotoninergicos ou substratos CYP2D6.",
            "Farmacogenetica CYP2C19/CYP2D6 quando houver falha, eventos adversos ou polifarmacia.",
        ],
        "monitoring_summary": "Reavaliar resposta em 4-6 semanas, adesao, efeitos adversos, risco suicida e sinais de ativacao/maniformes.",
        "genetic_notes": [
            "CYP2C19 pode influenciar exposicao de alguns ISRS; interpretar somente com teste externo validado.",
            "Resultado farmacogenetico nao substitui acompanhamento de resposta clinica e tolerabilidade.",
        ],
        "contraindication_flags": [
            "Uso concomitante ou recente de IMAO.",
            "Suspeita de transtorno bipolar sem estabilizacao adequada.",
            "Sangramento aumentado quando associado a anticoagulantes/antiagregantes deve ser considerado.",
        ],
        "evidence_level": "Alta confianca para indicacoes nucleares; personalizacao depende do caso.",
    },
    "lithium": {
        "display_name": "Litio",
        "class_name": "Estabilizador do humor",
        "mechanism": "Modulacao de sinalizacao intracelular e neuroplasticidade, com efeito estabilizador do humor e reducao de recorrencia.",
        "initial_dose": "Dose inicial individualizada com titulacao por litemia e tolerabilidade.",
        "max_dose": "Ajustada por nivel serico, funcao renal, idade, comorbidades e interacoes.",
        "indications": ["Transtorno bipolar tipo I", "Manutencao do humor", "Reducao de risco suicida em contextos selecionados"],
        "gold_standard": [
            "Referencia classica para manutencao do transtorno bipolar e prevencao de recaidas.",
            "Exige monitoramento laboratorial por faixa terapeutica estreita.",
        ],
        "clinical_trials": [
            "Evidencia historica e consistente em prevencao de episodios maniacos e recorrencias.",
            "Beneficio deve ser pesado contra toxicidade renal, tireoidiana e neurologica.",
        ],
        "pharmacokinetics": [
            "Eliminacao predominantemente renal; alteracoes de hidratacao e sodio modificam litemia.",
            "AINEs, diureticos e IECA/BRA podem aumentar niveis sericos.",
        ],
        "pharmacodynamics": [
            "Efeito estabilizador progressivo, sem efeito antidepressivo agudo isolado como regra.",
            "Toxicidade pode cursar com tremor grosseiro, ataxia, diarreia, vomitos, sonolencia e confusao.",
        ],
        "personalization_criteria": [
            "Funcao renal basal e longitudinal.",
            "TSH/T4 livre e historia tireoidiana.",
            "Uso de AINEs, diureticos, IECA/BRA e padrao de hidratacao.",
            "Risco suicida, recorrencia e adesao a exames.",
        ],
        "monitoring_summary": "Litemia 12h, creatinina/ureia, TSH/T4 livre, eletrolitos e revisao de sinais de toxicidade.",
        "genetic_notes": ["Nao ha decisao de rotina baseada em farmacogenetica no MVP; foco em litemia e seguranca clinica."],
        "contraindication_flags": [
            "Doenca renal importante ou impossibilidade de monitoramento.",
            "Desidratacao, hiponatremia ou interacoes que elevem litemia sem controle.",
        ],
        "evidence_level": "Alta confianca quando monitorado corretamente.",
    },
    "quetiapine": {
        "display_name": "Quetiapina",
        "class_name": "Antipsicotico atipico",
        "mechanism": "Antagonismo serotoninergico/dopaminergico e efeitos anti-histaminicos/adrenergicos dose-dependentes.",
        "initial_dose": "Dose depende da indicacao; titule com cautela por sedacao e hipotensao.",
        "max_dose": "Variavel conforme indicacao e formulacao; revisar bula e diretriz.",
        "indications": ["Transtorno bipolar", "Esquizofrenia", "Depressao bipolar", "Adjuvancia em casos selecionados"],
        "gold_standard": [
            "Base de evidencia relevante em transtorno bipolar e psicose.",
            "Monitoramento metabolico e cardiovascular e parte da decisao clinica.",
        ],
        "clinical_trials": [
            "Eficacia em sintomas psicoticos e episodios de humor em indicacoes aprovadas.",
            "Sedacao e ganho metabolico podem limitar continuidade.",
        ],
        "pharmacokinetics": [
            "Metabolismo hepatico predominantemente por CYP3A4.",
            "Indutores/inibidores fortes de CYP3A4 podem alterar exposicao.",
        ],
        "pharmacodynamics": [
            "Sedacao por H1 e alfa-1 pode ser util ou limitante.",
            "Risco metabolico inclui ganho de peso, dislipidemia e alteracao glicemica.",
        ],
        "personalization_criteria": [
            "Peso, IMC, glicemia, lipidograma e historia cardiometabolica.",
            "Sedacao diurna e prejuizo funcional.",
            "Uso concomitante de alcool ou outros depressores do SNC.",
        ],
        "monitoring_summary": "Peso/IMC, glicemia, perfil lipidico, PA e avaliacao de sedacao/hipotensao.",
        "genetic_notes": ["No MVP, priorizar interacoes CYP3A4 e monitoramento metabolico sobre genetica."],
        "contraindication_flags": ["Combinacao com alcool ou sedativos pode aumentar sedacao.", "Risco metabolico alto sem acompanhamento."],
        "evidence_level": "Moderada a alta conforme indicacao.",
    },
    "venlafaxine": {
        "display_name": "Venlafaxina",
        "class_name": "IRSN",
        "mechanism": "Inibicao de recaptação de serotonina e noradrenalina, com efeito noradrenergico mais evidente em doses maiores.",
        "initial_dose": "37,5-75 mg/dia conforme formulacao e tolerabilidade.",
        "max_dose": "Ate 225 mg/dia em muitos protocolos; revisar indicacao e PA.",
        "indications": ["Depressao", "TAG", "Transtorno do panico", "Ansiedade social"],
        "gold_standard": ["Opcao baseada em evidencia para depressao e ansiedade, especialmente em resposta parcial a ISRS."],
        "clinical_trials": ["Monitorar pressao arterial, sintomas de retirada e ativacao."],
        "pharmacokinetics": ["Metabolizada por CYP2D6 para O-desmetilvenlafaxina.", "Meia-vida curta pode favorecer sintomas de descontinuacao."],
        "pharmacodynamics": ["Aumento noradrenergico pode elevar PA em alguns pacientes.", "Risco serotoninergico em combinacoes."],
        "personalization_criteria": ["PA basal", "historico de retirada", "CYP2D6 quando eventos adversos ou baixa resposta."],
        "monitoring_summary": "PA, ansiedade/ativacao, adesao e sintomas de descontinuacao.",
        "genetic_notes": ["CYP2D6 pode influenciar relacao venlafaxina/desvenlafaxina."],
        "contraindication_flags": ["Hipertensao nao controlada exige cautela.", "Associacao com IMAO e contraindicada."],
        "evidence_level": "Alta confianca para depressao e alguns transtornos ansiosos.",
    },
    "lorazepam": {
        "display_name": "Lorazepam",
        "class_name": "Benzodiazepinico",
        "mechanism": "Modulacao alosterica positiva do receptor GABA-A, aumentando inibicao neuronal.",
        "initial_dose": "0,5-1 mg conforme situacao clinica, idade e risco de sedacao.",
        "max_dose": "Individualizada; evitar uso prolongado sem plano de revisao/desmame.",
        "indications": ["Ansiedade aguda", "Insônia de curto prazo em casos selecionados", "Agitacao sob avaliacao medica"],
        "gold_standard": [
            "Utilidade maior como ponte sintomatica de curto prazo, nao como tratamento central cronico.",
            "Planejar duracao, revisao e retirada gradual quando indicado.",
        ],
        "clinical_trials": ["Eficaz para reducao aguda de hiperalerta, mas com risco de dependencia, tolerancia e quedas."],
        "pharmacokinetics": ["Metabolismo por glucuronidacao; menos dependente de CYP que muitos benzodiazepinicos."],
        "pharmacodynamics": ["Sedacao, prejuizo psicomotor e depressao do SNC aumentam com alcool/opioides/outros sedativos."],
        "personalization_criteria": ["Idade", "risco de quedas", "uso de alcool/substancias", "historia de dependencia", "trabalho que exige alerta."],
        "monitoring_summary": "Sedacao diurna, memoria, quedas, tolerancia, uso escalonado e plano de retirada.",
        "genetic_notes": ["Farmacogenetica nao e decisiva no MVP para lorazepam."],
        "contraindication_flags": ["Uso com alcool/opioides", "apneia do sono grave sem controle", "historia de dependencia sem plano rigoroso."],
        "evidence_level": "Alta para alivio agudo; cautela alta para continuidade.",
    },
    "naltrexone": {
        "display_name": "Naltrexona",
        "class_name": "Antagonista opioide",
        "mechanism": "Antagonismo de receptores opioides, reduzindo reforco associado a opioides e alcool em contextos indicados.",
        "initial_dose": "Geralmente iniciar apos avaliacao de abstinencia de opioides e funcao hepatica.",
        "max_dose": "Conforme formulacao e protocolo; revisar bula/diretriz.",
        "indications": ["Transtorno por uso de alcool", "Transtorno por uso de opioides em condicoes especificas"],
        "gold_standard": ["Opcao baseada em evidencia para reducao de recaida em alcool e opioides quando criterios sao atendidos."],
        "clinical_trials": ["Exige ausencia de opioides para evitar precipitacao de abstinencia em pacientes dependentes."],
        "pharmacokinetics": ["Metabolismo hepatico; avaliar funcao hepatica."],
        "pharmacodynamics": ["Bloqueia analgesia opioide e pode interferir em manejo de dor aguda."],
        "personalization_criteria": ["Uso recente de opioides", "funcao hepatica", "plano de reducao de danos", "risco de overdose pos-suspensao."],
        "monitoring_summary": "Função hepatica, uso de opioides, craving, adesao e plano de seguranca.",
        "genetic_notes": ["Sem camada farmacogenetica MVP; foco em seguranca, interacoes e reducao de danos."],
        "contraindication_flags": ["Uso atual de opioides", "necessidade de analgesia opioide", "hepatite aguda/insuficiencia hepatica significativa."],
        "evidence_level": "Alta confianca em criterios corretos.",
    },
}

AVAILABLE_LOCAL_MEDICATIONS = [
    "sertralina",
    "litio",
    "quetiapina",
    "venlafaxina",
    "lorazepam",
    "naltrexona",
]


def _clean_query(value: str) -> str:
    return " ".join(value.strip().lower().split())


def _canonical_medication(value: str) -> str:
    cleaned = _clean_query(value)
    return MEDICATION_ALIASES.get(cleaned, cleaned)


def _local_medication(value: str) -> str:
    canonical = _canonical_medication(value)
    return LOCAL_MEDICATION_NAMES.get(canonical, _clean_query(value))


def _shorten(value: Any, limit: int = 360) -> str:
    if isinstance(value, list):
        value = " ".join(str(item) for item in value if item)
    text = " ".join(str(value or "").split())
    if len(text) <= limit:
        return text
    return text[: limit - 1].rstrip() + "..."


def _public_get_json(
    url: str,
    *,
    params: dict[str, str | int],
    timeout_seconds: float = 4.0,
) -> tuple[dict[str, Any] | None, str | None]:
    try:
        with httpx.Client(timeout=timeout_seconds) as client:
            response = client.get(url, params=params)
            response.raise_for_status()
            return response.json(), None
    except httpx.HTTPStatusError as exc:
        return None, f"{exc.response.status_code}: {exc.response.text[:160]}"
    except httpx.HTTPError as exc:
        return None, str(exc)


def _search_rxnorm(name: str) -> tuple[list[dict[str, str]], str]:
    payload, error = _public_get_json(RXNAV_DRUGS_URL, params={"name": name})
    if error:
        return [], f"RxNorm indisponivel nesta execucao: {error}"

    concept_groups = payload.get("drugGroup", {}).get("conceptGroup", []) if payload else []
    results: list[dict[str, str]] = []

    for group in concept_groups:
        term_type = str(group.get("tty", "")).strip()
        for item in group.get("conceptProperties", []) or []:
            results.append(
                {
                    "name": str(item.get("name", "")).strip(),
                    "rxcui": str(item.get("rxcui", "")).strip(),
                    "synonym": str(item.get("synonym", "")).strip(),
                    "term_type": term_type,
                    "source": "RxNorm/RxNav",
                }
            )
            if len(results) >= 8:
                return results, "RxNorm/RxNav retornou conceitos normalizados."

    return results, "RxNorm/RxNav consultado sem conceitos equivalentes relevantes."


def _search_openfda_label(name: str) -> tuple[dict[str, str] | None, str]:
    search = f'openfda.generic_name:"{name}" OR openfda.brand_name:"{name}"'
    payload, error = _public_get_json(
        OPENFDA_LABEL_URL,
        params={"search": search, "limit": 1},
    )
    if error:
        return None, f"openFDA indisponivel nesta execucao: {error}"

    results = payload.get("results", []) if payload else []
    if not results:
        return None, "openFDA Drug Label consultado sem bula correspondente."

    label = results[0]
    openfda = label.get("openfda", {}) if isinstance(label, dict) else {}
    return (
        {
            "brand_name": _shorten(openfda.get("brand_name", []), 180),
            "generic_name": _shorten(openfda.get("generic_name", []), 180),
            "indications": _shorten(label.get("indications_and_usage", [])),
            "warnings": _shorten(label.get("warnings", []) or label.get("boxed_warning", [])),
            "adverse_reactions": _shorten(label.get("adverse_reactions", [])),
            "drug_interactions": _shorten(label.get("drug_interactions", [])),
            "source": "openFDA Drug Label",
        },
        "openFDA retornou rotulagem estruturada do medicamento.",
    )


def _local_science_for_medication(query: str) -> dict[str, Any]:
    local_term = _local_medication(query)
    payload = load_scientific_base(medicamento=local_term)

    if (
        payload["interactions"]
        or payload["laboratory_monitoring"]
        or payload["clinical_concepts"]
        or payload["documents"]
    ):
        return payload

    return load_scientific_base(query=local_term)


def _severity_rank(value: str) -> int:
    normalized = _clean_query(value)
    if normalized in {"alta", "alto", "grave", "critica", "critico"}:
        return 3
    if normalized in {"moderada", "moderado"}:
        return 2
    if normalized in {"baixa", "baixo", "protetor"}:
        return 1
    return 0


def _build_validation(
    *,
    rxnorm_results: list[dict[str, str]],
    label: dict[str, str] | None,
    local_science: dict[str, Any],
    evidence_profile: dict[str, Any] | None,
) -> dict[str, Any]:
    criteria: list[str] = []
    score = 0

    if rxnorm_results:
        score += 25
        criteria.append("Nome/conceito normalizado por RxNorm/RxNav.")
    if label:
        score += 25
        criteria.append("Rotulagem estruturada localizada no openFDA.")
    if evidence_profile:
        score += 35
        criteria.append("Perfil farmacologico curado pelo Adler disponivel.")
    if local_science["clinical_concepts"]:
        score += 10
        criteria.append("Conceitos clinicos conectados a fonte cientifica local.")
    if local_science["documents"]:
        score += 10
        criteria.append("Documento/fonte cientifica local vinculado ao medicamento.")
    if local_science["interactions"]:
        score += 10
        criteria.append("Interacoes medicamentosas/substancias mapeadas.")
    if local_science["laboratory_monitoring"]:
        score += 10
        criteria.append("Monitoramento laboratorial indicado na base Adler.")

    status = "validado" if score >= 70 else "parcial" if score >= 35 else "revisar"
    if not criteria:
        criteria.append("Sem correspondencia suficiente; exigir revisao manual antes de uso clinico.")

    return {
        "status": status,
        "confidence_score": min(score, 100),
        "criteria": criteria,
    }


def _build_decision_support(
    *,
    profile: dict[str, Any] | None,
    interactions: list[dict[str, str]],
    laboratory_monitoring: list[dict[str, str]],
    clinical_concepts: list[dict[str, str]],
) -> dict[str, Any]:
    high_risk_interactions = sorted(
        interactions,
        key=lambda item: _severity_rank(item.get("gravidade", "")),
        reverse=True,
    )

    interaction_alerts = [
        f"{item.get('substancia_principal')} + {item.get('agente_secundario')}: {item.get('efeito')} ({item.get('conduta')})."
        for item in high_risk_interactions[:5]
    ]
    monitoring_actions = [
        f"{item.get('exame')}: {item.get('frequencia')} para {item.get('finalidade')}."
        for item in laboratory_monitoring[:5]
    ]

    first_line_context = []
    if profile:
        first_line_context = list(profile.get("gold_standard", []))[:4]
    elif clinical_concepts:
        first_line_context = [
            item.get("aplicacao_pratica") or item.get("chave_clinica")
            for item in clinical_concepts[:4]
        ]

    pk_pd_notes = []
    if profile:
        pk_pd_notes.extend(profile.get("pharmacokinetics", [])[:3])
        pk_pd_notes.extend(profile.get("pharmacodynamics", [])[:3])

    insertion_checklist = [
        "Confirmar indicacao, diagnostico-alvo e objetivo terapeutico.",
        "Revisar uso atual, alergias, gestacao, substancias e interacoes relevantes.",
        "Registrar dose, frequencia, plano de monitoramento e criterios de revisao.",
        "Documentar que a decisao foi revisada por profissional habilitado.",
    ]
    if monitoring_actions:
        insertion_checklist.append("Anexar ou solicitar exames de baseline/manutencao quando aplicavel.")

    return {
        "first_line_context": first_line_context
        or ["Sem criterio padrao-ouro local especifico; revisar diretriz e bula antes de inserir."],
        "monitoring_actions": monitoring_actions,
        "interaction_alerts": interaction_alerts,
        "pk_pd_notes": pk_pd_notes
        or ["Sem trilha PK/PD curada para este termo; revisar fonte primaria antes de decisao."],
        "insertion_checklist": insertion_checklist,
        "clinical_boundary": "O Adler organiza evidencias e riscos; a prescricao final exige julgamento clinico e habilitacao profissional.",
    }


def search_medication(query: str) -> dict[str, Any]:
    cleaned_query = _clean_query(query)
    canonical = _canonical_medication(cleaned_query)
    local_term = _local_medication(cleaned_query)
    rxnorm_results, rxnorm_note = _search_rxnorm(canonical)
    label, label_note = _search_openfda_label(canonical)
    local_science = _local_science_for_medication(cleaned_query)
    evidence_profile = MEDICATION_EVIDENCE_PROFILES.get(canonical)

    interactions = local_science["interactions"]
    laboratory_monitoring = local_science["laboratory_monitoring"]
    clinical_concepts = local_science["clinical_concepts"]
    documents = local_science["documents"]
    validation = _build_validation(
        rxnorm_results=rxnorm_results,
        label=label,
        local_science=local_science,
        evidence_profile=evidence_profile,
    )
    decision_support = _build_decision_support(
        profile=evidence_profile,
        interactions=interactions,
        laboratory_monitoring=laboratory_monitoring,
        clinical_concepts=clinical_concepts,
    )

    treatment_notes: list[str] = []
    if label and label.get("indications"):
        treatment_notes.append(
            "Rotulagem oficial localizada para apoiar checagem de indicacao, advertencias e interacoes."
        )
    if clinical_concepts:
        treatment_notes.append(
            f"{len(clinical_concepts)} conceito(s) da base Adler conectam mecanismo, evidencia e aplicacao pratica."
        )
    if laboratory_monitoring:
        treatment_notes.append(
            "Medicamento exige trilha de monitoramento laboratorial na base Adler."
        )
    if interactions:
        treatment_notes.append(
            "Foram encontradas interacoes medicamento/substancia/alimento na curadoria local."
        )
    if not treatment_notes:
        treatment_notes.append(
            "Sem protocolo local especifico; revisar bula e diretrizes antes de inserir no prontuario."
        )

    if not rxnorm_results and evidence_profile:
        rxnorm_results = [
            {
                "name": evidence_profile["display_name"],
                "rxcui": "base-adler",
                "synonym": evidence_profile["class_name"],
                "term_type": "curated",
                "source": "Base cientifica Adler",
            }
        ]

    return {
        "query": cleaned_query,
        "normalized_query": canonical,
        "local_query": local_term,
        "results": rxnorm_results,
        "label": label,
        "evidence_profile": evidence_profile,
        "validation": validation,
        "decision_support": decision_support,
        "available_local_medications": AVAILABLE_LOCAL_MEDICATIONS,
        "curated_insights": {
            "clinical_concepts": clinical_concepts[:6],
            "documents": documents[:6],
            "interactions": interactions[:8],
            "laboratory_monitoring": laboratory_monitoring[:8],
        },
        "treatment_notes": treatment_notes,
        "source_notes": [
            rxnorm_note,
            label_note,
            "Interacoes, exames e conceitos sao filtrados pela base cientifica local do Adler.",
            "Uso clinico requer revisao do profissional; o sistema nao substitui prescricao.",
        ],
        "sources": [
            {
                "name": "RxNorm/RxNav",
                "url": RXNAV_DRUGS_URL,
                "purpose": "normalizacao de nomes e conceitos medicamentosos",
            },
            {
                "name": "openFDA Drug Label",
                "url": OPENFDA_LABEL_URL,
                "purpose": "rotulagem estruturada enviada por fabricantes/distribuidores",
            },
            {
                "name": "Base cientifica Adler",
                "url": "local://adler_base_cientifica_template",
                "purpose": "protocolos, exames, interacoes e conceitos curados",
            },
        ],
    }
