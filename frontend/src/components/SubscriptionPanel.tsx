import { motion } from "framer-motion";
import { CheckCircle2, CreditCard, ShieldCheck, Sparkles } from "lucide-react";
import type { ClinicianProfile } from "../data/clinicianData";

type SubscriptionPanelProps = {
  accent: string;
  accentBorder: string;
  accentSurface: string;
  clinician: ClinicianProfile;
};

const PLANS = [
  {
    badge: "Padrao",
    name: "Adler Padrao",
    price: "R$ 0",
    tier: "standard",
    summary: "Uma abordagem terapeutica escolhida no cadastro, pacientes demo e base local.",
    features: [
      "Dashboard do clinico",
      "Mapa cognitivo e linha do tempo na abordagem cadastrada",
      "Documentos em PDF na demo"
    ]
  },
  {
    badge: "Premium",
    name: "Adler Premium",
    price: "R$ --",
    tier: "premium",
    summary: "Todas as abordagens, alternancia de lentes clinicas e ciencia curada.",
    features: [
      "Acesso a Psiquiatria, TCC, Esquema, Psicanalise, Casal, Generalista e Sistemica",
      "Transcricao com backend",
      "Busca medicamentosa validada"
    ]
  },
  {
    badge: "Clinic",
    name: "Adler Clinic",
    price: "Sob consulta",
    tier: "clinic",
    summary: "Equipe multi-profissional, permissoes, auditoria e LGPD avancada.",
    features: [
      "Multi-tenant por clinica",
      "Trilha de auditoria",
      "Gestao de equipe"
    ]
  }
];

export function SubscriptionPanel({
  accent,
  accentBorder,
  accentSurface,
  clinician
}: SubscriptionPanelProps) {
  return (
    <div className="space-y-5">
      <section
        className="rounded-[30px] border p-6 shadow-panel md:p-7"
        style={{ borderColor: accentBorder, boxShadow: `0 0 28px ${accentSurface}` }}
      >
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div>
            <p className="font-mono text-[0.68rem] uppercase tracking-[0.34em] text-adler-subtle">
              Assinatura Adler
            </p>
            <h2 className="mt-3 text-[1.9rem] font-semibold tracking-[-0.05em] text-white md:text-[2.2rem]">
              Plano do {clinician.name}
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-adler-muted">
              Esta pagina prepara o SaaS para cobranca sem misturar assinatura com
              dados de paciente. A demo fica em modo Starter enquanto o backend de
              pagamentos nao estiver conectado.
            </p>
          </div>

          <div className="rounded-[24px] border border-white/8 bg-black/12 p-4">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-4 w-4" style={{ color: accent }} />
              <p className="text-sm font-semibold text-white">Compliance primeiro</p>
            </div>
            <p className="mt-3 text-sm leading-6 text-adler-muted">
              Assinatura, permissoes e dados clinicos devem ficar separados por
              tenant para evitar vazamento operacional.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        {PLANS.map((plan, index) => {
          const isCurrent =
            (clinician.subscriptionTier === "standard" && plan.tier === "standard") ||
            (clinician.subscriptionTier === "premium" && plan.tier === "premium");
          return (
            <motion.article
              key={plan.name}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, duration: 0.2 }}
              className="rounded-[28px] border bg-adler-panel/82 p-5 shadow-panel"
              style={{
                borderColor: isCurrent ? accentBorder : "rgba(255,255,255,0.08)",
                boxShadow: isCurrent ? `0 0 24px ${accentSurface}` : undefined
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div
                  className="flex h-11 w-11 items-center justify-center rounded-[16px] border"
                  style={{
                    borderColor: isCurrent ? accentBorder : "rgba(255,255,255,0.08)",
                    backgroundColor: isCurrent ? accentSurface : "rgba(255,255,255,0.03)",
                    color: isCurrent ? accent : "#cbd3e2"
                  }}
                >
                  {isCurrent ? <CheckCircle2 className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
                </div>
                <span className="rounded-full border border-white/8 bg-white/[0.04] px-3 py-1.5 font-mono text-[0.65rem] uppercase tracking-[0.2em] text-white/64">
                  {plan.badge}
                </span>
              </div>
              <h3 className="mt-5 text-lg font-semibold text-white">{plan.name}</h3>
              <p className="mt-2 font-mono text-2xl font-semibold" style={{ color: accent }}>
                {plan.price}
              </p>
              <p className="mt-3 text-sm leading-6 text-adler-muted">{plan.summary}</p>
              <div className="mt-5 space-y-2">
                {plan.features.map((feature) => (
                  <p
                    key={feature}
                    className="flex items-center gap-2 rounded-[14px] border border-white/8 bg-white/[0.03] px-3 py-2 text-sm text-white/78"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" style={{ color: accent }} />
                    {feature}
                  </p>
                ))}
              </div>
              <button
                type="button"
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full border px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/8"
                style={{
                  borderColor: isCurrent ? accentBorder : "rgba(255,255,255,0.08)",
                  backgroundColor: isCurrent ? accentSurface : "rgba(255,255,255,0.03)"
                }}
              >
                <CreditCard className="h-4 w-4" />
                {isCurrent ? "Plano atual" : "Preparar checkout"}
              </button>
            </motion.article>
          );
        })}
      </section>
    </div>
  );
}
