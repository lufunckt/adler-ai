import { getAuthToken } from "../lib/auth";
import { baseUrl } from "./config";

type RequestOptions = RequestInit & { body?: string };

async function call<T>(path: string, options: RequestOptions = {}) {
  const authToken = getAuthToken();
  const headers = {
    "Content-Type": "application/json",
    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    ...(options.headers ?? {})
  };

  const response = await fetch(`${baseUrl}${path}`, {
    headers,
    ...options
  });

  if (!response.ok) {
    let message = response.statusText;
    try {
      const payload = await response.json();
      message = payload.detail ?? JSON.stringify(payload);
    } catch {
      message = await response.text();
    }
    throw new Error(message || "Request failed");
  }

  return (await response.json()) as T;
}

export type AdlerPatientRegistryItem = {
  id: string;
  name: string;
  initials: string;
  status: "active" | "inactive";
  focus: string;
  diagnosis: string;
  current_protocol: string;
  default_session: number;
};

export type AdlerScheduleItem = {
  id: string;
  patient_id: string;
  patient_name: string;
  time: string;
  duration: string;
  session_label: string;
  mode: string;
  room_label: string;
  prep_note: string;
  status: "completed" | "next" | "scheduled";
};

export type AdlerDashboardResponse = {
  clinician: Record<string, any>;
  notes: string;
  recent_notes: any[];
  schedule: AdlerScheduleItem[];
  summary: Record<string, any>;
  tasks: any[];
};

export type AdlerBootstrapResponse = {
  dashboard: AdlerDashboardResponse;
  documents: any[];
  patients: AdlerPatientRegistryItem[];
};

export function fetchAdlerBootstrap() {
  return call<AdlerBootstrapResponse>("/api/adler/bootstrap");
}

export function fetchAdlerDashboard() {
  return call<AdlerDashboardResponse>("/api/adler/dashboard");
}

export function fetchAdlerPatients(search?: string, status = "all") {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  params.set("status", status);
  return call<AdlerPatientRegistryItem[]>(`/api/adler/patients?${params}`);
}

export function createAdlerPatient(patient: { name: string; focus: string }) {
  return call<AdlerPatientRegistryItem>("/api/adler/patients", {
    method: "POST",
    body: JSON.stringify(patient)
  });
}

export function updateAdlerPatient(id: string, patient: Partial<AdlerPatientRegistryItem>) {
  return call<AdlerPatientRegistryItem>(`/api/adler/patients/${id}`, {
    method: "PUT",
    body: JSON.stringify(patient)
  });
}

export function deleteAdlerPatient(id: string) {
  return call<{ status: string }>(`/api/adler/patients/${id}`, {
    method: "DELETE"
  });
}

export function createAdlerAppointment(appt: { patient_id: string; time: string; note: string }) {
  return call<AdlerScheduleItem>("/api/adler/appointments", {
    method: "POST",
    body: JSON.stringify({
      ...appt,
      prep_note: appt.note
    })
  });
}

export function deleteAdlerAppointment(id: string) {
  return call<{ status: string }>(`/api/adler/appointments/${id}`, {
    method: "DELETE"
  });
}

export type AdlerDocumentModel = {
  arquivo: string;
  contexto: string;
  id: string;
  observacoes: string;
  profissional: string;
  tipo_documento: string;
  titulo: string;
  uso_clinico: string;
};

export type AdlerDocumentModelsResponse = {
  auth_mode: string;
  count: number;
  models: AdlerDocumentModel[];
  tenant_id: string;
};

export type AdlerScientificBaseResponse = {
  auth_mode: string;
  clinical_concepts: Array<Record<string, string>>;
  document_models: Array<Record<string, string>>;
  documents: Array<Record<string, string>>;
  filters: Record<string, string | null>;
  interactions: Array<Record<string, string>>;
  laboratory_monitoring: Array<Record<string, string>>;
  psychological_scales: Array<Record<string, string>>;
  psychopathology: Array<Record<string, string>>;
  root: string;
  summary: Record<string, number>;
  tenant_id: string;
  warnings: Array<Record<string, string | number | null>>;
};

export type MedicationSearchResult = {
  name: string;
  rxcui: string;
  source: string;
  synonym: string;
  term_type: string;
};

export type MedicationLabelResult = {
  adverse_reactions: string;
  brand_name: string;
  drug_interactions: string;
  generic_name: string;
  indications: string;
  source: string;
  warnings: string;
};

export type MedicationEvidenceProfile = {
  class_name: string;
  clinical_trials: string[];
  contraindication_flags: string[];
  display_name: string;
  evidence_level: string;
  genetic_notes: string[];
  gold_standard: string[];
  indications: string[];
  initial_dose: string;
  max_dose: string;
  mechanism: string;
  monitoring_summary: string;
  personalization_criteria: string[];
  pharmacodynamics: string[];
  pharmacokinetics: string[];
};

export type MedicationDecisionSupport = {
  clinical_boundary: string;
  first_line_context: string[];
  insertion_checklist: string[];
  interaction_alerts: string[];
  monitoring_actions: string[];
  pk_pd_notes: string[];
};

export type AdlerMedicationSearchResponse = {
  available_local_medications: string[];
  auth_mode: string;
  curated_insights: {
    clinical_concepts: Array<Record<string, string>>;
    documents: Array<Record<string, string>>;
    interactions: Array<Record<string, string>>;
    laboratory_monitoring: Array<Record<string, string>>;
  };
  decision_support: MedicationDecisionSupport;
  evidence_profile: MedicationEvidenceProfile | null;
  label: MedicationLabelResult | null;
  local_query: string;
  normalized_query: string;
  query: string;
  results: MedicationSearchResult[];
  source_notes: string[];
  sources: Array<{ name: string; purpose: string; url: string }>;
  tenant_id: string;
  treatment_notes: string[];
  validation: {
    confidence_score: number;
    criteria: string[];
    status: "validado" | "parcial" | "revisar";
  };
};

