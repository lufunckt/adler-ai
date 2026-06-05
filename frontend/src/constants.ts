import { LucideIcon, Home, Users, Calendar, Brain, FileText, CreditCard, Settings, Mic, TrendingUp, ClipboardCheck, Pill, Activity } from "lucide-react";
import { Patient, Approach, Page, WorkspaceTab, Plan } from "./types";

export const clinician = {
  name: "Érico Lopes",
  initials: "EL",
  credentials: "CRP 07/12345",
  role: "Psicólogo Clínico",
  approach: "schema" as Approach,
  plan: "premium" as Plan,
  registry: "CRP 07/12345"
};

export const approach = {
  label: "Terapia do Esquema",
  accent: "#f43f5e"
};

export const navItems: Array<{ icon: LucideIcon; id: Page; label: string }> = [
  { id: "home", label: "Início", icon: Home },
  { id: "patients", label: "Pacientes", icon: Users },
  { id: "schedule", label: "Agenda", icon: Calendar },
  { id: "dsm", label: "DSM / Psicopatologia", icon: Brain },
  { id: "documents", label: "Documentos", icon: FileText },
  { id: "subscription", label: "Assinatura", icon: CreditCard },
  { id: "settings", label: "Configurações", icon: Settings }
];

export const workspaceTabs: Array<{ icon: LucideIcon; id: WorkspaceTab; label: string }> = [
  { id: "session", label: "Captura", icon: Mic },
  { id: "map", label: "Mapa Cognitivo", icon: Brain },
  { id: "timeline", label: "Evolução", icon: TrendingUp },
  { id: "tests", label: "Testes", icon: ClipboardCheck },
  { id: "medications", label: "Medicamentos", icon: Pill },
  { id: "exams", label: "Exames & Monitoramento", icon: Activity }
];

export const avatarPalette = [
  "bg-rose-500/10 text-rose-400 border-rose-500/20",
  "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  "bg-amber-500/10 text-amber-400 border-amber-500/20",
  "bg-cyan-500/10 text-cyan-400 border-cyan-500/20"
];

export function avatarClass(index: number) {
  return avatarPalette[index % avatarPalette.length];
}

export const dsmConditions = [
  { id: "f32", code: "F32.9", name: "Transtorno Depressivo Maior", category: "Humor", title: "Transtorno Depressivo Maior", symptoms: [], note: "", scales: [], differentials: [] },
  { id: "f41", code: "F41.1", name: "Transtorno de Ansiedade Generalizada", category: "Ansiedade", title: "Transtorno de Ansiedade Generalizada", symptoms: [], note: "", scales: [], differentials: [] },
  { id: "f42", code: "F42", name: "Transtorno Obsessivo-Compulsivo", category: "Ansiedade", title: "Transtorno Obsessivo-Compulsivo", symptoms: [], note: "", scales: [], differentials: [] }
];

export const documentTemplates = [
  { id: "laudo", title: "Laudo Psicológico", type: "Oficial", owner: "Clínico", kind: "Documento", purpose: "Avaliação" },
  { id: "relatorio", title: "Relatório de Evolução", type: "Acompanhamento", owner: "Clínico", kind: "Documento", purpose: "Evolução" }
];

export function exportPatients(patients: Patient[]) {
  const header = "id,nome,status,foco,hipotese,protocolo,sessoes,risco,progresso";
  const rows = patients.map((p) =>
    [p.id, p.name, p.status, p.focus, p.hypothesis, p.protocol, p.sessions, p.risk, p.progress]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(",")
  );
  const blob = new Blob([[header, ...rows].join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "adler-pacientes.csv";
  link.click();
  URL.revokeObjectURL(url);
}

export function initialsFrom(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function slugify(value: string) {
  const slug = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `${slug || "paciente"}-${Date.now().toString(36)}`;
}
