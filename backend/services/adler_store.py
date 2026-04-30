"""Local demo store and workspace builders for Adler."""

from __future__ import annotations

import json
from copy import deepcopy
from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4

from fastapi import HTTPException, UploadFile
from sqlalchemy.orm import Session

from backend.models.adler_patient import AdlerAppointment, AdlerPatient
from backend.models.adler_workspace import AdlerTenantDocument, AdlerTenantNote
from backend.schemas.adler import ClinicalApproach, PatientStatus
from backend.services.adler_auth import AdlerTenantContext

DATA_DIR = Path(__file__).resolve().parents[1] / "data" / "adler"


CLINICIAN_PROFILE = {
    "name": "Érico Lopes",
    "initials": "EL",
    "credentials": "CRP 07/12345",
    "role": "Psicólogo Clínico",
    "primary_approach": "schema",
    "primary_approach_label": "Terapia do Esquema",
    "subscription_tier": "standard",
    "allowed_approaches": ["schema"],
    "notifications": 3,
    "focus_label": "Atendimento clínico adulto",
}

ALL_APPROACHES = [
    "psychiatry",
    "cbt",
    "schema",
    "psychoanalysis",
    "couples",
    "generalist",
    "systemic",
]

CLINICIAN_SCHEDULE = [
    {
        "patient_id": "daniel-r",
        "time": "09:00",
        "duration": "50 min",
        "session_label": "Sessão de continuidade",
        "mode": "Online",
        "room_label": "Sala Atlas",
        "prep_note": "Revisar ativação comportamental e padrão de autoexigência.",
        "status": "completed",
    },
    {
        "patient_id": "sarah-m",
        "time": "11:00",
        "duration": "50 min",
        "session_label": "Sessão focada em rituais",
        "mode": "Presencial",
        "room_label": "Consultório 02",
        "prep_note": "Checar resposta à exposição e padrão de neutralização compulsiva.",
        "status": "next",
    },
    {
        "patient_id": "helena-v",
        "time": "14:30",
        "duration": "50 min",
        "session_label": "Acompanhamento trauma",
        "mode": "Online",
        "room_label": "Sala Aurora",
        "prep_note": "Revisar hipervigilância vespertina e janela de regulação autonômica.",
        "status": "scheduled",
    },
    {
        "patient_id": "rafael-n",
        "time": "17:00",
        "duration": "50 min",
        "session_label": "Funções executivas",
        "mode": "Presencial",
        "room_label": "Consultório 01",
        "prep_note": "Conectar ASRS-1 com rotina noturna e metas de fechamento do dia.",
        "status": "scheduled",
    },
]

CLINICIAN_TASKS = [
    {
        "id": "task-1",
        "label": "Revisar nota de evolução da Sarah antes da sessão das 11h.",
        "priority": "alta",
        "status": "pending",
    },
    {
        "id": "task-2",
        "label": "Confirmar encaminhamento interdisciplinar do Bruno com a rede de apoio.",
        "priority": "media",
        "status": "pending",
    },
    {
        "id": "task-3",
        "label": "Enviar devolutiva breve do Y-BOCS para o prontuário longitudinal.",
        "priority": "rotina",
        "status": "done",
    },
]

CLINICIAN_RECENT_NOTES = [
    {
        "id": "note-1",
        "text": "Retomar com Sarah a diferença entre urgência emocional e necessidade real de ritual.",
        "updated_at": "08:12",
    },
    {
        "id": "note-2",
        "text": "Daniel responde melhor quando a sessão começa com planejamento concreto da manhã seguinte.",
        "updated_at": "08:26",
    },
]

DEFAULT_NOTES = """• Revisar a escala Y-BOCS da Sarah antes do atendimento do final da manhã.

• Validar com Rafael a rotina de desligamento digital antes de dormir.

• Separar o encaminhamento do Bruno para revisão compartilhada após a última sessão do dia."""

PATIENT_STATUS_BY_ID: dict[str, PatientStatus] = {
    "sarah-m": "active",
    "daniel-r": "active",
    "helena-v": "active",
    "marcus-a": "active",
    "camila-s": "inactive",
    "bruno-l": "active",
    "rafael-n": "active",
}

