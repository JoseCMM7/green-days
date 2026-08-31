import Link from "next/link";
import { logout } from "@/app/auth/actions";
import { FeaturePageShell } from "@/components/feature-page-shell";
import { DangerZone } from "@/components/account/danger-zone";
import { requireUser } from "@/lib/auth/current-user";
import { ensureProfile } from "@/lib/auth/profiles";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const user = await requireUser();
  const profile = await ensureProfile({
    id: user.id,
    email: user.email,
    displayName: user.displayName,
  });

  return (
    <FeaturePageShell
      eyebrow="Tu cuenta"
      title="Este espacio te pertenece."
      description="Desde aquí puedes revisar tu identidad, descargar tus recuerdos y controlar tus datos."
    >
      <section className="max-w-2xl rounded-[2rem] border border-[var(--line)] bg-[var(--paper)] p-6 shadow-[0_20px_55px_rgba(91,59,32,0.1)] sm:p-8">
        <dl className="space-y-5">
          <div>
            <dt className="text-xs font-bold uppercase tracking-[0.15em] text-[var(--muted)]">Nombre</dt>
            <dd className="font-display mt-1 text-2xl">{profile.displayName}</dd>
          </div>
          <div>
            <dt className="text-xs font-bold uppercase tracking-[0.15em] text-[var(--muted)]">Correo</dt>
            <dd className="mt-1 text-base">{user.email ?? "Sin correo disponible"}</dd>
          </div>
          <div>
            <dt className="text-xs font-bold uppercase tracking-[0.15em] text-[var(--muted)]">Zona horaria</dt>
            <dd className="mt-1 text-base">{profile.timeZone}</dd>
          </div>
        </dl>
        <div className="mt-8 border-t border-[var(--line)] pt-6">
          <h2 className="font-display text-2xl font-semibold">Una copia de tus recuerdos</h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-[var(--muted)]">
            Descarga un archivo JSON con tu perfil, entradas, emociones y contenido visual. El archivo puede contener información muy personal: guárdalo en un lugar seguro.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <a href="/api/account/export" download className="rounded-full bg-[var(--yellow)] px-5 py-3 text-sm font-bold text-[var(--brown-dark)] transition hover:-translate-y-0.5">
              Descargar mis datos
            </a>
            <Link href="/privacy" className="rounded-full border border-[var(--brown-light)] bg-[#fff3d4] px-5 py-3 text-sm font-bold text-[var(--brown)] transition hover:bg-[var(--yellow-soft)]">
              Cómo protegemos tus datos
            </Link>
            <Link href="/personalization" className="rounded-full border border-[var(--brown-light)] bg-[#fff3d4] px-5 py-3 text-sm font-bold text-[var(--brown)] transition hover:bg-[var(--yellow-soft)]">
              Personalizar mi espacio
            </Link>
            <form action={logout}>
              <button className="rounded-full border border-[var(--brown-light)] bg-[#fff3d4] px-5 py-3 text-sm font-bold text-[var(--brown)] transition hover:bg-[var(--yellow-soft)]">
                Cerrar sesión
              </button>
            </form>
          </div>
        </div>
      </section>
      <DangerZone />
    </FeaturePageShell>
  );
}
