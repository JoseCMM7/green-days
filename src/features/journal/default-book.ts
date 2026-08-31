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
  friendly: '"Segoe Print", "Bradley Hand", cursive',
  elegant: 'Garamond, Georgia, serif',
};

export function createDefaultBook(appearance: BookAppearance = {}): JournalBook {
  return bookSchema.parse({
    title: "Mi día",
    cover: {
      color: appearance.coverColor ?? "#9a642f",
      material: "cloth",
      textureId: "linen-warm",
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
