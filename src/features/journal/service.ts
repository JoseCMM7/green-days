import "server-only";

import { and, desc, eq, isNull } from "drizzle-orm";
import { findEntryDocument, findEntryVersion, insertEntryDocument, listEntryVersions, replaceEntryDocument } from "@/db/mongodb/entry-documents";
import { entryDocumentSchema, type EntryDocument, type PageElement } from "@/db/mongodb/schemas";
import { getPostgresDatabase } from "@/db/postgres/client";
import { emotions, entryEmotions, journalEntries, outboxEvents } from "@/db/postgres/schema";
import { findMood, type MoodOption, type MoodSlug } from "@/features/calendar/moods";
import { ensureProfile } from "@/lib/auth/profiles";
import type { CurrentUser } from "@/lib/auth/current-user";
import { getBookAppearance } from "@/features/personalization/service";
import { createDefaultBook, type JournalBook } from "./default-book";
import { dateInTimeZone, isEntryDate } from "./date";

export class EntryConflictError extends Error {}

export type JournalEntryDto = {
  entryId: string;
  entryDate: string;
  revision: number;
  book: JournalBook;
  primaryMood: MoodOption | null;
};

async function findRelationalEntry(userId: string, entryDate: string) {
  const database = getPostgresDatabase();
  const [entry] = await database
    .select()
    .from(journalEntries)
    .where(
      and(
        eq(journalEntries.userId, userId),
        eq(journalEntries.entryDate, entryDate),
      ),
    )
    .limit(1);

  return entry;
}

export async function getOrCreateEntry(user: CurrentUser, requestedDate?: string): Promise<JournalEntryDto> {
  const profile = await ensureProfile({
    id: user.id,
    email: user.email,
    displayName: user.displayName,
  });
  const today = dateInTimeZone(profile.timeZone);
  const entryDate = requestedDate ?? today;
  if (!isEntryDate(entryDate) || entryDate > today) {
    throw new Error("La fecha de la entrada no es válida.");
  }
  const database = getPostgresDatabase();
  let entry = await findRelationalEntry(user.id, entryDate);
  let outboxId: string | null = null;

  if (!entry) {
    const entryId = crypto.randomUUID();
    const created = await database.transaction(async (transaction) => {
      const [newEntry] = await transaction
        .insert(journalEntries)
        .values({
          id: entryId,
          userId: user.id,
          entryDate,
          title: "Mi día",
          contentStatus: "pending",
        })
        .onConflictDoNothing()
        .returning();

      if (!newEntry) {
        return null;
      }

      const [event] = await transaction
        .insert(outboxEvents)
        .values({
          aggregateType: "journal_entry",
          aggregateId: newEntry.id,
          eventType: "entry_document.create_requested",
          payload: { entryId: newEntry.id, userId: user.id, entryDate },
        })
        .returning({ id: outboxEvents.id });

      return { entry: newEntry, outboxId: event.id };
    });

    if (created) {
      entry = created.entry;
      outboxId = created.outboxId;
    } else {
      entry = await findRelationalEntry(user.id, entryDate);
    }
  }

  if (!entry) {
    throw new Error("No fue posible crear la entrada de hoy.");
  }

  let document = await findEntryDocument(entry.id, user.id);

  if (!document) {
    const now = new Date();
    const appearance = await getBookAppearance(user.id).catch(() => undefined);
    const newDocument = entryDocumentSchema.parse({
      _id: entry.id,
      userId: user.id,
      entryDate,
      schemaVersion: 1,
      revision: 1,
      book: createDefaultBook(appearance),
      createdAt: now,
      updatedAt: now,
    });

    try {
      document = await insertEntryDocument(newDocument);
    } catch (error) {
      document = await findEntryDocument(entry.id, user.id);
      if (!document) throw error;
    }
  }

  await database.transaction(async (transaction) => {
    await transaction
      .update(journalEntries)
      .set({
        contentStatus: "ready",
        currentRevision: document.revision,
        updatedAt: new Date(),
      })
      .where(eq(journalEntries.id, entry.id));

    if (outboxId) {
      await transaction
        .update(outboxEvents)
        .set({ status: "processed", processedAt: new Date() })
        .where(eq(outboxEvents.id, outboxId));
    }
  });

  const [primaryEmotion] = await database
    .select({ slug: emotions.slug })
    .from(entryEmotions)
    .innerJoin(emotions, eq(emotions.id, entryEmotions.emotionId))
    .where(
      and(
        eq(entryEmotions.entryId, entry.id),
        eq(entryEmotions.isPrimary, true),
      ),
    )
    .limit(1);

  return {
    entryId: entry.id,
    entryDate,
    revision: document.revision,
    book: document.book,
    primaryMood: findMood(primaryEmotion?.slug),
  };
}

