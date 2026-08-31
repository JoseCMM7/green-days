import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-[70vh] place-items-center px-5 pb-28 pt-10 lg:pb-14">
      <section className="max-w-xl rounded-[2rem] border border-[var(--line)] bg-[var(--paper)] p-8 text-center shadow-[0_24px_65px_rgba(91,59,32,0.12)]">
        <span className="text-5xl" aria-hidden="true">🍂</span>
        <p className="mt-5 text-xs font-bold uppercase tracking-[0.18em] text-[var(--ochre)]">Página no encontrada</p>
        <h1 className="font-display mt-2 text-4xl font-semibold">Este sendero no existe.</h1>
        <p className="mt-4 text-sm leading-6 text-[var(--muted)]">Puedes regresar al inicio; tus recuerdos permanecen exactamente donde los dejaste.</p>
        <Link href="/" className="mt-6 inline-flex rounded-full bg-[var(--yellow)] px-6 py-3 text-sm font-bold text-[var(--brown-dark)]">Volver al inicio</Link>
      </section>
    </main>
  );
}

