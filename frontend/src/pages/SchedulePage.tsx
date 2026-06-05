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
import { avatarClass } from "../constants";




export function SchedulePage({ appointments, onOpenPatient, onSchedule, patients }: { appointments: Appointment[], onOpenPatient: (id: string) => void, onSchedule: () => void, patients: Patient[], isLoading?: boolean }) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Agenda clínica</h1>
          <p className="mt-1 text-sm text-gray-500">Agendar um paciente novo cria automaticamente um perfil básico.</p>
        </div>
        <button
          type="button"
          onClick={onSchedule}
          className="inline-flex items-center gap-2 rounded-lg bg-rose-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-rose-600"
        >
          <CalendarPlus className="h-4 w-4" /> Agendar paciente
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 bg-gray-50/50 px-6 py-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">Segunda, 20 de abril — Hoje</p>
        </div>
        <div className="divide-y divide-gray-50">
          {appointments.map((apt, i) => {
            const pt = patients.find((p) => p.id === apt.patientId) ?? patients[0];
            return (
              <motion.div
                key={apt.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="grid grid-cols-[80px_minmax(0,1fr)_auto] items-center gap-5 px-6 py-5 transition hover:bg-gray-50/50"
              >
                <p className="font-mono text-xl font-bold text-gray-900">{apt.time}</p>
                <div className="flex items-center gap-4">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${avatarClass(i)}`}>
                    {pt.initials}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{pt.name}</p>
                    <p className="text-sm text-gray-500">{apt.kind} · {apt.mode}</p>
                    <p className="mt-1 text-xs text-rose-500">{apt.note}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onOpenPatient(pt.id)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-700"
                >
                  Abrir <ArrowRight className="h-4 w-4" />
                </button>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
