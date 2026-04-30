import { motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  BrainCircuit,
  Dna,
  FlaskConical,
  Lock,
  MoonStar,
  Pill
} from "lucide-react";
import type { PatientRecord } from "../data/patientData";
import { MedicationSearchWorkspace } from "./MedicationSearchWorkspace";

type MedicationsPanelProps = {
  accent: string;
  accentBorder: string;
  accentSurface: string;
  hasContractedGeneticTest: boolean;
  patient: PatientRecord;
};

type TreatmentSupport = {
  detail: string;
  icon: typeof Activity;
  metric: string;
  title: string;
};

const SUPPORT_FACTORS: TreatmentSupport[] = [
  {
    title: "Higiene do Sono",
    metric: "+18%",
    detail: "na eficacia do ISRS",
    icon: MoonStar
  },
  {
    title: "Exercicio Aerobico",
    metric: "BDNF",
    detail: "aumento observado",
    icon: Activity
  },
  {
    title: "Mindfulness",
    metric: "-12%",
    detail: "na ativacao da Amigdala",
    icon: BrainCircuit
  }
];

export function MedicationsPanel({
  accent,
  accentBorder,
  accentSurface,
  hasContractedGeneticTest,
  patient
}: MedicationsPanelProps) {
  return (
    <div className="grid h-full min-h-[480px] gap-4 xl:grid-cols-[minmax(0,1.16fr)_340px]">
      <div className="grid gap-4">
        <section className="rounded-[24px] border border-adler-border bg-[#101318]/92 p-5 shadow-panel">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="font-mono text-[0.68rem] uppercase tracking-[0.32em] text-adler-subtle">
                Painel Farmacologico
              </p>
              <h3 className="mt-2 text-[1.35rem] font-semibold tracking-[-0.04em] text-white">
                {patient.name} // revisao farmacocinetica e farmacodinamica
              </h3>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-adler-muted">
                A intervencao farmacologica atual e lida contra tempo de absorcao,
                engajamento receptor e marcadores de tolerabilidade observados nas
                sessoes.
              </p>
            </div>

            <div
              className="rounded-full border px-3 py-1.5 font-mono text-[0.68rem] uppercase tracking-[0.24em]"
              style={{
                color: accent,
                borderColor: accentBorder,
                backgroundColor: accentSurface
              }}
            >
              {patient.currentProtocol}
            </div>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <MedicationCard
              accent={accent}
              accentBorder={accentBorder}
              accentSurface={accentSurface}
              {...patient.medications.primary}
            />

            <MedicationCard
              accent={accent}
              accentBorder={accentBorder}
              accentSurface={accentSurface}
              {...patient.medications.secondary}
            />
          </div>
        </section>

        <MedicationSearchWorkspace
          accent={accent}
          accentBorder={accentBorder}
          accentSurface={accentSurface}
          patient={patient}
        />

        <section className="rounded-[24px] border border-adler-border bg-[#12151b]/90 p-5 shadow-panel">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-mono text-[0.68rem] uppercase tracking-[0.32em] text-adler-subtle">
                PK / PD Lens
              </p>
              <h3 className="mt-2 text-lg font-semibold tracking-[-0.03em] text-white">
                Janela de exposicao e sinal receptor
              </h3>
            </div>
            <div
              className="flex h-10 w-10 items-center justify-center rounded-[14px] border"
              style={{
                color: accent,
                borderColor: accentBorder,
                backgroundColor: accentSurface
              }}
            >
              <FlaskConical className="h-4 w-4" />
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <PharmacologyCard
              accent={accent}
              accentBorder={accentBorder}
              accentSurface={accentSurface}
              detail={patient.pharmacology.pharmacokinetic.detail}
              label={patient.pharmacology.pharmacokinetic.label}
              value={patient.pharmacology.pharmacokinetic.value}
            />
            <PharmacologyCard
              accent={accent}
              accentBorder={accentBorder}
              accentSurface={accentSurface}
              detail={patient.pharmacology.pharmacodynamic.detail}
              label={patient.pharmacology.pharmacodynamic.label}
              value={patient.pharmacology.pharmacodynamic.value}
            />
          </div>
        </section>

        {patient.interactions?.length ? (
          <section className="rounded-[24px] border border-adler-border bg-[#12151b]/90 p-5 shadow-panel">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-mono text-[0.68rem] uppercase tracking-[0.32em] text-adler-subtle">
                  Interacoes e Sinergias
                </p>
                <h3 className="mt-2 text-lg font-semibold tracking-[-0.03em] text-white">
                  Alimentos, substancias e seguranca do esquema
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
                base interacional
              </span>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {patient.interactions.map((interaction) => (
                <InteractionCard
                  key={`${interaction.title}-${interaction.counterpart}`}
                  accent={accent}
                  accentBorder={accentBorder}
                  accentSurface={accentSurface}
                  category={interaction.category}
                  counterpart={interaction.counterpart}
                  effect={interaction.effect}
                  guidance={interaction.guidance}
                  severity={interaction.severity}
                  title={interaction.title}
                />
              ))}
            </div>
          </section>
        ) : null}

        {patient.harmReduction ? (
          <section className="rounded-[24px] border border-adler-border bg-[#12151b]/90 p-5 shadow-panel">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-mono text-[0.68rem] uppercase tracking-[0.32em] text-adler-subtle">
                  Dependencia Quimica
                </p>
                <h3 className="mt-2 text-lg font-semibold tracking-[-0.03em] text-white">
                  Reducao de danos e protecao de risco
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
                plano ativo
              </span>
            </div>

            <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
              <div className="rounded-[18px] border border-white/8 bg-[#16181d] p-4">
                <p className="text-[0.68rem] uppercase tracking-[0.24em] text-adler-subtle">
                  Estagio atual
                </p>
                <p className="mt-2 text-sm leading-6 text-white/88">
                  {patient.harmReduction.currentStage}
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  {patient.harmReduction.activeSubstances.map((substance) => (
                    <span
                      key={substance}
                      className="rounded-full border border-white/8 bg-white/[0.04] px-3 py-1.5 font-mono text-[0.68rem] uppercase tracking-[0.22em] text-white/78"
                    >
                      {substance}
                    </span>
                  ))}
                </div>

                <div className="mt-4 rounded-[16px] border border-red-500/20 bg-red-500/8 px-4 py-3">
                  <p className="text-[0.68rem] uppercase tracking-[0.24em] text-red-100/70">
                    Red flags
                  </p>
                  <p className="mt-2 text-sm leading-6 text-red-100">
                    {patient.harmReduction.redFlags}
                  </p>
                </div>
              </div>

              <div className="grid gap-3">
                <CompactListCard title="Metas Clinicas" values={patient.harmReduction.goals} />
                <CompactListCard
                  title="Plano de Seguranca"
                  values={patient.harmReduction.safetyPlan}
                />
                <div className="rounded-[18px] border border-white/8 bg-[#16181d] p-4">
                  <p className="text-[0.68rem] uppercase tracking-[0.24em] text-adler-subtle">
                    Rede de apoio
                  </p>
                  <p className="mt-2 text-sm leading-6 text-adler-muted">
                    {patient.harmReduction.supportNetwork}
                  </p>
                </div>
              </div>
            </div>
          </section>
        ) : null}

        <section className="rounded-[24px] border border-adler-border bg-[#12151b]/90 p-5 shadow-panel">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-mono text-[0.68rem] uppercase tracking-[0.32em] text-adler-subtle">
                Sinergias Nao-Farmacologicas
              </p>
              <h3 className="mt-2 text-lg font-semibold tracking-[-0.03em] text-white">
                Potencializadores terapeuticos
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
              camada adjunta
            </span>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {SUPPORT_FACTORS.map((factor, index) => {
              const Icon = factor.icon;

              return (
                <motion.article
                  key={factor.title}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.2 }}
                  className="rounded-[18px] border border-white/8 bg-[#16181d] p-4"
                  style={{ boxShadow: `0 0 16px ${accentSurface}` }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div
                      className="flex h-9 w-9 items-center justify-center rounded-[14px] border"
                      style={{
                        color: accent,
                        borderColor: accentBorder,
                        backgroundColor: accentSurface
                      }}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className="font-mono text-sm font-semibold" style={{ color: accent }}>
                      {factor.metric}
                    </span>
                  </div>
                  <h4 className="mt-4 text-[0.92rem] font-semibold tracking-[-0.02em] text-white">
                    {factor.title}
                  </h4>
                  <p className="mt-2 text-sm leading-6 text-adler-muted">{factor.detail}</p>
                </motion.article>
              );
            })}
          </div>
        </section>
      </div>

      <div className="grid gap-4">
        <section className="rounded-[24px] border border-adler-border bg-[#101318]/92 p-5 shadow-panel">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-mono text-[0.68rem] uppercase tracking-[0.32em] text-adler-subtle">
                Farmacogenetica
              </p>
              <h3 className="mt-2 text-lg font-semibold tracking-[-0.03em] text-white">
                Modulo Adler DNA
              </h3>
            </div>
            <div
              className="flex h-10 w-10 items-center justify-center rounded-[16px] border"
              style={{
                color: accent,
                borderColor: accentBorder,
                backgroundColor: accentSurface
              }}
            >
              <Dna className="h-4 w-4" />
            </div>
          </div>

          <div
            className="relative mt-5 overflow-hidden rounded-[22px] border bg-[#16181d] p-4"
            style={{
              borderColor: hasContractedGeneticTest ? accentBorder : "rgba(255,255,255,0.08)",
              boxShadow: hasContractedGeneticTest
                ? `0 0 24px ${accentSurface}`
                : "0 0 0 rgba(0,0,0,0)"
            }}
          >
            <div className={hasContractedGeneticTest ? "" : "blur-sm opacity-25"}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-mono text-[0.68rem] uppercase tracking-[0.28em] text-adler-subtle">
                    {patient.genetics.gene}
                  </p>
                  <h4 className="mt-2 text-base font-semibold tracking-[-0.02em] text-white">
                    {patient.genetics.phenotype}
                  </h4>
                </div>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 font-mono text-[0.68rem] uppercase tracking-[0.22em] text-white/72">
                  {translateBadge(patient.genetics.badge)}
                </span>
              </div>

              <p className="mt-4 text-sm leading-6 text-adler-muted">
                {patient.genetics.summary}
              </p>

              <div className="mt-5 rounded-[18px] border border-white/8 bg-black/10 p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[0.68rem] uppercase tracking-[0.24em] text-adler-subtle">
                    compatibilidade terapeutica
                  </span>
                  <span className="font-mono text-sm font-semibold text-white">
                    {patient.genetics.compatibility / 100}
                  </span>
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/6">
                  <motion.div
                    className="h-full rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${patient.genetics.compatibility}%` }}
                    transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                    style={{
                      background: `linear-gradient(90deg, ${patient.genetics.gradientStart}, ${patient.genetics.gradientEnd})`
                    }}
                  />
                </div>
              </div>
            </div>

            {!hasContractedGeneticTest ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#16181d]/85 px-5 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-red-400/20 bg-red-500/10 text-red-400">
                  <Lock className="h-5 w-5" />
                </div>
                <p className="text-sm font-semibold tracking-[-0.02em] text-white">
                  Modulo de Farmacogenetica Bloqueado
                </p>
                <p className="max-w-[240px] text-sm leading-6 text-adler-muted">
                  Este insight requer a contratacao do teste Adler DNA.
                </p>
              </div>
            ) : null}
          </div>
        </section>

        <section className="rounded-[24px] border border-adler-border bg-[#101318]/92 p-5 shadow-panel">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-mono text-[0.68rem] uppercase tracking-[0.32em] text-adler-subtle">
                Resumo Farmacologico
              </p>
              <h3 className="mt-2 text-lg font-semibold tracking-[-0.03em] text-white">
                Acoplamento entre exposicao e efeito
              </h3>
            </div>
            <div
              className="rounded-full border px-3 py-1.5 font-mono text-[0.68rem] uppercase tracking-[0.22em]"
              style={{
                color: accent,
                borderColor: accentBorder,
                backgroundColor: accentSurface
              }}
            >
              leitura individual
            </div>
          </div>

          <div className="mt-4 space-y-3">
            <InlineLens
              accent={accent}
              label="Vigilancia de clearance"
              value={patient.pharmacology.pharmacokinetic.value}
            />
            <InlineLens
              accent={accent}
              label="Sinal receptor"
              value={patient.pharmacology.pharmacodynamic.value}
            />
            <InlineLens
              accent={accent}
              label="Ancoragem de dose"
              value={`${patient.medications.primary.title} ${patient.medications.primary.dose}`}
            />
          </div>
        </section>
      </div>
    </div>
  );
}

