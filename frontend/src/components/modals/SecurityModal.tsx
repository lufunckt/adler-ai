import { ModalFrame } from "./ModalFrame";

export function SecurityModal({ onClose }: { onClose: () => void }) {
  return (
    <ModalFrame onClose={onClose} title="Segurança & Privacidade">
      <div className="grid gap-4 md:grid-cols-2">
        {[
          ["Isolamento de dados", "Dados clínicos segregados por conta."],
          ["Criptografia", "Preparada para dados sensíveis em repouso."],
          ["IA sem treinamento", "Dados não usados para treinar modelos generativos."],
          ["Auditoria", "Eventos críticos podem ser registrados."]
        ].map(([title, text]) => (
          <div key={title} className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <p className="font-semibold text-gray-900">{title}</p>
            <p className="mt-1.5 text-sm leading-5 text-gray-500">{text}</p>
          </div>
        ))}
      </div>
    </ModalFrame>
  );
}
