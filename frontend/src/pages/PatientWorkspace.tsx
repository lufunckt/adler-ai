import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Mic, Square, BrainCircuit, Activity, ClipboardCheck, Pill, TestTube2 } from "lucide-react";
import { Patient, WorkspaceTab, workspaceTabs } from "../types";
import { avatarClass } from "../utils";

// Tabs
import { SessionTab } from "../components/workspace/SessionTab";
import { CognitiveMapTab } from "../components/workspace/CognitiveMapTab";
import { ClinicalEvolutionTab } from "../components/workspace/ClinicalEvolutionTab";
import { TimelineTab } from "../components/workspace/TimelineTab";
import { PsychTestsTab } from "../components/workspace/PsychTestsTab";
import { MedicationsTab } from "../components/workspace/MedicationsTab";
import { ExamsTab } from "../components/workspace/ExamsTab";
import { SherlockSidebar } from "../components/workspace/SherlockSidebar";

const approach = { label: "Terapia do Esquema" };

const tabIcons: Record<string, any> = {
  session: Mic,
  map: BrainCircuit,
  timeline: Activity,
  tests: ClipboardCheck,
  medications: Pill,
  exams: TestTube2
};

export function PatientWorkspace({
  activeTab,
  isRecording,
  onBack,
  patient,
  patientIndex,
  session,
  setActiveTab,
  setIsRecording,
  setSession,
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
          <div className={`rounded-full px-3 py-1 text-xs font-semibold ${
              patient.risk >= 60 ? "bg-red-50 text-red-600" : patient.risk >= 40 ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"
          }`}>
            Risco {patient.risk}%
          </div>
          <button
            type="button"
            onClick={() => setIsRecording(!isRecording)}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm transition ${
              isRecording ? "bg-red-500 hover:bg-red-600" : "bg-rose-500 hover:bg-rose-600"
            }`}
          >
            {isRecording ? <><Square className="h-4 w-4" /> Gravando</> : <><Mic className="h-4 w-4" /> Gravar sessão</>}
          </button>
        </div>
      </header>

      <nav className="border-b border-gray-200 bg-white px-6">
        <div className="flex gap-0 overflow-x-auto">
          {workspaceTabs.map((tab) => {
            const Icon = tabIcons[tab.id];
            const active = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as WorkspaceTab)}
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
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
            >
              {activeTab === "session" && (
                <SessionTab
                  isRecording={isRecording}
                  patient={patient}
                  session={session}
                  setIsRecording={setIsRecording}
                  setSession={setSession}
                />
              )}
              {activeTab === "map" && <CognitiveMapTab patient={patient} session={session} />}
              {activeTab === "timeline" && <ClinicalEvolutionTab patient={patient} session={session} />}
              {activeTab === "tests" && <PsychTestsTab patient={patient} />}
              {activeTab === "medications" && <MedicationsTab />}
              {activeTab === "exams" && <ExamsTab />}
              {activeTab === "timeline" && <TimelineTab patient={patient} />}
            </motion.div>
          </AnimatePresence>
        </main>
        <SherlockSidebar patient={patient} session={session} />
      </div>
    </div>
  );
}