export function fetchAdlerDocumentModels(filters: {
  contexto?: string;
  profissional?: string;
  q?: string;
  tipoDocumento?: string;
} = {}) {
  const params = new URLSearchParams();
  if (filters.contexto) params.set("contexto", filters.contexto);
  if (filters.profissional) params.set("profissional", filters.profissional);
  if (filters.q) params.set("q", filters.q);
  if (filters.tipoDocumento) params.set("tipo_documento", filters.tipoDocumento);

  const query = params.toString();
  return call<AdlerDocumentModelsResponse>(
    `/api/adler/science/document-models${query ? `?${query}` : ""}`
  );
}

export function getAdlerDocumentModelDownloadUrl(modelId: string) {
  return `${baseUrl}/api/adler/science/document-models/${modelId}/download`;
}

export function fetchAdlerScienceBase(filters: {
  abordagem?: string;
  categoria?: string;
  diagnostico?: string;
  escala?: string;
  gene?: string;
  gravidade?: string;
  medicamento?: string;
  q?: string;
} = {}) {
  const params = new URLSearchParams();
  if (filters.abordagem) params.set("abordagem", filters.abordagem);
  if (filters.categoria) params.set("categoria", filters.categoria);
  if (filters.diagnostico) params.set("diagnostico", filters.diagnostico);
  if (filters.escala) params.set("escala", filters.escala);
  if (filters.gene) params.set("gene", filters.gene);
  if (filters.gravidade) params.set("gravidade", filters.gravidade);
  if (filters.medicamento) params.set("medicamento", filters.medicamento);
  if (filters.q) params.set("q", filters.q);

  const query = params.toString();
  return call<AdlerScientificBaseResponse>(
    `/api/adler/science/base${query ? `?${query}` : ""}`
  );
}

export function fetchAdlerMedicationSearch(q: string) {
  const params = new URLSearchParams({ q });
  return call<AdlerMedicationSearchResponse>(`/api/adler/medications/search?${params}`);
}

export type AdlerClinicalSessionInput = {
  patient_id: string;
  session_number: number;
  occurred_at?: string;
  sintomas: string[];
  emocoes: string[];
  eventos: string[];
  comportamentos: string[];
  medicacao: string[];
  tempo?: string;
  abordagem_clinica: "cbt" | "psychoanalysis" | "psychiatry";
  observacoes?: string;
};

export type AdlerEvolutionDecisionResponse = {
  patient_id: string;
  status_geral: "melhorando" | "estavel" | "piorando" | "atencao";
  principais_mudancas: string[];
  padroes_persistentes: string[];
  novos_riscos: string[];
  tendencias: string[];
  sessions_compared: number[];
  snapshot_id: number | null;
};

export type AdlerAbandonmentRiskResponse = {
  patient_id: string;
  risco_abandono: "baixo" | "moderado" | "alto";
  score: number;
  fatores_identificados: string[];
  sugestoes_acao: string[];
  risk_score_id: number | null;
};

export type AdlerWhatsAppCheckinInput = {
  patient_id: string;
  mood?: number;
  anxiety?: number;
  sleep?: number;
  adherence?: number;
  notes?: string;
  phone_hash?: string;
};

export type AdlerWhatsAppDashboardResponse = {
  patient_id: string;
  recent_messages: Array<Record<string, unknown>>;
  confirmations: Array<Record<string, unknown>>;
  checkins: Array<Record<string, unknown>>;
  engagement_flags: Array<Record<string, unknown>>;
  positioning_notice: string;
};

export type AdlerEvolutionHistoryResponse = {
  patient_id: string;
  count: number;
  snapshots: Array<{
    id: number;
    patient_id: string;
    from_session: number | null;
    to_session: number | null;
    status: string;
    summary: Record<string, unknown>;
    created_at: string;
  }>;
};

export type AdlerRiskHistoryResponse = {
  patient_id: string;
  count: number;
  scores: Array<{
    id: number;
    patient_id: string;
    session_number: number | null;
    risk_type: string;
    score: number;
    classification: string;
    factors: string[];
    recommendation: string;
    created_at: string;
  }>;
};

export function analyzeAdlerClinicalSession(payload: AdlerClinicalSessionInput) {
  return call<Record<string, unknown>>("/api/adler/intelligence/sessions/analyze", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function fetchAdlerEvolutionDecision(patientId: string) {
  return call<AdlerEvolutionDecisionResponse>(
    `/api/adler/intelligence/patients/${patientId}/evolution/decision`
  );
}

export function fetchAdlerAbandonmentRisk(patientId: string) {
  return call<AdlerAbandonmentRiskResponse>(
    `/api/adler/intelligence/patients/${patientId}/abandonment-risk`
  );
}

export function fetchAdlerEvolutionHistory(patientId: string, limit = 20) {
  return call<AdlerEvolutionHistoryResponse>(
    `/api/adler/intelligence/patients/${patientId}/evolution-history?limit=${limit}`
  );
}

export function fetchAdlerRiskHistory(patientId: string, limit = 30) {
  return call<AdlerRiskHistoryResponse>(
    `/api/adler/intelligence/patients/${patientId}/risk-history?limit=${limit}`
  );
}

export function createAdlerWhatsAppCheckin(payload: AdlerWhatsAppCheckinInput) {
  return call<Record<string, unknown>>("/api/adler/whatsapp/checkins", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function fetchAdlerWhatsAppDashboard(patientId: string) {
  return call<AdlerWhatsAppDashboardResponse>(
    `/api/adler/whatsapp/patients/${patientId}/dashboard`
  );
}
