import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteCapsuleAction, openCapsuleAction } from "@/app/capsules/actions";
import { FeaturePageShell } from "@/components/feature-page-shell";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { canOpenCapsule, daysUntilCapsule } from "@/features/capsules/model";
import { getCapsule } from "@/features/capsules/service";
import { requireUser } from "@/lib/auth/current-user";

export const metadata: Metadata = { title: "Tu cápsula — Green Days" };
export const dynamic = "force-dynamic";
const seals: Record<string, string> = { flower: "🌼", star: "⭐", heart: "🤎", leaf: "🍂" };

export default async function CapsulePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const result = await getCapsule(user.id, id);
  if (!result || !result.document) notFound();
  const { capsule, document } = result;
  const opened = capsule.status === "unlocked";
  const ready = canOpenCapsule(capsule.unlocksAt);
  const openAction = openCapsuleAction.bind(null, id);
  const removeAction = deleteCapsuleAction.bind(null, id);

  return (
    <FeaturePageShell eyebrow={opened ? "Un recuerdo recuperado" : "Guardada con cuidado"} title={capsule.title} description={opened ? "Este mensaje cruzó el tiempo para volver a ti." : ready ? "La espera terminó. Puedes romper el sello cuando quieras." : `Faltan ${daysUntilCapsule(capsule.unlocksAt)} días para abrirla.`} action={<Link href="/capsules" className="rounded-full border border-[var(--brown-light)] bg-[var(--paper)] px-5 py-3 text-sm font-bold">Volver</Link>}>
      <div className="mx-auto max-w-4xl">
        <article className={`relative overflow-hidden rounded-[2rem] border border-[var(--line)] p-7 shadow-[0_24px_70px_rgba(91,59,32,0.16)] sm:p-12 ${opened ? "rotate-0" : "rotate-[-0.5deg]"}`} style={{ backgroundColor: document.presentation.paperColor }}>
          <div className="absolute right-7 top-7 text-5xl" aria-hidden="true">{seals[document.presentation.sealStickerId ?? ""] ?? "✉️"}</div>
          {opened ? <p className="whitespace-pre-wrap font-display max-w-3xl text-xl leading-9 text-[var(--brown-dark)] sm:text-2xl">{document.message}</p> : <div className="grid min-h-72 place-items-center text-center"><div><div className="text-7xl" aria-hidden="true">🔒</div><p className="mt-5 font-display text-3xl font-semibold">El mensaje sigue sellado</p></div></div>}
        </article>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          {result.sourceEntryDate && <Link href={`/journal/${result.sourceEntryDate}`} className="rounded-full border border-[var(--brown-light)] bg-[var(--paper)] px-6 py-3 text-sm font-bold">Abrir entrada vinculada</Link>}
          {!opened && ready && <form action={openAction}><button className="rounded-full bg-[var(--yellow)] px-6 py-3 text-sm font-bold text-[var(--brown-dark)]">Romper el sello</button></form>}
          <form action={removeAction}><ConfirmSubmitButton message="¿Eliminar esta cápsula definitivamente?" className="rounded-full border border-[#bd7964] bg-[#f4d8c8] px-6 py-3 text-sm font-bold text-[#6f2d20]">Eliminar cápsula</ConfirmSubmitButton></form>
        </div>
      </div>
    </FeaturePageShell>
  );
}
