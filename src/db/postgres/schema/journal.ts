import {
  boolean,
  date,
  index,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { entryContentStatus } from "./enums";
import { profiles } from "./profiles";

export const journalEntries = pgTable(
  "journal_entries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    entryDate: date("entry_date", { mode: "string" }).notNull(),
    title: text("title"),
    dayColor: text("day_color"),
    contentStatus: entryContentStatus("content_status").default("pending").notNull(),
    currentRevision: integer("current_revision").default(1).notNull(),
    canResurface: boolean("can_resurface").default(true).notNull(),
    isSensitive: boolean("is_sensitive").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("journal_entries_user_date_unique").on(table.userId, table.entryDate),
    index("journal_entries_user_updated_idx").on(table.userId, table.updatedAt),
  ],
);

export const emotions = pgTable(
  "emotions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").references(() => profiles.id, { onDelete: "cascade" }),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    color: text("color").notNull(),
    icon: text("icon"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("emotions_user_idx").on(table.userId)],
);

export const entryEmotions = pgTable(
  "entry_emotions",
  {
    entryId: uuid("entry_id")
      .notNull()
      .references(() => journalEntries.id, { onDelete: "cascade" }),
    emotionId: uuid("emotion_id")
      .notNull()
      .references(() => emotions.id, { onDelete: "cascade" }),
    intensity: integer("intensity").default(3).notNull(),
    isPrimary: boolean("is_primary").default(false).notNull(),
  },
  (table) => [primaryKey({ columns: [table.entryId, table.emotionId] })],
);
