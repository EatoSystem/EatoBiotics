import { createHmac, timingSafeEqual } from "node:crypto"

/* ── Admin authentication ──────────────────────────────────────────────────
   Replaces the previous static sentinel cookie ("eatobiotics-admin-ok"), which
   was a public constant anyone could forge. The admin cookie now holds an
   HMAC derived from a server-only secret, so it cannot be forged without that
   secret, and the old constant no longer validates.

   Pure (node:crypto only) so it stays unit-testable — callers read/write the
   cookie value via next/headers and pass it here.
──────────────────────────────────────────────────────────────────────────── */

export const ADMIN_COOKIE = "admin_auth"
const ADMIN_PURPOSE = "eatobiotics-admin-v1"

/** Server-only secret used to sign the admin cookie. Falls back to ADMIN_PASSWORD. */
function adminSecret(): string | null {
  return process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD || null
}

/** The expected signed cookie value, or null if no secret is configured (fail closed). */
export function adminCookieToken(): string | null {
  const secret = adminSecret()
  if (!secret) return null
  return createHmac("sha256", secret).update(ADMIN_PURPOSE).digest("hex")
}

/** Timing-safe verification of an admin cookie value. */
export function verifyAdminCookie(value: string | undefined | null): boolean {
  const expected = adminCookieToken()
  if (!expected || !value) return false
  const a = Buffer.from(value)
  const b = Buffer.from(expected)
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}
