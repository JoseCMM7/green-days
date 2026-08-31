import type { Metadata } from "next";
import Link from "next/link";
import { FeaturePageShell } from "@/components/feature-page-shell";
import { requireUser } from "@/lib/auth/current-user";

export const metadata: Metadata = { title: "Privacidad — Green Days" };
export const dynamic = "force-dynamic";

const sections = [
  ["Qué guardamos", "Tu identidad y las fechas viven en PostgreSQL. El contenido visual de los libros vive en MongoDB. Las fotografías y audios usarán Storage cuando ese módulo sea construido."],
  ["Quién puede verlo", "Cada petición exige una sesión válida. Las políticas RLS aíslan las filas por usuario y las API responden con caché privado desactivado."],
  ["Tus decisiones", "Puedes descargar una copia desde Tu cuenta y solicitar la eliminación definitiva escribiendo una confirmación explícita."],
  ["Lo que no hacemos", "Green Days no publica tus entradas, no tiene perfiles sociales y no utiliza tus recuerdos para mostrar publicidad."],
] as const;

export default async function PrivacyPage() {
  await requireUser();

  return (
    <FeaturePageShell eyebrow="Privacidad por diseño" title="Tus recuerdos siguen siendo tuyos." description="Esta página describe el comportamiento técnico actual de Green Days; se actualizará cada vez que integremos una nueva clase de datos.">
      <div className="grid gap-4 md:grid-cols-2">
        {sections.map(([title, description]) => (
          <section key={title} className="rounded-[1.6rem] border border-[var(--line)] bg-[var(--paper)] p-6 shadow-[0_16px_45px_rgba(91,59,32,0.08)]">
            <h2 className="font-display text-2xl font-semibold">{title}</h2>
            <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{description}</p>
          </section>
        ))}
      </div>
      <Link href="/account" className="mt-7 inline-flex rounded-full border border-[var(--brown-light)] bg-[#fff3d4] px-5 py-3 text-sm font-bold text-[var(--brown)]">Administrar mis datos</Link>
    </FeaturePageShell>
  );
}
