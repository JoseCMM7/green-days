import { index, pgTable, primaryKey, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { capsuleStatus } from "./enums";
import { journalEntries } from "./journal";
import { mediaAssets } from "./media";
import { profiles } from "./profiles";

export const timeCapsules = pgTable(
  "time_capsules",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    sourceEntryId: uuid("source_entry_id").references(() => journalEntries.id, {
      onDelete: "set null",
    }),
    title: text("title").notNull(),
    status: capsuleStatus("status").default("draft").notNull(),
    unlocksAt: timestamp("unlocks_at", { withTimezone: true }).notNull(),
    sealedAt: timestamp("sealed_at", { withTimezone: true }),
    openedAt: timestamp("opened_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("time_capsules_user_unlock_idx").on(table.userId, table.unlocksAt)],
);

export const capsuleMedia = pgTable(
  "capsule_media",
  {
    capsuleId: uuid("capsule_id")
      .notNull()
      .references(() => timeCapsules.id, { onDelete: "cascade" }),
    mediaId: uuid("media_id")
      .notNull()
      .references(() => mediaAssets.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.capsuleId, table.mediaId] })],
);
