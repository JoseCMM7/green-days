import { bookSchema, type EntryDocument } from "@/db/mongodb/schemas";

export type JournalBook = EntryDocument["book"];

export function createDefaultBook(): JournalBook {
  return bookSchema.parse({
    title: "Mi día",
    cover: {
      color: "#9a642f",
      material: "cloth",
      textureId: "linen-warm",
      titleColor: "#f8e9bd",
    },
    spine: {
      color: "#68411f",
      width: 72,
    },
    pages: [
      {
        id: crypto.randomUUID(),
        pageNumber: 1,
        side: "left",
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
              fontFamily: "Caveat",
              fontSize: 42,
              color: "#503722",
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
              fontFamily: "Caveat",
              fontSize: 42,
              color: "#503722",
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