APPROACH_PROFILES: dict[ClinicalApproach, dict[str, object]] = {
    "cbt": {
        "summary": "Sessão {session}: o caso de {name} mantém vulnerabilidade cognitiva ativada em contextos de fadiga e antecipação.",
        "clinical_frame": "A leitura privilegia prevenção de recaída, exposição e redução de neutralização comportamental.",
        "risk_label": "Risco de recaída",
        "risk_base": 38,
        "insights": [
            ("Distorção dominante", "Catastrofização clínica segue sensível quando o sono piora."),
            ("Esquema ativo", "Vulnerabilidade ao dano continua organizando parte da resposta emocional."),
            ("Alvo comportamental", "Manter exposição com redução de rituais compensatórios."),
        ],
    },
    "psychoanalysis": {
        "summary": "Sessão {session}: o caso de {name} mostra repetição de conflito entre controle, culpa e defesa ritualizada.",
        "clinical_frame": "A formulação enfatiza mecanismos de defesa, repetição inconsciente e organização do conflito.",
        "risk_label": "Desorganização defensiva",
        "risk_base": 36,
        "insights": [
            ("Mecanismo de defesa", "Anulação e isolamento afetivo aparecem com mais força sob angústia somática."),
            ("Conflito inconsciente", "A ameaça corporal mobiliza fantasia de perda de controle e punição."),
            ("Direção clínica", "Sustentar simbolização sem colapsar na urgência da descarga ritual."),
        ],
    },
    "psychiatry": {
        "summary": "Sessão {session}: o caso de {name} combina resposta farmacológica parcial com janela de vigilância para efeitos e adesão.",
        "clinical_frame": "A leitura psiquiátrica integra farmacocinética, efeitos adversos e risco clínico longitudinal.",
        "risk_label": "Risco metabólico / efeitos colaterais",
        "risk_base": 34,
        "insights": [
            ("Efetividade atual", "O regime mostra resposta parcial com benefício clínico observável."),
            ("Sinal neuroquímico", "A modulação serotoninérgica está associada à queda da hiperreatividade."),
            ("Atenção terapêutica", "Manter monitoramento de adesão, sedação residual e interação medicamentosa."),
        ],
    },
    "schema": {
        "summary": "Sessão {session}: {name} mantém ativação de modos vulneráveis e de proteção rígida em contextos de ameaça subjetiva.",
        "clinical_frame": "A leitura em terapia do esquema organiza o caso por modos, necessidades emocionais e reparação.",
        "risk_label": "Ativação de modos desadaptativos",
        "risk_base": 37,
        "insights": [
            ("Modo dominante", "Criança vulnerável sobe rapidamente quando há sinal de imprevisibilidade."),
            ("Proteção secundária", "O protetor hipercontrolador ainda domina a resposta em momentos de ameaça."),
            ("Direção clínica", "Fortalecer adulto saudável e respostas reparadoras consistentes."),
        ],
    },
    "couples": {
        "summary": "Sessão {session}: o caso de {name} mostra acomodação relacional do sintoma e pedidos repetidos de garantia.",
        "clinical_frame": "A terapia de casal observa comunicação, limites, co-regulação e ciclos de reassurance.",
        "risk_label": "Acomodação relacional",
        "risk_base": 33,
        "insights": [
            ("Ciclo relacional", "Pedidos de garantia aliviam a ansiedade no curto prazo e mantêm a dúvida no longo prazo."),
            ("Limite terapêutico", "Validar sofrimento sem executar ritual tende a reduzir acomodação."),
            ("Direção clínica", "Fortalecer comunicação emocional e pactos de cuidado sem reforço compulsivo."),
        ],
    },
    "generalist": {
        "summary": "Sessão {session}: a formulação generalista de {name} integra sintomas, risco, escalas, rotina e funcionalidade.",
        "clinical_frame": "A psicoterapia generalista usa avaliação dimensional e plano escalonado sem prender o caso a uma única escola.",
        "risk_label": "Risco clínico global",
        "risk_base": 35,
        "insights": [
            ("Formulação integrada", "Sono, ansiedade e rituais devem ser lidos junto com funcionamento diário."),
            ("Monitoramento dimensional", "Escalas e transcrição ajudam a diferenciar melhora sustentada de alívio pontual."),
            ("Direção clínica", "Manter vigilância de risco e encaminhar quando houver indicação interdisciplinar."),
        ],
    },
    "systemic": {
        "summary": "Sessão {session}: o caso de {name} evidencia padrões circulares entre sintoma, respostas da rede e rotina.",
        "clinical_frame": "A abordagem sistêmica prioriza contexto, circularidade, regras implícitas e função relacional do sintoma.",
        "risk_label": "Padrão circular sintomático",
        "risk_base": 34,
        "insights": [
            ("Circularidade", "A resposta da rede pode aliviar no curto prazo e estabilizar o problema no sistema."),
            ("Regra implícita", "Proteger por garantia excessiva reduz conflito mas limita autonomia clínica."),
            ("Direção clínica", "Alterar pequenas respostas do sistema para reduzir retroalimentação do sintoma."),
        ],
    },
}


def _patient(
    *,
    patient_id: str,
    name: str,
    initials: str,
    focus: str,
    diagnosis: str,
    current_protocol: str,
    default_session: int,
    recorder_title: str,
    recorder_duration: str,
    recorder_summary: str,
    transcripts: list[tuple[str, str, str, str]],
    primary_medication: dict,
    secondary_medication: dict,
    genetics: dict,
    pharmacokinetic: dict,
    pharmacodynamic: dict,
    differential_alert: dict,
    interactions: list[dict] | None = None,
    labs: dict | None = None,
    harm_reduction: dict | None = None,
) -> dict:
    return {
        "id": patient_id,
        "name": name,
        "initials": initials,
        "focus": focus,
        "diagnosis": diagnosis,
        "current_protocol": current_protocol,
        "default_session": default_session,
        "status": PATIENT_STATUS_BY_ID[patient_id],
        "recorder": {
            "title": recorder_title,
            "duration": recorder_duration,
            "summary": recorder_summary,
            "transcript_segments": [
                {"id": item_id, "speaker": speaker, "timestamp": timestamp, "text": text}
                for item_id, speaker, timestamp, text in transcripts
            ],
        },
        "medications": {
            "primary": primary_medication,
            "secondary": secondary_medication,
        },
        "genetics": genetics,
        "pharmacology": {
            "pharmacokinetic": pharmacokinetic,
            "pharmacodynamic": pharmacodynamic,
        },
        "interactions": interactions or [],
        "labs": labs,
        "harm_reduction": harm_reduction,
        "differential_alert": differential_alert,
    }


