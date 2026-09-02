import { notFound } from "next/navigation";
import { JournalEntryView } from "@/components/journal/journal-entry-view";
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

  return <JournalEntryView entry={entry} autoOpen={query.open === "1"} />;
}
