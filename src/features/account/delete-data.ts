import "server-only";

import { getMongoCollections } from "@/db/mongodb/collections";

export async function deleteUserMongoData(userId: string) {
  const collections = await getMongoCollections();
  const results = await Promise.all([
    collections.entryDocuments.deleteMany({ userId }),
    collections.entryVersions.deleteMany({ userId }),
    collections.capsuleDocuments.deleteMany({ userId }),
    collections.albumPresentations.deleteMany({ userId }),
    collections.customThemes.deleteMany({ userId }),
  ]);

  return results.reduce((total, result) => total + result.deletedCount, 0);
}

