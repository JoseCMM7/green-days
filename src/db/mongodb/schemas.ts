import { z } from "zod";

const uuidSchema = z.uuid();
const colorSchema = z.string().regex(/^#[0-9a-f]{6}$/i, "Debe ser un color hexadecimal.");

export const pageFrameSchema = z.object({
  x: z.number().min(0),
  y: z.number().min(0),
  width: z.number().positive(),
  height: z.number().positive(),
  rotation: z.number().min(-360).max(360).default(0),
  zIndex: z.int().min(0).default(0),
  locked: z.boolean().default(false),
});

const baseElementSchema = z.object({
  id: uuidSchema,
  frame: pageFrameSchema,
});

const textElementSchema = baseElementSchema.extend({
  type: z.literal("text"),
  content: z.object({
    text: z.string().max(50_000),
    fontFamily: z.string().default("Caveat"),
    fontSize: z.number().min(8).max(160).default(32),
    color: colorSchema.default("#503722"),
    alignment: z.enum(["left", "center", "right"]).default("left"),
    lineHeight: z.number().min(0.8).max(3).default(1.45),
    weight: z.enum(["normal", "semibold", "bold"]).default("normal"),
  }),
});

const stickerElementSchema = baseElementSchema.extend({
  type: z.literal("sticker"),
  content: z.object({
    stickerId: z.string().min(1),
    customMediaId: uuidSchema.optional(),
    opacity: z.number().min(0).max(1).default(1),
    flipX: z.boolean().default(false),
  }),
});

const photoElementSchema = baseElementSchema.extend({
  type: z.literal("photo"),
  content: z.object({
    mediaId: uuidSchema,
    fit: z.enum(["cover", "contain"]).default("cover"),
    cropX: z.number().min(0).max(1).default(0.5),
    cropY: z.number().min(0).max(1).default(0.5),
    filter: z.enum(["none", "warm", "vintage", "mono"]).default("none"),
    caption: z.string().max(1_000).optional(),
  }),
});

const audioElementSchema = baseElementSchema.extend({
  type: z.literal("audio"),
  content: z.object({
    mediaId: uuidSchema,
    label: z.string().max(120).default("Recuerdo de audio"),
    waveformColor: colorSchema.default("#b8781d"),
  }),
});

const drawingPointSchema = z.object({
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
  pressure: z.number().min(0).max(1).default(0.5),
});

const drawingElementSchema = baseElementSchema.extend({
  type: z.literal("drawing"),
  content: z.object({
    color: colorSchema,
    strokeWidth: z.number().min(1).max(80),
    paths: z.array(z.array(drawingPointSchema).min(2)).max(2_000),
  }),
});

export const pageElementSchema = z.discriminatedUnion("type", [
  textElementSchema,
  stickerElementSchema,
  photoElementSchema,
  audioElementSchema,
  drawingElementSchema,
]);

export const bookPageSchema = z.object({
  id: uuidSchema,
  pageNumber: z.int().positive(),
  side: z.enum(["left", "right"]),
  backgroundColor: colorSchema.default("#fbf0d4"),
  paperTexture: z.enum(["smooth", "fibrous", "recycled", "kraft"]).default("fibrous"),
  ruling: z
    .object({
      style: z.enum(["none", "lined", "grid", "dots"]).default("lined"),
      color: colorSchema.default("#d8c59d"),
      spacing: z.number().min(16).max(120).default(44),
    })
    .default({ style: "lined", color: "#d8c59d", spacing: 44 }),
  elements: z.array(pageElementSchema).max(500).default([]),
});

export const bookSchema = z.object({
  title: z.string().max(200).default("Mi día"),
  pageSize: z
    .object({
      width: z.literal(1000),
      height: z.literal(1400),
    })
    .default({ width: 1000, height: 1400 }),
  cover: z.object({
    color: colorSchema.default("#a96d2a"),
    material: z.enum(["cloth", "leather", "paperboard"]).default("cloth"),
    textureId: z.string().min(1).default("linen-warm"),
    titleColor: colorSchema.default("#f8e9bd"),
  }),
  spine: z.object({
    color: colorSchema.default("#70451f"),
    width: z.number().min(20).max(180).default(72),
  }),
  openingAnimation: z
    .object({
      style: z.enum(["gentle", "playful", "classic"]).default("gentle"),
      durationMs: z.int().min(250).max(4_000).default(1_100),
      perspective: z.number().min(600).max(4_000).default(1_800),
    })
    .default({ style: "gentle", durationMs: 1_100, perspective: 1_800 }),
  pages: z.array(bookPageSchema).min(2).max(200),
});

export const entryDocumentSchema = z
  .object({
    _id: uuidSchema,
    userId: uuidSchema,
    entryDate: z.iso.date(),
    schemaVersion: z.literal(1),
    revision: z.int().positive(),
    book: bookSchema,
    createdAt: z.date(),
    updatedAt: z.date(),
  })
  .superRefine((document, context) => {
    const { width, height } = document.book.pageSize;

    for (const [pageIndex, page] of document.book.pages.entries()) {
      for (const [elementIndex, element] of page.elements.entries()) {
        const { frame } = element;

        if (frame.x + frame.width > width || frame.y + frame.height > height) {
          context.addIssue({
            code: "custom",
            path: ["book", "pages", pageIndex, "elements", elementIndex, "frame"],
            message: "El elemento debe permanecer dentro de la página lógica.",
          });
        }
      }
    }
  });

export const entryVersionSchema = z.object({
  _id: uuidSchema,
  entryId: uuidSchema,
  userId: uuidSchema,
  revision: z.int().positive(),
  schemaVersion: z.literal(1),
  book: bookSchema,
  savedAt: z.date(),
});

export const capsuleDocumentSchema = z.object({
  _id: uuidSchema,
  userId: uuidSchema,
  schemaVersion: z.literal(1),
  message: z.string().max(50_000),
  presentation: z.object({
    paperColor: colorSchema,
    sealStickerId: z.string().min(1).optional(),
    revealStyle: z.enum(["letter", "box", "book"]),
  }),
  updatedAt: z.date(),
});

export const albumPresentationSchema = z.object({
  _id: uuidSchema,
  userId: uuidSchema,
  schemaVersion: z.literal(1),
  layout: z.enum(["scrapbook", "film", "storybook"]),
  accentColor: colorSchema,
  decorations: z.array(pageElementSchema).max(500).default([]),
  updatedAt: z.date(),
});

export const customThemeSchema = z.object({
  _id: uuidSchema,
  userId: uuidSchema,
  schemaVersion: z.literal(1),
  name: z.string().min(1).max(100),
  tokens: z.record(z.string(), z.string()).refine((tokens) => Object.keys(tokens).length <= 100),
  updatedAt: z.date(),
});

export type EntryDocument = z.infer<typeof entryDocumentSchema>;
export type EntryVersion = z.infer<typeof entryVersionSchema>;
export type CapsuleDocument = z.infer<typeof capsuleDocumentSchema>;
export type AlbumPresentation = z.infer<typeof albumPresentationSchema>;
export type CustomTheme = z.infer<typeof customThemeSchema>;
export type PageElement = z.infer<typeof pageElementSchema>;
