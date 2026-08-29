import type { Metadata } from "next";
import { FeaturePageShell } from "@/components/feature-page-shell";

export const metadata: Metadata = {
  title: "Álbumes vivos — Green Days",
};

const albums = [
  { title: "Verano de 2026", detail: "12 momentos", emoji: "☀️", colors: "from-[#e7b83f] to-[#c88646]" },
  { title: "Días con mi familia", detail: "8 momentos", emoji: "🏡", colors: "from-[#b98b62] to-[#79503a]" },
  { title: "Lugares donde estuve en paz", detail: "5 momentos", emoji: "🌾", colors: "from-[#b8ad72] to-[#7d815c]" },
];

export default function AlbumsPage() {
  return (
    <FeaturePageShell
      eyebrow="Recuerdos que siguen creciendo"
      title="Álbumes vivos"
      description="Reúne momentos por personas, etapas o lugares. Un álbum vivo podrá incorporar nuevas entradas cuando coincidan con sus reglas."
      action={<button type="button" className="w-fit rounded-full bg-[var(--yellow)] px-6 py-3 text-sm font-bold text-[var(--brown-dark)] shadow-[0_10px_24px_rgba(179,120,26,0.18)]">Crear álbum</button>}
    >
      <section aria-label="Tus álbumes" className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {albums.map((album) => (
          <article key={album.title} className="group overflow-hidden rounded-[1.8rem] border border-[var(--line)] bg-[var(--paper)] shadow-[0_18px_50px_rgba(91,59,32,0.1)]">
            <div className={`relative flex min-h-56 items-end overflow-hidden bg-gradient-to-br ${album.colors} p-6`}>
              <div className="absolute top-7 right-8 text-6xl transition group-hover:-rotate-6 group-hover:scale-110" aria-hidden="true">{album.emoji}</div>
              <div className="absolute -right-10 -bottom-24 size-56 rounded-full bg-white/10" />
              <div className="absolute -bottom-32 -left-8 size-56 rounded-full bg-[#4e321f]/20" />
            </div>
            <div className="p-6">
              <h2 className="font-display text-2xl font-semibold tracking-[-0.025em]">{album.title}</h2>
              <p className="mt-2 text-sm text-[var(--muted)]">{album.detail}</p>
            </div>
          </article>
        ))}
      </section>
    </FeaturePageShell>
  );
}
