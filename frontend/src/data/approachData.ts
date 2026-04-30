import type { ClinicalApproach } from "../context/AdlerShellContext";

type MetricProfile = {
  end: number;
  max?: number;
  min?: number;
  phase?: number;
  start: number;
  wave?: number;
};

type InsightDefinition = {
  confidenceProfile: MetricProfile;
  description: string;
  id: string;
  title: string;
};

type ApproachLensDefinition = {
  clinicalFrameByBand: [string, string, string];
  insights: InsightDefinition[];
  summaryByBand: [string, string, string];
};

export type ApproachSnapshot = {
  clinicalFrame: string;
  insights: {
    confidence: number;
    description: string;
    id: string;
    title: string;
  }[];
  summary: string;
};

export const APPROACH_DATA: Record<ClinicalApproach, ApproachLensDefinition> = {
  cbt: {
    summaryByBand: [
      "Sessoes iniciais mostram distorcoes cognitivas altas, hipervigilancia somatica e dependencia intensa de neutralizacao compulsiva.",
      "Sessoes medias revelam queda progressiva do medo somatico, mas com manutencao parcial dos rituais noturnos.",
      "Sessoes recentes indicam remissao gradual da ansiedade, com esquema de vulnerabilidade ainda ativo em momentos de fadiga."
    ],
    clinicalFrameByBand: [
      "Catastrofizacao do tumor e crencas de dano iminente estruturam a leitura clinica da paciente.",
      "A narrativa fica mais flexivel, embora o descanso siga condicionado a rituais de seguranca.",
      "O foco migra para prevencao de recaida e exposicao a incerteza sem neutralizacao."
    ],
    insights: [
      {
        id: "cbt-catastrophizing",
        title: "Distorcao Cognitiva: Catastrofizacao do tumor",
        description:
          "Sarah antecipa desfechos extremos a partir de sinais somaticos ambiguos, elevando ansiedade basal e busca por controle.",
        confidenceProfile: { start: 95, end: 72, wave: 2, phase: 1.2 }
      },
      {
        id: "cbt-schema",
        title: "Esquema dominante: vulnerabilidade ao dano",
        description:
          "A fala reforca a expectativa de colapso fisico iminente, com baixa tolerancia a incerteza clinica.",
        confidenceProfile: { start: 88, end: 79, wave: 1.6, phase: 0.4 }
      },
      {
        id: "cbt-ritual",
        title: "Comportamento de seguranca ritualizado",
        description:
          "Os rituais noturnos operam como reducao imediata de ameaca, mas preservam o ciclo de medo e insonia.",
        confidenceProfile: { start: 91, end: 68, wave: 2.2, phase: 0.9 }
      },
      {
        id: "cbt-core-belief",
        title: 'Crenca central: "Se eu relaxar, algo grave acontece"',
        description:
          "A paciente associa vigilancia continua a sobrevivencia, tornando o descanso percebido como risco.",
        confidenceProfile: { start: 89, end: 74, wave: 1.4, phase: 1.8 }
      }
    ]
  },
  psychoanalysis: {
    summaryByBand: [
      "No inicio do processo, o sofrimento se apresenta como angustia sem representacao, convertida em ritual e sintoma corporal.",
      "Ao longo das sessoes medias, os rituais passam a ser lidos como anulacao magica e defesa contra culpa difusa.",
      "No momento atual, o conflito autonomia-versus-punicao fica mais nomeavel, permitindo leitura menos concreta do sintoma."
    ],
    clinicalFrameByBand: [
      "O material aponta para conflito inconsciente ainda encapsulado em organizacao obsessiva do afeto.",
      "A anulacao magica surge como eixo dinamico mais robusto para entender o alivio ritualizado.",
      "A paciente passa a tolerar melhor a simbolizacao, reduzindo a necessidade de descarga compulsiva."
    ],
    insights: [
      {
        id: "psycho-magic-undoing",
        title: "Mecanismo de Defesa: Anulacao magica",
        description:
          "Os rituais neutralizam fantasias de dano e funcionam como reparacao simbolica frente a angustia.",
        confidenceProfile: { start: 62, end: 91, wave: 1.8, phase: 0.3 }
      },
      {
        id: "psycho-obsessional",
        title: "Organizacao obsessiva do afeto",
        description:
          "A paciente desloca a angustia para sequencias controlaveis, reduzindo contato direto com o conflito emocional.",
        confidenceProfile: { start: 66, end: 86, wave: 1.4, phase: 1.1 }
      },
      {
        id: "psycho-unconscious-conflict",
        title: "Conflito inconsciente: autonomia versus punicao",
        description:
          "Movimentos de separacao parecem ser seguidos por culpa e necessidade de expiacao ritual.",
        confidenceProfile: { start: 58, end: 82, wave: 2.4, phase: 1.8 }
      },
      {
        id: "psycho-somatic-symbol",
        title: "Somatizacao como inscricao do conflito",
        description:
          "O medo do tumor opera como figura condensada para conteudos persecutorios ainda pouco mentalizados.",
        confidenceProfile: { start: 60, end: 79, wave: 1.9, phase: 0.7 }
      }
    ]
  },
  psychiatry: {
    summaryByBand: [
      "As primeiras sessoes sugerem quadro ansioso com insonia importante e resposta farmacologica ainda em consolidacao.",
      "Na fase intermediaria, a adesao medicamentosa estabiliza e a leitura neuroquimica ganha confiabilidade.",
      "Nas sessoes mais recentes, o protocolo farmacologico mostra boa sustentacao, com risco funcional em queda progressiva."
    ],
    clinicalFrameByBand: [
      "A piora da insonia sugere descompensacao ansiosa com impacto em serotonina, GABA e risco de escalada compulsiva.",
      "A combinacao de resposta parcial ao ISRS e suporte hipnotico reduz o hiperalerta, mas ainda exige monitoramento.",
      "O quadro atual valida a dose vigente e desloca o foco para manutencao, tolerancia e prevencao de recaida."
    ],
    insights: [
      {
        id: "psych-med-response",
        title: "Eficacia Farmacologica parcial do hipnotico",
        description:
          "A latencia do sono diminuiu, mas a manutencao do sono segue instavel e dependente de ritual comportamental.",
        confidenceProfile: { start: 52, end: 85, wave: 1.5, phase: 0.6 }
      },
      {
        id: "psych-neuro-serotonin",
        title: "Carga serotoninergica sob pressao",
        description:
          "Persistencia do pensamento intrusivo sugere resposta incompleta na modulacao serotoninergica do circuito obsessivo.",
        confidenceProfile: { start: 68, end: 81, wave: 1.8, phase: 1.3 }
      },
      {
        id: "psych-neuro-gaba",
        title: "Janela GABAergica reduzida",
        description:
          "Hiperalerta somatico noturno esta superando o amortecimento ansiolitico esperado nas ultimas 48 horas.",
        confidenceProfile: { start: 74, end: 69, wave: 2.6, phase: 2.1 }
      },
      {
        id: "psych-risk-score",
        title: "Escore de Risco: escalada compulsiva moderada-alta",
        description:
          "A combinacao de privacao de sono, medo somatico e aumento de ritualizacao eleva o risco clinico funcional no curto prazo.",
        confidenceProfile: { start: 83, end: 62, wave: 2.2, phase: 0.8 }
      }
    ]
  },
  couples: {
    summaryByBand: [
      "Nas sessoes iniciais, o sofrimento aparece como ciclo relacional de busca de seguranca, acomodacao familiar e reforco involuntario dos rituais.",
      "Na fase intermediaria, o casal ou rede proxima passa a discriminar suporte de reassurance, reduzindo respostas que mantem a compulsao.",
      "No momento atual, ha mais comunicacao sobre medo, limites e combinados de cuidado sem participacao direta no ritual."
    ],
    clinicalFrameByBand: [
      "A lente de casal observa como pedidos de garantia e acomodacoes relacionais sustentam o ciclo ansiedade-ritual.",
      "O trabalho passa a diferenciar apoio emocional de participacao em neutralizacoes compulsivas.",
      "O foco atual e fortalecer pactos de comunicacao, limites e co-regulacao sem reforcar evitacao."
    ],
    insights: [
      {
        id: "couples-accommodation",
        title: "Acomodacao relacional do sintoma",
        description:
          "Sarah recebe alivio imediato quando a rede confirma seguranca, mas esse padrao pode prolongar a duvida obsessiva.",
        confidenceProfile: { start: 86, end: 62, wave: 1.8, phase: 0.8 }
      },
      {
        id: "couples-reassurance-loop",
        title: "Ciclo de reassurance",
        description:
          "Pedidos repetidos de confirmacao reduzem ansiedade por minutos, mas mantem intolerancia a incerteza no sistema relacional.",
        confidenceProfile: { start: 84, end: 58, wave: 2.1, phase: 1.4 }
      },
      {
        id: "couples-boundaries",
        title: "Limites de suporte em consolidacao",
        description:
          "A rede passa a validar sofrimento sem executar ou autorizar o ritual, favorecendo exposicao segura.",
        confidenceProfile: { start: 44, end: 82, wave: 1.6, phase: 0.3 }
      },
      {
        id: "couples-communication",
        title: "Comunicacao de medo sem fusao",
        description:
          "O caso ganha estabilidade quando Sarah nomeia necessidade emocional sem converter o vinculo em mecanismo de checagem.",
        confidenceProfile: { start: 42, end: 80, wave: 1.5, phase: 1.9 }
      }
    ]
  },
  generalist: {
    summaryByBand: [
      "Nas sessoes iniciais, a formulacao generalista prioriza seguranca, avaliacao dimensional, sono, ansiedade e funcionalidade.",
      "Na fase intermediaria, o plano integra psicoeducacao, habilidades de regulacao, monitoramento de escalas e encaminhamentos quando necessarios.",
      "No momento atual, a leitura clinica sintetiza sintomas, recursos, risco e resposta ao tratamento para orientar proximas decisoes."
    ],
    clinicalFrameByBand: [
      "A psicoterapia generalista organiza o caso por queixa principal, fatores mantenedores e prioridades de cuidado.",
      "A formulacao combina dados subjetivos, escalas, rotina e impacto funcional sem se prender a uma unica escola.",
      "O foco atual e manter progresso, revisar risco e decidir se ha necessidade de co-manejo ou avaliacao complementar."
    ],
    insights: [
      {
        id: "generalist-case-formulation",
        title: "Formulacao clinica integrada",
        description:
          "A prioridade e articular ansiedade, sono, rituais e funcionamento cotidiano em um plano compreensivel e mensuravel.",
        confidenceProfile: { start: 82, end: 86, wave: 1.4, phase: 0.5 }
      },
      {
        id: "generalist-functionality",
        title: "Impacto funcional monitorado",
        description:
          "A queda de rituais ganha valor clinico quando aparece associada a sono, trabalho, autocuidado e relacoes.",
        confidenceProfile: { start: 74, end: 84, wave: 1.6, phase: 1.1 }
      },
      {
        id: "generalist-care-plan",
        title: "Plano de cuidado escalonado",
        description:
          "A evolucao sugere manutencao psicoterapica, rastreio de risco e revisao interdisciplinar se houver piora de sono ou ideacao.",
        confidenceProfile: { start: 70, end: 82, wave: 1.8, phase: 1.6 }
      },
      {
        id: "generalist-measurement",
        title: "Medidas clinicas como bussola",
        description:
          "Escalas, transcricao e relato longitudinal ajudam a separar melhora global de alivio pontual apos rituais.",
        confidenceProfile: { start: 65, end: 83, wave: 1.5, phase: 0.2 }
      }
    ]
  },
  systemic: {
    summaryByBand: [
      "Nas sessoes iniciais, o sintoma aparece ligado a padroes circulares entre medo, resposta da rede e organizacao da rotina.",
      "Na fase intermediaria, a hipotese sistemica destaca regras implicitas, triangulacoes e sequencias que estabilizam o problema.",
      "No momento atual, a rede mostra maior flexibilidade e menor participacao nos ciclos que reforcavam ritual, insomnia e evitacao."
    ],
    clinicalFrameByBand: [
      "A lente sistemica prioriza circularidade, contexto, comunicacao e funcao relacional do sintoma.",
      "A intervencao observa sequencias repetitivas e modifica pequenas respostas do sistema para alterar o padrao.",
      "O foco atual e consolidar novas regras de comunicacao, autonomia e suporte sem retroalimentar o ciclo sintomatico."
    ],
    insights: [
      {
        id: "systemic-circularity",
        title: "Circularidade sintomatica",
        description:
          "O medo de Sarah convoca respostas de controle na rede, que aliviam no curto prazo e estabilizam o problema no longo prazo.",
        confidenceProfile: { start: 84, end: 64, wave: 1.7, phase: 0.7 }
      },
      {
        id: "systemic-family-rules",
        title: "Regra implicita: proteger reduz conflito",
        description:
          "A rede parece evitar tensao oferecendo garantia, mas esse padrao limita autonomia e tolerancia a incerteza.",
        confidenceProfile: { start: 78, end: 66, wave: 1.8, phase: 1.5 }
      },
      {
        id: "systemic-feedback",
        title: "Feedback de rotina e sono",
        description:
          "Alteracoes em sono e rotina familiar modificam a intensidade dos rituais, sugerindo ponto de intervencao contextual.",
        confidenceProfile: { start: 72, end: 83, wave: 1.5, phase: 0.4 }
      },
      {
        id: "systemic-network-shift",
        title: "Rede com resposta mais flexivel",
        description:
          "A melhora aparece quando o sistema valida sofrimento, reduz acomodacao e amplia escolhas fora da logica do sintoma.",
        confidenceProfile: { start: 48, end: 81, wave: 1.6, phase: 1.8 }
      }
    ]
  },
  schema: {
    summaryByBand: [
      "O inicio do caso mostra ativacao intensa dos esquemas de vulnerabilidade ao dano e padroes de hipercontrole para evitar colapso percebido.",
      "Na fase intermediaria, modos esquematicos ficam mais nomeaveis, com alternancia entre Criança Vulneravel e Protetor Hipercompensador.",
      "Nas sessoes atuais, a paciente sustenta mais reparentalizacao limitada e reduz a urgencia do modo controlador em cenarios de fadiga."
    ],
    clinicalFrameByBand: [
      "A leitura principal aponta para esquema nuclear de vulnerabilidade ao dano e necessidade de controle antecipatorio.",
      "Os modos Criança Vulneravel, Protetor Hipercompensador e Pai Punitivo ficam mais evidentes ao longo do acompanhamento.",
      "O trabalho atual se concentra em enfraquecer o modo controlador e fortalecer o Adulto Saudavel."
    ],
    insights: [
      {
        id: "schema-vulnerability",
        title: "Esquema: vulnerabilidade ao dano",
        description:
          "A paciente opera sob expectativa persistente de que algo grave pode acontecer a qualquer momento se baixar a vigilancia.",
        confidenceProfile: { start: 93, end: 74, wave: 1.7, phase: 0.9 }
      },
      {
        id: "schema-mode-vulnerable-child",
        title: "Modo ativado: Crianca Vulneravel",
        description:
          "Sensacoes corporais e noites mal dormidas reativam medo de desamparo e necessidade de protecao imediata.",
        confidenceProfile: { start: 88, end: 69, wave: 1.9, phase: 1.4 }
      },
      {
        id: "schema-mode-controller",
        title: "Modo compensatorio: Controlador Hipercompensador",
        description:
          "O ritual funciona como tentativa de dominar incerteza, reduzir angustia e evitar o contato com fragilidade subjetiva.",
        confidenceProfile: { start: 86, end: 63, wave: 2.2, phase: 0.4 }
      },
      {
        id: "schema-healthy-adult",
        title: "Adulto Saudavel em expansao",
        description:
          "Ha crescimento progressivo da capacidade de observar o esquema, nomear o modo e escolher resposta mais regulada.",
        confidenceProfile: { start: 38, end: 80, wave: 1.4, phase: 1.7 }
      }
    ]
  }
};

export function getApproachSnapshot(
  approach: ClinicalApproach,
  session: number,
  patientName = "Sarah"
): ApproachSnapshot {
  const definition = APPROACH_DATA[approach];
  const band = session <= 6 ? 0 : session <= 12 ? 1 : 2;

  return {
    clinicalFrame: definition.clinicalFrameByBand[band],
    summary: definition.summaryByBand[band],
    insights: definition.insights.map((insight) => ({
      id: insight.id,
      title: insight.title,
      description: personalizeText(insight.description, patientName),
      confidence: resolveProfileValue(insight.confidenceProfile, session)
    }))
  };
}

function resolveProfileValue(profile: MetricProfile, session: number) {
  const progress = (session - 1) / 17;
  const wave = Math.sin(progress * Math.PI * 3 + (profile.phase ?? 0)) * (profile.wave ?? 0);
  const rawValue = profile.start + (profile.end - profile.start) * progress + wave;
  const min = profile.min ?? 0;
  const max = profile.max ?? 100;

  return clamp(Math.round(rawValue), min, max);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function personalizeText(text: string, patientName: string) {
  return text.replace(/\bSarah\b/g, patientName);
}
