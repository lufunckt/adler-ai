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

export function AppBootScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#090b10] text-white">
      <div className="rounded-[32px] border border-white/8 bg-[#101319] px-8 py-7 text-center shadow-2xl shadow-black/20">
        <p className="font-mono text-[0.64rem] uppercase tracking-[0.28em] text-white/42">
          Adler AI
        </p>
        <p className="mt-3 text-sm text-white/68">Preparando ambiente clinico...</p>
      </div>
    </div>
  );
}
