import "../../envConfig";

import { MongoClient, ServerApiVersion } from "mongodb";

async function ensureIndexes() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error("MONGODB_URI no está configurada.");
  }

  const client = new MongoClient(uri, {
    appName: "green-days-indexes",
    connectTimeoutMS: 5_000,
    serverSelectionTimeoutMS: 5_000,
    maxPoolSize: 5,
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
  });
  const database = client.db(process.env.MONGODB_DATABASE ?? "green_days");

  try {
    await Promise.all([
      database.collection("entry_documents").createIndex({ userId: 1, entryDate: -1 }),
      database.collection("entry_documents").createIndex({ userId: 1, updatedAt: -1 }),
      database.collection("entry_versions").createIndex({ entryId: 1, revision: -1 }, { unique: true }),
      database
        .collection("entry_versions")
        .createIndex({ savedAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 365 }),
      database.collection("capsule_documents").createIndex({ userId: 1, updatedAt: -1 }),
      database.collection("album_presentations").createIndex({ userId: 1, updatedAt: -1 }),
      database.collection("custom_themes").createIndex({ userId: 1, name: 1 }, { unique: true }),
    ]);

    console.log("Índices de MongoDB listos.");
  } finally {
    await client.close();
  }
}

ensureIndexes()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  });
