import React, { useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AudioLines, ClipboardList, Mic, Square, CheckCircle2
} from "lucide-react";
import type { SessionTranscriptLine } from "../lib/clinicalSession";

type BrowserSpeechRecognitionResult = ArrayLike<{ transcript: string }> & {
  isFinal: boolean;
};

type BrowserSpeechRecognitionEvent = Event & {
  resultIndex: number;
  results: ArrayLike<BrowserSpeechRecognitionResult>;
};

type BrowserSpeechRecognitionErrorEvent = Event & {
  error: string;
};

type BrowserSpeechRecognition = EventTarget & {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: (event: BrowserSpeechRecognitionEvent) => void;
  onerror: (event: BrowserSpeechRecognitionErrorEvent) => void;
  onend: () => void;
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionWindow = Window & {
  SpeechRecognition?: new () => BrowserSpeechRecognition;
  webkitSpeechRecognition?: new () => BrowserSpeechRecognition;
};

type SessionRecorderPanelProps = {
  accent: string;
  accentBorder: string;
  accentSurface: string;
  isRecording: boolean;
  manualNote: string;
  onManualNoteChange: (v: string) => void;
  saveStatus?: "idle" | "saving" | "saved" | "error";
  onCaptureStart?: () => void;
  toggleRecording: () => void;
  transcriptLines: SessionTranscriptLine[];
  setTranscriptLines: Dispatch<SetStateAction<SessionTranscriptLine[]>>;
};

const fallbackTranscript: SessionTranscriptLine[] = [
  {
    id: "f1",
    speaker: "Paciente",
    text: "Tenho me sentido muito cansado ultimamente, com dificuldade de foco no trabalho.",
    timestamp: "09:05"
  },
  {
    id: "f2",
    speaker: "Clinico",
    text: "Isso começou após a mudança na rotina de sono que discutimos na sessão anterior?",
    timestamp: "09:07"
  }
];

export function SessionRecorderPanel({
  accent,
  accentBorder,
  accentSurface,
  isRecording,
  manualNote,
  onManualNoteChange,
  saveStatus = "idle",
  onCaptureStart,
  toggleRecording,
  transcriptLines,
  setTranscriptLines
}: SessionRecorderPanelProps) {
  const [isLive, setIsLive] = useState(false);
  const [error, setError] = useState("");
  const [interimText, setInterimText] = useState("");
  const [recordingUrl, setRecordingUrl] = useState<string | null>(null);
  const [hasCapturedSession, setHasCapturedSession] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const isLiveRef = useRef(false);
  const timerRef = useRef<number>();

  const formattedElapsedTime = useMemo(() => {
    const minutes = Math.floor(elapsedSeconds / 60);
    const seconds = elapsedSeconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }, [elapsedSeconds]);

  async function startLiveCapture() {
    setError("");
    setInterimText("");

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Este navegador nao liberou captura de microfone.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];

      const recorder = new MediaRecorder(stream);
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        if (recordingUrl) URL.revokeObjectURL(recordingUrl);
        setRecordingUrl(URL.createObjectURL(blob));
        stopMediaTracks();
      };
      recorder.start();
      mediaRecorderRef.current = recorder;

      setHasCapturedSession(true);
      onCaptureStart?.();
      startSpeechRecognition();
      setIsLive(true);
      isLiveRef.current = true;

      setElapsedSeconds(0);
      timerRef.current = window.setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);

      if (!isRecording) toggleRecording();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Nao foi possivel iniciar a captura da sessao."
      );
      stopMediaTracks();
    }
  }

  function stopLiveCapture() {
    setIsLive(false);
    isLiveRef.current = false;
    stopSpeechRecognition();

    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = undefined;
    }

    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
    } else {
      stopMediaTracks();
    }

    if (isRecording) toggleRecording();
  }

  function startSpeechRecognition() {
    const speechWindow = window as SpeechRecognitionWindow;
    const Recognition =
      speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;
    if (!Recognition) {
      setError(
        "Transcricao automatica nao esta disponivel neste navegador. Use Chrome/Edge ou registre no campo manual."
      );
      return;
    }

    const recognition = new Recognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "pt-BR";
    recognition.onresult = (event: BrowserSpeechRecognitionEvent) => {
      let interim = "";
      const finals: string[] = [];

      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        const transcript = result[0]?.transcript?.trim() ?? "";
        if (!transcript) continue;
        if (result.isFinal) finals.push(transcript);
        else interim += `${transcript} `;
      }

      if (finals.length) {
        setTranscriptLines((current) => [
          ...current,
          ...finals.map((text) => ({
            id: crypto.randomUUID(),
            speaker: "Sessao ao vivo",
            text,
            timestamp: new Date().toLocaleTimeString("pt-BR", {
              hour: "2-digit",
              minute: "2-digit"
            })
          }))
        ]);
      }
      setInterimText(interim.trim());
    };
    recognition.onerror = (event: BrowserSpeechRecognitionErrorEvent) => {
      setError(`Transcricao interrompida pelo navegador: ${event.error}.`);
    };
    recognition.onend = () => {
      if (!isLiveRef.current) return;
      try {
        recognition.start();
      } catch {
        // Browsers can throw if recognition is already restarting.
      }
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch {
      setError("Nao foi possivel iniciar a transcricao automatica.");
    }
  }

  function stopSpeechRecognition() {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
  }

  function stopMediaTracks() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    mediaRecorderRef.current = null;
  }

  const visibleTranscriptLines =
    transcriptLines.length > 0 || hasCapturedSession
      ? transcriptLines
      : fallbackTranscript;

  return (
    <div className="mx-auto grid max-w-6xl gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
      <section
        className="rounded-[32px] border bg-[#0d1016]/95 p-6 shadow-2xl md:p-8 backdrop-blur-md"
        style={{
          borderColor: isLive ? "rgba(244,63,94,0.4)" : "rgba(255,255,255,0.08)",
          boxShadow: isLive
            ? "0 0 40px rgba(244,63,94,0.12)"
            : "0 4px 24px rgba(0,0,0,0.4)"
        }}
      >
        <div className="flex flex-wrap items-center justify-between gap-6 border-b border-white/8 pb-8">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <div className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-white/[0.03] border border-white/10">
                <Mic className="h-5 w-5 text-rose-400" />
                {isLive && (
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
                  </span>
                )}
              </div>
              <div>
                <p className="font-mono text-[0.62rem] uppercase tracking-[0.3em] text-white/40">
                  Sistema de Captura
                </p>
                <h2 className="mt-1 text-2xl font-bold tracking-tight text-white">
                  Sessão Clínica <span className="text-white/40">v2.0</span>
                </h2>
              </div>
            </div>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/50">
              Captura multidimensional com transcrição em tempo real e buffer de áudio local para revisão.
              A análise estruturada é processada após a conclusão da sessão.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-white/[0.02] border border-white/8 p-2 rounded-[24px]">
            <div className="px-6 py-2">
              <p className="text-[0.62rem] uppercase tracking-widest text-white/30 font-mono">Duração</p>
              <p className="text-xl font-bold font-mono text-white mt-0.5 tracking-wider">
                {isLive ? formattedElapsedTime : "00:00"}
              </p>
            </div>
            {isLive ? (
              <button
                type="button"
                onClick={stopLiveCapture}
                className="h-14 px-8 flex items-center gap-3 rounded-[18px] bg-rose-500 text-white font-bold text-sm transition hover:bg-rose-600 shadow-lg shadow-rose-500/20"
              >
                <Square className="h-4 w-4 fill-current" />
                Encerrar Captura
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void startLiveCapture()}
                className="h-14 px-8 flex items-center gap-3 rounded-[18px] bg-white/[0.05] border border-white/10 text-white font-bold text-sm transition hover:bg-white/10 hover:border-white/20"
              >
                <div className="h-2 w-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]" />
                Iniciar Atendimento
              </button>
            )}
          </div>
        </div>

        {error ? (
          <p className="mt-4 rounded-[16px] border border-amber-400/22 bg-amber-400/8 px-4 py-3 text-sm leading-6 text-amber-100">
            {error}
          </p>
        ) : null}

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="flex flex-col rounded-[28px] border border-white/8 bg-white/[0.015] overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/8 bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/[0.04]">
                  <AudioLines className="h-4 w-4 text-rose-400" />
                </div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Monitor de Transcrição</h3>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/8">
                <div className={`h-1.5 w-1.5 rounded-full ${isLive ? 'bg-rose-500 animate-pulse' : 'bg-white/20'}`} />
                <span className="font-mono text-[0.62rem] uppercase tracking-widest text-white/40">
                  {isLive ? "Processando fluxo" : hasCapturedSession ? "Concluído" : "Aguardando"}
                </span>
              </div>
            </div>

            <div className="adler-scroll flex-1 max-h-[520px] min-h-[400px] overflow-y-auto p-6 space-y-6">
              <AnimatePresence initial={false}>
                {visibleTranscriptLines.map((line) => (
                  <motion.article
                    key={line.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="relative pl-6 border-l-2 border-white/5"
                  >
                    <div className="absolute left-[-5px] top-1 h-2 w-2 rounded-full bg-rose-500/30 border border-rose-500/50" />
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[0.68rem] font-bold uppercase tracking-widest text-rose-400/80">
                        {line.speaker}
                      </span>
                      <span className="font-mono text-[0.62rem] text-white/30">{line.timestamp}</span>
                    </div>
                    <p className="text-[0.92rem] leading-relaxed text-white/80 font-medium">
                      {line.text}
                    </p>
                  </motion.article>
                ))}
              </AnimatePresence>

              {interimText ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="pl-6 border-l-2 border-rose-500/20 italic"
                >
                  <p className="text-[0.92rem] leading-relaxed text-white/40">
                    {interimText}...
                  </p>
                </motion.div>
              ) : null}

              {!isLive && !hasCapturedSession && !transcriptLines.length && (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-30 py-20">
                  <Mic className="h-12 w-12 mb-4" />
                  <p className="text-sm font-medium">Aguardando início da sessão para<br/>iniciar a transcrição assistida.</p>
                </div>
              )}
            </div>
          </div>

          <aside className="space-y-6">
            <div className="rounded-[28px] border border-white/8 bg-white/[0.02] p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/[0.04]">
                  <AudioLines className="h-4 w-4 text-rose-400" />
                </div>
                <p className="text-xs font-bold text-white uppercase tracking-wider">Buffer de Áudio</p>
              </div>

              {recordingUrl ? (
                <div className="space-y-4">
                  <audio className="w-full h-10 accent-rose-500" controls src={recordingUrl}>
                    <track kind="captions" />
                  </audio>
                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                    <p className="text-[0.62rem] text-white/40 leading-relaxed">
                      O áudio é processado localmente e não é enviado aos servidores de IA para garantir a privacidade total do paciente.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="py-8 flex flex-col items-center justify-center text-center px-4">
                  <div className={`h-12 w-12 rounded-full border-2 border-dashed border-white/10 flex items-center justify-center mb-4 ${isLive ? 'animate-pulse' : ''}`}>
                    <Mic className="h-5 w-5 text-white/20" />
                  </div>
                  <p className="text-xs leading-relaxed text-white/30">
                    O buffer de áudio será gerado automaticamente ao encerrar a sessão.
                  </p>
                </div>
              )}
            </div>

            <div className="rounded-[28px] border border-white/8 bg-white/[0.02] p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/[0.04]">
                  <ClipboardList className="h-4 w-4 text-rose-400" />
                </div>
                <p className="text-xs font-bold text-white uppercase tracking-wider">Notas Rápidas</p>
                {saveStatus !== "idle" && (
                  <div className="ml-auto flex items-center gap-1.5">
                    {saveStatus === "saving" && <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400" />}
                    {saveStatus === "saved" && <CheckCircle2 className="h-3 w-3 text-emerald-400" />}
                    <span className="text-[0.62rem] font-medium text-white/40">
                      {saveStatus === "saving" ? "Salvando..." : saveStatus === "saved" ? "Salvo" : "Erro"}
                    </span>
                  </div>
                )}
              </div>
              <p className="text-[0.62rem] text-white/30 mb-4 leading-relaxed">
                Use este espaço para observações fenomênicas ou insights imediatos que a IA pode não capturar.
              </p>
              <textarea
                value={manualNote}
                onChange={(event) => onManualNoteChange(event.target.value)}
                placeholder="Ex: Paciente evitou contato visual ao falar sobre..."
                className="w-full min-h-[220px] rounded-2xl border border-white/8 bg-black/20 p-4 text-sm leading-relaxed text-white/80 outline-none placeholder:text-white/10 focus:border-rose-500/30 focus:bg-black/40 transition-all"
              />
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}
