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
import { approach } from "../constants";




export function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Configurações</h1>
        <p className="mt-1 text-sm text-gray-500">Preferências da conta, abordagem padrão e segurança.</p>
      </div>
      <div className="rounded-2xl border border-gray-200 bg-white p-7 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">Abordagem cadastrada</p>
        <p className="mt-2 text-2xl font-bold text-gray-900">{approach.label}</p>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-600">
          No plano padrão, o Adler mostra apenas a lente clínica selecionada no cadastro. No Premium, todas as lentes e módulos avançados ficam liberados para análise complementar.
        </p>
      </div>
    </div>
  );
}
