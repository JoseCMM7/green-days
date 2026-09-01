export const MAX_PHOTO_EDGE = 2400;
export const PHOTO_COMPRESSION_THRESHOLD = 2 * 1024 * 1024;

export function targetPhotoDimensions(width: number, height: number, maxEdge = MAX_PHOTO_EDGE) {
  if (width <= 0 || height <= 0) throw new Error("La fotografía no tiene dimensiones válidas.");
  const scale = Math.min(1, maxEdge / Math.max(width, height));
  return { width: Math.round(width * scale), height: Math.round(height * scale) };
}

export function optimizedPhotoName(name: string) {
  const base = name.replace(/\.[^.]+$/, "").trim() || "fotografia";
  return `${base}.webp`;
}

export async function preparePhotoForUpload(
  file: File,
  reportProgress: (progress: number, message: string) => void = () => undefined,
) {
  reportProgress(8, "Preparando fotografía…");
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  const sourceWidth = bitmap.width;
  const sourceHeight = bitmap.height;
  const target = targetPhotoDimensions(sourceWidth, sourceHeight);
  const needsResize = target.width !== sourceWidth || target.height !== sourceHeight;
  const shouldCompress = needsResize || file.size > PHOTO_COMPRESSION_THRESHOLD;

  if (!shouldCompress || file.type === "image/gif") {
    bitmap.close();
    reportProgress(28, file.type === "image/gif" ? "Conservando la animación…" : "Fotografía lista…");
    return { file, width: sourceWidth, height: sourceHeight, optimized: false };
  }

  reportProgress(18, "Ajustando tamaño y orientación…");
  const canvas = document.createElement("canvas");
  canvas.width = target.width;
  canvas.height = target.height;
  const context = canvas.getContext("2d", { alpha: true });
  if (!context) {
    bitmap.close();
    throw new Error("Este navegador no pudo preparar la fotografía.");
  }
  context.drawImage(bitmap, 0, 0, target.width, target.height);
  bitmap.close();

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((result) => result ? resolve(result) : reject(new Error("No pudimos comprimir la fotografía.")), "image/webp", 0.86);
  });
  const optimized = new File([blob], optimizedPhotoName(file.name), {
    type: "image/webp",
    lastModified: file.lastModified,
  });
  reportProgress(32, `Fotografía optimizada · ${Math.max(0, Math.round((1 - optimized.size / file.size) * 100))}% menos`);
  return { file: optimized, width: target.width, height: target.height, optimized: true };
}
