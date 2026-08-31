export const PHOTO_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
export const AUDIO_TYPES = new Set(["audio/mpeg", "audio/mp4", "audio/webm", "audio/ogg", "audio/wav"]);
export const MAX_PHOTO_BYTES = 10 * 1024 * 1024;
export const MAX_AUDIO_BYTES = 25 * 1024 * 1024;

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
