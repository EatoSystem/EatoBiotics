/* ── Edge-runtime admin cookie verification ───────────────────────────────
   Web Crypto twin of lib/admin-auth.ts (which uses node:crypto and cannot run
   in middleware). Derives the same static token — HMAC-SHA256 over
   "eatobiotics-admin-v1" keyed by ADMIN_SESSION_SECRET (fallback
   ADMIN_PASSWORD) — so a cookie minted by /api/admin/login verifies here.
   Fails closed: no secret configured → always false. A unit test asserts the
   node and edge derivations agree byte-for-byte. */

const ADMIN_TOKEN_MESSAGE = "eatobiotics-admin-v1"

function adminSecret(): string | null {
  const secret = process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD
  return secret && secret.trim().length > 0 ? secret : null
}

export async function adminCookieTokenEdge(): Promise<string | null> {
  const secret = adminSecret()
  if (!secret) return null
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  )
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(ADMIN_TOKEN_MESSAGE))
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}

export async function verifyAdminCookieEdge(value: string | undefined): Promise<boolean> {
  if (!value) return false
  const expected = await adminCookieTokenEdge()
  if (!expected || value.length !== expected.length) return false
  // Constant-time-ish comparison (no timingSafeEqual on the edge runtime).
  let diff = 0
  for (let i = 0; i < expected.length; i++) diff |= value.charCodeAt(i) ^ expected.charCodeAt(i)
  return diff === 0
}
