import { useEffect, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { Download, FileText, Scale, Send, ShieldCheck } from "lucide-react";
import {
  fetchAdlerDocumentModels,
  getAdlerDocumentModelDownloadUrl,
  type AdlerDocumentModel
} from "../api/client";
import type { PatientRecord } from "../data/patientData";
import {
  exportJudicialReportPdf,
  exportReferralReportPdf,
  PSYCHOLOGICAL_DOCUMENT_OPTIONS,
  REFERRAL_SPECIALTY_OPTIONS,
  type JudicialIssuerType,
  type PsychologicalDocumentType,
  type ReferralSourceDiscipline,
  type ReferralSpecialty
} from "../lib/reportPdf";

type DocumentsPanelProps = {
  accent: string;
  accentBorder: string;
  accentSurface: string;
  approachLabel: string;
  clinicalFrame: string;
  patient: PatientRecord;
  riskLabel: string;
  riskScore: number;
  selectedSession: number;
};

const DOCUMENT_TYPE_FILTERS = [
  { label: "Todos", value: "all" },
  { label: "Judicial", value: "relatorio_judicial" },
  { label: "Encaminhamento", value: "encaminhamento" },
  { label: "Laudo/Parecer", value: "laudo_psicologico" }
];

export function DocumentsPanel({
  accent,
  accentBorder,
  accentSurface,
  approachLabel,
  clinicalFrame,
  patient,
  riskLabel,
  riskScore,
  selectedSession
}: DocumentsPanelProps) {
  const [issuerType, setIssuerType] = useState<JudicialIssuerType>("psiquiatra");
  const [psychologicalDocumentType, setPsychologicalDocumentType] =
    useState<PsychologicalDocumentType>("laudo_pericial");
  const [referralSource, setReferralSource] =
    useState<ReferralSourceDiscipline>("psicologo");
  const [referralTarget, setReferralTarget] = useState<ReferralSpecialty>("psiquiatra");
  const [professionalFilter, setProfessionalFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [models, setModels] = useState<AdlerDocumentModel[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("loading");

  useEffect(() => {
    let isMounted = true;
    setStatus("loading");

    fetchAdlerDocumentModels({
      profissional: professionalFilter === "all" ? undefined : professionalFilter,
      tipoDocumento: typeFilter === "all" ? undefined : typeFilter
    })
      .then((response) => {
        if (!isMounted) return;
        setModels(response.models);
        setStatus("idle");
      })
      .catch(() => {
        if (!isMounted) return;
        setModels([]);
        setStatus("error");
      });

    return () => {
      isMounted = false;
    };
  }, [professionalFilter, typeFilter]);

  const transcriptExcerpt = patient.recorder.transcriptSegments
    .map((segment) => `${segment.speaker}: ${segment.text}`)
    .join(" ");

  return (
    <div className="mx-auto grid max-w-6xl gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
      <section className="space-y-5">
        <div
          className="rounded-[28px] border bg-[#101318]/92 p-5 shadow-panel md:p-6"
          style={{ borderColor: accentBorder, boxShadow: `0 0 24px ${accentSurface}` }}
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="font-mono text-[0.68rem] uppercase tracking-[0.32em] text-adler-subtle">
                Documentos clinicos
              </p>
              <h2 className="mt-2 text-[1.55rem] font-semibold tracking-[-0.04em] text-white">
                Laudos, relatorios e encaminhamentos
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-adler-muted">
                A geracao fica separada da linha do tempo para reduzir ruido. Os
                modelos oficiais continuam vinculados a PDFs de referencia.
              </p>
            </div>
            <div
              className="rounded-full border px-3 py-1.5 font-mono text-[0.68rem] uppercase tracking-[0.22em]"
              style={{ color: accent, borderColor: accentBorder, backgroundColor: accentSurface }}
            >
              {patient.name} · sessao {selectedSession}
            </div>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <ActionBlock
              accent={accent}
              accentBorder={accentBorder}
              accentSurface={accentSurface}
              icon={Scale}
              title="Laudo judicial"
              description="Documento para justificar necessidade clinica, risco de nao uso e indisponibilidade/ineficacia do SUS quando aplicavel."
            >
              <div className="grid gap-3 md:grid-cols-2">
                <SelectField
                  label="Emissor"
                  value={issuerType}
                  onChange={(value) => setIssuerType(value as JudicialIssuerType)}
                  options={[
                    { label: "Psiquiatra", value: "psiquiatra" },
                    { label: "Psicologo", value: "psicologo" }
                  ]}
                />
                <SelectField
                  label="Tipo psicologico"
                  value={psychologicalDocumentType}
                  onChange={(value) =>
                    setPsychologicalDocumentType(value as PsychologicalDocumentType)
                  }
                  options={PSYCHOLOGICAL_DOCUMENT_OPTIONS}
                  disabled={issuerType !== "psicologo"}
                />
              </div>
              <button
                type="button"
                onClick={() =>
                  exportJudicialReportPdf({
                    approachLabel,
                    clinicalFrame,
                    includeAnalysis: true,
                    includeDemand: true,
                    includeGenetics: true,
                    includeInteractions: true,
                    includeLabs: true,
                    includePharmacology: true,
                    includeProcedures: true,
                    includeRisks: true,
                    includeSusContext: true,
                    includeTranscript: true,
                    issuerType,
                    patient,
                    psychologicalDocumentType,
                    riskLabel,
                    riskScore,
                    session: selectedSession,
                    transcriptExcerpt
                  })
                }
                className="mt-4 inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/8"
                style={{ borderColor: accentBorder, backgroundColor: accentSurface }}
              >
                <FileText className="h-4 w-4" />
                Gerar PDF judicial
              </button>
            </ActionBlock>

            <ActionBlock
              accent={accent}
              accentBorder={accentBorder}
              accentSurface={accentSurface}
              icon={Send}
              title="Encaminhamento"
              description="Relatorio de comunicacao tecnica entre profissionais, com filtros sobre sintomas, dose, genetica, exames e interacoes."
            >
              <div className="grid gap-3 md:grid-cols-2">
                <SelectField
                  label="Origem"
                  value={referralSource}
                  onChange={(value) => setReferralSource(value as ReferralSourceDiscipline)}
                  options={[
                    { label: "Psicologo", value: "psicologo" },
                    { label: "Psiquiatra", value: "psiquiatra" }
                  ]}
                />
                <SelectField
                  label="Destino"
                  value={referralTarget}
                  onChange={(value) => setReferralTarget(value as ReferralSpecialty)}
                  options={REFERRAL_SPECIALTY_OPTIONS}
                />
              </div>
              <button
                type="button"
                onClick={() =>
                  exportReferralReportPdf({
                    approachLabel,
                    clinicalFrame,
                    includeDose: true,
                    includeGenetics: true,
                    includeInteractions: true,
                    includeLabs: true,
                    includeSymptoms: true,
                    includeTranscript: true,
                    patient,
                    riskLabel,
                    riskScore,
                    session: selectedSession,
                    sourceDiscipline: referralSource,
                    targetSpecialty: referralTarget,
                    transcriptExcerpt
                  })
                }
                className="mt-4 inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/8"
                style={{ borderColor: accentBorder, backgroundColor: accentSurface }}
              >
                <Send className="h-4 w-4" />
                Gerar encaminhamento
              </button>
            </ActionBlock>
          </div>
        </div>

        <section className="rounded-[26px] border border-adler-border bg-[#101318]/88 p-5 shadow-panel">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="font-mono text-[0.68rem] uppercase tracking-[0.3em] text-adler-subtle">
                Biblioteca de modelos
              </p>
              <h3 className="mt-2 text-lg font-semibold text-white">
                PDFs oficiais vinculados
              </h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {["all", "psicologo", "psiquiatra"].map((item) => (
                <FilterButton
                  key={item}
                  active={professionalFilter === item}
                  accent={accent}
                  accentBorder={accentBorder}
                  accentSurface={accentSurface}
                  label={item === "all" ? "Todos" : item}
                  onClick={() => setProfessionalFilter(item)}
                />
              ))}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {DOCUMENT_TYPE_FILTERS.map((item) => (
              <FilterButton
                key={item.value}
                active={typeFilter === item.value}
                accent={accent}
                accentBorder={accentBorder}
                accentSurface={accentSurface}
                label={item.label}
                onClick={() => setTypeFilter(item.value)}
              />
            ))}
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {models.map((model, index) => (
              <motion.a
                key={model.id}
                href={getAdlerDocumentModelDownloadUrl(model.id)}
                target="_blank"
                rel="noreferrer"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03, duration: 0.18 }}
                className="group rounded-[20px] border border-white/8 bg-[#151923]/90 p-4 transition hover:border-white/16"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[0.64rem] uppercase tracking-[0.24em] text-adler-subtle">
                      {model.profissional} · {model.tipo_documento}
                    </p>
                    <h4 className="mt-2 text-sm font-semibold leading-6 text-white">
                      {model.titulo}
                    </h4>
                  </div>
                  <Download className="h-4 w-4 text-white/42 transition group-hover:text-white" />
                </div>
                <p className="mt-3 text-sm leading-6 text-adler-muted">
                  {model.uso_clinico}
                </p>
              </motion.a>
            ))}
          </div>

          {status === "loading" ? (
            <p className="mt-4 text-sm text-adler-muted">Carregando modelos...</p>
          ) : null}
          {status === "error" ? (
            <p className="mt-4 text-sm text-red-200">
              Nao foi possivel carregar os modelos oficiais.
            </p>
          ) : null}
          {!models.length && status === "idle" ? (
            <p className="mt-4 text-sm text-adler-muted">
              Nenhum modelo encontrado para estes filtros.
            </p>
          ) : null}
        </section>
      </section>

      <aside className="space-y-4">
        <section
          className="rounded-[26px] border bg-[#101318]/92 p-5 shadow-panel"
          style={{ borderColor: accentBorder, boxShadow: `0 0 20px ${accentSurface}` }}
        >
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-4 w-4" style={{ color: accent }} />
            <h3 className="text-base font-semibold text-white">Trilha de seguranca</h3>
          </div>
          <div className="mt-4 space-y-3 text-sm leading-6 text-adler-muted">
            <p>Laudo medico judicial prioriza prescricao, risco e falha/ausencia no SUS.</p>
            <p>Documento psicologico prioriza demanda, procedimentos, analise e conclusao.</p>
            <p>Encaminhamento evita excesso de dados e compartilha apenas o necessario.</p>
          </div>
        </section>
      </aside>
    </div>
  );
}

function ActionBlock({
  accent,
  accentBorder,
  accentSurface,
  children,
  description,
  icon: Icon,
  title
}: {
  accent: string;
  accentBorder: string;
  accentSurface: string;
  children: ReactNode;
  description: string;
  icon: LucideIcon;
  title: string;
}) {
  return (
    <article className="rounded-[22px] border border-white/8 bg-[#151923]/86 p-4">
      <div className="flex items-start gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] border"
          style={{ borderColor: accentBorder, backgroundColor: accentSurface, color: accent }}
        >
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-white">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-adler-muted">{description}</p>
        </div>
      </div>
      <div className="mt-4">{children}</div>
    </article>
  );
}

function SelectField({
  disabled,
  label,
  onChange,
  options,
  value
}: {
  disabled?: boolean;
  label: string;
  onChange: (value: string) => void;
  options: Array<{ label: string; value: string }>;
  value: string;
}) {
  return (
    <label className={disabled ? "opacity-45" : ""}>
      <span className="text-[0.64rem] uppercase tracking-[0.22em] text-adler-subtle">
        {label}
      </span>
      <select
        disabled={disabled}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-[16px] border border-white/8 bg-[#090a0c] px-3 py-3 text-sm text-white outline-none transition focus:border-white/18"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function FilterButton({
  accent,
  accentBorder,
  accentSurface,
  active,
  label,
  onClick
}: {
  accent: string;
  accentBorder: string;
  accentSurface: string;
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full border px-3 py-2 text-xs font-medium uppercase tracking-[0.18em] transition"
      style={{
        color: active ? accent : "#c7cedb",
        borderColor: active ? accentBorder : "rgba(255,255,255,0.08)",
        backgroundColor: active ? accentSurface : "rgba(255,255,255,0.03)"
      }}
    >
      {label}
    </button>
  );
}