PATIENTS = [
    _patient(
        patient_id="sarah-m",
        name="Sarah M.",
        initials="SM",
        focus="OCD / health anxiety",
        diagnosis="Obsessive-compulsive spectrum with nocturnal hypervigilance",
        current_protocol="CBT exposure + SSRI stabilization",
        default_session=18,
        recorder_title="Sessão 18 // Revisão de ritual noturno",
        recorder_duration="24m 18s",
        recorder_summary="A captura sugere menor latência ritual após estabilização da sertralina, com sedação residual matinal após resgate com lorazepam.",
        transcripts=[
            ("sm-1", "Therapist", "00:14", "Quando a sertralina entra no mesmo horário, o pico de ameaça perde força."),
            ("sm-2", "Sarah", "03:42", "Se atraso a dose, o ritual volta mais rápido e eu negocio mais com o medo."),
        ],
        primary_medication={
            "title": "Sertralina",
            "subtitle": "Antidepressivo ISRS",
            "dose": "50mg",
            "efficacy": 75,
            "efficacy_label": "Eficácia atual",
            "highlight": "Alvo terapêutico: Transportador de Serotonina (SERT)",
        },
        secondary_medication={
            "title": "Lorazepam",
            "subtitle": "Ansiolítico",
            "dose": "0.5mg",
            "alert": "Risco de tolerância: recomenda-se desmame gradual após a Sessão 20.",
        },
        genetics={
            "gene": "CYP2D6",
            "phenotype": "Metabolizador Normal",
            "summary": "Processamento da sertralina dentro da janela esperada, sem sinal de acúmulo clinicamente relevante.",
            "compatibility": 84,
            "badge": "genotype pass",
            "gradient_start": "rgba(139,92,246,0.95)",
            "gradient_end": "rgba(34,211,238,0.95)",
        },
        pharmacokinetic={
            "label": "Janela farmacocinética",
            "value": "Tmax 4.5h",
            "detail": "steady-state preservado com baixa variabilidade entre dias de adesão estável",
        },
        pharmacodynamic={
            "label": "Sinal farmacodinâmico",
            "value": "SERT 78%",
            "detail": "queda de hiperreatividade noturna e menor rebote compulsivo nas sessões finais",
        },
        interactions=[
            {
                "title": "Sertralina + refeição matinal",
                "counterpart": "café da manhã proteico",
                "category": "sinergia",
                "effect": "melhora a regularidade do horário de tomada",
                "guidance": "manter horário fixo após refeição leve",
                "severity": "protetor",
            },
            {
                "title": "Lorazepam + álcool",
                "counterpart": "bebidas alcoólicas",
                "category": "alerta",
                "effect": "potencializa sedação e prejuízo psicomotor",
                "guidance": "evitar associação e reforçar orientação de segurança",
                "severity": "alto",
            },
        ],
        differential_alert={
            "session": 12,
            "note": "Padrão de distração na Sessão 12 sugere 22% de probabilidade de TDAH não diagnosticado. Recomenda-se aplicação da escala ASRS-1.",
        },
    ),
    _patient(
        patient_id="daniel-r",
        name="Daniel R.",
        initials="DR",
        focus="Major depression / sleep onset insomnia",
        diagnosis="Depressive episode with adrenergic activation at night",
        current_protocol="Behavioral activation + SNRI titration",
        default_session=16,
        recorder_title="Sessão 16 // Revisão de ativação matinal",
        recorder_duration="19m 52s",
        recorder_summary="A transcrição sugere melhor engajamento diurno após venlafaxina XR, com oscilação quando a dose é tomada em jejum.",
        transcripts=[
            ("dr-1", "Therapist", "01:05", "O que muda nas manhãs em que você toma a venlafaxina sem comer?"),
            ("dr-2", "Daniel", "04:21", "Fico mais afiado por um tempo, depois mais trêmulo e irregular."),
        ],
        primary_medication={
            "title": "Venlafaxina XR",
            "subtitle": "SNRI",
            "dose": "75mg",
            "efficacy": 68,
            "efficacy_label": "Resposta antidepressiva",
            "highlight": "Alvo terapêutico: modulação de SERT + NET",
        },
        secondary_medication={
            "title": "Quetiapina",
            "subtitle": "Ponte hipnótica",
            "dose": "25mg",
            "alert": "Risco metabólico: monitorar ganho ponderal e sedação residual ao despertar.",
        },
        genetics={
            "gene": "CYP2D6",
            "phenotype": "Metabolizador Intermediário",
            "summary": "Clearance discretamente mais lenta, pedindo vigilância de efeitos colaterais na titração.",
            "compatibility": 71,
            "badge": "monitor closely",
            "gradient_start": "rgba(251,191,36,0.95)",
            "gradient_end": "rgba(56,189,248,0.95)",
        },
        pharmacokinetic={
            "label": "Janela farmacocinética",
            "value": "Tmax 5.2h",
            "detail": "absorção mais errática quando a dose não é vinculada à rotina alimentar",
        },
        pharmacodynamic={
            "label": "Sinal farmacodinâmico",
            "value": "NET 52%",
            "detail": "maior energia diurna com leve sobrecarga adrenérgica no início da janela",
        },
        differential_alert={
            "session": 9,
            "note": "Oscilação de energia e fala acelerada na Sessão 9 sugerem 18% de probabilidade de bipolaridade tipo II subdiagnosticada.",
        },
    ),
    _patient(
        patient_id="helena-v",
        name="Helena V.",
        initials="HV",
        focus="PTSD / hyperarousal",
        diagnosis="Post-traumatic hypervigilance with trauma-linked nightmares",
        current_protocol="Trauma-focused psychotherapy + alpha-1 modulation",
        default_session=15,
        recorder_title="Sessão 15 // Padrão de pesadelos",
        recorder_duration="27m 04s",
        recorder_summary="Os dados sugerem benefício do prazosin para intensidade de pesadelos, com hiperativação autonômica persistente no entardecer.",
        transcripts=[
            ("hv-1", "Therapist", "02:28", "Os sonhos pioram menos, mas o corpo ainda entra em alerta ao anoitecer."),
            ("hv-2", "Helena", "05:54", "A cena fica menos violenta, só que meu peito fecha antes de dormir."),
        ],
        primary_medication={
            "title": "Escitalopram",
            "subtitle": "Antidepressivo ISRS",
            "dose": "10mg",
            "efficacy": 72,
            "efficacy_label": "Controle de hipervigilância",
            "highlight": "Alvo terapêutico: estabilização do tônus serotoninérgico",
        },
        secondary_medication={
            "title": "Prazosin",
            "subtitle": "Modulação alfa-1",
            "dose": "1mg",
            "alert": "Observar hipotensão postural na primeira hora após administração.",
        },
        genetics={
            "gene": "CYP2C19",
            "phenotype": "Metabolizador Normal",
            "summary": "Janela de eliminação compatível com uso noturno sem acúmulo clínico relevante.",
            "compatibility": 79,
            "badge": "night dosing compatible",
            "gradient_start": "rgba(99,102,241,0.95)",
            "gradient_end": "rgba(34,211,238,0.95)",
        },
        pharmacokinetic={
            "label": "Janela farmacocinética",
            "value": "Half-life 27h",
            "detail": "eliminação estável favorece uso contínuo sem vales abruptos",
        },
        pharmacodynamic={
            "label": "Sinal farmacodinâmico",
            "value": "alpha-1 dampening",
            "detail": "pesadelos reduziram, mas a hiperativação periférica ainda se mantém em parte",
        },
        differential_alert={
            "session": 7,
            "note": "Padrão dissociativo na Sessão 7 sugere 16% de probabilidade de subtipo dissociativo de TEPT.",
        },
    ),
    _patient(
        patient_id="marcus-a",
        name="Marcus A.",
        initials="MA",
        focus="Bipolar II maintenance",
        diagnosis="Bipolar II depressive recovery with residual insomnia",
        current_protocol="Mood stabilization + circadian repair",
        default_session=14,
        recorder_title="Sessão 14 // Calibração do ritmo de humor",
        recorder_duration="21m 33s",
        recorder_summary="A gravação mostra estabilização do humor após titulação do lítio, com despertar tardio após picos de trabalho.",
        transcripts=[
            ("ma-1", "Marcus", "03:08", "O lítio segurou melhor a oscilação, mas se eu viro a noite trabalhando ainda fico acelerado."),
            ("ma-2", "Therapist", "07:44", "Precisamos sustentar litemia, função renal e tireoide para manter a estabilidade com segurança."),
        ],
        primary_medication={
            "title": "Lítio",
            "subtitle": "Psicoestabilizador",
            "dose": "900mg/dia",
            "efficacy": 81,
            "efficacy_label": "Estabilidade de humor",
            "highlight": "Faixa terapêutica estreita: requer litemia e vigilância renal/tireoidiana.",
        },
        secondary_medication={
            "title": "Lamotrigina",
            "subtitle": "Adjunto estabilizador",
            "dose": "100mg",
            "alert": "Monitorar adesão e progressão lenta de dose para reduzir risco cutâneo.",
        },
        genetics={
            "gene": "UGT1A4",
            "phenotype": "Expressão esperada",
            "summary": "Sem sinal de metabolismo acelerado para lamotrigina dentro do protocolo atual.",
            "compatibility": 77,
            "badge": "stable clearance",
            "gradient_start": "rgba(168,85,247,0.95)",
            "gradient_end": "rgba(59,130,246,0.95)",
        },
        pharmacokinetic={
            "label": "Janela farmacocinética",
            "value": "steady-state 5d",
            "detail": "resposta mais estável quando o horário e a hidratação se mantêm consistentes",
        },
        pharmacodynamic={
            "label": "Sinal farmacodinâmico",
            "value": "glutamate buffering",
            "detail": "menor labilidade do humor com proteção parcial contra sobrecarga tardia",
        },
        interactions=[
            {
                "title": "Lítio + anti-inflamatórios",
                "counterpart": "ibuprofeno, naproxeno",
                "category": "alerta",
                "effect": "eleva litemia e aumenta risco de intoxicação",
                "guidance": "checar automedicação e repetir litemia se houver uso recente",
                "severity": "alto",
            }
        ],
        labs={
            "medication": "Lítio",
            "baseline": "Baseline concluído com ureia, creatinina, TSH, T4 livre e ECG antes da titulação.",
            "start_schedule": "Litemia a cada 1-2 semanas até estabilização, sempre 12 horas após a última dose.",
            "maintenance_schedule": "Litemia e função renal a cada 3-6 meses, com revisão de tireoide e eletrólitos.",
            "alert_symptoms": "Tremor grosseiro, náuseas, vômitos, diarreia, confusão mental ou sonolência excessiva exigem coleta imediata.",
            "interaction_note": "Anti-inflamatórios não esteroidais e alguns diuréticos podem elevar a litemia e precipitar intoxicação.",
            "tests": [
                {
                    "name": "Litemia 12h",
                    "frequency": "1-2 semanas / 3-6 meses",
                    "purpose": "faixa terapêutica e ajuste de dose",
                    "last_result": "0.72 mEq/L",
                    "status": "ok",
                },
                {
                    "name": "Creatinina, ureia e TFG",
                    "frequency": "baseline / trimestral",
                    "purpose": "função renal",
                    "last_result": "Creatinina 0.94 mg/dL",
                    "status": "ok",
                },
            ],
        },
        differential_alert={
            "session": 6,
            "note": "Reatividade interpessoal na Sessão 6 sugere 14% de probabilidade de traço ciclotímico residual.",
        },
    ),
    _patient(
        patient_id="camila-s",
        name="Camila S.",
        initials="CS",
        focus="Panic disorder / autonomic surges",
        diagnosis="Panic attacks with anticipatory avoidance and somatic amplification",
        current_protocol="Interoceptive exposure + SSRI onboarding",
        default_session=13,
        recorder_title="Sessão 13 // Mapeamento do limiar de pânico",
        recorder_duration="18m 47s",
        recorder_summary="A gravação sugere menor frequência de ataques após fluoxetina, com sensibilidade adrenérgica ao sair de casa.",
        transcripts=[
            ("cs-1", "Camila", "02:51", "O pânico está menos explosivo, mas meu peito ainda fecha antes de sair."),
            ("cs-2", "Therapist", "06:30", "A fluoxetina reduziu a amplificação catastrófica, mas a descarga autonômica ainda persiste."),
        ],
        primary_medication={
            "title": "Fluoxetina",
            "subtitle": "Antidepressivo ISRS",
            "dose": "20mg",
            "efficacy": 66,
            "efficacy_label": "Redução de ataques",
            "highlight": "Alvo terapêutico: redução da amplificação catastrófica",
        },
        secondary_medication={
            "title": "Propranolol",
            "subtitle": "Beta-bloqueador PRN",
            "dose": "10mg",
            "alert": "Monitorar fadiga e queda de desempenho quando associado a jejum prolongado.",
        },
        genetics={
            "gene": "CYP2D6",
            "phenotype": "Metabolizador Normal",
            "summary": "Compatibilidade adequada com fluoxetina em baixa dose no onboarding atual.",
            "compatibility": 76,
            "badge": "onboarding safe",
            "gradient_start": "rgba(251,146,60,0.95)",
            "gradient_end": "rgba(45,212,191,0.95)",
        },
        pharmacokinetic={
            "label": "Janela farmacocinética",
            "value": "Half-life 4-6d",
            "detail": "acúmulo gradual ajuda a explicar a redução progressiva da intensidade do pânico",
        },
        pharmacodynamic={
            "label": "Sinal farmacodinâmico",
            "value": "panic gain down",
            "detail": "queda da escalada catastrófica com descarga adrenérgica ainda presente em exposições externas",
        },
        differential_alert={
            "session": 8,
            "note": "Sensibilidade interoceptiva extrema na Sessão 8 sugere 12% de probabilidade de POTS a ser rastreado clinicamente.",
        },
    ),
    _patient(
        patient_id="bruno-l",
        name="Bruno L.",
        initials="BL",
        focus="Dependência química / redução de danos",
        diagnosis="Uso problemático de álcool e cocaína com episódios de binge, craving e deterioração do sono",
        current_protocol="Redução de danos + manejo de craving + estabilização do sono",
        default_session=11,
        recorder_title="Sessão 11 // Revisão de gatilhos e fissura",
        recorder_duration="26m 11s",
        recorder_summary="A gravação mostra redução de danos mais consistente, com menor binge alcoólico e maior capacidade de interrupção.",
        transcripts=[
            ("bl-1", "Bruno", "01:58", "Não fiquei abstinente a semana toda, mas consegui parar mais cedo e não virei a madrugada."),
            ("bl-2", "Therapist", "06:12", "Isso já reduz risco: menos binge diminui chance de uso de cocaína por encadeamento."),
        ],
        primary_medication={
            "title": "Naltrexona",
            "subtitle": "Modulação de craving",
            "dose": "50mg",
            "efficacy": 69,
            "efficacy_label": "Redução de binge",
            "highlight": "Alvo terapêutico: modulação de reforço e redução de craving alcoólico.",
        },
        secondary_medication={
            "title": "Quetiapina",
            "subtitle": "Suporte de sono / agitação",
            "dose": "25mg",
            "alert": "Evitar associação com álcool pela soma de sedação e prejuízo psicomotor.",
        },
        genetics={
            "gene": "OPRM1",
            "phenotype": "Sem marcador decisivo",
            "summary": "Sem marcador farmacogenético dominante para resposta à naltrexona.",
            "compatibility": 61,
            "badge": "monitorar resposta",
            "gradient_start": "rgba(244,114,182,0.95)",
            "gradient_end": "rgba(248,113,113,0.95)",
        },
        pharmacokinetic={
            "label": "Janela farmacocinética",
            "value": "dose única matinal",
            "detail": "adesão melhora quando a tomada é vinculada ao café da manhã",
        },
        pharmacodynamic={
            "label": "Sinal farmacodinâmico",
            "value": "craving down",
            "detail": "redução parcial do reforço do álcool, com gatilhos sociais ainda relevantes",
        },
        interactions=[
            {
                "title": "Quetiapina + álcool",
                "counterpart": "bebidas alcoólicas",
                "category": "alerta",
                "effect": "aumenta sedação, risco de blackout e perda de julgamento",
                "guidance": "não usar quetiapina como compensação após binge",
                "severity": "alto",
            }
        ],
        labs={
            "medication": "Naltrexona",
            "baseline": "Baseline concluído com TGO, TGP, GGT, bilirrubinas e hemograma.",
            "start_schedule": "Função hepática mensal no início do tratamento.",
            "maintenance_schedule": "TGO, TGP, GGT e bilirrubinas a cada 3-6 meses.",
            "alert_symptoms": "Icterícia, vômitos persistentes ou dor em hipocôndrio direito exigem coleta imediata.",
            "interaction_note": "Uso de opioides fica contraindicado sob naltrexona, com risco de perda de efeito analgésico.",
            "tests": [
                {
                    "name": "TGO / TGP / GGT",
                    "frequency": "baseline / mensal / trimestral",
                    "purpose": "função hepática",
                    "last_result": "TGP 42 U/L | GGT 58 U/L",
                    "status": "due",
                }
            ],
        },
        harm_reduction={
            "current_stage": "redução de frequência e prevenção de danos graves",
            "active_substances": ["álcool", "cocaína intranasal", "nicotina"],
            "goals": [
                "reduzir binge alcoólico para no máximo 1 episódio por semana",
                "eliminar uso solitário e uso após privação de sono",
            ],
            "safety_plan": [
                "hidratar e alimentar-se antes de eventos de risco",
                "acionar contato de segurança antes de qualquer fissura acima de 7/10",
            ],
            "red_flags": "Ideação suicida, binge de vários dias, uso sozinho ou sinais de abstinência grave exigem encaminhamento imediato.",
            "support_network": "irmã, grupo de apoio local e contato clínico de retaguarda",
        },
        differential_alert={
            "session": 10,
            "note": "Padrão de fissura associado a trauma na Sessão 10 sugere 19% de probabilidade de TEPT subjacente.",
        },
    ),
    _patient(
        patient_id="rafael-n",
        name="Rafael N.",
        initials="RN",
        focus="Adult ADHD / emotional dysregulation",
        diagnosis="Attention regulation deficits with sleep procrastination",
        current_protocol="Executive function coaching + noradrenergic modulation",
        default_session=12,
        recorder_title="Sessão 12 // Revisão de transbordamento atencional",
        recorder_duration="22m 06s",
        recorder_summary="A gravação sugere melhor iniciação diurna após atomoxetina, com falha de fechamento do dia à noite.",
        transcripts=[
            ("rn-1", "Rafael", "01:49", "A medicação ajuda a começar, mas depois do jantar minha cabeça não fecha."),
            ("rn-2", "Therapist", "05:10", "Pode haver boa cobertura nas horas úteis e queda da sustentação no período noturno."),
        ],
        primary_medication={
            "title": "Atomoxetina",
            "subtitle": "Modulação noradrenérgica",
            "dose": "40mg",
            "efficacy": 63,
            "efficacy_label": "Controle atencional",
            "highlight": "Alvo terapêutico: modulação do transportador de noradrenalina",
        },
        secondary_medication={
            "title": "Melatonina XR",
            "subtitle": "Suporte cronobiológico",
            "dose": "2mg",
            "alert": "Monitorar latência de sono em dias com exposição luminosa tardia.",
        },
        genetics={
            "gene": "CYP2D6",
            "phenotype": "Metabolizador Rápido",
            "summary": "Maior depuração pode reduzir duração efetiva da atomoxetina no período noturno.",
            "compatibility": 64,
            "badge": "fast clearance",
            "gradient_start": "rgba(56,189,248,0.95)",
            "gradient_end": "rgba(244,114,182,0.95)",
        },
        pharmacokinetic={
            "label": "Janela farmacocinética",
            "value": "fast clearance",
            "detail": "a cobertura parece cair antes do fechamento executivo do dia",
        },
        pharmacodynamic={
            "label": "Sinal farmacodinâmico",
            "value": "NET focus up",
            "detail": "iniciação melhorou, mas o transbordamento noturno ainda persiste",
        },
        differential_alert={
            "session": 12,
            "note": "Padrão de distração na Sessão 12 sugere 22% de probabilidade de TDAH não diagnosticado. Recomenda-se aplicação da escala ASRS-1.",
        },
    ),
]

