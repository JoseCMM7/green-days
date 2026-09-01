import "server-only";

import { and, eq, inArray, isNull, sql } from "drizzle-orm";
import { getMongoCollections } from "@/db/mongodb/collections";
import { getPostgresDatabase } from "@/db/postgres/client";
import { albums, capsuleMedia, entryMedia, journalEntries, mediaAssets, timeCapsules } from "@/db/postgres/schema";
import { mediaIdsInBook, mediaIdsInElements } from "@/features/journal/editor-operations";
import type { CurrentUser } from "@/lib/auth/current-user";
import { createClient } from "@/lib/supabase/server";
import { extensionForMedia, MAX_USER_STORAGE_BYTES, selectUnusedMediaAssets, validateMediaFile } from "./model";

async function ownedEntry(userId: string, entryId: string) {
  const [entry] = await getPostgresDatabase().select({ id: journalEntries.id }).from(journalEntries).where(and(
    eq(journalEntries.id, entryId), eq(journalEntries.userId, userId), isNull(journalEntries.deletedAt),
  )).limit(1);
  return entry;
}

export async function getUserStorageUsage(userId: string) {
  const [result] = await getPostgresDatabase()
    .select({ usedBytes: sql<number>`coalesce(sum(${mediaAssets.byteSize}), 0)` })
    .from(mediaAssets)
    .where(and(eq(mediaAssets.userId, userId), isNull(mediaAssets.deletedAt)));
  const usedBytes = Number(result?.usedBytes ?? 0);
  return {
    usedBytes,
    limitBytes: MAX_USER_STORAGE_BYTES,
    remainingBytes: Math.max(0, MAX_USER_STORAGE_BYTES - usedBytes),
    percentage: Math.min(100, (usedBytes / MAX_USER_STORAGE_BYTES) * 100),
  };
}

export async function uploadJournalMedia(
  user: CurrentUser,
  entryId: string,
  file: File,
  metadata: { width?: number; height?: number } = {},
) {
  if (!await ownedEntry(user.id, entryId)) throw new Error("No encontramos esa entrada.");
  const validation = validateMediaFile(file);
  if (!validation.ok) throw new Error(validation.error);
  const usage = await getUserStorageUsage(user.id);
  if (usage.usedBytes + file.size > usage.limitBytes) {
    throw new Error("Alcanzaste el límite privado de 500 MB. Conserva una copia y elimina tu cuenta sólo si deseas borrar todos los archivos.");
  }
  const mediaId = crypto.randomUUID();
  const storagePath = `${user.id}/${entryId}/${mediaId}.${extensionForMedia(file.type)}`;
  const supabase = await createClient();
  const { error: uploadError } = await supabase.storage.from("journal-media").upload(storagePath, file, {
    contentType: file.type,
    cacheControl: "3600",
    upsert: false,
  });
  if (uploadError) throw new Error(uploadError.message);

  try {
    await getPostgresDatabase().transaction(async (transaction) => {
      await transaction.insert(mediaAssets).values({
        id: mediaId, userId: user.id, kind: validation.kind, status: "ready",
        bucket: "journal-media", storagePath, mimeType: file.type, byteSize: file.size,
        width: validation.kind === "photo" ? metadata.width : undefined,
        height: validation.kind === "photo" ? metadata.height : undefined,
      });
      await transaction.insert(entryMedia).values({ entryId, mediaId });
    });
  } catch (error) {
    await supabase.storage.from("journal-media").remove([storagePath]);
    throw error;
  }
  return { id: mediaId, kind: validation.kind, mimeType: file.type, byteSize: file.size };
}

export async function findOwnedMedia(userId: string, mediaId: string) {
  const [asset] = await getPostgresDatabase().select().from(mediaAssets).where(and(
    eq(mediaAssets.id, mediaId), eq(mediaAssets.userId, userId), isNull(mediaAssets.deletedAt),
  )).limit(1);
  return asset;
}

export async function downloadJournalMedia(userId: string, mediaId: string) {
  const asset = await findOwnedMedia(userId, mediaId);
  if (!asset) return null;
  const supabase = await createClient();
  const { data, error } = await supabase.storage.from(asset.bucket).download(asset.storagePath);
  if (error || !data) throw new Error(error?.message ?? "No se pudo descargar el archivo.");
  return { asset, data };
}

export async function deleteJournalMedia(userId: string, mediaId: string) {
  const asset = await findOwnedMedia(userId, mediaId);
  if (!asset) return;
  const supabase = await createClient();
  const { error } = await supabase.storage.from(asset.bucket).remove([asset.storagePath]);
  if (error) throw new Error(error.message);
  await getPostgresDatabase().delete(mediaAssets).where(and(eq(mediaAssets.id, mediaId), eq(mediaAssets.userId, userId)));
}

export async function listUserStoragePaths(userId: string) {
  return getPostgresDatabase().select({ bucket: mediaAssets.bucket, storagePath: mediaAssets.storagePath })
    .from(mediaAssets).where(eq(mediaAssets.userId, userId));
}

export async function cleanupUnusedJournalMedia(userId: string, now = new Date()) {
  const database = getPostgresDatabase();
  const collections = await getMongoCollections();
  const [documents, versions, albumPresentations, capsuleLinks, albumCovers, candidates] = await Promise.all([
    collections.entryDocuments.find({ userId }).toArray(),
    collections.entryVersions.find({ userId }).toArray(),
    collections.albumPresentations.find({ userId }).toArray(),
    database.select({ mediaId: capsuleMedia.mediaId }).from(capsuleMedia)
      .innerJoin(timeCapsules, eq(timeCapsules.id, capsuleMedia.capsuleId))
      .where(eq(timeCapsules.userId, userId)),
    database.select({ mediaId: albums.coverMediaId }).from(albums)
      .where(eq(albums.userId, userId)),
    database.select().from(mediaAssets).where(and(
      eq(mediaAssets.userId, userId),
      isNull(mediaAssets.deletedAt),
    )),
  ]);

  const referenced = new Set<string>();
  for (const document of documents) mediaIdsInBook(document.book).forEach((id) => referenced.add(id));
  for (const version of versions) mediaIdsInBook(version.book).forEach((id) => referenced.add(id));
  for (const presentation of albumPresentations) {
    mediaIdsInElements(presentation.decorations).forEach((id) => referenced.add(id));
  }
  capsuleLinks.forEach(({ mediaId }) => referenced.add(mediaId));
  albumCovers.forEach(({ mediaId }) => { if (mediaId) referenced.add(mediaId); });
  const unused = selectUnusedMediaAssets(candidates, referenced, now);
  if (!unused.length) return { deletedCount: 0, freedBytes: 0 };

  const supabase = await createClient();
  const pathsByBucket = new Map<string, string[]>();
  for (const asset of unused) {
    pathsByBucket.set(asset.bucket, [...(pathsByBucket.get(asset.bucket) ?? []), asset.storagePath]);
  }
  for (const [bucket, paths] of pathsByBucket) {
    for (let index = 0; index < paths.length; index += 100) {
      const { error } = await supabase.storage.from(bucket).remove(paths.slice(index, index + 100));
      if (error) throw new Error("No pudimos limpiar todos los archivos privados.");
    }
  }
  await database.delete(mediaAssets).where(and(
    eq(mediaAssets.userId, userId),
    inArray(mediaAssets.id, unused.map((asset) => asset.id)),
  ));
  return {
    deletedCount: unused.length,
    freedBytes: unused.reduce((total, asset) => total + asset.byteSize, 0),
  };
}
