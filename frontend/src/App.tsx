import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, AlertTriangle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  fetchAdlerBootstrap,
  createAdlerPatient,
  createAdlerAppointment
} from "./api/client";

import { AuthScreen } from "./components/AuthScreen";
import { logoutSession, restoreSession, type AuthSession } from "./lib/auth";

import {
  Page, WorkspaceTab, Modal, Approach, Patient, Appointment
} from "./types";
import { initialsFrom, slugify, clinician, approach, workspaceTabs } from "./constants";

import { AppBootScreen } from "./components/layout/AppBootScreen";
import { SessionBadge } from "./components/layout/SessionBadge";
import { GlobalSidebar } from "./components/layout/GlobalSidebar";
import { GlobalHeader } from "./components/layout/GlobalHeader";

import { HomePage } from "./pages/HomePage";
import { PatientsPage } from "./pages/PatientsPage";
import { SchedulePage } from "./pages/SchedulePage";
import { DSMPage } from "./pages/DSMPage";
import { DocumentsPage } from "./pages/DocumentsPage";
import { SettingsPage } from "./pages/SettingsPage";
import { SubscriptionPage } from "./pages/SubscriptionPage";

import { PatientWorkspace } from "./components/workspace/PatientWorkspace";
import {
  PatientModal, ScheduleModal, AboutModal, SecurityModal
} from "./components/modals/SharedModals";





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
  const [session, setSession] = useState(1);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const [toast, setToast] = useState<{ message: string, type: "success" | "error" } | null>(null);

  useEffect(() => {
    let active = true;

    void restoreSession().then(async (sessionPayload) => {
      if (!active) return;
      setAuthSession(sessionPayload);

      if (sessionPayload) {
        setIsDataLoading(true);
        try {
          const bootstrap = await fetchAdlerBootstrap();
          if (!active) return;

          const mappedPatients: Patient[] = bootstrap.patients.map(p => ({
            id: p.id,
            name: p.name,
            initials: p.initials,
            status: p.status,
            focus: p.focus,
            hypothesis: p.diagnosis,
            protocol: p.current_protocol,
            sessions: p.default_session,
            progress: 0,
            risk: 0,
            lastSeen: "Recentemente"
          }));

          const mappedAppointments: Appointment[] = bootstrap.dashboard.schedule.map(s => ({
            id: s.id || Math.random().toString(36).substr(2, 9),
            patientId: s.patient_id,
            patientName: s.patient_name,
            time: s.time,
            kind: s.session_label,
            mode: s.mode,
            note: s.prep_note || "",
            status: s.status === "completed" ? "completed" : s.status === "next" ? "next" : "scheduled"
          } as Appointment));

          setPatients(mappedPatients);
          setAppointments(mappedAppointments);
        } catch (error) {
          console.error("Erro no bootstrap:", error);
        }
      }

      setIsDataLoading(false);
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

  const addPatient = async (payload: { focus: string; name: string }) => {
    try {
      const newP = await createAdlerPatient({ name: payload.name, focus: payload.focus });
      const p: Patient = {
        id: newP.id,
        initials: newP.initials,
        name: newP.name,
        status: newP.status,
        focus: newP.focus,
        hypothesis: newP.diagnosis,
        protocol: newP.current_protocol,
        progress: 0,
        risk: 0,
        sessions: newP.default_session,
        lastSeen: "Agora"
      };
      setPatients((c) => [p, ...c]);
      setPage("patients");
      showToast("Paciente cadastrado com sucesso!");
      setModal(null);
    } catch (error) {
      console.error("Falha ao criar paciente:", error);
    }
  };

  const schedulePatient = async (payload: {
    kind: string;
    mode: string;
    name: string;
    note: string;
    time: string;
  }) => {
    try {
      await createAdlerAppointment({
        patient_name: payload.name,
        time: payload.time,
        session_label: payload.kind,
        mode: payload.mode,
        prep_note: payload.note
      });

      const bootstrap = await fetchAdlerBootstrap();

      const mappedPatients: Patient[] = bootstrap.patients.map(p => ({
        id: p.id,
        name: p.name,
        initials: p.initials,
        status: p.status,
        focus: p.focus,
        hypothesis: p.diagnosis,
        protocol: p.current_protocol,
        sessions: p.default_session,
        progress: 0,
        risk: 0,
        lastSeen: "Recentemente"
      }));

      const mappedAppointments: Appointment[] = bootstrap.dashboard.schedule.map(s => ({
        id: s.id || Math.random().toString(36).substr(2, 9),
        patientId: s.patient_id,
        patientName: s.patient_name,
        time: s.time,
        kind: s.session_label,
        mode: s.mode,
        note: s.prep_note || "",
        status: s.status === "completed" ? "completed" : s.status === "next" ? "next" : "scheduled"
      } as Appointment));

      setPatients(mappedPatients);
      setAppointments(mappedAppointments);
      setPage("schedule");
      showToast("Sessão agendada com sucesso!");
      setModal(null);
    } catch (error) {
      console.error("Falha ao agendar:", error);
    }
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
          tabs={workspaceTabs}
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
                  exit={{ opacity: 0, y: 4 }}
                  initial={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.2 }}
                >
                  {page === "home" ? (
                    <HomePage appointments={appointments} onOpenPatient={openPatient} patients={patients} onAddPatient={() => setModal("patient")} isLoading={isDataLoading} />
                  ) : page === "patients" ? (
                    <PatientsPage onOpenPatient={openPatient} patients={patients} onAddPatient={() => setModal("patient")} isLoading={isDataLoading} />
                  ) : page === "schedule" ? (
                    <SchedulePage appointments={appointments} onOpenPatient={openPatient} onSchedule={() => setModal("schedule")} patients={patients} />
                  ) : page === "dsm" ? (
                    <DSMPage />
                  ) : page === "documents" ? (
                    <DocumentsPage />
                  ) : page === "settings" ? (
                    <SettingsPage />
                  ) : page === "subscription" ? (
                    <SubscriptionPage />
                  ) : null}
                </motion.div>
              </AnimatePresence>
            </main>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {modal === "patient" ? (
          <PatientModal onClose={() => setModal(null)} onSubmit={addPatient} />
        ) : modal === "schedule" ? (
          <ScheduleModal onClose={() => setModal(null)} onSubmit={schedulePatient} patients={patients} />
        ) : modal === "about" ? (
          <AboutModal onClose={() => setModal(null)} />
        ) : modal === "security" ? (
          <SecurityModal onClose={() => setModal(null)} />
        ) : null}

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className={`fixed bottom-8 right-8 z-[100] flex items-center gap-3 rounded-2xl px-6 py-4 shadow-2xl ${
              toast.type === "success" ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"
            }`}
          >
            {toast.type === "success" ? <CheckCircle2 className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
            <p className="text-sm font-bold">{toast.message}</p>
          </motion.div>
        )}
      </AnimatePresence>
      </AnimatePresence>
    </>
  );
}
