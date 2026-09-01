import Link from "next/link";
import { logout } from "@/app/auth/actions";
import { cleanupUnusedMedia } from "@/app/account/actions";
import { FeaturePageShell } from "@/components/feature-page-shell";
import { DangerZone } from "@/components/account/danger-zone";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { formatStorageBytes } from "@/features/media/model";
import { getUserStorageUsage } from "@/features/media/service";
import { requireUser } from "@/lib/auth/current-user";
import { ensureProfile } from "@/lib/auth/profiles";

export const dynamic = "force-dynamic";

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ cleaned?: string; freed?: string; cleanupError?: string }> }) {
  const user = await requireUser();
  const query = await searchParams;
  const [profile, storage] = await Promise.all([
    ensureProfile({ id: user.id, email: user.email, displayName: user.displayName }),
    getUserStorageUsage(user.id),
  ]);

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
        <div className="mt-8 rounded-2xl border border-[var(--line)] bg-[#fff6df] p-5">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div><p className="text-xs font-bold uppercase tracking-[0.15em] text-[var(--muted)]">Archivos privados</p><p className="mt-1 font-display text-2xl font-semibold">{formatStorageBytes(storage.usedBytes)} utilizados</p></div>
            <p className="text-sm text-[var(--muted)]">de {formatStorageBytes(storage.limitBytes)}</p>
          </div>
          <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-[#e4d0a5]" role="progressbar" aria-label="Almacenamiento privado utilizado" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(storage.percentage)}>
            <span className="block h-full rounded-full bg-[var(--ochre)]" style={{ width: `${storage.usedBytes > 0 ? Math.max(1, storage.percentage) : 0}%` }} />
          </div>
          <p className="mt-3 text-xs leading-5 text-[var(--muted)]">Las fotografías se optimizan antes de guardarse. Los archivos retirados del libro permanecen privados mientras una versión histórica todavía pueda necesitarlos.</p>
          {query.cleaned !== undefined && <p role="status" className="mt-3 rounded-xl bg-[#dce5c2] px-3 py-2 text-xs font-semibold text-[#435138]">Limpieza terminada: {Number(query.cleaned) || 0} archivos · {formatStorageBytes(Number(query.freed) || 0)} liberados.</p>}
          {query.cleanupError === "1" && <p role="alert" className="mt-3 rounded-xl bg-[#f5d5c5] px-3 py-2 text-xs font-semibold text-[#853825]">No pudimos completar la limpieza. Ninguna referencia histórica fue eliminada.</p>}
          <form action={cleanupUnusedMedia} className="mt-4"><ConfirmSubmitButton message="Se borrarán permanentemente sólo archivos con más de 24 horas que no aparezcan en el libro actual, versiones, cápsulas ni álbumes. ¿Continuar?" className="rounded-full border border-[var(--brown-light)] bg-[var(--paper)] px-4 py-2 text-xs font-bold text-[var(--brown)]">Limpiar archivos sin uso</ConfirmSubmitButton></form>
        </div>
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