type MedicationCardProps = {
  accent: string;
  accentBorder: string;
  accentSurface: string;
  alert?: string;
  dose: string;
  efficacy?: number;
  efficacyLabel?: string;
  highlight?: string;
  subtitle: string;
  title: string;
};

function MedicationCard({
  accent,
  accentBorder,
  accentSurface,
  alert,
  dose,
  efficacy,
  efficacyLabel,
  highlight,
  subtitle,
  title
}: MedicationCardProps) {
  return (
    <article
      className="rounded-[22px] border border-adler-border bg-[#12151b]/92 p-4 shadow-panel"
      style={{ boxShadow: `0 0 22px ${accentSurface}` }}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[0.68rem] uppercase tracking-[0.28em] text-adler-subtle">
            {subtitle}
          </p>
          <h3 className="mt-2 text-lg font-semibold tracking-[-0.03em] text-white">
            {title}
          </h3>
        </div>

        <div
          className="flex h-10 w-10 items-center justify-center rounded-[14px] border"
          style={{
            color: accent,
            borderColor: accentBorder,
            backgroundColor: accentSurface
          }}
        >
          <Pill className="h-4 w-4" />
        </div>
      </div>

      <div className="mt-4 rounded-[18px] border border-white/8 bg-[#16181d] px-4 py-3">
        <span className="text-[0.68rem] uppercase tracking-[0.24em] text-adler-subtle">
          dose atual
        </span>
        <p className="mt-2 font-mono text-[1.4rem] font-semibold tracking-[-0.04em] text-white">
          {dose}
        </p>
      </div>

      {typeof efficacy === "number" ? (
        <div className="mt-4">
          <div className="flex items-center justify-between gap-3">
            <span className="text-[0.68rem] uppercase tracking-[0.24em] text-adler-subtle">
              {efficacyLabel}
            </span>
            <span className="font-mono text-sm font-semibold" style={{ color: accent }}>
              {efficacy}%
            </span>
          </div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/6">
            <motion.div
              className="h-full rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${efficacy}%` }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              style={{
                background: `linear-gradient(90deg, ${accent}, rgba(255,255,255,0.92))`
              }}
            />
          </div>
        </div>
      ) : null}

      {highlight ? (
        <div
          className="mt-4 rounded-[18px] border px-4 py-3 text-sm leading-6 text-white/88"
          style={{
            borderColor: accentBorder,
            backgroundColor: accentSurface
          }}
        >
          {highlight}
        </div>
      ) : null}

      {alert ? (
        <div className="mt-4 rounded-[18px] border border-red-500/20 bg-red-500/10 px-4 py-3">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-500/12 text-red-400">
              <AlertTriangle className="h-[18px] w-[18px]" />
            </div>
            <p className="text-sm leading-6 text-red-100">{alert}</p>
          </div>
        </div>
      ) : null}
    </article>
  );
}

