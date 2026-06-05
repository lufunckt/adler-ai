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
import { exportPatients, avatarClass } from "../constants";




export function PatientsPage({ onAddPatient, onOpenPatient, patients, isLoading = false }: { onAddPatient: () => void, onOpenPatient: (id: string) => void, patients: Patient[], isLoading?: boolean }) {
  const [filter, setFilter] = useState<"all" | Status>("all");
  const filtered = filter === "all" ? patients : patients.filter((p) => p.status === filter);


  if (isLoading) {
    return (
      <div className="p-8 space-y-4 animate-pulse">
        {[1,2,3,4,5].map(i => <div key={i} className="h-20 bg-gray-100 rounded-2xl" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Pacientes</h1>
          <p className="mt-1 text-sm text-gray-500">Selecione um perfil para abrir o workspace clínico.</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => exportPatients(patients)}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <Download className="h-4 w-4" /> Exportar CSV
          </button>
          <button
            type="button"
            onClick={onAddPatient}
            className="inline-flex items-center gap-2 rounded-lg bg-rose-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-rose-600"
          >
            <Plus className="h-4 w-4" /> Adicionar paciente
          </button>
        </div>
      </div>

      <div className="flex gap-2">
        {(
          [
            ["all", "Todos"],
            ["active", "Ativos"],
            ["inactive", "Inativos"]
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setFilter(id as "all" | Status)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              filter === id ? "bg-gray-900 text-white" : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            {label}
          </button>
        ))}
        <button
          className="ml-auto inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-600"
          type="button"
        >
          <Filter className="h-4 w-4" /> Filtros
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Paciente</th>
              <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400 md:table-cell">
                Hipótese
              </th>
              <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400 lg:table-cell">
                Protocolo
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Progresso</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Risco</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Sessões</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map((p, i) => (
              <motion.tr
                key={p.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="transition hover:bg-gray-50/50"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${avatarClass(i)}`}>
                      {p.initials}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{p.name}</p>
                      <p className="text-xs text-gray-500">{p.lastSeen}</p>
                    </div>
                  </div>
                </td>
                <td className="hidden px-4 py-4 md:table-cell">
                  <p className="text-sm text-gray-700">{p.hypothesis}</p>
                </td>
                <td className="hidden px-4 py-4 lg:table-cell">
                  <p className="text-xs text-gray-500">{p.protocol}</p>
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-20 overflow-hidden rounded-full bg-gray-100">
                      <motion.div
                        className="h-full rounded-full bg-rose-400"
                        initial={{ width: 0 }}
                        animate={{ width: `${p.progress}%` }}
                        transition={{ duration: 0.8 }}
                      />
                    </div>
                    <span className="font-mono text-xs text-gray-600">{p.progress}%</span>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                      p.risk >= 60
                        ? "bg-red-50 text-red-600"
                        : p.risk >= 40
                          ? "bg-amber-50 text-amber-600"
                          : "bg-emerald-50 text-emerald-600"
                    }`}
                  >
                    {p.risk}%
                  </span>
                </td>
                <td className="px-4 py-4">
                  <span className="font-mono text-sm text-gray-600">{p.sessions}</span>
                </td>
                <td className="px-4 py-4">
                  <button
                    type="button"
                    onClick={() => onOpenPatient(p.id)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-gray-700"
                  >
                    Abrir <ArrowRight className="h-3 w-3" />
                  </button>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
