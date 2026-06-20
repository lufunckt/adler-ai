import { Brain, Home, Users, Calendar, FileText, CreditCard, Settings, Sparkles } from "lucide-react";
import { Page } from "../../types";

const navItems: Array<{ icon: any; id: Page; label: string }> = [
  { id: "home", label: "Início", icon: Home },
  { id: "patients", label: "Pacientes", icon: Users },
  { id: "schedule", label: "Agenda", icon: Calendar },
  { id: "dsm", label: "DSM / Psicopatologia", icon: Brain },
  { id: "documents", label: "Documentos", icon: FileText },
  { id: "subscription", label: "Assinatura", icon: CreditCard },
  { id: "settings", label: "Configurações", icon: Settings }
];

export function GlobalSidebar({ currentPage, onNavigate }: { currentPage: Page; onNavigate: (p: Page) => void }) {
  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col border-r border-gray-200 bg-white">
      <div className="flex h-16 items-center gap-3 px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gray-900 text-white">
          <Sparkles className="h-5 w-5" />
        </div>
        <div className="flex flex-col"><span className="text-lg font-bold tracking-tight leading-tight">Adler AI</span><span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">Clinical Intelligence</span></div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold transition-all ${
                active ? "bg-gray-900 text-white shadow-lg shadow-gray-200" : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <Icon className={`h-4 w-4 ${active ? "text-white" : "text-gray-400"}`} />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="border-t border-gray-100 p-4">
        <div className="rounded-2xl bg-rose-50 p-4">
          <p className="text-xs font-bold text-rose-600">ADLER PREMIUM</p>
          <p className="mt-1 text-[11px] leading-relaxed text-rose-900/60">
            Inteligência clínica longitudinal ativada.
          </p>
        </div>
      </div>
    </aside>
  );
}
