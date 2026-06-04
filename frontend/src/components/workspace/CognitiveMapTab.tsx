import { BrainCircuit } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { Patient } from "../../types";
import { fetchAdlerClinicalMap, AdlerClinicalMapResponse } from "../../api/client";

export function CognitiveMapTab({ patient, session }: { patient: Patient; session: number }) {
  const [focused, setFocused] = useState<string | null>(null);
  const previewGraph = useMemo(
    () => buildPreviewMapGraph(loadPreviewAnalyses(patient.id), patient.focus),
    [patient.focus, patient.id]
  );
  const nodeLayout = [
    { x: 20, y: 32 },
    { x: 46, y: 24 },
    { x: 69, y: 44 },
    { x: 39, y: 67 },
    { x: 76, y: 72 }
  ];
  const baseNodes = [
    { id: "insomnia", label: "Insônia", critical: false },
    { id: "rituals", label: "Rituais compulsivos", critical: false },
    { id: "schema", label: "Privação emocional", critical: false },
    { id: "uncertainty", label: "Intolerância à incerteza", critical: false },
    { id: "relapse", label: "Risco de recaída", critical: true }
  ];
  const nodes = (previewGraph?.nodes ?? baseNodes).map((node, index) => ({
    ...node,
    ...nodeLayout[index % nodeLayout.length]
  }));
  const edges = (previewGraph?.edges ?? [
    ["insomnia", "rituals", 5],
    ["rituals", "uncertainty", 4],
    ["uncertainty", "schema", 3],
    ["schema", "relapse", 2],
    ["insomnia", "relapse", 2]
  ]) as Array<[string, string, number]>;
  const connected = (id: string) =>
    !focused || focused === id || edges.some(([a, b]) => (a === focused && b === id) || (b === focused && a === id));

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-7 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-rose-500">Mapa cognitivo longitudinal</p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-gray-900">Padrões de {session} sessões</h2>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            {previewGraph?.summary ?? `O grafo sintetiza recorrências clínicas do histórico de ${patient.name}.`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {previewGraph ? (
            <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-600">
              Sessao capturada nesta demo
            </span>
          ) : null}
          {focused ? (
            <button
              onClick={() => setFocused(null)}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
              type="button"
            >
              Limpar foco
            </button>
          ) : null}
        </div>
      </div>
      <div className="relative mt-6 h-[460px] overflow-hidden rounded-2xl border border-gray-100 bg-gradient-to-br from-gray-50 to-rose-50/30">
        <svg className="h-full w-full" preserveAspectRatio="none" viewBox="0 0 100 100">
          {edges.map(([from, to, weight]) => {
            const s = nodes.find((n) => n.id === from)!;
            const e = nodes.find((n) => n.id === to)!;
            const active = !focused || (connected(from) && connected(to));
            return (
              <path
                key={`${from}-${to}`}
                d={`M ${s.x} ${s.y} C ${(s.x + e.x) / 2} ${s.y - 18}, ${(s.x + e.x) / 2} ${e.y + 18}, ${e.x} ${e.y}`}
                fill="none"
                opacity={active ? 0.55 : 0.06}
                stroke={e.critical ? "#ef4444" : "#f43f5e"}
                strokeLinecap="round"
                strokeWidth={weight / 2.5}
              />
            );
          })}
        </svg>
        {nodes.map((node) => (
          <button
            key={node.id}
            onClick={() => setFocused(node.id)}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${node.x}%`, opacity: connected(node.id) ? 1 : 0.1, top: `${node.y}%` }}
            type="button"
          >
            <motion.span
              animate={{ scale: focused === node.id ? [1, 1.08, 1] : [1, 1.03, 1] }}
              transition={{ duration: focused === node.id ? 1.2 : 2.8, repeat: Infinity }}
              className={`block rounded-full border px-4 py-2.5 text-sm font-semibold shadow-sm ${
                node.critical ? "border-red-200 bg-red-50 text-red-700" : "border-rose-200 bg-white text-gray-900"
              }`}
            >
              {node.label}
            </motion.span>
          </button>
        ))}
      </div>
    </div>
  );
}
