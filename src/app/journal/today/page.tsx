import { JournalEntryView } from "@/components/journal/journal-entry-view";
import { getOrCreateTodayEntry } from "@/features/journal/service";
import { requireUser } from "@/lib/auth/current-user";

export const dynamic = "force-dynamic";

export default async function TodayJournalPage() {
  const user = await requireUser();
  const entry = await getOrCreateTodayEntry(user);

  return <JournalEntryView entry={entry} autoOpen />;
}