PATIENTS_BY_ID = {patient["id"]: patient for patient in PATIENTS}


def _tenant_root(tenant_id: str) -> Path:
    return DATA_DIR / "tenants" / tenant_id


def _tenant_documents_dir(tenant_id: str) -> Path:
    return _tenant_root(tenant_id) / "documents"


def _tenant_documents_meta_file(tenant_id: str) -> Path:
    return _tenant_root(tenant_id) / "documents.json"


def _tenant_notes_file(tenant_id: str) -> Path:
    return _tenant_root(tenant_id) / "notes.json"


def _ensure_data_dir(tenant_id: str) -> None:
    tenant_root = _tenant_root(tenant_id)
    tenant_root.mkdir(parents=True, exist_ok=True)
    _tenant_documents_dir(tenant_id).mkdir(parents=True, exist_ok=True)


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


def _read_json(path: Path, fallback):
    if not path.exists():
        return fallback
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return fallback


def _write_json(path: Path, payload) -> None:
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")


def _note_record_to_payload(record: AdlerTenantNote) -> dict[str, str]:
    return {
        "value": record.value,
        "updated_at": record.updated_at.isoformat(),
    }


def _load_or_create_notes_record(db: Session, tenant_id: str) -> AdlerTenantNote:
    record = db.query(AdlerTenantNote).filter(AdlerTenantNote.tenant_id == tenant_id).first()
    if record:
        return record

    record = AdlerTenantNote(tenant_id=tenant_id, value=DEFAULT_NOTES)
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


