import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  Bell,
  BookOpenText,
  BrainCircuit,
  CalendarDays,
  CreditCard,
  FileText,
  Home,
  Info,
  Plus,
  Search,
  Settings2,
  ShieldCheck,
  UserPlus,
  Users,
  X
} from "lucide-react";
import type { ClinicianProfile, ClinicianScheduleItem } from "../data/clinicianData";
import {
  CLINICIAN_TASKS,
  DASHBOARD_PATIENT_STATUS,
  DEFAULT_CLINICIAN_NOTEPAD
} from "../data/clinicianData";
import type { PatientRecord } from "../data/patientData";
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
  | "patients"
  | "schedule"
  | "dsm"
  | "documents"
  | "subscription"
  | "settings";

type CleanClinicianDashboardProps = {
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
  icon: LucideIcon;
  label: string;
}> = [
  { id: "home", icon: Home, label: "Início" },
  { id: "patients", icon: Users, label: "Pacientes" },
  { id: "schedule", icon: CalendarDays, label: "Agenda" },
  { id: "dsm", icon: BookOpenText, label: "DSM" },
  { id: "documents", icon: FileText, label: "Documentos" },
  { id: "subscription", icon: CreditCard, label: "Assinatura" },
  { id: "settings", icon: Settings2, label: "Configurações" }
];

