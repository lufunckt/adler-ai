import { useMemo, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bell,
  BookOpenText,
  BrainCircuit,
  CalendarDays,
  ChevronRight,
  CreditCard,
  Database,
  Eye,
  FileCheck2,
  FileText,
  Home,
  Info,
  Lock,
  Plus,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  UserPlus,
  Users
} from "lucide-react";
import type { PatientRecord } from "../data/patientData";
import {
  CLINICIAN_TASKS,
  DASHBOARD_PATIENT_STATUS,
  DEFAULT_CLINICIAN_NOTEPAD,
  type ClinicianProfile,
  type ClinicianScheduleItem
} from "../data/clinicianData";
import { DocumentsCenterPanel } from "./DocumentsCenterPanel";
import { DsmSearchPanel } from "./DsmSearchPanel";
import { SubscriptionPanel } from "./SubscriptionPanel";

type NewPatientDraft = {
  currentProtocol?: string;
  diagnosis?: string;
  focus?: string;
  name: string;
};

type DashboardSection =
  | "home"
  | "documents"
  | "dsm"
  | "patients"
  | "schedule"
  | "settings"
  | "subscription";

type ClinicianDashboardProps = {
  accent: string;
  accentBorder: string;
  accentSurface: string;
  clinician: ClinicianProfile;
  onCreateAppointment: (appointment: ClinicianScheduleItem) => void;
  onCreatePatient: (patient: NewPatientDraft) => string;
  onOpenWorkspace: (patientId: string) => void;
  patients: PatientRecord[];
  schedule: ClinicianScheduleItem[];
};

const NAV_ITEMS: Array<{
  id: DashboardSection;
  icon: typeof Home;
  label: string;
}> = [
  { id: "home", icon: Home, label: "Início" },
  { id: "patients", icon: Users, label: "Pacientes" },
  { id: "schedule", icon: CalendarDays, label: "Agenda" },
  { id: "dsm", icon: BookOpenText, label: "DSM / Psicopatologia" },
  { id: "documents", icon: FileText, label: "Documentos" },
  { id: "subscription", icon: CreditCard, label: "Assinatura" },
  { id: "settings", icon: Settings2, label: "Configurações" }
];

