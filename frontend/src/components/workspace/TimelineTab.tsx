import { motion } from "framer-motion";
import { Activity } from "lucide-react";
import { Patient } from "../../types";

export function TimelineTab({
  patient,
  session,
  setSession
}: {
  patient: Patient;
  session: number;
  setSession: (v: number) => void;
}) {
  const points = Array.from({ length: 18 }, (_, i) => ({
    anxiety: 82 - i * 3.2 + (i % 3) * 2,
    mood: 44 + i * 2.4 + (i % 4) * 2,
    adherence: 84 + (i % 2) * 3,
    session: i + 1,
    x: 5 + i * 5.2
  }));
  const line = (key: "adherence" | "anxiety" | "mood") => points.map((p) => `${p.x},${100 - p[key]}`).join(" ");

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-7 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-widest text-rose-500">Evolução temporal</p>
      <h2 className="mt-2 text-2xl font-bold tracking-tight text-gray-900">Sessão {session} de {patient.name}</h2>
      <div className="mt-5 flex gap-4 text-xs">
        {[
          ["Ansiedade", "#ef4444"],
          ["Humor", "#f43f5e"],
          ["Aderência", "#10b981"]
        ].map(([label, color]) => (
          <div key={label} className="flex items-center gap-1.5">
            <span className="h-2 w-5 rounded-full" style={{ background: color }} />
            {label}
          </div>
        ))}
      </div>
      <div className="mt-4 rounded-xl border border-gray-100 bg-gray-50 p-4">
        <svg className="h-[280px] w-full" preserveAspectRatio="none" viewBox="0 0 100 100">
          <polyline fill="none" opacity="0.6" points={line("anxiety")} stroke="#ef4444" strokeWidth="0.8" />
          <polyline fill="none" opacity="0.9" points={line("mood")} stroke="#f43f5e" strokeWidth="0.9" />
          <polyline fill="none" opacity="0.7" points={line("adherence")} stroke="#10b981" strokeWidth="0.8" />
        </svg>
      </div>
      <div className="mt-5">
        <div className="mb-2 flex justify-between text-xs text-gray-500">
          <span>Sessão 1</span>
          <span className="font-semibold text-gray-900">Sessão {session}</span>
          <span>Sessão 18</span>
        </div>
        <input
          className="w-full accent-rose-500"
          max={18}
          min={1}
          onChange={(e) => setSession(Number(e.target.value))}
          type="range"
          value={session}
        />
      </div>
    </div>
  );
}
