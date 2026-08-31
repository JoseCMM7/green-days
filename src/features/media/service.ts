import "server-only";

import { and, eq, isNull } from "drizzle-orm";
import { getPostgresDatabase } from "@/db/postgres/client";
import { entryMedia, journalEntries, mediaAssets } from "@/db/postgres/schema";
import type { CurrentUser } from "@/lib/auth/current-user";
import { createClient } from "@/lib/supabase/server";
import { extensionForMedia, validateMediaFile } from "./model";

async function ownedEntry(userId: string, entryId: string) {
  const [entry] = await getPostgresDatabase().select({ id: journalEntries.id }).from(journalEntries).where(and(
    eq(journalEntries.id, entryId), eq(journalEntries.userId, userId), isNull(journalEntries.deletedAt),
  )).limit(1);
  return entry;
}

export async function uploadJournalMedia(user: CurrentUser, entryId: string, file: File) {
  if (!await ownedEntry(user.id, entryId)) throw new Error("No encontramos esa entrada.");
  const validation = validateMediaFile(file);
  if (!validation.ok) throw new Error(validation.error);
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
