import Link from "next/link";
import { BookEditor } from "@/components/journal/book-editor";
import type { JournalEntryDto } from "@/features/journal/service";

export function JournalEntryView({
  entry,
  autoOpen,
}: {
  entry: JournalEntryDto;
  autoOpen: boolean;
}) {
  return (
    <main className="diary-room pb-28 pt-4 lg:pb-14 lg:pt-6">
      <Link href="/calendar" className="journal-exit-link" aria-label="Salir del diario y volver al calendario">
        <span aria-hidden="true">←</span>
        Salir del diario
      </Link>
      <div className="mx-auto w-full max-w-[94rem] px-3 sm:px-6 lg:px-10">
        <header className="mb-2 flex flex-wrap items-center justify-end gap-3 px-2" aria-label="Acciones del diario">
          <p className="font-display text-lg font-semibold text-[var(--brown)]">Green Days · diario personal</p>
          <Link href={`/capsules?entry=${entry.entryId}`} className="border-b border-[var(--brown-light)] bg-[var(--paper)] px-4 py-2 text-xs font-bold text-[var(--brown)]">
            Guardar como cápsula
          </Link>
        </header>
        <BookEditor
          entryId={entry.entryId}
          entryDate={entry.entryDate}
          initialRevision={entry.revision}
          initialBook={entry.book}
          initialPrimaryMood={entry.primaryMood}
          autoOpen={autoOpen}
        />
      </div>
    </main>
  );
}
