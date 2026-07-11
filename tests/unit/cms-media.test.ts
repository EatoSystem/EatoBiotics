import { describe, it, expect } from "vitest"
import {
  MEDIA_TYPES, SIZE_CAPS, deriveStorageKey, isMediaRole, mediaTypeForMime, validateUpload,
} from "@/lib/cms/media"

/* Guards the media upload validation: the MIME allowlist (SVG excluded as an
   XSS vector), per-kind size caps, and the server-derived storage key that
   never trusts a client path. */

describe("mediaTypeForMime", () => {
  it("maps allowed MIME types to their kind", () => {
    expect(mediaTypeForMime("image/png")).toBe("image")
    expect(mediaTypeForMime("image/webp")).toBe("image")
    expect(mediaTypeForMime("video/mp4")).toBe("video")
    expect(mediaTypeForMime("audio/mpeg")).toBe("audio")
    expect(mediaTypeForMime("application/pdf")).toBe("document")
  })

  it("rejects SVG and any unknown type", () => {
    expect(mediaTypeForMime("image/svg+xml")).toBeNull()
    expect(mediaTypeForMime("text/html")).toBeNull()
    expect(mediaTypeForMime("application/x-msdownload")).toBeNull()
    expect(mediaTypeForMime("")).toBeNull()
  })
})

describe("validateUpload", () => {
  it("accepts an allowed type within its size cap", () => {
    const r = validateUpload({ mime: "image/jpeg", size: 2 * 1024 * 1024 })
    expect(r).toEqual({ ok: true, mediaType: "image" })
  })

  it("rejects a disallowed type", () => {
    const r = validateUpload({ mime: "image/svg+xml", size: 1000 })
    expect(r.ok).toBe(false)
  })

  it("rejects a file over its per-kind cap", () => {
    const overImage = validateUpload({ mime: "image/png", size: SIZE_CAPS.image + 1 })
    expect(overImage.ok).toBe(false)
    // But the same size is fine for video (higher cap).
    const okVideo = validateUpload({ mime: "video/mp4", size: SIZE_CAPS.image + 1 })
    expect(okVideo).toEqual({ ok: true, mediaType: "video" })
  })

  it("rejects a zero or negative size", () => {
    expect(validateUpload({ mime: "image/png", size: 0 }).ok).toBe(false)
    expect(validateUpload({ mime: "image/png", size: -5 }).ok).toBe(false)
  })
})

describe("deriveStorageKey", () => {
  it("derives a key from kind + id + mime extension, ignoring any client path", () => {
    expect(deriveStorageKey("image", "abc-123", "image/jpeg")).toBe("image/abc-123.jpg")
    expect(deriveStorageKey("video", "vid-9", "video/webm")).toBe("video/vid-9.webm")
    expect(deriveStorageKey("document", "doc-1", "application/pdf")).toBe("document/doc-1.pdf")
  })

  it("never incorporates a client-supplied filename or traversal", () => {
    const key = deriveStorageKey("image", "id-1", "image/png")
    expect(key).toBe("image/id-1.png")
    expect(key).not.toContain("..")
    expect(key).not.toContain(" ")
  })
})

describe("taxonomy guards", () => {
  it("exposes exactly the four media kinds and validates roles", () => {
    expect([...MEDIA_TYPES]).toEqual(["image", "video", "audio", "document"])
    expect(isMediaRole("hero")).toBe(true)
    expect(isMediaRole("thumbnail")).toBe(true)
    expect(isMediaRole("not_a_role")).toBe(false)
  })
})
