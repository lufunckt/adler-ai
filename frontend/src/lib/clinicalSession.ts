import type { AdlerClinicalSessionInput } from "../api/client";

export type SessionTranscriptLine = {
  id: string;
  speaker: string;
  text: string;
  timestamp: string;
};

export type StructuredSessionDraft = {
  sessionNumber: number;
  occurredAt: string;
  tempo: string;
  abordagemClinica: AdlerClinicalSessionInput["abordagem_clinica"];
  sintomasText: string;
  emocoesText: string;
  eventosText: string;
  comportamentosText: string;
  medicacaoText: string;
  observacoes: string;
};

type SeedTranscriptInput = {
  focus: string;
  hypothesis: string;
  id: string;
  name: string;
};

type StructuredDraftInput = {
  manualNote: string;
  transcriptLines: SessionTranscriptLine[];
};

const EMOTION_TERMS: Array<[needle: string, label: string]> = [
  ["ansiedade", "ansiedade"],
  ["medo", "medo"],
  ["culpa", "culpa"],
  ["alivio", "alivio"],
  ["alivio", "alivio"],
  ["angustia", "angustia"],
  ["tristeza", "tristeza"],
  ["vergonha", "vergonha"],
  ["raiva", "raiva"],
  ["frustracao", "frustracao"],
  ["irritacao", "irritacao"],
  ["desanimo", "desanimo"],
  ["apreensao", "apreensao"]
];

const SYMPTOM_TERMS: Array<[needle: string, label: string]> = [
  ["insonia", "insonia"],
  ["fadiga", "fadiga"],
  ["compuls", "compulsoes"],
  ["obsess", "pensamentos obsessivos"],
  ["checag", "checagem recorrente"],
  ["ritual", "rituais"],
  ["rumina", "ruminacao"],
  ["panico", "sintomas de panico"],
  ["hipervigil", "hipervigilancia"],
  ["evit", "evitacao"],
  ["falta de ar", "falta de ar"],
  ["taquic", "taquicardia"],
  ["sono", "alteracao de sono"],
  ["triste", "humor deprimido"]
];

const BEHAVIOR_TERMS: Array<[needle: string, label: string]> = [
  ["evit", "evitacao"],
  ["isol", "isolamento"],
  ["checag", "checagem"],
  ["ritual", "rituais de seguranca"],
  ["procrast", "procrastinacao"],
  ["desmarc", "desmarcou compromissos"],
  ["falt", "faltas ou ausencias"],
  ["expo", "tentativa de exposicao"],
  ["negoci", "negociacao com o sintoma"],
  ["chor", "choro"],
  ["discut", "discussao ou conflito"],
  ["respira", "respiracao guiada"]
];

const MEDICATION_TERMS: Array<[needle: string, label: string]> = [
  ["sertralina", "sertralina"],
  ["escitalopram", "escitalopram"],
  ["fluoxetina", "fluoxetina"],
  ["venlafaxina", "venlafaxina"],
  ["desvenlafaxina", "desvenlafaxina"],
  ["bupropiona", "bupropiona"],
  ["quetiapina", "quetiapina"],
  ["risperidona", "risperidona"],
  ["aripiprazol", "aripiprazol"],
  ["lamotrigina", "lamotrigina"],
  ["valpro", "valproato"],
  ["litio", "litio"],
  ["lorazepam", "lorazepam"],
  ["clonazepam", "clonazepam"],
  ["zolpidem", "zolpidem"]
];

const EVENT_HINTS = [
  "quando",
  "depois",
  "antes",
  "apos",
  "durante",
  "ontem",
  "hoje",
  "noite",
  "manha",
  "trabalho",
  "casa",
  "famil",
  "consulta",
  "sessao",
  "gatilho",
  "discuss",
  "briga"
];

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function cleanItem(value: string) {
  return value.replace(/\s+/g, " ").replace(/^[-*]\s*/, "").trim();
}

function uniqueItems(items: string[], limit = 6) {
  const seen = new Set<string>();
  const results: string[] = [];

  for (const item of items) {
    const clean = cleanItem(item);
    if (!clean) continue;

    const normalized = normalize(clean);
    if (seen.has(normalized)) continue;
    seen.add(normalized);
    results.push(clean);

    if (results.length >= limit) break;
  }

  return results;
}

function toFieldText(items: string[]) {
  return uniqueItems(items).join("\n");
}

function toTranscriptText(lines: SessionTranscriptLine[]) {
  return lines.map((line) => `${line.speaker}: ${line.text}`).join("\n");
}

function splitSentences(text: string) {
  return text
    .split(/\r?\n|[.!?;]+/g)
    .map(cleanItem)
    .filter(Boolean);
}

function extractTerms(text: string, dictionary: Array<[string, string]>, limit = 6) {
  const normalizedText = normalize(text);
  const results = dictionary
    .filter(([needle]) => normalizedText.includes(normalize(needle)))
    .map(([, label]) => label);

  const dosageMatches =
    dictionary === MEDICATION_TERMS
      ? Array.from(text.matchAll(/\b([A-Za-zÀ-ÿ]+)\s*(\d+\s?(?:mg|mcg|ml))\b/gi)).map(
          (match) => `${match[1]} ${match[2]}`
        )
      : [];

  return uniqueItems([...results, ...dosageMatches], limit);
}

