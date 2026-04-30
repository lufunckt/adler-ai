import type { ClinicalApproach } from "../context/AdlerShellContext";

export const MAP_WIDTH = 1000;
export const MAP_HEIGHT = 680;

type NodeType = "symptom" | "medication" | "risk";
type NodeSeverity = "standard" | "critical";
type MapPoint = { x: number; y: number };
type MetricProfile = {
  end: number;
  phase?: number;
  start: number;
  wave?: number;
};

type ApproachCopy = Partial<Record<ClinicalApproach, string>>;
type ApproachPosition = Partial<Record<ClinicalApproach, MapPoint>>;
type ApproachProfile = Partial<Record<ClinicalApproach, MetricProfile>>;

export type MapNode = {
  id: string;
  label: string;
  labels?: ApproachCopy;
  positions?: ApproachPosition;
  radius: number;
  severity?: NodeSeverity;
  signalProfile: MetricProfile;
  signalProfiles?: ApproachProfile;
  target: string;
  targets?: ApproachCopy;
  type: NodeType;
  x: number;
  y: number;
};

export type ResolvedMapNode = {
  id: string;
  label: string;
  longitudinalSignal: number;
  note: string;
  peakSession: number;
  radius: number;
  sessionSignal: number;
  severity: NodeSeverity;
  signal: number;
  trendDelta: number;
  type: NodeType;
  x: number;
  y: number;
};

export type MapEdge = {
  curvature: number;
  id: string;
  source: string;
  strength: number;
  target: string;
};

