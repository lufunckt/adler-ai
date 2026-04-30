import type { ClinicalApproach, ShellTab } from "../context/AdlerShellContext";
import type { PatientRecord } from "../data/patientData";

export type DashboardSection = "home" | "notes" | "patients" | "schedule" | "settings";

export type DashboardUiState = {
  activeSection: DashboardSection;
  notesDraft: string;
  patientFilter: "active" | "all" | "inactive";
  searchTerm: string;
  selectedUploadPatientId: string;
};

export type AdlerWorkspaceState = {
  activeTab: ShellTab;
  approach: ClinicalApproach;
  hasContractedGeneticTest: boolean;
  screen: "dashboard" | "workspace";
  selectedPatientId: string;
  selectedSession: number;
};

export type DemoDocumentMeta = {
  id: string;
  mimeType: string;
  name: string;
  patientId: string | null;
  sizeBytes: number;
  uploadedAt: string;
};

const DASHBOARD_UI_KEY = "adler.demo.dashboard-ui.v1";
const DOCUMENTS_KEY = "adler.demo.documents.v1";
const WORKSPACE_KEY = "adler.demo.workspace.v1";
const DOCUMENTS_DB_NAME = "adler-demo-documents";
const DOCUMENTS_STORE_NAME = "pdfs";

function parseStorage<T>(raw: string | null, fallback: T): T {
  if (!raw) {
    return fallback;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function canUseStorage() {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

export function loadDashboardUiState(fallback: DashboardUiState) {
  if (!canUseStorage()) {
    return fallback;
  }

  return parseStorage<DashboardUiState>(localStorage.getItem(DASHBOARD_UI_KEY), fallback);
}

export function saveDashboardUiState(state: DashboardUiState) {
  if (!canUseStorage()) {
    return;
  }

  localStorage.setItem(DASHBOARD_UI_KEY, JSON.stringify(state));
}

export function loadWorkspaceState(fallback: AdlerWorkspaceState) {
  if (!canUseStorage()) {
    return fallback;
  }

  return parseStorage<AdlerWorkspaceState>(localStorage.getItem(WORKSPACE_KEY), fallback);
}

export function saveWorkspaceState(state: AdlerWorkspaceState) {
  if (!canUseStorage()) {
    return;
  }

  localStorage.setItem(WORKSPACE_KEY, JSON.stringify(state));
}

export function loadDocumentMetas() {
  if (!canUseStorage()) {
    return [] as DemoDocumentMeta[];
  }

  return parseStorage<DemoDocumentMeta[]>(localStorage.getItem(DOCUMENTS_KEY), []);
}

function saveDocumentMetas(documents: DemoDocumentMeta[]) {
  if (!canUseStorage()) {
    return;
  }

  localStorage.setItem(DOCUMENTS_KEY, JSON.stringify(documents));
}

function openDocumentsDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DOCUMENTS_DB_NAME, 1);

    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(DOCUMENTS_STORE_NAME)) {
        request.result.createObjectStore(DOCUMENTS_STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error ?? new Error("Nao foi possivel abrir os documentos locais."));
  });
}

export async function saveDemoDocument(meta: DemoDocumentMeta, file: Blob) {
  const database = await openDocumentsDatabase();

  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(DOCUMENTS_STORE_NAME, "readwrite");
    transaction.objectStore(DOCUMENTS_STORE_NAME).put(file, meta.id);

    transaction.oncomplete = () => {
      database.close();
      resolve();
    };

    transaction.onerror = () => {
      database.close();
      reject(transaction.error ?? new Error("Nao consegui salvar o PDF localmente."));
    };
  });

  const currentDocuments = loadDocumentMetas();
  saveDocumentMetas([meta, ...currentDocuments.filter((item) => item.id !== meta.id)]);
}

export async function getDemoDocumentBlob(documentId: string) {
  const database = await openDocumentsDatabase();

  return new Promise<Blob | undefined>((resolve, reject) => {
    const transaction = database.transaction(DOCUMENTS_STORE_NAME, "readonly");
    const request = transaction.objectStore(DOCUMENTS_STORE_NAME).get(documentId);
    let result: Blob | undefined;

    request.onsuccess = () => {
      result = request.result as Blob | undefined;
    };

    transaction.oncomplete = () => {
      database.close();
      resolve(result);
    };

    transaction.onerror = () => {
      database.close();
      reject(transaction.error ?? new Error("Nao consegui abrir o PDF salvo."));
    };
  });
}

export async function deleteDemoDocument(documentId: string) {
  const database = await openDocumentsDatabase();

  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(DOCUMENTS_STORE_NAME, "readwrite");
    transaction.objectStore(DOCUMENTS_STORE_NAME).delete(documentId);

    transaction.oncomplete = () => {
      database.close();
      resolve();
    };

    transaction.onerror = () => {
      database.close();
      reject(transaction.error ?? new Error("Nao consegui remover o PDF salvo."));
    };
  });

  const nextDocuments = loadDocumentMetas().filter((item) => item.id !== documentId);
  saveDocumentMetas(nextDocuments);
}

export function downloadPatientRegistryCsv(
  patients: PatientRecord[],
  statuses: Record<string, "active" | "inactive">
) {
  const lines = [
    ["nome", "status", "foco", "diagnostico", "protocolo_atual"].join(","),
    ...patients.map((patient) =>
      [
        patient.name,
        statuses[patient.id] ?? "active",
        patient.focus,
        patient.diagnosis,
        patient.currentProtocol
      ]
        .map((value) => `"${String(value).replaceAll('"', '""')}"`)
        .join(",")
    )
  ];

  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "adler-pacientes.csv";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
