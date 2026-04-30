import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, ExternalLink, Plus, Search, ShieldCheck } from "lucide-react";
import {
  fetchAdlerMedicationSearch,
  type AdlerMedicationSearchResponse,
  type MedicationSearchResult
} from "../api/client";
import type { PatientRecord } from "../data/patientData";

type MedicationSearchWorkspaceProps = {
  accent: string;
  accentBorder: string;
  accentSurface: string;
  patient: PatientRecord;
};

export function MedicationSearchWorkspace({
  accent,
  accentBorder,
  accentSurface,
  patient
}: MedicationSearchWorkspaceProps) {
  const [query, setQuery] = useState(patient.medications.primary.title.toLowerCase());
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState("");
  const [result, setResult] = useState<AdlerMedicationSearchResponse | null>(null);
  const [inserted, setInserted] = useState<string[]>([
    patient.medications.primary.title,
    patient.medications.secondary.title
  ]);

  async function runSearch() {
    const term = query.trim();
    if (term.length < 2) {
      setError("Digite pelo menos 2 caracteres.");
      setStatus("error");
      return;
    }

    setStatus("loading");
    setError("");
    try {
      const response = await fetchAdlerMedicationSearch(term);
      setResult(response);
      setStatus("idle");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Falha na busca medicamentosa.");
      setStatus("error");
    }
  }

  function insertMedication(medication: MedicationSearchResult | string) {
    const name = typeof medication === "string" ? medication : medication.name;
    if (!name) return;
    setInserted((current) => (current.includes(name) ? current : [...current, name]));
  }

  const interactions = result?.curated_insights.interactions ?? [];
  const labs = result?.curated_insights.laboratory_monitoring ?? [];
  const concepts = result?.curated_insights.clinical_concepts ?? [];

  return (
    <section
      className="rounded-[24px] border bg-[#101318]/92 p-5 shadow-panel"
      style={{ borderColor: accentBorder, boxShadow: `0 0 22px ${accentSurface}` }}
    >
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_320px]">
        <div>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="font-mono text-[0.68rem] uppercase tracking-[0.32em] text-adler-subtle">
                Inserir intervencao farmacologica
              </p>
              <h3 className="mt-2 text-lg font-semibold tracking-[-0.03em] text-white">
                Busca validada por RxNorm/openFDA + base Adler
              </h3>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-adler-muted">
                Normaliza o medicamento, consulta rotulagem quando disponivel e
                cruza interacoes, exames e conceitos clinicos curados.
              </p>
            </div>
            <ShieldCheck className="h-5 w-5" style={{ color: accent }} />
          </div>

          <form
            className="mt-5 flex flex-col gap-3 md:flex-row"
            onSubmit={(event) => {
              event.preventDefault();
              void runSearch();
            }}
          >
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="sertralina, litio, quetiapina, naltrexona..."
                className="w-full rounded-full border border-white/8 bg-[#090a0c] py-3 pl-11 pr-4 text-sm text-white outline-none placeholder:text-white/30 focus:border-white/18"
              />
            </div>
            <button
              type="submit"
              className="rounded-full border px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/8"
              style={{ borderColor: accentBorder, backgroundColor: accentSurface }}
            >
              {status === "loading" ? "Buscando..." : "Buscar"}
            </button>
          </form>

          {status === "error" ? (
            <p className="mt-3 text-sm text-red-200">{error}</p>
          ) : null}

          <div className="mt-5 space-y-3">
            {result?.results.slice(0, 4).map((medication, index) => (
              <motion.article
                key={`${medication.rxcui}-${medication.name}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03, duration: 0.18 }}
                className="flex flex-wrap items-center justify-between gap-3 rounded-[18px] border border-white/8 bg-[#151923]/86 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-semibold text-white">{medication.name}</p>
                  <p className="mt-1 font-mono text-[0.68rem] uppercase tracking-[0.2em] text-adler-subtle">
                    RXCUI {medication.rxcui} · {medication.term_type || "conceito"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => insertMedication(medication)}
                  className="inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-white/86 transition hover:bg-white/8"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Inserir
                </button>
              </motion.article>
            ))}

            {result && !result.results.length ? (
              <div className="rounded-[18px] border border-white/8 bg-[#151923]/86 px-4 py-4">
                <p className="text-sm leading-6 text-adler-muted">
                  Nenhum conceito RxNorm encontrado. Voce ainda pode inserir o termo
                  normalizado e revisar a base local.
                </p>
                <button
                  type="button"
                  onClick={() => insertMedication(result.normalized_query)}
                  className="mt-3 inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold text-white"
                  style={{ borderColor: accentBorder, backgroundColor: accentSurface }}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Inserir {result.normalized_query}
                </button>
              </div>
            ) : null}
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-[20px] border border-white/8 bg-black/12 p-4">
            <p className="text-[0.66rem] uppercase tracking-[0.24em] text-adler-subtle">
              Prontuario medicamentoso
            </p>
            <div className="mt-3 space-y-2">
              {inserted.map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-2 rounded-[14px] border border-white/8 bg-white/[0.03] px-3 py-2 text-sm text-white/82"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" style={{ color: accent }} />
                  {item}
                </div>
              ))}
            </div>
          </div>

          {result?.label ? (
            <InfoBlock
              title="Rotulagem encontrada"
              values={[
                result.label.generic_name || result.label.brand_name,
                result.label.indications,
                result.label.warnings || result.label.drug_interactions
              ]}
            />
          ) : null}

          <InfoBlock
            title="Insights padrao ouro"
            values={result?.treatment_notes ?? ["Busque um medicamento para ver insights."]}
          />

          <InfoBlock
            title="Interacoes e exames"
            values={[
              ...interactions.map(
                (item) =>
                  `${item.substancia_principal} + ${item.agente_secundario}: ${item.conduta}`
              ),
              ...labs.map((item) => `${item.exame}: ${item.frequencia}`)
            ].slice(0, 5)}
          />

          <InfoBlock
            title="Conceitos conectados"
            values={concepts.map((item) => item.aplicacao_pratica || item.chave_clinica).slice(0, 4)}
          />

          {result?.sources?.length ? (
            <div className="rounded-[20px] border border-white/8 bg-black/12 p-4">
              <p className="text-[0.66rem] uppercase tracking-[0.24em] text-adler-subtle">
                Fontes
              </p>
              <div className="mt-3 space-y-2">
                {result.sources.map((source) => (
                  <a
                    key={source.name}
                    href={source.url.startsWith("http") ? source.url : undefined}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between gap-3 rounded-[14px] border border-white/8 bg-white/[0.03] px-3 py-2 text-sm text-white/78"
                  >
                    {source.name}
                    {source.url.startsWith("http") ? (
                      <ExternalLink className="h-3.5 w-3.5 text-white/38" />
                    ) : null}
                  </a>
                ))}
              </div>
            </div>
          ) : null}
        </aside>
      </div>
    </section>
  );
}

function InfoBlock({ title, values }: { title: string; values: string[] }) {
  const visibleValues = values.filter(Boolean);

  return (
    <div className="rounded-[20px] border border-white/8 bg-black/12 p-4">
      <p className="text-[0.66rem] uppercase tracking-[0.24em] text-adler-subtle">
        {title}
      </p>
      <div className="mt-3 space-y-2">
        {visibleValues.length ? (
          visibleValues.map((value) => (
            <p
              key={value}
              className="rounded-[14px] border border-white/8 bg-white/[0.03] px-3 py-2 text-sm leading-6 text-white/78"
            >
              {value}
            </p>
          ))
        ) : (
          <p className="text-sm leading-6 text-adler-muted">Sem achados para exibir.</p>
        )}
      </div>
    </div>
  );
}
