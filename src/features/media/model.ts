export const PHOTO_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
export const AUDIO_TYPES = new Set(["audio/mpeg", "audio/mp4", "audio/webm", "audio/ogg", "audio/wav"]);
export const MAX_PHOTO_BYTES = 10 * 1024 * 1024;
export const MAX_AUDIO_BYTES = 25 * 1024 * 1024;
export const MAX_USER_STORAGE_BYTES = 500 * 1024 * 1024;
export const UNUSED_MEDIA_GRACE_MS = 24 * 60 * 60 * 1000;

export function mediaKindForType(mimeType: string) {
  if (PHOTO_TYPES.has(mimeType)) return "photo" as const;
  if (AUDIO_TYPES.has(mimeType)) return "audio" as const;
  return null;
}

export function validateMediaFile(input: { type: string; size: number }) {
  const kind = mediaKindForType(input.type);
  if (!kind) return { ok: false as const, error: "El formato del archivo no es compatible." };
  const limit = kind === "photo" ? MAX_PHOTO_BYTES : MAX_AUDIO_BYTES;
  if (input.size <= 0 || input.size > limit) {
    return { ok: false as const, error: kind === "photo" ? "La fotografía debe pesar menos de 10 MB." : "El audio debe pesar menos de 25 MB." };
  }
  return { ok: true as const, kind };
}

export function extensionForMedia(mimeType: string) {
  const extensions: Record<string, string> = {
    "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif",
    "audio/mpeg": "mp3", "audio/mp4": "m4a", "audio/webm": "webm", "audio/ogg": "ogg", "audio/wav": "wav",
  };
  return extensions[mimeType] ?? "bin";
}

export function formatStorageBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(0, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(bytes < 10 * 1024 * 1024 ? 1 : 0)} MB`;
}

export function selectUnusedMediaAssets<T extends { id: string; createdAt: Date }>(
  assets: T[],
  referencedIds: ReadonlySet<string>,
  now = new Date(),
) {
  const cutoff = now.getTime() - UNUSED_MEDIA_GRACE_MS;
  return assets.filter((asset) => asset.createdAt.getTime() < cutoff && !referencedIds.has(asset.id));
}
