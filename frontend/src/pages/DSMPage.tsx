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
import { dsmConditions } from "../constants";




export function DSMPage() {
  const [query, setQuery] = useState("");
  const selected =
    dsmConditions.find((c) =>
      `${c.title} ${c.category} ${c.code}`.toLowerCase().includes(query.toLowerCase())
    ) ?? dsmConditions[0];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">DSM / Psicopatologia</h1>
        <p className="mt-1 text-sm text-gray-500">Base orientativa para formulação clínica. Não substitui avaliação profissional.</p>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar TOC, ansiedade, borderline, TDAH..."
          className="h-12 w-full rounded-xl border border-gray-200 bg-white pl-12 pr-4 text-sm text-gray-900 shadow-sm outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.8fr)_minmax(280px,1fr)]">
        <div className="rounded-2xl border border-gray-200 bg-white p-7 shadow-sm">
          <div className="mb-5 flex flex-wrap gap-2">
            <span className="rounded-full bg-violet-100 px-3 py-1 text-sm font-medium text-violet-700">{selected.category}</span>
            <span className="rounded-full bg-gray-100 px-3 py-1 font-mono text-sm text-gray-600">{selected.code}</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">{selected.title}</h2>
          <div className="mt-5 rounded-xl border border-sky-200 bg-sky-50 p-5">
            <div className="mb-2 flex items-center gap-2">
              <Activity className="h-4 w-4 text-sky-500" />
              <p className="text-sm font-semibold text-gray-900">Sintomas centrais</p>
            </div>
            <p className="text-sm leading-6 text-gray-700">{selected.symptoms}</p>
          </div>
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-5">
            <div className="mb-2 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <p className="text-sm font-semibold text-gray-900">Observação clínica</p>
            </div>
            <p className="text-sm leading-6 text-gray-700">{selected.note}</p>
          </div>
        </div>
        <aside className="space-y-4">
          {[
            { title: "Escalas sugeridas", items: selected.scales, color: "bg-rose-500" },
            { title: "Diferenciais frequentes", items: selected.differentials, color: "bg-violet-500" },
            { title: "Fontes", items: ["DSM-5-TR", "APA Guidelines", "NICE Guidelines"], color: "bg-gray-800" }
          ].map(({ title, items, color }) => (
            <div key={title} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="mb-3 flex items-center gap-2">
                <div className={`h-2.5 w-2.5 rounded-full ${color}`} />
                <h3 className="font-semibold text-gray-900">{title}</h3>
              </div>
              <div className="space-y-2">
                {items.map((item) => (
                  <div key={item} className="rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-700">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </aside>
      </div>
    </div>
  );
}
