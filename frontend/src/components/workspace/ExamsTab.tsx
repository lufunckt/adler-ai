import { TestTube2 } from "lucide-react";

export function ExamsTab() {
  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-gray-200 bg-white p-7 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-widest text-rose-500">Premium · exames clínicos</p>
        <h2 className="mt-2 text-2xl font-bold tracking-tight text-gray-900">Monitoramento laboratorial</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
          Aba dedicada para pacientes em uso de medicações que exigem exames, como lítio, valproato, carbamazepina e antipsicóticos.
        </p>
      </div>
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        {[
          ["Litemia 12h", "1-2 semanas até estabilizar; depois trimestral", "Faixa terapêutica estreita e risco de toxicidade neurológica."],
          ["Creatinina e ureia", "Baseline e trimestral", "Monitoramento de função renal em uso de lítio."],
          ["TSH e T4 livre", "Baseline e semestral", "Risco de hipotireoidismo associado ao lítio."],
          ["Glicemia e perfil lipídico", "Baseline e semestral", "Rastreamento metabólico em antipsicóticos atípicos."]
        ].map(([exam, frequency, note]) => (
          <div key={exam} className="border-b border-gray-50 px-6 py-4 last:border-b-0">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-semibold text-gray-900">{exam}</p>
                <p className="mt-1 text-sm text-gray-500">{frequency}</p>
                <p className="mt-2 text-sm text-rose-600">{note}</p>
              </div>
              <span className="rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-600">Premium</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
