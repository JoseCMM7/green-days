import "server-only";

import { and, asc, eq } from "drizzle-orm";
import { capsuleDocumentSchema } from "@/db/mongodb/schemas";
import { getMongoCollections } from "@/db/mongodb/collections";
import { getPostgresDatabase } from "@/db/postgres/client";
import { journalEntries, outboxEvents, timeCapsules } from "@/db/postgres/schema";
import type { CurrentUser } from "@/lib/auth/current-user";
import { ensureProfile } from "@/lib/auth/profiles";
import { canOpenCapsule, type CapsuleInput, unlockDateFromInput } from "./model";

export async function listCapsules(userId: string) {
  const database = getPostgresDatabase();
  return database.select().from(timeCapsules)
    .where(eq(timeCapsules.userId, userId))
    .orderBy(asc(timeCapsules.unlocksAt));
}

export async function createCapsule(user: CurrentUser, input: CapsuleInput) {
  await ensureProfile({ id: user.id, email: user.email, displayName: user.displayName });
  const database = getPostgresDatabase();
  if (input.sourceEntryId) {
    const [ownedSource] = await database
      .select({ id: journalEntries.id })
      .from(journalEntries)
      .where(and(
        eq(journalEntries.id, input.sourceEntryId),
        eq(journalEntries.userId, user.id),
      ))
      .limit(1);
    if (!ownedSource) throw new Error("No encontramos la entrada que quieres vincular.");
  }
  const capsuleId = crypto.randomUUID();
  const now = new Date();
  const [event] = await database.transaction(async (transaction) => {
    await transaction.insert(timeCapsules).values({
      id: capsuleId,
      userId: user.id,
      title: input.title,
      status: "sealed",
      sourceEntryId: input.sourceEntryId ?? null,
      unlocksAt: unlockDateFromInput(input.unlockDate),
      sealedAt: now,
    });
    return transaction.insert(outboxEvents).values({
      aggregateType: "time_capsule",
      aggregateId: capsuleId,
      eventType: "capsule_document.create_requested",
      payload: { capsuleId, userId: user.id },
    }).returning({ id: outboxEvents.id });
  });

  try {
    const collections = await getMongoCollections();
    const document = capsuleDocumentSchema.parse({
      _id: capsuleId,
      userId: user.id,
      schemaVersion: 1,
      message: input.message,
      presentation: {
        paperColor: input.paperColor,
        sealStickerId: input.sealStickerId || undefined,
        revealStyle: input.revealStyle,
      },
      updatedAt: now,
    });
    await collections.capsuleDocuments.insertOne(document);
    await database.update(outboxEvents)
      .set({ status: "processed", processedAt: new Date() })
      .where(eq(outboxEvents.id, event.id));
  } catch (error) {
    await database.update(outboxEvents).set({
      status: "failed",
      attempts: 1,
      lastError: error instanceof Error ? error.message.slice(0, 500) : "Error de MongoDB",
    }).where(eq(outboxEvents.id, event.id));
    await database.delete(timeCapsules).where(and(
      eq(timeCapsules.id, capsuleId),
      eq(timeCapsules.userId, user.id),
    ));
    throw error;
  }

  return capsuleId;
}

export async function getCapsule(userId: string, capsuleId: string) {
  const database = getPostgresDatabase();
  const [capsule] = await database.select().from(timeCapsules).where(and(
    eq(timeCapsules.id, capsuleId),
    eq(timeCapsules.userId, userId),
  )).limit(1);
  if (!capsule) return null;

  const collections = await getMongoCollections();
  const document = await collections.capsuleDocuments.findOne({ _id: capsuleId, userId });
  const [sourceEntry] = capsule.sourceEntryId
    ? await database
        .select({ entryDate: journalEntries.entryDate })
        .from(journalEntries)
        .where(and(
          eq(journalEntries.id, capsule.sourceEntryId),
          eq(journalEntries.userId, userId),
        ))
        .limit(1)
    : [];
  return { capsule, document, sourceEntryDate: sourceEntry?.entryDate ?? null };
}

export async function openCapsule(userId: string, capsuleId: string) {
  const result = await getCapsule(userId, capsuleId);
  if (!result) throw new Error("No encontramos esa cápsula.");
  if (!canOpenCapsule(result.capsule.unlocksAt)) {
    throw new Error("La cápsula todavía está cuidando tu mensaje.");
  }

  await getPostgresDatabase().update(timeCapsules).set({
    status: "unlocked",
    openedAt: result.capsule.openedAt ?? new Date(),
    updatedAt: new Date(),
  }).where(and(eq(timeCapsules.id, capsuleId), eq(timeCapsules.userId, userId)));
}

export async function deleteCapsule(userId: string, capsuleId: string) {
  const database = getPostgresDatabase();
  const deleted = await database.delete(timeCapsules).where(and(
    eq(timeCapsules.id, capsuleId),
    eq(timeCapsules.userId, userId),
  )).returning({ id: timeCapsules.id });
  if (!deleted.length) throw new Error("No encontramos esa cápsula.");
  const collections = await getMongoCollections();
  await collections.capsuleDocuments.deleteOne({ _id: capsuleId, userId });
}