export const NODES: MapNode[] = [
  {
    id: "tumor-threat",
    label: "Catastrophic Tumor Appraisal",
    labels: {
      cbt: "Catastrophic Tumor Appraisal",
      psychoanalysis: "Somatic Persecutory Fantasy",
      psychiatry: "Somatic Threat Ideation",
      systemic: "Ameaca Corporal no Sistema",
      schema: "Esquema de Ameaca Corporal"
    },
    radius: 18,
    signalProfile: { start: 92, end: 48, wave: 2.1, phase: 0.8 },
    severity: "standard",
    target: "Anxiety Spike",
    targets: {
      psychoanalysis: "Signal Anxiety",
      psychiatry: "Autonomic Activation",
      systemic: "Resposta Circular de Alerta",
      schema: "Modo Vulneravel"
    },
    type: "symptom",
    x: 170,
    y: 170,
    positions: {
      psychoanalysis: { x: 220, y: 200 },
      psychiatry: { x: 160, y: 220 },
      systemic: { x: 210, y: 160 },
      schema: { x: 145, y: 200 }
    }
  },
  {
    id: "anxiety-spike",
    label: "Anxiety Spike",
    labels: {
      cbt: "Anxiety Spike",
      psychoanalysis: "Signal Anxiety",
      psychiatry: "Autonomic Activation",
      systemic: "Resposta Circular de Alerta",
      schema: "Modo Vulneravel"
    },
    radius: 18,
    signalProfile: { start: 88, end: 52, wave: 2.6, phase: 1.4 },
    severity: "standard",
    target: "Insomnia Loop",
    targets: {
      psychoanalysis: "Night Vigilance",
      psychiatry: "Sleep Fragmentation",
      systemic: "Rotina Familiar em Alerta",
      schema: "Hipervigilancia do Esquema"
    },
    type: "symptom",
    x: 375,
    y: 125,
    positions: {
      psychoanalysis: { x: 380, y: 110 },
      psychiatry: { x: 360, y: 150 },
      systemic: { x: 340, y: 120 },
      schema: { x: 410, y: 138 }
    }
  },
  {
    id: "insomnia-loop",
    label: "Insomnia Loop",
    labels: {
      cbt: "Insomnia Loop",
      psychoanalysis: "Night Vigilance",
      psychiatry: "Sleep Fragmentation",
      systemic: "Rotina Familiar em Alerta",
      schema: "Hipervigilancia do Esquema"
    },
    radius: 19,
    signalProfile: { start: 85, end: 44, wave: 2.4, phase: 0.2 },
    severity: "standard",
    target: "Neutralizacao Compulsiva",
    targets: {
      psychoanalysis: "Anulacao Magica",
      psychiatry: "Compulsive Escalation",
      systemic: "Ritual Acomodado pela Rede",
      schema: "Modo Controlador"
    },
    type: "symptom",
    x: 630,
    y: 160,
    positions: {
      psychoanalysis: { x: 640, y: 190 },
      psychiatry: { x: 600, y: 210 },
      systemic: { x: 610, y: 145 },
      schema: { x: 650, y: 175 }
    }
  },
  {
    id: "ritual-node",
    label: "Neutralizacao Compulsiva",
    labels: {
      cbt: "Neutralizacao Compulsiva",
      psychoanalysis: "Anulacao Magica",
      psychiatry: "Compulsive Escalation",
      systemic: "Ritual Acomodado pela Rede",
      schema: "Modo Controlador"
    },
    radius: 20,
    signalProfile: { start: 90, end: 46, wave: 2.3, phase: 1.8 },
    signalProfiles: {
      psychoanalysis: { start: 68, end: 89, wave: 1.8, phase: 0.7 },
      psychiatry: { start: 82, end: 58, wave: 2.1, phase: 1.2 },
      systemic: { start: 86, end: 57, wave: 1.9, phase: 0.9 },
      schema: { start: 89, end: 61, wave: 2.1, phase: 1.1 }
    },
    severity: "standard",
    target: "Insomnia Loop",
    targets: {
      psychoanalysis: "Night Vigilance",
      psychiatry: "Sleep Fragmentation",
      systemic: "Rotina Familiar em Alerta",
      schema: "Hipervigilancia do Esquema"
    },
    type: "risk",
    x: 470,
    y: 370,
    positions: {
      psychoanalysis: { x: 520, y: 300 },
      psychiatry: { x: 470, y: 410 },
      systemic: { x: 520, y: 355 },
      schema: { x: 500, y: 320 }
    }
  },
  {
    id: "ssri-response",
    label: "SSRI Support",
    labels: {
      cbt: "SSRI Support",
      psychoanalysis: "Medication Containment",
      psychiatry: "Sertraline Response",
      systemic: "Suporte Contextual",
      schema: "Base Reguladora"
    },
    radius: 16,
    signalProfile: { start: 58, end: 84, wave: 1.2, phase: 0.4 },
    signalProfiles: {
      psychiatry: { start: 62, end: 90, wave: 1.3, phase: 0.2 },
      systemic: { start: 56, end: 80, wave: 1.1, phase: 0.5 },
      schema: { start: 58, end: 83, wave: 1.2, phase: 0.8 }
    },
    severity: "standard",
    target: "Anxiety Spike",
    targets: {
      psychoanalysis: "Signal Anxiety",
      psychiatry: "Autonomic Activation",
      systemic: "Resposta Circular de Alerta",
      schema: "Modo Vulneravel"
    },
    type: "medication",
    x: 245,
    y: 515,
    positions: {
      psychoanalysis: { x: 250, y: 530 },
      psychiatry: { x: 330, y: 520 },
      systemic: { x: 230, y: 500 },
      schema: { x: 285, y: 540 }
    }
  },
  {
    id: "hypnotic-bridge",
    label: "Sleep Bridge",
    labels: {
      cbt: "Sleep Bridge",
      psychoanalysis: "Sedative Holding",
      psychiatry: "Hypnotic Bridge",
      systemic: "Rotina de Sono Compartilhada",
      schema: "Ponte Reguladora"
    },
    radius: 16,
    signalProfile: { start: 55, end: 77, wave: 1.7, phase: 1.5 },
    signalProfiles: {
      psychiatry: { start: 60, end: 86, wave: 1.2, phase: 0.9 },
      systemic: { start: 53, end: 77, wave: 1.3, phase: 1.1 },
      schema: { start: 56, end: 80, wave: 1.4, phase: 1.3 }
    },
    severity: "standard",
    target: "Sleep Fragmentation",
    targets: {
      cbt: "Insomnia Loop",
      psychoanalysis: "Night Vigilance",
      systemic: "Rotina Familiar em Alerta",
      schema: "Hipervigilancia do Esquema"
    },
    type: "medication",
    x: 690,
    y: 510,
    positions: {
      psychoanalysis: { x: 720, y: 525 },
      psychiatry: { x: 620, y: 520 },
      systemic: { x: 675, y: 500 },
      schema: { x: 645, y: 545 }
    }
  },
  {
    id: "death-thoughts",
    label: "Thought of Death",
    labels: {
      cbt: "Thought of Death",
      psychoanalysis: "Death Fantasy",
      psychiatry: "Suicidal Cognition",
      systemic: "Ruptura de Suporte da Rede",
      schema: "Modo de Desesperanca"
    },
    radius: 22,
    signalProfile: { start: 76, end: 38, wave: 2.2, phase: 1.1 },
    severity: "critical",
    signalProfiles: {
      psychoanalysis: { start: 72, end: 44, wave: 1.8, phase: 0.2 },
      psychiatry: { start: 81, end: 46, wave: 2.4, phase: 0.9 },
      systemic: { start: 78, end: 42, wave: 2, phase: 0.6 },
      schema: { start: 80, end: 45, wave: 2.2, phase: 1.1 }
    },
    target: "Sleep Fragmentation",
    targets: {
      cbt: "Insomnia Loop",
      psychoanalysis: "Night Vigilance",
      systemic: "Rotina Familiar em Alerta",
      schema: "Hipervigilancia do Esquema"
    },
    type: "risk",
    x: 855,
    y: 270,
    positions: {
      psychoanalysis: { x: 830, y: 155 },
      psychiatry: { x: 840, y: 250 },
      systemic: { x: 835, y: 225 },
      schema: { x: 865, y: 205 }
    }
  },
  {
    id: "relapse-window",
    label: "Relapse Window",
    labels: {
      cbt: "Relapse Window",
      psychoanalysis: "Return of Conflict",
      psychiatry: "Decompensation Risk",
      systemic: "Ruptura do Padrao de Cuidado",
      schema: "Reativacao do Esquema"
    },
    radius: 20,
    signalProfile: { start: 82, end: 42, wave: 2.2, phase: 0.5 },
    signalProfiles: {
      psychoanalysis: { start: 74, end: 48, wave: 1.9, phase: 1.4 },
      psychiatry: { start: 85, end: 51, wave: 2.1, phase: 0.4 },
      systemic: { start: 79, end: 46, wave: 1.8, phase: 1.2 },
      schema: { start: 84, end: 49, wave: 2, phase: 0.5 }
    },
    severity: "critical",
    target: "Compulsive Escalation",
    targets: {
      cbt: "Neutralizacao Compulsiva",
      psychoanalysis: "Anulacao Magica",
      systemic: "Ritual Acomodado pela Rede",
      schema: "Modo Controlador"
    },
    type: "risk",
    x: 800,
    y: 390,
    positions: {
      psychoanalysis: { x: 820, y: 360 },
      psychiatry: { x: 790, y: 430 },
      systemic: { x: 760, y: 385 },
      schema: { x: 815, y: 410 }
    }
  }
];

