import Link from "next/link";
import { notFound } from "next/navigation";
import { BookEditor } from "@/components/journal/book-editor";
import { dateInTimeZone, isEntryDate } from "@/features/journal/date";
import { getOrCreateEntry } from "@/features/journal/service";
import { requireUser } from "@/lib/auth/current-user";
import { ensureProfile } from "@/lib/auth/profiles";

export const dynamic = "force-dynamic";

export default async function DatedJournalPage({
  params,
  searchParams,
}: {
  params: Promise<{ date: string }>;
  searchParams: Promise<{ open?: string }>;
}) {
  const { date } = await params;
  const query = await searchParams;
  if (!isEntryDate(date)) notFound();
  const user = await requireUser();
  const profile = await ensureProfile({ id: user.id, email: user.email, displayName: user.displayName });
  const today = dateInTimeZone(profile.timeZone);
  if (date > today) notFound();
  const entry = await getOrCreateEntry(user, date);

  return (
    <main className="diary-room pb-28 pt-4 lg:pb-14 lg:pt-6">
      <div className="mx-auto w-full max-w-[94rem] px-3 sm:px-6 lg:px-10">
        <header className="mb-2 flex flex-wrap items-center justify-between gap-3 px-2" aria-label="Salida del diario">
          <Link href="/calendar" className="inline-flex items-center gap-2 border-b border-[var(--brown-light)] bg-[var(--paper)] px-4 py-2 text-xs font-bold text-[var(--brown)]"><span aria-hidden="true">←</span> Volver a los separadores</Link>
          <p className="font-display text-lg font-semibold text-[var(--brown)]">Green Days · diario personal</p>
          <Link href={`/capsules?entry=${entry.entryId}`} className="border-b border-[var(--brown-light)] bg-[var(--paper)] px-4 py-2 text-xs font-bold text-[var(--brown)]">Guardar como cápsula</Link>
        </header>
        <BookEditor entryId={entry.entryId} entryDate={entry.entryDate} initialRevision={entry.revision} initialBook={entry.book} initialPrimaryMood={entry.primaryMood} autoOpen={query.open === "1"} />
      </div>
    </main>
  );
}
