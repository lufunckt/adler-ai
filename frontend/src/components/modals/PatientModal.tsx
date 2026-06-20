import { useState } from "react";
import { ModalFrame } from "./ModalFrame";
import { Field } from "./Field";

export function PatientModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (p: { focus: string; name: string }) => void }) {
  const [name, setName] = useState("");
  const [focus, setFocus] = useState("");
  return (
    <ModalFrame onClose={onClose} title="Adicionar paciente">
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim()) return;
          onSubmit({ focus, name });
        }}
      >
        <Field label="Nome" onChange={setName} placeholder="Ex: Mariana A." value={name} />
        <Field label="Foco inicial" onChange={setFocus} placeholder="Ex: ansiedade, sono, rituais..." value={focus} />
        <button className="w-full rounded-xl bg-rose-500 py-3 text-sm font-semibold text-white hover:bg-rose-600" type="submit">
          Criar perfil
        </button>
      </form>
    </ModalFrame>
  );
}
