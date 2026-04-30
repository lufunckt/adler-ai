import type { PatientRecord } from "./patientData";

export type PsychologicalTestEntry = {
  appliedIn: string;
  interpretation: string;
  name: string;
  range: string;
  score: string;
  trend: string;
};

const TESTS_BY_PATIENT: Record<string, PsychologicalTestEntry[]> = {
  "sarah-m": [
    {
      name: "Y-BOCS",
      score: "24 / 40",
      range: "moderado",
      interpretation: "intensidade obsessivo-compulsiva ainda clinicamente relevante",
      trend: "-8 pontos desde a Sessao 1",
      appliedIn: "Sessao 18"
    },
    {
      name: "GAD-7",
      score: "9 / 21",
      range: "leve a moderado",
      interpretation: "queda consistente da ansiedade generalizada com vulnerabilidade residual",
      trend: "-12 pontos desde a linha de base",
      appliedIn: "Sessao 18"
    },
    {
      name: "OCI-R",
      score: "21 / 72",
      range: "risco residual",
      interpretation: "checagens e neutralizacao ainda aparecem sob fadiga e insonia",
      trend: "redução gradual em 4 aplicacoes",
      appliedIn: "Sessao 17"
    }
  ],
  "daniel-r": [
    {
      name: "PHQ-9",
      score: "10 / 27",
      range: "moderado",
      interpretation: "depressao em reducao, com anedonia e fadiga ainda presentes",
      trend: "-7 pontos desde a Sessao 1",
      appliedIn: "Sessao 16"
    },
    {
      name: "ISI",
      score: "15 / 28",
      range: "insônia moderada",
      interpretation: "latencia de sono melhorou, mas despertares ainda interferem na recuperacao",
      trend: "-5 pontos desde a linha de base",
      appliedIn: "Sessao 15"
    },
    {
      name: "BAI",
      score: "14 / 63",
      range: "leve",
      interpretation: "ativacao vegetativa menor, ainda sensivel a jejum e privacao de sono",
      trend: "-6 pontos",
      appliedIn: "Sessao 14"
    }
  ],
  "helena-v": [
    {
      name: "PCL-5",
      score: "31 / 80",
      range: "clinicamente significativo",
      interpretation: "sintomas de TEPT em queda parcial, com hipervigilancia persistente",
      trend: "-9 pontos desde o inicio",
      appliedIn: "Sessao 15"
    },
    {
      name: "PSQI",
      score: "11 / 21",
      range: "sono ruim",
      interpretation: "pesadelos reduziram intensidade, mas a qualidade subjetiva do sono segue prejudicada",
      trend: "melhora discreta nas ultimas 6 semanas",
      appliedIn: "Sessao 15"
    },
    {
      name: "DES-II",
      score: "18 / 100",
      range: "baixo a moderado",
      interpretation: "fenomenos dissociativos leves em contextos de gatilho",
      trend: "estavel",
      appliedIn: "Sessao 13"
    }
  ],
  "marcus-a": [
    {
      name: "MDQ",
      score: "7 itens positivos",
      range: "compatível com bipolaridade",
      interpretation: "perfil historico consistente com espectro bipolar e necessidade de seguimento continuado",
      trend: "sem mudanca esperada por ser rastreio diagnostico",
      appliedIn: "Sessao 3"
    },
    {
      name: "QIDS-SR",
      score: "7 / 27",
      range: "leve",
      interpretation: "sintomas depressivos residuais em queda com estabilizacao progressiva",
      trend: "-6 pontos desde a linha de base",
      appliedIn: "Sessao 14"
    },
    {
      name: "ISI",
      score: "12 / 28",
      range: "subclínico a leve",
      interpretation: "sono mais estavel, ainda vulneravel a sobrecarga de trabalho e viradas noturnas",
      trend: "-8 pontos",
      appliedIn: "Sessao 14"
    }
  ],
  "rafael-n": [
    {
      name: "ASRS-1",
      score: "5 / 6 itens de triagem",
      range: "positivo",
      interpretation: "perfil compativel com TDAH adulto, com impacto executivo e desorganizacao do sono",
      trend: "rastreio confirmado na Sessao 12",
      appliedIn: "Sessao 12"
    },
    {
      name: "DIVA-5",
      score: "criterios nucleares preenchidos",
      range: "diagnostico sustentado",
      interpretation: "historia evolutiva e funcionamento atual corroboram quadro atencional persistente",
      trend: "sem mudanca esperada",
      appliedIn: "Sessao 13"
    },
    {
      name: "BRIEF-A",
      score: "T 72",
      range: "elevado",
      interpretation: "prejuizo executivo importante em iniciacao, planejamento e finalizacao",
      trend: "leve melhora subjetiva",
      appliedIn: "Sessao 14"
    }
  ],
  "bruno-l": [
    {
      name: "AUDIT",
      score: "21 / 40",
      range: "uso nocivo / provavel dependencia",
      interpretation: "binge alcoolico ainda com risco alto, apesar de reducao parcial de frequencia",
      trend: "-4 pontos desde a linha de base",
      appliedIn: "Sessao 11"
    },
    {
      name: "ASSIST",
      score: "alcool 24 | cocaina 18",
      range: "intervencao intensiva",
      interpretation: "uso de alcool e cocaina segue exigindo manejo estruturado de reducao de danos",
      trend: "queda discreta de risco agudo",
      appliedIn: "Sessao 11"
    },
    {
      name: "PHQ-9",
      score: "11 / 27",
      range: "moderado",
      interpretation: "humor deprimido associado a craving, culpa e fragmentacao do sono",
      trend: "-3 pontos",
      appliedIn: "Sessao 10"
    }
  ]
};

export function getPsychologicalTests(patient: PatientRecord) {
  return TESTS_BY_PATIENT[patient.id] ?? [];
}
