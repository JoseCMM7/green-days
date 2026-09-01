import assert from "node:assert/strict";
import test from "node:test";
import { pageElementSchema } from "../src/db/mongodb/schemas";
import { createDefaultBook } from "../src/features/journal/default-book";
import type { JournalBook } from "../src/features/journal/default-book";
import { clampBookZoom, cropPhoto, directionForSwipe, duplicateBookElement, MAX_UNDO_STEPS, mediaIdsInBook, mediaIdsInElements, nudgeBookElement, pushBookSnapshot, resizeBookElement } from "../src/features/journal/editor-operations";

function bookWithPhoto() {
  const book = createDefaultBook();
  book.pages[0].elements.push({
    id: "4e6d74c3-09fc-45ba-9bb2-a4f35af25df5",
    type: "photo",
    frame: { x: 900, y: 1200, width: 100, height: 100, rotation: 0, zIndex: 3, locked: false },
    content: { mediaId: "3bfd8ebb-b96e-41db-945f-13aa133ee023", fit: "cover", cropX: 0.5, cropY: 0.5, filter: "none" },
  });
  return book;
}

test("duplica una capa sin sacarla de la página", () => {
  const book = bookWithPhoto();
  const duplicate = duplicateBookElement(book, book.pages[0].id, book.pages[0].elements[1].id, "4449904d-c866-4b20-a1fd-7b93915fdf2a");
  assert.equal(duplicate?.frame.x, 900);
  assert.equal(duplicate?.frame.y, 1245);
  assert.equal(duplicate?.frame.locked, false);
  assert.equal(mediaIdsInBook(book).size, 1, "las copias comparten el mismo archivo privado");
});

test("las referencias de medios incluyen stickers personalizados", () => {
  const customMediaId = crypto.randomUUID();
  const sticker = pageElementSchema.parse({
    id: crypto.randomUUID(),
    type: "sticker",
    frame: { x: 20, y: 20, width: 120, height: 120, rotation: 0, zIndex: 1, locked: false },
    content: { stickerId: "personalizado", customMediaId },
  });

  assert.deepEqual([...mediaIdsInElements([sticker])], [customMediaId]);
});

test("mueve, redimensiona y recorta respetando los límites", () => {
  const book = bookWithPhoto();
  const page = book.pages[0];
  const photo = page.elements[1];
  assert.equal(nudgeBookElement(book, page.id, photo.id, 100, 100), true);
  assert.equal(photo.frame.x, 900);
  assert.equal(photo.frame.y, 1300);
  assert.equal(resizeBookElement(book, page.id, photo.id, 500), true);
  assert.equal(photo.frame.width, 100);
  assert.equal(cropPhoto(book, page.id, photo.id, 0.8, -0.8), true);
  assert.equal(photo.type === "photo" && photo.content.cropX, 1);
  assert.equal(photo.type === "photo" && photo.content.cropY, 0);
});

test("el historial local conserva como máximo cincuenta estados independientes", () => {
  const book = createDefaultBook();
  let snapshots: JournalBook[] = [];
  for (let index = 0; index < MAX_UNDO_STEPS + 5; index += 1) {
    book.title = `Versión ${index}`;
    snapshots = pushBookSnapshot(snapshots, book);
  }
  book.title = "Mutación posterior";
  assert.equal(snapshots.length, MAX_UNDO_STEPS);
  assert.equal(snapshots.at(-1)?.title, `Versión ${MAX_UNDO_STEPS + 4}`);
});

test("limita el zoom y distingue un gesto horizontal intencional", () => {
  assert.equal(clampBookZoom(0.2), 0.75);
  assert.equal(clampBookZoom(1.25), 1.25);
  assert.equal(clampBookZoom(3), 1.5);
  assert.equal(directionForSwipe(-80, 10), "next");
  assert.equal(directionForSwipe(80, 10), "previous");
  assert.equal(directionForSwipe(20, 5), null);
  assert.equal(directionForSwipe(80, 100), null);
});
