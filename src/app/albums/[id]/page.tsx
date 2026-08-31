import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { addAlbumEntryAction, deleteAlbumAction, removeAlbumEntryAction, updateAlbumPresentationAction } from "@/app/albums/actions";
import { FeaturePageShell } from "@/components/feature-page-shell";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { getAlbumDetail } from "@/features/albums/service";
import { requireUser } from "@/lib/auth/current-user";

export const metadata: Metadata = { title: "Tu álbum — Green Days" };
export const dynamic = "force-dynamic";
const dateFormatter = new Intl.DateTimeFormat("es-MX", { dateStyle: "long", timeZone: "UTC" });

export default async function AlbumPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const detail = await getAlbumDetail(user.id, id);
  if (!detail) notFound();
  const { album, presentation, entries, candidates } = detail;
  const addAction = addAlbumEntryAction.bind(null, id);
  const updateAction = updateAlbumPresentationAction.bind(null, id);
  const removeAlbum = deleteAlbumAction.bind(null, id);

  return (
    <FeaturePageShell eyebrow={album.autoRule ? "Álbum vivo · regla activa" : "Colección personal"} title={album.title} description={album.description || "Una colección de momentos que elegiste conservar juntos."} action={<Link href="/albums" className="rounded-full border border-[var(--brown-light)] bg-[var(--paper)] px-5 py-3 text-sm font-bold">Volver</Link>}>
      <div className="grid gap-7 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <section className={`grid gap-5 ${presentation?.layout === "film" ? "md:grid-cols-2" : presentation?.layout === "storybook" ? "md:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-3"}`} aria-label="Momentos del álbum">
          {entries.length === 0 ? <p className="col-span-full rounded-[1.8rem] border border-[var(--line)] bg-[var(--paper)] p-8 text-center text-[var(--muted)]">Todavía no hay momentos que coincidan. Puedes añadir uno desde el panel.</p> : entries.map((entry, index) => (
            <article key={entry.id} className={`rounded-[1.6rem] border border-[var(--line)] bg-[var(--paper)] p-6 shadow-[0_16px_40px_rgba(91,59,32,0.1)] ${presentation?.layout === "scrapbook" && index % 2 ? "rotate-1" : "-rotate-[0.3deg]"}`} style={{ borderTopColor: entry.dayColor ?? presentation?.accentColor ?? "var(--ochre)", borderTopWidth: 8 }}>
              <p className="text-xs font-bold uppercase tracking-[0.13em] text-[var(--ochre)]">{dateFormatter.format(new Date(`${entry.entryDate}T12:00:00Z`))}</p>
              <h2 className="font-display mt-3 text-2xl font-semibold">{entry.title || "Mi día"}</h2>
              <Link href={`/journal/${entry.entryDate}`} className="mt-4 inline-flex text-xs font-bold text-[var(--ochre)] underline underline-offset-4">Abrir el libro</Link>
              {!album.autoRule && <form action={removeAlbumEntryAction.bind(null, id, entry.id)} className="mt-5"><button className="text-xs font-bold text-[var(--brown)] underline decoration-[var(--brown-light)] underline-offset-4">Quitar del álbum</button></form>}
            </article>
          ))}
        </section>
        <aside className="space-y-5">
          <section className="rounded-[1.8rem] border border-[var(--line)] bg-[var(--paper)] p-6">
            <h2 className="font-display text-2xl font-semibold">Añadir un momento</h2>
            {album.autoRule && <p className="mt-2 text-sm leading-6 text-[var(--muted)]">La regla automática conservará aquí cada entrada que coincida. También puedes añadir otras a mano.</p>}
            {candidates.length ? <form action={addAction} className="mt-4 grid gap-3"><select name="entryId" required className="rounded-2xl border border-[var(--line)] bg-[#fff8e8] px-4 py-3 text-sm">{candidates.map((entry) => <option value={entry.id} key={entry.id}>{entry.entryDate} · {entry.title || "Mi día"}</option>)}</select><button className="rounded-full bg-[var(--yellow)] px-5 py-3 text-sm font-bold">Añadir</button></form> : <p className="mt-3 text-sm leading-6 text-[var(--muted)]">Todas tus entradas disponibles ya están aquí.</p>}
          </section>
          <section className="rounded-[1.8rem] border border-[var(--line)] bg-[var(--paper)] p-6">
            <h2 className="font-display text-2xl font-semibold">Presentación</h2>
            <form action={updateAction} className="mt-4 grid gap-4"><label className="grid gap-2 text-sm font-bold">Diseño<select name="layout" defaultValue={presentation?.layout ?? "scrapbook"} className="rounded-2xl border border-[var(--line)] bg-[#fff8e8] px-4 py-3 font-normal"><option value="scrapbook">Recortes</option><option value="film">Película</option><option value="storybook">Libro ilustrado</option></select></label><label className="grid gap-2 text-sm font-bold">Color<input type="color" name="accentColor" defaultValue={presentation?.accentColor ?? "#b8781d"} className="h-12 w-full rounded-xl border border-[var(--line)] p-1" /></label><button className="rounded-full border border-[var(--brown-light)] px-5 py-3 text-sm font-bold">Guardar estilo</button></form>
          </section>
          <form action={removeAlbum}><ConfirmSubmitButton message="¿Eliminar este álbum? Tus entradas seguirán en el diario." className="w-full rounded-full border border-[#bd7964] bg-[#f4d8c8] px-5 py-3 text-sm font-bold text-[#6f2d20]">Eliminar álbum</ConfirmSubmitButton></form>
        </aside>
      </div>
    </FeaturePageShell>
  );
}
