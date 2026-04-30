import { AnimatePresence, motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  ArrowLeft,
  BrainCircuit,
  ChevronDown,
  Mic,
  ShieldCheck,
  Square,
  Stethoscope
} from "lucide-react";
import { ClinicalExamsPanel } from "./ClinicalExamsPanel";
import { CognitiveMap } from "./CognitiveMap";
import { DifferentialDiagnosisCard } from "./DifferentialDiagnosisCard";
import { EvidenceModal } from "./EvidenceModal";
import { EvolutionPanel } from "./EvolutionPanel";
import { MedicationsPanel } from "./MedicationsPanel";
import { PsychologicalTestsPanel } from "./PsychologicalTestsPanel";
import { SessionRecorderPanel } from "./SessionRecorderPanel";
import type { ClinicalApproach, ShellTab } from "../context/AdlerShellContext";
import { getApproachSnapshot } from "../data/approachData";
import { getClinicalRiskSnapshot } from "../data/riskData";
import type { EvidenceSource } from "../data/evidenceSources";
import type { PatientRecord } from "../data/patientData";

type ApproachMeta = {
  accent: string;
  accentBorder: string;
  accentSurface: string;
  description: string;
  icon: LucideIcon;
  id: ClinicalApproach;
  label: string;
};

type TabMeta = {
  icon: LucideIcon;
  id: ShellTab;
  label: string;
};

type SelectedInsight = {
  description: string;
  title: string;
} | null;

type CleanPatientWorkspaceProps = {
  activeTab: ShellTab;
  approach: ClinicalApproach;
  approachData: ReturnType<typeof getApproachSnapshot>;
  approaches: ApproachMeta[];
  currentApproach: ApproachMeta;
  currentRisk: ReturnType<typeof getClinicalRiskSnapshot>;
  evidenceSources: EvidenceSource[];
  hasContractedGeneticTest: boolean;
  isRecording: boolean;
  onBack: () => void;
  patient: PatientRecord;
  patients: PatientRecord[];
  selectedInsight: SelectedInsight;
  selectedSession: number;
  setActiveTab: (tab: ShellTab) => void;
  setApproach: (approach: ClinicalApproach) => void;
  setSelectedInsight: (insight: SelectedInsight) => void;
  setSelectedPatientId: (patientId: string) => void;
  setSelectedSession: (session: number) => void;
  subscriptionTier: "standard" | "premium";
  tabs: TabMeta[];
  toggleRecording: () => void;
};

