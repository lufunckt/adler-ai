import { motion } from "framer-motion";
import { Search, UserPlus, Download, ArrowRight, Trash2 } from "lucide-react";
import { useState } from "react";
import { Patient } from "../types";
import { avatarClass } from "../utils";

export function PatientsPage({
  onAddPatient,
  onOpenPatient,
  onDeletePatient,
  patients
}: {
  onAddPatient: () => void;
  onOpenPatient: (id: string) => void;
  onDeletePatient: (id: string) => void;
  patients: Patient[];
}) {
  const [search, setSearch] = useState("");
  const filtered = patients.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.focus.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Pacientes</h1>
          <p className="mt-1 text-sm text-gray-500">Gestão de prontuários e protocolos ativos</p>
        </div>
        <button
          onClick={onAddPatient}
          className="inline-flex items-center gap-2 rounded-xl bg-rose-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-rose-600"
        >
          <UserPlus className="h-4 w-4" /> Novo paciente
        </button>
      </div>

      <div className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <Search className="h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar por nome, foco ou diagnóstico..."
          className="flex-1 bg-transparent text-sm outline-none"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2 2xl:grid-cols-3">
        {filtered.map((p, i) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="group relative flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md"
          >
            <div className="flex flex-1 items-start gap-4 p-5">
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-lg font-bold ${avatarClass(i)}`}>
                {p.initials}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="truncate font-bold text-gray-900">{p.name}</h3>
                  <div className="flex items-center gap-2">
                    <span className={`h-1.5 w-1.5 rounded-full ${p.status === "active" ? "bg-emerald-500" : "bg-gray-300"}`} />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                      {p.status}
                    </span>
                  </div>
                </div>
                <p className="mt-1 line-clamp-1 text-xs text-gray-500">{p.focus}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="rounded-lg bg-gray-50 px-2 py-1 text-[10px] font-medium text-gray-600">
                    {p.sessions} sessões
                  </span>
                  <span className="rounded-lg bg-rose-50 px-2 py-1 text-[10px] font-medium text-rose-600">
                    {p.protocol.split("·")[0]}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50/50 px-5 py-3">
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Risco</p>
                  <p className={`font-mono text-xs font-bold ${p.risk >= 60 ? "text-red-500" : "text-amber-600"}`}>
                    {p.risk}%
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Progresso</p>
                  <p className="font-mono text-xs font-bold text-emerald-600">{p.progress}%</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onDeletePatient(p.id)}
                  className="rounded-lg p-2 text-gray-300 hover:bg-red-50 hover:text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => onOpenPatient(p.id)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-gray-900 px-4 py-2 text-xs font-bold text-white transition hover:bg-gray-800"
                >
                  Workspace <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
