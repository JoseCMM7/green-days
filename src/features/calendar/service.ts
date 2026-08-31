import "server-only";

import { and, asc, between, eq, isNull } from "drizzle-orm";
import { getPostgresDatabase } from "@/db/postgres/client";
import { emotions, entryEmotions, journalEntries } from "@/db/postgres/schema";
import { ensureProfile } from "@/lib/auth/profiles";
import type { CurrentUser } from "@/lib/auth/current-user";
import { dateInTimeZone } from "@/features/journal/date";
import { findMood, type MoodOption } from "./moods";
import { monthBounds, monthInTimeZone, parseMonth } from "./month";

export type CalendarEntry = {
  entryId: string;
  entryDate: string;
  title: string;
  mood: MoodOption | null;
};

export type CalendarMonthDto = {
  month: string;
  today: string;
  entries: CalendarEntry[];
  summary: {
    entryCount: number;
    moodCount: number;
    mostFrequentMood: MoodOption | null;
  };
};

export async function getCalendarMonth(
  user: CurrentUser,
  requestedMonth?: string | null,
): Promise<CalendarMonthDto> {
  const profile = await ensureProfile({
    id: user.id,
    email: user.email,
    displayName: user.displayName,
  });
  const currentMonth = monthInTimeZone(profile.timeZone);
  const month = requestedMonth && parseMonth(requestedMonth)?.value
    ? parseMonth(requestedMonth)!.value
    : currentMonth;
  const bounds = monthBounds(month);
  const database = getPostgresDatabase();

  const rows = await database
    .select({
      entryId: journalEntries.id,
      entryDate: journalEntries.entryDate,
      title: journalEntries.title,
      moodSlug: emotions.slug,
    })
    .from(journalEntries)
    .leftJoin(
      entryEmotions,
      and(
        eq(entryEmotions.entryId, journalEntries.id),
        eq(entryEmotions.isPrimary, true),
      ),
    )
    .leftJoin(emotions, eq(emotions.id, entryEmotions.emotionId))
    .where(
      and(
        eq(journalEntries.userId, user.id),
        between(journalEntries.entryDate, bounds.start, bounds.end),
        isNull(journalEntries.deletedAt),
      ),
    )
    .orderBy(asc(journalEntries.entryDate));

  const entries = rows.map((row) => ({
    entryId: row.entryId,
    entryDate: row.entryDate,
    title: row.title?.trim() || "Un momento guardado",
    mood: findMood(row.moodSlug),
  }));
  const moodFrequency = new Map<string, number>();

  for (const entry of entries) {
    if (entry.mood) {
      moodFrequency.set(entry.mood.slug, (moodFrequency.get(entry.mood.slug) ?? 0) + 1);
    }
  }

  const mostFrequentSlug = [...moodFrequency.entries()]
    .sort((left, right) => right[1] - left[1])[0]?.[0];

  return {
    month,
    today: dateInTimeZone(profile.timeZone),
    entries,
    summary: {
      entryCount: entries.length,
      moodCount: moodFrequency.size,
      mostFrequentMood: findMood(mostFrequentSlug),
    },
  };
}

