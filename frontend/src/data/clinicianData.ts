import type { ClinicalApproach } from "../context/AdlerShellContext";

export type ClinicianProfile = {
  allowedApproaches: ClinicalApproach[];
  credentials: string;
  focusLabel: string;
  initials: string;
  name: string;
  notifications: number;
  primaryApproach: ClinicalApproach;
  primaryApproachLabel: string;
  role: string;
  subscriptionTier: "standard" | "premium";
};

export type ClinicianScheduleItem = {
  duration: string;
  mode: string;
  patientId: string;
  prepNote: string;
  roomLabel: string;
  sessionLabel: string;
  status: "completed" | "next" | "scheduled";
  time: string;
};

export type ClinicianTaskItem = {
  id: string;
  label: string;
  priority: "alta" | "media" | "rotina";
  status: "done" | "pending";
};

export type ClinicianNoteItem = {
  id: string;
  text: string;
  updatedAt: string;
};

export const CLINICIAN_PROFILE: ClinicianProfile = {
  name: "Érico Lopes",
  initials: "EL",
  credentials: "CRP 07/12345",
  role: "Psicólogo Clínico",
  primaryApproach: "schema",
  primaryApproachLabel: "Terapia do Esquema",
  subscriptionTier: "premium",
  allowedApproaches: ["schema"],
  notifications: 3,
  focusLabel: "Atendimento clínico adulto"
};

export const CLINICIAN_SCHEDULE: ClinicianScheduleItem[] = [
  {
    patientId: "daniel-r",
    time: "09:00",
    duration: "50 min",
    sessionLabel: "Sessão de continuidade",
    mode: "Online",
    roomLabel: "Sala Atlas",
    prepNote: "Revisar ativação comportamental e padrão de autoexigência.",
    status: "completed"
  },
  {
    patientId: "sarah-m",
    time: "11:00",
    duration: "50 min",
    sessionLabel: "Sessão focada em rituais",
    mode: "Presencial",
    roomLabel: "Consultório 02",
    prepNote: "Checar resposta à exposição e padrão de neutralização compulsiva.",
    status: "next"
  },
  {
    patientId: "helena-v",
    time: "14:30",
    duration: "50 min",
    sessionLabel: "Acompanhamento trauma",
    mode: "Online",
    roomLabel: "Sala Aurora",
    prepNote: "Revisar hipervigilância vespertina e janela de regulação autonômica.",
    status: "scheduled"
  },
  {
    patientId: "rafael-n",
    time: "17:00",
    duration: "50 min",
    sessionLabel: "Funções executivas",
    mode: "Presencial",
    roomLabel: "Consultório 01",
    prepNote: "Conectar ASRS-1 com rotina noturna e metas de fechamento do dia.",
    status: "scheduled"
  }
];

export const CLINICIAN_TASKS: ClinicianTaskItem[] = [
  {
    id: "task-1",
    label: "Revisar nota de evolução da Sarah antes da sessão das 11h.",
    priority: "alta",
    status: "pending"
  },
  {
    id: "task-2",
    label: "Confirmar encaminhamento interdisciplinar do Bruno com a rede de apoio.",
    priority: "media",
    status: "pending"
  },
  {
    id: "task-3",
    label: "Enviar devolutiva breve do Y-BOCS para o prontuário longitudinal.",
    priority: "rotina",
    status: "done"
  }
];

export const CLINICIAN_NOTES: ClinicianNoteItem[] = [
  {
    id: "note-1",
    text: "Retomar com Sarah a diferença entre urgência emocional e necessidade real de ritual.",
    updatedAt: "08:12"
  },
  {
    id: "note-2",
    text: "Daniel está respondendo melhor quando a sessão começa com planejamento concreto da manhã seguinte.",
    updatedAt: "08:26"
  }
];

export const DASHBOARD_PATIENT_STATUS: Record<string, "active" | "inactive"> = {
  "bruno-l": "active",
  "camila-s": "inactive",
  "daniel-r": "active",
  "helena-v": "active",
  "marcus-a": "active",
  "rafael-n": "active",
  "sarah-m": "active"
};

export const DEFAULT_CLINICIAN_NOTEPAD = `• Revisar a escala Y-BOCS da Sarah antes do atendimento do final da manhã.

• Validar com Rafael a rotina de desligamento digital antes de dormir.

• Separar o encaminhamento do Bruno para revisão compartilhada após a última sessão do dia.`;
