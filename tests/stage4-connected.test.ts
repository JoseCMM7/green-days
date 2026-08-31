import assert from "node:assert/strict";
import test from "node:test";
import { albumRuleFromInput, entryMatchesAlbumRule } from "../src/features/albums/model";
import { canOpenCapsule, daysUntilCapsule, isFutureUnlockDate, unlockDateFromInput } from "../src/features/capsules/model";
import { THEME_PRESETS, themeCssVariables, themeTokensSchema } from "../src/features/personalization/model";

test("una cápsula futura permanece sellada hasta su fecha", () => {
  const now = new Date("2026-08-31T12:00:00.000Z");
  const unlocksAt = unlockDateFromInput("2026-09-03");
  assert.equal(isFutureUnlockDate("2026-09-03", now), true);
  assert.equal(canOpenCapsule(unlocksAt, now), false);
  assert.equal(daysUntilCapsule(unlocksAt, now), 3);
  assert.equal(canOpenCapsule(unlocksAt, new Date("2026-09-03T12:00:00.000Z")), true);
});

test("un álbum vivo combina fechas y emoción", () => {
  const rule = albumRuleFromInput({
    title: "Días serenos", description: undefined, layout: "scrapbook",
    accentColor: "#b8781d", fromDate: "2026-08-01", toDate: "2026-08-31", emotionSlug: "sereno",
  });
  assert.equal(entryMatchesAlbumRule({ entryDate: "2026-08-12", emotionSlug: "sereno" }, rule), true);
  assert.equal(entryMatchesAlbumRule({ entryDate: "2026-09-01", emotionSlug: "sereno" }, rule), false);
  assert.equal(entryMatchesAlbumRule({ entryDate: "2026-08-12", emotionSlug: "triste" }, rule), false);
});

test("los temas sólo producen variables CSS validadas", () => {
  const tokens = themeTokensSchema.parse(THEME_PRESETS["golden-hour"].tokens);
  const variables = themeCssVariables(tokens);
  assert.equal(variables["--cream"], "#f0d39c");
  assert.match(variables["--display-font"], /Segoe Print/);
});
