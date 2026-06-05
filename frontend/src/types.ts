import { LucideIcon } from "lucide-react";

export type Page = "home" | "patients" | "schedule" | "dsm" | "documents" | "subscription" | "settings";
export type WorkspaceTab = "session" | "map" | "timeline" | "tests" | "medications" | "exams";
export type Status = "active" | "inactive";
export type Modal = "about" | "security" | "patient" | "schedule" | null;
export type Approach = "schema" | "cbt" | "psychiatry" | "psychoanalysis" | "couples" | "generalist" | "systemic";
export type Plan = "standard" | "premium";

export type Patient = {
  focus: string;
  hypothesis: string;
  id: string;
  initials: string;
  lastSeen: string;
  name: string;
  progress: number;
  protocol: string;
  risk: number;
  sessions: number;
  status: Status;
};

export type Appointment = {
  id: string;
  kind: string;
  mode: string;
  note: string;
  patientId: string;
  patientName?: string;
  time: string;
  status?: "completed" | "next" | "scheduled";
};
