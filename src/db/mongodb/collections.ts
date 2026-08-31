import "server-only";

import { getMongoDatabase } from "./client";
import type {
  AlbumPresentation,
  CapsuleDocument,
  CustomTheme,
  EntryDocument,
  EntryVersion,
} from "./schemas";

export async function getMongoCollections() {
  const database = await getMongoDatabase();

  return {
    entryDocuments: database.collection<EntryDocument>("entry_documents"),
    entryVersions: database.collection<EntryVersion>("entry_versions"),
    capsuleDocuments: database.collection<CapsuleDocument>("capsule_documents"),
    albumPresentations: database.collection<AlbumPresentation>("album_presentations"),
    customThemes: database.collection<CustomTheme>("custom_themes"),
  };
}
