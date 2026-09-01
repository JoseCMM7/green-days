"use client";

import Image from "next/image";
import { useCallback, useEffect, useEffectEvent, useRef, useState } from "react";
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
import { prepareBookForImmersiveEditing, type JournalBook } from "@/features/journal/default-book";
import { formatEntryDate } from "@/features/journal/date";
import { changeTextFontSize, clampBookZoom, cropPhoto, directionForSwipe, duplicateBookElement, moveBookElementToPage, nudgeBookElement, pushBookSnapshot, resizeBookElement } from "@/features/journal/editor-operations";
import { preparePhotoForUpload } from "@/features/media/photo-preparation";

type BookEditorProps = {
  entryId: string;
  entryDate: string;
  initialRevision: number;
  initialBook: JournalBook;
  initialPrimaryMood: MoodOption | null;
  autoOpen?: boolean;
};

type SaveStatus = "saved" | "unsaved" | "saving" | "offline" | "error" | "conflict";
type DrawingElement = Extract<PageElement, { type: "drawing" }>;
type DrawingPoint = DrawingElement["content"]["paths"][number][number];
type EditorTool = "write" | "draw";
type MediaStatus = "idle" | "preparing" | "uploading" | "recording" | "error";
type HistoryItem = { revision: number; savedAt: string; pageCount: number; excerpt: string };

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
const historyDateFormatter = new Intl.DateTimeFormat("es-MX", { dateStyle: "medium", timeStyle: "short" });

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(Math.max(value, minimum), maximum);
}

