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