def _document_record_to_payload(record: AdlerTenantDocument) -> dict:
    return {
        "id": record.id,
        "name": record.name,
        "mime_type": record.mime_type,
        "patient_id": record.patient_id,
        "patient_name": record.patient_name,
        "size_bytes": record.size_bytes,
        "uploaded_at": record.uploaded_at.isoformat(),
    }


def _patient_record_to_registry_item(record: AdlerPatient) -> dict:
    return {
        "id": record.id,
        "name": record.name,
        "initials": record.initials,
        "focus": record.focus,
        "diagnosis": record.diagnosis,
        "current_protocol": record.current_protocol,
        "default_session": record.default_session,
        "status": record.status,
    }


def _patient_record_to_payload(record: AdlerPatient) -> dict:
    payload = deepcopy(record.profile_json or {})
    payload.update(_patient_record_to_registry_item(record))
    return payload


def _appointment_record_to_payload(record: AdlerAppointment, patient_name: str) -> dict:
    return {
        "patient_id": record.patient_id,
        "patient_name": patient_name,
        "time": record.time,
        "duration": record.duration,
        "session_label": record.session_label,
        "mode": record.mode,
        "room_label": record.room_label,
        "prep_note": record.prep_note,
        "status": record.status,
    }


def ensure_patient_seed(db: Session, tenant_id: str) -> None:
    has_patients = db.query(AdlerPatient.id).filter(AdlerPatient.tenant_id == tenant_id).first()
    if has_patients:
        return

    for patient in PATIENTS:
        db.add(
            AdlerPatient(
                id=patient["id"],
                tenant_id=tenant_id,
                name=patient["name"],
                initials=patient["initials"],
                focus=patient["focus"],
                diagnosis=patient["diagnosis"],
                current_protocol=patient["current_protocol"],
                default_session=int(patient["default_session"]),
                status=patient["status"],
                profile_json=deepcopy(patient),
            )
        )

    for index, item in enumerate(CLINICIAN_SCHEDULE, start=1):
        db.add(
            AdlerAppointment(
                id=f"{tenant_id}-seed-{index}",
                tenant_id=tenant_id,
                patient_id=item["patient_id"],
                time=item["time"],
                duration=item["duration"],
                session_label=item["session_label"],
                mode=item["mode"],
                room_label=item["room_label"],
                prep_note=item["prep_note"],
                status=item["status"],
                sort_order=index,
            )
        )
    db.commit()


