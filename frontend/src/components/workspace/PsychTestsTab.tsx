import { ClipboardCheck } from "lucide-react";
import { Patient } from "../../types";

export function PsychTestsTab({ patient }: { patient: Patient }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-7 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-widest text-violet-500">Testes psicológicos</p>
      <h2 className="mt-2 text-2xl font-bold tracking-tight text-gray-900">Instrumentos sugeridos para {patient.name}</h2>
      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          ["Y-BOCS", "Sintomas obsessivo-compulsivos", 72],
          ["GAD-7", "Ansiedade", 58],
          ["ISI", "Insônia", 66],
          ["ASRS-1", "Rastreio de TDAH adulto", 22]
        ].map(([name, desc, value]) => (
          <div key={String(name)} className="rounded-xl border border-gray-100 bg-gray-50 p-5">
            <p className="font-bold text-gray-900">{name}</p>
            <p className="mt-1 text-xs text-gray-500">{desc}</p>
            <ProgressBarWs color="#8b5cf6" label="Prioridade" value={Number(value)} />
          </div>
        ))}
      </div>
    </div>
  );
}
