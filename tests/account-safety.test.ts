import assert from "node:assert/strict";
import test from "node:test";
import { deletionPhrase, isDeletionConfirmed } from "../src/features/account/confirmation";
import { exportFilename } from "../src/features/account/export-format";

test("la eliminación exige una confirmación explícita y exacta", () => {
  assert.equal(deletionPhrase, "ELIMINAR");
  assert.equal(isDeletionConfirmed("ELIMINAR"), true);
  assert.equal(isDeletionConfirmed(" ELIMINAR "), true);
  assert.equal(isDeletionConfirmed("eliminar"), false);
  assert.equal(isDeletionConfirmed(null), false);
});

test("la exportación produce un nombre predecible sin datos personales", () => {
  const filename = exportFilename(new Date("2026-08-31T18:00:00.000Z"));
  assert.equal(filename, "green-days-2026-08-31.json");
  assert.equal(filename.includes("@"), false);
});