function extractEventSentences(sentences: string[], limit = 4) {
  const results = sentences.filter((sentence) =>
    EVENT_HINTS.some((hint) => normalize(sentence).includes(normalize(hint)))
  );

  return uniqueItems(results, limit);
}

function buildObservations({ manualNote, transcriptLines }: StructuredDraftInput) {
  const blocks = [cleanItem(manualNote)];
  const transcriptText = toTranscriptText(transcriptLines);

  if (transcriptText) {
    blocks.push(`Transcricao-base:\n${transcriptText}`);
  }

  return blocks.filter(Boolean).join("\n\n").slice(0, 2400);
}

function nowAsDatetimeLocal(date = new Date()) {
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60_000);
  return localDate.toISOString().slice(0, 16);
}

export function parseStructuredList(value: string) {
  return uniqueItems(value.split(/\r?\n|[,;]+/g), 8);
}

export function deriveStructuredDraftFromContent({
  manualNote,
  transcriptLines
}: StructuredDraftInput) {
  const transcriptText = toTranscriptText(transcriptLines);
  const combinedText = [manualNote, transcriptText].filter(Boolean).join("\n");
  const sentences = splitSentences(combinedText);

  const sintomas = extractTerms(combinedText, SYMPTOM_TERMS);
  const emocoes = extractTerms(combinedText, EMOTION_TERMS);
  const comportamentos = extractTerms(combinedText, BEHAVIOR_TERMS);
  const medicacao = extractTerms(combinedText, MEDICATION_TERMS);
  const eventos = extractEventSentences(sentences);

  return {
    sintomasText: toFieldText(sintomas.length ? sintomas : sentences.slice(0, 3)),
    emocoesText: toFieldText(emocoes),
    eventosText: toFieldText(eventos.length ? eventos : sentences.slice(0, 3)),
    comportamentosText: toFieldText(
      comportamentos.length ? comportamentos : sentences.slice(1, 4)
    ),
    medicacaoText: toFieldText(medicacao),
    observacoes: buildObservations({ manualNote, transcriptLines })
  };
}

export function createInitialStructuredSessionDraft(input: {
  approach?: StructuredSessionDraft["abordagemClinica"];
  manualNote?: string;
  occurredAt?: Date;
  sessionNumber: number;
  transcriptLines?: SessionTranscriptLine[];
}) {
  const transcriptLines = input.transcriptLines ?? [];
  const derived = deriveStructuredDraftFromContent({
    manualNote: input.manualNote ?? "",
    transcriptLines
  });

  return {
    sessionNumber: input.sessionNumber,
    occurredAt: nowAsDatetimeLocal(input.occurredAt),
    tempo: "sessao atual",
    abordagemClinica: input.approach ?? "cbt",
    ...derived
  } satisfies StructuredSessionDraft;
}

export function buildClinicalSessionPayload(
  patientId: string,
  draft: StructuredSessionDraft
): AdlerClinicalSessionInput {
  const occurredAt = draft.occurredAt ? new Date(draft.occurredAt) : null;
  const occurredAtIso =
    occurredAt && !Number.isNaN(occurredAt.getTime())
      ? occurredAt.toISOString()
      : undefined;

  return {
    patient_id: patientId,
    session_number: Math.max(1, Number(draft.sessionNumber) || 1),
    occurred_at: occurredAtIso,
    sintomas: parseStructuredList(draft.sintomasText),
    emocoes: parseStructuredList(draft.emocoesText),
    eventos: parseStructuredList(draft.eventosText),
    comportamentos: parseStructuredList(draft.comportamentosText),
    medicacao: parseStructuredList(draft.medicacaoText),
    tempo: cleanItem(draft.tempo) || undefined,
    abordagem_clinica: draft.abordagemClinica,
    observacoes: cleanItem(draft.observacoes) || undefined
  };
}

export function buildSeedTranscript({
  focus,
  hypothesis,
  id,
  name
}: SeedTranscriptInput): SessionTranscriptLine[] {
  return [
    {
      id: `${id}-seed-1`,
      speaker: "Paciente",
      timestamp: "09:02",
      text: `Desde a ultima consulta, ${name} percebeu oscilacao ligada a ${focus.toLowerCase()}.`
    },
    {
      id: `${id}-seed-2`,
      speaker: "Clinico",
      timestamp: "09:07",
      text: `Qual foi o gatilho principal e como isso conversa com a hipotese de ${hypothesis.toLowerCase()}?`
    },
    {
      id: `${id}-seed-3`,
      speaker: "Paciente",
      timestamp: "09:15",
      text: "O aumento vem a noite, depois do cansaco, e eu acabo repetindo comportamentos de alivio imediato."
    }
  ];
}

export function capitalizeMedication(name: string) {
  return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
}

export function buildMedicationFallback(name: string) {
  return {
    title: capitalizeMedication(name),
    subtitle: "Medicamento em uso",
    dose: "Dose nao informada",
    efficacy: 50,
    efficacy_label: "Eficacia sob observacao",
    highlight: "Alvo terapeutico: estabilizacao clinica"
  };
}