function PharmacologyCard({
  accent,
  accentBorder,
  accentSurface,
  detail,
  label,
  value
}: {
  accent: string;
  accentBorder: string;
  accentSurface: string;
  detail: string;
  label: string;
  value: string;
}) {
  return (
    <article
      className="rounded-[18px] border bg-[#16181d] p-4"
      style={{
        borderColor: accentBorder,
        boxShadow: `0 0 18px ${accentSurface}`
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-[0.68rem] uppercase tracking-[0.24em] text-adler-subtle">
          {translatePharmacologyLabel(label)}
        </span>
        <span className="font-mono text-sm font-semibold" style={{ color: accent }}>
          {value}
        </span>
      </div>
      <p className="mt-3 text-sm leading-6 text-adler-muted">{detail}</p>
    </article>
  );
}

function InlineLens({
  accent,
  label,
  value
}: {
  accent: string;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[16px] border border-white/8 bg-white/[0.03] px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[0.68rem] uppercase tracking-[0.22em] text-adler-subtle">
          {label}
        </span>
        <span className="font-mono text-sm font-semibold" style={{ color: accent }}>
          {value}
        </span>
      </div>
    </div>
  );
}

function InteractionCard({
  accent,
  accentBorder,
  accentSurface,
  category,
  counterpart,
  effect,
  guidance,
  severity,
  title
}: {
  accent: string;
  accentBorder: string;
  accentSurface: string;
  category: "alimento" | "alerta" | "sinergia";
  counterpart: string;
  effect: string;
  guidance: string;
  severity: "alto" | "moderado" | "protetor";
  title: string;
}) {
  const tone =
    severity === "alto"
      ? {
          badge: "critico",
          border: "rgba(239,68,68,0.28)",
          glow: "rgba(239,68,68,0.12)",
          surface: "rgba(239,68,68,0.08)",
          text: "#fca5a5"
        }
      : severity === "protetor"
        ? {
            badge: "sinergia",
            border: accentBorder,
            glow: accentSurface,
            surface: accentSurface,
            text: accent
          }
        : {
            badge: "atenção",
            border: "rgba(245,158,11,0.26)",
            glow: "rgba(245,158,11,0.1)",
            surface: "rgba(245,158,11,0.08)",
            text: "#fbbf24"
          };

  return (
    <article
      className="rounded-[18px] border bg-[#16181d] p-4"
      style={{
        borderColor: tone.border,
        boxShadow: `0 0 16px ${tone.glow}`
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[0.68rem] uppercase tracking-[0.24em] text-adler-subtle">
            {category}
          </p>
          <h4 className="mt-2 text-[0.95rem] font-semibold tracking-[-0.02em] text-white">
            {title}
          </h4>
        </div>
        <span
          className="rounded-full border px-2.5 py-1 font-mono text-[0.62rem] uppercase tracking-[0.22em]"
          style={{
            color: tone.text,
            borderColor: tone.border,
            backgroundColor: tone.surface
          }}
        >
          {tone.badge}
        </span>
      </div>

      <div className="mt-4 space-y-2 text-sm leading-6 text-adler-muted">
        <p>
          <span className="text-white/86">Contraparte:</span> {counterpart}
        </p>
        <p>
          <span className="text-white/86">Efeito:</span> {effect}
        </p>
        <p>
          <span className="text-white/86">Conduta:</span> {guidance}
        </p>
      </div>
    </article>
  );
}

function CompactListCard({ title, values }: { title: string; values: string[] }) {
  return (
    <div className="rounded-[18px] border border-white/8 bg-[#16181d] p-4">
      <p className="text-[0.68rem] uppercase tracking-[0.24em] text-adler-subtle">
        {title}
      </p>
      <div className="mt-3 space-y-2">
        {values.map((value) => (
          <div
            key={value}
            className="rounded-[14px] border border-white/8 bg-white/[0.03] px-3 py-2.5 text-sm leading-6 text-white/84"
          >
            {value}
          </div>
        ))}
      </div>
    </div>
  );
}

function translateBadge(value: string) {
  if (value.toLowerCase().includes("monitor")) {
    return "monitorar";
  }

  return "perfil valido";
}

function translatePharmacologyLabel(label: string) {
  if (label === "Pharmacokinetic Window") {
    return "Janela farmacocinetica";
  }

  if (label === "Pharmacodynamic Signal") {
    return "Sinal farmacodinamico";
  }

  return label;
}
