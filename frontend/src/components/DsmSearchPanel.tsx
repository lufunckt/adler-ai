import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { BookOpenText, BrainCircuit, Search, ShieldCheck } from "lucide-react";
import {
  fetchAdlerScienceBase,
  type AdlerScientificBaseResponse
} from "../api/client";

type DsmSearchPanelProps = {
  accent: string;
  accentBorder: string;
  accentSurface: string;
};

export function DsmSearchPanel({
  accent,
  accentBorder,
  accentSurface
}: DsmSearchPanelProps) {
  const [query, setQuery] = useState("toc");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [payload, setPayload] = useState<AdlerScientificBaseResponse | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    void runSearch("toc");
  }, []);

  async function runSearch(nextQuery = query) {
    const term = nextQuery.trim();
    if (term.length < 2) {
      setError("Digite pelo menos 2 caracteres.");
      setStatus("error");
      return;
    }

    setStatus("loading");
    setError("");
    try {
      const result = await fetchAdlerScienceBase({ q: term });
      setPayload(result);
      setStatus("idle");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Nao foi possivel consultar a base.");
      setStatus("error");
    }
  }

  const psychopathology = payload?.psychopathology ?? [];
  const scales = payload?.psychological_scales ?? [];
  const concepts = payload?.clinical_concepts ?? [];

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-5">
      <section
        className="rounded-[28px] border bg-[#101318]/92 p-5 shadow-panel md:p-6"
        style={{ borderColor: accentBorder, boxShadow: `0 0 24px ${accentSurface}` }}
      >
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div>
            <p className="font-mono text-[0.68rem] uppercase tracking-[0.32em] text-adler-subtle">
              Consulta DSM-5 / matriz clinica
            </p>
            <h2 className="mt-2 text-[1.55rem] font-semibold tracking-[-0.04em] text-white">
              Busca psicopatologica orientativa
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-adler-muted">
              A tela resume psicopatologias, diferenciais, escalas e abordagens a
              partir da base cientifica do Adler. Ela nao reproduz criterios
              completos do DSM e nao substitui avaliacao clinica.
            </p>
          </div>

          <div className="rounded-[22px] border border-white/8 bg-black/10 p-4">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-4 w-4" style={{ color: accent }} />
              <p className="text-sm font-medium text-white">Base curada</p>
            </div>
            <p className="mt-3 text-sm leading-6 text-adler-muted">
              Psicopatologia, escalas e condutas ficam rastreaveis por documento,
              sem gerar diagnostico automatico.
            </p>
          </div>
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
              placeholder="Buscar por TOC, ansiedade, borderline, TDAH..."
              className="w-full rounded-full border border-white/8 bg-[#090a0c] py-3 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-white/18"
            />
          </div>
          <button
            type="submit"
            className="rounded-full border px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/8"
            style={{ borderColor: accentBorder, backgroundColor: accentSurface }}
          >
            {status === "loading" ? "Consultando..." : "Buscar"}
          </button>
        </form>

        {status === "error" ? (
          <p className="mt-3 text-sm text-red-200">{error}</p>
        ) : null}
      </section>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <section className="rounded-[26px] border border-adler-border bg-[#101318]/88 p-5 shadow-panel">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-mono text-[0.68rem] uppercase tracking-[0.3em] text-adler-subtle">
                Achados principais
              </p>
              <h3 className="mt-2 text-lg font-semibold text-white">
                Psicopatologias relacionadas
              </h3>
            </div>
            <span className="font-mono text-xs text-adler-muted">
              {psychopathology.length} resultado(s)
            </span>
          </div>

          <div className="mt-5 space-y-3">
            {psychopathology.slice(0, 8).map((row, index) => (
              <motion.article
                key={`${row.psicopatologia}-${index}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03, duration: 0.2 }}
                className="rounded-[20px] border border-white/8 bg-[#151923]/88 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-[0.66rem] uppercase tracking-[0.24em] text-adler-subtle">
                      {row.categoria}
                    </p>
                    <h4 className="mt-2 text-base font-semibold tracking-[-0.02em] text-white">
                      {formatClinicalName(row.psicopatologia)}
                    </h4>
                  </div>
                  <BookOpenText className="h-4 w-4" style={{ color: accent }} />
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <ClinicalText label="Sintomas centrais" value={row.sintomas_centrais} />
                  <ClinicalText label="Diferenciais" value={row.diagnosticos_diferenciais} />
                  <ClinicalText label="Abordagens" value={row.abordagens_terapeuticas_indicadas} />
                  <ClinicalText label="Escalas uteis" value={row.escalas_uteis} />
                </div>

                {row.observacoes_clinicas ? (
                  <p className="mt-4 rounded-[16px] border border-white/8 bg-black/12 px-3 py-3 text-sm leading-6 text-white/80">
                    {row.observacoes_clinicas}
                  </p>
                ) : null}
              </motion.article>
            ))}

            {!psychopathology.length && status !== "loading" ? (
              <EmptyState text="Nenhuma psicopatologia encontrada para este termo." />
            ) : null}
          </div>
        </section>

        <aside className="space-y-4">
          <SideList
            accent={accent}
            accentBorder={accentBorder}
            accentSurface={accentSurface}
            icon={BrainCircuit}
            title="Conceitos conectados"
            values={concepts.map((item) => item.conceito).slice(0, 5)}
          />
          <SideList
            accent={accent}
            accentBorder={accentBorder}
            accentSurface={accentSurface}
            icon={BookOpenText}
            title="Escalas sugeridas"
            values={scales.map((item) => `${item.nome_sigla} - ${item.indicacao}`).slice(0, 5)}
          />
        </aside>
      </div>
    </div>
  );
}

function ClinicalText({ label, value }: { label: string; value?: string }) {
  return (
    <div className="rounded-[16px] border border-white/8 bg-black/10 px-3 py-3">
      <p className="text-[0.64rem] uppercase tracking-[0.22em] text-adler-subtle">
        {label}
      </p>
      <p className="mt-2 text-sm leading-6 text-white/80">{value || "Nao informado"}</p>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-[20px] border border-dashed border-white/12 bg-black/10 px-4 py-8 text-center text-sm text-adler-muted">
      {text}
    </div>
  );
}

function SideList({
  accent,
  accentBorder,
  accentSurface,
  icon: Icon,
  title,
  values
}: {
  accent: string;
  accentBorder: string;
  accentSurface: string;
  icon: LucideIcon;
  title: string;
  values: string[];
}) {
  return (
    <section
      className="rounded-[24px] border bg-[#101318]/88 p-4 shadow-panel"
      style={{ borderColor: accentBorder, boxShadow: `0 0 18px ${accentSurface}` }}
    >
      <div className="flex items-center gap-3">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-[14px] border"
          style={{ borderColor: accentBorder, backgroundColor: accentSurface, color: accent }}
        >
          <Icon className="h-4 w-4" />
        </div>
        <h3 className="text-sm font-semibold text-white">{title}</h3>
      </div>
      <div className="mt-4 space-y-2">
        {values.length ? (
          values.map((value) => (
            <p
              key={value}
              className="rounded-[14px] border border-white/8 bg-white/[0.03] px-3 py-2.5 text-sm leading-6 text-white/78"
            >
              {value}
            </p>
          ))
        ) : (
          <p className="text-sm leading-6 text-adler-muted">Sem itens conectados.</p>
        )}
      </div>
    </section>
  );
}

function formatClinicalName(value?: string) {
  if (!value) return "Registro clinico";
  return value
    .split("_")
    .map((item) => item.charAt(0).toUpperCase() + item.slice(1))
    .join(" ");
}
