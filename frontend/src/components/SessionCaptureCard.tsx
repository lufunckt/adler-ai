import { AnimatePresence, motion } from "framer-motion";
import { Activity, AudioLines, Dot } from "lucide-react";
import type { PatientRecord } from "../data/patientData";

type SessionCaptureCardProps = {
  accent: string;
  accentBorder: string;
  accentSurface: string;
  isRecording: boolean;
  patient: PatientRecord;
};

export function SessionCaptureCard({
  accent,
  accentBorder,
  accentSurface,
  isRecording,
  patient
}: SessionCaptureCardProps) {
  return (
    <section
      className="mt-6 rounded-[28px] border bg-white/[0.02] p-5 backdrop-blur-md"
      style={{
        borderColor: isRecording ? "rgba(244,63,94,0.35)" : "rgba(255,255,255,0.08)",
        boxShadow: isRecording
          ? "0 0 32px rgba(244,63,94,0.1)"
          : "0 4px 20px rgba(0,0,0,0.2)"
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <div className={`h-1.5 w-1.5 rounded-full ${isRecording ? 'bg-rose-500 animate-pulse' : 'bg-white/20'}`} />
            <p className="text-[0.62rem] font-bold uppercase tracking-[0.25em] text-white/30">
              Captura em Tempo Real
            </p>
          </div>
          <h3 className="text-lg font-bold tracking-tight text-white leading-tight">
            {patient.recorder.title}
          </h3>
        </div>

        <div
          className="px-3 py-1.5 rounded-xl border font-mono text-[0.68rem] font-bold tracking-wider"
          style={{
            color: isRecording ? "#fb7185" : "rgba(255,255,255,0.4)",
            borderColor: isRecording ? "rgba(244,63,94,0.3)" : "rgba(255,255,255,0.08)",
            backgroundColor: isRecording ? "rgba(244,63,94,0.08)" : "rgba(255,255,255,0.02)"
          }}
        >
          {isRecording ? "AO VIVO" : patient.recorder.duration}
        </div>
      </div>

      <p className="mt-3 text-sm leading-6 text-white/82">{patient.recorder.summary}</p>

      <div className="mt-5 rounded-2xl border border-white/5 bg-black/20 p-4">
        <div className="mb-4 flex items-center justify-between gap-3 border-b border-white/5 pb-3">
          <div className="flex items-center gap-2">
            <AudioLines className="h-3.5 w-3.5 text-rose-400" />
            <span className="text-[0.62rem] font-bold uppercase tracking-widest text-white/30">
              Fluxo de Transcrição
            </span>
          </div>
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={isRecording ? "recording" : "loaded"}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="font-mono text-[0.62rem] font-bold text-white/20 uppercase tracking-tighter"
            >
              {isRecording ? "Sincronizando..." : "Histórico local"}
            </motion.span>
          </AnimatePresence>
        </div>

        <div className="adler-scroll max-h-[240px] space-y-4 overflow-y-auto pr-2">
          {patient.recorder.transcriptSegments.slice(0, 3).map((segment) => (
            <div
              key={segment.id}
              className="relative pl-4 border-l border-white/5"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[0.62rem] font-bold uppercase tracking-widest text-rose-400/60">
                  {segment.speaker}
                </span>
                <span className="font-mono text-[0.62rem] text-white/20">{segment.timestamp}</span>
              </div>
              <p className="text-xs leading-relaxed text-white/60 line-clamp-2">
                {segment.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
