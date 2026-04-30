export type TranscriptSegment = {
  id: string;
  speaker: string;
  text: string;
  timestamp: string;
};

export type MedicationEntry = {
  alert?: string;
  dose: string;
  efficacy?: number;
  efficacyLabel?: string;
  highlight?: string;
  subtitle: string;
  title: string;
};

export type GeneticsProfile = {
  badge: string;
  compatibility: number;
  gene: string;
  gradientEnd: string;
  gradientStart: string;
  phenotype: string;
  summary: string;
};

export type PharmacologyLens = {
  detail: string;
  label: string;
  value: string;
};

export type DifferentialAlert = {
  note: string;
  session: number;
};

export type LaboratoryMonitoringItem = {
  frequency: string;
  lastResult: string;
  name: string;
  purpose: string;
  status: "alert" | "due" | "ok";
};

export type LaboratoryMonitoringProfile = {
  alertSymptoms: string;
  baseline: string;
  interactionNote: string;
  maintenanceSchedule: string;
  medication: string;
  startSchedule: string;
  tests: LaboratoryMonitoringItem[];
};

export type MedicationInteractionItem = {
  category: "alimento" | "alerta" | "sinergia";
  counterpart: string;
  effect: string;
  guidance: string;
  severity: "alto" | "moderado" | "protetor";
  title: string;
};

export type HarmReductionProfile = {
  activeSubstances: string[];
  currentStage: string;
  goals: string[];
  redFlags: string;
  safetyPlan: string[];
  supportNetwork: string;
};

export type PatientRecord = {
  currentProtocol: string;
  defaultSession: number;
  diagnosis: string;
  differentialAlert: DifferentialAlert;
  focus: string;
  genetics: GeneticsProfile;
  harmReduction?: HarmReductionProfile;
  id: string;
  initials: string;
  interactions?: MedicationInteractionItem[];
  labs?: LaboratoryMonitoringProfile;
  medications: {
    primary: MedicationEntry;
    secondary: MedicationEntry;
  };
  name: string;
  pharmacology: {
    pharmacodynamic: PharmacologyLens;
    pharmacokinetic: PharmacologyLens;
  };
  recorder: {
    duration: string;
    summary: string;
    title: string;
    transcriptSegments: TranscriptSegment[];
  };
};