export const EDGES: MapEdge[] = [
  { id: "tumor-anxiety", source: "tumor-threat", target: "anxiety-spike", strength: 0.96, curvature: 0.12 },
  { id: "anxiety-insomnia", source: "anxiety-spike", target: "insomnia-loop", strength: 0.88, curvature: -0.07 },
  { id: "anxiety-ritual", source: "anxiety-spike", target: "ritual-node", strength: 0.79, curvature: 0.18 },
  { id: "tumor-ritual", source: "tumor-threat", target: "ritual-node", strength: 0.66, curvature: -0.11 },
  { id: "ritual-insomnia", source: "ritual-node", target: "insomnia-loop", strength: 0.82, curvature: -0.18 },
  { id: "ssri-anxiety", source: "ssri-response", target: "anxiety-spike", strength: 0.62, curvature: -0.16 },
  { id: "hypnotic-insomnia", source: "hypnotic-bridge", target: "insomnia-loop", strength: 0.68, curvature: 0.12 },
  { id: "insomnia-death", source: "insomnia-loop", target: "death-thoughts", strength: 0.74, curvature: 0.16 },
  { id: "insomnia-relapse", source: "insomnia-loop", target: "relapse-window", strength: 0.83, curvature: 0.08 },
  { id: "ritual-relapse", source: "ritual-node", target: "relapse-window", strength: 0.72, curvature: -0.05 },
  { id: "relapse-death", source: "relapse-window", target: "death-thoughts", strength: 0.7, curvature: 0.14 }
];

