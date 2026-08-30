import "./envConfig";

import { defineConfig } from "drizzle-kit";

const connectionUrl = process.env.DIRECT_URL ?? process.env.DATABASE_URL;

export default defineConfig({
  schema: "./src/db/postgres/schema/index.ts",
  out: "./drizzle",
  dialect: "postgresql",
  strict: true,
  verbose: true,
  ...(connectionUrl
    ? {
        dbCredentials: {
          url: connectionUrl,
        },
      }
    : {}),
});
