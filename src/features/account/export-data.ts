import "server-only";

import { eq } from "drizzle-orm";
import { getMongoCollections } from "@/db/mongodb/collections";
import { getPostgresDatabase } from "@/db/postgres/client";
import {
  albumEntries,
  albums,
  capsuleMedia,
  emotions,
  entryEmotions,
  entryMedia,
  entryTags,
  journalEntries,
  mediaAssets,
  profiles,
  tags,
  timeCapsules,
  userPreferences,
} from "@/db/postgres/schema";
import type { CurrentUser } from "@/lib/auth/current-user";

export async function buildUserExport(user: CurrentUser) {
  const database = getPostgresDatabase();
  const collectionsPromise = getMongoCollections();

  const [
    profileRows,
    preferenceRows,
    entries,
    emotionLinks,
    userTags,
    tagLinks,
    media,
    mediaLinks,
    capsules,
    capsuleLinks,
    userAlbums,
    albumLinks,
    collections,
  ] = await Promise.all([
    database.select().from(profiles).where(eq(profiles.id, user.id)),
    database.select().from(userPreferences).where(eq(userPreferences.userId, user.id)),
    database.select().from(journalEntries).where(eq(journalEntries.userId, user.id)),
    database
      .select({
        entryId: entryEmotions.entryId,
        intensity: entryEmotions.intensity,
        isPrimary: entryEmotions.isPrimary,
        slug: emotions.slug,
        name: emotions.name,
        color: emotions.color,
        icon: emotions.icon,
      })
      .from(entryEmotions)
      .innerJoin(journalEntries, eq(journalEntries.id, entryEmotions.entryId))
      .innerJoin(emotions, eq(emotions.id, entryEmotions.emotionId))
      .where(eq(journalEntries.userId, user.id)),
    database.select().from(tags).where(eq(tags.userId, user.id)),
    database
      .select({ entryId: entryTags.entryId, tagId: entryTags.tagId })
      .from(entryTags)
      .innerJoin(journalEntries, eq(journalEntries.id, entryTags.entryId))
      .where(eq(journalEntries.userId, user.id)),
    database.select().from(mediaAssets).where(eq(mediaAssets.userId, user.id)),
    database
      .select({
        entryId: entryMedia.entryId,
        mediaId: entryMedia.mediaId,
        sortOrder: entryMedia.sortOrder,
        altText: entryMedia.altText,
      })
      .from(entryMedia)
      .innerJoin(journalEntries, eq(journalEntries.id, entryMedia.entryId))
      .where(eq(journalEntries.userId, user.id)),
    database.select().from(timeCapsules).where(eq(timeCapsules.userId, user.id)),
    database
      .select({ capsuleId: capsuleMedia.capsuleId, mediaId: capsuleMedia.mediaId })
      .from(capsuleMedia)
      .innerJoin(timeCapsules, eq(timeCapsules.id, capsuleMedia.capsuleId))
      .where(eq(timeCapsules.userId, user.id)),
    database.select().from(albums).where(eq(albums.userId, user.id)),
    database
      .select({
        albumId: albumEntries.albumId,
        entryId: albumEntries.entryId,
        sortOrder: albumEntries.sortOrder,
        addedAt: albumEntries.addedAt,
      })
      .from(albumEntries)
      .innerJoin(albums, eq(albums.id, albumEntries.albumId))
      .where(eq(albums.userId, user.id)),
    collectionsPromise,
  ]);

  const [entryDocuments, entryVersions, capsuleDocuments, albumPresentations, customThemes] =
    await Promise.all([
      collections.entryDocuments.find({ userId: user.id }).toArray(),
      collections.entryVersions.find({ userId: user.id }).toArray(),
      collections.capsuleDocuments.find({ userId: user.id }).toArray(),
      collections.albumPresentations.find({ userId: user.id }).toArray(),
      collections.customThemes.find({ userId: user.id }).toArray(),
    ]);

  return {
    format: "green-days-export",
    formatVersion: 1,
    generatedAt: new Date().toISOString(),
    identity: {
      id: user.id,
      email: user.email,
      profile: profileRows[0] ?? null,
      preferences: preferenceRows[0] ?? null,
    },
    relational: {
      journalEntries: entries,
      entryEmotions: emotionLinks,
      tags: userTags,
      entryTags: tagLinks,
      mediaAssets: media,
      entryMedia: mediaLinks,
      timeCapsules: capsules,
      capsuleMedia: capsuleLinks,
      albums: userAlbums,
      albumEntries: albumLinks,
    },
    documents: {
      entryDocuments,
      entryVersions,
      capsuleDocuments,
      albumPresentations,
      customThemes,
    },
  };
}
