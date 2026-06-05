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
import { documentTemplates } from "../constants";




export function DocumentsPage() {
  const [owner, setOwner] = useState<"Todos" | "Psicólogo" | "Psiquiatra">("Todos");
  const filtered = owner === "Todos" ? documentTemplates : documentTemplates.filter((t) => t.owner === owner);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Documentos</h1>
        <p className="mt-1 text-sm text-gray-500">Modelos clínicos, encaminhamentos e judicialização.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        {[
          { color: "bg-sky-500", title: "Laudo judicial", text: "Medicação fora do SUS" },
          { color: "bg-violet-500", title: "Encaminhamento", text: "Psicologia e psiquiatria" },
          { color: "bg-amber-500", title: "Laudo psicológico", text: "Estrutura CFP" },
          { color: "bg-emerald-500", title: "Atestado", text: "Comparecimento ou afastamento" }
        ].map(({ color, title, text }) => (
          <div key={title} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-rose-200 hover:shadow-md">
            <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl ${color}`}>
              <FileText className="h-4 w-4 text-white" />
            </div>
            <p className="font-semibold text-gray-900">{title}</p>
            <p className="mt-1 text-xs text-gray-500">{text}</p>
            <button className="mt-4 w-full rounded-lg bg-gray-100 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-200" type="button">
              Iniciar
            </button>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        {(["Todos", "Psicólogo", "Psiquiatra"] as const).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setOwner(item)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              owner === item ? "bg-gray-900 text-white" : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-6 py-4">
          <h2 className="font-semibold text-gray-900">Biblioteca de modelos</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {filtered.map((t) => (
            <div key={t.title} className="flex items-center gap-4 px-6 py-4 transition hover:bg-gray-50">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100">
                <FileText className="h-5 w-5 text-gray-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-gray-900">{t.title}</p>
                <p className="mt-0.5 text-xs text-gray-500">{t.kind} · {t.owner}</p>
                <p className="mt-0.5 text-xs text-gray-400">{t.purpose}</p>
              </div>
              <button className="inline-flex items-center gap-1.5 rounded-lg bg-gray-900 px-3 py-2 text-xs font-semibold text-white hover:bg-gray-700" type="button">
                <Download className="h-3.5 w-3.5" /> Usar
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
