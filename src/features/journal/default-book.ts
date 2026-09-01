import { bookSchema, type EntryDocument } from "@/db/mongodb/schemas";

export type JournalBook = EntryDocument["book"];

type BookAppearance = {
  coverColor?: string;
  spineColor?: string;
  titleColor?: string;
  paperColor?: string;
  textColor?: string;
  displayFont?: "classic" | "friendly" | "elegant";
};

const writingFonts = {
  classic: 'Georgia, "Times New Roman", serif',
  friendly: 'var(--font-pencil), "Segoe Print", "Bradley Hand", cursive',
  elegant: 'Garamond, Georgia, serif',
};

export function createDefaultBook(appearance: BookAppearance = {}): JournalBook {
  return bookSchema.parse({
    title: "Mi día",
    cover: {
      color: appearance.coverColor ?? "#9a642f",
      material: "leather",
      textureId: "aged-cognac",
      titleColor: appearance.titleColor ?? "#f8e9bd",
    },
    spine: {
      color: appearance.spineColor ?? "#68411f",
      width: 72,
    },
    pages: [
      {
        id: crypto.randomUUID(),
        pageNumber: 1,
        side: "left",
        backgroundColor: appearance.paperColor ?? "#fbf0d4",
        elements: [
          {
            id: crypto.randomUUID(),
            type: "text",
            frame: {
              x: 80,
              y: 120,
              width: 840,
              height: 1120,
              rotation: 0,
              zIndex: 1,
              locked: false,
            },
            content: {
              text: "",
              fontFamily: writingFonts[appearance.displayFont ?? "friendly"],
              fontSize: 42,
              color: appearance.textColor ?? "#503722",
              alignment: "left",
              lineHeight: 1.45,
              weight: "normal",
            },
          },
        ],
      },
      {
        id: crypto.randomUUID(),
        pageNumber: 2,
        side: "right",
        backgroundColor: appearance.paperColor ?? "#fbf0d4",
        elements: [
          {
            id: crypto.randomUUID(),
            type: "text",
            frame: {
              x: 80,
              y: 120,
              width: 840,
              height: 1120,
              rotation: 0,
              zIndex: 1,
              locked: true,
            },
            content: {
              text: "",
              fontFamily: writingFonts[appearance.displayFont ?? "friendly"],
              fontSize: 42,
              color: appearance.textColor ?? "#503722",
              alignment: "left",
              lineHeight: 1.45,
              weight: "normal",
            },
          },
        ],
      },
    ],
  });
}

export function prepareBookForImmersiveEditing(book: JournalBook) {
  const prepared = structuredClone(book);
  for (const page of prepared.pages) {
    for (const element of page.elements) {
      if (element.type !== "text") continue;
      const usedLegacyHandwriting = /Segoe Print|Bradley Hand|Comic Sans|Caveat/i.test(element.content.fontFamily);
      const isLegacyWritingArea = element.frame.locked
        && element.frame.x === 80
        && element.frame.y === 120
        && element.frame.width === 840
        && element.frame.height === 1120;
      if (usedLegacyHandwriting) element.content.fontFamily = writingFonts.friendly;
      if (isLegacyWritingArea) element.frame.locked = false;
    }
  }
  return prepared;
}
