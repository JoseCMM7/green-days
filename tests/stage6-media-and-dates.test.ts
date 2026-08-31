import assert from "node:assert/strict";
import test from "node:test";
import { capsuleInputSchema } from "../src/features/capsules/model";
import { isEntryDate, shiftEntryDate } from "../src/features/journal/date";
import { MAX_AUDIO_BYTES, MAX_PHOTO_BYTES, extensionForMedia, validateMediaFile } from "../src/features/media/model";

test("valida fechas reales y navega entre meses", () => {
  assert.equal(isEntryDate("2026-02-29"), false);
  assert.equal(isEntryDate("2028-02-29"), true);
  assert.equal(shiftEntryDate("2026-01-31", 1), "2026-02-01");
  assert.equal(shiftEntryDate("2026-01-01", -1), "2025-12-31");
});

test("acepta fotos y audios seguros respetando sus límites", () => {
  assert.deepEqual(validateMediaFile({ type: "image/webp", size: MAX_PHOTO_BYTES }), { ok: true, kind: "photo" });
  assert.deepEqual(validateMediaFile({ type: "audio/webm", size: MAX_AUDIO_BYTES }), { ok: true, kind: "audio" });
  assert.equal(validateMediaFile({ type: "image/png", size: MAX_PHOTO_BYTES + 1 }).ok, false);
  assert.equal(validateMediaFile({ type: "text/html", size: 10 }).ok, false);
  assert.equal(extensionForMedia("audio/mpeg"), "mp3");
});

test("una cápsula puede conservar o no el vínculo con una entrada", () => {
  const common = {
    title: "Para después",
    message: "Recuerda este momento",
    unlockDate: "2027-01-01",
    paperColor: "#f9edd1",
    revealStyle: "letter" as const,
  };
  assert.equal(capsuleInputSchema.parse({ ...common, sourceEntryId: "" }).sourceEntryId, undefined);
  assert.equal(capsuleInputSchema.parse({ ...common, sourceEntryId: "be1d52c0-605a-4f80-a2bc-1b6e37eef4e3" }).sourceEntryId, "be1d52c0-605a-4f80-a2bc-1b6e37eef4e3");
});
