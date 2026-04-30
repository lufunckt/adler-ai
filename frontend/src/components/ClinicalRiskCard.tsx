import { motion } from "framer-motion";
import { Activity, ChevronRight } from "lucide-react";

type ClinicalRiskCardProps = {
  focusLabel: string;
  note: string;
  score: number;
  session: number;
  severity: "stable" | "guarded" | "critical";
};

export function ClinicalRiskCard({
  focusLabel,
  note,
  score,
  session,
  severity
}: ClinicalRiskCardProps) {
  const riskTone = resolveRiskTone(score);
  const isCritical = severity === "critical";

  return (
    <motion.section
      animate={{
        boxShadow: isCritical
          ? [
              `0 0 0 1px ${riskTone.border}, 0 0 24px ${riskTone.glow}`,
              `0 0 0 1px ${riskTone.border}, 0 0 42px ${riskTone.glow}`,
              `0 0 0 1px ${riskTone.border}, 0 0 24px ${riskTone.glow}`
            ]
          : `0 0 0 1px ${riskTone.border}, 0 0 24px ${riskTone.glow}`
      }}
      transition={{
        duration: isCritical ? 1.8 : 0.22,
        ease: "easeInOut",
        repeat: isCritical ? Infinity : 0
      }}
      className="rounded-[24px] border bg-white/[0.035] p-4 backdrop-blur-xl"
      style={{
        borderColor: riskTone.border,
        background:
          "linear-gradient(145deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))"
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[0.68rem] uppercase tracking-[0.28em] text-adler-subtle">
            Vigilancia Clinica
          </p>
          <h4 className="mt-2 text-base font-semibold tracking-[-0.03em] text-white">
            Escore de Risco Clinico
          </h4>
        </div>

        <span
          className="rounded-full border px-3 py-1.5 font-mono text-[0.68rem] uppercase tracking-[0.24em]"
          style={{
            color: riskTone.accent,
            backgroundColor: riskTone.surface,
            borderColor: riskTone.border
          }}
        >
          {score}% {isCritical ? "Critico" : severity === "guarded" ? "Moderado" : "Estavel"}
        </span>
      </div>

      <div className="mt-4 rounded-[18px] border border-white/8 bg-black/12 px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <span className="font-mono text-[0.68rem] uppercase tracking-[0.24em] text-adler-subtle">
            {focusLabel}
          </span>
          <span className="font-mono text-xs text-white/70">Sessao {session}</span>
        </div>

        <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/8">
          <motion.div
            className="h-full rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${score}%` }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            style={{
              background: `linear-gradient(90deg, ${riskTone.accent}, rgba(255,255,255,0.92))`
            }}
          />
        </div>
      </div>

      <p className="mt-4 text-sm leading-6 text-white/84">{note}</p>

      <div className="mt-4 flex items-center gap-3 font-mono text-xs text-adler-muted">
        <div
          className="flex h-8 w-8 items-center justify-center rounded-[12px] border"
          style={{
            borderColor: riskTone.border,
            backgroundColor: riskTone.surface,
            color: riskTone.accent
          }}
        >
          <Activity className="h-4 w-4" />
        </div>
        <span>Estado de vigilancia clinica: {severityLabel(severity)}.</span>
        <ChevronRight className="h-4 w-4" />
      </div>
    </motion.section>
  );
}

function resolveRiskTone(score: number) {
  if (score >= 60) {
    return {
      accent: "#ef4444",
      border: "rgba(239, 68, 68, 0.34)",
      glow: "rgba(239, 68, 68, 0.28)",
      surface: "rgba(239, 68, 68, 0.12)"
    };
  }

  if (score >= 45) {
    return {
      accent: "#f59e0b",
      border: "rgba(245, 158, 11, 0.3)",
      glow: "rgba(245, 158, 11, 0.2)",
      surface: "rgba(245, 158, 11, 0.1)"
    };
  }

  return {
    accent: "#22c55e",
    border: "rgba(34, 197, 94, 0.28)",
    glow: "rgba(34, 197, 94, 0.18)",
    surface: "rgba(34, 197, 94, 0.1)"
  };
}

function severityLabel(severity: "stable" | "guarded" | "critical") {
  if (severity === "critical") {
    return "escalada critica";
  }

  if (severity === "guarded") {
    return "monitoramento moderado";
  }

  return "janela estavel";
}
