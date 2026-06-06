import { motion } from "framer-motion";
import { Brain, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { Patient } from "../../types";

export function SherlockSidebar({ patient, session }: { patient: Patient; session: number }) {
  const [open, setOpen] = useState(false);
  const risk = session <= 6 ? 65 : patient.risk;

  return (
    <aside className="figma-scroll hidden h-full w-[320px] shrink-0 overflow-y-auto border-l border-gray-200 bg-white p-5 2xl:block">
      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-gray-400">Sherlock Insights</p>
      <h3 className="mt-2 text-lg font-bold text-gray-900">Leitura clínica</h3>
      <p className="mt-2 text-sm leading-6 text-gray-500">
        Sessão {session}. Foco em modos, necessidades emocionais e padrões de enfrentamento.
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
