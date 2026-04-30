import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AudioLines, ClipboardList, Mic, Square } from "lucide-react";
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
  onend: (() => void) | null;
  onerror: ((event: BrowserSpeechRecognitionErrorEvent) => void) | null;
  onresult: ((event: BrowserSpeechRecognitionEvent) => void) | null;
  start(): void;
  stop(): void;
};

type BrowserSpeechRecognitionConstructor = new () => BrowserSpeechRecognition;

type SpeechRecognitionWindow = Window & {
  SpeechRecognition?: BrowserSpeechRecognitionConstructor;
  webkitSpeechRecognition?: BrowserSpeechRecognitionConstructor;
};

type SessionRecorderPanelProps = {
  accent: string;
  accentBorder: string;
  accentSurface: string;
  fallbackTranscript: SessionTranscriptLine[];
  isRecording: boolean;
  manualNote: string;
  onCaptureStart?: () => void;
  onManualNoteChange: (value: string) => void;
  setTranscriptLines: Dispatch<SetStateAction<SessionTranscriptLine[]>>;
  toggleRecording: () => void;
  transcriptLines: SessionTranscriptLine[];
};

export function SessionRecorderPanel({
  accent,
  accentBorder,
  accentSurface,
  fallbackTranscript,
  isRecording,
  manualNote,
  onCaptureStart,
  onManualNoteChange,
  setTranscriptLines,
  toggleRecording,
  transcriptLines
}: SessionRecorderPanelProps) {
  const [isLive, setIsLive] = useState(false);
  const [interimText, setInterimText] = useState("");
  const [hasCapturedSession, setHasCapturedSession] = useState(false);
  const [recordingUrl, setRecordingUrl] = useState("");
  const [error, setError] = useState("");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const isLiveRef = useRef(false);

  useEffect(() => {
    isLiveRef.current = isLive;
  }, [isLive]);

  useEffect(() => {
    setHasCapturedSession(false);
  }, [fallbackTranscript]);

  useEffect(() => {
    return () => {
      stopSpeechRecognition();
      stopMediaTracks();
      if (recordingUrl) URL.revokeObjectURL(recordingUrl);
    };
  }, [recordingUrl]);

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
        className="rounded-[28px] border bg-[#101318]/92 p-5 shadow-panel md:p-6"
        style={{
          borderColor: isLive ? "rgba(255,77,93,0.36)" : accentBorder,
          boxShadow: isLive
            ? "0 0 34px rgba(255,77,93,0.16)"
            : `0 0 24px ${accentSurface}`
        }}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-mono text-[0.68rem] uppercase tracking-[0.32em] text-adler-subtle">
              Captura de sessao
            </p>
            <h2 className="mt-2 text-[1.55rem] font-semibold tracking-[-0.04em] text-white">
              Gravador e transcricao ao vivo
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-adler-muted">
              Usa o microfone do navegador para gerar audio local e transcricao
              em tempo real. Depois voce revisa os campos estruturados e envia
              a analise para o backend.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {isLive ? (
              <button
                type="button"
                onClick={stopLiveCapture}
                className="inline-flex items-center gap-2 rounded-full border border-red-400/28 bg-red-500/12 px-4 py-2.5 text-sm font-semibold text-red-100"
              >
                <Square className="h-4 w-4" />
                Parar captura
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void startLiveCapture()}
                className="inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/8"
                style={{ borderColor: accentBorder, backgroundColor: accentSurface }}
              >
                <Mic className="h-4 w-4" />
                Iniciar captura real
              </button>
            )}
          </div>
        </div>

        {error ? (
          <p className="mt-4 rounded-[16px] border border-amber-400/22 bg-amber-400/8 px-4 py-3 text-sm leading-6 text-amber-100">
            {error}
          </p>
        ) : null}

        <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
          <div className="rounded-[22px] border border-white/8 bg-[#151923]/86 p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <AudioLines className="h-4 w-4" style={{ color: isLive ? "#ff7b89" : accent }} />
                <h3 className="text-base font-semibold text-white">Transcricao</h3>
              </div>
              <span className="font-mono text-xs text-adler-muted">
                {isLive ? "ao vivo" : hasCapturedSession ? "captura pronta" : "demo carregada"}
              </span>
            </div>

            <div className="adler-scroll mt-4 max-h-[460px] space-y-3 overflow-y-auto pr-1">
              <AnimatePresence initial={false}>
                {visibleTranscriptLines.map((line) => (
                  <motion.article
                    key={line.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="rounded-[16px] border border-white/8 bg-black/12 px-4 py-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-white">{line.speaker}</p>
                      <p className="font-mono text-xs text-white/42">{line.timestamp}</p>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-white/78">{line.text}</p>
                  </motion.article>
                ))}
              </AnimatePresence>

              {interimText ? (
                <div className="rounded-[16px] border border-white/8 bg-white/[0.03] px-4 py-3 text-sm leading-6 text-white/54">
                  {interimText}
                </div>
              ) : null}
            </div>
          </div>

          <aside className="space-y-4">
            <div
              className="rounded-[22px] border bg-black/12 p-4"
              style={{ borderColor: accentBorder }}
            >
              <div className="flex items-center gap-3">
                <AudioLines className="h-4 w-4" style={{ color: accent }} />
                <p className="text-sm font-semibold text-white">Audio local</p>
              </div>
              {recordingUrl ? (
                <audio className="mt-4 w-full" controls src={recordingUrl}>
                  <track kind="captions" />
                </audio>
              ) : (
                <p className="mt-3 text-sm leading-6 text-adler-muted">
                  Ao parar a captura, o audio fica disponivel localmente para
                  conferencia do clinico.
                </p>
              )}
            </div>

            <div className="rounded-[22px] border border-white/8 bg-black/12 p-4">
              <div className="flex items-center gap-3">
                <ClipboardList className="h-4 w-4" style={{ color: accent }} />
                <p className="text-sm font-semibold text-white">Nota manual</p>
              </div>
              <textarea
                value={manualNote}
                onChange={(event) => onManualNoteChange(event.target.value)}
                placeholder="Anotacoes brutas, hipoteses e pontos de supervisao..."
                className="mt-4 min-h-[180px] w-full rounded-[18px] border border-white/8 bg-[#090a0c] px-4 py-3 text-sm leading-6 text-white outline-none placeholder:text-white/28 focus:border-white/16"
              />
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}
