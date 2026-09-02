export default function TodayJournalLoading() {
  return (
    <main className="diary-room grid min-h-screen place-items-center px-6" aria-busy="true">
      <p className="rounded-sm border border-[var(--line)] bg-[var(--paper)] px-5 py-3 text-sm font-bold text-[var(--brown)] shadow-[3px_4px_0_rgba(91,57,31,0.14)]">
        Buscando el separador de hoy…
      </p>
    </main>
  );
}