def get_clinician_profile(context: AdlerTenantContext | None = None) -> dict:
    profile = deepcopy(CLINICIAN_PROFILE)
    if context is None:
        return profile

    subscription_tier = context.subscription_tier if context.subscription_tier in {"standard", "premium"} else "standard"
    primary_approach = context.primary_approach if context.primary_approach in ALL_APPROACHES else "schema"
    allowed_approaches = (
        ALL_APPROACHES
        if subscription_tier == "premium"
        else [primary_approach]
    )

    profile.update(
        {
            "name": context.clinician_name,
            "initials": context.initials,
            "credentials": context.credentials,
            "role": context.role,
            "primary_approach": primary_approach,
            "primary_approach_label": context.primary_approach_label,
            "subscription_tier": subscription_tier,
            "allowed_approaches": allowed_approaches,
            "notifications": context.notifications,
            "focus_label": context.focus_label,
        }
    )
    return profile


def load_notes(db: Session, tenant_id: str) -> dict:
    record = _load_or_create_notes_record(db, tenant_id)
    return _note_record_to_payload(record)


def save_notes(db: Session, tenant_id: str, value: str) -> dict:
    record = _load_or_create_notes_record(db, tenant_id)
    record.value = value
    record.updated_at = _utc_now()
    db.add(record)
    db.commit()
    db.refresh(record)
    return _note_record_to_payload(record)


