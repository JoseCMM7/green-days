import type { Metadata } from "next";
import Link from "next/link";
import { CapsuleComposer } from "@/components/capsules/capsule-composer";
import { FeaturePageShell } from "@/components/feature-page-shell";
import { daysUntilCapsule } from "@/features/capsules/model";
import { listCapsules } from "@/features/capsules/service";
import { listJournalEntryChoices } from "@/features/journal/service";
import { requireUser } from "@/lib/auth/current-user";

export const metadata: Metadata = { title: "Cápsulas del tiempo — Green Days" };
export const dynamic = "force-dynamic";

const dateFormatter = new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

export default async function CapsulesPage({ searchParams }: { searchParams: Promise<{ entry?: string }> }) {
  const user = await requireUser();
  const [{ entry: requestedEntry }, capsules, entries] = await Promise.all([
    searchParams,
    listCapsules(user.id),
    listJournalEntryChoices(user.id),
  ]);
  const defaultSourceEntryId = entries.some((entry) => entry.id === requestedEntry) ? requestedEntry : undefined;
  const next = capsules.find((item) => item.status === "sealed");

  return (
    <FeaturePageShell eyebrow="Mensajes que sabrán esperar" title="Cápsulas del tiempo" description="Escribe para tu yo del futuro y decide cuándo podrás volver a encontrar esas palabras.">
      <div className="grid gap-7 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-7">
          <CapsuleComposer entries={entries} defaultSourceEntryId={defaultSourceEntryId} />
          <section className="rounded-[1.8rem] border border-[var(--line)] bg-[var(--paper)] p-6 shadow-[0_18px_50px_rgba(91,59,32,0.1)] sm:p-8" aria-labelledby="sealed-capsules-title">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--ochre)]">Tu correspondencia en el tiempo</p>
            <h2 id="sealed-capsules-title" className="font-display mt-1 text-3xl font-semibold">Cápsulas guardadas</h2>
            {capsules.length === 0 ? (
              <p className="mt-6 rounded-2xl bg-[#f5e5c1] p-5 leading-7 text-[var(--muted)]">Todavía no hay ninguna. La primera puede ser una nota pequeña para una fecha importante.</p>
            ) : (
              <div className="mt-7 space-y-4">
                {capsules.map((capsule) => {
                  const ready = daysUntilCapsule(capsule.unlocksAt) === 0;
                  return (
                    <Link href={`/capsules/${capsule.id}`} key={capsule.id} className="flex flex-col gap-5 rounded-[1.4rem] border border-[var(--line)] bg-[#f5e5c1] p-5 transition hover:-translate-y-0.5 hover:shadow-lg sm:flex-row sm:items-center">
                      <div className="grid min-h-16 w-20 shrink-0 place-items-center rounded-2xl bg-[var(--yellow)] px-2 text-center text-[var(--brown-dark)]"><span className="font-display text-base leading-5 font-bold">{dateFormatter.format(capsule.unlocksAt)}</span></div>
                      <div className="min-w-0 flex-1"><h3 className="font-display truncate text-2xl font-semibold">{capsule.title}</h3><p className="mt-1 text-sm text-[var(--muted)]">{capsule.status === "unlocked" ? "Abierta" : ready ? "Ya puedes abrirla" : `Faltan ${daysUntilCapsule(capsule.unlocksAt)} días`}</p></div>
                      <span className="rounded-full border border-[var(--brown-light)] px-3 py-1.5 text-xs font-bold text-[var(--brown)]">{capsule.status === "unlocked" ? "Abierta" : ready ? "Lista" : "Sellada"}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>
        </div>
        <aside className="h-fit rounded-[1.8rem] bg-[var(--brown-dark)] p-7 text-[var(--paper)] shadow-[0_18px_45px_rgba(82,50,27,0.2)]">
          <div className="text-5xl" aria-hidden="true">⌛</div><p className="mt-7 text-xs font-bold uppercase tracking-[0.17em] text-[#ecd7b4]">Próxima apertura</p>
          <h2 className="font-display mt-2 text-3xl font-semibold">{next ? `${daysUntilCapsule(next.unlocksAt)} días` : "Sin espera"}</h2>
          <p className="mt-3 leading-7 text-[#ead9c1]">{next ? "Una parte de ti ya está esperando al otro lado del tiempo." : "Crea una cápsula cuando tengas algo que quieras reencontrar."}</p>
        </aside>
      </div>
    </FeaturePageShell>
  );
}
