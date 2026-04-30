import type {
  AdlerAbandonmentRiskResponse,
  AdlerClinicalSessionInput,
  AdlerEvolutionDecisionResponse,
  AdlerWhatsAppCheckinInput
} from "../api/client";

export type PreviewAnalysisRecord = {
  payload: AdlerClinicalSessionInput;
  saved_at: string;
  source: "api" | "browser";
};

export type PreviewCheckinRecord = AdlerWhatsAppCheckinInput & {
  saved_at: string;
  source: "api" | "browser";
};

export type PreviewTimelinePoint = {
  adherence: number;
  anxiety: number;
  mood: number;
  session: number;
  x: number;
};

export type PreviewMapGraph = {
  edges: Array<[string, string, number]>;
  nodes: Array<{ critical: boolean; id: string; label: string }>;
  summary: string;
};

const ANALYSIS_KEY_PREFIX = "adler.preview.analysis.";
const CHECKIN_KEY_PREFIX = "adler.preview.checkin.";
const ALERT_TERMS = [
  "abandono",
  "ausencia",
  "crise",
  "falta",
  "insonia",
  "medo",
  "piora",
  "recai",
  "ritual",
  "taquic",
  "vergonha"
] as const;
const STABILIZING_TERMS = [
  "adesao",
  "alivio",
  "compareceu",
  "exposicao",
  "organizacao",
  "respiracao",
  "rotina",
  "sono"
] as const;

function canUseStorage() {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function readJson<T>(key: string) {
  if (!canUseStorage()) {
    return null;
  }

  const raw = localStorage.getItem(key);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    localStorage.removeItem(key);
    return null;
  }
}

function listMatchingKeys(prefix: string) {
  if (!canUseStorage()) {
    return [] as string[];
  }

  const keys: string[] = [];
  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);
    if (key?.startsWith(prefix)) {
      keys.push(key);
    }
  }
  return keys;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function countMatches(items: string[], terms: readonly string[]) {
  return items.reduce((total, item) => {
    const normalizedItem = normalize(item);
    return total + (terms.some((term) => normalizedItem.includes(term)) ? 1 : 0);
  }, 0);
}

function uniqueOrdered(items: string[], limit = 6) {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const item of items) {
    const clean = item.trim();
    if (!clean) {
      continue;
    }

    const key = normalize(clean);
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    result.push(clean);

    if (result.length >= limit) {
      break;
    }
  }

  return result;
}

function getAnalysisSignals(record: PreviewAnalysisRecord) {
  const items = [
    ...record.payload.sintomas,
    ...record.payload.emocoes,
    ...record.payload.comportamentos,
    ...record.payload.eventos,
    ...record.payload.medicacao
  ];

  return {
    alertCount: countMatches(items, ALERT_TERMS),
    stabilizingCount: countMatches(items, STABILIZING_TERMS),
    items
  };
}

export function savePreviewAnalysis(record: PreviewAnalysisRecord) {
  if (!canUseStorage()) {
    return;
  }

  const key = `${ANALYSIS_KEY_PREFIX}${record.payload.patient_id}.${record.payload.session_number}`;
  localStorage.setItem(key, JSON.stringify(record));
}

export function loadPreviewAnalyses(patientId: string) {
  return listMatchingKeys(`${ANALYSIS_KEY_PREFIX}${patientId}.`)
    .map((key) => readJson<PreviewAnalysisRecord>(key))
    .filter((record): record is PreviewAnalysisRecord => Boolean(record))
    .sort((left, right) => {
      const sessionDelta = left.payload.session_number - right.payload.session_number;
      if (sessionDelta !== 0) {
        return sessionDelta;
      }

      return left.saved_at.localeCompare(right.saved_at);
    });
}

export function savePreviewCheckin(record: PreviewCheckinRecord) {
  if (!canUseStorage()) {
    return;
  }

  const key = `${CHECKIN_KEY_PREFIX}${record.patient_id}.${record.saved_at}`;
  localStorage.setItem(key, JSON.stringify(record));
}

export function loadPreviewCheckins(patientId: string) {
  return listMatchingKeys(`${CHECKIN_KEY_PREFIX}${patientId}.`)
    .map((key) => readJson<PreviewCheckinRecord>(key))
    .filter((record): record is PreviewCheckinRecord => Boolean(record))
    .sort((left, right) => right.saved_at.localeCompare(left.saved_at));
}

