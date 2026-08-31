export default function TodayJournalLoading() {
  return (
    <main className="pb-28 pt-7 lg:pb-14 lg:pt-10" aria-busy="true">
      <div className="mx-auto w-full max-w-[92rem] animate-pulse px-3 sm:px-6 lg:px-10">
        <div className="mx-auto mb-8 max-w-2xl text-center">
          <div className="mx-auto h-3 w-36 rounded-full bg-[var(--brown-light)]/55" />
          <div className="mx-auto mt-4 h-12 max-w-xl rounded-2xl bg-[var(--paper)]" />
          <p className="mt-4 text-sm font-semibold text-[var(--muted)]">Preparando las páginas de hoy…</p>
        </div>
        <div className="mx-auto aspect-[10/7] w-full max-w-[74rem] rounded-[2rem] border border-[var(--line)] bg-[#d2ad72] shadow-[0_28px_50px_rgba(71,43,22,0.18)]">
          <div className="mx-auto mt-[5%] h-[85%] w-[92%] rounded-[1.4rem] bg-[var(--paper)] opacity-65" />
        </div>
      </div>
    </main>
  );
}

