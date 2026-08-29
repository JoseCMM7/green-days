import type { Metadata } from "next";
import { FeaturePageShell } from "@/components/feature-page-shell";
import { MonthCalendar } from "@/components/month-calendar";

export const metadata: Metadata = {
  title: "Calendario emocional — Green Days",
};

const moments = [
  { day: "25", mood: "🥹", title: "Una conversación que necesitaba", color: "bg-[#d7b5a5]" },
  { day: "21", mood: "😌", title: "Caminata al caer la tarde", color: "bg-[#a9ad83]" },
  { day: "16", mood: "😊", title: "Comida con mi familia", color: "bg-[#e7ba4d]" },
];

export default function CalendarPage() {
  return (
    <FeaturePageShell
      eyebrow="Tu historia, día a día"
      title="Calendario emocional"
      description="Recorre tus días por fecha, emoción o color. No buscamos medir tu felicidad, sino ayudarte a reencontrar lo que viviste."
    >
      <div className="grid gap-7 lg:grid-cols-[23rem_minmax(0,1fr)]">
        <MonthCalendar />

        <section className="rounded-[1.8rem] border border-[var(--line)] bg-[var(--paper)] p-6 shadow-[0_18px_50px_rgba(91,59,32,0.1)] sm:p-8" aria-labelledby="month-moments-title">
          <div className="mb-7 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--ochre)]">Agosto</p>
              <h2 id="month-moments-title" className="font-display mt-1 text-3xl font-semibold tracking-[-0.03em]">Momentos guardados</h2>
            </div>
            <span className="rounded-full bg-[var(--yellow-soft)] px-3 py-1.5 text-xs font-bold text-[var(--brown-dark)]">6 entradas</span>
          </div>

          <div className="space-y-3">
            {moments.map((moment) => (
              <article key={moment.day} className="flex items-center gap-4 rounded-[1.25rem] border border-[var(--line)] bg-[#f5e5c1] p-4">
                <div className={`grid size-12 shrink-0 place-items-center rounded-2xl ${moment.color}`}>
                  <span className="font-display text-lg font-bold text-[var(--brown-dark)]">{moment.day}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-[var(--brown-dark)]">{moment.title}</p>
                  <p className="mt-1 text-sm text-[var(--muted)]">Agosto de 2026</p>
                </div>
                <span className="text-2xl" aria-hidden="true">{moment.mood}</span>
              </article>
            ))}
          </div>
        </section>
      </div>
    </FeaturePageShell>
  );
}
