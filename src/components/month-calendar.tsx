const days = Array.from({ length: 31 }, (_, index) => index + 1);
const recordedDays: Record<number, string> = {
  3: "bg-[#efc84e]",
  7: "bg-[#89a17f]",
  12: "bg-[#eaa37b]",
  16: "bg-[#efc84e]",
  21: "bg-[#89a17f]",
  25: "bg-[#c6a4b6]",
};

export function MonthCalendar() {
  return (
    <section className="rounded-[1.6rem] border border-[var(--line)] bg-[var(--paper)] p-5 shadow-[0_16px_45px_rgba(91,59,32,0.1)]" aria-labelledby="calendar-title">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--muted)]">Tu calendario</p>
          <h2 id="calendar-title" className="font-display mt-1 text-2xl font-semibold tracking-[-0.03em]">Agosto 2026</h2>
        </div>
        <div className="flex gap-1">
          <button type="button" className="grid size-8 place-items-center rounded-full text-lg text-[var(--muted)] hover:bg-[var(--yellow-soft)]" aria-label="Mes anterior">‹</button>
          <button type="button" className="grid size-8 place-items-center rounded-full text-lg text-[var(--muted)] hover:bg-[var(--yellow-soft)]" aria-label="Mes siguiente">›</button>
        </div>
      </div>

      <div className="grid grid-cols-7 text-center text-[0.68rem] font-bold uppercase text-[#aaa69e]">
        {["L", "M", "M", "J", "V", "S", "D"].map((day, index) => <span key={`${day}-${index}`} className="py-2">{day}</span>)}
      </div>
      <div className="grid grid-cols-7 gap-y-1 text-center text-sm">
        {Array.from({ length: 5 }, (_, index) => <span key={`blank-${index}`} />)}
        {days.map((day) => {
          const recordTone = recordedDays[day];
          const isToday = day === 28;

          return (
            <button key={day} type="button" className={`relative mx-auto grid size-9 place-items-center rounded-full font-medium transition hover:bg-[var(--yellow-soft)] ${isToday ? "bg-[var(--yellow)] font-bold text-[#493e1c]" : "text-[var(--ink)]"}`} aria-label={`${day} de agosto${recordTone ? ", con entrada" : ""}${isToday ? ", hoy" : ""}`}>
              {day}
              {recordTone && !isToday && <span className={`absolute bottom-0.5 size-1 rounded-full ${recordTone}`} aria-hidden="true" />}
            </button>
          );
        })}
      </div>
      <p className="mt-5 border-t border-[var(--line)] pt-4 text-center text-xs leading-5 text-[var(--muted)]">6 momentos guardados este mes</p>
    </section>
  );
}
