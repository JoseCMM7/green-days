import assert from "node:assert/strict";
import test from "node:test";
import { pageElementSchema } from "../src/db/mongodb/schemas";
import { createDefaultBook, prepareBookForImmersiveEditing } from "../src/features/journal/default-book";
import type { JournalBook } from "../src/features/journal/default-book";
import { changeTextFontSize, clampBookZoom, cropPhoto, directionForSwipe, duplicateBookElement, MAX_UNDO_STEPS, mediaIdsInBook, mediaIdsInElements, moveBookElementToPage, nudgeBookElement, pushBookSnapshot, resizeBookElement, rotateBookElement } from "../src/features/journal/editor-operations";

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

test("actualiza la zona de escritura antigua sin alterar el original", () => {
  const book = createDefaultBook();
  const writing = book.pages[0].elements[0];
  if (writing.type !== "text") assert.fail("se esperaba texto");
  writing.frame.locked = true;
  writing.content.fontFamily = '"Segoe Print", cursive';
  const prepared = prepareBookForImmersiveEditing(book);
  const preparedWriting = prepared.pages[0].elements[0];
  assert.equal(preparedWriting.frame.locked, false);
  assert.match(preparedWriting.type === "text" ? preparedWriting.content.fontFamily : "", /font-pencil/);
  assert.equal(writing.frame.locked, true);
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

test("mueve una capa entre páginas y permite ajustar la escritura", () => {
  const book = bookWithPhoto();
  const source = book.pages[0];
  const target = book.pages[1];
  const photo = source.elements[1];
  const moved = moveBookElementToPage(book, source.id, target.id, photo.id, { x: 300, y: 220 });
  assert.equal(source.elements.some((element) => element.id === photo.id), false);
  assert.equal(target.elements.some((element) => element.id === photo.id), true);
  assert.equal(moved?.frame.x, 300);
  const writing = target.elements.find((element) => element.type === "text")!;
  writing.frame.locked = false;
  assert.equal(resizeBookElement(book, target.id, writing.id, 640), true);
  assert.equal(changeTextFontSize(book, target.id, writing.id, 8), true);
  assert.equal(writing.type === "text" && writing.content.fontSize, 50);
});

test("permite girar texto y stickers, pero respeta las capas bloqueadas", () => {
  const book = createDefaultBook();
  const page = book.pages[0];
  const writing = page.elements[0];
  writing.frame.locked = false;
  assert.equal(rotateBookElement(book, page.id, writing.id, -23), true);
  assert.equal(writing.frame.rotation, -23);

  const sticker = pageElementSchema.parse({
    id: crypto.randomUUID(),
    type: "sticker",
    frame: { x: 20, y: 20, width: 120, height: 120, rotation: 0, zIndex: 1, locked: false },
    content: { stickerId: "little-sun" },
  });
  page.elements.push(sticker);
  assert.equal(rotateBookElement(book, page.id, sticker.id, 37), true);
  assert.equal(sticker.frame.rotation, 37);
  sticker.frame.locked = true;
  assert.equal(rotateBookElement(book, page.id, sticker.id, 80), false);
  assert.equal(sticker.frame.rotation, 37);
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
