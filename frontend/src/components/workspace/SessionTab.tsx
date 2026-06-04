import { motion, AnimatePresence } from "framer-motion";
import { Brain, CheckCircle2, FileText, Send, Sparkles } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import {
  analyzeAdlerClinicalSession,
  type AdlerClinicalSessionInput
} from "../../api/client";
import { Patient, StructuredSessionDraft } from "../../types";
import { SessionRecorderPanel } from "../SessionRecorderPanel";
import {
  buildClinicalSessionPayload,
  createInitialStructuredSessionDraft,
  deriveStructuredDraftFromContent
} from "../../lib/clinicalSession";

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
        rows={rows}
        className="w-full rounded-xl border border-gray-100 bg-gray-50/50 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-rose-200 focus:bg-white focus:ring-4 focus:ring-rose-500/5 figma-scroll"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}
