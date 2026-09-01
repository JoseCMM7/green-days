import type { PageElement } from "@/db/mongodb/schemas";
import type { JournalBook } from "./default-book";

export const MAX_UNDO_STEPS = 50;
export const MIN_BOOK_ZOOM = 0.75;
export const MAX_BOOK_ZOOM = 1.5;

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(Math.max(value, minimum), maximum);
}

export function pushBookSnapshot(stack: JournalBook[], book: JournalBook) {
  const next = [...stack, structuredClone(book)];
  return next.slice(-MAX_UNDO_STEPS);
}

export function clampBookZoom(value: number) {
  return clamp(value, MIN_BOOK_ZOOM, MAX_BOOK_ZOOM);
}

export function directionForSwipe(deltaX: number, deltaY: number, minimumDistance = 55) {
  if (Math.abs(deltaX) < minimumDistance || Math.abs(deltaX) <= Math.abs(deltaY)) return null;
  return deltaX < 0 ? "next" as const : "previous" as const;
}

export function mediaIdsInElements(elements: PageElement[]) {
  return new Set(elements.flatMap((element) => {
    if (element.type === "photo" || element.type === "audio") return [element.content.mediaId];
    if (element.type === "sticker" && element.content.customMediaId) return [element.content.customMediaId];
    return [];
  }));
}

export function mediaIdsInBook(book: JournalBook) {
  return mediaIdsInElements(book.pages.flatMap((page) => page.elements));
}

export function duplicateBookElement(book: JournalBook, pageId: string, elementId: string, nextId: string) {
  const page = book.pages.find((candidate) => candidate.id === pageId);
  const source = page?.elements.find((element) => element.id === elementId);
  if (!page || !source || source.type === "drawing") return null;

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

export function moveBookElementToPage(
  book: JournalBook,
  fromPageId: string,
  toPageId: string,
  elementId: string,
  position?: { x: number; y: number },
) {
  const sourcePage = book.pages.find((page) => page.id === fromPageId);
  const targetPage = book.pages.find((page) => page.id === toPageId);
  const elementIndex = sourcePage?.elements.findIndex((element) => element.id === elementId) ?? -1;
  if (!sourcePage || !targetPage || elementIndex < 0 || fromPageId === toPageId) return null;
  const [element] = sourcePage.elements.splice(elementIndex, 1);
  element.frame.x = clamp(position?.x ?? element.frame.x, 0, 1000 - element.frame.width);
  element.frame.y = clamp(position?.y ?? element.frame.y, 0, 1400 - element.frame.height);
  element.frame.zIndex = Math.max(0, ...targetPage.elements.map((candidate) => candidate.frame.zIndex)) + 1;
  targetPage.elements.push(element);
  return element;
}

export function changeTextFontSize(book: JournalBook, pageId: string, elementId: string, delta: number) {
  const element = book.pages.find((page) => page.id === pageId)?.elements.find((candidate) => candidate.id === elementId);
  if (element?.type !== "text") return false;
  element.content.fontSize = clamp(element.content.fontSize + delta, 8, 160);
  return true;
}

export function resizeBookElement(book: JournalBook, pageId: string, elementId: string, width: number) {
  const element = book.pages.find((page) => page.id === pageId)?.elements.find((candidate) => candidate.id === elementId);
  if (!element || element.frame.locked || element.type === "drawing") return false;
  const ratio = element.frame.height / element.frame.width;
  const minimumWidth = element.type === "text" ? 180 : 90;
  const maxWidth = Math.min(920, 1000 - element.frame.x, (1400 - element.frame.y) / ratio);
  const nextWidth = clamp(width, minimumWidth, Math.max(minimumWidth, maxWidth));
  element.frame.width = nextWidth;
  element.frame.height = clamp(nextWidth * ratio, element.type === "text" ? 160 : 80, 1260);
  return true;
}

export function cropPhoto(book: JournalBook, pageId: string, elementId: string, deltaX: number, deltaY: number) {
  const element = book.pages.find((page) => page.id === pageId)?.elements.find((candidate) => candidate.id === elementId);
  if (element?.type !== "photo") return false;
  element.content.cropX = clamp(element.content.cropX + deltaX, 0, 1);
  element.content.cropY = clamp(element.content.cropY + deltaY, 0, 1);
  return true;
}