function SaveIndicator({ status }: { status: SaveStatus }) {
  const labels: Record<SaveStatus, string> = {
    saved: "Guardado",
    unsaved: "Cambios pendientes",
    saving: "Guardando…",
    offline: "Sin conexión · pendiente",
    error: "No se pudo guardar",
    conflict: "Hay una versión más reciente",
  };

  return (
    <span
      aria-live="polite"
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold ${
        status === "saved"
          ? "bg-[#dbe3bd] text-[#4e5a3c]"
          : status === "error" || status === "conflict" || status === "offline"
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
  autoOpen = false,
}: BookEditorProps) {
  const [book, setBook] = useState(() => prepareBookForImmersiveEditing(initialBook));
  const [isOpen, setIsOpen] = useState(autoOpen);
  const [spreadIndex, setSpreadIndex] = useState(0);
  const [activePageId, setActivePageId] = useState(initialBook.pages[0].id);
  const [editorTool, setEditorTool] = useState<EditorTool>("write");
  const [drawingColor, setDrawingColor] = useState("#805735");
  const [drawingWidth, setDrawingWidth] = useState(8);
  const [drawingPreview, setDrawingPreview] = useState<DrawingPoint[]>([]);
  const [selectedElement, setSelectedElement] = useState<{
    pageId: string;
    elementId: string;
  } | null>(null);
  const [mediaStatus, setMediaStatus] = useState<MediaStatus>("idle");
  const [mediaMessage, setMediaMessage] = useState<string | null>(null);
  const [mediaProgress, setMediaProgress] = useState(0);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [historyStatus, setHistoryStatus] = useState<"idle" | "loading" | "error" | "restoring">("idle");
  const [status, setStatus] = useState<SaveStatus>("saved");
  const [isOnline, setIsOnline] = useState(true);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [bookZoom, setBookZoom] = useState(1);
  const [turnDirection, setTurnDirection] = useState<"next" | "previous" | null>(null);
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
  const photoInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const recordingStreamRef = useRef<MediaStream | null>(null);
  const recordingChunksRef = useRef<Blob[]>([]);
  const saveFunctionRef = useRef<() => Promise<void>>(async () => undefined);
  const undoStackRef = useRef<JournalBook[]>([]);
  const redoStackRef = useRef<JournalBook[]>([]);
  const historyGroupRef = useRef<{ key: string; at: number } | null>(null);
  const retryTimerRef = useRef<number | null>(null);
  const retryDelayRef = useRef(2_000);
  const pageTurnTimerRef = useRef<number | null>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const changeBook = useCallback((
    transform: (draft: JournalBook) => void | boolean | PageElement | null,
    options: { recordHistory?: boolean; historyGroup?: string } = {},
  ) => {
    const current = bookRef.current;
    const next = structuredClone(current);
    const changed = transform(next);
    if (changed === false || changed === null) return;
    if (options.recordHistory !== false) {
      const now = Date.now();
      const grouped = options.historyGroup
        && historyGroupRef.current?.key === options.historyGroup
        && now - historyGroupRef.current.at < 900;
      if (!grouped) undoStackRef.current = pushBookSnapshot(undoStackRef.current, current);
      historyGroupRef.current = options.historyGroup ? { key: options.historyGroup, at: now } : null;
      redoStackRef.current = [];
      setCanUndo(true);
      setCanRedo(false);
    }
    bookRef.current = next;
    dirtyRef.current = true;
    setStatus("unsaved");
    setBook(next);
  }, []);

  const saveNow = useCallback(async () => {
    if (!dirtyRef.current || savingRef.current) return;
    if (!navigator.onLine) {
      setIsOnline(false);
      setStatus("offline");
      return;
    }

    savingRef.current = true;
    dirtyRef.current = false;
    if (retryTimerRef.current !== null) window.clearTimeout(retryTimerRef.current);
    setStatus("saving");

    try {
      const response = await fetch(`/api/journal/${entryDate}`, {
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
      retryDelayRef.current = 2_000;
      setStatus(dirtyRef.current ? "unsaved" : "saved");
    } catch {
      dirtyRef.current = true;
      const online = navigator.onLine;
      setIsOnline(online);
      setStatus(online ? "error" : "offline");
    } finally {
      savingRef.current = false;
      if (dirtyRef.current && navigator.onLine) {
        const delay = retryDelayRef.current;
        retryDelayRef.current = Math.min(delay * 2, 30_000);
        retryTimerRef.current = window.setTimeout(() => void saveFunctionRef.current(), delay);
      }
    }
  }, [entryDate]);

  useEffect(() => {
    saveFunctionRef.current = saveNow;
  }, [saveNow]);

  useEffect(() => {
    if (!dirtyRef.current) return;
    const timeout = window.setTimeout(() => void saveNow(), 1_100);
    return () => window.clearTimeout(timeout);
  }, [book, primaryMoodSlug, saveNow]);

  useEffect(() => {
    const updateConnection = () => {
      const online = navigator.onLine;
      setIsOnline(online);
      if (!online && dirtyRef.current) setStatus("offline");
      if (online && dirtyRef.current) void saveFunctionRef.current();
    };
    const initialCheck = window.setTimeout(updateConnection, 0);
    window.addEventListener("online", updateConnection);
    window.addEventListener("offline", updateConnection);
    return () => {
      window.clearTimeout(initialCheck);
      window.removeEventListener("online", updateConnection);
      window.removeEventListener("offline", updateConnection);
    };
  }, []);

  useEffect(() => {
    const warnBeforeLeaving = (event: BeforeUnloadEvent) => {
      if (!dirtyRef.current) return;
      event.preventDefault();
      event.returnValue = true;
    };
    window.addEventListener("beforeunload", warnBeforeLeaving);
    return () => window.removeEventListener("beforeunload", warnBeforeLeaving);
  }, []);

  useEffect(() => () => {
    recordingStreamRef.current?.getTracks().forEach((track) => track.stop());
    if (retryTimerRef.current !== null) window.clearTimeout(retryTimerRef.current);
    if (pageTurnTimerRef.current !== null) window.clearTimeout(pageTurnTimerRef.current);
  }, []);

  function selectMood(slug: MoodSlug) {
    const nextMood = primaryMoodRef.current === slug ? null : slug;
    primaryMoodRef.current = nextMood;
    setPrimaryMoodSlug(nextMood);
    dirtyRef.current = true;
    setStatus("unsaved");
  }

  function applyLocalBook(next: JournalBook) {
    const snapshot = structuredClone(next);
    bookRef.current = snapshot;
    setBook(snapshot);
    dirtyRef.current = true;
    historyGroupRef.current = null;
    setStatus("unsaved");
    setSelectedElement(null);
  }

  function undoBookChange() {
    const previous = undoStackRef.current.pop();
    if (!previous) return;
    redoStackRef.current = pushBookSnapshot(redoStackRef.current, bookRef.current);
    applyLocalBook(previous);
    setCanUndo(undoStackRef.current.length > 0);
    setCanRedo(true);
  }

  function redoBookChange() {
    const next = redoStackRef.current.pop();
    if (!next) return;
    undoStackRef.current = pushBookSnapshot(undoStackRef.current, bookRef.current);
    applyLocalBook(next);
    setCanUndo(true);
    setCanRedo(redoStackRef.current.length > 0);
  }

  function goToSpread(nextIndex: number) {
    const safeIndex = clamp(nextIndex, 0, spreadCount(bookRef.current) - 1);
    if (safeIndex === spreadIndex) return;
    const [firstPage] = pagesInSpread(bookRef.current, safeIndex);
    setTurnDirection(safeIndex > spreadIndex ? "next" : "previous");
    if (pageTurnTimerRef.current !== null) window.clearTimeout(pageTurnTimerRef.current);
    pageTurnTimerRef.current = window.setTimeout(() => setTurnDirection(null), 420);
    setSpreadIndex(safeIndex);
    if (firstPage) setActivePageId(firstPage.id);
    setSelectedElement(null);
    setDrawingPreview([]);
  }

  function beginPageSwipe(event: React.TouchEvent<HTMLElement>) {
    const target = event.target as HTMLElement;
    if (target.closest("button, textarea, input, select, audio, [data-editor-element]")) return;
    const touch = event.touches[0];
    if (touch) touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  }

  function finishPageSwipe(event: React.TouchEvent<HTMLElement>) {
    const start = touchStartRef.current;
    touchStartRef.current = null;
    const touch = event.changedTouches[0];
    if (!start || !touch || editorTool === "draw") return;
    const direction = directionForSwipe(touch.clientX - start.x, touch.clientY - start.y);
    if (direction === "next") goToSpread(spreadIndex + 1);
    if (direction === "previous") goToSpread(spreadIndex - 1);
  }

  function addSpread() {
    if (bookRef.current.pages.length >= MAX_JOURNAL_PAGES) return;
    const newPages = createBookSpread(bookRef.current);
    const nextSpreadIndex = spreadCount(bookRef.current);
    changeBook((draft) => { draft.pages.push(...newPages); });
    setSpreadIndex(nextSpreadIndex);
    setActivePageId(newPages[0].id);
    setSelectedElement(null);
  }

  function removeLastSpread() {
    if (bookRef.current.pages.length <= 2 || !window.confirm("¿Quitar el último pliego? También se borrará lo escrito y dibujado en esas dos páginas.")) return;
    changeBook((draft) => { removeLastBookSpread(draft); });
    const nextIndex = Math.max(0, spreadCount(bookRef.current) - 2);
    const [firstPage] = pagesInSpread(bookRef.current, nextIndex);
    setSpreadIndex(nextIndex);
    if (firstPage) setActivePageId(firstPage.id);
    setSelectedElement(null);
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
    setSelectedElement(null);
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

  async function uploadMedia(file: File) {
    try {
      const originalName = file.name;
      let uploadFile = file;
      let dimensions: { width: number; height: number } | null = null;
      setMediaProgress(4);
      if (file.type.startsWith("image/")) {
        setMediaStatus("preparing");
        const prepared = await preparePhotoForUpload(file, (progress, message) => {
          setMediaProgress(progress);
          setMediaMessage(message);
        });
        uploadFile = prepared.file;
        dimensions = { width: prepared.width, height: prepared.height };
      }
      setMediaStatus("uploading");
      setMediaProgress(45);
      setMediaMessage("Guardando el archivo privado…");
      const formData = new FormData();
      formData.set("file", uploadFile);
      if (dimensions) {
        formData.set("width", String(dimensions.width));
        formData.set("height", String(dimensions.height));
      }
      const response = await fetch(`/api/journal/${entryDate}/media`, { method: "POST", body: formData });
      setMediaProgress(88);
      const result = (await response.json()) as { id?: string; kind?: "photo" | "audio"; error?: string };
      if (!response.ok || !result.id || !result.kind) throw new Error(result.error ?? "No se pudo subir.");
      const elementId = crypto.randomUUID();
      changeBook((draft) => {
        const page = draft.pages.find((candidate) => candidate.id === activePageId);
        if (!page) return;
        const zIndex = Math.max(20, ...page.elements.map((element) => element.frame.zIndex + 1));
        if (result.kind === "photo") {
          page.elements.push({
            id: elementId, type: "photo",
            frame: { x: 180, y: 260, width: 640, height: 560, rotation: -2, zIndex, locked: false },
            content: { mediaId: result.id!, fit: "cover", cropX: 0.5, cropY: 0.5, filter: "none", caption: originalName.slice(0, 120) },
          });
        } else {
          page.elements.push({
            id: elementId, type: "audio",
            frame: { x: 130, y: 520, width: 740, height: 190, rotation: 0, zIndex, locked: false },
            content: { mediaId: result.id!, label: originalName.replace(/\.[^.]+$/, "").slice(0, 120) || "Recuerdo de audio", waveformColor: "#b8781d" },
          });
        }
      });
      setSelectedElement({ pageId: activePageId, elementId });
      setEditorTool("write");
      setMediaStatus("idle");
      setMediaProgress(100);
      setMediaMessage(result.kind === "photo" ? "Fotografía añadida." : "Audio añadido.");
    } catch (error) {
      setMediaStatus("error");
      setMediaProgress(0);
      setMediaMessage(error instanceof Error ? error.message : "No pudimos subir el archivo.");
    }
  }

  async function startRecording() {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setMediaStatus("error");
      setMediaMessage("Este navegador no permite grabar audio.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = ["audio/webm", "audio/ogg", "audio/mp4"]
        .find((candidate) => MediaRecorder.isTypeSupported(candidate));
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      recordingStreamRef.current = stream;
      recordingChunksRef.current = [];
      recorderRef.current = recorder;
      recorder.ondataavailable = (event) => { if (event.data.size) recordingChunksRef.current.push(event.data); };
      recorder.onstop = () => {
        const recordedType = recorder.mimeType.split(";")[0] || mimeType || "audio/webm";
        const extension = recordedType === "audio/ogg" ? "ogg" : recordedType === "audio/mp4" ? "m4a" : "webm";
        const blob = new Blob(recordingChunksRef.current, { type: recordedType });
        recordingStreamRef.current?.getTracks().forEach((track) => track.stop());
        recordingStreamRef.current = null;
        recorderRef.current = null;
        void uploadMedia(new File([blob], `audio-${new Date().toISOString().replace(/[:.]/g, "-")}.${extension}`, { type: recordedType }));
      };
      recorder.start();
      setMediaStatus("recording");
      setMediaMessage("Grabando… habla con calma.");
    } catch {
      setMediaStatus("error");
      setMediaMessage("No obtuvimos permiso para usar el micrófono.");
    }
  }

  function stopRecording() {
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
  }

  async function toggleHistory() {
    if (historyOpen) { setHistoryOpen(false); return; }
    setHistoryOpen(true);
    setHistoryStatus("loading");
    try {
      const response = await fetch(`/api/journal/${entryDate}/history`, { cache: "no-store" });
      const result = (await response.json()) as { versions?: HistoryItem[]; error?: string };
      if (!response.ok) throw new Error(result.error);
      setHistoryItems(result.versions ?? []);
      setHistoryStatus("idle");
    } catch {
      setHistoryStatus("error");
    }
  }

  async function restoreRevision(targetRevision: number) {
    if (!window.confirm(`¿Restaurar la revisión ${targetRevision}? La versión actual se conservará en el historial.`)) return;
    setHistoryStatus("restoring");
    if (dirtyRef.current) {
      await saveNow();
      if (dirtyRef.current) { setHistoryStatus("error"); return; }
    }
    const response = await fetch(`/api/journal/${entryDate}/history`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ revision: targetRevision }),
    });
    if (response.ok) window.location.reload();
    else setHistoryStatus("error");
  }

  function updateText(pageId: string, elementId: string, text: string) {
    changeBook((draft) => {
      const page = draft.pages.find((candidate) => candidate.id === pageId);
      const element = page?.elements.find((candidate) => candidate.id === elementId);
      if (element?.type === "text") element.content.text = text;
    }, { historyGroup: `text:${pageId}:${elementId}` });
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
    setSelectedElement({ pageId, elementId });
  }

  function updateElement(pageId: string, elementId: string, transform: (element: PageElement) => void) {
    changeBook((draft) => {
      const element = draft.pages
        .find((page) => page.id === pageId)
        ?.elements.find((candidate) => candidate.id === elementId);
      if (element) transform(element);
    });
  }

  function moveSelectedElementToPage(targetPageId: string) {
    if (!selectedElement || selectedElement.pageId === targetPageId) return;
    const sourcePageId = selectedElement.pageId;
    changeBook((draft) => moveBookElementToPage(
      draft,
      sourcePageId,
      targetPageId,
      selectedElement.elementId,
      { x: 100, y: selectedElementData?.frame.y ?? 180 },
    ));
    setActivePageId(targetPageId);
    setSelectedElement({ pageId: targetPageId, elementId: selectedElement.elementId });
  }

  function duplicateSelectedElement() {
    if (!selectedElement) return;
    const nextId = crypto.randomUUID();
    changeBook((draft) => {
      duplicateBookElement(draft, selectedElement.pageId, selectedElement.elementId, nextId);
    });
    setSelectedElement({ pageId: selectedElement.pageId, elementId: nextId });
  }

  function nudgeSelectedElement(deltaX: number, deltaY: number) {
    if (!selectedElement) return;
    changeBook((draft) => {
      nudgeBookElement(draft, selectedElement.pageId, selectedElement.elementId, deltaX, deltaY);
    }, { historyGroup: `nudge:${selectedElement.pageId}:${selectedElement.elementId}` });
  }

  function deleteSelectedElement() {
    if (!selectedElement) return;
    changeBook((draft) => {
      const page = draft.pages.find((candidate) => candidate.id === selectedElement.pageId);
      if (page) {
        page.elements = page.elements.filter(
          (element) => element.id !== selectedElement.elementId,
        );
      }
    });
    setSelectedElement(null);
  }

  function handleResizePointerDown(
    event: React.PointerEvent<HTMLButtonElement>,
    pageId: string,
    element: PageElement,
  ) {
    event.preventDefault();
    event.stopPropagation();
    if (element.frame.locked || element.type === "drawing") return;
    event.currentTarget.setPointerCapture(event.pointerId);
    const pageElement = event.currentTarget.closest<HTMLElement>("[data-book-page]");
    if (!pageElement) return;
    const pageRect = pageElement.getBoundingClientRect();
    const startX = event.clientX;
    const initialWidth = element.frame.width;
    let recorded = false;

    function move(pointerEvent: PointerEvent) {
      if (!recorded) {
        undoStackRef.current = pushBookSnapshot(undoStackRef.current, bookRef.current);
        redoStackRef.current = [];
        setCanUndo(true);
        setCanRedo(false);
        recorded = true;
      }
      const deltaWidth = ((pointerEvent.clientX - startX) / pageRect.width) * 1000;
      changeBook((draft) => {
        resizeBookElement(draft, pageId, element.id, initialWidth + deltaWidth);
      }, { recordHistory: false });
    }

    function finish() {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", finish);
      window.removeEventListener("pointercancel", finish);
    }

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", finish, { once: true });
    window.addEventListener("pointercancel", finish, { once: true });
  }

  function handleElementPointerDown(
    event: React.PointerEvent<HTMLElement>,
    pageId: string,
    element: PageElement,
  ) {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    setActivePageId(pageId);
    setSelectedElement({ pageId, elementId: element.id });
    if (element.frame.locked) return;

    const pageElement = event.currentTarget.closest<HTMLElement>("[data-book-page]");
    if (!pageElement) return;
    const pageRect = pageElement.getBoundingClientRect();
    let currentPageId = pageId;
    let currentPageRect = pageRect;
    const grabOffsetX = ((event.clientX - pageRect.left) / pageRect.width) * 1000 - element.frame.x;
    const grabOffsetY = ((event.clientY - pageRect.top) / pageRect.height) * 1400 - element.frame.y;
    let recorded = false;

    function move(pointerEvent: PointerEvent) {
      if (!recorded) {
        undoStackRef.current = pushBookSnapshot(undoStackRef.current, bookRef.current);
        redoStackRef.current = [];
        setCanUndo(true);
        setCanRedo(false);
        recorded = true;
      }
      const hoveredPage = document.elementFromPoint(pointerEvent.clientX, pointerEvent.clientY)
        ?.closest<HTMLElement>("[data-book-page]");
      const hoveredPageId = hoveredPage?.dataset.bookPageId;
      if (hoveredPage && hoveredPageId && hoveredPageId !== currentPageId) {
        const nextRect = hoveredPage.getBoundingClientRect();
        const nextX = ((pointerEvent.clientX - nextRect.left) / nextRect.width) * 1000 - grabOffsetX;
        const nextY = ((pointerEvent.clientY - nextRect.top) / nextRect.height) * 1400 - grabOffsetY;
        changeBook((draft) => moveBookElementToPage(draft, currentPageId, hoveredPageId, element.id, { x: nextX, y: nextY }), { recordHistory: false });
        currentPageId = hoveredPageId;
        currentPageRect = nextRect;
        setActivePageId(hoveredPageId);
        setSelectedElement({ pageId: hoveredPageId, elementId: element.id });
        return;
      }
      const nextX = ((pointerEvent.clientX - currentPageRect.left) / currentPageRect.width) * 1000 - grabOffsetX;
      const nextY = ((pointerEvent.clientY - currentPageRect.top) / currentPageRect.height) * 1400 - grabOffsetY;
      changeBook((draft) => {
        const draftElement = draft.pages.find((page) => page.id === currentPageId)?.elements.find((candidate) => candidate.id === element.id);
        if (!draftElement) return;
        draftElement.frame.x = clamp(nextX, 0, 1000 - draftElement.frame.width);
        draftElement.frame.y = clamp(nextY, 0, 1400 - draftElement.frame.height);
      }, { recordHistory: false });
    }

    function finish() {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", finish);
      window.removeEventListener("pointercancel", finish);
    }

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", finish, { once: true });
    window.addEventListener("pointercancel", finish, { once: true });
  }

  const visiblePages = pagesInSpread(book, spreadIndex);
  const selectedElementData = selectedElement
    ? book.pages
        .find((page) => page.id === selectedElement.pageId)
        ?.elements.find((element) => element.id === selectedElement.elementId)
    : null;
  const otherVisiblePage = selectedElement
    ? visiblePages.find((page) => page.id !== selectedElement.pageId)
    : undefined;
  const totalSpreads = spreadCount(book);

  const handleKeyboardShortcut = useEffectEvent((event: KeyboardEvent) => {
    const target = event.target as HTMLElement | null;
    if (target?.matches("input, textarea, select, [contenteditable='true']")) return;
    const modifier = event.ctrlKey || event.metaKey;
    if (modifier && event.key.toLowerCase() === "z") {
      event.preventDefault();
      if (event.shiftKey) redoBookChange();
      else undoBookChange();
      return;
    }
    if (modifier && event.key.toLowerCase() === "y") {
      event.preventDefault();
      redoBookChange();
      return;
    }
    if (event.key === "Escape") {
      setSelectedElement(null);
      return;
    }
    if ((event.key === "Delete" || event.key === "Backspace") && selectedElement) {
      event.preventDefault();
      deleteSelectedElement();
      return;
    }
    const distance = event.shiftKey ? 25 : 5;
    const directions: Record<string, [number, number]> = {
      ArrowLeft: [-distance, 0], ArrowRight: [distance, 0],
      ArrowUp: [0, -distance], ArrowDown: [0, distance],
    };
    const direction = directions[event.key];
    if (direction && selectedElement) {
      event.preventDefault();
      nudgeSelectedElement(...direction);
    }
  });

  useEffect(() => {
    window.addEventListener("keydown", handleKeyboardShortcut);
    return () => window.removeEventListener("keydown", handleKeyboardShortcut);
  }, []);

  return (
    <div className="book-editor" data-entry-id={entryId}>
      <div className="book-status-strip mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
          <button type="button" onClick={undoBookChange} disabled={!canUndo} className="tool-pill disabled:cursor-not-allowed disabled:opacity-40" title="Deshacer (Ctrl+Z)" aria-label="Deshacer último cambio" aria-keyshortcuts="Control+Z Meta+Z">↶ Deshacer</button>
          <button type="button" onClick={redoBookChange} disabled={!canRedo} className="tool-pill disabled:cursor-not-allowed disabled:opacity-40" title="Rehacer (Ctrl+Mayús+Z)" aria-label="Rehacer último cambio" aria-keyshortcuts="Control+Shift+Z Meta+Shift+Z Control+Y">↷ Rehacer</button>
          <button type="button" onClick={() => void toggleHistory()} className="rounded-full border border-[var(--brown-light)] bg-[#fff3d4] px-4 py-2 text-xs font-bold text-[var(--brown)]">{historyOpen ? "Cerrar historial" : "Historial"}</button>
          {(status === "error" || status === "unsaved" || status === "offline") && (
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

      {!isOnline && (
        <div role="status" className="mb-5 rounded-2xl border border-[#bd7964] bg-[#f7ddce] px-5 py-3 text-sm font-semibold text-[#713426]">
          Estás sin conexión. Puedes seguir editando esta página; Green Days intentará guardarla cuando vuelva internet. No cierres la pestaña mientras haya cambios pendientes.
        </div>
      )}

      {historyOpen && (
        <section className="mb-5 rounded-[1.5rem] border border-[var(--line)] bg-[var(--paper)] p-5" aria-labelledby="history-title">
          <div className="flex items-center justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--ochre)]">Red de seguridad</p><h2 id="history-title" className="font-display text-2xl font-semibold">Versiones anteriores</h2></div><span className="text-xs text-[var(--muted)]">Actual: revisión {revision}</span></div>
          {historyStatus === "loading" && <p className="mt-4 text-sm text-[var(--muted)]">Buscando versiones…</p>}
          {historyStatus === "error" && <p className="mt-4 text-sm font-semibold text-[#843a28]">No pudimos completar esta operación.</p>}
          {historyStatus !== "loading" && historyItems.length === 0 && <p className="mt-4 text-sm text-[var(--muted)]">El historial aparecerá después del primer cambio guardado.</p>}
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {historyItems.map((item) => <article key={`${item.revision}-${item.savedAt}`} className="rounded-2xl border border-[var(--line)] bg-[#fff8e8] p-4"><p className="text-xs font-bold text-[var(--ochre)]">Revisión {item.revision} · {item.pageCount} páginas</p><p className="mt-2 line-clamp-3 min-h-12 text-sm leading-6 text-[var(--muted)]">{item.excerpt || "Una versión principalmente visual."}</p><div className="mt-3 flex items-center justify-between gap-3"><time className="text-[0.65rem] text-[var(--muted)]">{historyDateFormatter.format(new Date(item.savedAt))}</time><button type="button" disabled={historyStatus === "restoring"} onClick={() => void restoreRevision(item.revision)} className="text-xs font-bold text-[var(--brown)] underline underline-offset-4">Restaurar</button></div></article>)}
          </div>
        </section>
      )}

      <details className="book-toolbox mb-5">
        <summary><span aria-hidden="true">✒</span><strong>Abrir el estuche de escritura</strong><span className="ml-auto text-[0.68rem] font-semibold text-[var(--muted)]">emoción · dibujo · fotos · stickers</span></summary>
      <section className="mt-3 rounded-[1.5rem] border border-[var(--line)] bg-[var(--paper)] p-4 sm:p-5" aria-label="Herramientas del libro">
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
              <button type="button" disabled={!isOpen} onClick={() => { setEditorTool("draw"); setSelectedElement(null); }} aria-pressed={editorTool === "draw"} className={`tool-pill ${editorTool === "draw" ? "bg-[var(--yellow-soft)]" : ""}`}>🖍️ Dibujar</button>
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
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-[var(--muted)]">Fotos y audio</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <input ref={photoInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="sr-only" onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadMedia(file); event.currentTarget.value = ""; }} />
              <input ref={audioInputRef} type="file" accept="audio/mpeg,audio/mp4,audio/webm,audio/ogg,audio/wav" className="sr-only" onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadMedia(file); event.currentTarget.value = ""; }} />
              <button type="button" disabled={!isOpen || mediaStatus === "preparing" || mediaStatus === "uploading" || mediaStatus === "recording"} onClick={() => photoInputRef.current?.click()} className="tool-pill disabled:opacity-40">📷 Fotografía</button>
              <button type="button" disabled={!isOpen || mediaStatus === "preparing" || mediaStatus === "uploading" || mediaStatus === "recording"} onClick={() => audioInputRef.current?.click()} className="tool-pill disabled:opacity-40">🎵 Adjuntar audio</button>
              {mediaStatus === "recording" ? <button type="button" onClick={stopRecording} className="rounded-full bg-[#d96b55] px-4 py-2 text-xs font-bold text-white">■ Detener</button> : <button type="button" disabled={!isOpen || mediaStatus === "preparing" || mediaStatus === "uploading"} onClick={() => void startRecording()} className="tool-pill disabled:opacity-40">🎙️ Grabar</button>}
            </div>
            {mediaMessage && <div className="mt-2 max-w-xs" role="status"><p className={`text-xs ${mediaStatus === "error" ? "text-[#843a28]" : "text-[var(--muted)]"}`}>{mediaMessage}</p>{(mediaStatus === "preparing" || mediaStatus === "uploading") && <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#ead8b0]" aria-label={`Progreso ${mediaProgress}%`}><span className="block h-full rounded-full bg-[var(--ochre)] transition-[width]" style={{ width: `${mediaProgress}%` }} /></div>}</div>}
          </div>
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
            <span className="mr-1 text-xs font-bold uppercase tracking-[0.14em] text-[var(--muted)]">Zoom</span>
            <button type="button" onClick={() => setBookZoom((value) => clampBookZoom(value - 0.25))} disabled={bookZoom <= 0.75} className="tool-pill disabled:opacity-40" aria-label="Alejar el libro">−</button>
            <button type="button" onClick={() => setBookZoom(1)} className="tool-pill min-w-16" aria-label="Restablecer zoom al cien por ciento">{Math.round(bookZoom * 100)}%</button>
            <button type="button" onClick={() => setBookZoom((value) => clampBookZoom(value + 0.25))} disabled={bookZoom >= 1.5} className="tool-pill disabled:opacity-40" aria-label="Acercar el libro">+</button>
            <span className="mx-1 h-7 w-px bg-[var(--line)]" />
            <span className="rounded-full bg-[#ead8b0] px-3 py-2 text-xs font-bold text-[var(--brown)]">Páginas {spreadIndex * 2 + 1}–{Math.min(spreadIndex * 2 + 2, book.pages.length)}</span>
            <button type="button" onClick={addSpread} disabled={!isOpen || book.pages.length >= MAX_JOURNAL_PAGES} className="tool-pill disabled:opacity-40">+ Dos páginas</button>
            {book.pages.length > 2 && <button type="button" onClick={removeLastSpread} className="rounded-full bg-[#f1c8b4] px-4 py-2 text-xs font-bold text-[#843a28]">Quitar últimas</button>}

            {selectedElementData && selectedElement && selectedElementData.type !== "drawing" && (
              <>
                <span className="mx-1 h-7 w-px bg-[var(--line)]" />
                <button
                  type="button"
                  onClick={() =>
                    updateElement(selectedElement.pageId, selectedElement.elementId, (element) => {
                      element.frame.rotation = (element.frame.rotation + 15) % 360;
                    })
                  }
                  className="tool-pill"
                >
                  Girar
                </button>
                <button
                  type="button"
                  onClick={() =>
                    changeBook((draft) => resizeBookElement(draft, selectedElement.pageId, selectedElement.elementId, selectedElementData.frame.width + 40))
                  }
                  className="tool-pill"
                  aria-label="Aumentar elemento"
                >
                  +
                </button>
                <button
                  type="button"
                  onClick={() =>
                    changeBook((draft) => resizeBookElement(draft, selectedElement.pageId, selectedElement.elementId, selectedElementData.frame.width - 40))
                  }
                  className="tool-pill"
                  aria-label="Reducir elemento"
                >
                  −
                </button>
                {selectedElementData.type === "text" && <><button type="button" onClick={() => changeBook((draft) => changeTextFontSize(draft, selectedElement.pageId, selectedElement.elementId, -6))} className="tool-pill" aria-label="Reducir tamaño de letra">A−</button><button type="button" onClick={() => changeBook((draft) => changeTextFontSize(draft, selectedElement.pageId, selectedElement.elementId, 6))} className="tool-pill" aria-label="Aumentar tamaño de letra">A+</button></>}
                {otherVisiblePage && <button type="button" onClick={() => moveSelectedElementToPage(otherVisiblePage.id)} className="tool-pill">Mover a página {otherVisiblePage.pageNumber}</button>}
                <button type="button" onClick={() => updateElement(selectedElement.pageId, selectedElement.elementId, (element) => {
                  const page = bookRef.current.pages.find((candidate) => candidate.id === selectedElement.pageId);
                  element.frame.zIndex = Math.max(0, ...(page?.elements.map((candidate) => candidate.frame.zIndex) ?? [0])) + 1;
                })} className="tool-pill">Al frente</button>
                <button type="button" onClick={() => updateElement(selectedElement.pageId, selectedElement.elementId, (element) => { element.frame.zIndex = 0; })} className="tool-pill">Al fondo</button>
                <button type="button" onClick={() => updateElement(selectedElement.pageId, selectedElement.elementId, (element) => { element.frame.locked = !element.frame.locked; })} className="tool-pill">{selectedElementData.frame.locked ? "Desbloquear" : "Bloquear"}</button>
                <button type="button" onClick={duplicateSelectedElement} className="tool-pill">Duplicar</button>
                {selectedElementData.type === "photo" && <select value={selectedElementData.content.filter} onChange={(event) => updateElement(selectedElement.pageId, selectedElement.elementId, (element) => { if (element.type === "photo") element.content.filter = event.target.value as "none" | "warm" | "vintage" | "mono"; })} className="tool-pill"><option value="none">Sin filtro</option><option value="warm">Cálido</option><option value="vintage">Vintage</option><option value="mono">Blanco y negro</option></select>}
                {selectedElementData.type === "photo" && <div className="flex items-center gap-1" role="group" aria-label="Ajustar encuadre de la fotografía"><button type="button" onClick={() => changeBook((draft) => cropPhoto(draft, selectedElement.pageId, selectedElement.elementId, -0.08, 0))} className="tool-pill" aria-label="Mover encuadre a la izquierda">Foto ←</button><button type="button" onClick={() => changeBook((draft) => cropPhoto(draft, selectedElement.pageId, selectedElement.elementId, 0.08, 0))} className="tool-pill" aria-label="Mover encuadre a la derecha">Foto →</button><button type="button" onClick={() => changeBook((draft) => cropPhoto(draft, selectedElement.pageId, selectedElement.elementId, 0, -0.08))} className="tool-pill" aria-label="Mover encuadre hacia arriba">Foto ↑</button><button type="button" onClick={() => changeBook((draft) => cropPhoto(draft, selectedElement.pageId, selectedElement.elementId, 0, 0.08))} className="tool-pill" aria-label="Mover encuadre hacia abajo">Foto ↓</button></div>}
                <button
                  type="button"
                  onClick={deleteSelectedElement}
                  className="rounded-full bg-[#f1c8b4] px-4 py-2 text-xs font-bold text-[#843a28]"
                >
                  Quitar del libro
                </button>
              </>
            )}
          </div>
        </div>
      </section>
      </details>

      <div className="book-stage" onTouchStart={beginPageSwipe} onTouchEnd={finishPageSwipe}>
        <div
          className={`book-object ${isOpen ? "is-open" : ""}`}
          style={{ width: `min(${bookZoom * 100}%, ${74 * bookZoom}rem)` }}
        >
          <span className="day-bookmark" aria-label={`Separador del ${formatEntryDate(entryDate)}`}>{formatEntryDate(entryDate)}</span>
          <div className={`book-pages ${turnDirection ? `is-turning-${turnDirection}` : ""}`} aria-hidden={!isOpen} aria-live="polite">
            {turnDirection && <span className={`page-turn-leaf page-turn-leaf-${turnDirection}`} aria-hidden="true" />}
            {visiblePages.map((page) => (
              <section
                key={page.id}
                data-book-page
                data-book-page-id={page.id}
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
                    const isSelected = selectedElement?.elementId === element.id;
                    const pencilFont = /Segoe Print|Bradley Hand|Comic Sans|Caveat|font-pencil/i.test(element.content.fontFamily)
                      ? 'var(--font-pencil), "Segoe Print", cursive'
                      : element.content.fontFamily;
                    return (
                      <div key={element.id} data-editor-element className={`page-writing-frame ${isSelected ? "is-selected" : ""}`} style={frameStyle}>
                        <textarea
                          value={element.content.text}
                          onChange={(event) => updateText(page.id, element.id, event.target.value)}
                          onFocus={() => { setActivePageId(page.id); setSelectedElement({ pageId: page.id, elementId: element.id }); }}
                          disabled={!isOpen}
                          placeholder={page.side === "left" ? "Hoy quiero recordar…" : "Y también…"}
                          className="page-writing"
                          style={{
                            color: element.content.color,
                            fontFamily: pencilFont,
                            fontSize: `${element.content.fontSize / 10}cqw`,
                            textAlign: element.content.alignment,
                            lineHeight: element.content.lineHeight,
                            fontWeight: element.content.weight === "normal" ? 400 : element.content.weight === "semibold" ? 600 : 700,
                          }}
                          aria-label={`Texto de la página ${page.pageNumber}`}
                        />
                        {isSelected && <button type="button" onPointerDown={(event) => handleElementPointerDown(event, page.id, element)} className="page-writing-handle" aria-label={`Mover texto de la página ${page.pageNumber}`} title="Arrastra para mover el texto">✥</button>}
                      </div>
                    );
                  }

                  if (element.type === "photo") {
                    const filters = { none: "none", warm: "sepia(.18) saturate(1.12)", vintage: "sepia(.42) contrast(.92)", mono: "grayscale(1)" };
                    const isSelected = selectedElement?.elementId === element.id;
                    return (
                      <button
                        key={element.id}
                        type="button"
                        data-editor-element
                        onPointerDown={(event) => handleElementPointerDown(event, page.id, element)}
                        onFocus={() => { setActivePageId(page.id); setSelectedElement({ pageId: page.id, elementId: element.id }); }}
                        className={`absolute overflow-hidden rounded-[4%] border-4 bg-[#fff8e8] shadow-lg ${isSelected ? "border-[var(--ochre)]" : "border-white"}`}
                        style={frameStyle}
                        aria-label={`Fotografía${element.content.caption ? `: ${element.content.caption}` : ""}. Arrástrala para moverla.`}
                      >
                        <Image src={`/api/media/${element.content.mediaId}`} alt={element.content.caption ?? "Fotografía del diario"} fill unoptimized sizes="40vw" className={element.content.fit === "cover" ? "object-cover" : "object-contain"} style={{ filter: filters[element.content.filter], objectPosition: `${element.content.cropX * 100}% ${element.content.cropY * 100}%` }} />
                        {element.frame.locked && <span className="absolute right-2 top-2 rounded-full bg-black/60 px-2 py-1 text-[0.55rem] text-white">🔒</span>}
                      </button>
                    );
                  }

                  if (element.type === "audio") {
                    const isSelected = selectedElement?.elementId === element.id;
                    return (
                      <div key={element.id} data-editor-element className={`absolute overflow-hidden rounded-2xl border bg-[#fff7e2] p-3 shadow-lg ${isSelected ? "border-[var(--ochre)]" : "border-[var(--line)]"}`} style={frameStyle}>
                        <button type="button" onPointerDown={(event) => handleElementPointerDown(event, page.id, element)} onFocus={() => { setActivePageId(page.id); setSelectedElement({ pageId: page.id, elementId: element.id }); }} className="mb-2 flex w-full cursor-grab items-center justify-between gap-2 text-left text-[0.65rem] font-bold text-[var(--brown)]" aria-label={`Mover audio ${element.content.label}`}><span className="truncate">🎵 {element.content.label}</span><span aria-hidden="true">{element.frame.locked ? "🔒" : "⠿"}</span></button>
                        <audio controls preload="metadata" src={`/api/media/${element.content.mediaId}`} className="h-9 w-full" aria-label={element.content.label} />
                      </div>
                    );
                  }

                  if (element.type === "sticker") {
                    const isSelected = selectedElement?.elementId === element.id;
                    return (
                      <button
                        key={element.id}
                        type="button"
                        data-editor-element
                        onPointerDown={(event) => handleElementPointerDown(event, page.id, element)}
                        onFocus={() => { setActivePageId(page.id); setSelectedElement({ pageId: page.id, elementId: element.id }); }}
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
                {selectedElement && selectedElement.pageId === page.id && selectedElementData
                  && selectedElementData.type !== "drawing"
                  && !selectedElementData.frame.locked && editorTool === "write" && (
                    <button
                      type="button"
                      onPointerDown={(event) => handleResizePointerDown(event, page.id, selectedElementData)}
                      className="absolute z-40 grid size-7 -translate-x-1/2 -translate-y-1/2 touch-none place-items-center rounded-full border-2 border-white bg-[var(--ochre)] text-xs font-black text-white shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brown-dark)]"
                      style={{
                        left: `${(selectedElementData.frame.x + selectedElementData.frame.width) / 10}%`,
                        top: `${(selectedElementData.frame.y + selectedElementData.frame.height) / 14}%`,
                      }}
                      aria-label="Arrastrar para cambiar el tamaño del elemento seleccionado"
                      title="Arrastra para cambiar tamaño"
                    >↘</button>
                  )}
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

          {isOpen && <>
            <button type="button" onClick={() => goToSpread(spreadIndex - 1)} disabled={spreadIndex === 0} className="book-page-turn book-page-turn-previous" aria-label="Hojear hacia las páginas anteriores"><span aria-hidden="true">‹</span><small>Páginas anteriores</small></button>
            <button type="button" onClick={() => goToSpread(spreadIndex + 1)} disabled={spreadIndex >= totalSpreads - 1} className="book-page-turn book-page-turn-next" aria-label="Hojear hacia las páginas siguientes"><span aria-hidden="true">›</span><small>Páginas siguientes</small></button>
          </>}

          <button
            type="button"
            className="book-cover"
            style={{ backgroundColor: book.cover.color, color: book.cover.titleColor }}
            onClick={() => setIsOpen(true)}
            aria-label="Abrir el libro de hoy"
            aria-hidden={isOpen}
            tabIndex={isOpen ? -1 : 0}
          >
            <span className="book-cover-spine" style={{ backgroundColor: book.spine.color }} />
            <span className="book-cover-border">
              <span className="book-cover-kicker">Green Days</span>
              <strong>Mi día</strong>
              <span className="book-cover-date">{formatEntryDate(entryDate)}</span>
              <span className="book-cover-flower" aria-hidden="true">✦</span>
              <span className="book-cover-hint">Toca para abrir</span>
            </span>
          </button>
        </div>
        {isOpen && <div className="mobile-book-turns" aria-label="Controles para hojear en móvil"><button type="button" onClick={() => goToSpread(spreadIndex - 1)} disabled={spreadIndex === 0} aria-label="Páginas anteriores">‹</button><span>Páginas {spreadIndex * 2 + 1}–{Math.min(spreadIndex * 2 + 2, book.pages.length)}</span><button type="button" onClick={() => goToSpread(spreadIndex + 1)} disabled={spreadIndex >= totalSpreads - 1} aria-label="Páginas siguientes">›</button></div>}
      </div>

      {isOpen && (
        <p className="mt-5 text-center text-sm leading-6 text-[var(--muted)]">
          Escribe, dibuja o coloca stickers. Con una capa seleccionada puedes usar las flechas para moverla, Mayús para avanzar más y Suprimir para quitarla.
        </p>
      )}
    </div>
  );
}
