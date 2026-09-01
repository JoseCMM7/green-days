import type { PageElement } from "@/db/mongodb/schemas";
import type { JournalBook } from "./default-book";

export const MAX_UNDO_STEPS = 50;

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(Math.max(value, minimum), maximum);
}

export function pushBookSnapshot(stack: JournalBook[], book: JournalBook) {
  const next = [...stack, structuredClone(book)];
  return next.slice(-MAX_UNDO_STEPS);
}

export function mediaIdsInBook(book: JournalBook) {
  return new Set(book.pages.flatMap((page) => page.elements)
    .flatMap((element) => element.type === "photo" || element.type === "audio" ? [element.content.mediaId] : []));
}

export function duplicateBookElement(book: JournalBook, pageId: string, elementId: string, nextId: string) {
  const page = book.pages.find((candidate) => candidate.id === pageId);
  const source = page?.elements.find((element) => element.id === elementId);
  if (!page || !source || source.type === "text" || source.type === "drawing") return null;

  const duplicate: PageElement = structuredClone(source);
  duplicate.id = nextId;
  duplicate.frame.x = clamp(source.frame.x + 45, 0, 1000 - source.frame.width);
  duplicate.frame.y = clamp(source.frame.y + 45, 0, 1400 - source.frame.height);
  duplicate.frame.zIndex = Math.max(0, ...page.elements.map((element) => element.frame.zIndex)) + 1;
  duplicate.frame.locked = false;
  page.elements.push(duplicate);
  return duplicate;
}

export function nudgeBookElement(book: JournalBook, pageId: string, elementId: string, deltaX: number, deltaY: number) {
  const element = book.pages.find((page) => page.id === pageId)?.elements.find((candidate) => candidate.id === elementId);
  if (!element || element.frame.locked) return false;
  element.frame.x = clamp(element.frame.x + deltaX, 0, 1000 - element.frame.width);
  element.frame.y = clamp(element.frame.y + deltaY, 0, 1400 - element.frame.height);
  return true;
}

export function resizeBookElement(book: JournalBook, pageId: string, elementId: string, width: number) {
  const element = book.pages.find((page) => page.id === pageId)?.elements.find((candidate) => candidate.id === elementId);
  if (!element || element.frame.locked || element.type === "text" || element.type === "drawing") return false;
  const ratio = element.frame.height / element.frame.width;
  const maxWidth = Math.min(900, 1000 - element.frame.x, (1400 - element.frame.y) / ratio);
  const nextWidth = clamp(width, 90, Math.max(90, maxWidth));
  element.frame.width = nextWidth;
  element.frame.height = clamp(nextWidth * ratio, 80, 1100);
  return true;
}

export function cropPhoto(book: JournalBook, pageId: string, elementId: string, deltaX: number, deltaY: number) {
  const element = book.pages.find((page) => page.id === pageId)?.elements.find((candidate) => candidate.id === elementId);
  if (element?.type !== "photo") return false;
  element.content.cropX = clamp(element.content.cropX + deltaX, 0, 1);
  element.content.cropY = clamp(element.content.cropY + deltaY, 0, 1);
  return true;
}
