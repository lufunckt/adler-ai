import { AlertTriangle, FlaskConical } from "lucide-react";
import type { PatientRecord } from "../data/patientData";

type ClinicalExamsPanelProps = {
  accent: string;
  accentBorder: string;
  accentSurface: string;
  patient: PatientRecord;
};

export function ClinicalExamsPanel({
  accent,
  accentBorder,
  accentSurface,
  patient
}: ClinicalExamsPanelProps) {
  if (!patient.labs) {
    return (
      <div className="flex h-full min-h-[480px] items-center justify-center rounded-[24px] border border-adler-border bg-[#101318]/92 p-6 shadow-panel">
        <div className="max-w-xl text-center">
          <p className="font-mono text-[0.68rem] uppercase tracking-[0.32em] text-adler-subtle">
            Exames Clinicos
          </p>
          <h3 className="mt-3 text-xl font-semibold tracking-[-0.04em] text-white">
            Sem protocolo laboratorial ativo
          </h3>
          <p className="mt-3 text-sm leading-6 text-adler-muted">
            Este paciente nao tem monitoramento laboratorial parametrizado para o
            esquema atual. A aba permanece disponivel para casos com exigencia de
            seguimento biologico, como lítio, valproato, carbamazepina ou
            naltrexona.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid h-full min-h-[480px] gap-4 xl:grid-cols-[minmax(0,1.12fr)_320px]">
      <div className="grid gap-4">
        <section className="rounded-[24px] border border-adler-border bg-[#101318]/92 p-5 shadow-panel">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="font-mono text-[0.68rem] uppercase tracking-[0.32em] text-adler-subtle">
                Exames Clinicos
              </p>
              <h3 className="mt-2 text-[1.35rem] font-semibold tracking-[-0.04em] text-white">
                {patient.name} // seguimento biologico e seguranca terapeutica
              </h3>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-adler-muted">
                Painel separado para monitoramento laboratorial, janela de coleta e
                sinais de toxicidade clinica associados ao tratamento.
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
              {patient.labs.medication}
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <TimelineTile label="Baseline" value={patient.labs.baseline} />
            <TimelineTile label="Inicio" value={patient.labs.startSchedule} />
            <TimelineTile label="Manutencao" value={patient.labs.maintenanceSchedule} />
          </div>
        </section>

        <section className="rounded-[24px] border border-adler-border bg-[#12151b]/90 p-5 shadow-panel">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-mono text-[0.68rem] uppercase tracking-[0.32em] text-adler-subtle">
                Painel de Coletas
              </p>
              <h3 className="mt-2 text-lg font-semibold tracking-[-0.03em] text-white">
                Exames exigidos pelo esquema atual
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
            {patient.labs.tests.map((test) => (
              <LabExamCard
                key={test.name}
                accent={accent}
                accentBorder={accentBorder}
                accentSurface={accentSurface}
                frequency={test.frequency}
                lastResult={test.lastResult}
                name={test.name}
                purpose={test.purpose}
                status={test.status}
              />
            ))}
          </div>
        </section>
      </div>

      <div className="grid gap-4">
        <section className="rounded-[24px] border border-adler-border bg-[#101318]/92 p-5 shadow-panel">
          <p className="font-mono text-[0.68rem] uppercase tracking-[0.32em] text-adler-subtle">
            Alerta de Toxicidade
          </p>
          <div className="mt-4 rounded-[18px] border border-red-500/20 bg-red-500/10 px-4 py-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-500/12 text-red-400">
                <AlertTriangle className="h-[18px] w-[18px]" />
              </div>
              <p className="text-sm leading-6 text-red-100">
                {patient.labs.alertSymptoms}
              </p>
            </div>
          </div>

          <div className="mt-4 rounded-[18px] border border-white/8 bg-[#16181d] px-4 py-3">
            <p className="text-[0.68rem] uppercase tracking-[0.24em] text-adler-subtle">
              Interacao critica
            </p>
            <p className="mt-2 text-sm leading-6 text-adler-muted">
              {patient.labs.interactionNote}
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

function TimelineTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[18px] border border-white/8 bg-[#16181d] px-4 py-3">
      <p className="text-[0.68rem] uppercase tracking-[0.24em] text-adler-subtle">
        {label}
      </p>
      <p className="mt-2 text-sm leading-6 text-white/84">{value}</p>
    </div>
  );
}

function LabExamCard({
  accent,
  accentBorder,
  accentSurface,
  frequency,
  lastResult,
  name,
  purpose,
  status
}: {
  accent: string;
  accentBorder: string;
  accentSurface: string;
  frequency: string;
  lastResult: string;
  name: string;
  purpose: string;
  status: "alert" | "due" | "ok";
}) {
  const tone = resolveLabStatus(status, accent, accentBorder, accentSurface);

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
            {purpose}
          </p>
          <h4 className="mt-2 text-[0.95rem] font-semibold tracking-[-0.02em] text-white">
            {name}
          </h4>
        </div>
        <span
          className="rounded-full border px-2.5 py-1 font-mono text-[0.62rem] uppercase tracking-[0.22em]"
          style={{
            color: tone.accent,
            borderColor: tone.border,
            backgroundColor: tone.surface
          }}
        >
          {tone.label}
        </span>
      </div>

      <div className="mt-4 space-y-2 text-sm leading-6 text-adler-muted">
        <p>
          <span className="text-white/86">Frequencia:</span> {frequency}
        </p>
        <p>
          <span className="text-white/86">Ultimo resultado:</span> {lastResult}
        </p>
      </div>
    </article>
  );
}

function resolveLabStatus(
  status: "alert" | "due" | "ok",
  accent: string,
  accentBorder: string,
  accentSurface: string
) {
  if (status === "alert") {
    return {
      accent: "#ef4444",
      border: "rgba(239,68,68,0.32)",
      glow: "rgba(239,68,68,0.14)",
      label: "alerta",
      surface: "rgba(239,68,68,0.1)"
    };
  }

  if (status === "due") {
    return {
      accent: "#f59e0b",
      border: "rgba(245,158,11,0.28)",
      glow: "rgba(245,158,11,0.12)",
      label: "pendente",
      surface: "rgba(245,158,11,0.1)"
    };
  }

  return {
    accent,
    border: accentBorder,
    glow: accentSurface,
    label: "ok",
    surface: accentSurface
  };
}
