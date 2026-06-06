import { motion } from "framer-motion";
import { Pill, Search, Shield, Info, Activity, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { api } from "../../api/client";

interface MedicationValidated {
  id: string;
  generic_name: string;
  class_name: string;
  mechanism: string;
  interactions: { [key: string]: string } | null;
  evidence: {
    source: string;
    level: string;
    summary: string;
  }[];
}

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

export function MedicationsTab() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<MedicationValidated[]>([]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    try {
      const data = await api.get(`/api/adler/science/medications/search-validated?q=${encodeURIComponent(query)}`);
      setResults(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
       <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Farmacologia Baseada em Evidências</h2>
            <p className="text-sm text-gray-500">Busca em base curada (Stahl, NICE) e evidências clínicas.</p>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-600">
            <Shield className="h-4 w-4" />
            Adler Verified
          </div>
       </div>

       <form onSubmit={handleSearch} className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500/20">
          <Search className="h-5 w-5 text-gray-400" />
          <input
            type="text"
            className="flex-1 bg-transparent text-sm outline-none"
            placeholder="Buscar medicamento ou classe (ex: Sertralina, ISRS)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button type="submit" disabled={loading} className="rounded-xl bg-gray-900 px-6 py-2 text-xs font-bold text-white hover:bg-gray-800 disabled:opacity-50 transition-all">
            {loading ? "Processando..." : "Pesquisar"}
          </button>
       </form>

       <div className="grid gap-6 lg:grid-cols-2">
          {results.map((med) => (
            <div key={med.id} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-50 text-rose-500">
                    <Pill className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{med.generic_name}</h3>
                    <p className="text-xs font-semibold text-rose-600 uppercase tracking-widest">{med.class_name}</p>
                  </div>
                </div>
                <div className="rounded-full bg-green-50 px-2 py-1">
                   <ShieldCheck className="h-4 w-4 text-green-600" />
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <div>
                  <h4 className="text-xs font-bold uppercase text-gray-400 mb-1">Mecanismo de Ação</h4>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {med.mechanism || "Informação em atualização na base técnica."}
                  </p>
                </div>

                {med.interactions && Object.keys(med.interactions).length > 0 && (
                  <div className="rounded-xl bg-amber-50 p-4">
                    <h4 className="text-xs font-bold text-amber-800 flex items-center gap-2 mb-2">
                      <Activity className="h-3 w-3" />
                      INTERAÇÕES CRÍTICAS
                    </h4>
                    <ul className="space-y-1">
                      {Object.entries(med.interactions).map(([key, val]) => (
                        <li key={key} className="text-xs text-amber-700">
                          <span className="font-bold uppercase">{key}:</span> {val}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="pt-4 border-t border-gray-100">
                  <h4 className="text-xs font-bold uppercase text-gray-400 mb-3">Evidências e Diretrizes</h4>
                  {med.evidence.length > 0 ? (
                    <div className="space-y-3">
                      {med.evidence.map((ev, i) => (
                        <div key={i} className="rounded-lg border border-gray-100 p-3 bg-gray-50/50">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-bold text-indigo-600 uppercase">{ev.source}</span>
                            <span className="text-[10px] font-medium bg-indigo-100 text-indigo-700 px-1.5 rounded">Nível {ev.level}</span>
                          </div>
                          <p className="text-xs text-gray-600 italic">"{ev.summary}"</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 italic">Consulte o guia NICE para evidências de primeira linha.</p>
                  )}
                </div>
              </div>
            </div>
          ))}

          {!loading && results.length === 0 && query && (
             <div className="col-span-full py-12 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                <Info className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                <p className="text-gray-500 font-medium">Nenhum dado validado encontrado para "{query}".</p>
                <p className="text-xs text-gray-400 mt-1">Tente termos como "Sertralina", "ISRS" ou "Lítio".</p>
             </div>
          )}
       </div>
    </div>
  );
}
