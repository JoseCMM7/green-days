import Link from "next/link";
import { notFound } from "next/navigation";
import { BookEditor } from "@/components/journal/book-editor";
import { dateInTimeZone, isEntryDate, shiftEntryDate } from "@/features/journal/date";
import { getOrCreateEntry } from "@/features/journal/service";
import { requireUser } from "@/lib/auth/current-user";
import { ensureProfile } from "@/lib/auth/profiles";

export const dynamic = "force-dynamic";

export default async function DatedJournalPage({ params }: { params: Promise<{ date: string }> }) {
  const { date } = await params;
  if (!isEntryDate(date)) notFound();
  const user = await requireUser();
  const profile = await ensureProfile({ id: user.id, email: user.email, displayName: user.displayName });
  const today = dateInTimeZone(profile.timeZone);
  if (date > today) notFound();
  const entry = await getOrCreateEntry(user, date);
  const previousDate = shiftEntryDate(date, -1);
  const nextDate = shiftEntryDate(date, 1);

  return (
    <main className="pb-28 pt-7 lg:pb-14 lg:pt-10">
      <div className="mx-auto w-full max-w-[92rem] px-3 sm:px-6 lg:px-10">
        <header className="mx-auto mb-7 max-w-3xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--ochre)]">Una página de tu historia</p>
          <h1 className="font-display mt-2 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">Vuelve a este día.</h1>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Link href={`/journal/${previousDate}`} className="rounded-full border border-[var(--brown-light)] bg-[var(--paper)] px-4 py-2 text-sm font-bold">← Día anterior</Link>
            <Link href="/calendar" className="rounded-full bg-[var(--yellow)] px-4 py-2 text-sm font-bold">Calendario</Link>
            <Link href={`/capsules?entry=${entry.entryId}`} className="rounded-full border border-[var(--brown-light)] bg-[var(--paper)] px-4 py-2 text-sm font-bold">Crear cápsula de este día</Link>
            {nextDate <= today && <Link href={`/journal/${nextDate}`} className="rounded-full border border-[var(--brown-light)] bg-[var(--paper)] px-4 py-2 text-sm font-bold">Día siguiente →</Link>}
          </div>
        </header>
        <BookEditor entryId={entry.entryId} entryDate={entry.entryDate} initialRevision={entry.revision} initialBook={entry.book} initialPrimaryMood={entry.primaryMood} />
      </div>
    </main>
  );
}
