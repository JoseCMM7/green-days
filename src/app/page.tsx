import { DailyEntryCard } from "@/components/daily-entry-card";
import { MonthCalendar } from "@/components/month-calendar";
import { dateInTimeZone, formatEntryDate } from "@/features/journal/date";
import { requireUser } from "@/lib/auth/current-user";
import { ensureProfile } from "@/lib/auth/profiles";

export const dynamic = "force-dynamic";

function SparkleIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none">
      <path
        d="M12 2.75c.65 4.42 2.83 6.6 7.25 7.25-4.42.65-6.6 2.83-7.25 7.25C11.35 12.83 9.17 10.65 4.75 10 9.17 9.35 11.35 7.17 12 2.75Z"
        fill="currentColor"
      />
      <path
        d="M19 16.25c.24 1.65 1.1 2.51 2.75 2.75-1.65.24-2.51 1.1-2.75 2.75-.24-1.65-1.1-2.51-2.75-2.75 1.65-.24 2.51-1.1 2.75-2.75Z"
        fill="currentColor"
      />
    </svg>
  );
}

export default async function Home() {
  const user = await requireUser();
  const profile = await ensureProfile({
    id: user.id,
    email: user.email,
    displayName: user.displayName,
  });
  const today = dateInTimeZone(profile.timeZone);

  return (
      <main className="pb-28 pt-9 lg:pb-14 lg:pt-14">
        <div className="mx-auto grid w-full max-w-[92rem] gap-10 px-5 sm:px-8 lg:grid-cols-[minmax(0,1fr)_21rem] lg:px-12 xl:gap-14">
          <section className="min-w-0">
            <div className="mb-8 max-w-2xl lg:mb-10">
              <p className="mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-[var(--brown)]">
                {formatEntryDate(today)}
              </p>
              <h1 className="font-display text-4xl leading-[1.05] font-semibold tracking-[-0.045em] sm:text-5xl lg:text-6xl">
                Qué gusto tenerte aquí, {profile.displayName.split(" ")[0]}.
              </h1>
              <p className="mt-4 max-w-xl text-base leading-7 text-[var(--muted)] sm:text-lg">
                No hace falta que hoy haya sido perfecto. Solo guarda aquello que
                quieras volver a encontrar.
              </p>
            </div>

            <DailyEntryCard />

            <section className="mt-10" aria-labelledby="recent-memory-title">
              <div className="mb-4 flex items-end justify-between gap-4">
                <div>
                  <p className="mb-1 text-xs font-bold uppercase tracking-[0.17em] text-[var(--brown)]">
                    Volver a mirar
                  </p>
                  <h2
                    id="recent-memory-title"
                    className="font-display text-2xl font-semibold tracking-[-0.03em]"
                  >
                    Un recuerdo para ti
                  </h2>
                </div>
                <button
                  type="button"
                  className="hidden text-sm font-semibold text-[var(--brown)] underline decoration-[var(--yellow)] underline-offset-4 sm:block"
                >
                  Ver recuerdos
                </button>
              </div>

              <article className="memory-card group overflow-hidden rounded-[1.75rem] border border-[var(--line)] bg-[var(--paper)] shadow-[0_20px_55px_rgba(91,76,48,0.08)]">
                <div className="grid sm:grid-cols-[15rem_1fr]">
                  <div className="memory-illustration relative min-h-52 overflow-hidden sm:min-h-full">
                    <div className="absolute top-8 left-8 size-20 rounded-full border-2 border-[#aa7925] bg-[#ffd35a]" />
                    <div className="absolute right-[-8%] bottom-[-28%] h-56 w-64 rotate-[-8deg] rounded-[50%] bg-[#9b6a43]" />
                    <div className="absolute bottom-[-34%] left-[-18%] h-56 w-64 rotate-[15deg] rounded-[50%] bg-[#d2a85d]" />
                    <div className="absolute right-8 bottom-7 text-5xl" aria-hidden="true">
                      🌿
                    </div>
                  </div>
                  <div className="flex flex-col justify-center p-6 sm:p-8">
                    <div className="mb-5 flex items-center gap-2 text-[var(--ochre)]">
                      <SparkleIcon />
                      <span className="text-xs font-bold uppercase tracking-[0.14em]">
                        Hace un año
                      </span>
                    </div>
                    <blockquote className="font-display text-2xl leading-snug tracking-[-0.02em] sm:text-[1.7rem]">
                      “Caminé sin prisa y por un momento todo se sintió en su lugar.”
                    </blockquote>
                    <p className="mt-4 text-sm text-[var(--muted)]">
                      28 de agosto de 2025 · Un día tranquilo
                    </p>
                  </div>
                </div>
              </article>
            </section>
          </section>

          <aside className="space-y-7 lg:pt-4">
            <MonthCalendar />

            <section className="rounded-[1.6rem] bg-[var(--brown-dark)] p-6 text-[var(--paper)] shadow-[0_18px_45px_rgba(82,50,27,0.2)]">
              <div className="mb-5 flex size-10 items-center justify-center rounded-full bg-white/10 text-[#f5cb62]">
                <SparkleIcon />
              </div>
              <p className="text-xs font-bold uppercase tracking-[0.17em] text-[#ecd7b4]">
                Tu espacio privado
              </p>
              <h2 className="font-display mt-2 text-2xl font-semibold tracking-[-0.025em]">
                Lo que escribas aquí es solamente tuyo.
              </h2>
              <p className="mt-4 text-sm leading-6 text-[#ecd7b4]">
                La sesión se verifica antes de abrir o guardar cada una de tus páginas.
              </p>
            </section>
          </aside>
        </div>
      </main>
  );
}
