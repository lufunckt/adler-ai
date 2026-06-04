import { Search, UserPlus, CalendarPlus, Info, Shield, Bell } from "lucide-react";
import { Patient } from "../../types";

export function GlobalHeader({
  onOpenAddPatient,
  onOpenInfo,
  onOpenPatient,
  onOpenSchedule,
  onOpenSecurity,
  patients,
  search,
  setSearch
}: {
  onOpenAddPatient: () => void;
  onOpenInfo: () => void;
  onOpenPatient: (id: string) => void;
  onOpenSchedule: () => void;
  onOpenSecurity: () => void;
  patients: Patient[];
  search: string;
  setSearch: (v: string) => void;
}) {
  const filteredSearch = search.trim()
    ? patients.filter((p) => p.name.toLowerCase().includes(search.toLowerCase())).slice(0, 5)
    : [];

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-gray-100 bg-white px-8">
      <div className="relative w-full max-w-md">
        <div className="flex items-center gap-3 rounded-xl bg-gray-50 px-3 py-2 border border-transparent focus-within:border-rose-200 focus-within:bg-white transition-all">
          <Search className="h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar paciente ou prontuário..."
            className="w-full bg-transparent text-sm outline-none"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {filteredSearch.length > 0 && (
          <div className="absolute left-0 right-0 top-full z-50 mt-2 rounded-2xl border border-gray-100 bg-white p-2 shadow-2xl">
            {filteredSearch.map((p) => (
              <button
                key={p.id}
                onClick={() => onOpenPatient(p.id)}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-gray-50"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-xs font-bold text-rose-600">
                  {p.initials}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{p.name}</p>
                  <p className="text-[10px] text-gray-400">{p.focus}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onOpenAddPatient}
          className="flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-semibold text-gray-600 hover:bg-gray-50"
        >
          <UserPlus className="h-4 w-4" />
          <span className="hidden sm:inline">Paciente</span>
        </button>
        <button
          onClick={onOpenSchedule}
          className="flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-semibold text-gray-600 hover:bg-gray-50"
        >
          <CalendarPlus className="h-4 w-4" />
          <span className="hidden sm:inline">Agendar</span>
        </button>
        <div className="mx-2 h-4 w-px bg-gray-100" />
        <button onClick={onOpenInfo} className="rounded-xl p-2.5 text-gray-400 hover:bg-gray-50 hover:text-gray-600">
          <Info className="h-5 w-5" />
        </button>
        <button onClick={onOpenSecurity} className="rounded-xl p-2.5 text-gray-400 hover:bg-gray-50 hover:text-gray-600">
          <Shield className="h-5 w-5" />
        </button>
        <button className="relative rounded-xl p-2.5 text-gray-400 hover:bg-gray-50 hover:text-gray-600">
          <Bell className="h-5 w-5" />
          <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full border-2 border-white bg-rose-500" />
        </button>
      </div>
    </header>
  );
}
