import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import {
  fetchAdlerBootstrap,
  createAdlerPatient,
  createAdlerAppointment,
  deleteAdlerAppointment,
  deleteAdlerPatient
} from "./api/client";
import { AuthScreen } from "./components/AuthScreen";
import { logoutSession, restoreSession, type AuthSession } from "./lib/auth";
import { Page, WorkspaceTab, Modal, Patient, Appointment } from "./types";
import { AppBootScreen } from "./components/layout/AppBootScreen";
import { SessionBadge } from "./components/layout/SessionBadge";
import { GlobalSidebar } from "./components/layout/GlobalSidebar";
import { GlobalHeader } from "./components/layout/GlobalHeader";
import { HomePage } from "./pages/HomePage";
import { PatientsPage } from "./pages/PatientsPage";
import { SchedulePage } from "./pages/SchedulePage";
import { DSMPage } from "./pages/DSMPage";
import { DocumentsPage } from "./pages/DocumentsPage";
import { SubscriptionPage } from "./pages/SubscriptionPage";
import { SettingsPage } from "./pages/SettingsPage";
import { PatientWorkspace } from "./pages/PatientWorkspace";
import { AboutModal } from "./components/modals/AboutModal";
import { SecurityModal } from "./components/modals/SecurityModal";
import { PatientModal } from "./components/modals/PatientModal";
import { ScheduleModal } from "./components/modals/ScheduleModal";

// Initial config (metadata)
const clinicianConfig = {
  approach: "schema",
  name: "Érico Lopes",
  plan: "premium",
  registry: "CRP 07/12345",
  role: "Psicólogo clínico"
};

const approachConfig = {
  accent: "#f43f5e",
  accentDark: "#e11d48",
  accentSoft: "#fff1f2",
  label: "Terapia do Esquema",
  surface: "from-rose-500 to-pink-600"
};

export default function App() {
  const [authSession, setAuthSession] = useState<AuthSession | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [page, setPage] = useState<Page>("home");
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
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
      if (sessionPayload) {
        fetchAdlerBootstrap().then(data => {
          setPatients(data.patients.map(p => ({
            ...p,
            hypothesis: "Recuperado do banco",
            protocol: p.current_protocol,
            progress: 50,
            risk: 30,
            lastSeen: "Recentemente"
          })) as Patient[]);
          setAppointments(data.dashboard.schedule.map(s => ({
            id: s.id,
            patientId: s.patient_id,
            time: s.time,
            kind: s.session_label,
            mode: s.mode,
            note: s.prep_note
          })) as Appointment[]);
        });
      }
      setAuthReady(true);
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    document.title = authSession ? "Adler AI" : "Adler AI • Login";
  }, [authSession]);

  const selectedPatient = patients.find((p) => p.id === selectedPatientId) ?? null;

  async function handleDeleteAppointment(id: string) {
    try {
      await deleteAdlerAppointment(id);
      setAppointments((c) => c.filter((a) => a.id !== id));
    } catch (err) {
      console.error("Erro ao deletar agendamento:", err);
    }
  }

  async function handleDeletePatient(id: string) {
    try {
      await deleteAdlerPatient(id);
      setPatients((c) => c.filter((p) => p.id !== id));
      setAppointments((c) => c.filter((a) => a.patientId !== id));
    } catch (err) {
      console.error("Erro ao deletar paciente:", err);
    }
  }

  async function handleLogout() {
    await logoutSession();
    setAuthSession(null);
    setSelectedPatientId(null);
    setPage("home");
    setSearch("");
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
    createAdlerPatient(payload).then(newP => {
      const p: Patient = {
        id: newP.id,
        initials: newP.initials,
        name: newP.name,
        status: newP.status,
        focus: newP.focus,
        diagnosis: newP.diagnosis,
        hypothesis: "Formulação inicial",
        protocol: newP.current_protocol,
        progress: 8,
        risk: 28,
        sessions: newP.default_session,
        lastSeen: "Novo cadastro"
      };
      setPatients((c) => [p, ...c]);
      setPage("patients");
      setModal(null);
    });
  };

  const schedulePatient = (payload: {
    kind: string;
    mode: string;
    name: string;
    note: string;
    time: string;
  }) => {
    const existing = patients.find((p) => p.name.toLowerCase() === payload.name.toLowerCase());
    const proceedWithAppointment = (p: Patient, isNew: boolean) => {
      createAdlerAppointment({ patient_id: p.id, time: payload.time, note: payload.note }).then(newAppt => {
        if (isNew) setPatients((c) => [p, ...c]);
        setAppointments((c) =>
          [
            ...c,
            {
              id: newAppt.id,
              kind: newAppt.session_label,
              mode: newAppt.mode,
              note: newAppt.prep_note || "Sem observações.",
              patientId: p.id,
              time: newAppt.time
            }
          ].sort((a, b) => a.time.localeCompare(b.time))
        );
        setPage("schedule");
        setModal(null);
      });
    };

    if (!existing) {
      createAdlerPatient({ name: payload.name, focus: "Criado via agenda" }).then(newP => {
        const p: Patient = {
          id: newP.id,
          initials: newP.initials,
          name: newP.name,
          status: newP.status,
          focus: newP.focus,
          diagnosis: newP.diagnosis,
          hypothesis: "Triagem pendente",
          protocol: newP.current_protocol,
          progress: 0,
          risk: 30,
          sessions: 1,
          lastSeen: "Agendado"
        };
        proceedWithAppointment(p, true);
      });
    } else {
      proceedWithAppointment(existing, false);
    }
  };

  if (!authReady) return <AppBootScreen />;
  if (!authSession) return <AuthScreen onAuthenticated={setAuthSession} />;

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
                  {page === "home" && (
                    <HomePage
                      appointments={appointments}
                      onOpenPatient={openPatient}
                      patients={patients}
                      onDeleteAppointment={handleDeleteAppointment}
                      clinicianName={clinicianConfig.name}
                      approachLabel={approachConfig.label}
                    />
                  )}
                  {page === "patients" && (
                    <PatientsPage
                      onAddPatient={() => setModal("patient")}
                      onOpenPatient={openPatient}
                      patients={patients}
                      onDeletePatient={handleDeletePatient}
                    />
                  )}
                  {page === "schedule" && (
                    <SchedulePage
                      appointments={appointments}
                      onOpenPatient={openPatient}
                      onSchedule={() => setModal("schedule")}
                      patients={patients}
                      onDeleteAppointment={handleDeleteAppointment}
                    />
                  )}
                  {page === "dsm" && <DSMPage />}
                  {page === "documents" && <DocumentsPage />}
                  {page === "subscription" && <SubscriptionPage />}
                  {page === "settings" && <SettingsPage />}
                </motion.div>
              </AnimatePresence>
            </main>
          </div>
        </div>

        <AnimatePresence>
          {modal === "about" && <AboutModal onClose={() => setModal(null)} />}
          {modal === "security" && <SecurityModal onClose={() => setModal(null)} />}
          {modal === "patient" && <PatientModal onClose={() => setModal(null)} onSubmit={addPatient} />}
          {modal === "schedule" && (
            <ScheduleModal
              onClose={() => setModal(null)}
              onSubmit={schedulePatient}
              patients={patients}
            />
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
