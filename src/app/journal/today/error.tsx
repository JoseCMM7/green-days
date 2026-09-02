"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function TodayJournalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="grid min-h-[68vh] place-items-center px-5 pb-28 pt-10 lg:pb-14">
      <section className="w-full max-w-xl rounded-[2rem] border border-[var(--line)] bg-[var(--paper)] p-7 text-center shadow-[0_24px_65px_rgba(91,59,32,0.13)] sm:p-10">
        <span className="text-5xl" aria-hidden="true">📖</span>
        <p className="mt-5 text-xs font-bold uppercase tracking-[0.18em] text-[var(--ochre)]">El libro sigue a salvo</p>
        <h1 className="font-display mt-2 text-3xl font-semibold tracking-[-0.035em]">Las páginas tardaron demasiado en abrir.</h1>
        <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-[var(--muted)]">
          La conexión puede haberse interrumpido por un momento. Vuelve a intentarlo; no se perdió ninguna entrada.
        </p>
        {process.env.NODE_ENV === "development" && (
          <p className="mx-auto mt-3 max-w-md border-l-4 border-[var(--ochre)] bg-[#fff6df] px-4 py-3 text-left text-xs font-semibold leading-5 text-[var(--brown)]">
            Revisión local: confirma en MongoDB Atlas que el clúster esté activo y que tu IP actual aparezca en Security → Network Access.
          </p>
        )}
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => retry()}
            className="rounded-full bg-[var(--yellow)] px-6 py-3 text-sm font-bold text-[var(--brown-dark)] shadow-sm transition hover:-translate-y-0.5"
          >
            Volver a abrir
          </button>
          <Link href="/" className="rounded-full border border-[var(--brown-light)] bg-[#fff6df] px-6 py-3 text-sm font-bold text-[var(--brown)]">
            Regresar al inicio
          </Link>
        </div>
      </section>
    </main>
  );
}
