import Link from "next/link";
import { BookEditor } from "@/components/journal/book-editor";
import { getOrCreateTodayEntry } from "@/features/journal/service";
import { requireUser } from "@/lib/auth/current-user";

export const dynamic = "force-dynamic";

export default async function TodayJournalPage() {
  const user = await requireUser();
  const entry = await getOrCreateTodayEntry(user);

  return (
    <main className="pb-28 pt-7 lg:pb-14 lg:pt-10">
      <Link href="/calendar" className="journal-exit-link" aria-label="Salir del diario y volver al calendario">
        <span aria-hidden="true">←</span>
        Salir del diario
      </Link>
      <div className="mx-auto w-full max-w-[92rem] px-3 sm:px-6 lg:px-10">
        <header className="mx-auto mb-7 max-w-3xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--ochre)]">
            Tu página de hoy
          </p>
          <h1 className="font-display mt-2 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
            Abre el libro. Este día es tuyo.
          </h1>
          <p className="mx-auto mt-3 max-w-2xl leading-7 text-[var(--muted)]">
            No necesitas escribir mucho. Una frase, una sensación o un pequeño detalle es suficiente.
          </p>
          <Link href={`/capsules?entry=${entry.entryId}`} className="mt-5 inline-flex rounded-full border border-[var(--brown-light)] bg-[var(--paper)] px-5 py-2.5 text-sm font-bold">Crear cápsula de este día</Link>
        </header>
        <BookEditor
          entryId={entry.entryId}
          entryDate={entry.entryDate}
          initialRevision={entry.revision}
          initialBook={entry.book}
          initialPrimaryMood={entry.primaryMood}
        />
      </div>
    </main>
  );
}
