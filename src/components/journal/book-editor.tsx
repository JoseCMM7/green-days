"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PageElement } from "@/db/mongodb/schemas";
import { moodCatalog, type MoodOption, type MoodSlug } from "@/features/calendar/moods";
import {
  addDrawingPath,
  createBookSpread,
  MAX_JOURNAL_PAGES,
  normalizedDrawingPoint,
  pagesInSpread,
  pointsToSvgPath,
  removeLastBookSpread,
  spreadCount,
  undoLastDrawingPath,
} from "@/features/journal/book-pages";
import type { JournalBook } from "@/features/journal/default-book";
import { formatEntryDate } from "@/features/journal/date";

type BookEditorProps = {
  entryId: string;
  entryDate: string;
  initialRevision: number;
  initialBook: JournalBook;
  initialPrimaryMood: MoodOption | null;
};

type SaveStatus = "saved" | "unsaved" | "saving" | "error" | "conflict";
type StickerElement = Extract<PageElement, { type: "sticker" }>;
type DrawingElement = Extract<PageElement, { type: "drawing" }>;
type DrawingPoint = DrawingElement["content"]["paths"][number][number];
type EditorTool = "write" | "draw";

const stickerPalette = [
  { id: "pressed-flower", glyph: "🌼", label: "Flor" },
  { id: "little-sun", glyph: "☀️", label: "Sol" },
  { id: "green-leaf", glyph: "🍃", label: "Hoja" },
  { id: "warm-heart", glyph: "🧡", label: "Corazón" },
  { id: "tiny-star", glyph: "⭐", label: "Estrella" },
  { id: "paper-tape", glyph: "🎟️", label: "Recorte" },
];

const stickerGlyphs = Object.fromEntries(
  stickerPalette.map((sticker) => [sticker.id, sticker.glyph]),
);

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(Math.max(value, minimum), maximum);
}

