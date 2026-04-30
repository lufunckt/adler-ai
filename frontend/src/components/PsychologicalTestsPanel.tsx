import { ClipboardList, Target } from "lucide-react";
import type { PatientRecord } from "../data/patientData";
import { getPsychologicalTests } from "../data/psychologicalTestsData";

type PsychologicalTestsPanelProps = {
  accent: string;
  accentBorder: string;
  accentSurface: string;
  patient: PatientRecord;
};

export function PsychologicalTestsPanel({
  accent,
  accentBorder,
  accentSurface,
  patient
}: PsychologicalTestsPanelProps) {
  const tests = getPsychologicalTests(patient);

  return (
    <div className="grid h-full min-h-[480px] gap-4 xl:grid-cols-[minmax(0,1.12fr)_320px]">
      <div className="grid gap-4">
        <section className="rounded-[24px] border border-adler-border bg-[#101318]/92 p-5 shadow-panel">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="font-mono text-[0.68rem] uppercase tracking-[0.32em] text-adler-subtle">
                Testes Psicologicos
              </p>
              <h3 className="mt-2 text-[1.35rem] font-semibold tracking-[-0.04em] text-white">
                {patient.name} // triagem, mensuracao e acompanhamento
              </h3>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-adler-muted">
                Escalas clinicas e instrumentos psicologicos organizados como trilha
                objetiva de acompanhamento, hipotese diagnostica e resposta ao
                tratamento.
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
              {tests.length} instrumentos
            </div>
          </div>

          <div className="mt-5 grid gap-3">
            {tests.map((test) => (
              <article
                key={test.name}
                className="rounded-[18px] border border-white/8 bg-[#16181d] p-4"
                style={{ boxShadow: `0 0 16px ${accentSurface}` }}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-[0.68rem] uppercase tracking-[0.24em] text-adler-subtle">
                      {test.appliedIn}
                    </p>
                    <h4 className="mt-2 text-[1rem] font-semibold tracking-[-0.02em] text-white">
                      {test.name}
                    </h4>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-base font-semibold" style={{ color: accent }}>
                      {test.score}
                    </p>
                    <p className="mt-1 text-[0.7rem] uppercase tracking-[0.22em] text-white/48">
                      {test.range}
                    </p>
                  </div>
                </div>

                <p className="mt-4 text-sm leading-6 text-adler-muted">
                  {test.interpretation}
                </p>

                <div className="mt-4 rounded-[16px] border border-white/8 bg-black/10 px-4 py-3">
                  <p className="text-[0.68rem] uppercase tracking-[0.22em] text-adler-subtle">
                    Tendencia
                  </p>
                  <p className="mt-2 text-sm leading-6 text-white/84">{test.trend}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>

      <div className="grid gap-4">
        <section className="rounded-[24px] border border-adler-border bg-[#101318]/92 p-5 shadow-panel">
          <div
            className="flex h-11 w-11 items-center justify-center rounded-[16px] border"
            style={{
              color: accent,
              borderColor: accentBorder,
              backgroundColor: accentSurface
            }}
          >
            <ClipboardList className="h-5 w-5" />
          </div>
          <h3 className="mt-4 text-lg font-semibold tracking-[-0.03em] text-white">
            Utilidade Clinica
          </h3>
          <p className="mt-3 text-sm leading-6 text-adler-muted">
            Esta aba organiza instrumentos de rastreio, escalas de gravidade e
            medidas de seguimento longitudinal para diferenciar sofrimento atual,
            comorbidades e progresso terapêutico.
          </p>
        </section>

        <section className="rounded-[24px] border border-adler-border bg-[#101318]/92 p-5 shadow-panel">
          <div
            className="flex h-11 w-11 items-center justify-center rounded-[16px] border"
            style={{
              color: accent,
              borderColor: accentBorder,
              backgroundColor: accentSurface
            }}
          >
            <Target className="h-5 w-5" />
          </div>
          <h3 className="mt-4 text-lg font-semibold tracking-[-0.03em] text-white">
            Leitura Integrada
          </h3>
          <p className="mt-3 text-sm leading-6 text-adler-muted">
            As escalas aqui apresentadas podem ser usadas como base para
            encaminhamento, laudo psicologico, revisão de hipótese diagnóstica e
            comparação com a linha do tempo do caso.
          </p>
        </section>
      </div>
    </div>
  );
}
