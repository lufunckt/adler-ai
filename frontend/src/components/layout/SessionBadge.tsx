import { LogOut } from "lucide-react";
import { AuthSession } from "../../lib/auth";

export function SessionBadge({
  authSession,
  onLogout
}: {
  authSession: AuthSession;
  onLogout: () => void;
}) {
  const modeLabel = authSession.mode === "demo" ? "Demo compartilhavel" : "Conta autenticada";

  return (
    <div className="fixed right-4 top-4 z-[70] flex items-center gap-3 rounded-full border border-white/10 bg-[#101319]/92 px-3 py-2 text-white shadow-xl shadow-black/20 backdrop-blur-xl">
      <div className="min-w-0">
        <p className="max-w-[180px] truncate text-xs font-semibold">
          {authSession.user.email}
        </p>
        <p className="font-mono text-[0.58rem] uppercase tracking-[0.18em] text-white/42">
          {modeLabel}
        </p>
      </div>
      <button
        type="button"
        onClick={onLogout}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/72 transition hover:bg-white/[0.09] hover:text-white"
        aria-label="Sair"
      >
        <LogOut className="h-4 w-4" />
      </button>
    </div>
  );
}