export function CleanPatientWorkspace({
  activeTab,
  approach,
  approachData,
  approaches,
  currentApproach,
  currentRisk,
  evidenceSources,
  hasContractedGeneticTest,
  isRecording,
  onBack,
  patient,
  patients,
  selectedInsight,
  selectedSession,
  setActiveTab,
  setApproach,
  setSelectedInsight,
  setSelectedPatientId,
  setSelectedSession,
  subscriptionTier,
  tabs,
  toggleRecording
}: CleanPatientWorkspaceProps) {
  return (
    <div className="h-screen overflow-hidden bg-adler-bg text-adler-text">
      <AnimatePresence>
        {isRecording ? <RecordingWash /> : null}
      </AnimatePresence>

      <div className="relative flex h-full flex-col">
        <header className="border-b border-adler-border bg-[#0b0d11]/94 backdrop-blur-xl">
          <div className="flex items-center gap-4 px-6 py-4">
            <button
              type="button"
              onClick={onBack}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/8 bg-white/[0.03] text-white/68 transition hover:text-white"
              aria-label="Voltar ao dashboard"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-xl font-semibold tracking-[-0.04em] text-white">
                  {patient.name}
                </h1>
                <span
                  className="rounded-full border px-3 py-1 font-mono text-[0.62rem] uppercase tracking-[0.18em]"
                  style={{
                    borderColor: currentApproach.accentBorder,
                    backgroundColor: currentApproach.accentSurface,
                    color: currentApproach.accent
                  }}
                >
                  Sessão {selectedSession}
                </span>
                <span className="rounded-full border border-white/8 bg-white/[0.03] px-3 py-1 font-mono text-[0.62rem] uppercase tracking-[0.18em] text-white/42">
                  {subscriptionTier === "premium" ? "Premium" : "Plano padrão"}
                </span>
              </div>
              <p className="mt-1 truncate text-sm text-adler-muted">
                {patient.focus} · {patient.diagnosis}
              </p>
            </div>

            <label className="relative hidden min-w-[260px] lg:block">
              <select
                value={patient.id}
                onChange={(event) => {
                  const nextPatient = patients.find((item) => item.id === event.target.value);
                  setSelectedPatientId(event.target.value);
                  if (nextPatient) setSelectedSession(nextPatient.defaultSession);
                }}
                className="h-10 w-full appearance-none rounded-full border border-white/8 bg-[#101319] pl-4 pr-10 text-sm text-white outline-none"
              >
                {patients.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
            </label>

            <button
              type="button"
              onClick={toggleRecording}
              className="inline-flex h-10 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition"
              style={{
                borderColor: isRecording ? "rgba(239,68,68,0.44)" : currentApproach.accentBorder,
                backgroundColor: isRecording ? "rgba(239,68,68,0.14)" : currentApproach.accentSurface,
                color: isRecording ? "#fecaca" : "#ffffff"
              }}
            >
              {isRecording ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              {isRecording ? "Gravando" : "Gravar"}
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/6 px-6 py-3">
            <nav className="adler-scroll flex gap-1 overflow-x-auto">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className="inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-2 text-sm transition"
                    style={{
                      borderColor: isActive ? currentApproach.accentBorder : "rgba(255,255,255,0.08)",
                      backgroundColor: isActive ? currentApproach.accentSurface : "rgba(255,255,255,0.025)",
                      color: isActive ? "#ffffff" : "#aeb6c7"
                    }}
                  >
                    <Icon className="h-4 w-4" style={{ color: isActive ? currentApproach.accent : "#7f8798" }} />
                    {tab.label}
                  </button>
                );
              })}
            </nav>

            <ApproachControl
              approach={approach}
              approaches={approaches}
              currentApproach={currentApproach}
              setApproach={setApproach}
              subscriptionTier={subscriptionTier}
            />
          </div>
        </header>

        <main className="grid min-h-0 flex-1 grid-cols-1 gap-0 xl:grid-cols-[minmax(0,1fr)_336px]">
          <section className="adler-scroll min-h-0 overflow-y-auto px-6 py-6">
            <div className="mx-auto max-w-6xl">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.18 }}
                  className="rounded-[32px] border border-white/8 bg-[#101319] p-5"
                >
                  {activeTab === "session" ? (
                    <SessionRecorderPanel
                      accent={currentApproach.accent}
                      accentBorder={currentApproach.accentBorder}
                      accentSurface={currentApproach.accentSurface}
                      isRecording={isRecording}
                      patient={patient}
                      toggleRecording={toggleRecording}
                    />
                  ) : null}

                  {activeTab === "map" ? (
                    <CognitiveMap
                      accent={currentApproach.accent}
                      accentBorder={currentApproach.accentBorder}
                      accentSurface={currentApproach.accentSurface}
                      approach={approach}
                      session={selectedSession}
                    />
                  ) : null}

                  {activeTab === "evolution" ? (
                    <EvolutionPanel
                      accent={currentApproach.accent}
                      accentBorder={currentApproach.accentBorder}
                      accentSurface={currentApproach.accentSurface}
                      approach={approach}
                      approachLabel={currentApproach.label}
                      clinicalFrame={approachData.clinicalFrame}
                      hasContractedGeneticTest={hasContractedGeneticTest}
                      patient={patient}
                      riskLabel={currentRisk.focusLabel}
                      riskScore={currentRisk.score}
                      selectedSession={selectedSession}
                      setSelectedSession={setSelectedSession}
                    />
                  ) : null}

                  {activeTab === "meds" ? (
                    <MedicationsPanel
                      accent={currentApproach.accent}
                      accentBorder={currentApproach.accentBorder}
                      accentSurface={currentApproach.accentSurface}
                      hasContractedGeneticTest={hasContractedGeneticTest}
                      patient={patient}
                    />
                  ) : null}

                  {activeTab === "exams" ? (
                    <ClinicalExamsPanel
                      accent={currentApproach.accent}
                      accentBorder={currentApproach.accentBorder}
                      accentSurface={currentApproach.accentSurface}
                      patient={patient}
                    />
                  ) : null}

                  {activeTab === "tests" ? (
                    <PsychologicalTestsPanel
                      accent={currentApproach.accent}
                      accentBorder={currentApproach.accentBorder}
                      accentSurface={currentApproach.accentSurface}
                      patient={patient}
                    />
                  ) : null}
                </motion.div>
              </AnimatePresence>
            </div>
          </section>

          <SherlockRail
            accent={currentApproach.accent}
            accentBorder={currentApproach.accentBorder}
            accentSurface={currentApproach.accentSurface}
            approachData={approachData}
            approachLabel={currentApproach.label}
            patient={patient}
            risk={currentRisk}
            selectedSession={selectedSession}
            setSelectedInsight={setSelectedInsight}
          />
        </main>

        <footer className="border-t border-adler-border px-6 py-3">
          <p className="text-center text-xs text-adler-subtle">
            Zero-Knowledge Privacy: dados clínicos isolados e criptografados. Sem uso para treinamento generativo.
          </p>
        </footer>
      </div>

      <AnimatePresence>
        {selectedInsight ? (
          <EvidenceModal
            accent={currentApproach.accent}
            accentBorder={currentApproach.accentBorder}
            accentSurface={currentApproach.accentSurface}
            description={selectedInsight.description}
            onClose={() => setSelectedInsight(null)}
            sources={evidenceSources}
            title={selectedInsight.title}
          />
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function SherlockRail({
  accent,
  accentBorder,
  accentSurface,
  approachData,
  approachLabel,
  patient,
  risk,
  selectedSession,
  setSelectedInsight
}: {
  accent: string;
  accentBorder: string;
  accentSurface: string;
  approachData: ReturnType<typeof getApproachSnapshot>;
  approachLabel: string;
  patient: PatientRecord;
  risk: ReturnType<typeof getClinicalRiskSnapshot>;
  selectedSession: number;
  setSelectedInsight: (insight: { description: string; title: string }) => void;
}) {
  const riskTone = risk.score >= 60 ? "#ef4444" : risk.score >= 45 ? "#f59e0b" : "#34d399";

  return (
    <aside className="adler-scroll min-h-0 overflow-y-auto border-l border-adler-border bg-[#0b0d11] px-5 py-6">
      <div className="space-y-5">
        <section className="rounded-[28px] border border-white/8 bg-[#101319] p-5">
          <p className="font-mono text-[0.62rem] uppercase tracking-[0.28em] text-adler-subtle">
            Sherlock Lens
          </p>
          <div className="mt-3 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold tracking-[-0.04em] text-white">
              {approachLabel}
            </h2>
            <Stethoscope className="h-4 w-4" style={{ color: accent }} />
          </div>
          <p className="mt-3 text-sm leading-6 text-adler-muted">{approachData.summary}</p>
        </section>

        <section
          className="rounded-[28px] border bg-[#101319] p-5"
          style={{ borderColor: risk.score >= 60 ? "rgba(239,68,68,0.42)" : "rgba(255,255,255,0.08)" }}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-mono text-[0.62rem] uppercase tracking-[0.28em] text-adler-subtle">
                Risco clínico
              </p>
              <h3 className="mt-2 text-base font-semibold text-white">{risk.focusLabel}</h3>
            </div>
            <span className="font-mono text-2xl font-semibold" style={{ color: riskTone }}>
              {risk.score}%
            </span>
          </div>
          <div className="mt-4 h-2 rounded-full bg-white/8">
            <motion.div
              className="h-full rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${risk.score}%` }}
              style={{ backgroundColor: riskTone }}
            />
          </div>
          <p className="mt-4 text-sm leading-6 text-adler-muted">{risk.note}</p>
        </section>

        <section className="rounded-[28px] border border-white/8 bg-[#101319] p-5">
          <p className="font-mono text-[0.62rem] uppercase tracking-[0.28em] text-adler-subtle">
            Insights
          </p>
          <div className="mt-4 space-y-3">
            {approachData.insights.map((insight) => (
              <button
                key={insight.id}
                type="button"
                onClick={() =>
                  setSelectedInsight({
                    title: insight.title,
                    description: insight.description
                  })
                }
                className="w-full rounded-2xl border border-white/8 bg-black/10 p-4 text-left transition hover:bg-white/[0.04]"
              >
                <div className="flex items-start justify-between gap-3">
                  <h4 className="text-sm font-semibold leading-5 text-white">{insight.title}</h4>
                  <span className="font-mono text-xs" style={{ color: accent }}>
                    {insight.confidence}%
                  </span>
                </div>
                <p className="mt-2 max-h-[4.5rem] overflow-hidden text-sm leading-6 text-adler-muted">
                  {insight.description}
                </p>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/8">
                  <motion.div
                    className="h-full rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${insight.confidence}%` }}
                    style={{ background: `linear-gradient(90deg, ${accent}, rgba(255,255,255,0.8))` }}
                  />
                </div>
              </button>
            ))}
          </div>
        </section>

        <DifferentialDiagnosisCard
          accent={accent}
          accentBorder={accentBorder}
          accentSurface={accentSurface}
          patient={patient}
          selectedSession={selectedSession}
        />

        <section className="rounded-[28px] border border-white/8 bg-[#101319] p-5">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-4 w-4" style={{ color: accent }} />
            <p className="text-sm font-semibold text-white">Dado assistivo</p>
          </div>
          <p className="mt-3 text-sm leading-6 text-adler-muted">
            As sugestões organizam padrões e evidências, mas não substituem julgamento clínico.
          </p>
        </section>
      </div>
    </aside>
  );
}

function ApproachControl({
  approach,
  approaches,
  currentApproach,
  setApproach,
  subscriptionTier
}: {
  approach: ClinicalApproach;
  approaches: ApproachMeta[];
  currentApproach: ApproachMeta;
  setApproach: (approach: ClinicalApproach) => void;
  subscriptionTier: "standard" | "premium";
}) {
  if (approaches.length <= 1) {
    return (
      <div
        className="inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm"
        style={{
          borderColor: currentApproach.accentBorder,
          backgroundColor: currentApproach.accentSurface,
          color: currentApproach.accent
        }}
      >
        <BrainCircuit className="h-4 w-4" />
        {currentApproach.label}
      </div>
    );
  }

  return (
    <div className="adler-scroll flex max-w-full gap-1 overflow-x-auto rounded-full border border-white/8 bg-white/[0.025] p-1">
      {approaches.map((item) => {
        const active = approach === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => setApproach(item.id)}
            className="shrink-0 rounded-full px-3 py-1.5 text-sm transition"
            style={{
              backgroundColor: active ? item.accentSurface : "transparent",
              color: active ? "#ffffff" : "#9aa3b4"
            }}
          >
            {item.label}
          </button>
        );
      })}
      <span className="shrink-0 px-3 py-1.5 font-mono text-[0.58rem] uppercase tracking-[0.18em] text-white/36">
        {subscriptionTier}
      </span>
    </div>
  );
}

function RecordingWash() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(circle_at_80%_0%,rgba(239,68,68,0.12),transparent_28%)]"
    />
  );
}
