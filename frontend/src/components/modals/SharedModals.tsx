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

export function ModalFrame({ children, onClose, title }: { children: ReactNode; onClose: () => void; title: string }) {
  return (
    <motion.div
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 grid place-items-center bg-gray-900/40 px-4 backdrop-blur-sm"
      exit={{ opacity: 0 }}
      initial={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="figma-scroll max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-gray-200 bg-white p-7 shadow-2xl"
        exit={{ opacity: 0, scale: 0.98, y: 10 }}
        initial={{ opacity: 0, scale: 0.98, y: 14 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-tight text-gray-900">{title}</h2>
          <button className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700" onClick={onClose} type="button">
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </motion.div>
    </motion.div>
  );
}

export function PatientModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (p: { focus: string; name: string }) => void }) {
  const [name, setName] = useState("");
  const [focus, setFocus] = useState("");
  return (
    <ModalFrame onClose={onClose} title="Adicionar paciente">
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim()) return;
          onSubmit({ focus, name });
        }}
      >
        <Field label="Nome" onChange={setName} placeholder="Ex: Mariana A." value={name} />
        <Field label="Foco inicial" onChange={setFocus} placeholder="Ex: ansiedade, sono, rituais..." value={focus} />
        <button className="w-full rounded-xl bg-rose-500 py-3 text-sm font-semibold text-white hover:bg-rose-600" type="submit">
          Criar perfil
        </button>
      </form>
    </ModalFrame>
  );
}

export function ScheduleModal({
  onClose,
  onSubmit,
  patients
}: {
  onClose: () => void;
  onSubmit: (p: { kind: string; mode: string; name: string; note: string; time: string }) => void;
  patients: Patient[];
}) {
  const [name, setName] = useState(patients[0]?.name ?? "");
  const [time, setTime] = useState("09:00");
  const [kind, setKind] = useState("Sessão individual");
  const [mode, setMode] = useState("Presencial · Sala 1");
  const [note, setNote] = useState("");
  return (
    <ModalFrame onClose={onClose} title="Agendar paciente">
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim()) return;
          onSubmit({ kind, mode, name, note, time });
        }}
      >
        <Field label="Paciente" onChange={setName} placeholder="Digite ou selecione" value={name} />
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Horário" onChange={setTime} placeholder="09:00" value={time} />
          <Field label="Tipo" onChange={setKind} placeholder="Sessão individual" value={kind} />
        </div>
        <Field label="Modalidade" onChange={setMode} placeholder="Online ou presencial" value={mode} />
        <Field label="Observação" onChange={setNote} placeholder="Preparação clínica..." value={note} />
        <p className="rounded-xl bg-rose-50 p-3 text-sm text-rose-800">
          Se o nome não existir, o Adler cria automaticamente um perfil básico do paciente.
        </p>
        <button className="w-full rounded-xl bg-rose-500 py-3 text-sm font-semibold text-white hover:bg-rose-600" type="submit">
          Confirmar agenda
        </button>
      </form>
    </ModalFrame>
  );
}

export function AboutModal({ onClose }: { onClose: () => void }) {
  return (
    <ModalFrame onClose={onClose} title="Adler AI">
      <p className="text-sm leading-6 text-gray-600">
        O Adler AI combina prontuário clínico, análise longitudinal, documentos, DSM e suporte de IA rastreável. Não substitui julgamento clínico: organiza dados, evidências e hipóteses.
      </p>
      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {["Abordagem multiparadigmática", "Análise longitudinal", "Documentos rastreáveis", "Privacidade por arquitetura"].map((item) => (
          <div key={item} className="rounded-xl border border-gray-100 bg-gray-50 p-4 text-sm text-gray-700">
            {item}
          </div>
        ))}
      </div>
    </ModalFrame>
  );
}

export function SecurityModal({ onClose }: { onClose: () => void }) {
  return (
    <ModalFrame onClose={onClose} title="Segurança & Privacidade">
      <div className="grid gap-4 md:grid-cols-2">
        {[
          ["Isolamento de dados", "Dados clínicos segregados por conta."],
          ["Criptografia", "Preparada para dados sensíveis em repouso."],
          ["IA sem treinamento", "Dados não usados para treinar modelos generativos."],
          ["Auditoria", "Eventos críticos podem ser registrados."]
        ].map(([title, text]) => (
          <div key={title} className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <p className="font-semibold text-gray-900">{title}</p>
            <p className="mt-1.5 text-sm leading-5 text-gray-500">{text}</p>
          </div>
        ))}
      </div>
    </ModalFrame>
  );
}

export function Field({
  label,
  onChange,
  placeholder,
  value
}: {
  label: string;
  onChange: (v: string) => void;
  placeholder: string;
  value: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-gray-700">{label}</span>
      <input
        className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        value={value}
      />
    </label>
  );
}
