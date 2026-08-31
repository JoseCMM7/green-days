"use client";

import { useActionState } from "react";
import { createCapsuleAction, type CapsuleActionState } from "@/app/capsules/actions";

const initialState: CapsuleActionState = { status: "idle" };

export function CapsuleComposer() {
  const [state, action, pending] = useActionState(createCapsuleAction, initialState);

  return (
    <section className="rounded-[1.8rem] border border-[var(--line)] bg-[var(--paper)] p-6 shadow-[0_18px_50px_rgba(91,59,32,0.1)] sm:p-8" aria-labelledby="new-capsule-title">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--ochre)]">Una carta que sabe esperar</p>
      <h2 id="new-capsule-title" className="font-display mt-1 text-3xl font-semibold">Crear una cápsula</h2>
      <form action={action} className="mt-6 grid gap-5">
        <label className="grid gap-2 text-sm font-bold">Título
          <input name="title" required maxLength={120} className="rounded-2xl border border-[var(--line)] bg-[#fff8e8] px-4 py-3 font-normal" placeholder="Para mi yo de fin de año" />
        </label>
        <label className="grid gap-2 text-sm font-bold">Mensaje
          <textarea name="message" required maxLength={50000} rows={7} className="resize-y rounded-2xl border border-[var(--line)] bg-[#fff8e8] px-4 py-3 font-normal leading-7" placeholder="Quiero que recuerdes…" />
        </label>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="grid gap-2 text-sm font-bold">Abrir el día
            <input name="unlockDate" type="date" required className="rounded-2xl border border-[var(--line)] bg-[#fff8e8] px-4 py-3 font-normal" />
          </label>
          <label className="grid gap-2 text-sm font-bold">Presentación
            <select name="revealStyle" defaultValue="letter" className="rounded-2xl border border-[var(--line)] bg-[#fff8e8] px-4 py-3 font-normal">
              <option value="letter">Carta</option><option value="box">Caja</option><option value="book">Libro</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm font-bold">Papel
            <input name="paperColor" type="color" defaultValue="#f9edd1" className="h-12 w-full rounded-2xl border border-[var(--line)] bg-[#fff8e8] p-1" />
          </label>
          <label className="grid gap-2 text-sm font-bold">Sello
            <select name="sealStickerId" defaultValue="flower" className="rounded-2xl border border-[var(--line)] bg-[#fff8e8] px-4 py-3 font-normal">
              <option value="flower">🌼 Flor</option><option value="star">⭐ Estrella</option><option value="heart">🤎 Corazón</option><option value="leaf">🍂 Hoja</option>
            </select>
          </label>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <button disabled={pending} className="rounded-full bg-[var(--yellow)] px-6 py-3 text-sm font-bold text-[var(--brown-dark)] disabled:opacity-60">{pending ? "Sellando…" : "Sellar cápsula"}</button>
          {state.message && <p role="status" className={`text-sm font-semibold ${state.status === "error" ? "text-[#8b3e2c]" : "text-[var(--sage-dark)]"}`}>{state.message}</p>}
        </div>
      </form>
    </section>
  );
}