function SaveIndicator({ status }: { status: SaveStatus }) {
  const labels: Record<SaveStatus, string> = {
    saved: "Guardado",
    unsaved: "Cambios pendientes",
    saving: "Guardando…",
    error: "No se pudo guardar",
    conflict: "Hay una versión más reciente",
  };

  return (
    <span
      aria-live="polite"
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold ${
        status === "saved"
          ? "bg-[#dbe3bd] text-[#4e5a3c]"
          : status === "error" || status === "conflict"
            ? "bg-[#f2cbb8] text-[#843a28]"
            : "bg-[var(--yellow-soft)] text-[var(--brown-dark)]"
      }`}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {labels[status]}
    </span>
  );
}

export function BookEditor({
  entryId,
  entryDate,
  initialRevision,
  initialBook,
  initialPrimaryMood,
}: BookEditorProps) {
  const [book, setBook] = useState(initialBook);
  const [isOpen, setIsOpen] = useState(false);
  const [spreadIndex, setSpreadIndex] = useState(0);
  const [activePageId, setActivePageId] = useState(initialBook.pages[0].id);
  const [editorTool, setEditorTool] = useState<EditorTool>("write");
  const [drawingColor, setDrawingColor] = useState("#805735");
  const [drawingWidth, setDrawingWidth] = useState(8);
  const [drawingPreview, setDrawingPreview] = useState<DrawingPoint[]>([]);
  const [selectedSticker, setSelectedSticker] = useState<{
    pageId: string;
    elementId: string;
  } | null>(null);
  const [status, setStatus] = useState<SaveStatus>("saved");
  const [revision, setRevision] = useState(initialRevision);
  const [primaryMoodSlug, setPrimaryMoodSlug] = useState<MoodSlug | null>(
    initialPrimaryMood?.slug ?? null,
  );
  const bookRef = useRef(book);
  const revisionRef = useRef(revision);
  const primaryMoodRef = useRef<MoodSlug | null>(primaryMoodSlug);
  const dirtyRef = useRef(false);
  const savingRef = useRef(false);
  const drawingPathRef = useRef<DrawingPoint[]>([]);
  const drawingPageRef = useRef<string | null>(null);
  const saveFunctionRef = useRef<() => Promise<void>>(async () => undefined);

  const changeBook = useCallback((transform: (draft: JournalBook) => void) => {
    setBook((current) => {
      const next = structuredClone(current);
      transform(next);
      bookRef.current = next;
      dirtyRef.current = true;
      setStatus("unsaved");
      return next;
    });
  }, []);

  const saveNow = useCallback(async () => {
    if (!dirtyRef.current || savingRef.current) return;

    savingRef.current = true;
    dirtyRef.current = false;
    setStatus("saving");

    try {
      const response = await fetch("/api/journal/today", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          expectedRevision: revisionRef.current,
          book: bookRef.current,
          primaryMoodSlug: primaryMoodRef.current,
        }),
      });
      const result = (await response.json()) as { revision?: number; error?: string };

      if (response.status === 409) {
        setStatus("conflict");
        return;
      }

      if (!response.ok || !result.revision) {
        throw new Error(result.error ?? "No se pudo guardar.");
      }

      revisionRef.current = result.revision;
      setRevision(result.revision);
      setStatus(dirtyRef.current ? "unsaved" : "saved");
    } catch {
      dirtyRef.current = true;
      setStatus("error");
    } finally {
      savingRef.current = false;
      if (dirtyRef.current) {
        window.setTimeout(() => void saveFunctionRef.current(), 500);
      }
    }
  }, []);

  useEffect(() => {
    saveFunctionRef.current = saveNow;
  }, [saveNow]);

  useEffect(() => {
    if (!dirtyRef.current) return;
    const timeout = window.setTimeout(() => void saveNow(), 1_100);
    return () => window.clearTimeout(timeout);
  }, [book, primaryMoodSlug, saveNow]);

  function selectMood(slug: MoodSlug) {
    const nextMood = primaryMoodRef.current === slug ? null : slug;
    primaryMoodRef.current = nextMood;
    setPrimaryMoodSlug(nextMood);
    dirtyRef.current = true;
    setStatus("unsaved");
  }

  function goToSpread(nextIndex: number) {
    const safeIndex = clamp(nextIndex, 0, spreadCount(bookRef.current) - 1);
    const [firstPage] = pagesInSpread(bookRef.current, safeIndex);
    setSpreadIndex(safeIndex);
    if (firstPage) setActivePageId(firstPage.id);
    setSelectedSticker(null);
    setDrawingPreview([]);
  }

  function addSpread() {
    if (bookRef.current.pages.length >= MAX_JOURNAL_PAGES) return;
    const newPages = createBookSpread(bookRef.current);
    const nextSpreadIndex = spreadCount(bookRef.current);
    changeBook((draft) => { draft.pages.push(...newPages); });
    setSpreadIndex(nextSpreadIndex);
    setActivePageId(newPages[0].id);
    setSelectedSticker(null);
  }

  function removeLastSpread() {
    if (bookRef.current.pages.length <= 2 || !window.confirm("¿Quitar el último pliego? También se borrará lo escrito y dibujado en esas dos páginas.")) return;
    changeBook((draft) => { removeLastBookSpread(draft); });
    const nextIndex = Math.max(0, spreadCount(bookRef.current) - 2);
    const [firstPage] = pagesInSpread(bookRef.current, nextIndex);
    setSpreadIndex(nextIndex);
    if (firstPage) setActivePageId(firstPage.id);
    setSelectedSticker(null);
  }

  function drawingPoint(event: React.PointerEvent<HTMLElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    return normalizedDrawingPoint(
      event.clientX - bounds.left,
      event.clientY - bounds.top,
      bounds.width,
      bounds.height,
      event.pressure,
    );
  }

  function beginDrawing(event: React.PointerEvent<HTMLDivElement>, pageId: string) {
    if (editorTool !== "draw") return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    const point = drawingPoint(event);
    drawingPageRef.current = pageId;
    drawingPathRef.current = [point];
    setDrawingPreview([point]);
    setActivePageId(pageId);
    setSelectedSticker(null);
  }

  function continueDrawing(event: React.PointerEvent<HTMLDivElement>) {
    if (!event.currentTarget.hasPointerCapture(event.pointerId) || drawingPageRef.current === null) return;
    const point = drawingPoint(event);
    const previous = drawingPathRef.current.at(-1);
    if (previous && Math.hypot(point.x - previous.x, point.y - previous.y) < 0.0025) return;
    drawingPathRef.current = [...drawingPathRef.current, point];
    setDrawingPreview(drawingPathRef.current);
  }

  function finishDrawing(event: React.PointerEvent<HTMLDivElement>) {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    const pageId = drawingPageRef.current;
    const path = drawingPathRef.current;
    drawingPageRef.current = null;
    drawingPathRef.current = [];
    setDrawingPreview([]);
    if (!pageId || path.length < 2) return;
    changeBook((draft) => {
      const page = draft.pages.find((candidate) => candidate.id === pageId);
      if (page) addDrawingPath(page, path, drawingColor, drawingWidth);
    });
  }

  function undoDrawing() {
    changeBook((draft) => {
      const page = draft.pages.find((candidate) => candidate.id === activePageId);
      if (page) undoLastDrawingPath(page);
    });
  }

  function clearDrawings() {
    if (!window.confirm("¿Borrar todos los dibujos de esta página?")) return;
    changeBook((draft) => {
      const page = draft.pages.find((candidate) => candidate.id === activePageId);
      if (page) page.elements = page.elements.filter((element) => element.type !== "drawing");
    });
  }

  function updateText(pageId: string, elementId: string, text: string) {
    changeBook((draft) => {
      const page = draft.pages.find((candidate) => candidate.id === pageId);
      const element = page?.elements.find((candidate) => candidate.id === elementId);
      if (element?.type === "text") element.content.text = text;
    });
  }

  function addSticker(stickerId: string) {
    const pageId = activePageId;
    const elementId = crypto.randomUUID();

    changeBook((draft) => {
      const page = draft.pages.find((candidate) => candidate.id === pageId);
      if (!page) return;
      const offset = (page.elements.filter((element) => element.type === "sticker").length % 5) * 36;
      page.elements.push({
        id: elementId,
        type: "sticker",
        frame: {
          x: 410 + offset,
          y: 500 + offset,
          width: 180,
          height: 180,
          rotation: -8 + offset / 6,
          zIndex: 10 + page.elements.length,
          locked: false,
        },
        content: {
          stickerId,
          opacity: 1,
          flipX: false,
        },
      });
    });
    setSelectedSticker({ pageId, elementId });
  }

  function updateSticker(pageId: string, elementId: string, transform: (sticker: StickerElement) => void) {
    changeBook((draft) => {
      const element = draft.pages
        .find((page) => page.id === pageId)
        ?.elements.find((candidate) => candidate.id === elementId);
      if (element?.type === "sticker") transform(element);
    });
  }

  function deleteSelectedSticker() {
    if (!selectedSticker) return;
    changeBook((draft) => {
      const page = draft.pages.find((candidate) => candidate.id === selectedSticker.pageId);
      if (page) {
        page.elements = page.elements.filter(
          (element) => element.id !== selectedSticker.elementId,
        );
      }
    });
    setSelectedSticker(null);
  }

  function handleStickerPointerDown(
    event: React.PointerEvent<HTMLButtonElement>,
    pageId: string,
    sticker: StickerElement,
  ) {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    setActivePageId(pageId);
    setSelectedSticker({ pageId, elementId: sticker.id });

    const pageElement = event.currentTarget.closest<HTMLElement>("[data-book-page]");
    if (!pageElement) return;
    const pageRect = pageElement.getBoundingClientRect();
    const startX = event.clientX;
    const startY = event.clientY;
    const initialX = sticker.frame.x;
    const initialY = sticker.frame.y;

    function move(pointerEvent: PointerEvent) {
      const deltaX = ((pointerEvent.clientX - startX) / pageRect.width) * 1000;
      const deltaY = ((pointerEvent.clientY - startY) / pageRect.height) * 1400;
      updateSticker(pageId, sticker.id, (draftSticker) => {
        draftSticker.frame.x = clamp(initialX + deltaX, 0, 1000 - draftSticker.frame.width);
        draftSticker.frame.y = clamp(initialY + deltaY, 0, 1400 - draftSticker.frame.height);
      });
    }

    function finish() {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", finish);
    }

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", finish, { once: true });
  }

  const selectedStickerData = selectedSticker
    ? book.pages
        .find((page) => page.id === selectedSticker.pageId)
        ?.elements.find((element) => element.id === selectedSticker.elementId)
    : null;
  const visiblePages = pagesInSpread(book, spreadIndex);
  const totalSpreads = spreadCount(book);

  return (
    <div className="book-editor" data-entry-id={entryId}>
      <div className="mb-5 flex flex-col gap-4 rounded-[1.5rem] border border-[var(--line)] bg-[rgba(249,237,209,0.86)] p-4 shadow-sm backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--ochre)]">
            {formatEntryDate(entryDate)}
          </p>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Revisión {revision} · {isOpen ? "Tu libro está abierto" : "Toca la portada para comenzar"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SaveIndicator status={status} />
          {(status === "error" || status === "unsaved") && (
            <button
              type="button"
              onClick={() => void saveNow()}
              className="rounded-full border border-[var(--brown-light)] bg-[#fff3d4] px-4 py-2 text-xs font-bold text-[var(--brown)]"
            >
              Guardar ahora
            </button>
          )}
          {status === "conflict" && (
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-full bg-[var(--brown-dark)] px-4 py-2 text-xs font-bold text-[var(--paper)]"
            >
              Cargar versión reciente
            </button>
          )}
        </div>
      </div>

      <section className="mb-5 rounded-[1.5rem] border border-[var(--line)] bg-[var(--paper)] p-4 sm:p-5" aria-label="Herramientas del libro">
        <div className="mb-5 border-b border-[var(--line)] pb-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.15em] text-[var(--muted)]">
                ¿Cómo se sintió este día?
              </p>
              <p className="mt-1 text-xs text-[var(--muted)]">Elige una emoción principal; podrás cambiarla cuando quieras.</p>
            </div>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Emoción principal del día">
              {moodCatalog.map((mood) => {
                const isSelected = primaryMoodSlug === mood.slug;
                return (
                  <button
                    key={mood.slug}
                    type="button"
                    onClick={() => selectMood(mood.slug)}
                    aria-pressed={isSelected}
                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-bold transition hover:-translate-y-0.5 ${
                      isSelected
                        ? "border-[var(--brown)] bg-[#fff3d4] text-[var(--brown-dark)] shadow-sm"
                        : "border-[var(--line)] bg-[#fff9e9] text-[var(--muted)]"
                    }`}
                  >
                    <span className="text-base" aria-hidden="true">{mood.icon}</span>
                    {mood.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        <div className="mb-5 flex flex-col gap-4 border-b border-[var(--line)] pb-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-[var(--muted)]">Herramienta creativa</p>
            <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Herramienta activa">
              <button type="button" disabled={!isOpen} onClick={() => setEditorTool("write")} aria-pressed={editorTool === "write"} className={`tool-pill ${editorTool === "write" ? "bg-[var(--yellow-soft)]" : ""}`}>✍️ Escribir y mover</button>
              <button type="button" disabled={!isOpen} onClick={() => { setEditorTool("draw"); setSelectedSticker(null); }} aria-pressed={editorTool === "draw"} className={`tool-pill ${editorTool === "draw" ? "bg-[var(--yellow-soft)]" : ""}`}>🖍️ Dibujar</button>
            </div>
          </div>
          {editorTool === "draw" && (
            <div className="flex flex-wrap items-end gap-3 rounded-2xl bg-[#fff8e8] p-3">
              <label className="grid gap-1 text-[0.68rem] font-bold uppercase tracking-[0.1em] text-[var(--muted)]">Color<input type="color" value={drawingColor} onChange={(event) => setDrawingColor(event.target.value)} className="h-9 w-16 rounded-lg border border-[var(--line)] p-1" /></label>
              <label className="grid gap-1 text-[0.68rem] font-bold uppercase tracking-[0.1em] text-[var(--muted)]">Trazo<select value={drawingWidth} onChange={(event) => setDrawingWidth(Number(event.target.value))} className="h-9 rounded-lg border border-[var(--line)] bg-white px-2 text-xs font-normal normal-case"><option value={4}>Fino</option><option value={8}>Medio</option><option value={16}>Grueso</option><option value={28}>Marcador</option></select></label>
              <button type="button" onClick={undoDrawing} className="tool-pill">Deshacer trazo</button>
              <button type="button" onClick={clearDrawings} className="rounded-full bg-[#f1c8b4] px-4 py-2 text-xs font-bold text-[#843a28]">Borrar dibujos</button>
            </div>
          )}
        </div>
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-[var(--muted)]">
              Stickers
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {stickerPalette.map((sticker) => (
                <button
                  key={sticker.id}
                  type="button"
                  onClick={() => addSticker(sticker.id)}
                  disabled={!isOpen}
                  title={`Añadir ${sticker.label.toLowerCase()}`}
                  className="grid size-11 place-items-center rounded-2xl border border-[var(--brown-light)] bg-[#fff6df] text-2xl transition hover:-translate-y-1 hover:bg-[var(--yellow-soft)] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {sticker.glyph}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 text-xs font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
              Pliego
            </span>
            {Array.from({ length: totalSpreads }, (_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => goToSpread(index)}
                className={`rounded-full px-4 py-2 text-xs font-bold transition ${
                  spreadIndex === index
                    ? "bg-[var(--yellow)] text-[var(--brown-dark)]"
                    : "border border-[var(--brown-light)] bg-[#fff6df] text-[var(--brown)]"
                }`}
              >
                {index * 2 + 1}–{index * 2 + 2}
              </button>
            ))}
            <button type="button" onClick={() => goToSpread(spreadIndex - 1)} disabled={spreadIndex === 0} className="tool-pill disabled:opacity-40" aria-label="Pliego anterior">←</button>
            <button type="button" onClick={() => goToSpread(spreadIndex + 1)} disabled={spreadIndex >= totalSpreads - 1} className="tool-pill disabled:opacity-40" aria-label="Pliego siguiente">→</button>
            <button type="button" onClick={addSpread} disabled={!isOpen || book.pages.length >= MAX_JOURNAL_PAGES} className="tool-pill disabled:opacity-40">+ Dos páginas</button>
            {book.pages.length > 2 && <button type="button" onClick={removeLastSpread} className="rounded-full bg-[#f1c8b4] px-4 py-2 text-xs font-bold text-[#843a28]">Quitar últimas</button>}

            {selectedStickerData?.type === "sticker" && selectedSticker && (
              <>
                <span className="mx-1 h-7 w-px bg-[var(--line)]" />
                <button
                  type="button"
                  onClick={() =>
                    updateSticker(selectedSticker.pageId, selectedSticker.elementId, (sticker) => {
                      sticker.frame.rotation = (sticker.frame.rotation + 15) % 360;
                    })
                  }
                  className="tool-pill"
                >
                  Girar
                </button>
                <button
                  type="button"
                  onClick={() =>
                    updateSticker(selectedSticker.pageId, selectedSticker.elementId, (sticker) => {
                      const nextSize = clamp(sticker.frame.width + 30, 90, 360);
                      sticker.frame.width = nextSize;
                      sticker.frame.height = nextSize;
                      sticker.frame.x = clamp(sticker.frame.x, 0, 1000 - nextSize);
                      sticker.frame.y = clamp(sticker.frame.y, 0, 1400 - nextSize);
                    })
                  }
                  className="tool-pill"
                  aria-label="Aumentar sticker"
                >
                  +
                </button>
                <button
                  type="button"
                  onClick={() =>
                    updateSticker(selectedSticker.pageId, selectedSticker.elementId, (sticker) => {
                      const nextSize = clamp(sticker.frame.width - 30, 90, 360);
                      sticker.frame.width = nextSize;
                      sticker.frame.height = nextSize;
                    })
                  }
                  className="tool-pill"
                  aria-label="Reducir sticker"
                >
                  −
                </button>
                <button
                  type="button"
                  onClick={deleteSelectedSticker}
                  className="rounded-full bg-[#f1c8b4] px-4 py-2 text-xs font-bold text-[#843a28]"
                >
                  Quitar
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      <div className="book-stage">
        <div className={`book-object ${isOpen ? "is-open" : ""}`}>
          <div className="book-pages" aria-hidden={!isOpen}>
            {visiblePages.map((page) => (
              <section
                key={page.id}
                data-book-page
                onPointerDown={() => setActivePageId(page.id)}
                className={`notebook-page ${page.side === "left" ? "notebook-page-left" : "notebook-page-right"} ${activePageId === page.id ? "is-active" : ""}`}
                style={{ backgroundColor: page.backgroundColor }}
                aria-label={`Página ${page.pageNumber}`}
              >
                <span className="page-number">{page.pageNumber}</span>
                {page.elements.map((element) => {
                  const frameStyle = {
                    left: `${element.frame.x / 10}%`,
                    top: `${element.frame.y / 14}%`,
                    width: `${element.frame.width / 10}%`,
                    height: `${element.frame.height / 14}%`,
                    zIndex: element.frame.zIndex,
                    transform: `rotate(${element.frame.rotation}deg)`,
                  };

                  if (element.type === "drawing") {
                    return (
                      <svg
                        key={element.id}
                        viewBox={`0 0 ${element.frame.width} ${element.frame.height}`}
                        preserveAspectRatio="none"
                        className="pointer-events-none absolute overflow-visible"
                        style={frameStyle}
                        aria-hidden="true"
                      >
                        {element.content.paths.map((path, pathIndex) => (
                          <path key={pathIndex} d={pointsToSvgPath(path, element.frame.width, element.frame.height)} fill="none" stroke={element.content.color} strokeWidth={element.content.strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
                        ))}
                      </svg>
                    );
                  }

                  if (element.type === "text") {
                    return (
                      <textarea
                        key={element.id}
                        value={element.content.text}
                        onChange={(event) => updateText(page.id, element.id, event.target.value)}
                        onFocus={() => setActivePageId(page.id)}
                        disabled={!isOpen}
                        placeholder={page.side === "left" ? "Hoy quiero recordar…" : "Y también…"}
                        className="page-writing"
                        style={{
                          ...frameStyle,
                          color: element.content.color,
                          fontFamily: element.content.fontFamily,
                          textAlign: element.content.alignment,
                          lineHeight: element.content.lineHeight,
                        }}
                        aria-label={`Texto de la página ${page.pageNumber}`}
                      />
                    );
                  }

                  if (element.type === "sticker") {
                    const isSelected = selectedSticker?.elementId === element.id;
                    return (
                      <button
                        key={element.id}
                        type="button"
                        onPointerDown={(event) => handleStickerPointerDown(event, page.id, element)}
                        className={`page-sticker ${isSelected ? "is-selected" : ""}`}
                        style={{ ...frameStyle, opacity: element.content.opacity }}
                        aria-label={`Sticker ${element.content.stickerId}. Arrástralo para moverlo.`}
                      >
                        {stickerGlyphs[element.content.stickerId] ?? "✨"}
                      </button>
                    );
                  }

                  return null;
                })}
                {editorTool === "draw" && isOpen && (
                  <div
                    className="absolute inset-0 z-50 cursor-crosshair touch-none"
                    role="application"
                    aria-label={`Lienzo de dibujo de la página ${page.pageNumber}`}
                    onPointerDown={(event) => beginDrawing(event, page.id)}
                    onPointerMove={continueDrawing}
                    onPointerUp={finishDrawing}
                    onPointerCancel={finishDrawing}
                  >
                    {page.id === activePageId && drawingPreview.length > 1 && (
                      <svg viewBox="0 0 1000 1400" preserveAspectRatio="none" className="size-full" aria-hidden="true">
                        <path d={pointsToSvgPath(drawingPreview)} fill="none" stroke={drawingColor} strokeWidth={drawingWidth} strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                )}
              </section>
            ))}
          </div>

          <button
            type="button"
            className="book-cover"
            style={{ backgroundColor: book.cover.color, color: book.cover.titleColor }}
            onClick={() => setIsOpen(true)}
            aria-label="Abrir el libro de hoy"
            aria-hidden={isOpen}
            tabIndex={isOpen ? -1 : 0}
          >
            <span className="book-cover-spine" style={{ background: book.spine.color }} />
            <span className="book-cover-border">
              <span className="book-cover-kicker">Green Days</span>
              <strong>Mi día</strong>
              <span className="book-cover-date">{formatEntryDate(entryDate)}</span>
              <span className="book-cover-flower" aria-hidden="true">✦</span>
              <span className="book-cover-hint">Toca para abrir</span>
            </span>
          </button>
        </div>
      </div>

      {isOpen && (
        <p className="mt-5 text-center text-sm leading-6 text-[var(--muted)]">
          Escribe, dibuja o coloca stickers. Añade pliegos cuando necesites más espacio; todo conserva su posición al guardarse.
        </p>
      )}
    </div>
  );
}
