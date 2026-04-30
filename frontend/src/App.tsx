import { AnimatePresence, motion } from "framer-motion";
import {
  analyzeAdlerClinicalSession,
  createAdlerWhatsAppCheckin,
  fetchAdlerAbandonmentRisk,
  fetchAdlerEvolutionDecision,
  fetchAdlerMedicationSearch,
  fetchAdlerWhatsAppDashboard,
  type AdlerAbandonmentRiskResponse,
  type AdlerEvolutionDecisionResponse,
  type AdlerMedicationSearchResponse,
  type MedicationSearchResult,
  type AdlerWhatsAppDashboardResponse
} from "./api/client";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Bell,
  Brain,
  BrainCircuit,
  Calendar,
  CalendarPlus,
  CheckCircle2,
  ClipboardCheck,
  CreditCard,
  Download,
  ExternalLink,
  FileText,
  Filter,
  Home,
  Info,
  Lock,
  LogOut,
  MessageCircle,
  Mic,
  Pill,
  Plus,
  Search,
  Settings,
  Shield,
  Sparkles,
  Square,
  TestTube2,
  TrendingUp,
  UserPlus,
  Users,
  X,
  type LucideIcon
} from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { AuthScreen } from "./components/AuthScreen";
import { SessionRecorderPanel } from "./components/SessionRecorderPanel";
import {
  logoutSession,
  restoreSession,
  type AuthSession
} from "./lib/auth";
import {
  buildClinicalSessionPayload,
  buildSeedTranscript,
  createInitialStructuredSessionDraft,
  deriveStructuredDraftFromContent,
  parseStructuredList,
  type SessionTranscriptLine,
  type StructuredSessionDraft
} from "./lib/clinicalSession";
import {
  buildPreviewEvolution,
  buildPreviewMapGraph,
  buildPreviewRisk,
  buildPreviewTimelinePoints,
  loadPreviewAnalyses,
  loadPreviewCheckins,
  savePreviewAnalysis,
  savePreviewCheckin
} from "./lib/previewSessionStore";

type Page = "home" | "patients" | "schedule" | "dsm" | "documents" | "subscription" | "settings";
type WorkspaceTab = "session" | "map" | "timeline" | "tests" | "medications" | "exams";
type Status = "active" | "inactive";
type Modal = "about" | "security" | "patient" | "schedule" | null;
type Approach = "schema" | "cbt" | "psychiatry" | "psychoanalysis" | "couples" | "generalist" | "systemic";
type Plan = "standard" | "premium";

type Patient = {
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

type Appointment = {
  id: string;
  kind: string;
  mode: string;
  note: string;
  patientId: string;
  time: string;
};

const clinician = {
  approach: "schema" as Approach,
  name: "Érico Lopes",
  plan: "premium" as Plan,
  registry: "CRP 07/12345",
  role: "Psicólogo clínico"
};

const approach = {
  accent: "#f43f5e",
  accentDark: "#e11d48",
  accentSoft: "#fff1f2",
  label: "Terapia do Esquema",
  surface: "from-rose-500 to-pink-600"
};

const navItems: Array<{ icon: LucideIcon; id: Page; label: string }> = [
  { id: "home", label: "Início", icon: Home },
  { id: "patients", label: "Pacientes", icon: Users },
  { id: "schedule", label: "Agenda", icon: Calendar },
  { id: "dsm", label: "DSM / Psicopatologia", icon: Brain },
  { id: "documents", label: "Documentos", icon: FileText },
  { id: "subscription", label: "Assinatura", icon: CreditCard },
  { id: "settings", label: "Configurações", icon: Settings }
];

const initialPatients: Patient[] = [
  {
    id: "sarah-m",
    initials: "SM",
    name: "Sarah M.",
    status: "active",
    focus: "TOC, insônia e rituais de neutralização",
    hypothesis: "TOC com ansiedade de doença",
    protocol: "Terapia do Esquema + EPR gradual",
    progress: 72,
    risk: 38,
    sessions: 18,
    lastSeen: "Hoje, 09:00"
  },
  {
    id: "rafael-n",
    initials: "RN",
    name: "Rafael N.",
    status: "active",
    focus: "Desatenção, sono irregular e ruminação",
    hypothesis: "TAG + hipótese de TDAH adulto",
    protocol: "ASRS-1 + formulação de esquemas",
    progress: 54,
    risk: 42,
    sessions: 12,
    lastSeen: "Hoje, 10:30"
  },
  {
    id: "ana-c",
    initials: "AC",
    name: "Ana C.",
    status: "active",
    focus: "Medo de abandono e padrões relacionais",
    hypothesis: "Esquemas de abandono e defectividade",
    protocol: "Trabalho com modos esquemáticos",
    progress: 48,
    risk: 51,
    sessions: 9,
    lastSeen: "Ontem, 16:00"
  },
  {
    id: "carlos-m",
    initials: "CM",
    name: "Carlos M.",
    status: "active",
    focus: "Humor instável e adesão ao lítio",
    hypothesis: "Transtorno bipolar tipo I",
    protocol: "Monitoramento interdisciplinar",
    progress: 61,
    risk: 66,
    sessions: 22,
    lastSeen: "18/04/2026"
  },
  {
    id: "sofia-s",
    initials: "SS",
    name: "Sofia S.",
    status: "inactive",
    focus: "TOC em remissão parcial",
    hypothesis: "TOC",
    protocol: "EPR concluído; seguimento trimestral",
    progress: 94,
    risk: 18,
    sessions: 31,
    lastSeen: "12/03/2026"
  }
];

const initialAppointments: Appointment[] = [
  {
    id: "a-1",
    patientId: "sarah-m",
    time: "09:00",
    kind: "Terapia individual",
    mode: "Presencial · Sala 1",
    note: "Revisar rituais noturnos e exposição à incerteza."
  },
  {
    id: "a-2",
    patientId: "rafael-n",
    time: "10:30",
    kind: "Avaliação clínica",
    mode: "Online",
    note: "Aplicar ASRS-1 e comparar com curva de sono."
  },
  {
    id: "a-3",
    patientId: "ana-c",
    time: "14:00",
    kind: "Terapia do Esquema",
    mode: "Presencial · Sala 2",
    note: "Mapear modo criança vulnerável e protetor desligado."
  },
  {
    id: "a-4",
    patientId: "carlos-m",
    time: "16:00",
    kind: "Retorno conjunto",
    mode: "Presencial · Sala 1",
    note: "Verificar exames de lítio e sinais de toxicidade."
  }
];

const workspaceTabs: Array<{ icon: LucideIcon; id: WorkspaceTab; label: string }> = [
  { id: "session", label: "Sessão", icon: Mic },
  { id: "map", label: "Mapa cognitivo", icon: BrainCircuit },
  { id: "timeline", label: "Linha do tempo", icon: Activity },
  { id: "tests", label: "Testes", icon: ClipboardCheck },
  { id: "medications", label: "Medicamentos", icon: Pill },
  { id: "exams", label: "Exames", icon: TestTube2 }
];

const dsmConditions = [
  {
    category: "TOC e relacionados",
    code: "F42",
    differentials: ["TAG", "TEPT", "Psicose", "Personalidade obsessivo-compulsiva"],
    id: "toc",
    note: "Diferenciar pensamento intrusivo egodistônico de crença delirante.",
    scales: ["Y-BOCS", "OCI-R", "GAD-7"],
    symptoms: "Obsessões, compulsões, evitação, culpa e necessidade patológica de certeza.",
    title: "Transtorno Obsessivo-Compulsivo"
  },
  {
    category: "Ansiedade",
    code: "F41.1",
    differentials: ["Hipertireoidismo", "TOC", "Depressão", "Uso de estimulantes"],
    id: "tag",
    note: "O núcleo clínico é preocupação persistente em múltiplos domínios.",
    scales: ["GAD-7", "BAI", "ISI"],
    symptoms: "Preocupação excessiva e difícil de controlar, tensão muscular, fadiga e insônia.",
    title: "Transtorno de Ansiedade Generalizada"
  },
  {
    category: "Personalidade",
    code: "F60.3",
    differentials: ["Bipolaridade", "TEPT complexo", "TDAH", "Uso de substâncias"],
    id: "borderline",
    note: "Priorizar psicoterapia estruturada e evitar polifarmácia.",
    scales: ["MSI-BPD", "BSL-23"],
    symptoms: "Instabilidade afetiva, medo de abandono, impulsividade e vazio crônico.",
    title: "Transtorno de Personalidade Borderline"
  }
];

const documentTemplates = [
  {
    kind: "Judicialização",
    owner: "Psiquiatra",
    purpose: "Justifica medicação não ofertada pelo SUS, ineficácia terapêutica e riscos da não utilização.",
    title: "Laudo judicial médico para medicamento fora do SUS"
  },
  {
    kind: "Laudo",
    owner: "Psicólogo",
    purpose: "Estrutura CFP: identificação, demanda, procedimentos, análise e conclusão.",
    title: "Laudo psicológico / pericial"
  },
  {
    kind: "Encaminhamento",
    owner: "Psicólogo",
    purpose: "Solicitação de avaliação psiquiátrica e possível intervenção medicamentosa.",
    title: "Encaminhamento psicólogo → psiquiatra"
  },
  {
    kind: "Encaminhamento",
    owner: "Psiquiatra",
    purpose: "Solicitação de psicoterapia integrada ao manejo medicamentoso.",
    title: "Encaminhamento psiquiatra → psicólogo"
  },
  {
    kind: "Atestado",
    owner: "Psicólogo",
    purpose: "Comprova comparecimento, estado psicológico ou necessidade de afastamento.",
    title: "Atestado psicológico"
  }
];

const avatarPalette = [
  "bg-rose-100 text-rose-700",
  "bg-violet-100 text-violet-700",
  "bg-sky-100 text-sky-700",
  "bg-amber-100 text-amber-700",
  "bg-emerald-100 text-emerald-700"
];

function avatarClass(index: number) {
  return avatarPalette[Math.max(index, 0) % avatarPalette.length];
}

export default function App() {
  const [authSession, setAuthSession] = useState<AuthSession | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [page, setPage] = useState<Page>("home");
  const [patients, setPatients] = useState(initialPatients);
  const [appointments, setAppointments] = useState(initialAppointments);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [modal, setModal] = useState<Modal>(null);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("session");
  const [isRecording, setIsRecording] = useState(false);
  const [session, setSession] = useState(18);

  useEffect(() => {
    let active = true;

    void restoreSession().then((sessionPayload) => {
      if (!active) return;
      setAuthSession(sessionPayload);
      setAuthReady(true);
    });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    document.title = authSession ? "Adler AI" : "Adler AI • Login";
  }, [authSession]);

  const selectedPatient = patients.find((p) => p.id === selectedPatientId) ?? null;
  const visibleTabs = useMemo(
    () =>
      clinician.plan === "premium" || clinician.approach === "psychiatry"
        ? workspaceTabs
        : workspaceTabs.filter((t) => t.id !== "medications" && t.id !== "exams"),
    []
  );

  async function handleLogout() {
    await logoutSession();
    setAuthSession(null);
    setSelectedPatientId(null);
    setPage("home");
    setSearch("");
  }

  if (!authReady) {
    return <AppBootScreen />;
  }

  if (!authSession) {
    return <AuthScreen onAuthenticated={setAuthSession} />;
  }

  const openPatient = (id: string) => {
    const p = patients.find((item) => item.id === id);
    if (!p) return;
    setSelectedPatientId(p.id);
    setActiveTab("session");
    setSession(p.sessions);
    setSearch("");
  };

  const addPatient = (payload: { focus: string; name: string }) => {
    const p: Patient = {
      id: slugify(payload.name),
      initials: initialsFrom(payload.name),
      name: payload.name,
      status: "active",
      focus: payload.focus || "Avaliação inicial",
      hypothesis: "Hipótese em aberto",
      protocol: `${approach.label} · formulação inicial`,
      progress: 8,
      risk: 28,
      sessions: 1,
      lastSeen: "Novo cadastro"
    };
    setPatients((c) => [p, ...c]);
    setPage("patients");
    setModal(null);
  };

  const schedulePatient = (payload: {
    kind: string;
    mode: string;
    name: string;
    note: string;
    time: string;
  }) => {
    const existing = patients.find((p) => p.name.toLowerCase() === payload.name.toLowerCase());
    const p =
      existing ??
      ({
        id: slugify(payload.name),
        initials: initialsFrom(payload.name),
        name: payload.name,
        status: "active",
        focus: "Criado automaticamente pela agenda",
        hypothesis: "Triagem pendente",
        protocol: `${approach.label} · primeira sessão`,
        progress: 0,
        risk: 30,
        sessions: 1,
        lastSeen: "Agendado"
      } satisfies Patient);
    if (!existing) setPatients((c) => [p, ...c]);
    setAppointments((c) =>
      [
        ...c,
        {
          id: `a-${Date.now()}`,
          kind: payload.kind,
          mode: payload.mode,
          note: payload.note || "Sem observações.",
          patientId: p.id,
          time: payload.time
        }
      ].sort((a, b) => a.time.localeCompare(b.time))
    );
    setPage("schedule");
    setModal(null);
  };

  if (selectedPatient) {
    return (
      <>
        <SessionBadge authSession={authSession} onLogout={handleLogout} />
        <PatientWorkspace
          activeTab={activeTab}
          isRecording={isRecording}
          onBack={() => setSelectedPatientId(null)}
          patient={selectedPatient}
          patientIndex={patients.findIndex((p) => p.id === selectedPatient.id)}
          session={session}
          setActiveTab={setActiveTab}
          setIsRecording={setIsRecording}
          setSession={setSession}
          tabs={visibleTabs}
        />
      </>
    );
  }

  return (
    <>
      <SessionBadge authSession={authSession} onLogout={handleLogout} />
      <div className="h-screen overflow-hidden bg-[#f8f8fb] font-sans text-gray-900">
        <div className="flex h-full">
          <GlobalSidebar currentPage={page} onNavigate={setPage} />
          <div className="flex min-w-0 flex-1 flex-col">
            <GlobalHeader
              onOpenAddPatient={() => setModal("patient")}
              onOpenInfo={() => setModal("about")}
              onOpenPatient={openPatient}
              onOpenSchedule={() => setModal("schedule")}
              onOpenSecurity={() => setModal("security")}
              patients={patients}
              search={search}
              setSearch={setSearch}
            />
            <main className="figma-scroll min-h-0 flex-1 overflow-y-auto">
              <AnimatePresence mode="wait">
                <motion.div
                  key={page}
                  animate={{ opacity: 1, y: 0 }}
                  className="mx-auto w-full max-w-[1560px] px-8 py-8"
                  exit={{ opacity: 0, y: -10 }}
                  initial={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.18 }}
                >
                  {page === "home" ? (
                    <HomePage appointments={appointments} onOpenPatient={openPatient} patients={patients} />
                  ) : null}
                  {page === "patients" ? (
                    <PatientsPage
                      onAddPatient={() => setModal("patient")}
                      onOpenPatient={openPatient}
                      patients={patients}
                    />
                  ) : null}
                  {page === "schedule" ? (
                    <SchedulePage
                      appointments={appointments}
                      onOpenPatient={openPatient}
                      onSchedule={() => setModal("schedule")}
                      patients={patients}
                    />
                  ) : null}
                  {page === "dsm" ? <DSMPage /> : null}
                  {page === "documents" ? <DocumentsPage /> : null}
                  {page === "subscription" ? <SubscriptionPage /> : null}
                  {page === "settings" ? <SettingsPage /> : null}
                </motion.div>
              </AnimatePresence>
            </main>
          </div>
        </div>

        <AnimatePresence>
          {modal === "about" ? <AboutModal onClose={() => setModal(null)} /> : null}
          {modal === "security" ? <SecurityModal onClose={() => setModal(null)} /> : null}
          {modal === "patient" ? <PatientModal onClose={() => setModal(null)} onSubmit={addPatient} /> : null}
          {modal === "schedule" ? (
            <ScheduleModal
              onClose={() => setModal(null)}
              onSubmit={schedulePatient}
              patients={patients}
            />
          ) : null}
        </AnimatePresence>
      </div>
    </>
  );
}

function AppBootScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#090b10] text-white">
      <div className="rounded-[32px] border border-white/8 bg-[#101319] px-8 py-7 text-center shadow-2xl shadow-black/20">
        <p className="font-mono text-[0.64rem] uppercase tracking-[0.28em] text-white/42">
          Adler AI
        </p>
        <p className="mt-3 text-sm text-white/68">Preparando ambiente clinico...</p>
      </div>
    </div>
  );
}

function SessionBadge({
  authSession,
  onLogout
}: {
  authSession: AuthSession;
  onLogout: () => void;
}) {
  const modeLabel =
    authSession.mode === "demo" ? "Demo compartilhavel" : "Conta autenticada";

  return (
    <div className="fixed right-4 top-4 z-[70] flex items-center gap-3 rounded-full border border-white/10 bg-[#101319]/92 px-3 py-2 text-white shadow-xl shadow-black/20 backdrop-blur-xl">
      <div className="min-w-0">
        <p className="max-w-[180px] truncate text-xs font-semibold">
          {authSession.user.email}
        </p>
        <p className="font-mono text-[0.58rem] uppercase tracking-[0.18em] text-white/42">
          {modeLabel}
        </p>
      </div>
      <button
        type="button"
        onClick={onLogout}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/72 transition hover:bg-white/[0.09] hover:text-white"
        aria-label="Sair"
      >
        <LogOut className="h-4 w-4" />
      </button>
    </div>
  );
}

function GlobalSidebar({ currentPage, onNavigate }: { currentPage: Page; onNavigate: (p: Page) => void }) {
  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col border-r border-gray-200 bg-white">
      <div className="flex h-16 shrink-0 items-center gap-3 border-b border-gray-100 px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500 shadow-sm">
          <BrainCircuit className="h-4 w-4 text-white" />
        </div>
        <div>
          <p className="text-[15px] font-bold leading-none tracking-tight text-gray-900">Adler AI</p>
          <p className="mt-0.5 text-[10px] font-medium uppercase tracking-widest text-rose-500">Clínico</p>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 px-3 py-4">
        <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-gray-400">Menu</p>
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = item.id === currentPage;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all ${
                active ? "bg-rose-50 text-rose-600" : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <Icon className={`h-4 w-4 ${active ? "text-rose-500" : "text-gray-400"}`} />
              {item.label}
              {active ? <span className="ml-auto h-1.5 w-1.5 rounded-full bg-rose-500" /> : null}
            </button>
          );
        })}
      </nav>

      <div className="border-t border-gray-100 p-4">
        <div className="flex items-center gap-3 rounded-xl bg-gray-50 px-3 py-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-rose-500 text-sm font-bold text-white">
            EL
          </div>
          <div className="min-w-0">
            <p className="truncate text-[13px] font-semibold text-gray-900">{clinician.name}</p>
            <p className="text-[11px] text-gray-400">{clinician.registry}</p>
          </div>
        </div>
        <div className="mt-2 flex items-center gap-1.5 px-1">
          <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
          <p className="text-[11px] text-rose-500">{approach.label}</p>
        </div>
        {clinician.plan === "premium" ? (
          <div className="mt-2 rounded-lg bg-rose-50 px-3 py-2">
            <p className="text-[11px] font-semibold text-rose-600">Premium · todas as lentes</p>
          </div>
        ) : null}
      </div>
    </aside>
  );
}

function GlobalHeader({
  onOpenAddPatient,
  onOpenInfo,
  onOpenPatient,
  onOpenSchedule,
  onOpenSecurity,
  patients,
  search,
  setSearch
}: {
  onOpenAddPatient: () => void;
  onOpenInfo: () => void;
  onOpenPatient: (id: string) => void;
  onOpenSchedule: () => void;
  onOpenSecurity: () => void;
  patients: Patient[];
  search: string;
  setSearch: (v: string) => void;
}) {
  const results = patients.filter((p) =>
    `${p.name} ${p.focus} ${p.hypothesis}`.toLowerCase().includes(search.toLowerCase())
  );
  return (
    <header className="relative z-30 flex h-16 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-6">
      <div className="relative w-full max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar paciente, diagnóstico..."
          className="h-9 w-full rounded-lg border border-gray-200 bg-gray-50 pl-9 pr-4 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-rose-300 focus:bg-white focus:ring-2 focus:ring-rose-100"
        />
        {search.length > 1 ? (
          <div className="absolute left-0 right-0 top-11 overflow-hidden rounded-xl border border-gray-200 bg-white p-1.5 shadow-xl">
            {results.slice(0, 5).map((p, i) => (
              <button
                key={p.id}
                type="button"
                onClick={() => onOpenPatient(p.id)}
                className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left hover:bg-rose-50"
              >
                <span className="flex items-center gap-3">
                  <span className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold ${avatarClass(i)}`}>
                    {p.initials}
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-gray-900">{p.name}</span>
                    <span className="text-xs text-gray-500">{p.focus}</span>
                  </span>
                </span>
                <ArrowRight className="h-3.5 w-3.5 text-rose-400" />
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div className="ml-4 flex items-center gap-2">
        <button
          aria-label="Info"
          onClick={onOpenInfo}
          className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
          type="button"
        >
          <Info className="h-4 w-4" />
        </button>
        <button
          aria-label="Segurança"
          onClick={onOpenSecurity}
          className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
          type="button"
        >
          <Shield className="h-4 w-4" />
        </button>
        <button
          aria-label="Notificações"
          className="relative rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
          type="button"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-rose-500" />
        </button>
        <div className="mx-2 h-5 w-px bg-gray-200" />
        <button
          type="button"
          onClick={onOpenAddPatient}
          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-700 transition hover:border-rose-300 hover:text-rose-600"
        >
          <UserPlus className="h-3.5 w-3.5" /> Novo paciente
        </button>
        <button
          type="button"
          onClick={onOpenSchedule}
          className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-rose-500 px-3 text-xs font-semibold text-white shadow-sm transition hover:bg-rose-600"
        >
          <CalendarPlus className="h-3.5 w-3.5" /> Agendar
        </button>
      </div>
    </header>
  );
}

function HomePage({
  appointments,
  onOpenPatient,
  patients
}: {
  appointments: Appointment[];
  onOpenPatient: (id: string) => void;
  patients: Patient[];
}) {
  const active = patients.filter((p) => p.status === "active").length;
  const alerts = patients.filter((p) => p.risk >= 60).length;
  const totalSessions = patients.reduce((s, p) => s + p.sessions, 0);

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          Bom dia, {clinician.name.split(" ")[0]}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Segunda, 20 de abril de 2026 · {approach.label} · {appointments.length} sessões hoje
        </p>
      </motion.div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Sessões hoje"
          value={appointments.length.toString()}
          delta="+1 vs ontem"
          color="rose"
          icon={Calendar}
          spark={[3, 4, 3, 5, 4, appointments.length]}
        />
        <KpiCard
          label="Pacientes ativos"
          value={active.toString()}
          delta="Todos em acompanhamento"
          color="violet"
          icon={Users}
          spark={[3, 4, 4, 4, 5, active]}
        />
        <KpiCard
          label="Total de sessões"
          value={totalSessions.toString()}
          delta="Histórico completo"
          color="sky"
          icon={Activity}
          spark={[60, 65, 70, 75, 80, totalSessions]}
        />
        <KpiCard
          label="Alertas clínicos"
          value={alerts.toString()}
          delta={alerts > 0 ? "Requer atenção" : "Tudo estável"}
          color={alerts > 0 ? "red" : "emerald"}
          icon={AlertTriangle}
          spark={[1, 2, 1, 2, 1, alerts]}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(300px,1fr)]">
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
            <div>
              <h2 className="text-[15px] font-semibold text-gray-900">Agenda do dia</h2>
              <p className="text-xs text-gray-400">{appointments.length} sessões marcadas</p>
            </div>
            <button
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
              type="button"
            >
              Ver tudo
            </button>
          </div>
          <div className="divide-y divide-gray-50">
            {appointments.map((apt, i) => {
              const pt = patients.find((p) => p.id === apt.patientId) ?? patients[0];
              return (
                <motion.div
                  key={apt.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.06 * i }}
                  className="flex items-center gap-4 px-6 py-4 transition hover:bg-gray-50/50"
                >
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${avatarClass(i)}`}>
                    {pt.initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-gray-900">{pt.name}</p>
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 font-mono text-xs text-gray-600">
                        {apt.time}
                      </span>
                      <span className="rounded-full bg-rose-50 px-2 py-0.5 text-xs text-rose-600">
                        {apt.mode.includes("Online") ? "Online" : "Presencial"}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-gray-500">{apt.kind}</p>
                    <p className="mt-1 text-xs text-gray-400">{apt.note}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onOpenPatient(pt.id)}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-gray-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-gray-700"
                  >
                    Iniciar <ArrowRight className="h-3 w-3" />
                  </button>
                </motion.div>
              );
            })}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-5 py-4">
              <h2 className="text-[15px] font-semibold text-gray-900">Atenção clínica</h2>
              <p className="text-xs text-gray-400">Pacientes com risco elevado</p>
            </div>
            <div className="divide-y divide-gray-50 px-2 py-2">
              {patients
                .filter((p) => p.risk >= 40)
                .slice(0, 3)
                .map((p, i) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => onOpenPatient(p.id)}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-gray-50"
                  >
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${avatarClass(i)}`}>
                      {p.initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-900">{p.name}</p>
                      <p className="mt-0.5 truncate text-xs text-gray-500">{p.hypothesis}</p>
                    </div>
                    <div className="text-right">
                      <p className={`font-mono text-sm font-semibold ${p.risk >= 60 ? "text-red-500" : "text-amber-500"}`}>
                        {p.risk}%
                      </p>
                      <p className="text-[10px] text-gray-400">risco</p>
                    </div>
                  </button>
                ))}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-5 py-4">
              <h2 className="text-[15px] font-semibold text-gray-900">Tarefas clínicas</h2>
            </div>
            <div className="space-y-1 p-3">
              {[
                "Revisar escala Y-BOCS de Sarah M.",
                "Checar litemia e TSH de Carlos M.",
                "Preparar ASRS-1 para Rafael N."
              ].map((task, i) => (
                <label key={task} className="flex cursor-pointer items-start gap-3 rounded-lg p-2.5 hover:bg-gray-50">
                  <input
                    type="checkbox"
                    defaultChecked={i === 0}
                    className="mt-0.5 h-4 w-4 rounded border-gray-300 accent-rose-500"
                  />
                  <span className="text-sm leading-5 text-gray-700">{task}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-rose-100 bg-white p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50">
                <MessageCircle className="h-5 w-5 text-rose-500" />
              </div>
              <div>
                <h2 className="text-[15px] font-semibold text-gray-900">WhatsApp & Retenção</h2>
                <p className="mt-1 text-xs leading-5 text-gray-500">
                  Módulo premium operacional para lembretes, confirmações e check-ins. Não substitui consulta.
                </p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {[
                ["4", "check-ins"],
                ["1", "cancelamento"],
                ["62%", "risco"]
              ].map(([value, label]) => (
                <div key={label} className="rounded-xl bg-gray-50 px-3 py-3 text-center">
                  <p className="font-mono text-lg font-bold text-gray-900">{value}</p>
                  <p className="text-[10px] uppercase tracking-wider text-gray-400">{label}</p>
                </div>
              ))}
            </div>
            <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-800">
              Sinal operacional: ansiedade alta em check-in e cancelamento recente sugerem follow-up humano.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiCard({
  color,
  delta,
  icon: Icon,
  label,
  spark,
  value
}: {
  color: string;
  delta: string;
  icon: LucideIcon;
  label: string;
  spark: number[];
  value: string;
}) {
  const colorMap: Record<string, { bg: string; text: string; icon: string; spark: string }> = {
    rose: { bg: "bg-rose-50", text: "text-rose-600", icon: "text-rose-500", spark: "#f43f5e" },
    violet: { bg: "bg-violet-50", text: "text-violet-600", icon: "text-violet-500", spark: "#8b5cf6" },
    sky: { bg: "bg-sky-50", text: "text-sky-600", icon: "text-sky-500", spark: "#0ea5e9" },
    red: { bg: "bg-red-50", text: "text-red-600", icon: "text-red-500", spark: "#ef4444" },
    emerald: { bg: "bg-emerald-50", text: "text-emerald-600", icon: "text-emerald-500", spark: "#10b981" }
  };
  const c = colorMap[color] ?? colorMap.rose;
  const max = Math.max(...spark, 1);
  const pts = spark
    .map((v, i) => `${(i / (spark.length - 1)) * 100},${100 - (v / max) * 100}`)
    .join(" ");

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${c.bg}`}>
          <Icon className={`h-4 w-4 ${c.icon}`} />
        </div>
        <svg viewBox="0 0 100 100" className="h-10 w-16" preserveAspectRatio="none">
          <polyline
            fill="none"
            points={pts}
            stroke={c.spark}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.7"
          />
        </svg>
      </div>
      <p className="mt-3 text-3xl font-bold tracking-tight text-gray-900">{value}</p>
      <p className="text-sm font-medium text-gray-600">{label}</p>
      <p className={`mt-1 text-xs ${c.text}`}>{delta}</p>
    </div>
  );
}

