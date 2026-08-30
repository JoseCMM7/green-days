import "server-only";

import { defineRelations } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

type Database = ReturnType<typeof createDatabase>;

let database: Database | undefined;

function createDatabase(url: string) {
  const client = postgres(url, {
    max: 1,
    prepare: false,
  });
  const relations = defineRelations(schema);

  return drizzle({ client, relations });
}

export function getPostgresDatabase() {
  const url = process.env.DATABASE_URL;

  if (!url) {
    throw new Error("DATABASE_URL no está configurada.");
  }

  database ??= createDatabase(url);
  return database;
}
