import type { Metadata } from "next";
import Link from "next/link";
import { AlbumComposer } from "@/components/albums/album-composer";
import { FeaturePageShell } from "@/components/feature-page-shell";
import { listAlbums } from "@/features/albums/service";
import { requireUser } from "@/lib/auth/current-user";

export const metadata: Metadata = { title: "Álbumes vivos — Green Days" };
export const dynamic = "force-dynamic";

const layoutEmoji = { scrapbook: "✂️", film: "🎞️", storybook: "📖" } as const;

export default async function AlbumsPage() {
  const user = await requireUser();
  const albums = await listAlbums(user.id);
  return (
    <FeaturePageShell eyebrow="Recuerdos que siguen creciendo" title="Álbumes vivos" description="Reúne momentos por etapas, emociones o fechas. Puedes añadirlos a mano o dejar que una regla encuentre nuevas entradas.">
      <div className="space-y-8">
        <AlbumComposer />
        {albums.length === 0 ? (
          <p className="rounded-[1.8rem] border border-[var(--line)] bg-[var(--paper)] p-8 text-center leading-7 text-[var(--muted)]">Tu estantería está esperando su primer álbum.</p>
        ) : (
          <section aria-label="Tus álbumes" className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {albums.map((album) => (
              <Link href={`/albums/${album.id}`} key={album.id} className="group overflow-hidden rounded-[1.8rem] border border-[var(--line)] bg-[var(--paper)] shadow-[0_18px_50px_rgba(91,59,32,0.1)] transition hover:-translate-y-1">
                <div className="relative flex min-h-52 items-end overflow-hidden p-6" style={{ background: `linear-gradient(145deg, ${album.presentation?.accentColor ?? "#d8aa3c"}, var(--brown-dark))` }}>
                  <div className="absolute right-8 top-7 text-6xl transition group-hover:-rotate-6 group-hover:scale-110" aria-hidden="true">{layoutEmoji[album.presentation?.layout ?? "scrapbook"]}</div>
                  <div className="absolute -bottom-32 -left-8 size-56 rounded-full bg-white/10" />
                  {album.autoRule && <span className="relative rounded-full bg-[#fff5d9]/90 px-3 py-1 text-xs font-bold text-[var(--brown-dark)]">Se actualiza solo</span>}
                </div>
                <div className="p-6"><h2 className="font-display text-2xl font-semibold">{album.title}</h2><p className="mt-2 text-sm text-[var(--muted)]">{album.entryCount} {album.entryCount === 1 ? "momento" : "momentos"}</p>{album.description && <p className="mt-3 line-clamp-2 text-sm leading-6 text-[var(--muted)]">{album.description}</p>}</div>
              </Link>
            ))}
          </section>
        )}
      </div>
    </FeaturePageShell>
  );
}