export function buildPreviewEvolution(analyses: PreviewAnalysisRecord[]) {
  if (!analyses.length) {
    return null;
  }

  const latest = analyses[analyses.length - 1];
  const first = analyses[0];
  const latestSignals = getAnalysisSignals(latest);
  const firstSignals = getAnalysisSignals(first);
  const repeated = new Map<string, number>();

  for (const record of analyses) {
    for (const item of uniqueOrdered(getAnalysisSignals(record).items, 10)) {
      const key = normalize(item);
      repeated.set(key, (repeated.get(key) ?? 0) + 1);
    }
  }

  const persistentPatterns = [...repeated.entries()]
    .filter(([, count]) => count >= 2)
    .sort((left, right) => right[1] - left[1])
    .map(([item]) => item)
    .slice(0, 4);

  const latestHighlights = uniqueOrdered(
    [
      ...latest.payload.sintomas,
      ...latest.payload.emocoes,
      ...latest.payload.comportamentos
    ],
    4
  );

  const status_geral =
    latestSignals.alertCount >= 4
      ? "atencao"
      : latestSignals.alertCount < firstSignals.alertCount
        ? "melhorando"
        : analyses.length >= 3
          ? "estavel"
          : "atencao";

  return {
    patient_id: latest.payload.patient_id,
    status_geral,
    principais_mudancas: uniqueOrdered(
      [
        `Sessao ${latest.payload.session_number} com ${latest.payload.sintomas.length} sintomas e ${latest.payload.emocoes.length} estados emocionais estruturados.`,
        latest.payload.medicacao.length
          ? `Medicacao citada: ${latest.payload.medicacao.join(", ")}.`
          : "Sem nova medicacao registrada nesta captura.",
        ...latestHighlights.map((item) => `Sinal mais recente: ${item}.`)
      ],
      4
    ),
    padroes_persistentes:
      persistentPatterns.length > 0
        ? persistentPatterns
        : uniqueOrdered(latest.payload.comportamentos, 4),
    novos_riscos: uniqueOrdered(
      latestSignals.items.filter((item) =>
        ALERT_TERMS.some((term) => normalize(item).includes(term))
      ),
      3
    ),
    tendencias: uniqueOrdered(
      [
        `${analyses.length} sessoes estruturadas salvas nesta demo.`,
        latestSignals.alertCount < firstSignals.alertCount
          ? "Os sinais de alerta estao menores do que na primeira sessao salva."
          : "Os sinais de alerta ainda merecem acompanhamento ativo.",
        latestSignals.stabilizingCount > 0
          ? "Ha fatores de estabilizacao suficientes para sustentar follow-up."
          : "Ainda ha pouca ancoragem de estabilizacao nos registros recentes."
      ],
      4
    ),
    sessions_compared: analyses.map((record) => record.payload.session_number),
    snapshot_id: null
  } satisfies AdlerEvolutionDecisionResponse;
}

export function buildPreviewRisk(
  analyses: PreviewAnalysisRecord[],
  fallbackScore: number
) {
  if (!analyses.length) {
    return null;
  }

  const latest = analyses[analyses.length - 1];
  const latestSignals = getAnalysisSignals(latest);
  const score = clamp(
    fallbackScore + latestSignals.alertCount * 5 - latestSignals.stabilizingCount * 4,
    18,
    88
  );

  const risco_abandono =
    score >= 70 ? "alto" : score >= 45 ? "moderado" : "baixo";

  return {
    patient_id: latest.payload.patient_id,
    risco_abandono,
    score,
    fatores_identificados: uniqueOrdered(
      [
        ...latest.payload.eventos,
        ...latest.payload.comportamentos,
        ...latest.payload.emocoes
      ],
      4
    ),
    sugestoes_acao:
      risco_abandono === "alto"
        ? ["Antecipar contato", "Reforcar vinculo", "Revisar plano da proxima sessao"]
        : risco_abandono === "moderado"
          ? ["Agendar check-in leve", "Confirmar proxima sessao", "Reforcar rotina de adesao"]
          : ["Manter acompanhamento", "Registrar micro-vitorias", "Seguir com monitoramento leve"],
    risk_score_id: null
  } satisfies AdlerAbandonmentRiskResponse;
}

export function buildPreviewTimelinePoints(analyses: PreviewAnalysisRecord[]) {
  if (!analyses.length) {
    return [] as PreviewTimelinePoint[];
  }

  const firstSession = analyses[0].payload.session_number;
  const lastSession = analyses[analyses.length - 1].payload.session_number;
  const span = Math.max(lastSession - firstSession, 1);

  return analyses.map((record, index) => {
    const signals = getAnalysisSignals(record);
    const symptomCount = record.payload.sintomas.length;
    const emotionCount = record.payload.emocoes.length;
    const medicationCount = record.payload.medicacao.length;

    return {
      anxiety: clamp(42 + symptomCount * 8 + signals.alertCount * 5 - index * 4, 28, 92),
      mood: clamp(38 + index * 6 + signals.stabilizingCount * 6 - signals.alertCount * 3, 24, 90),
      adherence: clamp(44 + medicationCount * 10 + signals.stabilizingCount * 6 - emotionCount * 2, 26, 98),
      session: record.payload.session_number,
      x:
        analyses.length === 1
          ? 50
          : 8 + ((record.payload.session_number - firstSession) / span) * 84
    };
  });
}

export function buildPreviewMapGraph(
  analyses: PreviewAnalysisRecord[],
  fallbackFocus: string
) {
  if (!analyses.length) {
    return null;
  }

  const combined = analyses.flatMap((record) => [
    ...record.payload.sintomas,
    ...record.payload.emocoes,
    ...record.payload.comportamentos,
    ...record.payload.eventos
  ]);

  const ranked = new Map<string, { label: string; weight: number }>();
  for (const item of combined) {
    const clean = item.trim();
    if (!clean) {
      continue;
    }

    const key = normalize(clean);
    const current = ranked.get(key);
    ranked.set(key, {
      label: clean,
      weight: current ? current.weight + 1 : 1
    });
  }

  const selected = [...ranked.entries()]
    .sort((left, right) => right[1].weight - left[1].weight)
    .slice(0, 5)
    .map(([id, value], index) => ({
      critical:
        index === 4 ||
        ALERT_TERMS.some((term) => id.includes(term)),
      id,
      label: value.label
    }));

  if (!selected.length) {
    selected.push(
      { id: normalize(fallbackFocus), label: fallbackFocus, critical: false },
      { id: "alerta", label: "alerta clinico", critical: true }
    );
  }

  const edges = selected.slice(1).map((node, index) => {
    const previous = selected[index];
    const weight = Math.max(2, 5 - index);
    return [previous.id, node.id, weight] as [string, string, number];
  });

  return {
    nodes: selected,
    edges,
    summary: `${analyses.length} sessoes salvas alimentam este mapa cognitivo local.`
  } satisfies PreviewMapGraph;
}
