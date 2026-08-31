import "server-only";

import { and, asc, desc, eq } from "drizzle-orm";
import { getMongoCollections } from "@/db/mongodb/collections";
import { albumPresentationSchema } from "@/db/mongodb/schemas";
import { getPostgresDatabase } from "@/db/postgres/client";
import { albumEntries, albums, emotions, entryEmotions, journalEntries, outboxEvents } from "@/db/postgres/schema";
import type { CurrentUser } from "@/lib/auth/current-user";
import { ensureProfile } from "@/lib/auth/profiles";
import { albumRuleFromInput, entryMatchesAlbumRule, type AlbumInput } from "./model";

async function ownedAlbum(userId: string, albumId: string) {
  const [album] = await getPostgresDatabase().select().from(albums).where(and(
    eq(albums.id, albumId), eq(albums.userId, userId),
  )).limit(1);
  return album;
}

export async function syncAlbumRule(userId: string, albumId: string) {
  const album = await ownedAlbum(userId, albumId);
  if (!album?.autoRule) return 0;
  const database = getPostgresDatabase();
  const entries = await database.select({
    id: journalEntries.id,
    entryDate: journalEntries.entryDate,
    emotionSlug: emotions.slug,
  }).from(journalEntries)
    .leftJoin(entryEmotions, and(eq(entryEmotions.entryId, journalEntries.id), eq(entryEmotions.isPrimary, true)))
    .leftJoin(emotions, eq(emotions.id, entryEmotions.emotionId))
    .where(and(eq(journalEntries.userId, userId), eq(journalEntries.contentStatus, "ready")));

  const matching = entries.filter((entry) => entryMatchesAlbumRule(entry, album.autoRule));
  if (!matching.length) return 0;
  await database.insert(albumEntries).values(matching.map((entry, index) => ({
    albumId, entryId: entry.id, sortOrder: index,
  }))).onConflictDoNothing();
  return matching.length;
}

export async function listAlbums(userId: string) {
  const database = getPostgresDatabase();
  const rows = await database.select().from(albums).where(eq(albums.userId, userId)).orderBy(desc(albums.updatedAt));
  await Promise.all(rows.filter((album) => album.autoRule).map((album) => syncAlbumRule(userId, album.id)));
  const links = await database.select({ albumId: albumEntries.albumId }).from(albumEntries)
    .innerJoin(albums, eq(albums.id, albumEntries.albumId))
    .where(eq(albums.userId, userId));
  const collections = await getMongoCollections();
  const presentations = rows.length
    ? await collections.albumPresentations.find({ userId, _id: { $in: rows.map((album) => album.id) } }).toArray()
    : [];
  return rows.map((album) => ({
    ...album,
    entryCount: links.filter((link) => link.albumId === album.id).length,
    presentation: presentations.find((presentation) => presentation._id === album.id) ?? null,
  }));
}

export async function createAlbum(user: CurrentUser, input: AlbumInput) {
  await ensureProfile({ id: user.id, email: user.email, displayName: user.displayName });
  const database = getPostgresDatabase();
  const albumId = crypto.randomUUID();
  const now = new Date();
  const [event] = await database.transaction(async (transaction) => {
    await transaction.insert(albums).values({
      id: albumId,
      userId: user.id,
      title: input.title,
      description: input.description || null,
      autoRule: albumRuleFromInput(input),
    });
    return transaction.insert(outboxEvents).values({
      aggregateType: "album",
      aggregateId: albumId,
      eventType: "album_presentation.create_requested",
      payload: { albumId, userId: user.id },
    }).returning({ id: outboxEvents.id });
  });

  try {
    const collections = await getMongoCollections();
    await collections.albumPresentations.insertOne(albumPresentationSchema.parse({
      _id: albumId,
      userId: user.id,
      schemaVersion: 1,
      layout: input.layout,
      accentColor: input.accentColor,
      decorations: [],
      updatedAt: now,
    }));
    await database.update(outboxEvents).set({ status: "processed", processedAt: new Date() }).where(eq(outboxEvents.id, event.id));
    await syncAlbumRule(user.id, albumId);
  } catch (error) {
    await database.update(outboxEvents).set({ status: "failed", attempts: 1, lastError: error instanceof Error ? error.message.slice(0, 500) : "Error de MongoDB" }).where(eq(outboxEvents.id, event.id));
    await database.delete(albums).where(and(eq(albums.id, albumId), eq(albums.userId, user.id)));
    throw error;
  }
  return albumId;
}

export async function getAlbumDetail(userId: string, albumId: string) {
  const album = await ownedAlbum(userId, albumId);
  if (!album) return null;
  await syncAlbumRule(userId, albumId);
  const database = getPostgresDatabase();
  const allEntries = await database.select({
    id: journalEntries.id,
    title: journalEntries.title,
    entryDate: journalEntries.entryDate,
    dayColor: journalEntries.dayColor,
  }).from(journalEntries).where(and(
    eq(journalEntries.userId, userId),
    eq(journalEntries.contentStatus, "ready"),
  )).orderBy(desc(journalEntries.entryDate));
  const links = await database.select().from(albumEntries).where(eq(albumEntries.albumId, albumId)).orderBy(asc(albumEntries.sortOrder));
  const entryIds = new Set(links.map((link) => link.entryId));
  const collections = await getMongoCollections();
  const presentation = await collections.albumPresentations.findOne({ _id: albumId, userId });
  return {
    album,
    presentation,
    entries: allEntries.filter((entry) => entryIds.has(entry.id)),
    candidates: allEntries.filter((entry) => !entryIds.has(entry.id)),
  };
}

export async function addEntryToAlbum(userId: string, albumId: string, entryId: string) {
  const database = getPostgresDatabase();
  const [valid] = await database.select({ id: journalEntries.id }).from(journalEntries).where(and(
    eq(journalEntries.id, entryId), eq(journalEntries.userId, userId),
  )).limit(1);
  if (!valid || !await ownedAlbum(userId, albumId)) throw new Error("No encontramos ese recuerdo.");
  await database.insert(albumEntries).values({ albumId, entryId }).onConflictDoNothing();
  await database.update(albums).set({ updatedAt: new Date() }).where(and(eq(albums.id, albumId), eq(albums.userId, userId)));
}

export async function removeEntryFromAlbum(userId: string, albumId: string, entryId: string) {
  if (!await ownedAlbum(userId, albumId)) throw new Error("No encontramos ese álbum.");
  await getPostgresDatabase().delete(albumEntries).where(and(eq(albumEntries.albumId, albumId), eq(albumEntries.entryId, entryId)));
}

export async function updateAlbumPresentation(userId: string, albumId: string, layout: "scrapbook" | "film" | "storybook", accentColor: string) {
  if (!await ownedAlbum(userId, albumId)) throw new Error("No encontramos ese álbum.");
  const collections = await getMongoCollections();
  await collections.albumPresentations.updateOne(
    { _id: albumId, userId },
    { $set: { layout, accentColor, updatedAt: new Date() } },
  );
}

export async function deleteAlbum(userId: string, albumId: string) {
  const deleted = await getPostgresDatabase().delete(albums).where(and(eq(albums.id, albumId), eq(albums.userId, userId))).returning({ id: albums.id });
  if (!deleted.length) throw new Error("No encontramos ese álbum.");
  const collections = await getMongoCollections();
  await collections.albumPresentations.deleteOne({ _id: albumId, userId });
}
