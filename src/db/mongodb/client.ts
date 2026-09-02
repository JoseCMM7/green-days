import "server-only";

import { MongoClient, ServerApiVersion } from "mongodb";

const globalForMongo = globalThis as typeof globalThis & {
  greenDaysMongoClientPromise?: Promise<MongoClient>;
  greenDaysMongoUri?: string;
};

function createMongoClient(uri: string) {
  return new MongoClient(uri, {
    appName: "green-days",
    connectTimeoutMS: 5_000,
    serverSelectionTimeoutMS: 5_000,
    maxPoolSize: 10,
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
  });
}

function connectMongoClient(uri: string) {
  const client = createMongoClient(uri);
  const connection = client.connect();
  const guardedConnection = connection.catch(async (error: unknown) => {
    if (globalForMongo.greenDaysMongoClientPromise === guardedConnection) {
      globalForMongo.greenDaysMongoClientPromise = undefined;
    }
    await client.close().catch(() => undefined);
    throw error;
  });

  return guardedConnection;
}

export async function getMongoClient() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error("MONGODB_URI no está configurada.");
  }

  if (globalForMongo.greenDaysMongoUri !== uri) {
    globalForMongo.greenDaysMongoClientPromise = undefined;
    globalForMongo.greenDaysMongoUri = uri;
  }

  globalForMongo.greenDaysMongoClientPromise ??= connectMongoClient(uri);
  return globalForMongo.greenDaysMongoClientPromise;
}

export async function resetMongoConnection() {
  const currentConnection = globalForMongo.greenDaysMongoClientPromise;
  globalForMongo.greenDaysMongoClientPromise = undefined;

  if (!currentConnection) return;
  const client = await currentConnection.catch(() => null);
  await client?.close().catch(() => undefined);
}

export async function getMongoDatabase() {
  const databaseName = process.env.MONGODB_DATABASE ?? "green_days";
  return (await getMongoClient()).db(databaseName);
}
