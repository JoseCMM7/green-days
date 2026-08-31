import assert from "node:assert/strict";
import test from "node:test";
import { addDrawingPath, appendBookSpread, normalizedDrawingPoint, pagesInSpread, pointsToSvgPath, removeLastBookSpread, undoLastDrawingPath } from "../src/features/journal/book-pages";
import { createDefaultBook } from "../src/features/journal/default-book";

test("añade y retira pliegos sin dejar un libro inválido", () => {
  const book = createDefaultBook();
  assert.equal(appendBookSpread(book), true);
  assert.deepEqual(book.pages.map((page) => page.pageNumber), [1, 2, 3, 4]);
  assert.equal(pagesInSpread(book, 1)[0]?.side, "left");
  assert.equal(removeLastBookSpread(book), true);
  assert.equal(book.pages.length, 2);
  assert.equal(removeLastBookSpread(book), false);
});

test("normaliza, serializa y deshace un trazo", () => {
  const book = createDefaultBook();
  const path = [
    normalizedDrawingPoint(0, 0, 500, 700),
    normalizedDrawingPoint(250, 350, 500, 700),
  ];
  assert.equal(pointsToSvgPath(path), "M 0.0 0.0 L 500.0 700.0");
  assert.equal(addDrawingPath(book.pages[0], path, "#493625", 8), true);
  assert.equal(book.pages[0].elements.some((element) => element.type === "drawing"), true);
  assert.equal(undoLastDrawingPath(book.pages[0]), true);
  assert.equal(book.pages[0].elements.some((element) => element.type === "drawing"), false);
});
