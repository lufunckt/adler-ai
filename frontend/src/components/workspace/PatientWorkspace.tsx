import React, { useState, useMemo, useEffect, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LucideIcon, Activity, AlertTriangle, ArrowLeft, ArrowRight, Bell, Brain, BrainCircuit,
  Calendar, CalendarPlus, CheckCircle2, ClipboardCheck, CreditCard, Download,
  ExternalLink, FileText, Filter, Home, Info, Lock, LogOut, MessageCircle,
  Mic, Pill, Plus, Search, Settings, Shield, Sparkles, Square, TestTube2,
  TrendingUp, UserPlus, Users, X, ClipboardList, ChevronRight, MoreVertical,
  Star, Clock, MapPin, Video, Layout, ListChecks, Clipboard, List, ClipboardList as ClipboardListIcon
} from "lucide-react";
import { Page, WorkspaceTab, Status, Modal, Approach, Plan, Patient, Appointment } from "../../types";

import {
  analyzeAdlerClinicalSession,
  fetchAdlerEvolutionDecision,
  fetchAdlerAbandonmentRisk,
  fetchAdlerWhatsAppDashboard,
  fetchAdlerMedicationSearch,
  createAdlerWhatsAppCheckin,
  saveAdlerSessionNoteDraft,
  type AdlerEvolutionDecisionResponse,
  type AdlerAbandonmentRiskResponse,
  type AdlerWhatsAppDashboardResponse,
  type AdlerMedicationSearchResponse,
  type MedicationSearchResult
} from "../../api/client";
import {
  clinician, approach, avatarClass
} from "../../constants";
import {
  buildClinicalSessionPayload,
  buildSeedTranscript,
  createInitialStructuredSessionDraft,
  deriveStructuredDraftFromContent,
  parseStructuredList,
  capitalizeMedication,
  buildMedicationFallback,
  type SessionTranscriptLine,
  type StructuredSessionDraft
} from "../../lib/clinicalSession";
import {
  buildPreviewEvolution,
  buildPreviewMapGraph,
  buildPreviewRisk,
  buildPreviewTimelinePoints,
  loadPreviewAnalyses,
  loadPreviewCheckins,
  savePreviewAnalysis,
  savePreviewCheckin
} from "../../lib/previewSessionStore";
import { SessionRecorderPanel } from "../SessionRecorderPanel";
import { type AuthSession } from "../../lib/auth";

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

export function SessionTab({
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
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const saveTimeoutRef = React.useRef<number>();

  const handleManualNoteChange = (value: string) => {
    setManualNote(value);
    setAnalysisState("idle");
    setAnalysisMessage("");
    setSaveStatus("saving");

    if (saveTimeoutRef.current) window.clearTimeout(saveTimeoutRef.current);

    saveTimeoutRef.current = window.setTimeout(async () => {
      try {
        await saveAdlerSessionNoteDraft({
          patient_id: patient.id,
          content: value
        });
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus("idle"), 2000);
      } catch (error) {
        console.error("Auto-save failed:", error);
        setSaveStatus("error");
      }
    }, 1500);
  };
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

        isRecording={isRecording}
        manualNote={manualNote}
              saveStatus={saveStatus}
        onCaptureStart={() => {
          setTranscriptLines([]);
          setAnalysisState("idle");
          setAnalysisMessage("");
          setDraftEdited(false);
        }}
        onManualNoteChange={handleManualNoteChange}
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

export function StructuredInputField({
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

export function CognitiveMapTab({ patient, session }: { patient: Patient; session: number }) {
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

export function ClinicalEvolutionTab({
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

export function ClinicalSignalList({ items, title }: { items: string[]; title: string }) {
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

export function TimelineTab({
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

export function PsychTestsTab({ patient }: { patient: Patient }) {
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

export function PremiumMedicationsTab() {
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
      // @ts-ignore
      setResult(fallback);
      // @ts-ignore
      setSelectedResult(fallback.results?.[0] ?? null);
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

export function ClinicalInfoTile({
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

export function PremiumExamsTab() {
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

export function SherlockSidebar({ patient, session }: { patient: Patient; session: number }) {
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

export function ProgressBarWs({ color, label, value }: { color: string; label: string; value: number }) {
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

export function MedicationCard({
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
