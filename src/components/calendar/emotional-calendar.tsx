"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { CalendarMonthDto } from "@/features/calendar/service";
import { buildCalendarCells, formatMonth, shiftMonth } from "@/features/calendar/month";
import { moodCatalog } from "@/features/calendar/moods";

type LoadStatus = "idle" | "loading" | "error";

function formatDay(entryDate: string) {
  const [year, month, day] = entryDate.split("-").map(Number);
  return new Intl.DateTimeFormat("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

export function EmotionalCalendar({ initialData }: { initialData: CalendarMonthDto }) {
  const [data, setData] = useState(initialData);
  const [status, setStatus] = useState<LoadStatus>("idle");
  const [selectedDate, setSelectedDate] = useState(
    initialData.entries.find((entry) => entry.entryDate === initialData.today)?.entryDate
      ?? initialData.entries.at(-1)?.entryDate
      ?? null,
  );
  const cells = useMemo(() => buildCalendarCells(data.month), [data.month]);
  const entriesByDate = useMemo(
    () => new Map(data.entries.map((entry) => [entry.entryDate, entry])),
    [data.entries],
  );
  const selectedEntry = selectedDate ? entriesByDate.get(selectedDate) ?? null : null;

  async function loadMonth(month: string) {
    setStatus("loading");
    try {
      const response = await fetch(`/api/calendar?month=${month}`, { cache: "no-store" });
      const nextData = (await response.json()) as CalendarMonthDto & { error?: string };
      if (!response.ok) throw new Error(nextData.error ?? "No se pudo cargar el mes.");
      setData(nextData);
      setSelectedDate(
        nextData.entries.find((entry) => entry.entryDate === nextData.today)?.entryDate
          ?? nextData.entries.at(-1)?.entryDate
          ?? null,
      );
      setStatus("idle");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="grid gap-7 xl:grid-cols-[minmax(24rem,0.88fr)_minmax(31rem,1.12fr)]">
      <section className="rounded-[2rem] border border-[var(--line)] bg-[var(--paper)] p-5 shadow-[0_20px_55px_rgba(91,59,32,0.11)] sm:p-7" aria-labelledby="emotional-calendar-title">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--ochre)]">
              Tu calendario
            </p>
            <h2 id="emotional-calendar-title" className="font-display mt-1 text-3xl font-semibold tracking-[-0.035em]">
              {formatMonth(data.month)}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void loadMonth(shiftMonth(data.month, -1))}
              disabled={status === "loading"}
              className="grid size-10 place-items-center rounded-full border border-[var(--line)] bg-[#fff6df] text-2xl text-[var(--brown)] transition hover:bg-[var(--yellow-soft)] disabled:opacity-50"
              aria-label="Mes anterior"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => void loadMonth(shiftMonth(data.month, 1))}
              disabled={status === "loading"}
              className="grid size-10 place-items-center rounded-full border border-[var(--line)] bg-[#fff6df] text-2xl text-[var(--brown)] transition hover:bg-[var(--yellow-soft)] disabled:opacity-50"
              aria-label="Mes siguiente"
            >
              ›
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 text-center text-[0.68rem] font-bold uppercase tracking-[0.12em] text-[var(--muted)]">
          {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((day, index) => (
            <span key={`${day}-${index}`} className="py-2">{day}</span>
          ))}
        </div>
        <div className={`grid grid-cols-7 gap-1.5 transition ${status === "loading" ? "opacity-50" : ""}`} aria-busy={status === "loading"}>
          {cells.map((cell) => {
            if (!cell.date || !cell.day) return <span key={cell.key} className="aspect-square" />;
            const entry = entriesByDate.get(cell.date);
            const isToday = cell.date === data.today;
            const isSelected = cell.date === selectedDate;
            const isFuture = cell.date > data.today;
            const dayContent = <>
              {entry?.mood && (
                <span
                  className="absolute inset-1.5 rounded-xl opacity-35"
                  style={{ backgroundColor: entry.mood.color }}
                  aria-hidden="true"
                />
              )}
              <span className="relative z-10">{cell.day}</span>
              {entry && (
                <span className="absolute bottom-1 left-1/2 z-10 -translate-x-1/2 text-[0.7rem]" aria-hidden="true">
                  {entry.mood?.icon ?? "•"}
                </span>
              )}
              {!isFuture && <span className="calendar-ribbon" aria-hidden="true" />}
            </>;
            const dayClass = `calendar-day relative grid aspect-square place-items-center rounded-2xl border text-sm font-semibold transition ${
              isSelected
                ? "border-[var(--brown)] bg-[#fff5d9] shadow-sm"
                : "border-transparent hover:border-[var(--line)] hover:bg-[#fff5d9]"
            } ${isToday ? "ring-2 ring-[var(--yellow)] ring-offset-2 ring-offset-[var(--paper)]" : ""}`;

            if (isFuture) return <span key={cell.key} aria-label={`${formatDay(cell.date)}, todavía no ha ocurrido`} className={`${dayClass} cursor-not-allowed opacity-35`}>{dayContent}</span>;
            return <Link key={cell.key} href={`/journal/${cell.date}?open=1`} aria-current={isSelected ? "date" : undefined} aria-label={`${formatDay(cell.date)}${entry ? `, ${entry.mood?.name ?? "con entrada"}` : ", sin entrada"}${isToday ? ", hoy" : ""}. Abrir por este separador.`} className={dayClass}>{dayContent}</Link>;
          })}
        </div>

        <p className="mt-5 min-h-5 border-t border-[var(--line)] pt-4 text-center text-xs font-medium text-[var(--muted)]" aria-live="polite">
          {status === "loading" && "Abriendo otro mes…"}
          {status === "error" && "No pudimos cambiar de mes. Inténtalo de nuevo."}
          {status === "idle" && `${data.summary.entryCount} ${data.summary.entryCount === 1 ? "momento guardado" : "momentos guardados"} este mes`}
        </p>

        <div className="mt-4 flex flex-wrap justify-center gap-2" aria-label="Colores de las emociones">
          {moodCatalog.map((mood) => (
            <span key={mood.slug} className="inline-flex items-center gap-1.5 rounded-full border border-[var(--line)] bg-[#fff6df] px-2.5 py-1 text-[0.68rem] font-bold text-[var(--muted)]">
              <span className="size-2 rounded-full" style={{ backgroundColor: mood.color }} />
              {mood.name}
            </span>
          ))}
        </div>
      </section>

      <section className="rounded-[2rem] border border-[var(--line)] bg-[rgba(249,237,209,0.82)] p-5 shadow-[0_20px_55px_rgba(91,59,32,0.09)] backdrop-blur sm:p-7" aria-labelledby="month-moments-title">
        <div className="mb-6 flex flex-col gap-4 border-b border-[var(--line)] pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--ochre)]">Lo que viviste</p>
            <h2 id="month-moments-title" className="font-display mt-1 text-3xl font-semibold tracking-[-0.035em]">Momentos del mes</h2>
          </div>
          {data.summary.mostFrequentMood && (
            <div className="rounded-2xl bg-[#fff4d7] px-4 py-3 text-sm text-[var(--muted)]">
              Emoción más presente: <strong className="text-[var(--brown-dark)]">{data.summary.mostFrequentMood.icon} {data.summary.mostFrequentMood.name}</strong>
            </div>
          )}
        </div>

        {selectedDate && (
          <div className="mb-5 rounded-[1.4rem] border border-dashed border-[var(--brown-light)] bg-[#f6e4bc] p-4">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--ochre)]">Día seleccionado</p>
            <p className="font-display mt-1 text-xl font-semibold capitalize">{formatDay(selectedDate)}</p>
            {selectedEntry ? (
              <p className="mt-2 text-sm text-[var(--muted)]">
                {selectedEntry.mood ? `${selectedEntry.mood.icon} ${selectedEntry.mood.name} · ` : ""}{selectedEntry.title}
              </p>
            ) : (
              <p className="mt-2 text-sm text-[var(--muted)]">Todavía no hay una entrada guardada en este día.</p>
            )}
            <Link href={`/journal/${selectedDate}?open=1`} className="mt-4 inline-flex items-center gap-2 rounded-full bg-[var(--yellow)] px-4 py-2 text-xs font-bold text-[var(--brown-dark)]">
              <span aria-hidden="true">🔖</span>{selectedEntry ? "Abrir por este separador" : "Colocar separador y escribir"}
            </Link>
          </div>
        )}

        {data.entries.length > 0 ? (
          <div className="space-y-3">
            {[...data.entries].reverse().map((entry) => (
              <button
                key={entry.entryId}
                type="button"
                onClick={() => setSelectedDate(entry.entryDate)}
                className={`flex w-full items-center gap-4 rounded-[1.25rem] border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-sm ${selectedDate === entry.entryDate ? "border-[var(--brown-light)] bg-[#fff3d4]" : "border-[var(--line)] bg-[#f5e5c1]"}`}
              >
                <span className="grid size-12 shrink-0 place-items-center rounded-2xl text-xl" style={{ backgroundColor: entry.mood?.color ?? "#ddc79c" }} aria-hidden="true">
                  {entry.mood?.icon ?? entry.entryDate.slice(-2)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold text-[var(--brown-dark)]">{entry.title}</span>
                  <span className="mt-1 block text-sm capitalize text-[var(--muted)]">{formatDay(entry.entryDate)}</span>
                </span>
                <span className="text-sm font-bold text-[var(--ochre)]">Ver</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="grid min-h-64 place-items-center rounded-[1.5rem] border border-dashed border-[var(--brown-light)] bg-[#f5e5c1] p-8 text-center">
            <div>
              <span className="text-4xl" aria-hidden="true">🌤️</span>
              <h3 className="font-display mt-3 text-2xl font-semibold">Este mes todavía está en blanco.</h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--muted)]">No tienes que llenar todos los días. Guarda solamente los que quieras conservar.</p>
              <Link href="/journal/today" className="mt-5 inline-flex rounded-full bg-[var(--yellow)] px-5 py-2.5 text-sm font-bold text-[var(--brown-dark)] shadow-sm transition hover:-translate-y-0.5">
                Escribir el día de hoy
              </Link>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
