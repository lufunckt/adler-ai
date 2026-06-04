import { motion } from "framer-motion";
import { Activity, AlertTriangle, Calendar, Users, ArrowRight, Trash2 } from "lucide-react";
import { Appointment, Patient } from "../types";
import { avatarClass } from "../utils";

interface KpiCardProps {
  label: string;
  value: string;
  delta: string;
  color: "rose" | "violet" | "sky" | "red" | "emerald";
  icon: any;
  spark: number[];
}

function KpiCard({ label, value, delta, color, icon: Icon, spark }: KpiCardProps) {
  const themes = {
    rose: { bg: "bg-rose-50", text: "text-rose-600", icon: "text-rose-500", spark: "#f43f5e" },
    violet: { bg: "bg-violet-50", text: "text-violet-600", icon: "text-violet-500", spark: "#8b5cf6" },
    sky: { bg: "bg-sky-50", text: "text-sky-600", icon: "text-sky-500", spark: "#0ea5e9" },
    red: { bg: "bg-red-50", text: "text-red-600", icon: "text-red-500", spark: "#ef4444" },
    emerald: { bg: "bg-emerald-50", text: "text-emerald-600", icon: "text-emerald-500", spark: "#10b981" }
  };
  const c = themes[color];

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${c.bg} ${c.icon}`}>
          <Icon className="h-5 w-5" />
        </div>
        <svg className="h-8 w-16" viewBox="0 0 64 32">
          <path
            d={`M 0 ${32 - spark[0] * 4} ${spark.map((v, i) => `L ${(i * 64) / (spark.length - 1)} ${32 - v * 4}`).join(" ")}`}
            fill="none"
            stroke={c.spark}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.7"
          />
        </svg>
      </div>
      <p className="mt-3 text-3xl font-bold tracking-tight text-gray-900">{value}</p>
      <p className="text-sm font-medium text-gray-600">{label}</p>
      <p className={`mt-1 text-xs ${c.text}`}>{delta}</p>
    </div>
  );
}

export function HomePage({
  appointments,
  onOpenPatient,
  onDeleteAppointment,
  patients,
  clinicianName,
  approachLabel
}: {
  appointments: Appointment[];
  onOpenPatient: (id: string) => void;
  onDeleteAppointment: (id: string) => void;
  patients: Patient[];
  clinicianName: string;
  approachLabel: string;
}) {
  const active = patients.filter((p) => p.status === "active").length;
  const alerts = patients.filter((p) => p.risk >= 60).length;
  const totalSessions = patients.reduce((s, p) => s + p.sessions, 0);

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          Bom dia, {clinicianName.split(" ")[0]}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Segunda, 20 de abril de 2026 · {approachLabel} · {appointments.length} sessões hoje
        </p>
      </motion.div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Sessões hoje"
          value={appointments.length.toString()}
          delta="+1 vs ontem"
          color="rose"
          icon={Calendar}
          spark={[3, 4, 3, 5, 4, appointments.length]}
        />
        <KpiCard
          label="Pacientes ativos"
          value={active.toString()}
          delta="Todos em acompanhamento"
          color="violet"
          icon={Users}
          spark={[3, 4, 4, 4, 5, active]}
        />
        <KpiCard
          label="Total de sessões"
          value={totalSessions.toString()}
          delta="Histórico completo"
          color="sky"
          icon={Activity}
          spark={[60, 65, 70, 75, 80, totalSessions]}
        />
        <KpiCard
          label="Alertas clínicos"
          value={alerts.toString()}
          delta={alerts > 0 ? "Requer atenção" : "Tudo estável"}
          color={alerts > 0 ? "red" : "emerald"}
          icon={AlertTriangle}
          spark={[1, 2, 1, 2, 1, alerts]}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(300px,1fr)]">
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
            <div>
              <h2 className="text-[15px] font-semibold text-gray-900">Agenda do dia</h2>
              <p className="text-xs text-gray-400">{appointments.length} sessões marcadas</p>
            </div>
          </div>
          <div className="divide-y divide-gray-50">
            {appointments.map((apt, i) => {
              const pt = patients.find((p) => p.id === apt.patientId);
              if (!pt) return null;
              return (
                <motion.div
                  key={apt.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.06 * i }}
                  className="flex items-center gap-4 px-6 py-4 transition hover:bg-gray-50/50"
                >
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${avatarClass(i)}`}>
                    {pt.initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-gray-900">{pt.name}</p>
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 font-mono text-xs text-gray-600">
                        {apt.time}
                      </span>
                      <span className="rounded-full bg-rose-50 px-2 py-0.5 text-xs text-rose-600">
                        {apt.mode.includes("Online") ? "Online" : "Presencial"}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-gray-500">{apt.kind}</p>
                    <p className="mt-1 text-xs text-gray-400">{apt.note}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => onDeleteAppointment(apt.id)}
                      className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onOpenPatient(pt.id)}
                      className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-gray-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-gray-700"
                    >
                      Iniciar <ArrowRight className="h-3 w-3" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-5 py-4">
              <h2 className="text-[15px] font-semibold text-gray-900">Atenção clínica</h2>
              <p className="text-xs text-gray-400">Pacientes com risco elevado</p>
            </div>
            <div className="divide-y divide-gray-50 px-2 py-2">
              {patients
                .filter((p) => p.risk >= 40)
                .slice(0, 3)
                .map((p, i) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => onOpenPatient(p.id)}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-gray-50"
                  >
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${avatarClass(i)}`}>
                      {p.initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-900">{p.name}</p>
                      <p className="mt-0.5 truncate text-xs text-gray-500">{p.hypothesis}</p>
                    </div>
                    <div className="text-right">
                      <p className={`font-mono text-sm font-semibold ${p.risk >= 60 ? "text-red-500" : "text-amber-500"}`}>
                        {p.risk}%
                      </p>
                      <p className="text-[10px] text-gray-400">risco</p>
                    </div>
                  </button>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
