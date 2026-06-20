import { motion } from "framer-motion";
import { Trash2 } from "lucide-react";
import { AdlerScheduleItem, AdlerPatientRegistryItem } from "../api/client";

export function SchedulePanel({
  appointments,
  patients,
  onDelete
}: {
  appointments: AdlerScheduleItem[];
  patients: AdlerPatientRegistryItem[];
  onDelete: (id: string) => void;
}) {
  return (
    <div className="space-y-4">
      {appointments.map((apt) => {
        const pt = patients.find((p) => p.id === apt.patient_id);
        return (
          <div key={apt.id} className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div>
              <p className="font-semibold text-gray-900">{pt?.name || "Paciente"}</p>
              <p className="text-sm text-gray-500">{apt.time} · {apt.mode}</p>
              <p className="mt-1 text-xs text-gray-400">{apt.session_label}</p>
            </div>
            <button
              onClick={() => onDelete(apt.id)}
              className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-500"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
