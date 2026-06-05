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

export function KpiCard({
  color,
  delta,
  icon: Icon,
  label,
  spark,
  value
}: {
  color: string;
  delta: string;
  icon: LucideIcon;
  label: string;
  spark: number[];
  value: string;
}) {
  const colorMap: Record<string, { bg: string; text: string; icon: string; spark: string }> = {
    rose: { bg: "bg-rose-50", text: "text-rose-600", icon: "text-rose-500", spark: "#f43f5e" },
    violet: { bg: "bg-violet-50", text: "text-violet-600", icon: "text-violet-500", spark: "#8b5cf6" },
    sky: { bg: "bg-sky-50", text: "text-sky-600", icon: "text-sky-500", spark: "#0ea5e9" },
    red: { bg: "bg-red-50", text: "text-red-600", icon: "text-red-500", spark: "#ef4444" },
    emerald: { bg: "bg-emerald-50", text: "text-emerald-600", icon: "text-emerald-500", spark: "#10b981" }
  };
  const c = colorMap[color] ?? colorMap.rose;
  const max = Math.max(...spark, 1);
  const pts = spark
    .map((v, i) => `${(i / (spark.length - 1)) * 100},${100 - (v / max) * 100}`)
    .join(" ");

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${c.bg}`}>
          <Icon className={`h-4 w-4 ${c.icon}`} />
        </div>
        <svg viewBox="0 0 100 100" className="h-10 w-16" preserveAspectRatio="none">
          <polyline
            fill="none"
            points={pts}
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
