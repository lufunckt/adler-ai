import type { ClinicalApproach } from "../context/AdlerShellContext";

type RiskSeverity = "stable" | "guarded" | "critical";

export type ClinicalRiskSnapshot = {
  focusLabel: string;
  note: string;
  score: number;
  severity: RiskSeverity;
  statusLabel: string;
};

const RISK_HISTORY: Record<ClinicalApproach, number[]> = {
  cbt: [65, 64, 63, 62, 60, 58, 55, 52, 49, 46, 44, 42, 39, 36, 34, 32, 30, 28],
  psychoanalysis: [58, 58, 57, 56, 54, 52, 50, 48, 47, 45, 44, 42, 40, 38, 36, 35, 33, 31],
  psychiatry: [62, 62, 61, 60, 58, 56, 54, 52, 50, 48, 46, 44, 42, 40, 38, 37, 35, 34],
  schema: [64, 63, 62, 61, 59, 57, 55, 53, 50, 47, 45, 43, 41, 39, 37, 35, 33, 30],
  couples: [57, 56, 55, 54, 52, 50, 48, 46, 44, 42, 40, 38, 36, 35, 33, 31, 30, 28],
  generalist: [60, 59, 58, 56, 54, 52, 50, 48, 45, 43, 41, 39, 37, 35, 34, 32, 30, 29],
  systemic: [59, 58, 57, 55, 53, 51, 49, 47, 45, 43, 41, 39, 37, 35, 33, 32, 30, 28]
};

const RISK_LABELS: Record<ClinicalApproach, string> = {
  cbt: "Risco de Recaida",
  psychoanalysis: "Risco de Acting Out / Retorno do Conflito",
  psychiatry: "Risco Metabolico / Efeitos Colaterais",
  schema: "Risco de Reativacao Esquematica",
  couples: "Risco de Acomodacao Relacional",
  generalist: "Risco Clinico Global",
  systemic: "Risco de Padrao Circular"
};

const RISK_NOTES: Record<
  ClinicalApproach,
  Record<RiskSeverity, string>
> = {
  cbt: {
    critical:
      "A dependencia de neutralizacao compulsiva ainda sustenta risco critico de recaida caso a exposicao seja interrompida.",
    guarded:
      "A recaida permanece em vigilancia moderada, com melhora parcial da tolerancia a incerteza e menor dependencia de ritual.",
    stable:
      "A consolidacao das exposicoes reduz a probabilidade de retorno abrupto da ansiedade nas proximas semanas."
  },
  psychoanalysis: {
    critical:
      "O conflito ainda busca descarga em ritualizacao e controle, mantendo risco alto de repeticao sintomatica.",
    guarded:
      "A simbolizacao cresce, mas a paciente ainda mobiliza defesas obsessivas diante de separacao e culpa.",
    stable:
      "O material encontra mais representacao psiquica e o risco de acting out cai para a faixa de manutencao."
  },
  psychiatry: {
    critical:
      "Insônia, uso de benzodiazepinico e pressao fisiologica mantem vigilancia elevada para efeitos colaterais e descompensacao clinica.",
    guarded:
      "A tolerabilidade farmacologica melhora, embora a janela de monitoramento siga ativa para sedacao e oscilacao funcional.",
    stable:
      "Adesao sustentada e perfil CYP2D6 compativel mantem o protocolo em faixa controlada de risco metabolico."
  },
  schema: {
    critical:
      "Os modos Crianca Vulneravel e Controlador Hipercompensador ainda dominam a resposta diante de ameaca corporal e incerteza.",
    guarded:
      "O Adulto Saudavel aparece com mais frequencia, mas o esquema de vulnerabilidade segue facilmente reativado em contexto de fadiga.",
    stable:
      "A paciente reconhece melhor o esquema, modula os modos e reduz a urgencia do controle ritualizado."
  },
  couples: {
    critical:
      "A rede segue participando de pedidos de garantia e pode reforcar neutralizacao compulsiva em momentos de crise.",
    guarded:
      "O casal ou rede diferencia melhor suporte de reassurance, mas ainda oscila sob privacao de sono e medo somatico.",
    stable:
      "A comunicacao valida sofrimento sem reforcar ritual, reduzindo acomodacao e risco relacional."
  },
  generalist: {
    critical:
      "O conjunto sono, ansiedade, ritual e funcionalidade ainda exige vigilancia ampla antes de reduzir intensidade do cuidado.",
    guarded:
      "A evolucao e favoravel, mas a formulacao integrada ainda recomenda monitoramento de risco e escalas.",
    stable:
      "Sintomas, funcionamento e adesao ao plano estao em faixa compativel com manutencao clinica."
  },
  systemic: {
    critical:
      "O sistema ainda responde ao sintoma de modo circular, aumentando dependencia de checagem e rigidez contextual.",
    guarded:
      "As respostas da rede melhoraram, mas algumas sequencias familiares ainda reativam ritual e hipervigilancia.",
    stable:
      "O padrao circular perdeu intensidade, com mais autonomia e suporte contextual sem retroalimentacao do sintoma."
  }
};

export function getClinicalRiskSnapshot(
  approach: ClinicalApproach,
  session: number
): ClinicalRiskSnapshot {
  const scores = RISK_HISTORY[approach];
  const score = scores[session - 1] ?? scores[scores.length - 1];
  const severity = resolveSeverity(score);

  return {
    focusLabel: RISK_LABELS[approach],
    note: RISK_NOTES[approach][severity],
    score,
    severity,
    statusLabel:
      severity === "critical"
        ? "Critical"
        : severity === "guarded"
          ? "Guarded"
          : "Stable"
  };
}

function resolveSeverity(score: number): RiskSeverity {
  if (score >= 60) {
    return "critical";
  }

  if (score >= 45) {
    return "guarded";
  }

  return "stable";
}
