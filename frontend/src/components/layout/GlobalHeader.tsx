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
import { Page, WorkspaceTab, Status, Modal, Approach, Plan, Patient, Appointment } from "../../types";
import { avatarClass } from "../../constants";


export function GlobalHeader({
  onOpenAddPatient,
  onOpenInfo,
  onOpenPatient,
  onOpenSchedule,
  onOpenSecurity,
  patients,
  search,
  setSearch
}: {
  onOpenAddPatient: () => void;
  onOpenInfo: () => void;
  onOpenPatient: (id: string) => void;
  onOpenSchedule: () => void;
  onOpenSecurity: () => void;
  patients: Patient[];
  search: string;
  setSearch: (v: string) => void;
}) {
  const results = patients.filter((p) =>
    `${p.name} ${p.focus} ${p.hypothesis}`.toLowerCase().includes(search.toLowerCase())
  );
  return (
    <header className="relative z-30 flex h-16 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-6">
      <div className="relative w-full max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar paciente, diagnóstico..."
          className="h-9 w-full rounded-lg border border-gray-200 bg-gray-50 pl-9 pr-4 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-rose-300 focus:bg-white focus:ring-2 focus:ring-rose-100"
        />
        {search.length > 1 ? (
          <div className="absolute left-0 right-0 top-11 overflow-hidden rounded-xl border border-gray-200 bg-white p-1.5 shadow-xl">
            {results.slice(0, 5).map((p, i) => (
              <button
                key={p.id}
                type="button"
                onClick={() => onOpenPatient(p.id)}
                className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left hover:bg-rose-50"
              >
                <span className="flex items-center gap-3">
                  <span className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold ${avatarClass(i)}`}>
                    {p.initials}
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-gray-900">{p.name}</span>
                    <span className="text-xs text-gray-500">{p.focus}</span>
                  </span>
                </span>
                <ArrowRight className="h-3.5 w-3.5 text-rose-400" />
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div className="ml-4 flex items-center gap-2">
        <button
          aria-label="Info"
          onClick={onOpenInfo}
          className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
          type="button"
        >
          <Info className="h-4 w-4" />
        </button>
        <button
          aria-label="Segurança"
          onClick={onOpenSecurity}
          className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
          type="button"
        >
          <Shield className="h-4 w-4" />
        </button>
        <button
          aria-label="Notificações"
          className="relative rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
          type="button"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-rose-500" />
        </button>
        <div className="mx-2 h-5 w-px bg-gray-200" />
        <button
          type="button"
          onClick={onOpenAddPatient}
          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-700 transition hover:border-rose-300 hover:text-rose-600"
        >
          <UserPlus className="h-3.5 w-3.5" /> Novo paciente
        </button>
        <button
          type="button"
          onClick={onOpenSchedule}
          className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-rose-500 px-3 text-xs font-semibold text-white shadow-sm transition hover:bg-rose-600"
        >
          <CalendarPlus className="h-3.5 w-3.5" /> Agendar
        </button>
      </div>
    </header>
  );
}
