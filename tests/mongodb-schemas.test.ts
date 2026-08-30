import assert from "node:assert/strict";
import test from "node:test";
import { entryDocumentSchema } from "../src/db/mongodb/schemas";

const entryId = "9f80ae8e-573c-47b1-9b11-f4bdf619dc7f";
const userId = "805c36aa-44cb-4392-bfe6-248588261135";

function createBookWithSticker() {
  return {
    _id: entryId,
    userId,
    entryDate: "2026-08-30",
    schemaVersion: 1 as const,
    revision: 1,
    createdAt: new Date("2026-08-30T12:00:00Z"),
    updatedAt: new Date("2026-08-30T12:00:00Z"),
    book: {
      cover: {
        color: "#a96d2a",
        material: "cloth" as const,
        textureId: "linen-warm",
        titleColor: "#f8e9bd",
      },
      spine: { color: "#70451f", width: 72 },
      pages: [
        {
          id: "00d68085-b412-4272-b5c8-33a7089cd988",
          pageNumber: 1,
          side: "left" as const,
          elements: [
            {
              id: "3783851e-3e60-4dbb-9cae-45e80ab4fc98",
              type: "sticker" as const,
              frame: {
                x: 124,
                y: 246,
                width: 180,
                height: 180,
                rotation: -12,
                zIndex: 4,
                locked: false,
              },
              content: { stickerId: "pressed-flower", opacity: 1, flipX: false },
            },
          ],
        },
        {
          id: "0890fddd-65cf-44ad-9dc1-f44421922ef1",
          pageNumber: 2,
          side: "right" as const,
          elements: [],
        },
      ],
    },
  };
}

test("conserva la posición, rotación y profundidad de un sticker", () => {
  const result = entryDocumentSchema.parse(createBookWithSticker());
  const sticker = result.book.pages[0].elements[0];

  assert.equal(sticker.type, "sticker");
  assert.deepEqual(sticker.frame, {
    x: 124,
    y: 246,
    width: 180,
    height: 180,
    rotation: -12,
    zIndex: 4,
    locked: false,
  });
});

test("rechaza elementos que quedan fuera de la página", () => {
  const input = createBookWithSticker();
  input.book.pages[0].elements[0].frame.x = 950;

  const result = entryDocumentSchema.safeParse(input);
  assert.equal(result.success, false);
});