def list_patients(
    search: str | None = None,
    status: str = "all",
    db: Session | None = None,
    tenant_id: str | None = None,
) -> list[dict]:
    if db is not None and tenant_id is not None:
        ensure_patient_seed(db, tenant_id)
        query = db.query(AdlerPatient).filter(AdlerPatient.tenant_id == tenant_id)
        if status != "all":
            query = query.filter(AdlerPatient.status == status)
        records = query.order_by(AdlerPatient.name.asc()).all()
        normalized_search = (search or "").strip().lower()
        results = [_patient_record_to_registry_item(record) for record in records]
        if normalized_search:
            results = [
                patient
                for patient in results
                if normalized_search
                in " ".join(
                    [
                        patient["name"],
                        patient["focus"],
                        patient["diagnosis"],
                        patient["current_protocol"],
                    ]
                ).lower()
            ]
        return results

    normalized_search = (search or "").strip().lower()
    results: list[dict] = []

    for patient in PATIENTS:
        patient_status = patient["status"]
        if status != "all" and patient_status != status:
            continue
        if normalized_search:
            haystack = " ".join(
                [
                    patient["name"],
                    patient["focus"],
                    patient["diagnosis"],
                    patient["current_protocol"],
                ]
            ).lower()
            if normalized_search not in haystack:
                continue
        results.append(
            {
                "id": patient["id"],
                "name": patient["name"],
                "initials": patient["initials"],
                "focus": patient["focus"],
                "diagnosis": patient["diagnosis"],
                "current_protocol": patient["current_protocol"],
                "default_session": patient["default_session"],
                "status": patient_status,
            }
        )

    return results


