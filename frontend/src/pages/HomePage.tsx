import React, { useState, useMemo, useEffect, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LucideIcon, Activity, AlertTriangle, ArrowLeft, ArrowRight, Bell, Brain, BrainCircuit,
  Calendar, CalendarPlus, CheckCircle2, ClipboardCheck, CreditCard, Download,
  ExternalLink, FileText, Filter, Home, Info, Lock, LogOut, MessageCircle,
  Mic, Pill, Plus, Search, Settings, Shield, Sparkles, Square, TestTube2,
  TrendingUp, UserPlus, Users, X, ClipboardList, ChevronRight, MoreVertical,
  Star, Clock, MapPin, Video, Layout, ListChecks, Clipboard, List, ClipboardList as ClipboardListIcon
} from "lucide-react";
import { Page, WorkspaceTab, Status, Modal, Approach, Plan, Patient, Appointment } from "../types";
import { clinician, approach, avatarClass } from "../constants";



import { KpiCard } from "../components/layout/KpiCard";

export function HomePage({ appointments, onOpenPatient, patients, onAddPatient, isLoading = false }: { appointments: Appointment[], onOpenPatient: (id: string) => void, patients: Patient[], onAddPatient: () => void, isLoading?: boolean }) {
  const active = patients.filter((p) => p.status === "active").length;
  const alerts = patients.filter((p) => p.risk >= 60).length;
  const totalSessions = patients.reduce((s, p) => s + p.sessions, 0);
  if (isLoading) {
    return (
      <div className="p-8 space-y-8 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1,2,3].map(i => <div key={i} className="h-32 bg-gray-200 rounded-3xl" />)}
        </div>
        <div className="h-96 bg-gray-100 rounded-3xl" />
      </div>
    );
  }


  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          Bom dia, {clinician.name.split(" ")[0]}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Segunda, 20 de abril de 2026 · {approach.label} · {appointments.length} sessões hoje
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
            <button
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
              type="button"
            >
              Ver tudo
            </button>
          </div>
          <div className="divide-y divide-gray-50">
            {appointments.map((apt, i) => {
              const pt = patients.find((p) => p.id === apt.patientId) ?? patients[0];
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
                  <button
                    type="button"
                    onClick={() => onOpenPatient(pt.id)}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-gray-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-gray-700"
                  >
                    Iniciar <ArrowRight className="h-3 w-3" />
                  </button>
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

          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-5 py-4">
              <h2 className="text-[15px] font-semibold text-gray-900">Tarefas clínicas</h2>
            </div>
            <div className="space-y-1 p-3">
              {[
                "Revisar escala Y-BOCS de Sarah M.",
                "Checar litemia e TSH de Carlos M.",
                "Preparar ASRS-1 para Rafael N."
              ].map((task, i) => (
                <label key={task} className="flex cursor-pointer items-start gap-3 rounded-lg p-2.5 hover:bg-gray-50">
                  <input
                    type="checkbox"
                    defaultChecked={i === 0}
                    className="mt-0.5 h-4 w-4 rounded border-gray-300 accent-rose-500"
                  />
                  <span className="text-sm leading-5 text-gray-700">{task}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-rose-100 bg-white p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50">
                <MessageCircle className="h-5 w-5 text-rose-500" />
              </div>
              <div>
                <h2 className="text-[15px] font-semibold text-gray-900">WhatsApp & Retenção</h2>
                <p className="mt-1 text-xs leading-5 text-gray-500">
                  Módulo premium operacional para lembretes, confirmações e check-ins. Não substitui consulta.
                </p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {[
                ["4", "check-ins"],
                ["1", "cancelamento"],
                ["62%", "risco"]
              ].map(([value, label]) => (
                <div key={label} className="rounded-xl bg-gray-50 px-3 py-3 text-center">
                  <p className="font-mono text-lg font-bold text-gray-900">{value}</p>
                  <p className="text-[10px] uppercase tracking-wider text-gray-400">{label}</p>
                </div>
              ))}
            </div>
            <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-800">
              Sinal operacional: ansiedade alta em check-in e cancelamento recente sugerem follow-up humano.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
