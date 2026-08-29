const moods = [
  { emoji: "😌", label: "En calma" },
  { emoji: "😊", label: "Feliz" },
  { emoji: "🥹", label: "Sensible" },
  { emoji: "😮‍💨", label: "Cansado" },
  { emoji: "🌧️", label: "Difícil" },
];

function PhotoIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="8.5" cy="9" r="1.5" />
      <path d="m4 17 4.8-4.6a2 2 0 0 1 2.7 0l2.2 2 1.2-1.1a2 2 0 0 1 2.7 0L21 16.5" />
    </svg>
  );
}

export function DailyEntryCard() {
  return (
    <section className="rounded-[2rem] border border-[var(--line)] bg-[var(--paper)] p-5 shadow-[0_24px_65px_rgba(91,59,32,0.12)] sm:p-8" aria-labelledby="daily-entry-title">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.17em] text-[var(--ochre)]">Tu página de hoy</p>
          <h2 id="daily-entry-title" className="font-display mt-1 text-2xl font-semibold tracking-[-0.03em] sm:text-3xl">¿Qué hizo que hoy valiera la pena?</h2>
        </div>
        <span className="w-fit rounded-full bg-[var(--yellow-soft)] px-3 py-1.5 text-xs font-semibold text-[var(--brown-dark)]">Solo tú puedes verlo</span>
      </div>

      <label htmlFor="daily-note" className="sr-only">Escribe algo que quieras recordar</label>
      <textarea id="daily-note" rows={5} placeholder="Puede ser una conversación, una canción, la luz de la tarde..." className="mt-6 w-full resize-none rounded-[1.4rem] border border-[var(--brown-light)] bg-[#f5e5c1] p-5 text-base leading-7 outline-none transition placeholder:text-[#a18a6e] focus:border-[var(--ochre)] focus:ring-4 focus:ring-[var(--yellow-soft)]/50" />

      <div className="mt-5 flex flex-col gap-5 border-t border-[var(--line)] pt-5 xl:flex-row xl:items-center xl:justify-between">
        <fieldset>
          <legend className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-[var(--muted)]">¿Cómo se sintió tu día?</legend>
          <div className="flex flex-wrap gap-2">
            {moods.map((mood) => (
              <button key={mood.label} type="button" title={mood.label} aria-label={mood.label} className="grid size-10 place-items-center rounded-full border border-[var(--brown-light)] bg-[#fff3d4] text-xl transition hover:-translate-y-1 hover:border-[var(--ochre)] hover:bg-[var(--yellow-soft)]">
                {mood.emoji}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="flex flex-wrap gap-3">
          <button type="button" className="inline-flex items-center justify-center gap-2 rounded-full border border-[var(--brown-light)] bg-[#fff3d4] px-5 py-3 text-sm font-semibold text-[var(--brown)] transition hover:border-[var(--ochre)] hover:bg-[var(--yellow-soft)]">
            <PhotoIcon />
            Añadir fotografía
          </button>
          <button type="button" className="rounded-full bg-[var(--yellow)] px-6 py-3 text-sm font-bold text-[#4d421e] shadow-[0_10px_24px_rgba(223,174,46,0.2)] transition hover:-translate-y-0.5 hover:bg-[#f6d25f]">Guardar momento</button>
        </div>
      </div>
    </section>
  );
}
