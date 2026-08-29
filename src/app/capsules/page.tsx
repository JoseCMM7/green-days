import type { Metadata } from "next";
import { FeaturePageShell } from "@/components/feature-page-shell";

export const metadata: Metadata = {
  title: "Cápsulas del tiempo — Green Days",
};

const capsules = [
  { date: "31 dic", title: "Para mi yo de fin de año", detail: "Se abrirá dentro de 4 meses", accent: "bg-[#e9b83e]" },
  { date: "14 feb", title: "Todo lo que aprendí este año", detail: "Se abrirá en febrero de 2027", accent: "bg-[#c99b76]" },
];

export default function CapsulesPage() {
  return (
    <FeaturePageShell
      eyebrow="Mensajes que sabrán esperar"
      title="Cápsulas del tiempo"
      description="Escribe para tu yo del futuro, guarda fotografías o elige un recuerdo y decide cuándo quieres volver a encontrarlo."
      action={<button type="button" className="w-fit rounded-full bg-[var(--yellow)] px-6 py-3 text-sm font-bold text-[var(--brown-dark)] shadow-[0_10px_24px_rgba(179,120,26,0.18)]">Crear una cápsula</button>}
    >
      <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <section className="rounded-[1.8rem] border border-[var(--line)] bg-[var(--paper)] p-6 shadow-[0_18px_50px_rgba(91,59,32,0.1)] sm:p-8" aria-labelledby="sealed-capsules-title">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--ochre)]">Esperando por ti</p>
          <h2 id="sealed-capsules-title" className="font-display mt-1 text-3xl font-semibold tracking-[-0.03em]">Cápsulas selladas</h2>

          <div className="mt-7 space-y-4">
            {capsules.map((capsule) => (
              <article key={capsule.title} className="flex flex-col gap-5 rounded-[1.4rem] border border-[var(--line)] bg-[#f5e5c1] p-5 sm:flex-row sm:items-center">
                <div className={`grid size-16 shrink-0 place-items-center rounded-2xl ${capsule.accent} text-center text-[var(--brown-dark)]`}>
                  <span className="font-display text-lg leading-5 font-bold">{capsule.date}</span>
                </div>
                <div>
                  <h3 className="font-display text-2xl font-semibold tracking-[-0.025em]">{capsule.title}</h3>
                  <p className="mt-1 text-sm text-[var(--muted)]">{capsule.detail}</p>
                </div>
                <span className="ml-auto rounded-full border border-[var(--brown-light)] px-3 py-1.5 text-xs font-bold text-[var(--brown)]">Sellada</span>
              </article>
            ))}
          </div>
        </section>

        <aside className="rounded-[1.8rem] bg-[var(--brown-dark)] p-7 text-[var(--paper)] shadow-[0_18px_45px_rgba(82,50,27,0.2)]">
          <div className="text-5xl" aria-hidden="true">⌛</div>
          <p className="mt-7 text-xs font-bold uppercase tracking-[0.17em] text-[#ecd7b4]">Próxima apertura</p>
          <h2 className="font-display mt-2 text-3xl font-semibold">Faltan 125 días</h2>
          <p className="mt-3 leading-7 text-[#ead9c1]">Una pequeña parte de ti ya está esperando al otro lado del tiempo.</p>
        </aside>
      </div>
    </FeaturePageShell>
  );
}
