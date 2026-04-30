import { AnimatePresence, motion } from "framer-motion";
import { BadgeCheck, ExternalLink, Microscope, X } from "lucide-react";
import type { EvidenceSource } from "../data/evidenceSources";

type EvidenceModalProps = {
  accent: string;
  accentBorder: string;
  accentSurface: string;
  description: string;
  onClose: () => void;
  sources: EvidenceSource[];
  title: string;
};

export function EvidenceModal({
  accent,
  accentBorder,
  accentSurface,
  description,
  onClose,
  sources,
  title
}: EvidenceModalProps) {
  return (
    <AnimatePresence>
      <motion.div
        animate={{ opacity: 1 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-10 backdrop-blur-md"
        exit={{ opacity: 0 }}
        initial={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="relative w-full max-w-3xl rounded-[30px] border border-adler-border bg-[#0f1318]/96 p-6 shadow-panel md:p-7"
          exit={{ opacity: 0, scale: 0.97, y: 8 }}
          initial={{ opacity: 0, scale: 0.97, y: 12 }}
          onClick={(event) => event.stopPropagation()}
          style={{
            boxShadow: `0 0 0 1px ${accentBorder}, 0 0 36px ${accentSurface}, 0 34px 100px rgba(0,0,0,0.48)`
          }}
          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        >
          <button
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full border border-white/8 bg-white/5 text-white/72 transition hover:bg-white/8 hover:text-white"
            onClick={onClose}
            type="button"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="pr-10">
            <div className="flex items-start gap-4">
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] border"
                style={{
                  color: accent,
                  borderColor: accentBorder,
                  backgroundColor: accentSurface
                }}
              >
                <Microscope className="h-5 w-5" />
              </div>
              <div>
                <p className="font-mono text-[0.68rem] uppercase tracking-[0.32em] text-adler-subtle">
                  The Source of Truth
                </p>
                <h3 className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-white">
                  {title}
                </h3>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-adler-muted">
                  {description}
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-[22px] border border-white/8 bg-[#16181d] p-5">
              <div className="flex items-center gap-3">
                <BadgeCheck className="h-5 w-5 text-emerald-300" />
                <p className="text-sm font-semibold tracking-[-0.02em] text-white">
                  Human-Curated Data: Validated by Neuroscientists & Clinical
                  Psychologists
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {sources.map((source) => (
                <a
                  key={source.href}
                  className="flex items-start justify-between gap-4 rounded-[20px] border border-white/8 bg-[#15181d] px-4 py-4 transition hover:border-white/14 hover:bg-[#181b21]"
                  href={source.href}
                  rel="noreferrer"
                  target="_blank"
                >
                  <div>
                    <p className="font-mono text-[0.68rem] uppercase tracking-[0.28em] text-adler-subtle">
                      Fonte: {source.source}
                    </p>
                    <p className="mt-2 text-sm leading-7 text-white/88">{source.title}</p>
                  </div>
                  <ExternalLink className="mt-1 h-4 w-4 shrink-0 text-white/52" />
                </a>
              ))}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
