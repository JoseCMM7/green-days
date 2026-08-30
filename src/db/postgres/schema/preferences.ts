import { boolean, integer, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { profiles } from "./profiles";

export const userPreferences = pgTable("user_preferences", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => profiles.id, { onDelete: "cascade" }),
  defaultBookTheme: text("default_book_theme").default("warm-paper").notNull(),
  weekStartsOn: integer("week_starts_on").default(1).notNull(),
  reducedMotion: boolean("reduced_motion").default(false).notNull(),
  resurfacingEnabled: boolean("resurfacing_enabled").default(true).notNull(),
  reminderSettings: jsonb("reminder_settings")
    .$type<{ enabled: boolean; hour?: number; minute?: number }>()
    .default({ enabled: false })
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
