import { useState } from "react";
import { Patient } from "../../types";
import { ModalFrame } from "./ModalFrame";
import { Field } from "./Field";

export function ScheduleModal({
  onClose,
  onSubmit,
  patients
}: {
  onClose: () => void;
  onSubmit: (p: { kind: string; mode: string; name: string; note: string; time: string }) => void;
  patients: Patient[];
}) {
  const [name, setName] = useState(patients[0]?.name ?? "");
  const [time, setTime] = useState("09:00");
  const [kind, setKind] = useState("Sessão individual");
  const [mode, setMode] = useState("Presencial · Sala 1");
  const [note, setNote] = useState("");
  return (
    <ModalFrame onClose={onClose} title="Agendar paciente">
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim()) return;
          onSubmit({ kind, mode, name, note, time });
        }}
      >
        <Field label="Paciente" onChange={setName} placeholder="Digite ou selecione" value={name} />
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Horário" onChange={setTime} placeholder="09:00" value={time} />
          <Field label="Tipo" onChange={setKind} placeholder="Sessão individual" value={kind} />
        </div>
        <Field label="Modalidade" onChange={setMode} placeholder="Online ou presencial" value={mode} />
        <Field label="Observação" onChange={setNote} placeholder="Preparação clínica..." value={note} />
        <p className="rounded-xl bg-rose-50 p-3 text-sm text-rose-800">
          Se o nome não existir, o Adler cria automaticamente um perfil básico do paciente.
        </p>
        <button className="w-full rounded-xl bg-rose-500 py-3 text-sm font-semibold text-white hover:bg-rose-600" type="submit">
          Confirmar agenda
        </button>
      </form>
    </ModalFrame>
  );
}