const FALLBACK_NODE_LABELS: Partial<Record<ClinicalApproach, Record<string, string>>> = {
  couples: {
    "tumor-threat": "Medo Compartilhado de Dano",
    "anxiety-spike": "Escalada de Reassurance",
    "insomnia-loop": "Sono do Casal em Alerta",
    "ritual-node": "Acomodacao Relacional",
    "ssri-response": "Co-manejo Medicamentoso",
    "hypnotic-bridge": "Ponte de Sono no Vinculo",
    "death-thoughts": "Risco Narrado a Rede",
    "relapse-window": "Janela de Recaida Relacional"
  },
  generalist: {
    "tumor-threat": "Preocupacao Somatica",
    "anxiety-spike": "Ansiedade Clinica",
    "insomnia-loop": "Insonia",
    "ritual-node": "Ritual Compulsivo",
    "ssri-response": "Resposta ao ISRS",
    "hypnotic-bridge": "Suporte de Sono",
    "death-thoughts": "Ideacao de Morte",
    "relapse-window": "Risco de Recaida"
  }
};

export function resolveMapNode(
  node: MapNode,
  approach: ClinicalApproach,
  session: number
): ResolvedMapNode {
  const nextPoint = node.positions?.[approach];
  const label = node.labels?.[approach] ?? FALLBACK_NODE_LABELS[approach]?.[node.id] ?? node.label;
  const target = node.targets?.[approach] ?? node.target;
  const signalProfile = node.signalProfiles?.[approach] ?? node.signalProfile;
  const series = buildSignalSeries(signalProfile);
  const sessionSignal = series[session - 1] ?? series[series.length - 1];
  const longitudinalSignal = Math.round(
    series.reduce((sum, value) => sum + value, 0) / series.length
  );
  const peakValue = Math.max(...series);
  const peakSession = Math.max(series.findIndex((value) => value === peakValue), 0) + 1;
  const trendDelta = sessionSignal - series[0];
  const correlation = (sessionSignal / 100).toFixed(2);
  const dominantSignal = Math.round(longitudinalSignal * 0.7 + sessionSignal * 0.3);

  return {
    id: node.id,
    label,
    longitudinalSignal,
    note: `Padrao longitudinal em 18 sessoes. Pico na Sessao ${peakSession}. Correlacao atual de ${correlation} com ${target} na Sessao ${session}.`,
    peakSession,
    radius: node.radius + dominantSignal * 0.04,
    sessionSignal,
    severity: node.severity ?? "standard",
    signal: dominantSignal,
    trendDelta,
    type: node.type,
    x: nextPoint?.x ?? node.x,
    y: nextPoint?.y ?? node.y
  };
}

export function resolveEdgeStrength(
  edge: MapEdge,
  source: ResolvedMapNode,
  target: ResolvedMapNode
) {
  const sourceFactor = source.signal / 100;
  const targetFactor = target.signal / 100;
  const longitudinalFactor =
    (source.longitudinalSignal / 100 + target.longitudinalSignal / 100) / 2;
  const averageFactor = (sourceFactor + targetFactor + longitudinalFactor) / 3;

  return edge.strength * (0.72 + averageFactor * 0.42);
}

export function EDGE_LINE(
  source: ResolvedMapNode,
  target: ResolvedMapNode,
  curvature: number
) {
  const dx = target.x - source.x;
  const dy = target.y - source.y;
  const length = Math.hypot(dx, dy) || 1;
  const normalX = (-dy / length) * length * curvature;
  const normalY = (dx / length) * length * curvature;

  const c1x = source.x + dx * 0.28 + normalX;
  const c1y = source.y + dy * 0.24 + normalY;
  const c2x = source.x + dx * 0.72 + normalX;
  const c2y = source.y + dy * 0.76 + normalY;

  return `M ${source.x} ${source.y} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${target.x} ${target.y}`;
}

function resolveProfileValue(profile: MetricProfile, session: number) {
  const progress = (session - 1) / 17;
  const wave = Math.sin(progress * Math.PI * 3 + (profile.phase ?? 0)) * (profile.wave ?? 0);
  const value = profile.start + (profile.end - profile.start) * progress + wave;

  return clamp(Math.round(value), 20, 100);
}

function buildSignalSeries(profile: MetricProfile) {
  return Array.from({ length: 18 }, (_, index) => resolveProfileValue(profile, index + 1));
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
