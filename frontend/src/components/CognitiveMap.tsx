import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import type { ClinicalApproach } from "../context/AdlerShellContext";
import {
  EDGE_LINE,
  EDGES,
  MAP_HEIGHT,
  MAP_WIDTH,
  NODES,
  type ResolvedMapNode,
  resolveEdgeStrength,
  resolveMapNode
} from "../data/cognitiveMapData";

type CognitiveMapProps = {
  accent: string;
  accentBorder: string;
  accentSurface: string;
  approach: ClinicalApproach;
  session: number;
};

export function CognitiveMap({
  accent,
  accentBorder,
  accentSurface,
  approach,
  session
}: CognitiveMapProps) {
  const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null);

  const nodes = useMemo(
    () => NODES.map((node) => resolveMapNode(node, approach, session)),
    [approach, session]
  );
  const nodeMap = useMemo(
    () => new Map(nodes.map((node) => [node.id, node])),
    [nodes]
  );
  const visibleNodeIds = useMemo(() => {
    if (!focusedNodeId) {
      return new Set(nodes.map((node) => node.id));
    }

    const nextIds = new Set<string>([focusedNodeId]);
    EDGES.forEach((edge) => {
      if (edge.source === focusedNodeId) {
        nextIds.add(edge.target);
      }

      if (edge.target === focusedNodeId) {
        nextIds.add(edge.source);
      }
    });

    return nextIds;
  }, [focusedNodeId, nodes]);
  const visibleEdgeIds = useMemo(() => {
    if (!focusedNodeId) {
      return new Set(EDGES.map((edge) => edge.id));
    }

    return new Set(
      EDGES.filter(
        (edge) => edge.source === focusedNodeId || edge.target === focusedNodeId
      ).map((edge) => edge.id)
    );
  }, [focusedNodeId]);
  const focusedNode = focusedNodeId ? nodeMap.get(focusedNodeId) ?? null : null;
  const tooltipStyle = focusedNode
    ? createTooltipStyle(focusedNode)
    : undefined;

  return (
    <div className="relative h-full min-h-[480px]" onClick={() => setFocusedNodeId(null)}>
      <svg
        className="h-full w-full"
        viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="edgeGradient" x1="0%" x2="100%" y1="0%" y2="100%">
            <stop offset="0%" stopColor={accent} stopOpacity="0.18" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.45" />
          </linearGradient>
        </defs>

        <g>
          {EDGES.map((edge) => {
            const source = nodeMap.get(edge.source);
            const target = nodeMap.get(edge.target);

            if (!source || !target) {
              return null;
            }

            const isVisible = visibleEdgeIds.has(edge.id);
            const isFocused = focusedNodeId
              ? edge.source === focusedNodeId || edge.target === focusedNodeId
              : false;
            const resolvedStrength = resolveEdgeStrength(edge, source, target);

            return (
              <motion.path
                key={edge.id}
                initial={false}
                animate={{
                  d: EDGE_LINE(source, target, edge.curvature),
                  opacity: focusedNodeId ? (isVisible ? 0.92 : 0.1) : 0.68,
                  strokeWidth: 1.1 + resolvedStrength * 5.4
                }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                fill="none"
                stroke={isFocused ? accent : "url(#edgeGradient)"}
                strokeLinecap="round"
                style={{
                  filter: isFocused
                    ? `drop-shadow(0 0 12px ${accentSurface})`
                    : "none"
                }}
              />
            );
          })}
        </g>

        {nodes.map((node, index) => {
          const isFocused = node.id === focusedNodeId;
          const isVisible = visibleNodeIds.has(node.id);
          const isCritical = node.severity === "critical";
          const fill = isCritical ? "#ef4444" : accent;
          const glow = isCritical
            ? "drop-shadow(0 0 16px rgba(239,68,68,0.88)) drop-shadow(0 0 34px rgba(239,68,68,0.5))"
            : `drop-shadow(0 0 12px ${accentSurface})`;
          const labelLines = splitLabel(node.label);

          return (
            <motion.g
              key={node.id}
              layout
              initial={false}
              animate={{
                x: node.x,
                y: node.y,
                opacity: focusedNodeId ? (isVisible ? 1 : 0.1) : 1,
                scale: isFocused ? 1.06 : 1
              }}
              transition={{
                type: "spring",
                stiffness: 180,
                damping: 20,
                mass: 0.85
              }}
              onClick={(event) => {
                event.stopPropagation();
                setFocusedNodeId((current) => (current === node.id ? null : node.id));
              }}
              className="cursor-pointer"
            >
              <motion.circle
                cx={0}
                cy={0}
                r={node.radius + 10}
                fill={fill}
                opacity={isFocused ? 0.26 : 0.14}
                animate={{
                  r: [node.radius + 8, node.radius + 12, node.radius + 8],
                  opacity: isCritical ? [0.26, 0.44, 0.26] : [0.12, 0.24, 0.12]
                }}
                transition={{
                  duration: 3.1 + index * 0.22,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                style={{ filter: glow }}
              />
              <motion.circle
                cx={0}
                cy={0}
                r={node.radius}
                fill={fill}
                stroke={isCritical ? "rgba(255,255,255,0.86)" : "rgba(255,255,255,0.72)"}
                strokeWidth={isFocused ? 2.4 : 1.8}
                animate={{ r: [node.radius, node.radius + 1.8, node.radius] }}
                transition={{
                  duration: 2.9 + index * 0.2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                style={{ filter: glow }}
              />
              <circle cx={0} cy={0} fill="#ffffff" opacity={0.95} r={3.4} />

              <motion.text
                fill="#ffffff"
                fontFamily="monospace"
                fontSize="10"
                fontWeight="700"
                initial={false}
                textAnchor="middle"
                y={5}
              >
                {node.longitudinalSignal}
              </motion.text>

              <motion.text
                fill={fill}
                fontFamily="monospace"
                fontSize="10"
                fontWeight="700"
                initial={false}
                textAnchor="middle"
                y={-node.radius - 16}
              >
                {translateNodeType(node.type)}
              </motion.text>

              <motion.text
                fill="#f7f9ff"
                fontSize="12.5"
                fontWeight="600"
                initial={false}
                textAnchor="middle"
                y={node.radius + 24}
              >
                {labelLines.map((line, lineIndex) => (
                  <tspan key={`${node.id}-${line}`} dy={lineIndex === 0 ? 0 : 14} x={0}>
                    {line}
                  </tspan>
                ))}
              </motion.text>
            </motion.g>
          );
        })}
      </svg>

      <AnimatePresence>
        {focusedNode && tooltipStyle ? (
          <motion.div
            key={focusedNode.id}
            layout
            initial={{ opacity: 0, scale: 0.94, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 8 }}
            transition={{ duration: 0.18 }}
            className="pointer-events-none absolute z-20 max-w-[260px] rounded-2xl border bg-[#12151b]/95 px-4 py-3 shadow-panel backdrop-blur-md"
            style={{
              ...tooltipStyle,
              borderColor: focusedNode.severity === "critical" ? "rgba(239,68,68,0.38)" : accentBorder,
              boxShadow:
                focusedNode.severity === "critical"
                  ? "0 0 28px rgba(239,68,68,0.28)"
                  : `0 0 28px ${accentSurface}`
            }}
          >
            <p className="font-mono text-[0.64rem] uppercase tracking-[0.3em] text-adler-subtle">
              Correlacao Sherlock
            </p>
            <p className="mt-2 text-sm font-semibold tracking-[-0.02em] text-white">
              {focusedNode.label}
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <MetricChip
                label="Padrao 18 sessoes"
                value={String(focusedNode.longitudinalSignal)}
              />
              <MetricChip label={`Sessao ${session}`} value={String(focusedNode.sessionSignal)} />
            </div>
            <p className="mt-2 font-mono text-[0.82rem] leading-6 text-white/82">
              {focusedNode.note}
            </p>
            <p className="mt-2 text-xs text-adler-muted">
              Tendencia longitudinal{" "}
              <span className="font-mono text-white/78">
                {focusedNode.trendDelta > 0 ? "+" : ""}
                {focusedNode.trendDelta}
              </span>{" "}
              desde a primeira sessao.
            </p>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function splitLabel(label: string) {
  const words = label.split(" ");
  const lines: string[] = [];
  let current = "";

  words.forEach((word) => {
    const candidate = current ? `${current} ${word}` : word;

    if (candidate.length > 18 && current) {
      lines.push(current);
      current = word;
      return;
    }

    current = candidate;
  });

  if (current) {
    lines.push(current);
  }

  return lines.slice(0, 2);
}

function createTooltipStyle(node: ResolvedMapNode) {
  const horizontalOffset = node.x > MAP_WIDTH * 0.7 ? "-108%" : "22px";

  return {
    left: `${(node.x / MAP_WIDTH) * 100}%`,
    top: `${(node.y / MAP_HEIGHT) * 100}%`,
    transform: `translate(${horizontalOffset}, -56%)`
  };
}

function translateNodeType(type: ResolvedMapNode["type"]) {
  if (type === "symptom") {
    return "SINTOMA";
  }

  if (type === "medication") {
    return "FARMACO";
  }

  return "RISCO";
}

function MetricChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2">
      <p className="text-[0.58rem] uppercase tracking-[0.24em] text-adler-subtle">
        {label}
      </p>
      <p className="mt-1 font-mono text-sm text-white/86">{value}</p>
    </div>
  );
}