export const PATIENTS: PatientRecord[] = [
  {
    id: "sarah-m",
    name: "Sarah M.",
    initials: "SM",
    focus: "OCD / health anxiety",
    diagnosis: "Obsessive-compulsive spectrum with nocturnal hypervigilance",
    currentProtocol: "CBT exposure + SSRI stabilization",
    defaultSession: 18,
    recorder: {
      title: "Session 18 // Nocturnal ritual review",
      duration: "24m 18s",
      summary:
        "Audio capture indicates lower ritual latency after stable sertraline dosing, with residual morning sedation after lorazepam rescue.",
      transcriptSegments: [
        {
          id: "sm-1",
          speaker: "Therapist",
          timestamp: "00:14",
          text: "When the sertraline is taken before 07:30, the body scan starts later and the fear spike loses intensity."
        },
        {
          id: "sm-2",
          speaker: "Sarah",
          timestamp: "03:42",
          text: "If I delay the dose, the ritual loop comes back faster. Lorazepam helps me sleep, but I wake up slower and foggy."
        },
        {
          id: "sm-3",
          speaker: "Therapist",
          timestamp: "09:18",
          text: "That suggests a pharmacodynamic gain on hyperarousal with a pharmacokinetic cost in residual morning sedation."
        },
        {
          id: "sm-4",
          speaker: "Sarah",
          timestamp: "16:40",
          text: "The compulsions drop when I keep the same dose and stop negotiating with the fear."
        }
      ]
    },
    medications: {
      primary: {
        title: "Sertralina",
        subtitle: "Antidepressivo ISRS",
        dose: "50mg",
        efficacy: 75,
        efficacyLabel: "Eficacia atual",
        highlight: "Alvo terapeutico: Transportador de Serotonina (SERT)"
      },
      secondary: {
        title: "Lorazepam",
        subtitle: "Ansiolitico",
        dose: "0.5mg",
        alert: "Risco de Tolerancia: Recomenda-se desmame gradual pos-Sessao 20."
      }
    },
    genetics: {
      gene: "CYP2D6",
      phenotype: "Metabolizador Normal",
      summary:
        "Processamento da sertralina dentro da janela esperada, com baixa probabilidade de acumulacao farmacocinetica na dose atual.",
      compatibility: 84,
      badge: "genotype pass",
      gradientStart: "rgba(139,92,246,0.95)",
      gradientEnd: "rgba(34,211,238,0.95)"
    },
    pharmacology: {
      pharmacokinetic: {
        label: "Pharmacokinetic Window",
        value: "Tmax 4.5h",
        detail: "steady-state preserved with less than 10% day-to-day variability in perceived onset"
      },
      pharmacodynamic: {
        label: "Pharmacodynamic Signal",
        value: "SERT 78%",
        detail: "reduced nocturnal threat amplification and lower compulsive rebound across sessions 14-18"
      }
    },
    interactions: [
      {
        title: "Sertralina + refeicao matinal",
        counterpart: "cafe da manha proteico",
        category: "sinergia",
        effect: "melhora a regularidade de horario e reduz atrasos na tomada",
        guidance: "manter horario fixo e ingestao apos refeicao leve",
        severity: "protetor"
      },
      {
        title: "Lorazepam + alcool",
        counterpart: "bebidas alcoolicas",
        category: "alerta",
        effect: "potencializa sedacao, prejuizo cognitivo e risco de queda",
        guidance: "evitar uso concomitante e reforcar orientacao de seguranca",
        severity: "alto"
      }
    ],
    differentialAlert: {
      session: 12,
      note:
        "Padrao de distracao na Sessao 12 sugere 22% de probabilidade de TDAH nao diagnosticado. Recomenda-se aplicacao da escala ASRS-1."
    }
  },
  {
    id: "daniel-r",
    name: "Daniel R.",
    initials: "DR",
    focus: "Major depression / sleep onset insomnia",
    diagnosis: "Depressive episode with adrenergic activation at night",
    currentProtocol: "Behavioral activation + SNRI titration",
    defaultSession: 16,
    recorder: {
      title: "Session 16 // Morning activation review",
      duration: "19m 52s",
      summary:
        "Transcript suggests faster daytime engagement after venlafaxine XR steady state, with partial insomnia carryover after missed meals.",
      transcriptSegments: [
        {
          id: "dr-1",
          speaker: "Therapist",
          timestamp: "01:05",
          text: "What happens on mornings after you skip breakfast and take venlafaxine on an empty stomach?"
        },
        {
          id: "dr-2",
          speaker: "Daniel",
          timestamp: "04:21",
          text: "I feel sharper for two hours, then shaky. If I eat first, the activation feels smoother."
        },
        {
          id: "dr-3",
          speaker: "Therapist",
          timestamp: "08:12",
          text: "That points to a pharmacokinetic sensitivity around absorption rather than a pure mood regression."
        }
      ]
    },
    medications: {
      primary: {
        title: "Venlafaxina XR",
        subtitle: "SNRI",
        dose: "75mg",
        efficacy: 68,
        efficacyLabel: "Resposta antidepressiva",
        highlight: "Alvo terapeutico: SERT + NET modulation"
      },
      secondary: {
        title: "Quetiapina",
        subtitle: "Atypical antipsychotic / hypnotic bridge",
        dose: "25mg",
        alert: "Risco Metabolico: Monitorar ganho ponderal e sedacao residual ao despertar."
      }
    },
    genetics: {
      gene: "CYP2D6",
      phenotype: "Metabolizador Intermediario",
      summary:
        "Clearance discretamente mais lenta, justificando vigilancia de efeitos colaterais durante titracao de SNRI.",
      compatibility: 71,
      badge: "monitor closely",
      gradientStart: "rgba(251,191,36,0.95)",
      gradientEnd: "rgba(56,189,248,0.95)"
    },
    pharmacology: {
      pharmacokinetic: {
        label: "Pharmacokinetic Window",
        value: "Tmax 5.2h",
        detail: "absorption becomes more erratic when dose timing is dissociated from food intake"
      },
      pharmacodynamic: {
        label: "Pharmacodynamic Signal",
        value: "NET 52%",
        detail: "higher daytime drive with mild adrenergic overstimulation during the first half of the dosing window"
      }
    },
    differentialAlert: {
      session: 9,
      note:
        "Oscilacao de energia e fala acelerada em Sessao 9 sugerem 18% de probabilidade de bipolaridade tipo II subdiagnosticada."
    }
  },
  {
    id: "helena-v",
    name: "Helena V.",
    initials: "HV",
    focus: "PTSD / hyperarousal",
    diagnosis: "Post-traumatic hypervigilance with trauma-linked nightmares",
    currentProtocol: "Trauma-focused psychotherapy + alpha-1 modulation",
    defaultSession: 15,
    recorder: {
      title: "Session 15 // Nightmare pattern extraction",
      duration: "27m 04s",
      summary:
        "Passive data and dialogue indicate prazosin benefit on nightmare intensity, with persistent autonomic activation at dusk.",
      transcriptSegments: [
        {
          id: "hv-1",
          speaker: "Therapist",
          timestamp: "02:28",
          text: "The prazosin seems to blunt the nightmare intensity, but the body still braces before sleep."
        },
        {
          id: "hv-2",
          speaker: "Helena",
          timestamp: "05:54",
          text: "The dreams are less violent, but my chest stays tight at sunset like the system is preparing for impact."
        },
        {
          id: "hv-3",
          speaker: "Therapist",
          timestamp: "11:17",
          text: "That is a pharmacodynamic separation between dream suppression and residual sympathetic activation."
        }
      ]
    },
    medications: {
      primary: {
        title: "Escitalopram",
        subtitle: "Antidepressivo ISRS",
        dose: "10mg",
        efficacy: 72,
        efficacyLabel: "Controle de hipervigilancia",
        highlight: "Alvo terapeutico: serotonergic tone stabilization"
      },
      secondary: {
        title: "Prazosin",
        subtitle: "Alpha-1 modulation",
        dose: "1mg",
        alert: "Pressao arterial: observar hipotensao postural na primeira hora apos administracao."
      }
    },
    genetics: {
      gene: "CYP2C19",
      phenotype: "Metabolizador Normal",
      summary:
        "Janela de eliminacao compativel com uso noturno sem sinal de acumulacao clinicamente relevante.",
      compatibility: 79,
      badge: "night dosing compatible",
      gradientStart: "rgba(99,102,241,0.95)",
      gradientEnd: "rgba(34,211,238,0.95)"
    },
    pharmacology: {
      pharmacokinetic: {
        label: "Pharmacokinetic Window",
        value: "Half-life 27h",
        detail: "stable elimination supports once-daily dosing without abrupt troughs"
      },
      pharmacodynamic: {
        label: "Pharmacodynamic Signal",
        value: "alpha-1 dampening",
        detail: "nightmare intensity down, but peripheral hyperarousal remains partly uncoupled from dream frequency"
      }
    },
    differentialAlert: {
      session: 7,
      note:
        "Padrao dissociativo em Sessao 7 sugere 16% de probabilidade de subtipo dissociativo de TEPT."
    }
  },
  {
    id: "marcus-a",
    name: "Marcus A.",
    initials: "MA",
    focus: "Bipolar II maintenance",
    diagnosis: "Bipolar II depressive recovery with residual insomnia",
    currentProtocol: "Mood stabilization + circadian repair",
    defaultSession: 14,
    recorder: {
      title: "Session 14 // Mood rhythm calibration",
      duration: "21m 33s",
      summary:
        "The recording captures mood stabilization after lithium titration, with residual late-night arousal after workload spikes and active litemia monitoring.",
      transcriptSegments: [
        {
          id: "ma-1",
          speaker: "Marcus",
          timestamp: "03:08",
          text: "O litio segurou melhor a oscilacao, mas se eu viro a noite trabalhando ainda fico acelerado e sem freio."
        },
        {
          id: "ma-2",
          speaker: "Therapist",
          timestamp: "07:44",
          text: "A amplitude do humor caiu, mas precisamos manter litemia, funcao renal e tireoide sob vigilancia para sustentar a estabilizacao com seguranca."
        }
      ]
    },
    medications: {
      primary: {
        title: "Litio",
        subtitle: "Psicoestabilizador",
        dose: "900mg/dia",
        efficacy: 81,
        efficacyLabel: "Estabilidade de humor",
        highlight: "Faixa terapeutica estreita: requer litemia e vigilancia renal/tireoidiana."
      },
      secondary: {
        title: "Lamotrigina",
        subtitle: "Adjunto estabilizador",
        dose: "100mg",
        alert: "Monitorar adesao e progressao lenta de dose para reduzir risco cutaneo."
      }
    },
    labs: {
      medication: "Litio",
      baseline:
        "Baseline concluido com ureia, creatinina, TSH, T4 livre e ECG antes da titulacao.",
      startSchedule:
        "Litemia a cada 1-2 semanas ate estabilizacao, sempre 12 horas apos a ultima dose.",
      maintenanceSchedule:
        "Litemia e funcao renal a cada 3-6 meses, com revisao de tireoide e eletrólitos em seguimento.",
      alertSymptoms:
        "Tremor grosseiro, nausea, vomitos, diarreia, confusao mental, sonolencia excessiva ou dificuldade na fala exigem coleta imediata.",
      interactionNote:
        "Anti-inflamatorios nao esteroidais e alguns diureticos podem elevar a litemia e precipitar intoxicacao.",
      tests: [
        {
          name: "Litemia 12h",
          frequency: "1-2 semanas / 3-6 meses",
          purpose: "faixa terapeutica e ajuste de dose",
          lastResult: "0.72 mEq/L",
          status: "ok"
        },
        {
          name: "Creatinina, ureia e TFG",
          frequency: "baseline / trimestral",
          purpose: "funcao renal",
          lastResult: "Creatinina 0.94 mg/dL",
          status: "ok"
        },
        {
          name: "TSH e T4 livre",
          frequency: "baseline / semestral",
          purpose: "vigilancia tireoidiana",
          lastResult: "TSH 4.3 mUI/L",
          status: "due"
        },
        {
          name: "Na, K e Ca",
          frequency: "trimestral",
          purpose: "equilibrio eletrolitico",
          lastResult: "Sodio 139 mEq/L",
          status: "ok"
        },
        {
          name: "Hemograma completo",
          frequency: "baseline / semestral",
          purpose: "avaliacao geral e seguimento",
          lastResult: "Plaquetas e leucocitos sem alteracoes",
          status: "ok"
        }
      ]
    },
    interactions: [
      {
        title: "Litio + anti-inflamatorios",
        counterpart: "ibuprofeno, naproxeno",
        category: "alerta",
        effect: "eleva litemia e aumenta risco de intoxicacao",
        guidance: "checar automedicacao e repetir litemia se houver uso recente",
        severity: "alto"
      },
      {
        title: "Litio + baixo consumo de sodio",
        counterpart: "dietas restritivas de sodio",
        category: "alimento",
        effect: "favorece retencao renal de litio e oscilacao de niveis sericos",
        guidance: "manter ingestao hidrica e sodio estaveis ao longo da semana",
        severity: "moderado"
      },
      {
        title: "Lamotrigina + regularidade de sono",
        counterpart: "higiene circadiana consistente",
        category: "sinergia",
        effect: "reduz gatilhos de oscilacao residual e melhora estabilidade subjetiva",
        guidance: "reforcar rotina de sono e evitar viradas de noite",
        severity: "protetor"
      }
    ],
    genetics: {
      gene: "UGT1A4",
      phenotype: "Expressao esperada",
      summary:
        "Sem sinal de metabolismo acelerado para lamotrigina dentro do protocolo atual.",
      compatibility: 77,
      badge: "stable clearance",
      gradientStart: "rgba(168,85,247,0.95)",
      gradientEnd: "rgba(59,130,246,0.95)"
    },
    pharmacology: {
      pharmacokinetic: {
        label: "Pharmacokinetic Window",
        value: "steady-state 5d",
        detail: "dose response remains smooth without abrupt plasma peaks across the observed week"
      },
      pharmacodynamic: {
        label: "Pharmacodynamic Signal",
        value: "glutamate buffering",
        detail: "reduced mood lability with incomplete protection against workload-driven late arousal"
      }
    },
    differentialAlert: {
      session: 6,
      note:
        "Reatividade interpessoal em Sessao 6 sugere 14% de probabilidade de traco ciclotimico residual."
    }
  },
  {
    id: "camila-s",
    name: "Camila S.",
    initials: "CS",
    focus: "Panic disorder / autonomic surges",
    diagnosis: "Panic attacks with anticipatory avoidance and somatic amplification",
    currentProtocol: "Interoceptive exposure + SSRI onboarding",
    defaultSession: 13,
    recorder: {
      title: "Session 13 // Panic threshold mapping",
      duration: "18m 47s",
      summary:
        "Audio transcript indicates lower attack frequency after fluoxetine onset, with persisting beta-adrenergic sensitivity before commuting.",
      transcriptSegments: [
        {
          id: "cs-1",
          speaker: "Camila",
          timestamp: "02:51",
          text: "The panic is less explosive, but my chest still tightens before I leave home."
        },
        {
          id: "cs-2",
          speaker: "Therapist",
          timestamp: "06:30",
          text: "The fluoxetine is lowering catastrophic amplification, while propranolol is only partially covering the adrenergic surge."
        }
      ]
    },
    medications: {
      primary: {
        title: "Fluoxetina",
        subtitle: "Antidepressivo ISRS",
        dose: "20mg",
        efficacy: 66,
        efficacyLabel: "Reducao de ataques",
        highlight: "Alvo terapeutico: serotonergic dampening of panic amplification"
      },
      secondary: {
        title: "Propranolol",
        subtitle: "Beta-blocker PRN",
        dose: "10mg",
        alert: "Monitorar fadiga e queda de desempenho fisico quando associado a jejum prolongado."
      }
    },
    genetics: {
      gene: "CYP2D6",
      phenotype: "Metabolizador Normal",
      summary:
        "Compatibilidade adequada com fluoxetina em baixa dose, mantendo janela segura para onboarding.",
      compatibility: 76,
      badge: "onboarding safe",
      gradientStart: "rgba(251,146,60,0.95)",
      gradientEnd: "rgba(45,212,191,0.95)"
    },
    pharmacology: {
      pharmacokinetic: {
        label: "Pharmacokinetic Window",
        value: "Half-life 4-6d",
        detail: "slow accumulation explains delayed but progressive reduction in panic intensity"
      },
      pharmacodynamic: {
        label: "Pharmacodynamic Signal",
        value: "panic gain down",
        detail: "reduced catastrophic escalation with residual peripheral adrenergic spikes during commuting exposure"
      }
    },
    differentialAlert: {
      session: 8,
      note:
        "Sensibilidade interoceptiva extrema em Sessao 8 sugere 12% de probabilidade de POTS a ser rastreado em avaliacao medica."
    }
  },
  {
    id: "bruno-l",
    name: "Bruno L.",
    initials: "BL",
    focus: "Dependencia quimica / reducao de danos",
    diagnosis: "Uso problematico de alcool e cocaina com episodios de binge, craving e deterioracao do sono",
    currentProtocol: "Reducao de danos + manejo de craving + estabilizacao do sono",
    defaultSession: 11,
    recorder: {
      title: "Sessao 11 // Revisao de gatilhos e fissura",
      duration: "26m 11s",
      summary:
        "A gravacao mostra reducao de danos mais consistente, com queda de binge alcoolico e maior capacidade de interrupcao antes do uso de cocaina.",
      transcriptSegments: [
        {
          id: "bl-1",
          speaker: "Bruno",
          timestamp: "01:58",
          text: "Nao fiquei abstinente a semana toda, mas consegui parar no terceiro drink e nao virei a madrugada como antes."
        },
        {
          id: "bl-2",
          speaker: "Therapist",
          timestamp: "06:12",
          text: "Isso ja muda o risco. Menos exposicao ao binge reduz chance de uso de cocaina por encadeamento."
        },
        {
          id: "bl-3",
          speaker: "Bruno",
          timestamp: "12:20",
          text: "Ter combinado agua, comida e nao usar sozinho segurou bastante a fissura."
        }
      ]
    },
    medications: {
      primary: {
        title: "Naltrexona",
        subtitle: "Modulacao de craving",
        dose: "50mg",
        efficacy: 69,
        efficacyLabel: "Reducao de binge",
        highlight: "Alvo terapeutico: modulacao de reforco e reducao de craving alcoolico."
      },
      secondary: {
        title: "Quetiapina",
        subtitle: "Suporte de sono / agitacao",
        dose: "25mg",
        alert: "Evitar associacao com alcool pela soma de sedacao e prejuizo psicomotor."
      }
    },
    labs: {
      medication: "Naltrexona",
      baseline:
        "Baseline concluido com TGO, TGP, GGT, bilirrubinas e hemograma antes do inicio do manejo de craving.",
      startSchedule:
        "Funcao hepatica mensal no inicio do tratamento e rechecagem se houver aumento de consumo ou sintomas gastrointestinais.",
      maintenanceSchedule:
        "TGO, TGP, GGT e bilirrubinas a cada 3-6 meses enquanto houver uso continuado.",
      alertSymptoms:
        "Ictericia, vomitos persistentes, dor em hipocondrio direito ou fadiga importante exigem coleta imediata e revisao do esquema.",
      interactionNote:
        "Uso de opioides fica contraindicado sob naltrexona, com risco de perda de efeito analgesico e tentativa compensatoria perigosa.",
      tests: [
        {
          name: "TGO / TGP / GGT",
          frequency: "baseline / mensal / trimestral",
          purpose: "funcao hepatica",
          lastResult: "TGP 42 U/L | GGT 58 U/L",
          status: "due"
        },
        {
          name: "Bilirrubinas",
          frequency: "baseline / trimestral",
          purpose: "seguranca hepatobiliar",
          lastResult: "0.8 mg/dL",
          status: "ok"
        },
        {
          name: "Hemograma completo",
          frequency: "baseline / trimestral",
          purpose: "vigilancia geral",
          lastResult: "sem alteracoes significativas",
          status: "ok"
        }
      ]
    },
    interactions: [
      {
        title: "Quetiapina + alcool",
        counterpart: "bebidas alcoolicas",
        category: "alerta",
        effect: "aumenta sedacao, risco de blackout e perda de julgamento",
        guidance: "nao usar quetiapina como compensacao apos binge e revisar plano de seguranca",
        severity: "alto"
      },
      {
        title: "Naltrexona + refeicoes regulares",
        counterpart: "ingestao alimentar estruturada",
        category: "sinergia",
        effect: "melhora adesao e reduz nausea no inicio do tratamento",
        guidance: "orientar tomada apos refeicao e hidratacao adequada",
        severity: "protetor"
      },
      {
        title: "Uso de opioides sob naltrexona",
        counterpart: "analgesicos opioides",
        category: "alerta",
        effect: "perda de efeito analgesico e risco de tentativas de compensacao",
        guidance: "documentar alerta e orientar contato medico antes de qualquer analgesia opioide",
        severity: "alto"
      }
    ],
    harmReduction: {
      currentStage: "reducao de frequencia e prevencao de danos graves",
      activeSubstances: ["alcool", "cocaina intranasal", "nicotina"],
      goals: [
        "reduzir binge alcoolico para no maximo 1 episodio por semana",
        "eliminar uso solitario e uso apos privacao de sono",
        "diminuir fissura noturna com rotina de saida segura e suporte telefonico"
      ],
      safetyPlan: [
        "hidratar e alimentar-se antes de eventos de risco",
        "nao carregar grandes quantias em dinheiro em dias de maior craving",
        "acionar contato de seguranca antes de qualquer fissura acima de 7/10",
        "evitar mistura de alcool, benzodiazepinico e outras substancias depressores"
      ],
      redFlags:
        "ideacao suicida, binge de varios dias, uso sozinho, blackout, dor toracica ou sinais de abstinencia grave exigem encaminhamento imediato.",
      supportNetwork: "irma, grupo de apoio local e contato clinico de retaguarda em horarios combinados"
    },
    genetics: {
      gene: "OPRM1",
      phenotype: "Sem marcador decisivo",
      summary:
        "Sem marcador farmacogenetico dominante para resposta a naltrexona, mantendo foco em monitoramento clinico e adesao.",
      compatibility: 61,
      badge: "monitorar resposta",
      gradientStart: "rgba(244,114,182,0.95)",
      gradientEnd: "rgba(248,113,113,0.95)"
    },
    pharmacology: {
      pharmacokinetic: {
        label: "Pharmacokinetic Window",
        value: "dose unica matinal",
        detail: "adesao melhora quando a tomada e vinculada ao cafe da manha e a revisao de craving do inicio do dia"
      },
      pharmacodynamic: {
        label: "Pharmacodynamic Signal",
        value: "craving down",
        detail: "reduziu intensidade de reforco do alcool, mas gatilhos sociais e privacao de sono ainda precipitam recaidas"
      }
    },
    differentialAlert: {
      session: 10,
      note:
        "Padrao de fissura associado a trauma em Sessao 10 sugere 19% de probabilidade de TEPT subjacente com uso como regulacao afetiva."
    }
  },
  {
    id: "rafael-n",
    name: "Rafael N.",
    initials: "RN",
    focus: "Adult ADHD / emotional dysregulation",
    diagnosis: "Attention regulation deficits with sleep procrastination",
    currentProtocol: "Executive function coaching + noradrenergic modulation",
    defaultSession: 12,
    recorder: {
      title: "Session 12 // Attention spillover review",
      duration: "22m 06s",
      summary:
        "The transcript suggests better daytime initiation after atomoxetine, but residual task-switching failure at night.",
      transcriptSegments: [
        {
          id: "rn-1",
          speaker: "Rafael",
          timestamp: "01:49",
          text: "The medication helps me start, but after dinner my brain keeps jumping windows and I cannot close the day."
        },
        {
          id: "rn-2",
          speaker: "Therapist",
          timestamp: "05:10",
          text: "We may be seeing adequate pharmacokinetic coverage for work hours and insufficient carryover into the evening routine."
        }
      ]
    },
    medications: {
      primary: {
        title: "Atomoxetina",
        subtitle: "Noradrenergic modulation",
        dose: "40mg",
        efficacy: 63,
        efficacyLabel: "Controle atencional",
        highlight: "Alvo terapeutico: norepinephrine transporter modulation"
      },
      secondary: {
        title: "Melatonina XR",
        subtitle: "Chronobiotic support",
        dose: "2mg",
        alert: "Monitorar latencia de sono em dias com exposicao luminosa tardia."
      }
    },
    genetics: {
      gene: "CYP2D6",
      phenotype: "Metabolizador Rapido",
      summary:
        "Maior depuracao pode reduzir duracao efetiva da atomoxetina no periodo noturno.",
      compatibility: 64,
      badge: "fast clearance",
      gradientStart: "rgba(56,189,248,0.95)",
      gradientEnd: "rgba(244,114,182,0.95)"
    },
    pharmacology: {
      pharmacokinetic: {
        label: "Pharmacokinetic Window",
        value: "fast clearance",
        detail: "coverage appears to fade before the evening executive shutdown period"
      },
      pharmacodynamic: {
        label: "Pharmacodynamic Signal",
        value: "NET focus up",
        detail: "task initiation improved, but emotional spillover and nighttime cognitive drift remain active"
      }
    },
    differentialAlert: {
      session: 12,
      note:
        "Padrao de distracao na Sessao 12 sugere 22% de probabilidade de TDAH nao diagnosticado. Recomenda-se aplicacao da escala ASRS-1."
    }
  }
];

export function getPatientById(patientId: string) {
  return PATIENTS.find((patient) => patient.id === patientId) ?? PATIENTS[0];
}
