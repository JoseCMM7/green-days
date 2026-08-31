"use client";

import { useActionState } from "react";
import { createAlbumAction, type AlbumActionState } from "@/app/albums/actions";
import { moodCatalog } from "@/features/calendar/moods";

const initialState: AlbumActionState = { status: "idle" };

export function AlbumComposer() {
  const [state, action, pending] = useActionState(createAlbumAction, initialState);
  return (
    <section className="rounded-[1.8rem] border border-[var(--line)] bg-[var(--paper)] p-6 shadow-[0_18px_50px_rgba(91,59,32,0.1)] sm:p-8" aria-labelledby="new-album-title">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--ochre)]">Una colección con vida propia</p>
      <h2 id="new-album-title" className="font-display mt-1 text-3xl font-semibold">Crear un álbum</h2>
      <form action={action} className="mt-6 grid gap-5">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-2 text-sm font-bold">Título<input name="title" required maxLength={120} placeholder="Días que olían a verano" className="rounded-2xl border border-[var(--line)] bg-[#fff8e8] px-4 py-3 font-normal" /></label>
          <label className="grid gap-2 text-sm font-bold">Descripción<input name="description" maxLength={500} placeholder="Una colección para volver aquí" className="rounded-2xl border border-[var(--line)] bg-[#fff8e8] px-4 py-3 font-normal" /></label>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="grid gap-2 text-sm font-bold">Diseño<select name="layout" defaultValue="scrapbook" className="rounded-2xl border border-[var(--line)] bg-[#fff8e8] px-4 py-3 font-normal"><option value="scrapbook">Recortes</option><option value="film">Película</option><option value="storybook">Libro ilustrado</option></select></label>
          <label className="grid gap-2 text-sm font-bold">Color<input name="accentColor" type="color" defaultValue="#b8781d" className="h-12 w-full rounded-2xl border border-[var(--line)] bg-[#fff8e8] p-1" /></label>
          <label className="grid gap-2 text-sm font-bold">Desde<input name="fromDate" type="date" className="rounded-2xl border border-[var(--line)] bg-[#fff8e8] px-4 py-3 font-normal" /></label>
          <label className="grid gap-2 text-sm font-bold">Hasta<input name="toDate" type="date" className="rounded-2xl border border-[var(--line)] bg-[#fff8e8] px-4 py-3 font-normal" /></label>
        </div>
        <label className="grid max-w-sm gap-2 text-sm font-bold">Emoción automática
          <select name="emotionSlug" defaultValue="" className="rounded-2xl border border-[var(--line)] bg-[#fff8e8] px-4 py-3 font-normal"><option value="">Cualquier emoción</option>{moodCatalog.map((mood) => <option key={mood.slug} value={mood.slug}>{mood.icon} {mood.name}</option>)}</select>
        </label>
        <p className="text-sm leading-6 text-[var(--muted)]">Las fechas y la emoción son opcionales. Si eliges alguna, las entradas que coincidan se añadirán automáticamente cada vez que visites el álbum.</p>
        <div className="flex flex-wrap items-center gap-4"><button disabled={pending} className="rounded-full bg-[var(--yellow)] px-6 py-3 text-sm font-bold text-[var(--brown-dark)] disabled:opacity-60">{pending ? "Creando…" : "Crear álbum"}</button>{state.message && <p role="status" className={`text-sm font-semibold ${state.status === "error" ? "text-[#8b3e2c]" : "text-[var(--sage-dark)]"}`}>{state.message}</p>}</div>
      </form>
    </section>
  );
}
