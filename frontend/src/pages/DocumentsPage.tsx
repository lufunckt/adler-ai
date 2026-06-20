import React, { useState, useEffect } from 'react';
import { FileText, Plus, Search, Brain, PenTool, Download, ShieldCheck, ChevronRight } from 'lucide-react';
import { api } from '../api/client';

interface OfficialTemplate {
  id: string;
  title: string;
  type: string;
  source: string;
  structure: any;
}

export function DocumentsPage() {
  const [templates, setTemplates] = useState<OfficialTemplate[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<OfficialTemplate | null>(null);
  const [patientId, setPatientId] = useState('');
  const [fillingMode, setFillingMode] = useState<'ai' | 'manual'>('ai');
  const [filledContent, setFilledContent] = useState('');
  const [isFilling, setIsFilling] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const data = await api.get('/api/adler/science/templates');
      setTemplates(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFill = async () => {
    if (!selectedTemplate || !patientId) return;
    setIsFilling(true);
    try {
      const result = await api.post('/api/adler/intelligence/documents/fill', {
        template_id: selectedTemplate.id,
        patient_id: patientId,
        mode: fillingMode
      });
      setFilledContent(result.content);
    } catch (err) {
      console.error(err);
    } finally {
      setIsFilling(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Documentos Oficiais</h1>
          <p className="text-gray-500">Geração de atestados, laudos e relatórios seguindo normas do CFP.</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: Template Selection */}
        <div className="lg:col-span-1 space-y-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar modelo..."
                className="w-full rounded-xl border border-gray-100 py-2 pl-10 pr-4 text-sm focus:border-indigo-500 outline-none"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
              {templates.filter(t => t.title.toLowerCase().includes(search.toLowerCase())).map(t => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTemplate(t)}
                  className={`w-full text-left p-3 rounded-xl border transition-all ${selectedTemplate?.id === t.id ? 'border-indigo-500 bg-indigo-50' : 'border-gray-50 hover:border-indigo-200 bg-gray-50/50'}`}
                >
                  <div className="flex items-center gap-3">
                    <FileText className={`h-5 w-5 ${selectedTemplate?.id === t.id ? 'text-indigo-600' : 'text-gray-400'}`} />
                    <div>
                      <p className="text-sm font-bold text-gray-900 leading-tight">{t.title}</p>
                      <p className="text-[10px] text-gray-500 uppercase font-medium mt-1">{t.source}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Center/Right: Editor/Config */}
        <div className="lg:col-span-2 space-y-6">
          {selectedTemplate ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
              <div className="flex items-center justify-between mb-8 border-b border-gray-100 pb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{selectedTemplate.title}</h2>
                  <p className="text-sm text-gray-500 mt-1">Configuração de preenchimento assistido</p>
                </div>
                <div className="flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
                  <ShieldCheck className="h-4 w-4" />
                  Conforme CFP
                </div>
              </div>

              <div className="grid gap-8 md:grid-cols-2">
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase">Paciente (ID)</label>
                    <input
                      type="text"
                      className="mt-2 w-full rounded-xl border border-gray-200 p-3 text-sm focus:border-indigo-500 outline-none"
                      placeholder="Ex: p-001"
                      value={patientId}
                      onChange={(e) => setPatientId(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase">Modo de Preenchimento</label>
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setFillingMode('ai')}
                        className={`flex items-center justify-center gap-2 rounded-xl border py-4 text-sm font-bold transition-all ${fillingMode === 'ai' ? 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-sm' : 'border-gray-100 text-gray-500 hover:bg-gray-50'}`}
                      >
                        <Brain className="h-4 w-4" />
                        IA Assistida
                      </button>
                      <button
                        onClick={() => setFillingMode('manual')}
                        className={`flex items-center justify-center gap-2 rounded-xl border py-4 text-sm font-bold transition-all ${fillingMode === 'manual' ? 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-sm' : 'border-gray-100 text-gray-500 hover:bg-gray-50'}`}
                      >
                        <PenTool className="h-4 w-4" />
                        Manual
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={handleFill}
                    disabled={!patientId || isFilling}
                    className="w-full mt-4 flex items-center justify-center gap-2 rounded-xl bg-gray-900 py-4 text-sm font-bold text-white hover:bg-gray-800 disabled:opacity-50 transition-all"
                  >
                    {isFilling ? 'Processando...' : 'Gerar Rascunho'}
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>

                <div className="rounded-xl bg-gray-50 p-6 border border-gray-100">
                  <h4 className="text-xs font-bold text-gray-400 uppercase mb-4">Estrutura Normativa</h4>
                  <div className="space-y-4">
                    {Object.entries(selectedTemplate.structure).map(([key, val]: [string, any]) => (
                      <div key={key}>
                        <p className="text-xs font-bold text-gray-700 capitalize">{key.replace('_', ' ')}</p>
                        <p className="text-[11px] text-gray-500 mt-1">{typeof val === 'string' ? val : 'Campo estruturado'}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {filledContent && (
                <div className="mt-12 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-gray-900">Rascunho Gerado</h3>
                    <button className="flex items-center gap-2 text-xs font-bold text-indigo-600 hover:text-indigo-700">
                      <Download className="h-4 w-4" />
                      Exportar PDF
                    </button>
                  </div>
                  <textarea
                    className="w-full min-h-[400px] rounded-2xl border border-gray-200 p-6 text-sm leading-relaxed text-gray-700 font-serif focus:border-indigo-300 outline-none shadow-inner"
                    value={filledContent}
                    onChange={(e) => setFilledContent(e.target.value)}
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[500px] rounded-2xl border border-dashed border-gray-200 bg-gray-50 text-center p-12">
              <FileText className="h-12 w-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-bold text-gray-400">Selecione um Modelo Oficial</h3>
              <p className="text-sm text-gray-400 mt-2 max-w-xs">
                Escolha um modelo à esquerda para iniciar o preenchimento assistido por IA ou manual.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
