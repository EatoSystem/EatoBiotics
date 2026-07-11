/* ── Content Studio media validation (pure, testable) ─────────────────────
   The single source of truth for what may be uploaded to the private
   cms-media bucket: allowed MIME types per media kind and per-kind size caps.
   Deliberately conservative — SVG is excluded (it is an XSS vector once an
   asset is later published to the public site), and there is no catch-all
   type. The storage key is always derived here, server-side, from the media
   kind and a server-issued id — never from a client-supplied path or filename.
──────────────────────────────────────────────────────────────────────── */

export const MEDIA_TYPES = ["image", "video", "audio", "document"] as const
export type MediaType = (typeof MEDIA_TYPES)[number]

export const MEDIA_ROLES = [
  "hero", "thumbnail", "inline", "social", "advert", "video", "audio", "document",
] as const
export type MediaRole = (typeof MEDIA_ROLES)[number]

/** Allowed MIME → media kind. SVG intentionally omitted. */
const MIME_TO_TYPE: Record<string, MediaType> = {
  "image/png": "image",
  "image/jpeg": "image",
  "image/webp": "image",
  "image/gif": "image",
  "image/avif": "image",
  "video/mp4": "video",
  "video/webm": "video",
  "video/quicktime": "video",
  "audio/mpeg": "audio",
  "audio/mp3": "audio",
  "audio/wav": "audio",
  "audio/ogg": "audio",
  "audio/mp4": "audio",
  "audio/x-m4a": "audio",
  "application/pdf": "document",
}

/** Per-kind maximum upload size in bytes. */
export const SIZE_CAPS: Record<MediaType, number> = {
  image: 15 * 1024 * 1024,      // 15 MB
  audio: 50 * 1024 * 1024,      // 50 MB
  document: 25 * 1024 * 1024,   // 25 MB
  video: 500 * 1024 * 1024,     // 500 MB
}

const EXT_FOR_MIME: Record<string, string> = {
  "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp", "image/gif": "gif", "image/avif": "avif",
  "video/mp4": "mp4", "video/webm": "webm", "video/quicktime": "mov",
  "audio/mpeg": "mp3", "audio/mp3": "mp3", "audio/wav": "wav", "audio/ogg": "ogg",
  "audio/mp4": "m4a", "audio/x-m4a": "m4a",
  "application/pdf": "pdf",
}

export function mediaTypeForMime(mime: string): MediaType | null {
  return MIME_TO_TYPE[mime.toLowerCase().trim()] ?? null
}

export function isMediaType(v: unknown): v is MediaType {
  return typeof v === "string" && (MEDIA_TYPES as readonly string[]).includes(v)
}

export function isMediaRole(v: unknown): v is MediaRole {
  return typeof v === "string" && (MEDIA_ROLES as readonly string[]).includes(v)
}

export type UploadValidation =
  | { ok: true; mediaType: MediaType }
  | { ok: false; error: string }

/** Validate a declared upload before an upload slot is granted. The actual
 *  stored size must be re-checked server-side after upload (the browser
 *  controls the real bytes). */
export function validateUpload({ mime, size }: { mime: string; size: number }): UploadValidation {
  const mediaType = mediaTypeForMime(mime)
  if (!mediaType) return { ok: false, error: "Unsupported file type" }
  if (!Number.isFinite(size) || size <= 0) return { ok: false, error: "Invalid file size" }
  if (size > SIZE_CAPS[mediaType]) {
    const capMb = Math.round(SIZE_CAPS[mediaType] / (1024 * 1024))
    return { ok: false, error: `${mediaType} files must be ${capMb} MB or smaller` }
  }
  return { ok: true, mediaType }
}

/** Server-derived storage key. The client's filename/path is never trusted;
 *  only the media kind and a server-issued id shape the key. */
export function deriveStorageKey(mediaType: MediaType, id: string, mime: string): string {
  const ext = EXT_FOR_MIME[mime.toLowerCase().trim()] ?? "bin"
  return `${mediaType}/${id}.${ext}`
}
