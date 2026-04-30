import { motion } from "framer-motion";

type InsightCardProps = {
  accent: string;
  accentBorder: string;
  accentSurface: string;
  confidence: number;
  description: string;
  onClick?: () => void;
  title: string;
};

export function InsightCard({
  accent,
  accentBorder,
  accentSurface,
  confidence,
  description,
  onClick,
  title
}: InsightCardProps) {
  return (
    <button
      className="w-full overflow-hidden rounded-xl border bg-[#16181d] p-3.5 text-left transition hover:bg-[#191c22]"
      onClick={onClick}
      type="button"
      style={{
        borderColor: accentBorder,
        boxShadow: `0 0 24px ${accentSurface}`
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h4 className="text-sm font-semibold tracking-[-0.02em] text-white">
            {title}
          </h4>
          <p className="mt-2 text-sm leading-6 text-adler-muted">{description}</p>
        </div>

        <div className="rounded-full border border-white/8 bg-black/10 px-2.5 py-1 font-mono text-[0.68rem] tracking-[0.2em] text-white/65">
          AO VIVO
        </div>
      </div>

      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[0.68rem] uppercase tracking-[0.26em] text-adler-subtle">
            Confianca
          </span>
          <span className="font-mono text-sm font-semibold" style={{ color: accent }}>
            {confidence}%
          </span>
        </div>

        <div className="h-2 overflow-hidden rounded-full bg-white/6">
          <motion.div
            className="h-full rounded-full"
            style={{
              background: `linear-gradient(90deg, ${accent}, rgba(255,255,255,0.92))`
            }}
            initial={{ width: 0 }}
            animate={{ width: `${confidence}%` }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
      </div>
    </button>
  );
}
