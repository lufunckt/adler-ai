import { useState } from "react";
import { FileText } from "lucide-react";
import type { ClinicianProfile } from "../data/clinicianData";
import type { PatientRecord } from "../data/patientData";
import { DocumentsPanel } from "./DocumentsPanel";

type DocumentsCenterPanelProps = {
  accent: string;
  accentBorder: string;
  accentSurface: string;
  clinician: ClinicianProfile;
  patients: PatientRecord[];
};

export function DocumentsCenterPanel({
  accent,
  accentBorder,
  accentSurface,
  clinician,
  patients
}: DocumentsCenterPanelProps) {
  const [selectedPatientId, setSelectedPatientId] = useState(patients[0]?.id ?? "");
  const selectedPatient =
    patients.find((patient) => patient.id === selectedPatientId) ?? patients[0];

  if (!selectedPatient) {
    return (
      <section className="rounded-[28px] border border-adler-border bg-adler-panel/82 p-6 shadow-panel">
        <p className="text-sm text-adler-muted">
          Cadastre um paciente antes de gerar documentos clinicos.
        </p>
      </section>
    );
  }

  return (
    <div className="space-y-5">
      <section
        className="rounded-[30px] border bg-adler-panel/82 p-5 shadow-panel md:p-6"
        style={{ borderColor: accentBorder, boxShadow: `0 0 24px ${accentSurface}` }}
      >
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div>
            <p className="font-mono text-[0.68rem] uppercase tracking-[0.34em] text-adler-subtle">
              Central de documentos
            </p>
            <h2 className="mt-3 text-[1.75rem] font-semibold tracking-[-0.05em] text-white">
              Laudos, encaminhamentos e modelos oficiais
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-adler-muted">
              Escolha o paciente, selecione o tipo de documento e gere uma saida
              clinica rastreavel. Esta pagina fica fora do prontuario para
              funcionar como central juridica e documental do consultorio.
            </p>
          </div>

          <label className="rounded-[22px] border border-white/8 bg-black/10 p-4">
            <div className="mb-3 flex items-center gap-3">
              <FileText className="h-4 w-4" style={{ color: accent }} />
              <span className="text-sm font-semibold text-white">
                Contexto do documento
              </span>
            </div>
            <span className="text-[0.64rem] uppercase tracking-[0.22em] text-adler-subtle">
              Paciente selecionado
            </span>
            <select
              value={selectedPatient.id}
              onChange={(event) => setSelectedPatientId(event.target.value)}
              className="mt-2 w-full rounded-[16px] border border-white/8 bg-[#090a0c] px-3 py-3 text-sm text-white outline-none focus:border-white/18"
            >
              {patients.map((patient) => (
                <option key={patient.id} value={patient.id}>
                  {patient.name} - {patient.focus}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <DocumentsPanel
        accent={accent}
        accentBorder={accentBorder}
        accentSurface={accentSurface}
        approachLabel={clinician.primaryApproachLabel}
        clinicalFrame="Documento gerado a partir do prontuario longitudinal, da formulacao clinica e dos dados registrados na sessao."
        patient={selectedPatient}
        riskLabel="Risco clinico em acompanhamento"
        riskScore={42}
        selectedSession={selectedPatient.defaultSession}
      />
    </div>
  );
}
