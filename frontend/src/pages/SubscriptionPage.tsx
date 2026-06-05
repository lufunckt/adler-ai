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
import { clinician } from "../constants";




export function SubscriptionPage() {
  const plans = [
    {
      active: clinician.plan === "standard",
      title: "Padrão",
      price: "R$ 97",
      period: "/mês",
      items: ["Uma abordagem clínica cadastrada", "Agenda e prontuários", "DSM e documentos", "Exportação CSV de pacientes"]
    },
    {
      active: clinician.plan === "premium",
      title: "Premium",
      price: "R$ 197",
      period: "/mês",
      items: ["Todas as abordagens terapêuticas", "Farmacologia e exames clínicos", "Insights avançados por lente clínica", "Base científica ampliada"]
    },
    {
      active: false,
      title: "Clínicas",
      price: "Solicite",
      period: "orçamento",
      items: ["Multiusuário e perfis por função", "Pacientes por equipe ou unidade", "Auditoria e governança clínica", "Configuração sob demanda"]
    }
  ];
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Assinatura Adler</h1>
        <p className="mt-1 text-sm text-gray-500">Plano padrão mantém o clínico na abordagem cadastrada. Premium libera todas as lentes.</p>
      </div>
      <div className="grid gap-5 xl:grid-cols-3">
        {plans.map((plan) => (
          <div
            key={plan.title}
            className={`rounded-2xl border-2 bg-white p-7 shadow-sm transition ${
              plan.active ? "border-rose-300 shadow-rose-100" : "border-gray-200"
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-lg font-bold text-gray-900">{plan.title}</p>
                <p className="text-xs text-gray-400">{plan.active ? "Plano atual" : "Disponível"}</p>
              </div>
              {plan.active ? <CheckCircle2 className="h-5 w-5 text-rose-500" /> : <Lock className="h-5 w-5 text-gray-300" />}
            </div>
            <div className="mt-6 flex items-end gap-1">
              <p className="text-4xl font-bold tracking-tight text-gray-900">{plan.price}</p>
              {plan.period ? <p className="pb-1 text-sm text-gray-400">{plan.period}</p> : null}
            </div>
            <div className="mt-5 space-y-2.5">
              {plan.items.map((item) => (
                <p key={item} className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                  {item}
                </p>
              ))}
            </div>
            <button
              className={`mt-6 w-full rounded-xl py-2.5 text-sm font-semibold transition ${
                plan.active ? "bg-rose-500 text-white hover:bg-rose-600" : "border border-gray-200 text-gray-700 hover:bg-gray-50"
              }`}
              type="button"
            >
              {plan.active ? "Plano atual" : plan.title === "Clínicas" ? "Solicitar orçamento" : "Fazer upgrade"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