export function CleanClinicianDashboard({
  accent,
  accentBorder,
  accentSurface,
  clinician,
  onCreateAppointment,
  onCreatePatient,
  onOpenWorkspace,
  patients,
  schedule
}: CleanClinicianDashboardProps) {
  const [activeSection, setActiveSection] = useState<DashboardSection>("home");
  const [infoModal, setInfoModal] = useState<"about" | "security" | null>(null);
  const [isPatientModalOpen, setPatientModalOpen] = useState(false);
  const [isScheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [notesDraft, setNotesDraft] = useState(DEFAULT_CLINICIAN_NOTEPAD);
  const [patientFilter, setPatientFilter] = useState<"all" | "active" | "inactive">("all");

  const filteredPatients = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return patients.filter((patient) => {
      const status = DASHBOARD_PATIENT_STATUS[patient.id] ?? "active";
      const matchesStatus = patientFilter === "all" || status === patientFilter;
      const matchesSearch =
        !term ||
        [patient.name, patient.focus, patient.diagnosis, patient.currentProtocol]
          .join(" ")
          .toLowerCase()
          .includes(term);

      return matchesStatus && matchesSearch;
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

  const activePatients = patients.filter(
    (patient) => (DASHBOARD_PATIENT_STATUS[patient.id] ?? "active") === "active"
  ).length;
  const pendingTasks = CLINICIAN_TASKS.filter((task) => task.status === "pending").length;
  const searchResults = searchTerm.trim() ? filteredPatients.slice(0, 5) : [];

  return (
    <div className="h-screen overflow-hidden bg-adler-bg text-adler-text">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_84%_0%,rgba(244,114,182,0.09),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.025),transparent_28%)]" />

      <div className="relative grid h-full grid-cols-[244px_minmax(0,1fr)]">
        <aside className="flex min-h-0 flex-col border-r border-adler-border bg-[#0b0d11]">
          <div className="px-5 py-5">
            <div className="flex items-center gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-2xl border"
                style={{ borderColor: accentBorder, backgroundColor: accentSurface, color: accent }}
              >
                <BrainCircuit className="h-5 w-5" />
              </div>
              <div>
                <p className="font-mono text-[0.62rem] uppercase tracking-[0.28em] text-adler-subtle">
                  Adler AI
                </p>
                <h1 className="text-base font-semibold text-white">Painel clínico</h1>
              </div>
            </div>
          </div>

          <nav className="adler-scroll flex-1 overflow-y-auto px-3 py-2">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveSection(item.id)}
                  className="group relative mb-1 flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm transition"
                  style={{
                    color: isActive ? "#ffffff" : "#9aa3b4",
                    backgroundColor: isActive ? "rgba(255,255,255,0.055)" : "transparent"
                  }}
                >
                  <span
                    className="flex h-9 w-9 items-center justify-center rounded-xl border transition"
                    style={{
                      borderColor: isActive ? accentBorder : "rgba(255,255,255,0.07)",
                      backgroundColor: isActive ? accentSurface : "rgba(255,255,255,0.02)",
                      color: isActive ? accent : "#81899a"
                    }}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="border-t border-adler-border p-4">
            <div className="rounded-3xl border border-white/8 bg-[#101319] p-4">
              <p className="text-sm font-semibold text-white">{clinician.name}</p>
              <p className="mt-1 font-mono text-[0.64rem] uppercase tracking-[0.2em] text-adler-subtle">
                {clinician.credentials}
              </p>
              <div className="mt-3 rounded-2xl border border-white/8 bg-black/10 px-3 py-2">
                <p className="text-xs text-adler-muted">{clinician.primaryApproachLabel}</p>
                <p className="mt-1 font-mono text-[0.58rem] uppercase tracking-[0.18em] text-white/38">
                  {clinician.subscriptionTier === "premium" ? "Premium" : "Plano padrão"}
                </p>
              </div>
            </div>
          </div>
        </aside>

        <section className="flex min-h-0 flex-col">
          <header className="border-b border-adler-border bg-adler-bg/86 px-6 py-4 backdrop-blur-xl">
            <div className="flex items-center gap-4">
              <div className="relative max-w-xl flex-1">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/32" />
                <input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Buscar paciente, diagnóstico ou protocolo..."
                  className="h-11 w-full rounded-full border border-white/8 bg-[#101319] pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-white/18"
                />

                {searchResults.length ? (
                  <div className="absolute left-0 right-0 top-[3.25rem] z-20 overflow-hidden rounded-3xl border border-white/8 bg-[#101319] p-2 shadow-panel">
                    {searchResults.map((patient) => (
                      <button
                        key={patient.id}
                        type="button"
                        onClick={() => onOpenWorkspace(patient.id)}
                        className="flex w-full items-center justify-between rounded-2xl px-3 py-3 text-left transition hover:bg-white/[0.06]"
                      >
                        <span>
                          <span className="block text-sm font-medium text-white">{patient.name}</span>
                          <span className="mt-1 block text-xs text-adler-muted">{patient.focus}</span>
                        </span>
                        <span className="font-mono text-[0.6rem] uppercase tracking-[0.18em] text-white/40">
                          Abrir
                        </span>
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>

              <button
                type="button"
                onClick={() => setInfoModal("about")}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-white/8 bg-[#101319] text-white/64 transition hover:text-white"
                aria-label="O que é Adler AI"
              >
                <Info className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setInfoModal("security")}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-white/8 bg-[#101319] text-white/64 transition hover:text-white"
                aria-label="Segurança e privacidade"
              >
                <ShieldCheck className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setPatientModalOpen(true)}
                className="inline-flex h-11 items-center gap-2 rounded-full border border-white/8 bg-white/[0.04] px-4 text-sm font-semibold text-white transition hover:bg-white/8"
              >
                <UserPlus className="h-4 w-4" />
                Paciente
              </button>
              <button
                type="button"
                onClick={() => setScheduleModalOpen(true)}
                className="inline-flex h-11 items-center gap-2 rounded-full border px-4 text-sm font-semibold text-white transition hover:bg-white/8"
                style={{ borderColor: accentBorder, backgroundColor: accentSurface }}
              >
                <Plus className="h-4 w-4" />
                Agendar
              </button>
              <button
                type="button"
                className="relative flex h-11 w-11 items-center justify-center rounded-full border border-white/8 bg-[#101319] text-white/64"
                aria-label="Notificações"
              >
                <Bell className="h-4 w-4" />
                {clinician.notifications > 0 ? (
                  <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full" style={{ backgroundColor: accent }} />
                ) : null}
              </button>
            </div>
          </header>

          <main className="adler-scroll min-h-0 flex-1 overflow-y-auto px-6 py-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSection}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
              >
                {activeSection === "home" ? (
                  <HomeView
                    accent={accent}
                    accentBorder={accentBorder}
                    accentSurface={accentSurface}
                    activePatients={activePatients}
                    clinician={clinician}
                    notesDraft={notesDraft}
                    onNotesDraftChange={setNotesDraft}
                    onOpenWorkspace={onOpenWorkspace}
                    pendingTasks={pendingTasks}
                    scheduledPatients={scheduledPatients}
                  />
                ) : null}

                {activeSection === "patients" ? (
                  <PatientsView
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
                  <ScheduleView
                    accent={accent}
                    accentBorder={accentBorder}
                    onOpenSchedule={() => setScheduleModalOpen(true)}
                    onOpenWorkspace={onOpenWorkspace}
                    scheduledPatients={scheduledPatients}
                  />
                ) : null}

                {activeSection === "dsm" ? (
                  <DsmSearchPanel accent={accent} accentBorder={accentBorder} accentSurface={accentSurface} />
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

                {activeSection === "subscription" ? (
                  <SubscriptionPanel
                    accent={accent}
                    accentBorder={accentBorder}
                    accentSurface={accentSurface}
                    clinician={clinician}
                  />
                ) : null}

                {activeSection === "settings" ? (
                  <SettingsView
                    accent={accent}
                    accentBorder={accentBorder}
                    accentSurface={accentSurface}
                    clinician={clinician}
                  />
                ) : null}
              </motion.div>
            </AnimatePresence>
          </main>
        </section>
      </div>

      <AnimatePresence>
        {isPatientModalOpen ? (
          <PatientModal
            accent={accent}
            accentBorder={accentBorder}
            onClose={() => setPatientModalOpen(false)}
            onSubmit={(draft) => {
              const patientId = onCreatePatient(draft);
              setPatientModalOpen(false);
              onOpenWorkspace(patientId);
            }}
          />
        ) : null}

        {isScheduleModalOpen ? (
          <ScheduleModal
            accent={accent}
            accentBorder={accentBorder}
            onClose={() => setScheduleModalOpen(false)}
            onCreateAppointment={onCreateAppointment}
            onCreatePatient={onCreatePatient}
            patients={patients}
          />
        ) : null}

        {infoModal ? (
          <InfoModal
            accent={accent}
            mode={infoModal}
            onClose={() => setInfoModal(null)}
          />
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function HomeView({
  accent,
  accentBorder,
  accentSurface,
  activePatients,
  clinician,
  notesDraft,
  onNotesDraftChange,
  onOpenWorkspace,
  pendingTasks,
  scheduledPatients
}: {
  accent: string;
  accentBorder: string;
  accentSurface: string;
  activePatients: number;
  clinician: ClinicianProfile;
  notesDraft: string;
  onNotesDraftChange: (value: string) => void;
  onOpenWorkspace: (patientId: string) => void;
  pendingTasks: number;
  scheduledPatients: Array<ClinicianScheduleItem & { patient: PatientRecord }>;
}) {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="rounded-[32px] border border-white/8 bg-[#101319] p-7">
          <p className="font-mono text-[0.66rem] uppercase tracking-[0.32em] text-adler-subtle">
            Início
          </p>
          <h2 className="mt-3 max-w-3xl text-3xl font-semibold tracking-[-0.06em] text-white">
            {clinician.name}, você tem {scheduledPatients.length} sessões hoje.
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-adler-muted">
            Sua abordagem padrão é {clinician.primaryApproachLabel}. O prontuário completo só abre quando um paciente é selecionado.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <Metric label="Sessões" value={String(scheduledPatients.length)} />
            <Metric label="Ativos" value={String(activePatients)} />
            <Metric label="Pendências" value={String(pendingTasks)} />
          </div>
        </div>

        <div
          className="rounded-[32px] border bg-[#101319] p-5"
          style={{ borderColor: accentBorder, boxShadow: `0 0 32px ${accentSurface}` }}
        >
          <p className="font-mono text-[0.66rem] uppercase tracking-[0.28em] text-adler-subtle">
            Preparação
          </p>
          <textarea
            value={notesDraft}
            onChange={(event) => onNotesDraftChange(event.target.value)}
            className="mt-4 h-[184px] w-full resize-none rounded-3xl border border-white/8 bg-black/12 p-4 text-sm leading-6 text-white/82 outline-none focus:border-white/16"
          />
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="rounded-[32px] border border-white/8 bg-[#101319] p-5">
          <SectionTitle title="Agenda do dia" subtitle="Abra a sessão apenas quando for iniciar o atendimento." />
          <div className="mt-4 divide-y divide-white/8">
            {scheduledPatients.map((entry) => (
              <button
                key={`${entry.patientId}-${entry.time}`}
                type="button"
                onClick={() => onOpenWorkspace(entry.patientId)}
                className="grid w-full gap-4 py-4 text-left transition hover:bg-white/[0.025] sm:grid-cols-[76px_minmax(0,1fr)_120px]"
              >
                <span className="font-mono text-sm text-white/52">{entry.time}</span>
                <span>
                  <span className="block text-base font-semibold text-white">{entry.patient.name}</span>
                  <span className="mt-1 block text-sm text-adler-muted">
                    {entry.sessionLabel} · {entry.mode} · {entry.roomLabel}
                  </span>
                  <span className="mt-2 block text-sm text-white/72">{entry.prepNote}</span>
                </span>
                <span
                  className="self-start rounded-full border px-3 py-1.5 text-center font-mono text-[0.62rem] uppercase tracking-[0.18em]"
                  style={{
                    borderColor: entry.status === "next" ? accentBorder : "rgba(255,255,255,0.08)",
                    backgroundColor: entry.status === "next" ? accentSurface : "rgba(255,255,255,0.03)",
                    color: entry.status === "next" ? accent : "#9ca3b4"
                  }}
                >
                  {entry.status === "next" ? "Próxima" : entry.status === "completed" ? "Concluída" : "Agendada"}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-[32px] border border-white/8 bg-[#101319] p-5">
          <SectionTitle title="Tarefas clínicas" subtitle="Checklist mínimo antes dos atendimentos." />
          <div className="mt-4 space-y-3">
            {CLINICIAN_TASKS.map((task) => (
              <div key={task.id} className="rounded-2xl border border-white/8 bg-black/10 p-4">
                <p className="text-sm leading-6 text-white/82">{task.label}</p>
                <p className="mt-2 font-mono text-[0.62rem] uppercase tracking-[0.2em] text-white/36">
                  {task.priority} · {task.status === "done" ? "concluída" : "pendente"}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function PatientsView({
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
  patientFilter: "all" | "active" | "inactive";
  setPatientFilter: (value: "all" | "active" | "inactive") => void;
}) {
  const filters: Array<{ id: "all" | "active" | "inactive"; label: string }> = [
    { id: "all", label: "Todos" },
    { id: "active", label: "Ativos" },
    { id: "inactive", label: "Inativos" }
  ];

  return (
    <div className="mx-auto max-w-7xl rounded-[32px] border border-white/8 bg-[#101319] p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <SectionTitle title="Pacientes" subtitle="Selecione um paciente para abrir o prontuário completo." />
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onOpenNewPatient}
            className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold text-white"
            style={{ borderColor: accentBorder, backgroundColor: accentSurface }}
          >
            <UserPlus className="h-4 w-4" />
            Novo paciente
          </button>
          {filters.map((filter) => {
            const active = patientFilter === filter.id;
            return (
              <button
                key={filter.id}
                type="button"
                onClick={() => setPatientFilter(filter.id)}
                className="rounded-full border px-4 py-2 text-sm transition"
                style={{
                  borderColor: active ? accentBorder : "rgba(255,255,255,0.08)",
                  backgroundColor: active ? accentSurface : "rgba(255,255,255,0.03)",
                  color: active ? accent : "#b6bdcc"
                }}
              >
                {filter.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-5 overflow-hidden rounded-3xl border border-white/8">
        {filteredPatients.map((patient) => {
          const status = DASHBOARD_PATIENT_STATUS[patient.id] ?? "active";

          return (
            <button
              key={patient.id}
              type="button"
              onClick={() => onOpenWorkspace(patient.id)}
              className="grid w-full gap-4 border-b border-white/8 px-5 py-4 text-left transition last:border-b-0 hover:bg-white/[0.03] md:grid-cols-[56px_minmax(0,1fr)_160px]"
            >
              <span
                className="flex h-12 w-12 items-center justify-center rounded-2xl border font-semibold"
                style={{ borderColor: accentBorder, backgroundColor: accentSurface, color: accent }}
              >
                {patient.initials}
              </span>
              <span>
                <span className="block text-base font-semibold text-white">{patient.name}</span>
                <span className="mt-1 block text-sm text-adler-muted">{patient.focus}</span>
                <span className="mt-2 block text-sm text-white/64">{patient.diagnosis}</span>
              </span>
              <span className="self-center justify-self-start rounded-full border border-white/8 bg-white/[0.03] px-3 py-1.5 font-mono text-[0.62rem] uppercase tracking-[0.18em] text-white/48 md:justify-self-end">
                {status === "active" ? "Ativo" : "Inativo"}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ScheduleView({
  accent,
  accentBorder,
  onOpenSchedule,
  onOpenWorkspace,
  scheduledPatients
}: {
  accent: string;
  accentBorder: string;
  onOpenSchedule: () => void;
  onOpenWorkspace: (patientId: string) => void;
  scheduledPatients: Array<ClinicianScheduleItem & { patient: PatientRecord }>;
}) {
  return (
    <div className="mx-auto max-w-6xl rounded-[32px] border border-white/8 bg-[#101319] p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <SectionTitle title="Agenda" subtitle="Agende pacientes existentes ou crie um perfil durante o agendamento." />
        <button
          type="button"
          onClick={onOpenSchedule}
          className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold text-white"
          style={{ borderColor: accentBorder }}
        >
          <Plus className="h-4 w-4" />
          Agendar
        </button>
      </div>

      <div className="mt-6 grid gap-3">
        {scheduledPatients.map((entry) => (
          <button
            key={`${entry.patientId}-${entry.time}`}
            type="button"
            onClick={() => onOpenWorkspace(entry.patientId)}
            className="grid gap-4 rounded-3xl border border-white/8 bg-black/10 p-4 text-left transition hover:bg-white/[0.03] md:grid-cols-[88px_minmax(0,1fr)_140px]"
          >
            <span className="font-mono text-sm text-white/58">{entry.time}</span>
            <span>
              <span className="block font-semibold text-white">{entry.patient.name}</span>
              <span className="mt-1 block text-sm text-adler-muted">
                {entry.sessionLabel} · {entry.duration} · {entry.mode}
              </span>
            </span>
            <span className="self-center justify-self-start rounded-full bg-white/[0.04] px-3 py-1.5 text-center font-mono text-[0.62rem] uppercase tracking-[0.18em] text-white/48 md:justify-self-end">
              Abrir
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function SettingsView({
  accent,
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
    <div className="mx-auto max-w-5xl rounded-[32px] border border-white/8 bg-[#101319] p-6">
      <SectionTitle title="Configurações" subtitle="Dados profissionais e regra de acesso às abordagens." />
      <div className="mt-6 grid gap-3 md:grid-cols-2">
        <Setting label="Nome" value={clinician.name} />
        <Setting label="Registro" value={clinician.credentials} />
        <Setting label="Função" value={clinician.role} />
        <Setting label="Abordagem padrão" value={clinician.primaryApproachLabel} />
        <Setting
          label="Plano"
          value={clinician.subscriptionTier === "premium" ? "Premium: todas as abordagens" : "Padrão: abordagem única"}
        />
        <div
          className="rounded-3xl border p-4"
          style={{ borderColor: accentBorder, backgroundColor: accentSurface }}
        >
          <p className="font-mono text-[0.62rem] uppercase tracking-[0.22em] text-white/46">
            Acesso liberado
          </p>
          <p className="mt-2 text-sm font-semibold" style={{ color: accent }}>
            {clinician.allowedApproaches.length} abordagem(ns)
          </p>
        </div>
      </div>
    </div>
  );
}

function PatientModal({
  accent,
  accentBorder,
  onClose,
  onSubmit
}: {
  accent: string;
  accentBorder: string;
  onClose: () => void;
  onSubmit: (draft: NewPatientDraft) => void;
}) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    onSubmit({
      name: String(formData.get("name") ?? ""),
      focus: String(formData.get("focus") ?? ""),
      diagnosis: String(formData.get("diagnosis") ?? ""),
      currentProtocol: String(formData.get("currentProtocol") ?? "")
    });
  };

  return (
    <ModalFrame onClose={onClose}>
      <form onSubmit={handleSubmit} className="w-full max-w-2xl rounded-[32px] border border-white/8 bg-[#101319] p-6 shadow-panel">
        <ModalHeader title="Adicionar paciente" onClose={onClose} />
        <div className="mt-5 grid gap-4">
          <Field name="name" label="Nome completo" required />
          <Field name="focus" label="Foco clínico" placeholder="Ex: ansiedade, TOC, sono..." required />
          <Field name="diagnosis" label="Hipótese diagnóstica" placeholder="Ex: F41.1, TOC, TDM..." />
          <Field name="currentProtocol" label="Protocolo inicial" placeholder="Ex: Terapia do Esquema + escalas de base" />
        </div>
        <ModalActions accent={accent} accentBorder={accentBorder} onClose={onClose} submitLabel="Criar prontuário" />
      </form>
    </ModalFrame>
  );
}

function ScheduleModal({
  accent,
  accentBorder,
  onClose,
  onCreateAppointment,
  onCreatePatient,
  patients
}: {
  accent: string;
  accentBorder: string;
  onClose: () => void;
  onCreateAppointment: (appointment: ClinicianScheduleItem) => void;
  onCreatePatient: (patient: NewPatientDraft) => string;
  patients: PatientRecord[];
}) {
  const [mode, setMode] = useState<"existing" | "new">("existing");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const patientId =
      mode === "new"
        ? onCreatePatient({
            name: String(formData.get("newPatientName") ?? ""),
            focus: String(formData.get("focus") ?? ""),
            diagnosis: String(formData.get("diagnosis") ?? ""),
            currentProtocol: String(formData.get("currentProtocol") ?? "")
          })
        : String(formData.get("patientId") ?? patients[0]?.id);

    onCreateAppointment({
      patientId,
      time: String(formData.get("time") ?? "09:00"),
      duration: String(formData.get("duration") ?? "50 min"),
      mode: String(formData.get("modality") ?? "Online"),
      roomLabel: String(formData.get("roomLabel") ?? "Sala Adler"),
      sessionLabel: String(formData.get("sessionLabel") ?? "Sessão clínica"),
      prepNote: String(formData.get("prepNote") ?? "Revisar evolução longitudinal antes da sessão."),
      status: "scheduled"
    });
    onClose();
  };

  return (
    <ModalFrame onClose={onClose}>
      <form onSubmit={handleSubmit} className="adler-scroll max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-[32px] border border-white/8 bg-[#101319] p-6 shadow-panel">
        <ModalHeader title="Agendar paciente" onClose={onClose} />

        <div className="mt-5 grid grid-cols-2 gap-2 rounded-full border border-white/8 bg-black/10 p-1">
          {(["existing", "new"] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setMode(item)}
              className="rounded-full px-4 py-2 text-sm font-semibold transition"
              style={{
                backgroundColor: mode === item ? "rgba(255,255,255,0.08)" : "transparent",
                color: mode === item ? "#ffffff" : "#9ca3b4"
              }}
            >
              {item === "existing" ? "Paciente existente" : "Novo paciente"}
            </button>
          ))}
        </div>

        <div className="mt-5 grid gap-4">
          {mode === "existing" ? (
            <label>
              <span className="text-xs uppercase tracking-[0.2em] text-adler-subtle">Paciente</span>
              <select
                name="patientId"
                className="mt-2 h-11 w-full rounded-2xl border border-white/8 bg-[#090a0c] px-3 text-sm text-white outline-none"
              >
                {patients.map((patient) => (
                  <option key={patient.id} value={patient.id}>
                    {patient.name}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <>
              <Field name="newPatientName" label="Nome do novo paciente" required />
              <Field name="focus" label="Foco clínico" />
              <Field name="diagnosis" label="Hipótese diagnóstica" />
              <Field name="currentProtocol" label="Protocolo inicial" />
            </>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <Field name="time" label="Horário" type="time" required />
            <Field name="duration" label="Duração" placeholder="50 min" />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Field name="modality" label="Modalidade" placeholder="Online ou Presencial" />
            <Field name="roomLabel" label="Sala / link" placeholder="Sala Adler" />
          </div>
          <Field name="sessionLabel" label="Tipo de sessão" placeholder="Sessão de continuidade" />
          <TextArea name="prepNote" label="Nota de preparo" />
        </div>

        <ModalActions accent={accent} accentBorder={accentBorder} onClose={onClose} submitLabel="Confirmar agendamento" />
      </form>
    </ModalFrame>
  );
}

function InfoModal({
  accent,
  mode,
  onClose
}: {
  accent: string;
  mode: "about" | "security";
  onClose: () => void;
}) {
  const isSecurity = mode === "security";
  const items = isSecurity
    ? [
        "Dados clínicos isolados por profissional ou clínica.",
        "Arquitetura preparada para criptografia, auditoria e consentimento.",
        "IA assistiva sem treinamento generativo com dados do paciente."
      ]
    : [
        "Prontuário clínico com análise longitudinal e mapas de padrões.",
        "DSM, documentos, medicamentos, exames e testes em navegação global.",
        "Plano padrão usa uma abordagem; Premium libera todas as lentes."
      ];

  return (
    <ModalFrame onClose={onClose}>
      <section className="w-full max-w-2xl rounded-[32px] border border-white/8 bg-[#101319] p-6 shadow-panel">
        <ModalHeader title={isSecurity ? "Segurança & privacidade" : "O que é Adler AI"} onClose={onClose} />
        <p className="mt-4 text-sm leading-6 text-adler-muted">
          {isSecurity
            ? "O Adler foi desenhado para apoiar o clínico sem misturar dados sensíveis com treinamento de IA."
            : "O Adler organiza dados clínicos, evidências e evolução do paciente para apoiar julgamento profissional."}
        </p>
        <div className="mt-5 space-y-3">
          {items.map((item) => (
            <div key={item} className="rounded-2xl border border-white/8 bg-black/10 p-4 text-sm leading-6 text-white/82">
              <span className="mr-2 font-mono" style={{ color: accent }}>•</span>
              {item}
            </div>
          ))}
        </div>
      </section>
    </ModalFrame>
  );
}

function SectionTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div>
      <p className="font-mono text-[0.66rem] uppercase tracking-[0.3em] text-adler-subtle">
        Adler
      </p>
      <h2 className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-white">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-adler-muted">{subtitle}</p>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-white/8 bg-black/10 p-4">
      <p className="font-mono text-[0.62rem] uppercase tracking-[0.22em] text-adler-subtle">{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-[-0.06em] text-white">{value}</p>
    </div>
  );
}

function Setting({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-white/8 bg-black/10 p-4">
      <p className="font-mono text-[0.62rem] uppercase tracking-[0.22em] text-adler-subtle">{label}</p>
      <p className="mt-2 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

function ModalFrame({ children, onClose }: { children: ReactNode; onClose: () => void }) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur-xl"
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

function ModalHeader({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <h2 className="text-2xl font-semibold tracking-[-0.05em] text-white">{title}</h2>
      <button
        type="button"
        onClick={onClose}
        className="flex h-10 w-10 items-center justify-center rounded-full border border-white/8 bg-white/[0.04] text-white/64 transition hover:text-white"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

function ModalActions({
  accent,
  accentBorder,
  onClose,
  submitLabel
}: {
  accent: string;
  accentBorder: string;
  onClose: () => void;
  submitLabel: string;
}) {
  return (
    <div className="mt-6 flex justify-end gap-3">
      <button
        type="button"
        onClick={onClose}
        className="rounded-full border border-white/8 bg-white/[0.03] px-5 py-2.5 text-sm font-semibold text-white/70"
      >
        Cancelar
      </button>
      <button
        type="submit"
        className="rounded-full border px-5 py-2.5 text-sm font-semibold text-white"
        style={{ borderColor: accentBorder, backgroundColor: accent }}
      >
        {submitLabel}
      </button>
    </div>
  );
}

function Field({
  label,
  name,
  placeholder,
  required,
  type = "text"
}: {
  label: string;
  name: string;
  placeholder?: string;
  required?: boolean;
  type?: string;
}) {
  return (
    <label>
      <span className="text-xs uppercase tracking-[0.2em] text-adler-subtle">{label}</span>
      <input
        name={name}
        required={required}
        type={type}
        placeholder={placeholder}
        className="mt-2 h-11 w-full rounded-2xl border border-white/8 bg-[#090a0c] px-3 text-sm text-white outline-none placeholder:text-white/24 focus:border-white/18"
      />
    </label>
  );
}

function TextArea({ label, name }: { label: string; name: string }) {
  return (
    <label>
      <span className="text-xs uppercase tracking-[0.2em] text-adler-subtle">{label}</span>
      <textarea
        name={name}
        className="mt-2 min-h-[96px] w-full rounded-2xl border border-white/8 bg-[#090a0c] px-3 py-3 text-sm leading-6 text-white outline-none placeholder:text-white/24 focus:border-white/18"
      />
    </label>
  );
}
