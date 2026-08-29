import type { Metadata } from "next";
import { FeaturePageShell } from "@/components/feature-page-shell";

export const metadata: Metadata = {
  title: "Mi refugio — Green Days",
};

const comforts = [
  { icon: "🏡", title: "Cosas que me hacen sentir en casa", count: "5 recuerdos" },
  { icon: "💌", title: "Cartas para días difíciles", count: "2 cartas" },
  { icon: "📷", title: "Fotografías que me dan calma", count: "8 fotografías" },
];

export default function RefugePage() {
  return (
    <FeaturePageShell
      eyebrow="Una pausa sin exigencias"
      title="Tu refugio"
      description="Este espacio no tiene metas ni rachas. Es un lugar para respirar y acercarte a aquello que te hace sentir seguro."
    >
      <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_24rem]">
        <section className="rounded-[1.8rem] bg-[var(--brown-dark)] p-7 text-[var(--paper)] shadow-[0_22px_60px_rgba(82,50,27,0.22)] sm:p-10" aria-labelledby="breathing-title">
          <div className="flex min-h-[21rem] flex-col items-center justify-center text-center">
            <div className="grid size-36 place-items-center rounded-full border border-[#e9c85d]/60 bg-[#e9c85d]/10 shadow-[0_0_0_22px_rgba(233,200,93,0.06),0_0_0_44px_rgba(233,200,93,0.03)]">
              <span className="text-5xl" aria-hidden="true">☀️</span>
            </div>
            <p className="mt-10 text-xs font-bold uppercase tracking-[0.2em] text-[#ecd7b4]">Respira despacio</p>
            <h2 id="breathing-title" className="font-display mt-2 text-4xl font-semibold tracking-[-0.03em]">Estás aquí.</h2>
            <p className="mt-3 max-w-md leading-7 text-[#ead9c1]">Inhala con calma. No tienes que resolverlo todo en este momento.</p>
          </div>
        </section>

        <section className="rounded-[1.8rem] border border-[var(--line)] bg-[var(--paper)] p-6 shadow-[0_18px_50px_rgba(91,59,32,0.1)]" aria-labelledby="comforts-title">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--ochre)]">Cerca de ti</p>
          <h2 id="comforts-title" className="font-display mt-1 text-3xl font-semibold tracking-[-0.03em]">Tus lugares seguros</h2>
          <div className="mt-6 space-y-3">
            {comforts.map((comfort) => (
              <article key={comfort.title} className="rounded-[1.25rem] border border-[var(--line)] bg-[#f5e5c1] p-4">
                <span className="text-2xl" aria-hidden="true">{comfort.icon}</span>
                <h3 className="mt-3 font-semibold leading-5 text-[var(--brown-dark)]">{comfort.title}</h3>
                <p className="mt-1 text-sm text-[var(--muted)]">{comfort.count}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </FeaturePageShell>
  );
}
