import assert from "node:assert/strict";
import test from "node:test";
import { optimizedPhotoName, targetPhotoDimensions } from "../src/features/media/photo-preparation";

test("reduce fotografías grandes conservando su proporción", () => {
  assert.deepEqual(targetPhotoDimensions(4032, 3024), { width: 2400, height: 1800 });
  assert.deepEqual(targetPhotoDimensions(1200, 1800), { width: 1200, height: 1800 });
  assert.deepEqual(targetPhotoDimensions(3000, 4000, 2000), { width: 1500, height: 2000 });
});

test("crea un nombre WebP estable sin perder nombres con puntos", () => {
  assert.equal(optimizedPhotoName("viaje.verano.JPG"), "viaje.verano.webp");
  assert.equal(optimizedPhotoName(".png"), "fotografia.webp");
});
