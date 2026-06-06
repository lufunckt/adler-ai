import React, { useState } from 'react';
import { Search, Book, ShieldCheck, Info } from 'lucide-react';
import { api } from '../api/client';

interface DSMCriteria {
  id: string;
  subject: string;
  source: string;
  content: {
    criteria_a?: string;
    symptoms?: string[];
    impairment?: string;
    exclusion?: string;
    [key: string]: any;
  };
}

export function DSMPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<DSMCriteria[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query) return;
    setLoading(true);
    try {
      const data = await api.get(`/api/adler/science/dsm/search?q=${encodeURIComponent(query)}`);
      setResults(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rigor Científico: DSM-5-TR</h1>
          <p className="text-gray-500">Consulta de critérios diagnósticos validados e literatura técnica.</p>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <form onSubmit={handleSearch} className="relative">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            className="w-full rounded-xl border border-gray-200 py-3 pl-12 pr-4 focus:border-indigo-500 focus:ring-indigo-500"
            placeholder="Buscar por transtorno (ex: Depressão, TAG, TOC)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </form>

        {loading && (
          <div className="mt-8 flex justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
          </div>
        )}

        <div className="mt-8 space-y-6">
          {results.map((item) => (
            <div key={item.id} className="rounded-xl border border-gray-100 bg-gray-50/50 p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
                    <Book className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{item.subject}</h3>
                    <span className="text-xs font-medium text-indigo-600 uppercase tracking-wider">{item.source}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                  {item.reference_icon === "ShieldCheck" ? <ShieldCheck className="h-3 w-3" /> : <Book className="h-3 w-3" />}
                  Padrão-Ouro
                </div>
              </div>

              <div className="mt-6 grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700">Critério Principal (A)</h4>
                    <p className="mt-1 text-sm text-gray-600 leading-relaxed">
                      {item.content.criteria_a || 'Consulte o manual para a descrição completa.'}
                    </p>
                  </div>
                  {item.content.symptoms && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700">Sintomas Identificadores</h4>
                      <ul className="mt-2 space-y-1">
                        {item.content.symptoms.map((s, idx) => (
                          <li key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                            <div className="h-1.5 w-1.5 rounded-full bg-indigo-400"></div>
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                <div className="space-y-4 border-l border-gray-200 pl-6">
                  <div className="rounded-lg bg-blue-50 p-4">
                    <div className="flex items-center gap-2 text-blue-700">
                      <Info className="h-4 w-4" />
                      <span className="text-xs font-bold uppercase">Prejuízo Clínico</span>
                    </div>
                    <p className="mt-2 text-xs text-blue-600 leading-relaxed">
                      {item.content.impairment || 'O transtorno deve causar sofrimento clinicamente significativo ou prejuízo no funcionamento.'}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700">Exclusão / Diferencial</h4>
                    <p className="mt-1 text-sm text-gray-600 italic">
                      {item.content.exclusion || 'Não atribuível a efeitos de substâncias ou condições médicas.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {!loading && results.length === 0 && query && (
            <div className="text-center py-12">
              <p className="text-gray-500">Nenhum critério específico encontrado para "{query}".</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