def get_patient(patient_id: str, db: Session | None = None, tenant_id: str | None = None) -> dict:
    if db is not None and tenant_id is not None:
        ensure_patient_seed(db, tenant_id)
        record = (
            db.query(AdlerPatient)
            .filter(AdlerPatient.tenant_id == tenant_id)
            .filter(AdlerPatient.id == patient_id)
            .first()
        )
        if not record:
            raise HTTPException(status_code=404, detail="Paciente não encontrado.")
        return _patient_record_to_payload(record)

    patient = PATIENTS_BY_ID.get(patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Paciente não encontrado.")
    return deepcopy(patient)


def get_dashboard(db: Session, context: AdlerTenantContext) -> dict:
    ensure_patient_seed(db, context.tenant_id)
    notes_payload = load_notes(db, context.tenant_id)
    patient_records = db.query(AdlerPatient).filter(AdlerPatient.tenant_id == context.tenant_id).all()
    patients_by_id = {record.id: record for record in patient_records}
    active_patients = sum(1 for patient in patient_records if patient.status == "active")
    inactive_patients = sum(1 for patient in patient_records if patient.status == "inactive")
    pending_tasks = sum(1 for task in CLINICIAN_TASKS if task["status"] == "pending")
    schedule = [
        _appointment_record_to_payload(
            record,
            patients_by_id.get(record.patient_id).name if record.patient_id in patients_by_id else "Paciente",
        )
        for record in (
            db.query(AdlerAppointment)
            .filter(AdlerAppointment.tenant_id == context.tenant_id)
            .order_by(AdlerAppointment.sort_order.asc(), AdlerAppointment.time.asc())
            .all()
        )
    ]

    return {
        "clinician": get_clinician_profile(context),
        "notes": notes_payload["value"],
        "recent_notes": deepcopy(CLINICIAN_RECENT_NOTES),
        "schedule": schedule,
        "tasks": deepcopy(CLINICIAN_TASKS),
        "summary": {
            "active_patients": active_patients,
            "inactive_patients": inactive_patients,
            "pending_tasks": pending_tasks,
            "sessions_today": len(CLINICIAN_SCHEDULE),
            "notes_last_updated_at": notes_payload["updated_at"],
        },
    }


def bootstrap_payload(db: Session, context: AdlerTenantContext) -> dict:
    return {
        "dashboard": get_dashboard(db, context),
        "documents": list_documents(db, context.tenant_id),
        "patients": list_patients(db=db, tenant_id=context.tenant_id),
    }


def _risk_snapshot(approach: ClinicalApproach, session: int) -> dict:
    profile = APPROACH_PROFILES[approach]
    base_score = int(profile["risk_base"])
    progression = max(0, 18 - session)
    score = min(72, base_score + progression * 3)
    severity = "critical" if score >= 60 else "elevated" if score >= 45 else "stable"

    note = (
        "Recorte histórico indica maior vulnerabilidade clínica nas sessões mais antigas."
        if progression >= 4
        else "O recorte atual sugere estabilidade relativa com necessidade de vigilância longitudinal."
    )

    return {
        "focus_label": profile["risk_label"],
        "note": note,
        "score": score,
        "severity": severity,
    }


def build_workspace_snapshot(
    patient_id: str,
    approach: ClinicalApproach,
    session: int | None = None,
    db: Session | None = None,
    tenant_id: str | None = None,
) -> dict:
    patient = get_patient(patient_id, db=db, tenant_id=tenant_id)
    selected_session = session or int(patient["default_session"])
    first_name = patient["name"].split(" ")[0]
    profile = APPROACH_PROFILES[approach]
    insights = []

    for index, (title, description) in enumerate(profile["insights"], start=1):
        insights.append(
            {
                "id": f"{approach}-{index}",
                "title": title,
                "description": description.replace("{name}", first_name),
                "confidence": max(62, 88 - index * 6 - max(0, 18 - selected_session)),
            }
        )

    return {
        "approach": approach,
        "patient": patient,
        "selected_session": selected_session,
        "summary": str(profile["summary"]).format(name=first_name, session=selected_session),
        "clinical_frame": profile["clinical_frame"],
        "insights": insights,
        "risk": _risk_snapshot(approach, selected_session),
    }


def list_documents(db: Session, tenant_id: str, patient_id: str | None = None) -> list[dict]:
    query = db.query(AdlerTenantDocument).filter(AdlerTenantDocument.tenant_id == tenant_id)
    if patient_id is not None:
        query = query.filter(AdlerTenantDocument.patient_id == patient_id)

    records = query.order_by(AdlerTenantDocument.uploaded_at.desc()).all()
    return [_document_record_to_payload(record) for record in records]


def save_document(db: Session, tenant_id: str, file: UploadFile, patient_id: str | None) -> dict:
    if file.content_type not in {"application/pdf", "application/x-pdf"}:
        raise HTTPException(status_code=400, detail="Apenas PDFs são aceitos neste endpoint.")

    file_id = str(uuid4())
    raw = file.file.read()

    patient_name = None
    if patient_id:
        patient_name = get_patient(patient_id, db=db, tenant_id=tenant_id)["name"]

    record = AdlerTenantDocument(
        id=file_id,
        tenant_id=tenant_id,
        patient_id=patient_id,
        patient_name=patient_name,
        name=file.filename or f"documento-{file_id}.pdf",
        mime_type=file.content_type or "application/pdf",
        size_bytes=len(raw),
        file_bytes=raw,
        uploaded_at=_utc_now(),
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return _document_record_to_payload(record)


def get_document_blob(db: Session, tenant_id: str, document_id: str) -> tuple[dict, bytes]:
    record = (
        db.query(AdlerTenantDocument)
        .filter(AdlerTenantDocument.tenant_id == tenant_id)
        .filter(AdlerTenantDocument.id == document_id)
        .first()
    )
    if not record:
        raise HTTPException(status_code=404, detail="Documento não encontrado.")

    return _document_record_to_payload(record), bytes(record.file_bytes)



def delete_document(db: Session, tenant_id: str, document_id: str) -> None:
    record = (
        db.query(AdlerTenantDocument)
        .filter(AdlerTenantDocument.tenant_id == tenant_id)
        .filter(AdlerTenantDocument.id == document_id)
        .first()
    )
    if not record:
        raise HTTPException(status_code=404, detail="Documento não encontrado.")

    db.delete(record)
    db.commit()


def build_patients_csv(db: Session | None = None, tenant_id: str | None = None) -> str:
    lines = ['"nome","status","foco","diagnostico","protocolo_atual"']
    patients = list_patients(db=db, tenant_id=tenant_id) if db is not None and tenant_id is not None else PATIENTS
    for patient in patients:
        row = [
            patient["name"],
            patient["status"],
            patient["focus"],
            patient["diagnosis"],
            patient["current_protocol"],
        ]
        escaped_row = [f'"{str(value).replace(chr(34), chr(34) * 2)}"' for value in row]
        lines.append(",".join(escaped_row))
    return "\n".join(lines)
