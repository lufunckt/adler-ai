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
import { clinician, navItems, approach } from "../../constants";




export function GlobalSidebar({ currentPage, onNavigate }: { currentPage: Page; onNavigate: (p: Page) => void }) {
  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col border-r border-gray-200 bg-white">
      <div className="flex h-16 shrink-0 items-center gap-3 border-b border-gray-100 px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500 shadow-sm">
          <BrainCircuit className="h-4 w-4 text-white" />
        </div>
        <div>
          <p className="text-[15px] font-bold leading-none tracking-tight text-gray-900">Adler AI</p>
          <p className="mt-0.5 text-[10px] font-medium uppercase tracking-widest text-rose-500">Clínico</p>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 px-3 py-4">
        <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-gray-400">Menu</p>
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = item.id === currentPage;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all ${
                active ? "bg-rose-50 text-rose-600" : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <Icon className={`h-4 w-4 ${active ? "text-rose-500" : "text-gray-400"}`} />
              {item.label}
              {active ? <span className="ml-auto h-1.5 w-1.5 rounded-full bg-rose-500" /> : null}
            </button>
          );
        })}
      </nav>


      <div className="px-3 mb-2">
        <a
          href="https://forms.gle/adler-ai-feedback"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 transition-all border border-emerald-200/50"
        >
          <MessageCircle className="h-4 w-4" />
          Enviar Feedback
        </a>
      </div>
      <div className="border-t border-gray-100 p-4">
        <div className="flex items-center gap-3 rounded-xl bg-gray-50 px-3 py-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-rose-500 text-sm font-bold text-white">
            EL
          </div>
          <div className="min-w-0">
            <p className="truncate text-[13px] font-semibold text-gray-900">{clinician.name}</p>
            <p className="text-[11px] text-gray-400">{clinician.registry}</p>
          </div>
        </div>
        <div className="mt-2 flex items-center gap-1.5 px-1">
          <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
          <p className="text-[11px] text-rose-500">{approach.label}</p>
        </div>
        {clinician.plan === "premium" ? (
          <div className="mt-2 rounded-lg bg-rose-50 px-3 py-2">
            <p className="text-[11px] font-semibold text-rose-600">Beta Tester · Acesso Total</p>
          </div>
        ) : null}
      </div>
    </aside>
  );
}
