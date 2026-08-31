import "server-only";

import { eq } from "drizzle-orm";
import { getMongoCollections } from "@/db/mongodb/collections";
import { customThemeSchema } from "@/db/mongodb/schemas";
import { getPostgresDatabase } from "@/db/postgres/client";
import { userPreferences } from "@/db/postgres/schema";
import { THEME_PRESETS, themeCssVariables, themeTokensSchema, type ThemePresetId, type ThemeTokens } from "./model";

function presetId(value: string): ThemePresetId {
  const normalized = value.replace(/^preset:/, "") as ThemePresetId;
  return normalized in THEME_PRESETS ? normalized : "warm-paper";
}

export async function getPersonalization(userId: string) {
  const database = getPostgresDatabase();
  const [preference] = await database.select().from(userPreferences).where(eq(userPreferences.userId, userId)).limit(1);
  const selection = preference?.defaultBookTheme ?? "warm-paper";
  let tokens = THEME_PRESETS[presetId(selection)].tokens;
  let mode: ThemePresetId | "custom" = presetId(selection);

  if (selection.startsWith("custom:")) {
    const collections = await getMongoCollections();
    const document = await collections.customThemes.findOne({ _id: selection.slice(7), userId });
    const parsed = themeTokensSchema.safeParse(document?.tokens);
    if (parsed.success) { tokens = parsed.data; mode = "custom"; }
  }

  return {
    mode,
    tokens,
    reducedMotion: preference?.reducedMotion ?? false,
    cssVariables: themeCssVariables(tokens),
  };
}

export async function savePersonalization(userId: string, input: { mode: ThemePresetId | "custom"; reducedMotion: boolean; tokens: ThemeTokens }) {
  const database = getPostgresDatabase();
  let selection = `preset:${input.mode}`;
  if (input.mode === "custom") {
    const collections = await getMongoCollections();
    const existing = await collections.customThemes.findOne({ userId, name: "Mi estilo" });
    const themeId = existing?._id ?? crypto.randomUUID();
    const document = customThemeSchema.parse({ _id: themeId, userId, schemaVersion: 1, name: "Mi estilo", tokens: input.tokens, updatedAt: new Date() });
    await collections.customThemes.replaceOne({ _id: themeId, userId }, document, { upsert: true });
    selection = `custom:${themeId}`;
  }
  await database.insert(userPreferences).values({
    userId,
    defaultBookTheme: selection,
    reducedMotion: input.reducedMotion,
  }).onConflictDoUpdate({
    target: userPreferences.userId,
    set: { defaultBookTheme: selection, reducedMotion: input.reducedMotion, updatedAt: new Date() },
  });
}

export async function getBookAppearance(userId: string) {
  const { tokens } = await getPersonalization(userId);
  return {
    coverColor: tokens.brown,
    spineColor: tokens.brownDark,
    titleColor: tokens.paper,
    paperColor: tokens.paper,
    textColor: tokens.ink,
    displayFont: tokens.displayFont,
  };
}