export function ClinicianDashboard({
  accent,
  accentBorder,
  accentSurface,
  clinician,
  onCreateAppointment,
  onCreatePatient,
  onOpenWorkspace,
  patients,
  schedule
}: ClinicianDashboardProps) {
  const [activeSection, setActiveSection] = useState<DashboardSection>("home");
  const [infoModal, setInfoModal] = useState<"about" | "security" | null>(null);
  const [isPatientModalOpen, setPatientModalOpen] = useState(false);
  const [isScheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [notesDraft, setNotesDraft] = useState(DEFAULT_CLINICIAN_NOTEPAD);
  const [patientFilter, setPatientFilter] = useState<"active" | "all" | "inactive">(
    "all"
  );

  const filteredPatients = useMemo(() => {
    const normalizedTerm = searchTerm.trim().toLowerCase();

    return patients.filter((patient) => {
      const status = DASHBOARD_PATIENT_STATUS[patient.id] ?? "active";
      const matchesFilter = patientFilter === "all" || status === patientFilter;
      const matchesSearch =
        normalizedTerm.length === 0 ||
        [
          patient.name,
          patient.focus,
          patient.diagnosis,
          patient.currentProtocol
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedTerm);

      return matchesFilter && matchesSearch;
    });
  }, [patientFilter, patients, searchTerm]);

  const scheduledPatients = useMemo(
    () =>
      schedule.map((entry) => ({
        ...entry,
        patient: patients.find((patient) => patient.id === entry.patientId) ?? patients[0]
      })),
    [patients, schedule]
  );

  const sessionsToday = scheduledPatients.length;
  const activePatients = patients.filter(
    (patient) => (DASHBOARD_PATIENT_STATUS[patient.id] ?? "active") === "active"
  ).length;
  const pendingTasks = CLINICIAN_TASKS.filter((task) => task.status === "pending").length;
  const highlightedSearch = searchTerm.trim().length > 0 ? filteredPatients.slice(0, 4) : [];

  return (
    <div className="relative min-h-screen bg-adler-bg text-adler-text xl:h-screen xl:overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(244,114,182,0.12),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.04),transparent_24%)]" />

      <div className="mx-auto grid min-h-screen max-w-[1720px] grid-cols-1 xl:h-screen xl:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="relative border-b border-adler-border bg-adler-sidebar/95 xl:min-h-0 xl:border-b-0 xl:border-r">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.06),transparent_30%)] opacity-70" />
          <div className="adler-scroll relative flex h-full min-h-0 flex-col overflow-y-auto px-5 py-5 md:px-6 md:py-6">
            <div className="flex items-center gap-3 rounded-[24px] border border-white/8 bg-[#12151b]/90 px-4 py-4 shadow-panel">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-[18px] border"
                style={{
                  borderColor: accentBorder,
                  backgroundColor: accentSurface,
                  color: accent
                }}
              >
                <BrainCircuit className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[0.68rem] uppercase tracking-[0.32em] text-adler-subtle">
                  Adler AI
                </p>
                <h1 className="text-lg font-semibold tracking-[-0.03em] text-white">
                  Painel do Clínico
                </h1>
              </div>
            </div>

            <nav className="mt-6 space-y-2">
              {NAV_ITEMS.map((item) => {
                const isActive = item.id === activeSection;
                const Icon = item.icon;

                return (
                  <motion.button
                    key={item.id}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={() => setActiveSection(item.id)}
                    className="relative flex w-full items-center gap-3 overflow-hidden rounded-[18px] px-4 py-3 text-left"
                  >
                    {isActive ? (
                      <motion.span
                        layoutId="dashboard-nav"
                        className="absolute inset-0 rounded-[18px] border"
                        style={{
                          borderColor: accentBorder,
                          backgroundColor: accentSurface
                        }}
                      />
                    ) : null}

                    <div
                      className="relative z-10 flex h-10 w-10 items-center justify-center rounded-[14px] border"
                      style={{
                        borderColor: isActive ? accentBorder : "rgba(255,255,255,0.06)",
                        backgroundColor: isActive
                          ? "rgba(255,255,255,0.05)"
                          : "rgba(255,255,255,0.02)",
                        color: isActive ? accent : "#aeb6c7"
                      }}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <p
                      className="relative z-10 text-sm font-medium tracking-[-0.02em]"
                      style={{ color: isActive ? "#ffffff" : "#d3d8e5" }}
                    >
                      {item.label}
                    </p>
                  </motion.button>
                );
              })}
            </nav>

            <div
              className="mt-6 rounded-[24px] border p-4 shadow-panel"
              style={{
                borderColor: accentBorder,
                background: "linear-gradient(180deg, rgba(18,21,27,0.95), rgba(11,13,17,0.98))",
                boxShadow: `0 0 24px ${accentSurface}`
              }}
            >
              <p className="text-[0.68rem] uppercase tracking-[0.3em] text-adler-subtle">
                Perfil Ativo
              </p>
              <h2 className="mt-3 text-lg font-semibold tracking-[-0.03em] text-white">
                {clinician.name}
              </h2>
              <p className="mt-1 text-sm text-adler-muted">
                {clinician.role} · {clinician.focusLabel}
              </p>
              <div className="mt-4 flex items-center justify-between gap-3 rounded-[18px] border border-white/8 bg-black/10 px-3 py-3">
                <div>
                  <p className="text-[0.62rem] uppercase tracking-[0.22em] text-adler-subtle">
                    Abordagem padrão
                  </p>
                  <p className="mt-1 text-sm font-medium text-white">
                    {clinician.primaryApproachLabel}
                  </p>
                  <p className="mt-1 font-mono text-[0.62rem] uppercase tracking-[0.18em] text-white/42">
                    {clinician.subscriptionTier === "premium"
                      ? "Premium: todas as abordagens"
                      : "Padrao: acesso por abordagem"}
                  </p>
                </div>
                <ShieldCheck className="h-4 w-4" style={{ color: accent }} />
              </div>
              <p className="mt-4 font-mono text-[0.68rem] uppercase tracking-[0.24em] text-white/56">
                {clinician.credentials}
              </p>
            </div>
          </div>
        </aside>

        <div className="flex min-h-screen flex-col xl:h-screen xl:min-h-0 xl:overflow-hidden">
          <header className="border-b border-adler-border bg-adler-bg/80 backdrop-blur-xl">
            <div className="flex flex-col gap-4 px-6 py-5 md:px-8 xl:flex-row xl:items-center xl:justify-between">
              <div className="relative w-full xl:max-w-[520px]">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
                <input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  type="text"
                  placeholder="Buscar paciente, diagnóstico ou protocolo..."
                  className="w-full rounded-full border border-white/8 bg-[#12151b] py-3 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-white/28 focus:border-white/16"
                />
              </div>

              <div className="flex flex-wrap items-center justify-end gap-3 self-end xl:self-auto">
                <div className="flex items-center gap-2 rounded-full border border-white/8 bg-[#12151b] p-1">
                  <button
                    type="button"
                    aria-label="O que e Adler AI"
                    onClick={() => setInfoModal("about")}
                    className="flex h-9 w-9 items-center justify-center rounded-full text-white/62 transition hover:bg-white/8 hover:text-white"
                  >
                    <Info className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    aria-label="Seguranca e privacidade"
                    onClick={() => setInfoModal("security")}
                    className="flex h-9 w-9 items-center justify-center rounded-full text-white/62 transition hover:bg-white/8 hover:text-white"
                  >
                    <ShieldCheck className="h-4 w-4" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setPatientModalOpen(true)}
                  className="inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-white/84 transition hover:bg-white/8"
                >
                  <UserPlus className="h-4 w-4" />
                  Novo paciente
                </button>
                <button
                  type="button"
                  onClick={() => setScheduleModalOpen(true)}
                  className="inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/8"
                  style={{ borderColor: accentBorder, backgroundColor: accentSurface }}
                >
                  <Plus className="h-4 w-4" />
                  Agendar
                </button>
                <button
                  type="button"
                  className="relative flex h-11 w-11 items-center justify-center rounded-full border border-white/8 bg-[#12151b] text-white/64 transition hover:text-white"
                >
                  <Bell className="h-4 w-4" />
                  {clinician.notifications > 0 ? (
                    <span
                      className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: accent }}
                    />
                  ) : null}
                </button>

                <div className="flex items-center gap-3 rounded-full border border-white/8 bg-[#12151b] px-3 py-2.5">
                  <div className="text-right">
                    <p className="text-sm font-semibold tracking-[-0.02em] text-white">
                      {clinician.name}
                    </p>
                    <p className="font-mono text-[0.66rem] uppercase tracking-[0.22em] text-white/45">
                      {clinician.credentials}
                    </p>
                  </div>
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-full border text-sm font-semibold"
                    style={{
                      borderColor: accentBorder,
                      backgroundColor: accentSurface,
                      color: accent
                    }}
                  >
                    {clinician.initials}
                  </div>
                </div>
              </div>
            </div>
          </header>

          <main className="flex-1 px-6 py-5 md:px-8 md:py-6 xl:min-h-0 xl:overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSection}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -18 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                className="adler-scroll h-full overflow-y-auto pr-1"
              >
                {highlightedSearch.length > 0 ? (
                  <section className="mb-6 rounded-[26px] border border-adler-border bg-adler-panel/78 p-5 shadow-panel">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-[0.68rem] uppercase tracking-[0.3em] text-adler-subtle">
                          Busca rápida
                        </p>
                        <h2 className="mt-2 text-lg font-semibold tracking-[-0.03em] text-white">
                          Resultados encontrados
                        </h2>
                      </div>
                      <p className="font-mono text-xs text-adler-muted">
                        {filteredPatients.length} correspondências
                      </p>
                    </div>

                    <div className="mt-4 grid gap-3 xl:grid-cols-2">
                      {highlightedSearch.map((patient) => (
                        <button
                          key={patient.id}
                          type="button"
                          onClick={() => onOpenWorkspace(patient.id)}
                          className="flex items-center justify-between rounded-[20px] border border-white/8 bg-[#12151b]/90 px-4 py-4 text-left transition hover:border-white/14"
                        >
                          <div>
                            <p className="text-sm font-semibold text-white">{patient.name}</p>
                            <p className="mt-1 text-sm text-adler-muted">{patient.focus}</p>
                          </div>
                          <ChevronRight className="h-4 w-4 text-white/42" />
                        </button>
                      ))}
                    </div>
                  </section>
                ) : null}

                {activeSection === "home" ? (
                  <HomeSection
                    accent={accent}
                    accentBorder={accentBorder}
                    accentSurface={accentSurface}
                    clinician={clinician}
                    notesDraft={notesDraft}
                    onNotesDraftChange={setNotesDraft}
                    onOpenWorkspace={onOpenWorkspace}
                    pendingTasks={pendingTasks}
                    scheduledPatients={scheduledPatients}
                    sessionsToday={sessionsToday}
                    tasks={CLINICIAN_TASKS}
                    activePatients={activePatients}
                  />
                ) : null}

                {activeSection === "patients" ? (
                  <PatientsSection
                    accent={accent}
                    accentBorder={accentBorder}
                    accentSurface={accentSurface}
                    filteredPatients={filteredPatients}
                    onOpenNewPatient={() => setPatientModalOpen(true)}
                    onOpenWorkspace={onOpenWorkspace}
                    patientFilter={patientFilter}
                    setPatientFilter={setPatientFilter}
                  />
                ) : null}

                {activeSection === "schedule" ? (
                  <ScheduleSection
                    accent={accent}
                    accentBorder={accentBorder}
                    onOpenSchedule={() => setScheduleModalOpen(true)}
                    scheduledPatients={scheduledPatients}
                    onOpenWorkspace={onOpenWorkspace}
                  />
                ) : null}

                {activeSection === "dsm" ? (
                  <DsmSearchPanel
                    accent={accent}
                    accentBorder={accentBorder}
                    accentSurface={accentSurface}
                  />
                ) : null}

                {activeSection === "documents" ? (
                  <DocumentsCenterPanel
                    accent={accent}
                    accentBorder={accentBorder}
                    accentSurface={accentSurface}
                    clinician={clinician}
                    patients={patients}
                  />
                ) : null}

                {activeSection === "settings" ? (
                  <SettingsSection
                    accent={accent}
                    accentBorder={accentBorder}
                    accentSurface={accentSurface}
                    clinician={clinician}
                  />
                ) : null}

                {activeSection === "subscription" ? (
                  <SubscriptionPanel
                    accent={accent}
                    accentBorder={accentBorder}
                    accentSurface={accentSurface}
                    clinician={clinician}
                  />
                ) : null}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>

      <AnimatePresence>
        {isPatientModalOpen ? (
          <PatientDialog
            accent={accent}
            accentBorder={accentBorder}
            accentSurface={accentSurface}
            onClose={() => setPatientModalOpen(false)}
            onSubmit={(draft) => {
              const patientId = onCreatePatient(draft);
              setPatientModalOpen(false);
              onOpenWorkspace(patientId);
            }}
          />
        ) : null}

        {infoModal ? (
          <InfoDialog
            accent={accent}
            mode={infoModal}
            onClose={() => setInfoModal(null)}
          />
        ) : null}

        {isScheduleModalOpen ? (
          <ScheduleDialog
            accent={accent}
            accentBorder={accentBorder}
            accentSurface={accentSurface}
            onClose={() => setScheduleModalOpen(false)}
            onCreateAppointment={onCreateAppointment}
            onCreatePatient={onCreatePatient}
            patients={patients}
          />
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function HomeSection({
  accent,
  accentBorder,
  accentSurface,
  clinician,
  notesDraft,
  onNotesDraftChange,
  onOpenWorkspace,
  pendingTasks,
  scheduledPatients,
  sessionsToday,
  tasks,
  activePatients
}: {
  accent: string;
  accentBorder: string;
  accentSurface: string;
  clinician: ClinicianProfile;
  notesDraft: string;
  onNotesDraftChange: (value: string) => void;
  onOpenWorkspace: (patientId: string) => void;
  pendingTasks: number;
  scheduledPatients: Array<ClinicianScheduleItem & { patient: PatientRecord }>;
  sessionsToday: number;
  tasks: typeof CLINICIAN_TASKS;
  activePatients: number;
}) {
  return (
    <div className="space-y-6">
      <section
        className="rounded-[30px] border p-6 shadow-panel md:p-7"
        style={{
          borderColor: accentBorder,
          background:
            "linear-gradient(180deg, rgba(18,21,27,0.96), rgba(11,13,17,0.98))",
          boxShadow: `0 0 28px ${accentSurface}`
        }}
      >
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_320px]">
          <div>
            <p className="text-[0.68rem] uppercase tracking-[0.34em] text-adler-subtle">
              Sessão autenticada
            </p>
            <h2 className="mt-3 text-[1.9rem] font-semibold tracking-[-0.05em] text-white md:text-[2.2rem]">
              {clinician.name}, você tem {sessionsToday} sessões hoje.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-adler-muted">
              A agenda do dia já foi organizada com sua abordagem padrão em{" "}
              {clinician.primaryApproachLabel.toLowerCase()}. Use a busca global para
              encontrar qualquer paciente e entre na sessão somente quando quiser abrir
              o prontuário completo.
            </p>
          </div>

          <div className="grid gap-3">
            <MetricTile label="Sessões hoje" value={`${sessionsToday}`} />
            <MetricTile label="Pacientes ativos" value={`${activePatients}`} />
            <MetricTile label="Pendências clínicas" value={`${pendingTasks}`} />
          </div>
        </div>
      </section>

      <div className="grid gap-6 2xl:grid-cols-[minmax(0,1.2fr)_380px]">
        <section className="rounded-[28px] border border-adler-border bg-adler-panel/82 p-5 shadow-panel md:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[0.68rem] uppercase tracking-[0.32em] text-adler-subtle">
                Agenda do dia
              </p>
              <h3 className="mt-2 text-xl font-semibold tracking-[-0.04em] text-white">
                Sessões organizadas para preparação rápida
              </h3>
            </div>
            <span
              className="rounded-full border px-3 py-1.5 font-mono text-[0.66rem] uppercase tracking-[0.2em]"
              style={{
                color: accent,
                borderColor: accentBorder,
                backgroundColor: accentSurface
              }}
            >
              {sessionsToday} atendimentos
            </span>
          </div>

          <div className="mt-5 space-y-3">
            {scheduledPatients.map((entry) => (
              <button
                key={`${entry.patientId}-${entry.time}`}
                type="button"
                onClick={() => onOpenWorkspace(entry.patientId)}
                className="flex w-full flex-col gap-4 rounded-[22px] border border-white/8 bg-[#12151b]/92 px-4 py-4 text-left transition hover:border-white/14 md:flex-row md:items-center md:justify-between"
                style={{
                  boxShadow:
                    entry.status === "next" ? `0 0 0 1px ${accentBorder}` : "none"
                }}
              >
                <div className="flex items-start gap-4">
                  <div className="w-[64px] shrink-0 font-mono text-sm text-white/46">
                    {entry.time}
                  </div>
                  <div
                    className="mt-1 h-10 w-1 rounded-full"
                    style={{
                      backgroundColor:
                        entry.status === "next" ? accent : "rgba(255,255,255,0.08)",
                      boxShadow:
                        entry.status === "next"
                          ? `0 0 12px ${accentSurface}`
                          : "none"
                    }}
                  />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-base font-semibold tracking-[-0.02em] text-white">
                        {entry.patient.name}
                      </p>
                      <span className="rounded-full border border-white/8 px-2.5 py-1 font-mono text-[0.62rem] uppercase tracking-[0.2em] text-white/52">
                        {entry.sessionLabel}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-adler-muted">
                      {entry.mode} · {entry.roomLabel} · {entry.duration}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-white/78">{entry.prepNote}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 md:justify-end">
                  <span
                    className="rounded-full border px-3 py-1.5 text-[0.62rem] font-medium uppercase tracking-[0.22em]"
                    style={resolveSessionPill(entry.status, accent, accentBorder, accentSurface)}
                  >
                    {entry.status === "next"
                      ? "Próxima"
                      : entry.status === "completed"
                        ? "Concluída"
                        : "Agendada"}
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-2 text-xs font-medium text-white/82">
                    Ir para Sessão
                    <ChevronRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-[28px] border border-adler-border bg-adler-panel/82 p-5 shadow-panel md:p-6">
          <p className="text-[0.68rem] uppercase tracking-[0.32em] text-adler-subtle">
            Anotações e tarefas
          </p>
          <h3 className="mt-2 text-xl font-semibold tracking-[-0.04em] text-white">
            Preparação mental do dia
          </h3>

          <textarea
            value={notesDraft}
            onChange={(event) => onNotesDraftChange(event.target.value)}
            className="mt-5 min-h-[220px] w-full rounded-[22px] border border-white/8 bg-[#12151b] px-4 py-4 text-sm leading-7 text-white/84 outline-none transition placeholder:text-white/20 focus:border-white/14"
          />

          <div className="mt-5 space-y-3">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="flex items-start gap-3 rounded-[18px] border border-white/8 bg-[#12151b]/92 px-4 py-3"
              >
                <div
                  className="mt-1 h-2.5 w-2.5 rounded-full"
                  style={{
                    backgroundColor: task.status === "done" ? "#34d399" : accent
                  }}
                />
                <div className="min-w-0">
                  <p className="text-sm leading-6 text-white/84">{task.label}</p>
                  <p className="mt-1 font-mono text-[0.62rem] uppercase tracking-[0.2em] text-white/36">
                    {task.priority} · {task.status === "done" ? "concluído" : "pendente"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function PatientsSection({
  accent,
  accentBorder,
  accentSurface,
  filteredPatients,
  onOpenNewPatient,
  onOpenWorkspace,
  patientFilter,
  setPatientFilter
}: {
  accent: string;
  accentBorder: string;
  accentSurface: string;
  filteredPatients: PatientRecord[];
  onOpenNewPatient: () => void;
  onOpenWorkspace: (patientId: string) => void;
  patientFilter: "active" | "all" | "inactive";
  setPatientFilter: (value: "active" | "all" | "inactive") => void;
}) {
  const filters: Array<{ id: "active" | "all" | "inactive"; label: string }> = [
    { id: "all", label: "Todos" },
    { id: "active", label: "Ativos" },
    { id: "inactive", label: "Inativos" }
  ];

  return (
    <section className="rounded-[28px] border border-adler-border bg-adler-panel/82 p-5 shadow-panel md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[0.68rem] uppercase tracking-[0.32em] text-adler-subtle">
            Pacientes
          </p>
          <h2 className="mt-2 text-[1.55rem] font-semibold tracking-[-0.04em] text-white">
            Seleção de prontuário
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-adler-muted">
            Aqui o clínico escolhe com calma qual caso deseja abrir, sem expor a
            lateral do prontuário logo na entrada do sistema.
          </p>
        </div>

        <div className="flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={onOpenNewPatient}
            className="inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-white/8"
            style={{ borderColor: accentBorder, backgroundColor: accentSurface }}
          >
            <UserPlus className="h-3.5 w-3.5" />
            Adicionar
          </button>
          {filters.map((filter) => {
            const isActive = filter.id === patientFilter;

            return (
              <button
                key={filter.id}
                type="button"
                onClick={() => setPatientFilter(filter.id)}
                className="rounded-full border px-3 py-2 text-xs font-medium uppercase tracking-[0.2em] transition"
                style={{
                  color: isActive ? accent : "#c8cedb",
                  borderColor: isActive ? accentBorder : "rgba(255,255,255,0.08)",
                  backgroundColor: isActive ? accentSurface : "rgba(255,255,255,0.03)"
                }}
              >
                {filter.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-5 grid gap-3 xl:grid-cols-2">
        {filteredPatients.map((patient) => {
          const status = DASHBOARD_PATIENT_STATUS[patient.id] ?? "active";

          return (
            <button
              key={patient.id}
              type="button"
              onClick={() => onOpenWorkspace(patient.id)}
              className="flex items-start justify-between gap-4 rounded-[22px] border border-white/8 bg-[#12151b]/92 px-4 py-4 text-left transition hover:border-white/14"
            >
              <div className="flex items-start gap-4">
                <div
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border text-sm font-semibold"
                  style={{
                    borderColor: accentBorder,
                    backgroundColor: accentSurface,
                    color: accent
                  }}
                >
                  {patient.initials}
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-base font-semibold text-white">{patient.name}</p>
                    <span
                      className="rounded-full border px-2.5 py-1 font-mono text-[0.62rem] uppercase tracking-[0.18em]"
                      style={resolvePatientStatusPill(status)}
                    >
                      {status === "active" ? "ativo" : "inativo"}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-adler-muted">{patient.focus}</p>
                  <p className="mt-3 text-sm leading-6 text-white/76">
                    {patient.currentProtocol}
                  </p>
                </div>
              </div>

              <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-white/38" />
            </button>
          );
        })}
      </div>
    </section>
  );
}

function ScheduleSection({
  accent,
  accentBorder,
  onOpenSchedule,
  scheduledPatients,
  onOpenWorkspace
}: {
  accent: string;
  accentBorder: string;
  onOpenSchedule: () => void;
  scheduledPatients: Array<ClinicianScheduleItem & { patient: PatientRecord }>;
  onOpenWorkspace: (patientId: string) => void;
}) {
  return (
    <section className="rounded-[28px] border border-adler-border bg-adler-panel/82 p-5 shadow-panel md:p-6">
      <p className="text-[0.68rem] uppercase tracking-[0.32em] text-adler-subtle">
        Agenda
      </p>
      <h2 className="mt-2 text-[1.55rem] font-semibold tracking-[-0.04em] text-white">
        Linha do dia clínico
      </h2>

      <button
        type="button"
        onClick={onOpenSchedule}
        className="mt-5 inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/8"
        style={{ borderColor: accentBorder, backgroundColor: "rgba(244,114,182,0.12)" }}
      >
        <Plus className="h-4 w-4" />
        Agendar paciente
      </button>

      <div className="mt-5 space-y-4">
        {scheduledPatients.map((entry) => (
          <div
            key={`${entry.patientId}-${entry.time}`}
            className="grid gap-4 rounded-[24px] border border-white/8 bg-[#12151b]/92 px-4 py-4 xl:grid-cols-[80px_minmax(0,1fr)_180px]"
          >
            <div className="font-mono text-sm text-white/46">{entry.time}</div>
            <div>
              <p className="text-base font-semibold text-white">{entry.patient.name}</p>
              <p className="mt-1 text-sm text-adler-muted">
                {entry.sessionLabel} · {entry.mode} · {entry.roomLabel}
              </p>
              <p className="mt-3 text-sm leading-6 text-white/76">{entry.prepNote}</p>
            </div>
            <div className="flex items-center justify-between gap-3 xl:justify-end">
              <span
                className="rounded-full border px-3 py-1.5 text-[0.62rem] uppercase tracking-[0.2em]"
                style={{
                  color: entry.status === "next" ? accent : "#d0d7e5",
                  borderColor:
                    entry.status === "next" ? accentBorder : "rgba(255,255,255,0.08)",
                  backgroundColor:
                    entry.status === "next"
                      ? "rgba(244,114,182,0.12)"
                      : "rgba(255,255,255,0.03)"
                }}
              >
                {entry.duration}
              </span>
              <button
                type="button"
                onClick={() => onOpenWorkspace(entry.patientId)}
                className="rounded-full border border-white/8 bg-white/4 px-3 py-2 text-xs font-medium text-white/84 transition hover:bg-white/8"
              >
                Abrir prontuário
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function PatientDialog({
  accent,
  accentBorder,
  accentSurface,
  onClose,
  onSubmit
}: {
  accent: string;
  accentBorder: string;
  accentSurface: string;
  onClose: () => void;
  onSubmit: (draft: NewPatientDraft) => void;
}) {
  const [draft, setDraft] = useState<NewPatientDraft>({
    currentProtocol: "Terapia do Esquema + formulacao inicial",
    diagnosis: "",
    focus: "",
    name: ""
  });

  return (
    <DialogShell onClose={onClose}>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (!draft.name.trim()) return;
          onSubmit(draft);
        }}
        className="w-full max-w-2xl rounded-[28px] border bg-[#0f131a] p-6 shadow-panel"
        style={{ borderColor: accentBorder, boxShadow: `0 0 34px ${accentSurface}` }}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-[0.68rem] uppercase tracking-[0.32em] text-adler-subtle">
              Novo paciente
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-white">
              Criar prontuario clinico
            </h2>
            <p className="mt-3 text-sm leading-6 text-adler-muted">
              Perfil minimo para abrir agenda, captura de sessao e linha clinica.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/8 bg-white/[0.04] px-3 py-2 text-sm text-white/64 transition hover:text-white"
          >
            Fechar
          </button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <FormField
            label="Nome do paciente"
            required
            value={draft.name}
            onChange={(value) => setDraft((current) => ({ ...current, name: value }))}
            placeholder="Ex: Marina A."
          />
          <FormField
            label="Foco clinico"
            value={draft.focus ?? ""}
            onChange={(value) => setDraft((current) => ({ ...current, focus: value }))}
            placeholder="Ex: ansiedade social / sono"
          />
          <FormField
            label="Hipotese diagnostica"
            value={draft.diagnosis ?? ""}
            onChange={(value) => setDraft((current) => ({ ...current, diagnosis: value }))}
            placeholder="Ex: TAG em investigacao"
          />
          <FormField
            label="Protocolo inicial"
            value={draft.currentProtocol ?? ""}
            onChange={(value) =>
              setDraft((current) => ({ ...current, currentProtocol: value }))
            }
            placeholder="Ex: schema therapy + psicoeducacao"
          />
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-full border px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/8"
            style={{ borderColor: accentBorder, backgroundColor: accentSurface }}
          >
            <UserPlus className="h-4 w-4" />
            Criar e abrir prontuario
          </button>
        </div>
      </form>
    </DialogShell>
  );
}

function ScheduleDialog({
  accent,
  accentBorder,
  accentSurface,
  onClose,
  onCreateAppointment,
  onCreatePatient,
  patients
}: {
  accent: string;
  accentBorder: string;
  accentSurface: string;
  onClose: () => void;
  onCreateAppointment: (appointment: ClinicianScheduleItem) => void;
  onCreatePatient: (patient: NewPatientDraft) => string;
  patients: PatientRecord[];
}) {
  const [patientMode, setPatientMode] = useState<"existing" | "new">("existing");
  const [patientId, setPatientId] = useState(patients[0]?.id ?? "");
  const [newPatient, setNewPatient] = useState<NewPatientDraft>({
    currentProtocol: "Triagem clinica + plano inicial",
    diagnosis: "",
    focus: "",
    name: ""
  });
  const [appointment, setAppointment] = useState({
    duration: "50 min",
    mode: "Online",
    prepNote: "",
    roomLabel: "Sala Adler",
    sessionLabel: "Sessao inicial",
    time: "10:00"
  });

  return (
    <DialogShell onClose={onClose}>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          let targetPatientId = patientId;
          if (patientMode === "new") {
            if (!newPatient.name.trim()) return;
            targetPatientId = onCreatePatient(newPatient);
          }

          onCreateAppointment({
            patientId: targetPatientId,
            duration: appointment.duration,
            mode: appointment.mode,
            prepNote:
              appointment.prepNote.trim() ||
              "Revisar demanda inicial e alinhar objetivos da sessao.",
            roomLabel: appointment.roomLabel,
            sessionLabel: appointment.sessionLabel,
            status: "scheduled",
            time: appointment.time
          });
          onClose();
        }}
        className="adler-scroll max-h-[88vh] w-full max-w-3xl overflow-y-auto rounded-[28px] border bg-[#0f131a] p-6 shadow-panel"
        style={{ borderColor: accentBorder, boxShadow: `0 0 34px ${accentSurface}` }}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-[0.68rem] uppercase tracking-[0.32em] text-adler-subtle">
              Agenda
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-white">
              Agendar paciente
            </h2>
            <p className="mt-3 text-sm leading-6 text-adler-muted">
              Use paciente existente ou crie um perfil automaticamente no ato do
              agendamento.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/8 bg-white/[0.04] px-3 py-2 text-sm text-white/64 transition hover:text-white"
          >
            Fechar
          </button>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {[
            { label: "Paciente existente", value: "existing" },
            { label: "Criar novo perfil", value: "new" }
          ].map((option) => {
            const isActive = patientMode === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setPatientMode(option.value as "existing" | "new")}
                className="rounded-full border px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em]"
                style={{
                  color: isActive ? accent : "#c8cedb",
                  borderColor: isActive ? accentBorder : "rgba(255,255,255,0.08)",
                  backgroundColor: isActive ? accentSurface : "rgba(255,255,255,0.03)"
                }}
              >
                {option.label}
              </button>
            );
          })}
        </div>

        {patientMode === "existing" ? (
          <label className="mt-5 block">
            <span className="text-[0.64rem] uppercase tracking-[0.22em] text-adler-subtle">
              Paciente
            </span>
            <select
              value={patientId}
              onChange={(event) => setPatientId(event.target.value)}
              className="mt-2 w-full rounded-[16px] border border-white/8 bg-[#090a0c] px-3 py-3 text-sm text-white outline-none focus:border-white/18"
            >
              {patients.map((patient) => (
                <option key={patient.id} value={patient.id}>
                  {patient.name} - {patient.focus}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <FormField
              label="Nome do paciente"
              required
              value={newPatient.name}
              onChange={(value) =>
                setNewPatient((current) => ({ ...current, name: value }))
              }
              placeholder="Ex: Marina A."
            />
            <FormField
              label="Foco clinico"
              value={newPatient.focus ?? ""}
              onChange={(value) =>
                setNewPatient((current) => ({ ...current, focus: value }))
              }
              placeholder="Ex: dependencia quimica / reducao de danos"
            />
            <FormField
              label="Hipotese diagnostica"
              value={newPatient.diagnosis ?? ""}
              onChange={(value) =>
                setNewPatient((current) => ({ ...current, diagnosis: value }))
              }
              placeholder="Ex: uso de alcool em investigacao"
            />
            <FormField
              label="Protocolo inicial"
              value={newPatient.currentProtocol ?? ""}
              onChange={(value) =>
                setNewPatient((current) => ({ ...current, currentProtocol: value }))
              }
              placeholder="Ex: entrevista motivacional + seguranca"
            />
          </div>
        )}

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <FormField
            label="Horario"
            type="time"
            value={appointment.time}
            onChange={(value) => setAppointment((current) => ({ ...current, time: value }))}
          />
          <FormField
            label="Duracao"
            value={appointment.duration}
            onChange={(value) =>
              setAppointment((current) => ({ ...current, duration: value }))
            }
          />
          <FormField
            label="Modalidade"
            value={appointment.mode}
            onChange={(value) => setAppointment((current) => ({ ...current, mode: value }))}
          />
          <FormField
            label="Sala"
            value={appointment.roomLabel}
            onChange={(value) =>
              setAppointment((current) => ({ ...current, roomLabel: value }))
            }
          />
          <FormField
            label="Tipo de sessao"
            value={appointment.sessionLabel}
            onChange={(value) =>
              setAppointment((current) => ({ ...current, sessionLabel: value }))
            }
          />
          <TextAreaField
            label="Nota de preparo"
            value={appointment.prepNote}
            onChange={(value) =>
              setAppointment((current) => ({ ...current, prepNote: value }))
            }
            placeholder="O que o clinico deve revisar antes da sessao?"
          />
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-full border px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/8"
            style={{ borderColor: accentBorder, backgroundColor: accentSurface }}
          >
            <CalendarDays className="h-4 w-4" />
            Confirmar agendamento
          </button>
        </div>
      </form>
    </DialogShell>
  );
}

function InfoDialog({
  accent,
  mode,
  onClose
}: {
  accent: string;
  mode: "about" | "security";
  onClose: () => void;
}) {
  const isSecurity = mode === "security";
  const title = isSecurity ? "Seguranca & Privacidade" : "Adler AI";
  const eyebrow = isSecurity ? "Camada de confianca" : "Proposta de valor";
  const description = isSecurity
    ? "O Adler AI foi projetado para proteger dados sensiveis de saude mental com isolamento, auditoria e controle de acesso."
    : "Inteligencia clinica que amplifica o cuidado em saude mental sem substituir o julgamento clinico.";
  const items = isSecurity
    ? [
        {
          icon: Database,
          title: "Isolamento de Dados",
          text: "Dados clinicos separados por clinico/clinica e preparados para multi-tenant."
        },
        {
          icon: Lock,
          title: "Criptografia End-to-End",
          text: "Arquitetura pensada para trafego seguro e armazenamento protegido."
        },
        {
          icon: Eye,
          title: "Trilha de Auditoria",
          text: "Registro de acessos, edicoes, documentos e consultas sensiveis."
        },
        {
          icon: FileCheck2,
          title: "Consentimento Informado",
          text: "Base para termos, permissao de captura e compartilhamento minimo necessario."
        },
        {
          icon: ShieldCheck,
          title: "IA Separada do Treinamento",
          text: "Dados clinicos nao devem alimentar treinamento generativo sem autorizacao."
        },
        {
          icon: Users,
          title: "Controle por Perfil",
          text: "Perfis de acesso para clinico, supervisor, administrativo e equipe."
        }
      ]
    : [
        {
          icon: BrainCircuit,
          title: "Abordagem Multiparadigmatica",
          text: "Psiquiatria, TCC, Terapia do Esquema, Psicanalise, Terapia de Casal, Psicoterapia Generalista e Sistemica sobre a mesma base clinica."
        },
        {
          icon: CalendarDays,
          title: "Analise Longitudinal",
          text: "Evolucao do paciente ao longo de sessoes, escalas, agenda e transcricoes."
        },
        {
          icon: Sparkles,
          title: "Apoio a Decisao Clinica",
          text: "Insights para formulacao, planejamento e checagem de risco."
        },
        {
          icon: FileCheck2,
          title: "Explicabilidade por Evidencia",
          text: "Sugestoes acompanhadas por documentos, fontes e nivel de confianca."
        },
        {
          icon: Database,
          title: "Farmacologia e Exames",
          text: "Medicamentos, interacoes, exames e farmacogenetica organizados para co-manejo."
        },
        {
          icon: ShieldCheck,
          title: "Seguranca de Grau Clinico",
          text: "Sigilo, rastreabilidade e separacao de dados como premissas do produto."
        }
      ];

  return (
    <DialogShell onClose={onClose}>
      <motion.section
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.98 }}
        transition={{ duration: 0.2 }}
        className="adler-scroll max-h-[88vh] w-full max-w-4xl overflow-y-auto rounded-[28px] border border-white/8 bg-[#0f131a] p-6 shadow-panel md:p-7"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-[0.68rem] uppercase tracking-[0.34em]" style={{ color: accent }}>
              {eyebrow}
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-[-0.05em] text-white">
              {title}
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-adler-muted">
              {description}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/8 bg-white/[0.04] px-3 py-2 text-sm text-white/64 transition hover:text-white"
          >
            Fechar
          </button>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-2">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <article
                key={item.title}
                className="rounded-[20px] border border-white/8 bg-[#121722]/72 p-4"
              >
                <Icon className="h-5 w-5" style={{ color: accent }} />
                <h3 className="mt-4 text-base font-semibold text-white">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-adler-muted">{item.text}</p>
              </article>
            );
          })}
        </div>
      </motion.section>
    </DialogShell>
  );
}

function DialogShell({
  children,
  onClose
}: {
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/72 px-4 py-6 backdrop-blur-xl"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      {children}
    </motion.div>
  );
}

function FormField({
  label,
  onChange,
  placeholder,
  required,
  type = "text",
  value
}: {
  label: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  type?: string;
  value: string;
}) {
  return (
    <label className="block">
      <span className="text-[0.64rem] uppercase tracking-[0.22em] text-adler-subtle">
        {label}
      </span>
      <input
        required={required}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-2 w-full rounded-[16px] border border-white/8 bg-[#090a0c] px-3 py-3 text-sm text-white outline-none placeholder:text-white/28 focus:border-white/18"
      />
    </label>
  );
}

function TextAreaField({
  label,
  onChange,
  placeholder,
  value
}: {
  label: string;
  onChange: (value: string) => void;
  placeholder?: string;
  value: string;
}) {
  return (
    <label className="block">
      <span className="text-[0.64rem] uppercase tracking-[0.22em] text-adler-subtle">
        {label}
      </span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-2 min-h-[104px] w-full rounded-[16px] border border-white/8 bg-[#090a0c] px-3 py-3 text-sm leading-6 text-white outline-none placeholder:text-white/28 focus:border-white/18"
      />
    </label>
  );
}

function SettingsSection({
  accentBorder,
  accentSurface,
  clinician
}: {
  accent: string;
  accentBorder: string;
  accentSurface: string;
  clinician: ClinicianProfile;
}) {
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_340px]">
      <section className="rounded-[28px] border border-adler-border bg-adler-panel/82 p-5 shadow-panel md:p-6">
        <p className="text-[0.68rem] uppercase tracking-[0.32em] text-adler-subtle">
          Configurações
        </p>
        <h2 className="mt-2 text-[1.55rem] font-semibold tracking-[-0.04em] text-white">
          Perfil profissional do Adler
        </h2>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <SettingCard label="Nome clínico" value={clinician.name} />
          <SettingCard label="Registro profissional" value={clinician.credentials} />
          <SettingCard label="Função" value={clinician.role} />
          <SettingCard label="Abordagem do onboarding" value={clinician.primaryApproachLabel} />
          <SettingCard
            label="Plano de acesso"
            value={
              clinician.subscriptionTier === "premium"
                ? "Premium: todas as abordagens"
                : "Padrao: somente abordagem cadastrada"
            }
          />
        </div>
      </section>

      <section
        className="rounded-[28px] border p-5 shadow-panel"
        style={{
          borderColor: accentBorder,
          background:
            "linear-gradient(180deg, rgba(18,21,27,0.96), rgba(11,13,17,0.98))",
          boxShadow: `0 0 24px ${accentSurface}`
        }}
      >
        <p className="text-[0.68rem] uppercase tracking-[0.32em] text-adler-subtle">
          Preferência aplicada
        </p>
        <h3 className="mt-2 text-lg font-semibold tracking-[-0.03em] text-white">
          Abordagem padrão preservada
        </h3>
        <p className="mt-3 text-sm leading-6 text-adler-muted">
          O painel inicial já nasce orientado pela abordagem escolhida no cadastro do
          clínico. No plano padrão, essa lente fica fixa; no Premium, o seletor
          libera todas as abordagens.
        </p>
      </section>
    </div>
  );
}

function MetricTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[18px] border border-white/8 bg-[#12151b]/92 px-4 py-4">
      <p className="text-[0.66rem] uppercase tracking-[0.22em] text-adler-subtle">
        {label}
      </p>
      <p className="mt-2 font-mono text-xl font-semibold text-white">{value}</p>
    </div>
  );
}

function SettingCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[20px] border border-white/8 bg-[#12151b]/92 px-4 py-4">
      <p className="text-[0.66rem] uppercase tracking-[0.22em] text-adler-subtle">
        {label}
      </p>
      <p className="mt-2 text-sm leading-6 text-white/84">{value}</p>
    </div>
  );
}

function resolveSessionPill(
  status: "completed" | "next" | "scheduled",
  accent: string,
  accentBorder: string,
  accentSurface: string
) {
  if (status === "completed") {
    return {
      color: "#34d399",
      borderColor: "rgba(52,211,153,0.22)",
      backgroundColor: "rgba(52,211,153,0.1)"
    };
  }

  if (status === "next") {
    return {
      color: accent,
      borderColor: accentBorder,
      backgroundColor: accentSurface
    };
  }

  return {
    color: "#d2d8e4",
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(255,255,255,0.03)"
  };
}

function resolvePatientStatusPill(status: "active" | "inactive") {
  if (status === "inactive") {
    return {
      color: "#f59e0b",
      borderColor: "rgba(245,158,11,0.24)",
      backgroundColor: "rgba(245,158,11,0.1)"
    };
  }

  return {
    color: "#34d399",
    borderColor: "rgba(52,211,153,0.22)",
    backgroundColor: "rgba(52,211,153,0.1)"
  };
}
