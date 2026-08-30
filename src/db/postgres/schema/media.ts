import { bigint, index, integer, pgTable, primaryKey, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { mediaKind, mediaStatus } from "./enums";
import { journalEntries } from "./journal";
import { profiles } from "./profiles";

export const mediaAssets = pgTable(
  "media_assets",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    kind: mediaKind("kind").notNull(),
    status: mediaStatus("status").default("pending").notNull(),
    bucket: text("bucket").default("journal-media").notNull(),
    storagePath: text("storage_path").notNull(),
    mimeType: text("mime_type").notNull(),
    byteSize: bigint("byte_size", { mode: "number" }).notNull(),
    width: integer("width"),
    height: integer("height"),
    durationMs: integer("duration_ms"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [index("media_assets_user_created_idx").on(table.userId, table.createdAt)],
);

export const entryMedia = pgTable(
  "entry_media",
  {
    entryId: uuid("entry_id")
      .notNull()
      .references(() => journalEntries.id, { onDelete: "cascade" }),
    mediaId: uuid("media_id")
      .notNull()
      .references(() => mediaAssets.id, { onDelete: "cascade" }),
    sortOrder: integer("sort_order").default(0).notNull(),
    altText: text("alt_text"),
  },
  (table) => [primaryKey({ columns: [table.entryId, table.mediaId] })],
);
