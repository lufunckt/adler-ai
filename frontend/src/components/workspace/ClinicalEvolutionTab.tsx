import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, AlertTriangle, CheckCircle2, Info, MessageCircle, Activity, Shield, Sparkles, Send } from "lucide-react";
import { useEffect, useState } from "react";
import {
  fetchAdlerEvolutionDecision,
  fetchAdlerAbandonmentRisk,
  fetchAdlerWhatsAppDashboard,
  createAdlerWhatsAppCheckin,
  type AdlerEvolutionDecisionResponse,
  type AdlerAbandonmentRiskResponse,
  type AdlerWhatsAppDashboardResponse
} from "../../api/client";
import { Patient } from "../../types";
import { loadPreviewAnalyses, loadPreviewCheckins, savePreviewCheckin } from "../../lib/previewSessionStore";

export function ClinicalEvolutionTab({
  patient,
  session,
  setSession
}: {
  patient: Patient;
  session: number;
  setSession: (v: number) => void;
}) {
  const [evolution, setEvolution] = useState<AdlerEvolutionDecisionResponse | null>(null);
  const [abandonmentRisk, setAbandonmentRisk] = useState<AdlerAbandonmentRiskResponse | null>(null);
  const [whatsappDashboard, setWhatsappDashboard] = useState<AdlerWhatsAppDashboardResponse | null>(null);
  const [intelligenceStatus, setIntelligenceStatus] = useState<"demo" | "loading" | "online">("loading");
  const [checkinState, setCheckinState] = useState<"idle" | "saving" | "saved" | "demo">("idle");
  const [previewCheckins, setPreviewCheckins] = useState(() => loadPreviewCheckins(patient.id));
  const previewAnalyses = useMemo(() => loadPreviewAnalyses(patient.id), [patient.id]);
  const previewEvolution = useMemo(
    () => buildPreviewEvolution(previewAnalyses),
    [previewAnalyses]
  );
  const previewRisk = useMemo(
    () => buildPreviewRisk(previewAnalyses, patient.risk),
    [patient.risk, previewAnalyses]
  );
  const previewTimelinePoints = useMemo(
    () => buildPreviewTimelinePoints(previewAnalyses),
    [previewAnalyses]
  );

  const defaultPoints = Array.from({ length: 18 }, (_, i) => ({
    anxiety: 82 - i * 3.2 + (i % 3) * 2,
    mood: 44 + i * 2.4 + (i % 4) * 2,
    adherence: 84 + (i % 2) * 3,
    session: i + 1,
    x: 5 + i * 5.2
  }));
  const points = previewTimelinePoints.length ? previewTimelinePoints : defaultPoints;
  const line = (key: "adherence" | "anxiety" | "mood") => points.map((p) => `${p.x},${100 - p[key]}`).join(" ");

  useEffect(() => {
    setPreviewCheckins(loadPreviewCheckins(patient.id));
  }, [patient.id]);

  useEffect(() => {
    let cancelled = false;

    async function loadLongitudinalSignals() {
      setIntelligenceStatus("loading");
      const [evolutionResult, riskResult, whatsappResult] = await Promise.allSettled([
        fetchAdlerEvolutionDecision(patient.id),
        fetchAdlerAbandonmentRisk(patient.id),
        fetchAdlerWhatsAppDashboard(patient.id)
      ]);

      if (cancelled) return;

      if (evolutionResult.status === "fulfilled") setEvolution(evolutionResult.value);
      if (riskResult.status === "fulfilled") setAbandonmentRisk(riskResult.value);
      if (whatsappResult.status === "fulfilled") setWhatsappDashboard(whatsappResult.value);

      const hasLiveData =
        evolutionResult.status === "fulfilled" ||
        riskResult.status === "fulfilled" ||
        whatsappResult.status === "fulfilled";
      setIntelligenceStatus(hasLiveData ? "online" : "demo");
    }

    loadLongitudinalSignals();
    return () => {
      cancelled = true;
    };
  }, [patient.id]);

  const fallbackEvolution: AdlerEvolutionDecisionResponse = {
    patient_id: patient.id,
    status_geral: session <= 6 ? "atencao" : "melhorando",
    principais_mudancas: [
      `${session} sessoes sintetizadas em padroes longitudinais.`,
      "Rituais e ansiedade mostram reducao gradual quando adesao e sono melhoram."
    ],
    padroes_persistentes: ["intolerancia a incerteza", "hiper-responsabilidade", "checagem noturna"],
    novos_riscos: session <= 6 ? ["piora de sono", "risco de evasao se nao houver follow-up"] : [],
    tendencias: [
      "Ansiedade cai de forma consistente nas ultimas sessoes.",
      "Aderencia medicamentosa permanece estavel no topo da curva."
    ],
    sessions_compared: Array.from({ length: session }, (_, index) => index + 1),
    snapshot_id: null
  };

  const fallbackRisk: AdlerAbandonmentRiskResponse = {
    patient_id: patient.id,
    risco_abandono: session <= 6 ? "alto" : patient.risk >= 60 ? "moderado" : "baixo",
    score: session <= 6 ? 72 : patient.risk,
    fatores_identificados:
      session <= 6
        ? ["recorte historico com maior sofrimento", "baixa resposta percebida", "necessidade de contato ativo"]
        : ["check-ins recentes sem sinal critico", "boa continuidade de sessoes"],
    sugestoes_acao:
      session <= 6
        ? ["antecipar retorno", "reforcar vinculo", "revisar plano terapeutico"]
        : ["manter check-in leve com consentimento"],
    risk_score_id: null
  };

  const evolutionView = evolution ?? previewEvolution ?? fallbackEvolution;
  const riskView = abandonmentRisk ?? previewRisk ?? fallbackRisk;
  const whatsappStats = {
    checkins:
      whatsappDashboard?.checkins.length ??
      (previewCheckins.length > 0 ? previewCheckins.length : 4),
    confirmations: whatsappDashboard?.confirmations.length ?? 3,
    flags: whatsappDashboard?.engagement_flags.length ?? (riskView.risco_abandono === "alto" ? 2 : 1)
  };
  const riskColor =
    riskView.risco_abandono === "alto"
      ? "border-red-200 bg-red-50 text-red-700"
      : riskView.risco_abandono === "moderado"
      ? "border-amber-200 bg-amber-50 text-amber-700"
      : "border-emerald-200 bg-emerald-50 text-emerald-700";
  const statusLabel =
    intelligenceStatus === "online"
      ? "API conectada"
      : previewAnalyses.length > 0 || previewCheckins.length > 0
        ? "demo com dados salvos"
        : intelligenceStatus === "loading"
          ? "carregando"
          : "modo demo";

  const handleDemoCheckin = async () => {
    setCheckinState("saving");
    const previewCheckinRecord = {
      patient_id: patient.id,
      mood: 4,
      anxiety: 8,
      sleep: 5,
      adherence: 5,
      notes: "Check-in operacional demo: ansiedade elevada antes da proxima sessao.",
      saved_at: new Date().toISOString(),
      source: "api" as const
    };
    try {
      await createAdlerWhatsAppCheckin(previewCheckinRecord);
      savePreviewCheckin(previewCheckinRecord);
      const [riskResult, whatsappResult] = await Promise.allSettled([
        fetchAdlerAbandonmentRisk(patient.id),
        fetchAdlerWhatsAppDashboard(patient.id)
      ]);
      if (riskResult.status === "fulfilled") setAbandonmentRisk(riskResult.value);
      if (whatsappResult.status === "fulfilled") setWhatsappDashboard(whatsappResult.value);
      setPreviewCheckins(loadPreviewCheckins(patient.id));
      setIntelligenceStatus("online");
      setCheckinState("saved");
    } catch {
      savePreviewCheckin({ ...previewCheckinRecord, source: "browser" });
      setPreviewCheckins(loadPreviewCheckins(patient.id));
      setCheckinState("saved");
    }
  };

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-gray-200 bg-white p-7 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-rose-500">Evolucao temporal</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-gray-900">Sessao {session} de {patient.name}</h2>
          </div>
          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-500">{statusLabel}</span>
        </div>
        <div className="mt-5 flex gap-4 text-xs">
          {[
            ["Ansiedade", "#ef4444"],
            ["Humor", "#f43f5e"],
            ["Aderencia", "#10b981"]
          ].map(([label, color]) => (
            <div key={label} className="flex items-center gap-1.5">
              <span className="h-2 w-5 rounded-full" style={{ background: color }} />
              {label}
            </div>
          ))}
        </div>
        <div className="mt-4 rounded-xl border border-gray-100 bg-gray-50 p-4">
          <svg className="h-[280px] w-full" preserveAspectRatio="none" viewBox="0 0 100 100">
            <polyline fill="none" opacity="0.6" points={line("anxiety")} stroke="#ef4444" strokeWidth="0.8" />
            <polyline fill="none" opacity="0.9" points={line("mood")} stroke="#f43f5e" strokeWidth="0.9" />
            <polyline fill="none" opacity="0.7" points={line("adherence")} stroke="#10b981" strokeWidth="0.8" />
            {previewTimelinePoints.map((point) => (
              <g key={point.session}>
                <circle cx={point.x} cy={100 - point.anxiety} fill="#ef4444" r="1.2" />
                <circle cx={point.x} cy={100 - point.mood} fill="#f43f5e" r="1.2" />
                <circle cx={point.x} cy={100 - point.adherence} fill="#10b981" r="1.2" />
              </g>
            ))}
          </svg>
        </div>
        <div className="mt-5">
          <div className="mb-2 flex justify-between text-xs text-gray-500">
            <span>Sessao 1</span>
            <span className="font-semibold text-gray-900">Sessao {session}</span>
            <span>Sessao 18</span>
          </div>
          <input
            className="w-full accent-rose-500"
            max={18}
            min={1}
            onChange={(e) => setSession(Number(e.target.value))}
            type="range"
            value={session}
          />
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(280px,0.75fr)]">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">Evolucao clinica estruturada</p>
              <h3 className="mt-2 text-xl font-bold text-gray-900">
                Status geral: <span className="text-rose-600">{evolutionView.status_geral}</span>
              </h3>
              <p className="mt-2 text-sm leading-6 text-gray-500">
                Comparacao longitudinal baseada em analises JSON por sessao, nao em texto livre.
              </p>
            </div>
            <TrendingUp className="h-5 w-5 text-rose-500" />
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <ClinicalSignalList title="Principais mudancas" items={evolutionView.principais_mudancas} />
            <ClinicalSignalList title="Padroes persistentes" items={evolutionView.padroes_persistentes} />
            <ClinicalSignalList title="Novos riscos" items={evolutionView.novos_riscos.length ? evolutionView.novos_riscos : ["sem novo risco critico"]} />
            <ClinicalSignalList title="Tendencias" items={evolutionView.tendencias} />
          </div>
          {previewAnalyses.length ? (
            <div className="mt-5 rounded-xl border border-rose-100 bg-rose-50/70 p-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-rose-500">
                Sessoes analisadas nesta demo
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {previewAnalyses.slice(-5).map((record) => (
                  <span
                    key={`${record.payload.patient_id}-${record.payload.session_number}`}
                    className="rounded-full border border-rose-200 bg-white px-3 py-1 text-xs font-semibold text-rose-700"
                  >
                    Sessao {record.payload.session_number} · {record.payload.sintomas.length + record.payload.emocoes.length} sinais
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <div className="space-y-5">
          <div className={`rounded-2xl border p-6 shadow-sm ${riskColor}`}>
            <p className="text-xs font-semibold uppercase tracking-widest opacity-70">Risco de abandono</p>
            <div className="mt-3 flex items-end justify-between">
              <span className="font-mono text-4xl font-bold">{riskView.score}%</span>
              <span className="rounded-full bg-white/70 px-2.5 py-1 text-xs font-semibold">{riskView.risco_abandono}</span>
            </div>
            <ProgressBarWs color={riskView.score >= 70 ? "#ef4444" : riskView.score >= 40 ? "#f59e0b" : "#10b981"} label="Retencao" value={riskView.score} />
            <div className="mt-4 space-y-2">
              {riskView.sugestoes_acao.slice(0, 2).map((suggestion) => (
                <p key={suggestion} className="rounded-xl bg-white/70 px-3 py-2 text-xs leading-5">{suggestion}</p>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50">
                <MessageCircle className="h-5 w-5 text-rose-500" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">WhatsApp Premium</p>
                <p className="text-xs text-gray-500">operacional, sem aconselhamento clinico</p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {[
                [whatsappStats.checkins, "check-ins"],
                [whatsappStats.confirmations, "confirm."],
                [whatsappStats.flags, "flags"]
              ].map(([value, label]) => (
                <div key={String(label)} className="rounded-xl bg-gray-50 p-3 text-center">
                  <p className="font-mono text-lg font-bold text-gray-900">{value}</p>
                  <p className="text-[10px] uppercase tracking-wider text-gray-400">{label}</p>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs leading-5 text-gray-500">
              Lembretes, confirmacoes e check-ins alimentam a timeline e o score de abandono.
            </p>
            <button
              type="button"
              onClick={handleDemoCheckin}
              disabled={checkinState === "saving"}
              className="mt-4 w-full rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {checkinState === "saving"
                ? "Registrando check-in..."
                : checkinState === "saved"
                ? "Check-in registrado"
                : checkinState === "demo"
                ? "Demo sem backend"
                : "Registrar check-in demo"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ClinicalSignalList({ items, title }: { items: string[]; title: string }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">{title}</p>
      <div className="mt-3 space-y-2">
        {items.slice(0, 4).map((item) => (
          <p key={item} className="text-sm leading-5 text-gray-700">
            {item}
          </p>
        ))}
      </div>
    </div>
  );
}
