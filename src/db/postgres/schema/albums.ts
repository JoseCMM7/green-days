import { index, integer, jsonb, pgTable, primaryKey, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { albumVisibility } from "./enums";
import { journalEntries } from "./journal";
import { mediaAssets } from "./media";
import { profiles } from "./profiles";

export const albums = pgTable(
  "albums",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description"),
    autoRule: jsonb("auto_rule").$type<{
      fromDate?: string;
      toDate?: string;
      emotionSlug?: string;
    }>(),
    coverMediaId: uuid("cover_media_id").references(() => mediaAssets.id, {
      onDelete: "set null",
    }),
    visibility: albumVisibility("visibility").default("private").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("albums_user_updated_idx").on(table.userId, table.updatedAt)],
);

export const albumEntries = pgTable(
  "album_entries",
  {
    albumId: uuid("album_id")
      .notNull()
      .references(() => albums.id, { onDelete: "cascade" }),
    entryId: uuid("entry_id")
      .notNull()
      .references(() => journalEntries.id, { onDelete: "cascade" }),
    sortOrder: integer("sort_order").default(0).notNull(),
    addedAt: timestamp("added_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [primaryKey({ columns: [table.albumId, table.entryId] })],
);
