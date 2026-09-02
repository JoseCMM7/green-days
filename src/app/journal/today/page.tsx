import { redirect } from "next/navigation";
import { dateInTimeZone } from "@/features/journal/date";
import { requireUser } from "@/lib/auth/current-user";
import { ensureProfile } from "@/lib/auth/profiles";

export const dynamic = "force-dynamic";

export default async function TodayJournalPage() {
  const user = await requireUser();
  const profile = await ensureProfile({
    id: user.id,
    email: user.email,
    displayName: user.displayName,
  });
  const today = dateInTimeZone(profile.timeZone);

  redirect(`/journal/${today}?open=1`);
}
