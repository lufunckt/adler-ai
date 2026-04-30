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
      className="mt-4 rounded-[24px] border bg-white/[0.035] p-4 backdrop-blur-xl"
      style={{
        borderColor: isRecording ? "rgba(255,77,93,0.28)" : accentBorder,
        boxShadow: isRecording
          ? "0 0 28px rgba(255,77,93,0.16)"
          : `0 0 24px ${accentSurface}`
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[0.68rem] uppercase tracking-[0.28em] text-adler-subtle">
            Captura da Sessao
          </p>
          <h3 className="mt-2 text-base font-semibold tracking-[-0.03em] text-white">
            {patient.recorder.title}
          </h3>
        </div>

        <span
          className="rounded-full border px-3 py-1.5 font-mono text-[0.68rem] uppercase tracking-[0.22em]"
          style={{
            color: isRecording ? "#ff7b89" : accent,
            borderColor: isRecording ? "rgba(255,77,93,0.32)" : accentBorder,
            backgroundColor: isRecording ? "rgba(255,77,93,0.1)" : accentSurface
          }}
        >
          {isRecording ? "analise ao vivo" : patient.recorder.duration}
        </span>
      </div>

      <p className="mt-3 text-sm leading-6 text-white/82">{patient.recorder.summary}</p>

      <div className="mt-4 rounded-[18px] border border-white/8 bg-black/12 px-3 py-3">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4" style={{ color: accent }} />
            <span className="font-mono text-[0.68rem] uppercase tracking-[0.24em] text-adler-subtle">
              Fluxo de transcricao
            </span>
          </div>
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={isRecording ? "recording" : "loaded"}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="font-mono text-xs text-white/62"
            >
              {isRecording ? "buffer atualizando" : "trecho carregado"}
            </motion.span>
          </AnimatePresence>
        </div>

        <div className="adler-scroll max-h-[270px] space-y-3 overflow-y-auto pr-1">
          {patient.recorder.transcriptSegments.slice(0, 3).map((segment) => (
            <div
              key={segment.id}
              className="rounded-[16px] border border-white/6 bg-white/[0.025] px-3 py-3"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <AudioLines className="h-3.5 w-3.5" style={{ color: accent }} />
                  <span className="text-xs font-semibold tracking-[-0.01em] text-white">
                    {segment.speaker}
                  </span>
                </div>
                <div className="flex items-center gap-2 font-mono text-[0.68rem] uppercase tracking-[0.18em] text-adler-subtle">
                  {isRecording ? <Dot className="h-4 w-4 text-adler-red" /> : null}
                  <span>{segment.timestamp}</span>
                </div>
              </div>
              <p className="mt-2 text-[0.82rem] leading-6 text-white/78">{segment.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
