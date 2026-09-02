import Link from "next/link";

export function DailyEntryCard() {
  return (
    <section
      className="overflow-hidden rounded-[2rem] border border-[var(--line)] bg-[var(--paper)] shadow-[0_24px_65px_rgba(91,59,32,0.12)]"
      aria-labelledby="daily-entry-title"
    >
      <div className="grid md:grid-cols-[minmax(0,1fr)_19rem]">
        <div className="p-6 sm:p-8">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs font-bold uppercase tracking-[0.17em] text-[var(--ochre)]">
              Tu libro de hoy
            </p>
            <span className="w-fit rounded-full bg-[var(--yellow-soft)] px-3 py-1.5 text-xs font-semibold text-[var(--brown-dark)]">
              Solo tú puedes verlo
            </span>
          </div>
          <h2
            id="daily-entry-title"
            className="font-display mt-4 max-w-2xl text-3xl font-semibold tracking-[-0.035em] sm:text-4xl"
          >
            Hay una página esperando lo que quieras conservar.
          </h2>
          <p className="mt-4 max-w-xl leading-7 text-[var(--muted)]">
            Ábrela, escribe como en una libreta y acomoda tus stickers hasta que el día se sienta tuyo.
          </p>
          <Link
            href="/journal/today"
            className="mt-7 inline-flex items-center gap-3 rounded-full bg-[var(--yellow)] px-6 py-3.5 text-sm font-bold text-[var(--brown-dark)] shadow-[0_12px_28px_rgba(181,117,25,0.2)] transition hover:-translate-y-0.5 hover:bg-[#f5cd61]"
          >
            Abrir mi libro
            <span aria-hidden="true">→</span>
          </Link>
        </div>

        <div className="relative min-h-56 overflow-hidden bg-[#d8bc78] p-8 md:min-h-full">
          <div className="absolute inset-0 bg-[repeating-linear-gradient(92deg,rgba(97,61,30,0.08)_0_1px,transparent_1px_8px)]" />
          <div className="absolute top-[18%] right-[18%] h-[68%] w-[56%] rotate-6 rounded-r-2xl rounded-l-md bg-[#986333] shadow-[0_22px_35px_rgba(74,42,19,0.28)]">
            <div className="absolute inset-3 rounded-r-xl border border-[#efd18b]/70" />
            <div className="absolute top-0 bottom-0 left-0 w-[12%] bg-[#68401f]" />
            <span className="font-display absolute inset-0 grid place-items-center pl-3 text-2xl text-[#f5dfab]">
              Mi día
            </span>
          </div>
          <span className="absolute bottom-6 left-7 rotate-[-14deg] text-4xl" aria-hidden="true">
            🌼
          </span>
        </div>
      </div>
    </section>
  );
}
