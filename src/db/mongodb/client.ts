import "server-only";

import { MongoClient, ServerApiVersion } from "mongodb";

const globalForMongo = globalThis as typeof globalThis & {
  greenDaysMongoClient?: MongoClient;
};

function createMongoClient(uri: string) {
  return new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
  });
}

export function getMongoClient() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error("MONGODB_URI no está configurada.");
  }

  globalForMongo.greenDaysMongoClient ??= createMongoClient(uri);
  return globalForMongo.greenDaysMongoClient;
}

export function getMongoDatabase() {
  const databaseName = process.env.MONGODB_DATABASE ?? "green_days";
  return getMongoClient().db(databaseName);
}
