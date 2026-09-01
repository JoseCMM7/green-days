import type { PageElement } from "@/db/mongodb/schemas";
import type { JournalBook } from "./default-book";

type JournalPage = JournalBook["pages"][number];
type DrawingPoint = Extract<PageElement, { type: "drawing" }>["content"]["paths"][number][number];

export const MAX_JOURNAL_PAGES = 40;

function defaultTextElement(template?: JournalPage): PageElement {
  const source = template?.elements.find((element) => element.type === "text");
  return {
    id: crypto.randomUUID(),
    type: "text",
    frame: source?.frame ? { ...source.frame, locked: false } : { x: 80, y: 120, width: 840, height: 1120, rotation: 0, zIndex: 1, locked: false },
    content: source?.type === "text"
      ? { ...source.content, text: "" }
      : { text: "", fontFamily: 'var(--font-pencil), "Segoe Print", "Bradley Hand", cursive', fontSize: 42, color: "#503722", alignment: "left", lineHeight: 1.45, weight: "normal" },
  };
}

function blankPage(pageNumber: number, side: "left" | "right", template?: JournalPage): JournalPage {
  return {
    id: crypto.randomUUID(),
    pageNumber,
    side,
    backgroundColor: template?.backgroundColor ?? "#fbf0d4",
    paperTexture: template?.paperTexture ?? "fibrous",
    ruling: template?.ruling ? { ...template.ruling } : { style: "lined", color: "#d8c59d", spacing: 44 },
    elements: [defaultTextElement(template)],
  };
}

export function spreadCount(book: JournalBook) {
  return Math.ceil(book.pages.length / 2);
}

export function pagesInSpread(book: JournalBook, spreadIndex: number) {
  const safeIndex = Math.min(Math.max(spreadIndex, 0), Math.max(0, spreadCount(book) - 1));
  return book.pages.slice(safeIndex * 2, safeIndex * 2 + 2);
}

export function appendBookSpread(book: JournalBook) {
  if (book.pages.length >= MAX_JOURNAL_PAGES) return false;
  book.pages.push(...createBookSpread(book));
  return true;
}

export function createBookSpread(book: JournalBook) {
  const nextNumber = book.pages.length + 1;
  const leftTemplate = book.pages[0];
  const rightTemplate = book.pages[1] ?? leftTemplate;
  return [
    blankPage(nextNumber, "left", leftTemplate),
    blankPage(nextNumber + 1, "right", rightTemplate),
  ];
}

export function removeLastBookSpread(book: JournalBook) {
  if (book.pages.length <= 2) return false;
  book.pages.splice(-2, 2);
  return true;
}

export function pointsToSvgPath(points: DrawingPoint[], width = 1000, height = 1400) {
  return points.map((point, index) => `${index === 0 ? "M" : "L"} ${(point.x * width).toFixed(1)} ${(point.y * height).toFixed(1)}`).join(" ");
}

export function normalizedDrawingPoint(x: number, y: number, width: number, height: number, pressure = 0.5): DrawingPoint {
  return {
    x: Math.min(Math.max(x / width, 0), 1),
    y: Math.min(Math.max(y / height, 0), 1),
    pressure: Math.min(Math.max(pressure || 0.5, 0), 1),
  };
}

export function addDrawingPath(page: JournalPage, path: DrawingPoint[], color: string, strokeWidth: number) {
  if (path.length < 2) return false;
  const existing = page.elements.find((element) =>
    element.type === "drawing" && element.content.color === color && element.content.strokeWidth === strokeWidth,
  );
  if (existing?.type === "drawing" && existing.content.paths.length < 2_000) {
    existing.content.paths.push(path);
    return true;
  }
  page.elements.push({
    id: crypto.randomUUID(),
    type: "drawing",
    frame: { x: 0, y: 0, width: 1000, height: 1400, rotation: 0, zIndex: 30, locked: false },
    content: { color, strokeWidth, paths: [path] },
  });
  return true;
}

export function undoLastDrawingPath(page: JournalPage) {
  for (let index = page.elements.length - 1; index >= 0; index -= 1) {
    const element = page.elements[index];
    if (element.type !== "drawing") continue;
    element.content.paths.pop();
    if (!element.content.paths.length) page.elements.splice(index, 1);
    return true;
  }
  return false;
}
