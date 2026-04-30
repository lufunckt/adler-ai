import {
  Activity,
  BrainCircuit,
  ChevronRight,
  FileText,
  ShieldCheck,
  Sparkles
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { startTransition, useEffect, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import {
  fetchAdlerDocumentModels,
  getAdlerDocumentModelDownloadUrl,
  type AdlerDocumentModel
} from "../api/client";
import type { ClinicalApproach } from "../context/AdlerShellContext";
import type { PatientRecord } from "../data/patientData";
import {
  EVOLUTION_DATA,
  getExpectedPathDelta,
  getEvolutionPoint,
  getRecoveryIndex
} from "../data/evolutionData";
import {
  PSYCHOLOGICAL_DOCUMENT_OPTIONS,
  REFERRAL_SOURCE_OPTIONS,
  REFERRAL_SPECIALTY_OPTIONS,
  exportJudicialReportPdf,
  exportReferralReportPdf,
  type PsychologicalDocumentType,
  type ReferralSourceDiscipline,
  type ReferralSpecialty
} from "../lib/reportPdf";

type EvolutionPanelProps = {
  accent: string;
  accentBorder: string;
  accentSurface: string;
  approach: ClinicalApproach;
  approachLabel: string;
  clinicalFrame: string;
  hasContractedGeneticTest: boolean;
  patient: PatientRecord;
  riskLabel: string;
  riskScore: number;
  selectedSession: number;
  setSelectedSession: (value: number) => void;
};

type SeriesKey = "anxiety" | "mood" | "adherence";

const EXPECTED_PATH_COLOR = "rgba(214, 219, 232, 0.62)";

const SERIES_META: Record<SeriesKey, { label: string }> = {
  anxiety: { label: "Ansiedade (GAD-7)" },
  mood: { label: "Humor (PHQ-9)" },
  adherence: { label: "Adesao Medicamentosa" }
};

const LINE_PALETTES: Record<ClinicalApproach, Record<SeriesKey, string>> = {
  cbt: {
    anxiety: "#ff8a3d",
    mood: "#ffbe82",
    adherence: "#ffe08a"
  },
  psychoanalysis: {
    anxiety: "#9a7cff",
    mood: "#c7b4ff",
    adherence: "#f0b2ff"
  },
  psychiatry: {
    anxiety: "#4fdfff",
    mood: "#8df0ff",
    adherence: "#8af5d0"
  },
  schema: {
    anxiety: "#f472b6",
    mood: "#f9a8d4",
    adherence: "#fdba74"
  },
  couples: {
    anxiety: "#14b8a6",
    mood: "#5eead4",
    adherence: "#99f6e4"
  },
  generalist: {
    anxiety: "#34d399",
    mood: "#7ee7c2",
    adherence: "#bef264"
  },
  systemic: {
    anxiety: "#60a5fa",
    mood: "#93c5fd",
    adherence: "#bfdbfe"
  }
};

export function EvolutionPanel({
  accent,
  accentBorder,
  accentSurface,
  approach,
  approachLabel,
  clinicalFrame,
  hasContractedGeneticTest,
  patient,
  riskLabel,
  riskScore,
  selectedSession,
  setSelectedSession
}: EvolutionPanelProps) {
  const [judicialIssuer, setJudicialIssuer] = useState<"psicologo" | "psiquiatra">(
    approach === "psychiatry" ? "psiquiatra" : "psicologo"
  );
  const [judicialDocumentType, setJudicialDocumentType] =
    useState<PsychologicalDocumentType>("laudo_pericial");
  const [referralSource, setReferralSource] =
    useState<ReferralSourceDiscipline>(
      approach === "psychiatry" ? "psiquiatra" : "psicologo"
    );
  const [referralTarget, setReferralTarget] = useState<ReferralSpecialty>(
    approach === "psychiatry" ? "psicologo" : "psiquiatra"
  );
  const [referralFilters, setReferralFilters] = useState({
    sintomas: true,
    dose: true,
    genetica: hasContractedGeneticTest,
    interacoes: true,
    laboratorios: true,
    transcricao: true
  });
  const [judicialFilters, setJudicialFilters] = useState({
    analise: true,
    demanda: true,
    historicoSus: true,
    interacoes: true,
    laboratorios: true,
    procedimentos: true,
    riscos: true,
    pkpd: true,
    genetica: hasContractedGeneticTest,
    transcricao: true
  });
  const [reportMessage, setReportMessage] = useState(
    "Relatorios prontos para exportacao clinica e juridica com trilha de evidencia."
  );
  const [documentModels, setDocumentModels] = useState<AdlerDocumentModel[]>([]);
  const [documentModelsStatus, setDocumentModelsStatus] = useState<
    "idle" | "loading" | "ready" | "error"
  >("idle");

  const selectedPoint = getEvolutionPoint(selectedSession);
  const palette = LINE_PALETTES[approach];
  const recoveryIndex = getRecoveryIndex(selectedPoint);
  const expectedDelta = getExpectedPathDelta(selectedSession);
  const transcriptExcerpt =
    patient.recorder.transcriptSegments
      .map((segment) => `${segment.speaker} (${segment.timestamp}): ${segment.text}`)
      .join(" ")
      .slice(0, 560) || patient.recorder.summary;
  const benchmarkCopy =
    expectedDelta >= 0
      ? `${expectedDelta} pontos acima da trajetoria esperada pela evidencia.`
      : `${Math.abs(expectedDelta)} pontos abaixo da trajetoria esperada pela evidencia.`;

  useEffect(() => {
    let isMounted = true;
    setDocumentModelsStatus("loading");

    fetchAdlerDocumentModels({ profissional: judicialIssuer })
      .then((payload) => {
        if (!isMounted) return;
        setDocumentModels(payload.models);
        setDocumentModelsStatus("ready");
      })
      .catch(() => {
        if (!isMounted) return;
        setDocumentModels([]);
        setDocumentModelsStatus("error");
      });

    return () => {
      isMounted = false;
    };
  }, [judicialIssuer]);

  return (
    <div className="grid h-full min-h-[480px] gap-4">
      <section className="rounded-[24px] border border-adler-border bg-[#101318]/92 p-5 shadow-panel">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-mono text-[0.68rem] uppercase tracking-[0.32em] text-adler-subtle">
              Evolucao Longitudinal
            </p>
            <h3 className="mt-2 text-[1.4rem] font-semibold tracking-[-0.05em] text-white">
              {patient.name} // curva longitudinal de resposta
            </h3>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-adler-muted">
              Adler esta reproduzindo a Sessao {selectedSession} enquanto preserva
              a curva completa de 18 sessoes para ansiedade, humor e adesao
              medicamentosa no protocolo ativo.
            </p>
          </div>

          <div className="grid gap-2 text-right">
            <span
              className="rounded-full border px-3 py-1.5 font-mono text-[0.68rem] uppercase tracking-[0.24em]"
              style={{
                color: accent,
                borderColor: accentBorder,
                backgroundColor: accentSurface
              }}
            >
              Sessao {selectedSession}
            </span>
            <span className="font-mono text-xs text-adler-muted">
              Leitura historica ativa
            </span>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <MetricTile
            accent={palette.anxiety}
            description="eixo de reducao do GAD-7"
            label="Ansiedade"
            value={selectedPoint.anxiety}
          />
          <MetricTile
            accent={palette.mood}
            description="variacao do PHQ-9"
            label="Humor"
            value={selectedPoint.mood}
          />
          <MetricTile
            accent={palette.adherence}
            description="constancia farmacologica"
            label="Adesao"
            value={selectedPoint.adherence}
          />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <div className="rounded-full border border-white/8 bg-white/4 px-3 py-1.5">
            <div className="flex items-center gap-2">
              <span
                className="h-2.5 w-7 rounded-full"
                style={{ borderTop: `2px dashed ${EXPECTED_PATH_COLOR}` }}
              />
              <span className="text-xs text-white/84">
                Trajetoria Esperada por Evidencia
              </span>
            </div>
          </div>
          <div className="rounded-full border border-white/8 bg-white/4 px-3 py-1.5 font-mono text-xs text-white/74">
            Indice de recuperacao {recoveryIndex} | Benchmark {selectedPoint.expectedPath}
          </div>
        </div>

        <div className="mt-5 overflow-hidden rounded-[22px] bg-[#0d1015]/95 p-4">
          <div className="mb-4 flex flex-wrap gap-2">
            {(Object.keys(SERIES_META) as SeriesKey[]).map((seriesKey) => (
              <div
                key={seriesKey}
                className="rounded-full border border-white/8 bg-white/4 px-3 py-1.5"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{
                      backgroundColor: palette[seriesKey],
                      boxShadow: `0 0 10px ${palette[seriesKey]}`
                    }}
                  />
                  <span className="text-xs text-white/84">
                    {SERIES_META[seriesKey].label}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={EVOLUTION_DATA}
                margin={{ top: 16, right: 14, bottom: 8, left: -14 }}
              >
                <CartesianGrid
                  stroke="rgba(255,255,255,0.08)"
                  strokeDasharray="5 8"
                  vertical={false}
                />
                <XAxis
                  axisLine={false}
                  dataKey="session"
                  tick={{
                    fill: "rgba(255,255,255,0.45)",
                    fontFamily: "monospace",
                    fontSize: 10
                  }}
                  tickFormatter={(value) => `S${value}`}
                  tickLine={false}
                />
                <YAxis
                  axisLine={false}
                  domain={[20, 100]}
                  tick={{
                    fill: "rgba(255,255,255,0.4)",
                    fontFamily: "monospace",
                    fontSize: 10
                  }}
                  tickCount={5}
                  tickLine={false}
                />
                <Tooltip
                  content={
                    <EvolutionTooltip
                      adherenceColor={palette.adherence}
                      anxietyColor={palette.anxiety}
                      expectedColor={EXPECTED_PATH_COLOR}
                      moodColor={palette.mood}
                    />
                  }
                  cursor={{
                    stroke: accent,
                    strokeDasharray: "4 6",
                    strokeOpacity: 0.45
                  }}
                />

                <ReferenceLine
                  stroke={accent}
                  strokeDasharray="4 6"
                  strokeOpacity={0.6}
                  x={selectedSession}
                />

                <Line
                  dataKey="expectedPath"
                  dot={false}
                  isAnimationActive
                  name="Trajetoria Esperada por Evidencia"
                  stroke={EXPECTED_PATH_COLOR}
                  strokeDasharray="8 8"
                  strokeWidth={2}
                  type="monotone"
                />
                <Line
                  dataKey="anxiety"
                  dot={false}
                  isAnimationActive
                  name={SERIES_META.anxiety.label}
                  stroke={palette.anxiety}
                  strokeWidth={3}
                  type="monotone"
                />
                <Line
                  dataKey="mood"
                  dot={false}
                  isAnimationActive
                  name={SERIES_META.mood.label}
                  stroke={palette.mood}
                  strokeWidth={3}
                  type="monotone"
                />
                <Line
                  dataKey="adherence"
                  dot={false}
                  isAnimationActive
                  name={SERIES_META.adherence.label}
                  stroke={palette.adherence}
                  strokeWidth={3.2}
                  type="monotone"
                />

                <ReferenceDot
                  fill={palette.anxiety}
                  ifOverflow="visible"
                  isFront
                  r={5}
                  stroke="#0d1015"
                  strokeWidth={2}
                  x={selectedSession}
                  y={selectedPoint.anxiety}
                />
                <ReferenceDot
                  fill={palette.mood}
                  ifOverflow="visible"
                  isFront
                  r={5}
                  stroke="#0d1015"
                  strokeWidth={2}
                  x={selectedSession}
                  y={selectedPoint.mood}
                />
                <ReferenceDot
                  fill={palette.adherence}
                  ifOverflow="visible"
                  isFront
                  r={5}
                  stroke="#0d1015"
                  strokeWidth={2}
                  x={selectedSession}
                  y={selectedPoint.adherence}
                />
                <ReferenceDot
                  fill="#dbe2ef"
                  ifOverflow="visible"
                  isFront
                  r={4.5}
                  stroke="#0d1015"
                  strokeWidth={2}
                  x={selectedSession}
                  y={selectedPoint.expectedPath}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 rounded-[18px] border border-white/8 bg-white/[0.03] px-4 py-3">
            <p className="font-mono text-[0.65rem] uppercase tracking-[0.28em] text-adler-subtle">
              Benchmark cientifico
            </p>
            <p className="mt-2 text-sm leading-6 text-white/84">
              {benchmarkCopy} A linha pontilhada reproduz a trajetoria media
              esperada para TOC com perfil farmacogenetico compativel dentro da
              camada de evidencia Adler.
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-[24px] border border-adler-border bg-[#12151b]/92 p-5 shadow-panel">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-mono text-[0.68rem] uppercase tracking-[0.32em] text-adler-subtle">
              Maquina do Tempo
            </p>
            <h3 className="mt-2 text-lg font-semibold tracking-[-0.03em] text-white">
              Navegacao historica de sessoes
            </h3>
          </div>
          <div className="rounded-full border border-white/8 bg-white/4 px-3 py-1.5 font-mono text-xs text-white/78">
            Sessao {selectedSession} / 18
          </div>
        </div>

        <div className="mt-5 rounded-[20px] border border-white/8 bg-[#16181d] px-4 py-4">
          <input
            className="adler-range w-full"
            max={18}
            min={1}
            onChange={(event) =>
              startTransition(() => setSelectedSession(Number(event.target.value)))
            }
            style={{
              ["--range-accent" as string]: accent,
              ["--range-track" as string]: `linear-gradient(90deg, ${accent} 0%, ${accent} ${((selectedSession - 1) / 17) * 100}%, rgba(255,255,255,0.12) ${((selectedSession - 1) / 17) * 100}%, rgba(255,255,255,0.12) 100%)`
            }}
            type="range"
            value={selectedSession}
          />

          <div className="mt-3 flex items-center justify-between font-mono text-xs text-adler-muted">
            <span>Sessao 1</span>
            <span className="text-white/72">Foco atual: Sessao {selectedSession}</span>
            <span>Sessao 18</span>
          </div>
        </div>

        <div className="mt-5 flex items-start gap-3 rounded-[18px] border border-white/8 bg-black/10 px-4 py-3">
          <div
            className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] border"
            style={{
              color: accent,
              borderColor: accentBorder,
              backgroundColor: accentSurface
            }}
          >
            <Activity className="h-4 w-4" />
          </div>
          <p className="text-sm leading-6 text-adler-muted">
            Deslizar a linha do tempo atualiza os insights, rebobina o mapa
            cognitivo e recalcula o risco para o momento clinico selecionado.
          </p>
        </div>
      </section>

      <section className="rounded-[24px] border border-adler-border bg-[#12151b]/92 p-5 shadow-panel">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-mono text-[0.68rem] uppercase tracking-[0.32em] text-adler-subtle">
              Saida Clinica e Juridica
            </p>
            <h3 className="mt-2 text-lg font-semibold tracking-[-0.03em] text-white">
              Relatorios e laudos em PDF
            </h3>
          </div>
          <span
            className="rounded-full border px-3 py-1.5 font-mono text-[0.68rem] uppercase tracking-[0.24em]"
            style={{
              color: accent,
              borderColor: accentBorder,
              backgroundColor: accentSurface
            }}
          >
            exportacao validada
          </span>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <ActionButton
            accent={accent}
            icon={ShieldCheck}
            label="Gerar Documento Judicial"
            onClick={() => {
              const documentLabel =
                PSYCHOLOGICAL_DOCUMENT_OPTIONS.find(
                  (option) => option.value === judicialDocumentType
                )?.label ?? "Laudo Psicologico";
              const included = [
                judicialIssuer === "psiquiatra" && judicialFilters.historicoSus
                  ? "Historico SUS"
                  : null,
                judicialIssuer === "psiquiatra" && judicialFilters.riscos ? "Riscos" : null,
                judicialIssuer === "psiquiatra" && judicialFilters.pkpd ? "PK/PD" : null,
                judicialIssuer === "psiquiatra" && judicialFilters.laboratorios
                  ? "Laboratorios"
                  : null,
                judicialIssuer === "psiquiatra" && judicialFilters.interacoes
                  ? "Interacoes"
                  : null,
                judicialIssuer === "psiquiatra" &&
                hasContractedGeneticTest &&
                judicialFilters.genetica
                  ? "Genetica"
                  : null,
                judicialIssuer === "psicologo" ? documentLabel : null,
                judicialIssuer === "psicologo" && judicialFilters.demanda
                  ? "Demanda"
                  : null,
                judicialIssuer === "psicologo" && judicialFilters.procedimentos
                  ? "Procedimentos"
                  : null,
                judicialIssuer === "psicologo" && judicialFilters.analise
                  ? "Analise"
                  : null,
                judicialFilters.transcricao ? "Transcricao" : null
              ].filter(Boolean);

              void exportJudicialReportPdf({
                approachLabel,
                clinicalFrame,
                includeAnalysis: judicialFilters.analise,
                includeDemand: judicialFilters.demanda,
                includeGenetics:
                  judicialIssuer === "psiquiatra" &&
                  hasContractedGeneticTest &&
                  judicialFilters.genetica,
                includeInteractions:
                  judicialIssuer === "psiquiatra" && judicialFilters.interacoes,
                includeLabs: judicialIssuer === "psiquiatra" && judicialFilters.laboratorios,
                includePharmacology: judicialIssuer === "psiquiatra" && judicialFilters.pkpd,
                includeProcedures: judicialFilters.procedimentos,
                includeRisks: judicialIssuer === "psiquiatra" && judicialFilters.riscos,
                includeSusContext:
                  judicialIssuer === "psiquiatra" && judicialFilters.historicoSus,
                includeTranscript: judicialFilters.transcricao,
                issuerType: judicialIssuer,
                patient,
                psychologicalDocumentType:
                  judicialIssuer === "psicologo" ? judicialDocumentType : undefined,
                riskLabel,
                riskScore,
                session: selectedSession,
                transcriptExcerpt
              });
              setReportMessage(
                `Laudo ${judicialIssuer === "psiquiatra" ? "psiquiatrico" : "psicologico"} emitido para ${patient.name} com: ${included.join(", ") || "estrutura minima obrigatoria"}.`
              );
            }}
          />
          <ActionButton
            accent={accent}
            icon={FileText}
            label="Relatorio de Encaminhamento"
            onClick={() => {
              const includeGenetics =
                hasContractedGeneticTest && referralFilters.genetica;
              const sourceLabel =
                REFERRAL_SOURCE_OPTIONS.find((option) => option.value === referralSource)
                  ?.label ?? referralSource;
              const targetLabel =
                REFERRAL_SPECIALTY_OPTIONS.find((option) => option.value === referralTarget)
                  ?.label ?? referralTarget;
              const included = [
                referralFilters.sintomas ? "Sintomas" : null,
                referralFilters.dose ? "Dose" : null,
                includeGenetics ? "Genetica" : null,
                referralFilters.laboratorios ? "Laboratorios" : null,
                referralFilters.interacoes ? "Interacoes" : null
              ].filter(Boolean);

              void exportReferralReportPdf({
                approachLabel,
                clinicalFrame,
                includeDose: referralFilters.dose,
                includeGenetics,
                includeInteractions: referralFilters.interacoes,
                includeLabs: referralFilters.laboratorios,
                includeSymptoms: referralFilters.sintomas,
                includeTranscript: referralFilters.transcricao,
                patient,
                riskLabel,
                riskScore,
                session: selectedSession,
                sourceDiscipline: referralSource,
                targetSpecialty: referralTarget,
                transcriptExcerpt
              });

              setReportMessage(
                `Encaminhamento ${sourceLabel} -> ${targetLabel} exportado com: ${[...included, referralFilters.transcricao ? "Transcricao" : null].filter(Boolean).join(", ") || "resumo clinico base"}.`
              );
            }}
          />
        </div>

        <div className="mt-5 rounded-[18px] border border-white/8 bg-black/12 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[0.66rem] uppercase tracking-[0.28em] text-adler-subtle">
                Modelos oficiais vinculados
              </p>
              <p className="mt-1 text-xs leading-5 text-adler-muted">
                Referencias documentais importadas da base Adler para orientar
                laudos, relatorios e encaminhamentos.
              </p>
            </div>
            <span className="rounded-full border border-white/8 bg-white/4 px-3 py-1.5 font-mono text-[0.66rem] uppercase tracking-[0.2em] text-white/62">
              {documentModelsStatus === "loading"
                ? "sincronizando"
                : `${documentModels.length} modelos`}
            </span>
          </div>

          <div className="mt-4 grid gap-2 md:grid-cols-2">
            {documentModels.slice(0, 4).map((model) => (
              <a
                key={model.id}
                className="group rounded-[16px] border border-white/8 bg-white/[0.035] p-3 transition hover:border-white/16 hover:bg-white/[0.055]"
                href={getAdlerDocumentModelDownloadUrl(model.id)}
                rel="noreferrer"
                target="_blank"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold tracking-[-0.02em] text-white group-hover:text-white">
                      {model.titulo}
                    </p>
                    <p className="mt-1 text-[0.72rem] leading-5 text-adler-muted">
                      {model.uso_clinico}
                    </p>
                  </div>
                  <FileText
                    className="mt-0.5 h-4 w-4 shrink-0"
                    style={{ color: accent }}
                  />
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <span className="rounded-full border border-white/8 bg-white/4 px-2 py-1 font-mono text-[0.62rem] uppercase tracking-[0.16em] text-white/55">
                    {model.tipo_documento}
                  </span>
                  <span className="rounded-full border border-white/8 bg-white/4 px-2 py-1 font-mono text-[0.62rem] uppercase tracking-[0.16em] text-white/55">
                    {model.contexto}
                  </span>
                </div>
              </a>
            ))}
          </div>

          {documentModelsStatus === "error" ? (
            <p className="mt-3 text-xs text-adler-red">
              Nao foi possivel carregar os modelos oficiais agora.
            </p>
          ) : null}
        </div>

        <div className="mt-5 space-y-4">
          <div>
            <p className="mb-2 text-[0.68rem] uppercase tracking-[0.28em] text-adler-subtle">
              Emissor do Laudo Judicial
            </p>
            <div className="flex flex-wrap gap-2">
              <FilterChip
                active={judicialIssuer === "psiquiatra"}
                label="Psiquiatra"
                onClick={() => setJudicialIssuer("psiquiatra")}
              />
              <FilterChip
                active={judicialIssuer === "psicologo"}
                label="Psicologo"
                onClick={() => setJudicialIssuer("psicologo")}
              />
            </div>
          </div>

          {judicialIssuer === "psicologo" ? (
            <div>
              <p className="mb-2 text-[0.68rem] uppercase tracking-[0.28em] text-adler-subtle">
                Tipo de Documento Psicologico
              </p>
              <ControlSelect
                accent={accent}
                accentBorder={accentBorder}
                accentSurface={accentSurface}
                onChange={(value) =>
                  setJudicialDocumentType(value as PsychologicalDocumentType)
                }
                options={PSYCHOLOGICAL_DOCUMENT_OPTIONS}
                value={judicialDocumentType}
              />
            </div>
          ) : null}

          <div>
            <p className="mb-2 text-[0.68rem] uppercase tracking-[0.28em] text-adler-subtle">
              Filtros do Laudo Judicial
            </p>
            <div className="flex flex-wrap gap-2">
              {judicialIssuer === "psiquiatra" ? (
                <>
                  <FilterChip
                    active={judicialFilters.historicoSus}
                    label="Historico SUS"
                    onClick={() =>
                      setJudicialFilters((current) => ({
                        ...current,
                        historicoSus: !current.historicoSus
                      }))
                    }
                  />
                  <FilterChip
                    active={judicialFilters.riscos}
                    label="Riscos"
                    onClick={() =>
                      setJudicialFilters((current) => ({
                        ...current,
                        riscos: !current.riscos
                      }))
                    }
                  />
                  <FilterChip
                    active={judicialFilters.pkpd}
                    label="PK / PD"
                    onClick={() =>
                      setJudicialFilters((current) => ({
                        ...current,
                        pkpd: !current.pkpd
                      }))
                    }
                  />
                  <FilterChip
                    active={judicialFilters.laboratorios}
                    label="Laboratorios"
                    onClick={() =>
                      setJudicialFilters((current) => ({
                        ...current,
                        laboratorios: !current.laboratorios
                      }))
                    }
                  />
                  <FilterChip
                    active={judicialFilters.interacoes}
                    label="Interacoes"
                    onClick={() =>
                      setJudicialFilters((current) => ({
                        ...current,
                        interacoes: !current.interacoes
                      }))
                    }
                  />
                  <FilterChip
                    active={judicialFilters.genetica}
                    disabled={!hasContractedGeneticTest}
                    label="Genetica"
                    onClick={() =>
                      setJudicialFilters((current) => ({
                        ...current,
                        genetica: !current.genetica
                      }))
                    }
                  />
                </>
              ) : (
                <>
                  <FilterChip
                    active={judicialFilters.demanda}
                    label="Demanda"
                    onClick={() =>
                      setJudicialFilters((current) => ({
                        ...current,
                        demanda: !current.demanda
                      }))
                    }
                  />
                  <FilterChip
                    active={judicialFilters.procedimentos}
                    label="Procedimentos"
                    onClick={() =>
                      setJudicialFilters((current) => ({
                        ...current,
                        procedimentos: !current.procedimentos
                      }))
                    }
                  />
                  <FilterChip
                    active={judicialFilters.analise}
                    label="Analise"
                    onClick={() =>
                      setJudicialFilters((current) => ({
                        ...current,
                        analise: !current.analise
                      }))
                    }
                  />
                </>
              )}
              <FilterChip
                active={judicialFilters.transcricao}
                label="Transcricao"
                onClick={() =>
                  setJudicialFilters((current) => ({
                    ...current,
                    transcricao: !current.transcricao
                  }))
                }
              />
            </div>
          </div>

          <div>
            <p className="mb-2 text-[0.68rem] uppercase tracking-[0.28em] text-adler-subtle">
              Fluxo do Encaminhamento
            </p>
            <div className="grid gap-3 md:grid-cols-2">
              <ControlSelect
                accent={accent}
                accentBorder={accentBorder}
                accentSurface={accentSurface}
                label="Origem"
                onChange={(value) => setReferralSource(value as ReferralSourceDiscipline)}
                options={REFERRAL_SOURCE_OPTIONS}
                value={referralSource}
              />
              <ControlSelect
                accent={accent}
                accentBorder={accentBorder}
                accentSurface={accentSurface}
                label="Destino"
                onChange={(value) => setReferralTarget(value as ReferralSpecialty)}
                options={REFERRAL_SPECIALTY_OPTIONS}
                value={referralTarget}
              />
            </div>
          </div>

          <div>
            <p className="mb-2 text-[0.68rem] uppercase tracking-[0.28em] text-adler-subtle">
              Filtros do Encaminhamento
            </p>
            <div className="flex flex-wrap gap-2">
              <FilterChip
                active={referralFilters.sintomas}
                label="Sintomas"
                onClick={() =>
                  setReferralFilters((current) => ({
                    ...current,
                    sintomas: !current.sintomas
                  }))
                }
              />
              <FilterChip
                active={referralFilters.dose}
                label="Dose"
                onClick={() =>
                  setReferralFilters((current) => ({
                    ...current,
                    dose: !current.dose
                  }))
                }
              />
              <FilterChip
                active={referralFilters.laboratorios}
                label="Laboratorios"
                onClick={() =>
                  setReferralFilters((current) => ({
                    ...current,
                    laboratorios: !current.laboratorios
                  }))
                }
              />
              <FilterChip
                active={referralFilters.interacoes}
                label="Interacoes"
                onClick={() =>
                  setReferralFilters((current) => ({
                    ...current,
                    interacoes: !current.interacoes
                  }))
                }
              />
              <FilterChip
                active={referralFilters.genetica}
                disabled={!hasContractedGeneticTest}
                label="Genetica"
                onClick={() =>
                  setReferralFilters((current) => ({
                    ...current,
                    genetica: !current.genetica
                  }))
                }
              />
              <FilterChip
                active={referralFilters.transcricao}
                label="Transcricao"
                onClick={() =>
                  setReferralFilters((current) => ({
                    ...current,
                    transcricao: !current.transcricao
                  }))
                }
              />
            </div>
          </div>
        </div>

        <div className="mt-5 rounded-[18px] border border-white/8 bg-[#16181d] px-4 py-3">
          <p className="text-sm leading-7 text-white/84">{reportMessage}</p>
        </div>
      </section>

      <section
        className="rounded-[24px] border p-5 shadow-panel"
        style={{
          borderColor: accentBorder,
          background: "linear-gradient(135deg, rgba(18,21,27,0.96), rgba(13,16,21,0.98))",
          boxShadow: `0 0 28px ${accentSurface}`
        }}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div
              className="flex h-11 w-11 items-center justify-center rounded-[18px] border"
              style={{
                color: accent,
                borderColor: accentBorder,
                backgroundColor: accentSurface
              }}
            >
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <p className="font-mono text-[0.68rem] uppercase tracking-[0.32em] text-adler-subtle">
                Adler Prognosis
              </p>
              <h3 className="mt-2 text-lg font-semibold tracking-[-0.03em] text-white">
                Conclusao preditiva
              </h3>
            </div>
          </div>

          <div className="rounded-full border border-white/8 bg-white/4 px-3 py-1.5 font-mono text-xs text-white/74">
            {hasContractedGeneticTest ? "Perfil CYP integrado" : "Camada genetica pendente"}
          </div>
        </div>

        <p className="mt-5 max-w-4xl text-[0.95rem] leading-7 text-white/88">
          Com base na velocidade atual de remissao, no risco clinico e no encaixe
          farmacogenetico, a probabilidade de estabilizacao completa em 8 semanas
          permanece alta se o protocolo atual for mantido com boa adesao.
        </p>

        <div className="mt-5 flex items-center gap-3 font-mono text-xs text-adler-muted">
          <BrainCircuit className="h-4 w-4" />
          <span>Confianca do modelo travada na curva de recuperacao da Sessao {selectedSession}.</span>
          <ChevronRight className="h-4 w-4" />
        </div>
      </section>
    </div>
  );
}

function MetricTile({
  accent,
  description,
  label,
  value
}: {
  accent: string;
  description: string;
  label: string;
  value: number;
}) {
  return (
    <article
      className="rounded-[18px] border border-white/8 bg-[#16181d] p-4"
      style={{ boxShadow: `0 0 16px ${accent}22` }}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-[0.68rem] uppercase tracking-[0.24em] text-adler-subtle">
          {label}
        </span>
        <span className="font-mono text-sm font-semibold" style={{ color: accent }}>
          {value}
        </span>
      </div>
      <p className="mt-3 text-sm leading-6 text-adler-muted">{description}</p>
    </article>
  );
}

function ActionButton({
  accent,
  icon: Icon,
  label,
  onClick
}: {
  accent: string;
  icon: LucideIcon;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className="flex items-center gap-3 rounded-[18px] border border-white/8 bg-[#16181d] px-4 py-3 text-left transition hover:bg-[#181c22]"
      onClick={onClick}
      type="button"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-white/5">
        <Icon className="h-[18px] w-[18px]" style={{ color: accent }} />
      </div>
      <span className="text-sm font-semibold tracking-[-0.02em] text-white">
        {label}
      </span>
    </button>
  );
}

function FilterChip({
  active,
  disabled,
  label,
  onClick
}: {
  active: boolean;
  disabled?: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className="rounded-full border px-3 py-1.5 font-mono text-xs uppercase tracking-[0.22em] transition"
      disabled={disabled}
      onClick={onClick}
      style={{
        opacity: disabled ? 0.35 : 1,
        borderColor: active ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.08)",
        backgroundColor: active ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.02)",
        color: active ? "#ffffff" : "#9097a8",
        cursor: disabled ? "not-allowed" : "pointer"
      }}
      type="button"
    >
      {label}
    </button>
  );
}

function ControlSelect({
  accent,
  accentBorder,
  accentSurface,
  label,
  onChange,
  options,
  value
}: {
  accent: string;
  accentBorder: string;
  accentSurface: string;
  label?: string;
  onChange: (value: string) => void;
  options: Array<{ label: string; value: string }>;
  value: string;
}) {
  return (
    <label className="grid gap-1.5">
      {label ? (
        <span className="text-[0.68rem] uppercase tracking-[0.24em] text-adler-subtle">
          {label}
        </span>
      ) : null}
      <select
        className="rounded-[16px] border bg-[#16181d] px-3 py-3 text-sm text-white outline-none transition"
        onChange={(event) => onChange(event.target.value)}
        style={{
          borderColor: accentBorder,
          boxShadow: `0 0 0 1px ${accentSurface}`,
          caretColor: accent
        }}
        value={value}
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

function EvolutionTooltip({
  active,
  payload,
  label,
  anxietyColor,
  moodColor,
  adherenceColor,
  expectedColor
}: {
  active?: boolean;
  adherenceColor: string;
  anxietyColor: string;
  expectedColor: string;
  label?: number;
  moodColor: string;
  payload?: Array<{ dataKey?: string; value?: number }>;
}) {
  if (!active || !payload?.length) {
    return null;
  }

  const toneMap: Record<string, string> = {
    anxiety: anxietyColor,
    mood: moodColor,
    adherence: adherenceColor,
    expectedPath: expectedColor
  };
  const labelMap: Record<string, string> = {
    anxiety: SERIES_META.anxiety.label,
    mood: SERIES_META.mood.label,
    adherence: SERIES_META.adherence.label,
    expectedPath: "Trajetoria Esperada por Evidencia"
  };

  return (
    <div className="rounded-[18px] border border-white/8 bg-[#11151b]/96 px-4 py-3 shadow-panel backdrop-blur-xl">
      <p className="font-mono text-[0.68rem] uppercase tracking-[0.28em] text-adler-subtle">
        Sessao {label}
      </p>
      <div className="mt-3 space-y-2">
        {payload.map((entry) => {
          const dataKey = String(entry.dataKey ?? "");

          return (
            <div key={dataKey} className="flex items-center justify-between gap-4">
              <span className="text-xs text-white/82" style={{ color: toneMap[dataKey] }}>
                {labelMap[dataKey]}
              </span>
              <span className="font-mono text-xs text-white/74">{entry.value}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
