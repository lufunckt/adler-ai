import { motion, AnimatePresence } from "framer-motion";
import { Pill, Search, Shield, Info, ExternalLink, Activity, Plus } from "lucide-react";
import { useState, useMemo } from "react";
import {
  fetchAdlerMedicationSearch,
  type AdlerMedicationSearchResponse,
  type MedicationSearchResult
} from "../../api/client";

function ProgressBarWs({ color, label, value }: { color: string; label: string; value: number }) {
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

export function MedicationCard({
  alert,
  detail,
  efficacy,
  title,
  type
}: {
  alert?: string;
  detail: string;
  efficacy: number;
  title: string;
  type: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">{type}</p>
          <p className="mt-1 text-lg font-bold text-gray-900">{title}</p>
        </div>
        <Pill className="h-5 w-5 text-rose-500" />
      </div>
      <p className="mt-3 text-sm leading-6 text-gray-600">{detail}</p>
      <ProgressBarWs color="#f43f5e" label="Eficácia estimada" value={efficacy} />
      {alert ? <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{alert}</div> : null}
    </div>
  );
}

function capitalizeMedication(value: string) {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function MedicationsTab() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AdlerMedicationSearchResponse | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    try {
      const data = await fetchAdlerMedicationSearch(query);
      setResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
       <form onSubmit={handleSearch} className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <Search className="h-5 w-5 text-gray-400" />
          <input
            type="text"
            className="flex-1 bg-transparent text-sm outline-none"
            placeholder="Buscar medicamento (ex: Sertralina)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button type="submit" disabled={loading} className="rounded-xl bg-gray-900 px-4 py-2 text-xs font-bold text-white hover:bg-gray-800 disabled:opacity-50">
            {loading ? "Buscando..." : "Pesquisar"}
          </button>
       </form>

       <div className="grid gap-6 lg:grid-cols-2">
          <MedicationCard
            title="Sertralina"
            type="Ativo"
            efficacy={85}
            detail="Inibidor seletivo da recaptação de serotonina usado para TOC e ansiedade."
          />
       </div>

       {result && (
         <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-2xl border border-rose-100 bg-rose-50/30 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Resultado da Busca: {result.normalized_query}</h3>
            <p className="text-sm text-gray-600">Dados técnicos recuperados da API Adler.</p>
         </motion.div>
       )}
    </div>
  );
}
