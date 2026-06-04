import { ModalFrame } from "./ModalFrame";

export function AboutModal({ onClose }: { onClose: () => void }) {
  return (
    <ModalFrame onClose={onClose} title="Adler AI">
      <p className="text-sm leading-6 text-gray-600">
        O Adler AI combina prontuário clínico, análise longitudinal, documentos, DSM e suporte de IA rastreável. Não substitui julgamento clínico: organiza dados, evidências e hipóteses.
      </p>
      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {["Abordagem multiparadigmática", "Análise longitudinal", "Documentos rastreáveis", "Privacidade por arquitetura"].map((item) => (
          <div key={item} className="rounded-xl border border-gray-100 bg-gray-50 p-4 text-sm text-gray-700">
            {item}
          </div>
        ))}
      </div>
    </ModalFrame>
  );
}
