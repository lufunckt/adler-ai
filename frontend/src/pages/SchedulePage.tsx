import { motion } from "framer-motion";
import { ArrowRight, CalendarPlus, Trash2 } from "lucide-react";
import { Appointment, Patient } from "../types";
import { avatarClass } from "../utils";

export function SchedulePage({
  appointments,
  onOpenPatient,
  onDeleteAppointment,
  onSchedule,
  patients
}: {
  appointments: Appointment[];
  onOpenPatient: (id: string) => void;
  onDeleteAppointment: (id: string) => void;
  onSchedule: () => void;
  patients: Patient[];
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Agenda</h1>
          <p className="mt-1 text-sm text-gray-500">Gestão de horários e sessões do dia</p>
        </div>
        <button
          onClick={onSchedule}
          className="inline-flex items-center gap-2 rounded-xl bg-rose-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-rose-600"
        >
          <CalendarPlus className="h-4 w-4" /> Agendar paciente
        </button>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="bg-gray-50/50 px-6 py-4 border-b border-gray-100">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">Segunda, 20 de abril — Hoje</p>
        </div>
        <div className="divide-y divide-gray-50">
          {appointments.map((apt, i) => {
            const pt = patients.find((p) => p.id === apt.patientId);
            if (!pt) return null;
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
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => onDeleteAppointment(apt.id)}
                    className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpenPatient(pt.id)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-700"
                  >
                    Abrir <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
