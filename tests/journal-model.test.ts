import assert from "node:assert/strict";
import test from "node:test";
import { entryDocumentSchema } from "../src/db/mongodb/schemas";
import { createDefaultBook } from "../src/features/journal/default-book";

test("el libro inicial contiene dos páginas de libreta válidas", () => {
  const book = createDefaultBook();
  const document = entryDocumentSchema.parse({
    _id: "6bc2b8ac-d004-4b18-92d7-7eb6d8562c55",
    userId: "64fbd0c4-2197-446f-a573-fd30eadf6214",
    entryDate: "2026-08-30",
    schemaVersion: 1,
    revision: 1,
    book,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  assert.equal(document.book.pages.length, 2);
  assert.equal(document.book.pages[0].side, "left");
  assert.equal(document.book.pages[1].side, "right");
  assert.equal(document.book.pages.every((page) => page.elements[0]?.type === "text"), true);
});