function PatientsPage({
  onAddPatient,
  onOpenPatient,
  patients
}: {
  onAddPatient: () => void;
  onOpenPatient: (id: string) => void;
  patients: Patient[];
}) {
  const [filter, setFilter] = useState<"all" | Status>("all");
  const filtered = filter === "all" ? patients : patients.filter((p) => p.status === filter);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Pacientes</h1>
          <p className="mt-1 text-sm text-gray-500">Selecione um perfil para abrir o workspace clínico.</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => exportPatients(patients)}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <Download className="h-4 w-4" /> Exportar CSV
          </button>
          <button
            type="button"
            onClick={onAddPatient}
            className="inline-flex items-center gap-2 rounded-lg bg-rose-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-rose-600"
          >
            <Plus className="h-4 w-4" /> Adicionar paciente
          </button>
        </div>
      </div>

      <div className="flex gap-2">
        {(
          [
            ["all", "Todos"],
            ["active", "Ativos"],
            ["inactive", "Inativos"]
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setFilter(id as "all" | Status)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              filter === id ? "bg-gray-900 text-white" : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            {label}
          </button>
        ))}
        <button
          className="ml-auto inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-600"
          type="button"
        >
          <Filter className="h-4 w-4" /> Filtros
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Paciente</th>
              <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400 md:table-cell">
                Hipótese
              </th>
              <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400 lg:table-cell">
                Protocolo
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Progresso</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Risco</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Sessões</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map((p, i) => (
              <motion.tr
                key={p.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="transition hover:bg-gray-50/50"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${avatarClass(i)}`}>
                      {p.initials}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{p.name}</p>
                      <p className="text-xs text-gray-500">{p.lastSeen}</p>
                    </div>
                  </div>
                </td>
                <td className="hidden px-4 py-4 md:table-cell">
                  <p className="text-sm text-gray-700">{p.hypothesis}</p>
                </td>
                <td className="hidden px-4 py-4 lg:table-cell">
                  <p className="text-xs text-gray-500">{p.protocol}</p>
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-20 overflow-hidden rounded-full bg-gray-100">
                      <motion.div
                        className="h-full rounded-full bg-rose-400"
                        initial={{ width: 0 }}
                        animate={{ width: `${p.progress}%` }}
                        transition={{ duration: 0.8 }}
                      />
                    </div>
                    <span className="font-mono text-xs text-gray-600">{p.progress}%</span>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                      p.risk >= 60
                        ? "bg-red-50 text-red-600"
                        : p.risk >= 40
                          ? "bg-amber-50 text-amber-600"
                          : "bg-emerald-50 text-emerald-600"
                    }`}
                  >
                    {p.risk}%
                  </span>
                </td>
                <td className="px-4 py-4">
                  <span className="font-mono text-sm text-gray-600">{p.sessions}</span>
                </td>
                <td className="px-4 py-4">
                  <button
                    type="button"
                    onClick={() => onOpenPatient(p.id)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-gray-700"
                  >
                    Abrir <ArrowRight className="h-3 w-3" />
                  </button>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SchedulePage({
  appointments,
  onOpenPatient,
  onSchedule,
  patients
}: {
  appointments: Appointment[];
  onOpenPatient: (id: string) => void;
  onSchedule: () => void;
  patients: Patient[];
}) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Agenda clínica</h1>
          <p className="mt-1 text-sm text-gray-500">Agendar um paciente novo cria automaticamente um perfil básico.</p>
        </div>
        <button
          type="button"
          onClick={onSchedule}
          className="inline-flex items-center gap-2 rounded-lg bg-rose-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-rose-600"
        >
          <CalendarPlus className="h-4 w-4" /> Agendar paciente
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 bg-gray-50/50 px-6 py-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">Segunda, 20 de abril — Hoje</p>
        </div>
        <div className="divide-y divide-gray-50">
          {appointments.map((apt, i) => {
            const pt = patients.find((p) => p.id === apt.patientId) ?? patients[0];
            return (
              <motion.div
                key={apt.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="grid grid-cols-[80px_minmax(0,1fr)_auto] items-center gap-5 px-6 py-5 transition hover:bg-gray-50/50"
              >
                <p className="font-mono text-xl font-bold text-gray-900">{apt.time}</p>
                <div className="flex items-center gap-4">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${avatarClass(i)}`}>
                    {pt.initials}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{pt.name}</p>
                    <p className="text-sm text-gray-500">{apt.kind} · {apt.mode}</p>
                    <p className="mt-1 text-xs text-rose-500">{apt.note}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onOpenPatient(pt.id)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-700"
                >
                  Abrir <ArrowRight className="h-4 w-4" />
                </button>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function DSMPage() {
  const [query, setQuery] = useState("");
  const selected =
    dsmConditions.find((c) =>
      `${c.title} ${c.category} ${c.code}`.toLowerCase().includes(query.toLowerCase())
    ) ?? dsmConditions[0];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">DSM / Psicopatologia</h1>
        <p className="mt-1 text-sm text-gray-500">Base orientativa para formulação clínica. Não substitui avaliação profissional.</p>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar TOC, ansiedade, borderline, TDAH..."
          className="h-12 w-full rounded-xl border border-gray-200 bg-white pl-12 pr-4 text-sm text-gray-900 shadow-sm outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.8fr)_minmax(280px,1fr)]">
        <div className="rounded-2xl border border-gray-200 bg-white p-7 shadow-sm">
          <div className="mb-5 flex flex-wrap gap-2">
            <span className="rounded-full bg-violet-100 px-3 py-1 text-sm font-medium text-violet-700">{selected.category}</span>
            <span className="rounded-full bg-gray-100 px-3 py-1 font-mono text-sm text-gray-600">{selected.code}</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">{selected.title}</h2>
          <div className="mt-5 rounded-xl border border-sky-200 bg-sky-50 p-5">
            <div className="mb-2 flex items-center gap-2">
              <Activity className="h-4 w-4 text-sky-500" />
              <p className="text-sm font-semibold text-gray-900">Sintomas centrais</p>
            </div>
            <p className="text-sm leading-6 text-gray-700">{selected.symptoms}</p>
          </div>
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-5">
            <div className="mb-2 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <p className="text-sm font-semibold text-gray-900">Observação clínica</p>
            </div>
            <p className="text-sm leading-6 text-gray-700">{selected.note}</p>
          </div>
        </div>
        <aside className="space-y-4">
          {[
            { title: "Escalas sugeridas", items: selected.scales, color: "bg-rose-500" },
            { title: "Diferenciais frequentes", items: selected.differentials, color: "bg-violet-500" },
            { title: "Fontes", items: ["DSM-5-TR", "APA Guidelines", "NICE Guidelines"], color: "bg-gray-800" }
          ].map(({ title, items, color }) => (
            <div key={title} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="mb-3 flex items-center gap-2">
                <div className={`h-2.5 w-2.5 rounded-full ${color}`} />
                <h3 className="font-semibold text-gray-900">{title}</h3>
              </div>
              <div className="space-y-2">
                {items.map((item) => (
                  <div key={item} className="rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-700">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </aside>
      </div>
    </div>
  );
}

function DocumentsPage() {
  const [owner, setOwner] = useState<"Todos" | "Psicólogo" | "Psiquiatra">("Todos");
  const filtered = owner === "Todos" ? documentTemplates : documentTemplates.filter((t) => t.owner === owner);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Documentos</h1>
        <p className="mt-1 text-sm text-gray-500">Modelos clínicos, encaminhamentos e judicialização.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        {[
          { color: "bg-sky-500", title: "Laudo judicial", text: "Medicação fora do SUS" },
          { color: "bg-violet-500", title: "Encaminhamento", text: "Psicologia e psiquiatria" },
          { color: "bg-amber-500", title: "Laudo psicológico", text: "Estrutura CFP" },
          { color: "bg-emerald-500", title: "Atestado", text: "Comparecimento ou afastamento" }
        ].map(({ color, title, text }) => (
          <div key={title} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-rose-200 hover:shadow-md">
            <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl ${color}`}>
              <FileText className="h-4 w-4 text-white" />
            </div>
            <p className="font-semibold text-gray-900">{title}</p>
            <p className="mt-1 text-xs text-gray-500">{text}</p>
            <button className="mt-4 w-full rounded-lg bg-gray-100 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-200" type="button">
              Iniciar
            </button>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        {(["Todos", "Psicólogo", "Psiquiatra"] as const).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setOwner(item)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              owner === item ? "bg-gray-900 text-white" : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-6 py-4">
          <h2 className="font-semibold text-gray-900">Biblioteca de modelos</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {filtered.map((t) => (
            <div key={t.title} className="flex items-center gap-4 px-6 py-4 transition hover:bg-gray-50">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100">
                <FileText className="h-5 w-5 text-gray-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-gray-900">{t.title}</p>
                <p className="mt-0.5 text-xs text-gray-500">{t.kind} · {t.owner}</p>
                <p className="mt-0.5 text-xs text-gray-400">{t.purpose}</p>
              </div>
              <button className="inline-flex items-center gap-1.5 rounded-lg bg-gray-900 px-3 py-2 text-xs font-semibold text-white hover:bg-gray-700" type="button">
                <Download className="h-3.5 w-3.5" /> Usar
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SubscriptionPage() {
  const plans = [
    {
      active: clinician.plan === "standard",
      title: "Padrão",
      price: "R$ 97",
      period: "/mês",
      items: ["Uma abordagem clínica cadastrada", "Agenda e prontuários", "DSM e documentos", "Exportação CSV de pacientes"]
    },
    {
      active: clinician.plan === "premium",
      title: "Premium",
      price: "R$ 197",
      period: "/mês",
      items: ["Todas as abordagens terapêuticas", "Farmacologia e exames clínicos", "Insights avançados por lente clínica", "Base científica ampliada"]
    },
    {
      active: false,
      title: "Clínicas",
      price: "Solicite",
      period: "orçamento",
      items: ["Multiusuário e perfis por função", "Pacientes por equipe ou unidade", "Auditoria e governança clínica", "Configuração sob demanda"]
    }
  ];
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Assinatura Adler</h1>
        <p className="mt-1 text-sm text-gray-500">Plano padrão mantém o clínico na abordagem cadastrada. Premium libera todas as lentes.</p>
      </div>
      <div className="grid gap-5 xl:grid-cols-3">
        {plans.map((plan) => (
          <div
            key={plan.title}
            className={`rounded-2xl border-2 bg-white p-7 shadow-sm transition ${
              plan.active ? "border-rose-300 shadow-rose-100" : "border-gray-200"
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-lg font-bold text-gray-900">{plan.title}</p>
                <p className="text-xs text-gray-400">{plan.active ? "Plano atual" : "Disponível"}</p>
              </div>
              {plan.active ? <CheckCircle2 className="h-5 w-5 text-rose-500" /> : <Lock className="h-5 w-5 text-gray-300" />}
            </div>
            <div className="mt-6 flex items-end gap-1">
              <p className="text-4xl font-bold tracking-tight text-gray-900">{plan.price}</p>
              {plan.period ? <p className="pb-1 text-sm text-gray-400">{plan.period}</p> : null}
            </div>
            <div className="mt-5 space-y-2.5">
              {plan.items.map((item) => (
                <p key={item} className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                  {item}
                </p>
              ))}
            </div>
            <button
              className={`mt-6 w-full rounded-xl py-2.5 text-sm font-semibold transition ${
                plan.active ? "bg-rose-500 text-white hover:bg-rose-600" : "border border-gray-200 text-gray-700 hover:bg-gray-50"
              }`}
              type="button"
            >
              {plan.active ? "Plano atual" : plan.title === "Clínicas" ? "Solicitar orçamento" : "Fazer upgrade"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Configurações</h1>
        <p className="mt-1 text-sm text-gray-500">Preferências da conta, abordagem padrão e segurança.</p>
      </div>
      <div className="rounded-2xl border border-gray-200 bg-white p-7 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">Abordagem cadastrada</p>
        <p className="mt-2 text-2xl font-bold text-gray-900">{approach.label}</p>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-600">
          No plano padrão, o Adler mostra apenas a lente clínica selecionada no cadastro. No Premium, todas as lentes e módulos avançados ficam liberados para análise complementar.
        </p>
      </div>
    </div>
  );
}

function PatientWorkspace({
  activeTab,
  isRecording,
  onBack,
  patient,
  patientIndex,
  session,
  setActiveTab,
  setIsRecording,
  setSession,
  tabs
}: {
  activeTab: WorkspaceTab;
  isRecording: boolean;
  onBack: () => void;
  patient: Patient;
  patientIndex: number;
  session: number;
  setActiveTab: (t: WorkspaceTab) => void;
  setIsRecording: (v: boolean) => void;
  setSession: (v: number) => void;
  tabs: Array<{ icon: LucideIcon; id: WorkspaceTab; label: string }>;
}) {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#f8f8fb]">
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-6 shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700" type="button">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className={`flex h-9 w-9 items-center justify-center rounded-xl text-sm font-bold ${avatarClass(patientIndex)}`}>
            {patient.initials}
          </div>
          <div>
            <p className="font-semibold text-gray-900">{patient.name}</p>
            <p className="text-xs text-gray-500">Sessão #{session} · {approach.label}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              patient.risk >= 60
                ? "bg-red-50 text-red-600"
                : patient.risk >= 40
                  ? "bg-amber-50 text-amber-600"
                  : "bg-emerald-50 text-emerald-600"
            }`}
          >
            Risco {patient.risk}%
          </div>
          {clinician.plan === "premium" ? (
            <div className="rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-600">Premium</div>
          ) : null}
          <button
            type="button"
            onClick={() => setIsRecording(!isRecording)}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm transition ${
              isRecording ? "bg-red-500 hover:bg-red-600" : "bg-rose-500 hover:bg-rose-600"
            }`}
          >
            {isRecording ? (
              <>
                <Square className="h-4 w-4" /> Gravando
              </>
            ) : (
              <>
                <Mic className="h-4 w-4" /> Gravar sessão
              </>
            )}
          </button>
        </div>
      </header>

      <nav className="border-b border-gray-200 bg-white px-6">
        <div className="flex gap-0 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`relative inline-flex h-12 items-center gap-2 border-b-2 px-4 text-sm font-medium transition ${
                  active ? "border-rose-500 text-rose-600" : "border-transparent text-gray-500 hover:text-gray-800"
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </nav>

      <div className="flex min-h-0 flex-1">
        <main className="figma-scroll min-h-0 flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
            >
              {activeTab === "session" ? (
                <SessionTab
                  isRecording={isRecording}
                  patient={patient}
                  session={session}
                  setIsRecording={setIsRecording}
                  setSession={setSession}
                />
              ) : null}
              {activeTab === "map" ? <CognitiveMapTab patient={patient} session={session} /> : null}
              {activeTab === "timeline" ? <ClinicalEvolutionTab patient={patient} session={session} setSession={setSession} /> : null}
              {activeTab === "tests" ? <PsychTestsTab patient={patient} /> : null}
              {activeTab === "medications" ? <PremiumMedicationsTab /> : null}
              {activeTab === "exams" ? <PremiumExamsTab /> : null}
            </motion.div>
          </AnimatePresence>
        </main>
        <SherlockSidebar patient={patient} session={session} />
      </div>
    </div>
  );
}

function SessionTab({
  isRecording,
  patient,
  session,
  setIsRecording,
  setSession
}: {
  isRecording: boolean;
  patient: Patient;
  session: number;
  setIsRecording: (v: boolean) => void;
  setSession: (v: number) => void;
}) {
  const seedTranscript = useMemo(
    () =>
      buildSeedTranscript({
        focus: patient.focus,
        hypothesis: patient.hypothesis,
        id: patient.id,
        name: patient.name
      }),
    [patient.focus, patient.hypothesis, patient.id, patient.name]
  );
  const [transcriptLines, setTranscriptLines] = useState<SessionTranscriptLine[]>(seedTranscript);
  const [manualNote, setManualNote] = useState("");
  const [draft, setDraft] = useState<StructuredSessionDraft>(() =>
    createInitialStructuredSessionDraft({
      sessionNumber: session,
      transcriptLines: seedTranscript
    })
  );
  const [draftEdited, setDraftEdited] = useState(false);
  const [analysisState, setAnalysisState] = useState<"idle" | "loading" | "saved" | "error">("idle");
  const [analysisMessage, setAnalysisMessage] = useState("");

  const derivedDraft = useMemo(
    () => deriveStructuredDraftFromContent({ manualNote, transcriptLines }),
    [manualNote, transcriptLines]
  );

  useEffect(() => {
    setTranscriptLines(seedTranscript);
    setManualNote("");
    setDraft(
      createInitialStructuredSessionDraft({
        sessionNumber: session,
        transcriptLines: seedTranscript
      })
    );
    setDraftEdited(false);
    setAnalysisState("idle");
    setAnalysisMessage("");
  }, [patient.id, seedTranscript]);

  useEffect(() => {
    if (!draftEdited) {
      setDraft((current) => ({ ...current, ...derivedDraft }));
    }
  }, [derivedDraft, draftEdited]);

  useEffect(() => {
    setDraft((current) =>
      current.sessionNumber === session ? current : { ...current, sessionNumber: session }
    );
  }, [session]);

  const structuredCounts = {
    sintomas: parseStructuredList(draft.sintomasText).length,
    emocoes: parseStructuredList(draft.emocoesText).length,
    eventos: parseStructuredList(draft.eventosText).length,
    comportamentos: parseStructuredList(draft.comportamentosText).length,
    medicacao: parseStructuredList(draft.medicacaoText).length
  };

  const transcriptLength = transcriptLines.reduce((total, line) => total + line.text.length, 0);

  function updateDraftField<K extends keyof StructuredSessionDraft>(
    key: K,
    value: StructuredSessionDraft[K]
  ) {
    setDraftEdited(true);
    setAnalysisState("idle");
    setAnalysisMessage("");
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function syncDraftWithTranscript() {
    setDraft((current) => ({ ...current, ...derivedDraft }));
    setDraftEdited(false);
    setAnalysisState("idle");
    setAnalysisMessage("");
  }

  const handleStructuredAnalysis = async () => {
    const payload = buildClinicalSessionPayload(patient.id, draft);
    const totalStructuredSignals =
      payload.sintomas.length +
      payload.emocoes.length +
      payload.eventos.length +
      payload.comportamentos.length +
      payload.medicacao.length;

    if (!totalStructuredSignals && !payload.observacoes) {
      setAnalysisState("error");
      setAnalysisMessage("Grave a sessao ou registre notas antes de rodar a analise.");
      return;
    }

    setAnalysisState("loading");
    setAnalysisMessage("");
    const previewRecord = {
      payload,
      saved_at: new Date().toISOString(),
      source: "api" as const
    };

    try {
      await analyzeAdlerClinicalSession(payload);
      savePreviewAnalysis(previewRecord);
      setAnalysisState("saved");
      setAnalysisMessage(
        `Analise salva na sessao ${payload.session_number}. Linha do tempo e mapa cognitivo ja podem refletir esta captura.`
      );
    } catch (caught) {
      const isHostedPreview =
        typeof window !== "undefined" &&
        !["127.0.0.1", "localhost"].includes(window.location.hostname);

      if (isHostedPreview) {
        savePreviewAnalysis({ ...previewRecord, source: "browser" });
        setAnalysisState("saved");
        setAnalysisMessage(
          "Captura e estrutura ficaram salvas neste navegador. Linha do tempo e mapa cognitivo desta demo publicada usam essa sessao imediatamente."
        );
        return;
      }

      setAnalysisState("error");
      setAnalysisMessage(
        caught instanceof Error
          ? caught.message
          : "Nao foi possivel gerar a analise estruturada."
      );
    }
  };

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.95fr)]">
      <SessionRecorderPanel
        accent={approach.accent}
        accentBorder="rgba(244,63,94,0.18)"
        accentSurface="rgba(244,63,94,0.1)"
        fallbackTranscript={seedTranscript}
        isRecording={isRecording}
        manualNote={manualNote}
        onCaptureStart={() => {
          setTranscriptLines([]);
          setAnalysisState("idle");
          setAnalysisMessage("");
          setDraftEdited(false);
        }}
        onManualNoteChange={(value) => {
          setManualNote(value);
          setAnalysisState("idle");
          setAnalysisMessage("");
        }}
        setTranscriptLines={setTranscriptLines}
        toggleRecording={() => setIsRecording(!isRecording)}
        transcriptLines={transcriptLines}
      />

      <div className="space-y-5">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-rose-500">
                Analise estruturada
              </p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-gray-900">
                Sessao {session} de {patient.name}
              </h2>
              <p className="mt-2 text-sm leading-6 text-gray-500">
                O Adler usa a transcricao e as anotacoes como rascunho, mas voce
                ainda revisa tudo antes de salvar.
              </p>
            </div>
            <button
              type="button"
              onClick={syncDraftWithTranscript}
              className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 transition hover:border-rose-200 hover:text-rose-600"
            >
              Atualizar pela transcricao
            </button>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">
                Sessao
              </span>
              <input
                type="number"
                min={1}
                value={draft.sessionNumber}
                onChange={(event) => {
                  const nextValue = Math.max(1, Number(event.target.value) || 1);
                  setSession(nextValue);
                  updateDraftField("sessionNumber", nextValue);
                }}
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-rose-300"
              />
            </label>

            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">
                Quando aconteceu
              </span>
              <input
                type="datetime-local"
                value={draft.occurredAt}
                onChange={(event) => updateDraftField("occurredAt", event.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-rose-300"
              />
            </label>

            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">
                Abordagem
              </span>
              <select
                value={draft.abordagemClinica}
                onChange={(event) =>
                  updateDraftField(
                    "abordagemClinica",
                    event.target.value as StructuredSessionDraft["abordagemClinica"]
                  )
                }
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-rose-300"
              >
                <option value="cbt">TCC / esquema</option>
                <option value="psychoanalysis">Psicanalise</option>
                <option value="psychiatry">Psiquiatria</option>
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">
                Recorte temporal
              </span>
              <input
                type="text"
                value={draft.tempo}
                onChange={(event) => updateDraftField("tempo", event.target.value)}
                placeholder="sessao atual"
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-rose-300"
              />
            </label>
          </div>

          <div className="mt-5 space-y-4">
            <StructuredInputField
              label="Sintomas"
              placeholder={"ansiedade antecipatoria\ninsonia\nchecagem recorrente"}
              value={draft.sintomasText}
              onChange={(value) => updateDraftField("sintomasText", value)}
            />
            <StructuredInputField
              label="Emocoes"
              placeholder={"medo\nculpa\nfrustracao"}
              value={draft.emocoesText}
              onChange={(value) => updateDraftField("emocoesText", value)}
            />
            <StructuredInputField
              label="Eventos ou gatilhos"
              placeholder={"depois do trabalho\na noite antes de dormir"}
              value={draft.eventosText}
              onChange={(value) => updateDraftField("eventosText", value)}
            />
            <StructuredInputField
              label="Comportamentos"
              placeholder={"checagem\nevitacao\nisolamento"}
              value={draft.comportamentosText}
              onChange={(value) => updateDraftField("comportamentosText", value)}
            />
            <StructuredInputField
              label="Medicacao"
              placeholder="sertralina 50 mg"
              value={draft.medicacaoText}
              onChange={(value) => updateDraftField("medicacaoText", value)}
            />
            <StructuredInputField
              label="Observacoes finais"
              placeholder="Resumo livre para acompanhar a analise estruturada."
              rows={5}
              value={draft.observacoes}
              onChange={(value) => updateDraftField("observacoes", value)}
            />
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleStructuredAnalysis}
              disabled={analysisState === "loading"}
              className="inline-flex items-center gap-2 rounded-xl bg-rose-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <BrainCircuit className="h-4 w-4" />
              {analysisState === "loading"
                ? "Salvando analise..."
                : analysisState === "saved"
                ? "Analise salva"
                : "Rodar analise real"}
            </button>

            <button
              type="button"
              onClick={() => {
                setTranscriptLines(seedTranscript);
                setManualNote("");
                setDraft(
                  createInitialStructuredSessionDraft({
                    sessionNumber: session,
                    transcriptLines: seedTranscript
                  })
                );
                setDraftEdited(false);
                setAnalysisState("idle");
                setAnalysisMessage("");
              }}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:border-gray-300 hover:bg-gray-50"
            >
              Resetar rascunho
            </button>
          </div>

          {analysisMessage ? (
            <p
              className={`mt-4 rounded-xl border px-4 py-3 text-sm leading-6 ${
                analysisState === "error"
                  ? "border-red-200 bg-red-50 text-red-700"
                  : "border-emerald-200 bg-emerald-50 text-emerald-700"
              }`}
            >
              {analysisMessage}
            </p>
          ) : null}
        </div>

        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-widest text-rose-600">
            Pronto para validar
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {[
              [`${transcriptLines.length}`, "trechos capturados"],
              [`${transcriptLength}`, "caracteres da transcricao"],
              [
                `${structuredCounts.sintomas + structuredCounts.emocoes + structuredCounts.eventos + structuredCounts.comportamentos + structuredCounts.medicacao}`,
                "sinais estruturados"
              ],
              [draftEdited ? "manual" : "auto", "origem atual"]
            ].map(([value, label]) => (
              <div key={String(label)} className="rounded-xl border border-white/70 bg-white/80 p-4">
                <p className="font-mono text-2xl font-bold text-gray-900">{value}</p>
                <p className="mt-1 text-xs uppercase tracking-widest text-rose-600">{label}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm leading-6 text-gray-700">
            Quando esta analise salvar, o backend recalcula evolucao e risco de
            abandono para este paciente imediatamente.
          </p>
          <ProgressBarWs color="#f43f5e" label="Risco atual do caso" value={patient.risk} />
        </div>
      </div>
    </div>
  );
}

function StructuredInputField({
  label,
  onChange,
  placeholder,
  rows = 3,
  value
}: {
  label: string;
  onChange: (value: string) => void;
  placeholder: string;
  rows?: number;
  value: string;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">
        {label}
      </span>
      <textarea
        value={value}
        rows={rows}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm leading-6 text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-rose-300"
      />
    </label>
  );
}

function CognitiveMapTab({ patient, session }: { patient: Patient; session: number }) {
  const [focused, setFocused] = useState<string | null>(null);
  const previewGraph = useMemo(
    () => buildPreviewMapGraph(loadPreviewAnalyses(patient.id), patient.focus),
    [patient.focus, patient.id]
  );
  const nodeLayout = [
    { x: 20, y: 32 },
    { x: 46, y: 24 },
    { x: 69, y: 44 },
    { x: 39, y: 67 },
    { x: 76, y: 72 }
  ];
  const baseNodes = [
    { id: "insomnia", label: "Insônia", critical: false },
    { id: "rituals", label: "Rituais compulsivos", critical: false },
    { id: "schema", label: "Privação emocional", critical: false },
    { id: "uncertainty", label: "Intolerância à incerteza", critical: false },
    { id: "relapse", label: "Risco de recaída", critical: true }
  ];
  const nodes = (previewGraph?.nodes ?? baseNodes).map((node, index) => ({
    ...node,
    ...nodeLayout[index % nodeLayout.length]
  }));
  const edges = (previewGraph?.edges ?? [
    ["insomnia", "rituals", 5],
    ["rituals", "uncertainty", 4],
    ["uncertainty", "schema", 3],
    ["schema", "relapse", 2],
    ["insomnia", "relapse", 2]
  ]) as Array<[string, string, number]>;
  const connected = (id: string) =>
    !focused || focused === id || edges.some(([a, b]) => (a === focused && b === id) || (b === focused && a === id));

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-7 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-rose-500">Mapa cognitivo longitudinal</p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-gray-900">Padrões de {session} sessões</h2>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            {previewGraph?.summary ?? `O grafo sintetiza recorrências clínicas do histórico de ${patient.name}.`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {previewGraph ? (
            <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-600">
              Sessao capturada nesta demo
            </span>
          ) : null}
          {focused ? (
            <button
              onClick={() => setFocused(null)}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
              type="button"
            >
              Limpar foco
            </button>
          ) : null}
        </div>
      </div>
      <div className="relative mt-6 h-[460px] overflow-hidden rounded-2xl border border-gray-100 bg-gradient-to-br from-gray-50 to-rose-50/30">
        <svg className="h-full w-full" preserveAspectRatio="none" viewBox="0 0 100 100">
          {edges.map(([from, to, weight]) => {
            const s = nodes.find((n) => n.id === from)!;
            const e = nodes.find((n) => n.id === to)!;
            const active = !focused || (connected(from) && connected(to));
            return (
              <path
                key={`${from}-${to}`}
                d={`M ${s.x} ${s.y} C ${(s.x + e.x) / 2} ${s.y - 18}, ${(s.x + e.x) / 2} ${e.y + 18}, ${e.x} ${e.y}`}
                fill="none"
                opacity={active ? 0.55 : 0.06}
                stroke={e.critical ? "#ef4444" : "#f43f5e"}
                strokeLinecap="round"
                strokeWidth={weight / 2.5}
              />
            );
          })}
        </svg>
        {nodes.map((node) => (
          <button
            key={node.id}
            onClick={() => setFocused(node.id)}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${node.x}%`, opacity: connected(node.id) ? 1 : 0.1, top: `${node.y}%` }}
            type="button"
          >
            <motion.span
              animate={{ scale: focused === node.id ? [1, 1.08, 1] : [1, 1.03, 1] }}
              transition={{ duration: focused === node.id ? 1.2 : 2.8, repeat: Infinity }}
              className={`block rounded-full border px-4 py-2.5 text-sm font-semibold shadow-sm ${
                node.critical ? "border-red-200 bg-red-50 text-red-700" : "border-rose-200 bg-white text-gray-900"
              }`}
            >
              {node.label}
            </motion.span>
          </button>
        ))}
      </div>
    </div>
  );
}

function ClinicalEvolutionTab({
  patient,
  session,
  setSession
}: {
  patient: Patient;
  session: number;
  setSession: (v: number) => void;
}) {
  const [evolution, setEvolution] = useState<AdlerEvolutionDecisionResponse | null>(null);
  const [abandonmentRisk, setAbandonmentRisk] = useState<AdlerAbandonmentRiskResponse | null>(null);
  const [whatsappDashboard, setWhatsappDashboard] = useState<AdlerWhatsAppDashboardResponse | null>(null);
  const [intelligenceStatus, setIntelligenceStatus] = useState<"demo" | "loading" | "online">("loading");
  const [checkinState, setCheckinState] = useState<"idle" | "saving" | "saved" | "demo">("idle");
  const [previewCheckins, setPreviewCheckins] = useState(() => loadPreviewCheckins(patient.id));
  const previewAnalyses = useMemo(() => loadPreviewAnalyses(patient.id), [patient.id]);
  const previewEvolution = useMemo(
    () => buildPreviewEvolution(previewAnalyses),
    [previewAnalyses]
  );
  const previewRisk = useMemo(
    () => buildPreviewRisk(previewAnalyses, patient.risk),
    [patient.risk, previewAnalyses]
  );
  const previewTimelinePoints = useMemo(
    () => buildPreviewTimelinePoints(previewAnalyses),
    [previewAnalyses]
  );

  const defaultPoints = Array.from({ length: 18 }, (_, i) => ({
    anxiety: 82 - i * 3.2 + (i % 3) * 2,
    mood: 44 + i * 2.4 + (i % 4) * 2,
    adherence: 84 + (i % 2) * 3,
    session: i + 1,
    x: 5 + i * 5.2
  }));
  const points = previewTimelinePoints.length ? previewTimelinePoints : defaultPoints;
  const line = (key: "adherence" | "anxiety" | "mood") => points.map((p) => `${p.x},${100 - p[key]}`).join(" ");

  useEffect(() => {
    setPreviewCheckins(loadPreviewCheckins(patient.id));
  }, [patient.id]);

  useEffect(() => {
    let cancelled = false;

    async function loadLongitudinalSignals() {
      setIntelligenceStatus("loading");
      const [evolutionResult, riskResult, whatsappResult] = await Promise.allSettled([
        fetchAdlerEvolutionDecision(patient.id),
        fetchAdlerAbandonmentRisk(patient.id),
        fetchAdlerWhatsAppDashboard(patient.id)
      ]);

      if (cancelled) return;

      if (evolutionResult.status === "fulfilled") setEvolution(evolutionResult.value);
      if (riskResult.status === "fulfilled") setAbandonmentRisk(riskResult.value);
      if (whatsappResult.status === "fulfilled") setWhatsappDashboard(whatsappResult.value);

      const hasLiveData =
        evolutionResult.status === "fulfilled" ||
        riskResult.status === "fulfilled" ||
        whatsappResult.status === "fulfilled";
      setIntelligenceStatus(hasLiveData ? "online" : "demo");
    }

    loadLongitudinalSignals();
    return () => {
      cancelled = true;
    };
  }, [patient.id]);

  const fallbackEvolution: AdlerEvolutionDecisionResponse = {
    patient_id: patient.id,
    status_geral: session <= 6 ? "atencao" : "melhorando",
    principais_mudancas: [
      `${session} sessoes sintetizadas em padroes longitudinais.`,
      "Rituais e ansiedade mostram reducao gradual quando adesao e sono melhoram."
    ],
    padroes_persistentes: ["intolerancia a incerteza", "hiper-responsabilidade", "checagem noturna"],
    novos_riscos: session <= 6 ? ["piora de sono", "risco de evasao se nao houver follow-up"] : [],
    tendencias: [
      "Ansiedade cai de forma consistente nas ultimas sessoes.",
      "Aderencia medicamentosa permanece estavel no topo da curva."
    ],
    sessions_compared: Array.from({ length: session }, (_, index) => index + 1),
    snapshot_id: null
  };

  const fallbackRisk: AdlerAbandonmentRiskResponse = {
    patient_id: patient.id,
    risco_abandono: session <= 6 ? "alto" : patient.risk >= 60 ? "moderado" : "baixo",
    score: session <= 6 ? 72 : patient.risk,
    fatores_identificados:
      session <= 6
        ? ["recorte historico com maior sofrimento", "baixa resposta percebida", "necessidade de contato ativo"]
        : ["check-ins recentes sem sinal critico", "boa continuidade de sessoes"],
    sugestoes_acao:
      session <= 6
        ? ["antecipar retorno", "reforcar vinculo", "revisar plano terapeutico"]
        : ["manter check-in leve com consentimento"],
    risk_score_id: null
  };

  const evolutionView = evolution ?? previewEvolution ?? fallbackEvolution;
  const riskView = abandonmentRisk ?? previewRisk ?? fallbackRisk;
  const whatsappStats = {
    checkins:
      whatsappDashboard?.checkins.length ??
      (previewCheckins.length > 0 ? previewCheckins.length : 4),
    confirmations: whatsappDashboard?.confirmations.length ?? 3,
    flags: whatsappDashboard?.engagement_flags.length ?? (riskView.risco_abandono === "alto" ? 2 : 1)
  };
  const riskColor =
    riskView.risco_abandono === "alto"
      ? "border-red-200 bg-red-50 text-red-700"
      : riskView.risco_abandono === "moderado"
      ? "border-amber-200 bg-amber-50 text-amber-700"
      : "border-emerald-200 bg-emerald-50 text-emerald-700";
  const statusLabel =
    intelligenceStatus === "online"
      ? "API conectada"
      : previewAnalyses.length > 0 || previewCheckins.length > 0
        ? "demo com dados salvos"
        : intelligenceStatus === "loading"
          ? "carregando"
          : "modo demo";

  const handleDemoCheckin = async () => {
    setCheckinState("saving");
    const previewCheckinRecord = {
      patient_id: patient.id,
      mood: 4,
      anxiety: 8,
      sleep: 5,
      adherence: 5,
      notes: "Check-in operacional demo: ansiedade elevada antes da proxima sessao.",
      saved_at: new Date().toISOString(),
      source: "api" as const
    };
    try {
      await createAdlerWhatsAppCheckin(previewCheckinRecord);
      savePreviewCheckin(previewCheckinRecord);
      const [riskResult, whatsappResult] = await Promise.allSettled([
        fetchAdlerAbandonmentRisk(patient.id),
        fetchAdlerWhatsAppDashboard(patient.id)
      ]);
      if (riskResult.status === "fulfilled") setAbandonmentRisk(riskResult.value);
      if (whatsappResult.status === "fulfilled") setWhatsappDashboard(whatsappResult.value);
      setPreviewCheckins(loadPreviewCheckins(patient.id));
      setIntelligenceStatus("online");
      setCheckinState("saved");
    } catch {
      savePreviewCheckin({ ...previewCheckinRecord, source: "browser" });
      setPreviewCheckins(loadPreviewCheckins(patient.id));
      setCheckinState("saved");
    }
  };

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-gray-200 bg-white p-7 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-rose-500">Evolucao temporal</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-gray-900">Sessao {session} de {patient.name}</h2>
          </div>
          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-500">{statusLabel}</span>
        </div>
        <div className="mt-5 flex gap-4 text-xs">
          {[
            ["Ansiedade", "#ef4444"],
            ["Humor", "#f43f5e"],
            ["Aderencia", "#10b981"]
          ].map(([label, color]) => (
            <div key={label} className="flex items-center gap-1.5">
              <span className="h-2 w-5 rounded-full" style={{ background: color }} />
              {label}
            </div>
          ))}
        </div>
        <div className="mt-4 rounded-xl border border-gray-100 bg-gray-50 p-4">
          <svg className="h-[280px] w-full" preserveAspectRatio="none" viewBox="0 0 100 100">
            <polyline fill="none" opacity="0.6" points={line("anxiety")} stroke="#ef4444" strokeWidth="0.8" />
            <polyline fill="none" opacity="0.9" points={line("mood")} stroke="#f43f5e" strokeWidth="0.9" />
            <polyline fill="none" opacity="0.7" points={line("adherence")} stroke="#10b981" strokeWidth="0.8" />
            {previewTimelinePoints.map((point) => (
              <g key={point.session}>
                <circle cx={point.x} cy={100 - point.anxiety} fill="#ef4444" r="1.2" />
                <circle cx={point.x} cy={100 - point.mood} fill="#f43f5e" r="1.2" />
                <circle cx={point.x} cy={100 - point.adherence} fill="#10b981" r="1.2" />
              </g>
            ))}
          </svg>
        </div>
        <div className="mt-5">
          <div className="mb-2 flex justify-between text-xs text-gray-500">
            <span>Sessao 1</span>
            <span className="font-semibold text-gray-900">Sessao {session}</span>
            <span>Sessao 18</span>
          </div>
          <input
            className="w-full accent-rose-500"
            max={18}
            min={1}
            onChange={(e) => setSession(Number(e.target.value))}
            type="range"
            value={session}
          />
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(280px,0.75fr)]">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">Evolucao clinica estruturada</p>
              <h3 className="mt-2 text-xl font-bold text-gray-900">
                Status geral: <span className="text-rose-600">{evolutionView.status_geral}</span>
              </h3>
              <p className="mt-2 text-sm leading-6 text-gray-500">
                Comparacao longitudinal baseada em analises JSON por sessao, nao em texto livre.
              </p>
            </div>
            <TrendingUp className="h-5 w-5 text-rose-500" />
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <ClinicalSignalList title="Principais mudancas" items={evolutionView.principais_mudancas} />
            <ClinicalSignalList title="Padroes persistentes" items={evolutionView.padroes_persistentes} />
            <ClinicalSignalList title="Novos riscos" items={evolutionView.novos_riscos.length ? evolutionView.novos_riscos : ["sem novo risco critico"]} />
            <ClinicalSignalList title="Tendencias" items={evolutionView.tendencias} />
          </div>
          {previewAnalyses.length ? (
            <div className="mt-5 rounded-xl border border-rose-100 bg-rose-50/70 p-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-rose-500">
                Sessoes analisadas nesta demo
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {previewAnalyses.slice(-5).map((record) => (
                  <span
                    key={`${record.payload.patient_id}-${record.payload.session_number}`}
                    className="rounded-full border border-rose-200 bg-white px-3 py-1 text-xs font-semibold text-rose-700"
                  >
                    Sessao {record.payload.session_number} · {record.payload.sintomas.length + record.payload.emocoes.length} sinais
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <div className="space-y-5">
          <div className={`rounded-2xl border p-6 shadow-sm ${riskColor}`}>
            <p className="text-xs font-semibold uppercase tracking-widest opacity-70">Risco de abandono</p>
            <div className="mt-3 flex items-end justify-between">
              <span className="font-mono text-4xl font-bold">{riskView.score}%</span>
              <span className="rounded-full bg-white/70 px-2.5 py-1 text-xs font-semibold">{riskView.risco_abandono}</span>
            </div>
            <ProgressBarWs color={riskView.score >= 70 ? "#ef4444" : riskView.score >= 40 ? "#f59e0b" : "#10b981"} label="Retencao" value={riskView.score} />
            <div className="mt-4 space-y-2">
              {riskView.sugestoes_acao.slice(0, 2).map((suggestion) => (
                <p key={suggestion} className="rounded-xl bg-white/70 px-3 py-2 text-xs leading-5">{suggestion}</p>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50">
                <MessageCircle className="h-5 w-5 text-rose-500" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">WhatsApp Premium</p>
                <p className="text-xs text-gray-500">operacional, sem aconselhamento clinico</p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {[
                [whatsappStats.checkins, "check-ins"],
                [whatsappStats.confirmations, "confirm."],
                [whatsappStats.flags, "flags"]
              ].map(([value, label]) => (
                <div key={String(label)} className="rounded-xl bg-gray-50 p-3 text-center">
                  <p className="font-mono text-lg font-bold text-gray-900">{value}</p>
                  <p className="text-[10px] uppercase tracking-wider text-gray-400">{label}</p>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs leading-5 text-gray-500">
              Lembretes, confirmacoes e check-ins alimentam a timeline e o score de abandono.
            </p>
            <button
              type="button"
              onClick={handleDemoCheckin}
              disabled={checkinState === "saving"}
              className="mt-4 w-full rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {checkinState === "saving"
                ? "Registrando check-in..."
                : checkinState === "saved"
                ? "Check-in registrado"
                : checkinState === "demo"
                ? "Demo sem backend"
                : "Registrar check-in demo"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ClinicalSignalList({ items, title }: { items: string[]; title: string }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">{title}</p>
      <div className="mt-3 space-y-2">
        {items.slice(0, 4).map((item) => (
          <p key={item} className="text-sm leading-5 text-gray-700">
            {item}
          </p>
        ))}
      </div>
    </div>
  );
}

function TimelineTab({
  patient,
  session,
  setSession
}: {
  patient: Patient;
  session: number;
  setSession: (v: number) => void;
}) {
  const points = Array.from({ length: 18 }, (_, i) => ({
    anxiety: 82 - i * 3.2 + (i % 3) * 2,
    mood: 44 + i * 2.4 + (i % 4) * 2,
    adherence: 84 + (i % 2) * 3,
    session: i + 1,
    x: 5 + i * 5.2
  }));
  const line = (key: "adherence" | "anxiety" | "mood") => points.map((p) => `${p.x},${100 - p[key]}`).join(" ");

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-7 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-widest text-rose-500">Evolução temporal</p>
      <h2 className="mt-2 text-2xl font-bold tracking-tight text-gray-900">Sessão {session} de {patient.name}</h2>
      <div className="mt-5 flex gap-4 text-xs">
        {[
          ["Ansiedade", "#ef4444"],
          ["Humor", "#f43f5e"],
          ["Aderência", "#10b981"]
        ].map(([label, color]) => (
          <div key={label} className="flex items-center gap-1.5">
            <span className="h-2 w-5 rounded-full" style={{ background: color }} />
            {label}
          </div>
        ))}
      </div>
      <div className="mt-4 rounded-xl border border-gray-100 bg-gray-50 p-4">
        <svg className="h-[280px] w-full" preserveAspectRatio="none" viewBox="0 0 100 100">
          <polyline fill="none" opacity="0.6" points={line("anxiety")} stroke="#ef4444" strokeWidth="0.8" />
          <polyline fill="none" opacity="0.9" points={line("mood")} stroke="#f43f5e" strokeWidth="0.9" />
          <polyline fill="none" opacity="0.7" points={line("adherence")} stroke="#10b981" strokeWidth="0.8" />
        </svg>
      </div>
      <div className="mt-5">
        <div className="mb-2 flex justify-between text-xs text-gray-500">
          <span>Sessão 1</span>
          <span className="font-semibold text-gray-900">Sessão {session}</span>
          <span>Sessão 18</span>
        </div>
        <input
          className="w-full accent-rose-500"
          max={18}
          min={1}
          onChange={(e) => setSession(Number(e.target.value))}
          type="range"
          value={session}
        />
      </div>
    </div>
  );
}

function PsychTestsTab({ patient }: { patient: Patient }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-7 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-widest text-violet-500">Testes psicológicos</p>
      <h2 className="mt-2 text-2xl font-bold tracking-tight text-gray-900">Instrumentos sugeridos para {patient.name}</h2>
      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          ["Y-BOCS", "Sintomas obsessivo-compulsivos", 72],
          ["GAD-7", "Ansiedade", 58],
          ["ISI", "Insônia", 66],
          ["ASRS-1", "Rastreio de TDAH adulto", 22]
        ].map(([name, desc, value]) => (
          <div key={String(name)} className="rounded-xl border border-gray-100 bg-gray-50 p-5">
            <p className="font-bold text-gray-900">{name}</p>
            <p className="mt-1 text-xs text-gray-500">{desc}</p>
            <ProgressBarWs color="#8b5cf6" label="Prioridade" value={Number(value)} />
          </div>
        ))}
      </div>
    </div>
  );
}

function PremiumMedicationsTab() {
  const [query, setQuery] = useState("sertralina");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("loading");
  const [mode, setMode] = useState<"api" | "demo">("demo");
  const [error, setError] = useState("");
  const [result, setResult] = useState<AdlerMedicationSearchResponse | null>(null);
  const [selectedResult, setSelectedResult] = useState<MedicationSearchResult | null>(null);
  const [inserted, setInserted] = useState(["Sertralina 50 mg", "Lorazepam 0,5 mg"]);

  useEffect(() => {
    void runMedicationSearch("sertralina", true);
  }, []);

  async function runMedicationSearch(term = query, initial = false) {
    const cleanTerm = term.trim();
    if (cleanTerm.length < 2) {
      setError("Digite pelo menos 2 caracteres para buscar uma substância.");
      setStatus("error");
      return;
    }

    setStatus("loading");
    setError("");
    try {
      const response = await fetchAdlerMedicationSearch(cleanTerm);
      setResult(response);
      setSelectedResult(response.results[0] ?? null);
      setMode("api");
      setStatus("idle");
    } catch (caught) {
      const fallback = buildMedicationFallback(cleanTerm);
      setResult(fallback);
      setSelectedResult(fallback.results[0] ?? null);
      setMode("demo");
      setStatus(initial ? "idle" : "error");
      setError(
        caught instanceof Error
          ? `Backend indisponível agora. Exibindo base local: ${caught.message}`
          : "Backend indisponível agora. Exibindo base local."
      );
    }
  }

  const profile = result?.evidence_profile;
  const visibleName =
    selectedResult?.name || profile?.display_name || result?.local_query || "Substância";
  const alreadyInserted = inserted.some((item) =>
    item.toLowerCase().includes((profile?.display_name || visibleName).toLowerCase())
  );
  const validationColor =
    result?.validation.status === "validado"
      ? "text-emerald-600 bg-emerald-50 border-emerald-200"
      : result?.validation.status === "parcial"
        ? "text-amber-600 bg-amber-50 border-amber-200"
        : "text-red-600 bg-red-50 border-red-200";
  const recommendationBlocks = [
    {
      title: "Base científica",
      items: result?.decision_support.first_line_context ?? ["Busque uma substância para carregar evidências."],
      icon: TestTube2
    },
    {
      title: "Farmacocinética / Farmacodinâmica",
      items: result?.decision_support.pk_pd_notes ?? ["Dados PK/PD aparecem após a busca."],
      icon: Activity
    },
    {
      title: "Checklist antes de inserir",
      items: result?.decision_support.insertion_checklist ?? ["Revise indicação, dose, interações e monitoramento."],
      icon: ClipboardCheck
    }
  ];

  function insertVisibleMedication() {
    const name = profile?.display_name || visibleName;
    const dose = profile?.initial_dose ? `${name} · ${profile.initial_dose}` : name;
    setInserted((current) => (current.includes(dose) ? current : [dose, ...current]));
  }

  return (
    <div className="grid min-h-[calc(100vh-170px)] gap-0 overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm xl:grid-cols-[280px_minmax(0,1fr)]">
      <aside className="border-b border-gray-200 bg-gray-50/70 p-5 xl:border-b-0 xl:border-r">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-rose-500">
            Premium · prescrição baseada em evidências
          </p>
          <h2 className="mt-2 text-xl font-bold tracking-tight text-gray-900">
            Consulta medicamentosa
          </h2>
          <p className="mt-2 text-sm leading-6 text-gray-500">
            Busca em RxNorm/openFDA quando disponível e cruza com a base científica curada do Adler.
          </p>
        </div>

        <form
          className="mt-5"
          onSubmit={(event) => {
            event.preventDefault();
            void runMedicationSearch();
          }}
        >
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Sertralina, lítio..."
              className="h-10 w-full rounded-xl border border-gray-200 bg-white pl-9 pr-3 text-sm text-gray-900 outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
            />
          </div>
          <button
            type="submit"
            className="mt-3 w-full rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-700"
          >
            {status === "loading" ? "Consultando bases..." : "Buscar substância"}
          </button>
        </form>

        {error ? (
          <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-700">
            {error}
          </p>
        ) : null}

        <div className="mt-5">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">
            Resultados populares
          </p>
          <div className="mt-2 space-y-1">
            {(result?.available_local_medications ?? ["sertralina", "litio", "quetiapina", "venlafaxina"]).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => {
                  setQuery(item);
                  void runMedicationSearch(item);
                }}
                className={`w-full rounded-xl px-3 py-2.5 text-left text-sm transition ${
                  result?.local_query === item
                    ? "bg-rose-50 font-semibold text-rose-700"
                    : "text-gray-600 hover:bg-white hover:text-gray-900"
                }`}
              >
                {capitalizeMedication(item)}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-gray-200 bg-white p-4">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">
            Prontuário medicamentoso
          </p>
          <div className="mt-3 space-y-2">
            {inserted.map((item) => (
              <div key={item} className="flex items-start gap-2 rounded-xl bg-gray-50 px-3 py-2 text-xs leading-5 text-gray-700">
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </aside>

      <main className="figma-scroll min-h-0 overflow-y-auto p-6 xl:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-3xl font-bold tracking-tight text-gray-900">{profile?.display_name ?? visibleName}</h3>
              {profile ? (
                <span className="rounded-lg bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-500">
                  {profile.class_name}
                </span>
              ) : null}
              <span className={`rounded-lg border px-2 py-1 text-xs font-semibold ${validationColor}`}>
                {result?.validation.status ?? "revisar"} · {result?.validation.confidence_score ?? 0}%
              </span>
              <span className="rounded-lg border border-gray-200 bg-gray-50 px-2 py-1 text-xs font-semibold text-gray-500">
                {mode === "api" ? "API conectada" : "base local"}
              </span>
            </div>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-gray-500">
              {profile?.mechanism ??
                "Digite uma substância para normalizar o termo, verificar rotulagem, interações, exames e critérios científicos antes da inserção no prontuário."}
            </p>
          </div>
          <button
            type="button"
            onClick={insertVisibleMedication}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
              alreadyInserted
                ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                : "bg-rose-500 text-white hover:bg-rose-600"
            }`}
          >
            {alreadyInserted ? <CheckCircle2 className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {alreadyInserted ? "Já em uso" : "Inserir no prontuário"}
          </button>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <ClinicalInfoTile
            title="Posologia e administração"
            value={profile ? `${profile.initial_dose} Dose máxima: ${profile.max_dose}` : "Aguardando busca validada."}
            icon={Pill}
          />
          <ClinicalInfoTile
            title="Indicações principais"
            value={profile?.indications.join(" · ") ?? "Indicações aparecem após validação da substância."}
            icon={CheckCircle2}
          />
        </div>

        <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
            <div>
              <p className="font-semibold text-gray-900">Checagem de interações, farmacogenética e exames</p>
              <div className="mt-3 space-y-2">
                {(result?.decision_support.interaction_alerts.length
                  ? result.decision_support.interaction_alerts
                  : profile?.contraindication_flags ?? ["Nenhum alerta local encontrado para a substância pesquisada."]
                ).slice(0, 4).map((item) => (
                  <p key={item} className="text-sm leading-6 text-amber-900/85">
                    {item}
                  </p>
                ))}
              </div>
              {profile?.genetic_notes.length ? (
                <p className="mt-3 rounded-xl border border-amber-200 bg-white/55 p-3 text-sm leading-6 text-amber-900/80">
                  {profile.genetic_notes[0]}
                </p>
              ) : null}
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-4 xl:grid-cols-3">
          {recommendationBlocks.map(({ icon: Icon, items, title }) => (
            <div key={title} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="mb-3 flex items-center gap-2">
                <Icon className="h-4 w-4 text-rose-500" />
                <p className="font-semibold text-gray-900">{title}</p>
              </div>
              <div className="space-y-2">
                {items.slice(0, 4).map((item) => (
                  <p key={item} className="rounded-xl bg-gray-50 px-3 py-2 text-sm leading-6 text-gray-600">
                    {item}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="font-semibold text-gray-900">Conceitos RxNorm / rotulagem</p>
            <div className="mt-3 space-y-2">
              {(result?.results ?? []).slice(0, 5).map((medication) => (
                <button
                  key={`${medication.rxcui}-${medication.name}`}
                  type="button"
                  onClick={() => setSelectedResult(medication)}
                  className={`flex w-full items-center justify-between gap-3 rounded-xl border px-3 py-3 text-left transition ${
                    selectedResult?.rxcui === medication.rxcui
                      ? "border-rose-200 bg-rose-50"
                      : "border-gray-100 bg-gray-50 hover:bg-white"
                  }`}
                >
                  <span>
                    <span className="block text-sm font-semibold text-gray-900">{medication.name}</span>
                    <span className="mt-0.5 block font-mono text-[11px] uppercase tracking-widest text-gray-400">
                      {medication.source} · RXCUI {medication.rxcui} · {medication.term_type || "conceito"}
                    </span>
                  </span>
                  <ArrowRight className="h-4 w-4 text-gray-400" />
                </button>
              ))}
            </div>
            {result?.label ? (
              <div className="mt-4 rounded-xl border border-sky-100 bg-sky-50 p-4">
                <p className="text-sm font-semibold text-gray-900">Rotulagem openFDA</p>
                <p className="mt-2 text-sm leading-6 text-gray-600">
                  {result.label.indications || result.label.warnings || result.label.drug_interactions}
                </p>
              </div>
            ) : null}
          </div>

          <aside className="space-y-4">
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="font-semibold text-gray-900">Monitoramento</p>
              <p className="mt-2 text-sm leading-6 text-gray-600">
                {profile?.monitoring_summary ?? "Sem trilha especifica de monitoramento para este termo."}
              </p>
              <div className="mt-3 space-y-2">
                {(result?.decision_support.monitoring_actions ?? []).slice(0, 4).map((item) => (
                  <p key={item} className="rounded-xl bg-gray-50 px-3 py-2 text-xs leading-5 text-gray-600">
                    {item}
                  </p>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="font-semibold text-gray-900">Critérios de personalização</p>
              <div className="mt-3 space-y-2">
                {(profile?.personalization_criteria ?? result?.validation.criteria ?? []).slice(0, 5).map((item) => (
                  <p key={item} className="flex gap-2 text-sm leading-6 text-gray-600">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500" />
                    {item}
                  </p>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="font-semibold text-gray-900">Fontes</p>
              <div className="mt-3 space-y-2">
                {(result?.sources ?? []).map((source) => (
                  <a
                    key={source.name}
                    href={source.url.startsWith("http") ? source.url : undefined}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between gap-3 rounded-xl bg-gray-50 px-3 py-2 text-sm text-gray-600"
                  >
                    {source.name}
                    {source.url.startsWith("http") ? <ExternalLink className="h-3.5 w-3.5 text-gray-400" /> : null}
                  </a>
                ))}
              </div>
            </div>
          </aside>
        </div>

        <p className="mt-5 rounded-2xl border border-gray-200 bg-gray-50 p-4 text-xs leading-5 text-gray-500">
          {result?.decision_support.clinical_boundary ??
            "O Adler organiza evidências e riscos, mas não substitui decisão clínica, prescrição ou revisão por profissional habilitado."}
        </p>
      </main>
    </div>
  );
}

function ClinicalInfoTile({
  icon: Icon,
  title,
  value
}: {
  icon: LucideIcon;
  title: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <Icon className="h-4 w-4 text-rose-500" />
        <p className="font-semibold text-gray-900">{title}</p>
      </div>
      <p className="text-sm leading-6 text-gray-600">{value}</p>
    </div>
  );
}

function capitalizeMedication(value: string) {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function buildMedicationFallback(term: string): AdlerMedicationSearchResponse {
  const normalized = term.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const isLithium = normalized.includes("litio") || normalized.includes("lithium");
  const isQuetiapine = normalized.includes("quetiapina") || normalized.includes("quetiapine");
  const displayName = isLithium ? "Lítio" : isQuetiapine ? "Quetiapina" : "Sertralina";
  const className = isLithium ? "Estabilizador do humor" : isQuetiapine ? "Antipsicótico atípico" : "ISRS";

  return {
    auth_mode: "demo",
    tenant_id: "demo",
    query: term,
    normalized_query: isLithium ? "lithium" : isQuetiapine ? "quetiapine" : "sertraline",
    local_query: isLithium ? "litio" : isQuetiapine ? "quetiapina" : "sertralina",
    available_local_medications: ["sertralina", "litio", "quetiapina", "venlafaxina", "lorazepam", "naltrexona"],
    results: [
      {
        name: displayName,
        rxcui: "base-adler",
        source: "Base científica Adler",
        synonym: className,
        term_type: "curated"
      }
    ],
    label: null,
    evidence_profile: {
      display_name: displayName,
      class_name: className,
      mechanism: isLithium
        ? "Modulação de sinalização intracelular e neuroplasticidade, com efeito estabilizador do humor."
        : isQuetiapine
          ? "Antagonismo serotoninérgico/dopaminérgico com efeitos anti-histamínicos dose-dependentes."
          : "Inibição seletiva do transportador de serotonina (SERT).",
      initial_dose: isLithium
        ? "Dose individualizada por litemia."
        : isQuetiapine
          ? "Titulação conforme indicação e sedação."
          : "25-50 mg/dia conforme tolerabilidade.",
      max_dose: isLithium
        ? "Ajustada por litemia, função renal e tolerabilidade."
        : isQuetiapine
          ? "Variável conforme indicação e formulação."
          : "Até 200 mg/dia em adultos.",
      indications: isLithium
        ? ["Transtorno bipolar", "Manutenção do humor", "Prevenção de recaídas"]
        : isQuetiapine
          ? ["Transtorno bipolar", "Psicose", "Depressão bipolar"]
          : ["Depressão", "TOC", "Pânico", "TEPT", "TAG"],
      gold_standard: isLithium
        ? ["Referência para manutenção do transtorno bipolar.", "Faixa terapêutica estreita exige exames seriados."]
        : isQuetiapine
          ? ["Evidência relevante em bipolaridade e psicose.", "Monitoramento metabólico é parte da decisão."]
          : ["1ª linha para depressão e transtornos ansiosos.", "Em TOC, resposta pode exigir dose/tempo maiores."],
      clinical_trials: ["Perfil demonstrativo local até o backend responder."],
      pharmacokinetics: isLithium
        ? ["Eliminação renal; hidratação e sódio alteram litemia.", "AINEs e diuréticos podem aumentar níveis."]
        : isQuetiapine
          ? ["Metabolismo predominante por CYP3A4.", "Indutores/inibidores podem alterar exposição."]
          : ["Metabolismo hepático com CYP2C19/CYP2D6.", "Meia-vida aproximada de 24-32h."],
      pharmacodynamics: isLithium
        ? ["Toxicidade pode cursar com tremor, ataxia, diarreia e confusão."]
        : isQuetiapine
          ? ["Sedação e efeitos metabólicos podem limitar continuidade."]
          : ["Risco serotoninérgico em combinações com IMAO e outros serotoninérgicos."],
      personalization_criteria: ["Indicação clínica", "Interações", "Efeitos adversos", "Exames e adesão"],
      monitoring_summary: isLithium
        ? "Litemia 12h, função renal, TSH/T4 livre e eletrólitos."
        : isQuetiapine
          ? "Peso/IMC, glicemia, perfil lipídico, PA e sedação."
          : "Resposta em 4-6 semanas, adesão, efeitos adversos e ativação.",
      genetic_notes: ["Farmacogenética deve vir de teste externo validado e não substitui acompanhamento clínico."],
      contraindication_flags: ["Revisar contraindicações, interações e contexto clínico antes de inserir."],
      evidence_level: "Perfil local demonstrativo com base curada Adler."
    },
    validation: {
      status: "parcial",
      confidence_score: 62,
      criteria: ["Base científica local carregada.", "Backend/API pública indisponível nesta execução."]
    },
    decision_support: {
      first_line_context: isLithium
        ? ["Referência para manutenção bipolar quando monitorado corretamente."]
        : isQuetiapine
          ? ["Útil em indicações aprovadas, com vigilância metabólica."]
          : ["1ª linha para depressão e ansiedade em múltiplas diretrizes."],
      pk_pd_notes: isLithium
        ? ["Eliminação renal.", "AINEs/diuréticos podem aumentar litemia."]
        : isQuetiapine
          ? ["CYP3A4.", "Sedação e risco metabólico."]
          : ["CYP2C19/CYP2D6.", "Modulação serotoninérgica progressiva."],
      insertion_checklist: [
        "Confirmar indicação e diagnóstico-alvo.",
        "Revisar interações, substâncias e alergias.",
        "Registrar dose, frequência e plano de monitoramento.",
        "Validar decisão com profissional habilitado."
      ],
      interaction_alerts: isLithium
        ? ["Lítio + ibuprofeno: aumento da litemia e risco de toxicidade."]
        : isQuetiapine
          ? ["Quetiapina + álcool: sedação intensa; evitar combinação."]
          : ["Sertralina + IMAO: risco serotoninérgico; contraindicado."],
      monitoring_actions: isLithium
        ? ["Litemia 12h: 1-2 semanas até estabilizar; depois trimestral.", "Creatinina/ureia: baseline e trimestral."]
        : isQuetiapine
          ? ["Glicemia/perfil lipídico: baseline e semestral.", "Peso/IMC: mensal inicialmente."]
          : [],
      clinical_boundary:
        "O Adler organiza evidências e riscos; a prescrição final exige julgamento clínico e habilitação profissional."
    },
    curated_insights: {
      clinical_concepts: [],
      documents: [],
      interactions: [],
      laboratory_monitoring: []
    },
    treatment_notes: ["Modo local carregado para manter a demo utilizável sem backend."],
    source_notes: ["RxNorm/openFDA serão usados quando o backend estiver ativo."],
    sources: [
      {
        name: "Base científica Adler",
        purpose: "fallback curado local",
        url: "local://adler_base_cientifica_template"
      }
    ]
  };
}

function PremiumExamsTab() {
  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-gray-200 bg-white p-7 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-widest text-rose-500">Premium · exames clínicos</p>
        <h2 className="mt-2 text-2xl font-bold tracking-tight text-gray-900">Monitoramento laboratorial</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
          Aba dedicada para pacientes em uso de medicações que exigem exames, como lítio, valproato, carbamazepina e antipsicóticos.
        </p>
      </div>
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        {[
          ["Litemia 12h", "1-2 semanas até estabilizar; depois trimestral", "Faixa terapêutica estreita e risco de toxicidade neurológica."],
          ["Creatinina e ureia", "Baseline e trimestral", "Monitoramento de função renal em uso de lítio."],
          ["TSH e T4 livre", "Baseline e semestral", "Risco de hipotireoidismo associado ao lítio."],
          ["Glicemia e perfil lipídico", "Baseline e semestral", "Rastreamento metabólico em antipsicóticos atípicos."]
        ].map(([exam, frequency, note]) => (
          <div key={exam} className="border-b border-gray-50 px-6 py-4 last:border-b-0">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-semibold text-gray-900">{exam}</p>
                <p className="mt-1 text-sm text-gray-500">{frequency}</p>
                <p className="mt-2 text-sm text-rose-600">{note}</p>
              </div>
              <span className="rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-600">Premium</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SherlockSidebar({ patient, session }: { patient: Patient; session: number }) {
  const [open, setOpen] = useState(false);
  const risk = session <= 6 ? 65 : patient.risk;

  return (
    <aside className="figma-scroll hidden h-full w-[320px] shrink-0 overflow-y-auto border-l border-gray-200 bg-white p-5 2xl:block">
      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-gray-400">Sherlock Insights</p>
      <h3 className="mt-2 text-lg font-bold text-gray-900">Leitura clínica</h3>
      <p className="mt-2 text-sm leading-6 text-gray-500">
        Sessão {session}. {approach.label}. Foco em modos, necessidades emocionais e padrões de enfrentamento.
      </p>

      <div className={`mt-5 rounded-xl border p-5 ${risk >= 60 ? "border-red-200 bg-red-50" : "border-emerald-200 bg-emerald-50"}`}>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-500">Clinical Risk Score</p>
        <div className="mt-3 flex items-end justify-between">
          <span className="font-mono text-4xl font-bold text-gray-900">{risk}%</span>
          <span className={`text-sm font-semibold ${risk >= 60 ? "text-red-600" : "text-emerald-600"}`}>
            {risk >= 60 ? "Crítico" : "Moderado"}
          </span>
        </div>
        <ProgressBarWs color={risk >= 60 ? "#ef4444" : "#10b981"} label="Monitoramento" value={risk} />
      </div>

      <div className="mt-4 space-y-3">
        {[
          ["Modo protetor desligado", "Evitação emocional aparece quando há fadiga e medo de falhar."],
          ["Hiper-responsabilidade", "Aumenta checagem e busca de certeza em períodos de insônia."]
        ].map(([title, text]) => (
          <div key={title} className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <p className="text-sm font-semibold text-gray-900">{title}</p>
            <p className="mt-1.5 text-xs leading-5 text-gray-500">{text}</p>
          </div>
        ))}
      </div>

      <button
        className="mt-4 w-full rounded-xl border border-amber-200 bg-amber-50 p-4 text-left transition hover:bg-amber-100"
        onClick={() => setOpen(!open)}
        type="button"
      >
        <p className="flex items-center gap-2 text-sm font-semibold text-amber-900">
          <AlertTriangle className="h-4 w-4" />
          Diferenciais diagnósticos
        </p>
        {open ? (
          <p className="mt-2 text-xs leading-5 text-amber-900/80">
            Padrão de distração na sessão 12 sugere 22% de probabilidade de TDAH não diagnosticado. Recomenda-se ASRS-1.
          </p>
        ) : null}
      </button>
    </aside>
  );
}

function ProgressBarWs({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <div className="mt-4">
      <div className="mb-1.5 flex items-center justify-between text-xs">
        <span className="text-gray-500">{label}</span>
        <span className="font-mono font-semibold text-gray-700">{value}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-gray-200">
        <motion.div
          animate={{ width: `${value}%` }}
          className="h-full rounded-full"
          initial={{ width: 0 }}
          style={{ backgroundColor: color }}
          transition={{ duration: 0.8 }}
        />
      </div>
    </div>
  );
}

function MedicationCard({
  alert,
  detail,
  efficacy,
  title,
  type
}: {
  alert?: string;
  detail: string;
  efficacy: number;
  title: string;
  type: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">{type}</p>
          <p className="mt-1 text-lg font-bold text-gray-900">{title}</p>
        </div>
        <Pill className="h-5 w-5 text-rose-500" />
      </div>
      <p className="mt-3 text-sm leading-6 text-gray-600">{detail}</p>
      <ProgressBarWs color="#f43f5e" label="Eficácia estimada" value={efficacy} />
      {alert ? <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{alert}</div> : null}
    </div>
  );
}

function ModalFrame({ children, onClose, title }: { children: ReactNode; onClose: () => void; title: string }) {
  return (
    <motion.div
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 grid place-items-center bg-gray-900/40 px-4 backdrop-blur-sm"
      exit={{ opacity: 0 }}
      initial={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="figma-scroll max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-gray-200 bg-white p-7 shadow-2xl"
        exit={{ opacity: 0, scale: 0.98, y: 10 }}
        initial={{ opacity: 0, scale: 0.98, y: 14 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-tight text-gray-900">{title}</h2>
          <button className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700" onClick={onClose} type="button">
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </motion.div>
    </motion.div>
  );
}

function PatientModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (p: { focus: string; name: string }) => void }) {
  const [name, setName] = useState("");
  const [focus, setFocus] = useState("");
  return (
    <ModalFrame onClose={onClose} title="Adicionar paciente">
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim()) return;
          onSubmit({ focus, name });
        }}
      >
        <Field label="Nome" onChange={setName} placeholder="Ex: Mariana A." value={name} />
        <Field label="Foco inicial" onChange={setFocus} placeholder="Ex: ansiedade, sono, rituais..." value={focus} />
        <button className="w-full rounded-xl bg-rose-500 py-3 text-sm font-semibold text-white hover:bg-rose-600" type="submit">
          Criar perfil
        </button>
      </form>
    </ModalFrame>
  );
}

function ScheduleModal({
  onClose,
  onSubmit,
  patients
}: {
  onClose: () => void;
  onSubmit: (p: { kind: string; mode: string; name: string; note: string; time: string }) => void;
  patients: Patient[];
}) {
  const [name, setName] = useState(patients[0]?.name ?? "");
  const [time, setTime] = useState("09:00");
  const [kind, setKind] = useState("Sessão individual");
  const [mode, setMode] = useState("Presencial · Sala 1");
  const [note, setNote] = useState("");
  return (
    <ModalFrame onClose={onClose} title="Agendar paciente">
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim()) return;
          onSubmit({ kind, mode, name, note, time });
        }}
      >
        <Field label="Paciente" onChange={setName} placeholder="Digite ou selecione" value={name} />
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Horário" onChange={setTime} placeholder="09:00" value={time} />
          <Field label="Tipo" onChange={setKind} placeholder="Sessão individual" value={kind} />
        </div>
        <Field label="Modalidade" onChange={setMode} placeholder="Online ou presencial" value={mode} />
        <Field label="Observação" onChange={setNote} placeholder="Preparação clínica..." value={note} />
        <p className="rounded-xl bg-rose-50 p-3 text-sm text-rose-800">
          Se o nome não existir, o Adler cria automaticamente um perfil básico do paciente.
        </p>
        <button className="w-full rounded-xl bg-rose-500 py-3 text-sm font-semibold text-white hover:bg-rose-600" type="submit">
          Confirmar agenda
        </button>
      </form>
    </ModalFrame>
  );
}

function AboutModal({ onClose }: { onClose: () => void }) {
  return (
    <ModalFrame onClose={onClose} title="Adler AI">
      <p className="text-sm leading-6 text-gray-600">
        O Adler AI combina prontuário clínico, análise longitudinal, documentos, DSM e suporte de IA rastreável. Não substitui julgamento clínico: organiza dados, evidências e hipóteses.
      </p>
      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {["Abordagem multiparadigmática", "Análise longitudinal", "Documentos rastreáveis", "Privacidade por arquitetura"].map((item) => (
          <div key={item} className="rounded-xl border border-gray-100 bg-gray-50 p-4 text-sm text-gray-700">
            {item}
          </div>
        ))}
      </div>
    </ModalFrame>
  );
}

function SecurityModal({ onClose }: { onClose: () => void }) {
  return (
    <ModalFrame onClose={onClose} title="Segurança & Privacidade">
      <div className="grid gap-4 md:grid-cols-2">
        {[
          ["Isolamento de dados", "Dados clínicos segregados por conta."],
          ["Criptografia", "Preparada para dados sensíveis em repouso."],
          ["IA sem treinamento", "Dados não usados para treinar modelos generativos."],
          ["Auditoria", "Eventos críticos podem ser registrados."]
        ].map(([title, text]) => (
          <div key={title} className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <p className="font-semibold text-gray-900">{title}</p>
            <p className="mt-1.5 text-sm leading-5 text-gray-500">{text}</p>
          </div>
        ))}
      </div>
    </ModalFrame>
  );
}

function Field({
  label,
  onChange,
  placeholder,
  value
}: {
  label: string;
  onChange: (v: string) => void;
  placeholder: string;
  value: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-gray-700">{label}</span>
      <input
        className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        value={value}
      />
    </label>
  );
}

function exportPatients(patients: Patient[]) {
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

function initialsFrom(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

function slugify(value: string) {
  const slug = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `${slug || "paciente"}-${Date.now().toString(36)}`;
}
