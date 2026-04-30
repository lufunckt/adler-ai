import { AnimatePresence, motion } from "framer-motion";
import { BrainCircuit, ChevronRight } from "lucide-react";
import { useState } from "react";

type DifferentialDiagnosisCardProps = {
  accent: string;
  accentBorder: string;
  accentSurface: string;
  note: string;
  session: number;
};

export function DifferentialDiagnosisCard({
  accent,
  accentBorder,
  accentSurface,
  note,
  session
}: DifferentialDiagnosisCardProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="rounded-[22px] border border-white/8 bg-white/[0.03] p-3.5 backdrop-blur-xl">
      <button
        className="flex w-full items-center justify-between gap-3 text-left"
        onClick={() => setIsOpen((current) => !current)}
        type="button"
      >
        <div className="flex items-start gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-[14px] border"
            style={{
              color: accent,
              borderColor: accentBorder,
              backgroundColor: accentSurface
            }}
          >
            <BrainCircuit className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[0.68rem] uppercase tracking-[0.28em] text-adler-subtle">
              Analise Profunda
            </p>
            <h4 className="mt-1.5 text-[0.9rem] font-semibold tracking-[-0.02em] text-white">
              Alertas de Diagnostico Diferencial
            </h4>
          </div>
        </div>

        <motion.div animate={{ rotate: isOpen ? 90 : 0 }} transition={{ duration: 0.18 }}>
          <ChevronRight className="h-4 w-4 text-white/55" />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="mt-4 rounded-[18px] border px-4 py-3"
            style={{
              borderColor: accentBorder,
              backgroundColor: accentSurface
            }}
          >
            <p className="font-mono text-[0.65rem] uppercase tracking-[0.28em] text-adler-subtle">
              Sessao {session} | anomalia observada
            </p>
            <p className="mt-2 text-sm leading-6 text-white/88">
              {note}
            </p>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
