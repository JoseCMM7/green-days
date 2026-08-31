"use client";

import { useActionState } from "react";
import {
  deleteAccount,
  type DeleteAccountState,
} from "@/app/account/actions";

const initialState: DeleteAccountState = { status: "idle" };

export function DangerZone() {
  const [state, formAction, pending] = useActionState(deleteAccount, initialState);

  return (
    <section className="mt-7 max-w-2xl rounded-[2rem] border border-[#c98770] bg-[#f4d8c8] p-6 shadow-[0_20px_55px_rgba(91,59,32,0.08)] sm:p-8" aria-labelledby="danger-zone-title">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#8b3e2c]">Zona delicada</p>
      <h2 id="danger-zone-title" className="font-display mt-2 text-3xl font-semibold text-[#5e2c21]">Eliminar mi cuenta</h2>
      <p className="mt-3 max-w-xl text-sm leading-6 text-[#72483d]">
        Se eliminarán tu identidad, entradas, emociones, cápsulas, álbumes y personalización. Descarga primero una copia si quieres conservar tus recuerdos. Esta acción no se puede deshacer.
      </p>

      <form action={formAction} className="mt-6">
        <label htmlFor="delete-confirmation" className="text-sm font-bold text-[#5e2c21]">
          Escribe <span className="font-mono">ELIMINAR</span> para confirmar
        </label>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row">
          <input
            id="delete-confirmation"
            name="confirmation"
            autoComplete="off"
            spellCheck={false}
            disabled={pending}
            className="min-w-0 flex-1 rounded-2xl border border-[#bd7964] bg-[#fff5ed] px-4 py-3 outline-none focus:border-[#853825] focus:ring-4 focus:ring-[#d99a84]/35"
          />
          <button
            type="submit"
            disabled={pending}
            className="rounded-full bg-[#853825] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#6f2d20] disabled:cursor-wait disabled:opacity-60"
          >
            {pending ? "Eliminando…" : "Eliminar definitivamente"}
          </button>
        </div>
        {state.message && (
          <p className="mt-3 text-sm font-semibold text-[#7a2f20]" aria-live="polite">{state.message}</p>
        )}
      </form>
    </section>
  );
}