export async function getOrCreateTodayEntry(user: CurrentUser) {
  return getOrCreateEntry(user);
}

export async function listJournalEntryChoices(userId: string) {
  return getPostgresDatabase()
    .select({ id: journalEntries.id, entryDate: journalEntries.entryDate, title: journalEntries.title })
    .from(journalEntries)
    .where(and(eq(journalEntries.userId, userId), isNull(journalEntries.deletedAt)))
    .orderBy(desc(journalEntries.entryDate));
}

export async function saveTodayEntry(input: {
  user: CurrentUser;
  expectedRevision: number;
  book: JournalBook;
  primaryMoodSlug: MoodSlug | null;
}) {
  return saveEntry(input);
}

export async function saveEntry(input: {
  user: CurrentUser;
  entryDate?: string;
  expectedRevision: number;
  book: JournalBook;
  primaryMoodSlug: MoodSlug | null;
}) {
  const current = await getOrCreateEntry(input.user, input.entryDate);

  if (current.revision !== input.expectedRevision) {
    throw new EntryConflictError("El libro cambió en otra sesión.");
  }

  const existingDocument = await findEntryDocument(current.entryId, input.user.id);
  if (!existingDocument) {
    throw new Error("No encontramos el contenido del libro.");
  }

  const database = getPostgresDatabase();
  const [selectedMood] = input.primaryMoodSlug
    ? await database
        .select({ id: emotions.id, color: emotions.color })
        .from(emotions)
        .where(
          and(
            eq(emotions.slug, input.primaryMoodSlug),
            isNull(emotions.userId),
          ),
        )
        .limit(1)
    : [];

  if (input.primaryMoodSlug && !selectedMood) {
    throw new Error("La emoción seleccionada todavía no está disponible.");
  }

  const nextRevision = input.expectedRevision + 1;
  const [event] = await database
    .insert(outboxEvents)
    .values({
      aggregateType: "journal_entry",
      aggregateId: current.entryId,
      eventType: "entry_document.save_requested",
      payload: {
        entryId: current.entryId,
        expectedRevision: input.expectedRevision,
        nextRevision,
      },
    })
    .returning({ id: outboxEvents.id });

  const nextDocument: EntryDocument = entryDocumentSchema.parse({
    ...existingDocument,
    revision: nextRevision,
    book: input.book,
    updatedAt: new Date(),
  });

  try {
    await replaceEntryDocument(nextDocument, input.expectedRevision);
  } catch (error) {
    await database
      .update(outboxEvents)
      .set({
        status: "failed",
        attempts: 1,
        lastError: error instanceof Error ? error.message.slice(0, 500) : "Error desconocido",
      })
      .where(eq(outboxEvents.id, event.id));

    if (error instanceof Error && error.message.includes("cambió en otro lugar")) {
      throw new EntryConflictError(error.message);
    }

    throw error;
  }

  await database.transaction(async (transaction) => {
    await transaction
      .delete(entryEmotions)
      .where(eq(entryEmotions.entryId, current.entryId));

    if (selectedMood) {
      await transaction.insert(entryEmotions).values({
        entryId: current.entryId,
        emotionId: selectedMood.id,
        intensity: 3,
        isPrimary: true,
      });
    }

    await transaction
      .update(journalEntries)
      .set({
        currentRevision: nextRevision,
        contentStatus: "ready",
        dayColor: selectedMood?.color ?? null,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(journalEntries.id, current.entryId),
          eq(journalEntries.userId, input.user.id),
        ),
      );
    await transaction
      .update(outboxEvents)
      .set({ status: "processed", processedAt: new Date() })
      .where(eq(outboxEvents.id, event.id));
  });

  return { revision: nextRevision, primaryMood: findMood(input.primaryMoodSlug) };
}

export async function listEntryHistory(user: CurrentUser, entryDate: string) {
  const current = await getOrCreateEntry(user, entryDate);
  const versions = await listEntryVersions(current.entryId, user.id);
  return versions.map((version) => {
    const text = version.book.pages.flatMap((page) => page.elements)
      .filter((element): element is Extract<PageElement, { type: "text" }> => element.type === "text")
      .map((element) => element.content.text.trim()).filter(Boolean).join(" ");
    return {
      revision: version.revision,
      savedAt: version.savedAt.toISOString(),
      pageCount: version.book.pages.length,
      excerpt: text.slice(0, 180),
    };
  });
}

export async function restoreEntryRevision(user: CurrentUser, entryDate: string, revision: number) {
  const current = await getOrCreateEntry(user, entryDate);
  const version = await findEntryVersion(current.entryId, user.id, revision);
  if (!version) throw new Error("No encontramos esa revisión.");
  return saveEntry({
    user,
    entryDate,
    expectedRevision: current.revision,
    book: version.book,
    primaryMoodSlug: current.primaryMood?.slug ?? null,
  });
}
