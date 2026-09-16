import { createHash, randomBytes, timingSafeEqual } from "node:crypto"

/**
 * The Report-access capability — Phase 4B-S1.
 *
 * ══ THREE LIFECYCLES, DELIBERATELY NOT MERGED ═══════════════════════════════
 *
 *   seal / handoff    immutable authority     write-once
 *   canonical Report  immutable authority     insert-once
 *   this capability   SECURITY CREDENTIAL     rotatable, revocable
 *
 * An earlier design issued the credential inside the seal transaction, one
 * secret per seal, immutable like everything around it. That cannot work, and
 * the reason is worth keeping: minting commits a HASH and returns the plaintext,
 * so if that response is lost after commit the plaintext is unrecoverable BY
 * CONSTRUCTION. Without rotation, a dropped packet locks a customer out
 * permanently. Credentials need a lifecycle; authority does not.
 *
 *   ONE SEALED ASSESSMENT/HANDOFF → AT MOST ONE ACTIVE CAPABILITY AT A TIME.
 *
 * Rotation and revocation change nothing about the finalisation, the handoff or
 * the canonical Report. A rotated credential yields the identical Report.
 *
 * ══ REVOCATION IS TERMINAL ══════════════════════════════════════════════════
 *
 *   mint ──→ ACTIVE ──rotate──→ ACTIVE′ ──rotate──→ ACTIVE″
 *              │
 *            revoke
 *              ↓
 *           REVOKED          ← nothing leaves this state
 *              │
 *           DELETE  ──→ (gone; a new credential is a NEW ROW)
 *
 * Migration 50 refuses every update to a revoked row: clearing `revoked_at`,
 * re-stamping it, or rotating the hash underneath it. The rotation CAS below
 * already carries `AND revoked_at IS NULL`, but that only binds THIS code — a
 * revocation that a plain UPDATE can undo is not a revocation, so the rule
 * lives in the database where nothing can route around it.
 *
 * Re-issuing after revocation is therefore DELETE then INSERT. That is
 * available because a direct delete is deliberately permitted on this table,
 * and it is the honest shape: the old secret is gone, and what replaces it is
 * a new credential rather than an old one brought back.
 *
 * ══ WHY THERE IS NO GENERATION COUNTER ══════════════════════════════════════
 *
 * A draft had the cookie carry a DERIVED session token, which meant rotation
 * had to invalidate two things down two paths, and needed a counter to keep
 * them in step. Carrying the SAME secret in the cookie removes the problem
 * rather than solving it: one write to `token_hash` kills the raw link, the
 * capability value and every cookie minted from it, simultaneously, because
 * they are all the same string. `token_hash` is the only rotation and
 * revocation authority, and it is also the CAS state.
 *
 * ══ WHY SHA-256 AND NOT A SLOW KDF ══════════════════════════════════════════
 *
 * A slow KDF exists to make guessing a LOW-ENTROPY secret expensive. This
 * secret is 256 bits of CSPRNG output, so guessing is not the threat, and a KDF
 * would tax every Report read to defend against nothing. The row is located by
 * the handoff id from the URL, so no hash-indexed lookup is needed either.
 */

/** 256 bits. Not configurable — a caller who could lower it would be the attack. */
const SECRET_BYTES = 32

/** Where a Report lives. The cookie is scoped underneath this, never above it. */
export const REPORT_ROUTE_BASE = "/assessment/food-system-report"

export const REPORT_ACCESS_COOKIE_NAME = "eatobiotics_report_access"

/** A v4-shaped handoff id. Anything else is not a locator we issued. */
const HANDOFF_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/

/** base64url alphabet only — notably no `.`, which is the cookie separator. */
const SECRET_PATTERN = /^[A-Za-z0-9_-]{43}$/

const HEX_64 = /^[0-9a-f]{64}$/

export function isHandoffId(value: string): boolean {
  return HANDOFF_PATTERN.test(value)
}

/** A fresh capability secret. The ONLY place a secret is created. */
export function mintSecret(): string {
  return randomBytes(SECRET_BYTES).toString("base64url")
}

/** What the database stores. The plaintext is never persisted anywhere. */
export function hashSecret(secret: string): string {
  return createHash("sha256").update(secret, "utf8").digest("hex")
}

/**
 * Constant-time comparison of two stored hashes.
 *
 * Timing is not actually exploitable against a 256-bit random secret — an
 * attacker cannot walk a hash a byte at a time when they cannot choose
 * preimages. It is constant-time anyway, because the cost is nil and because
 * the next person to read this should not have to re-derive that argument
 * before trusting it.
 *
 * Length is checked first and NOT in constant time: both operands are
 * fixed-width hex digests, so a length difference means malformed input rather
 * than a near-miss, and `timingSafeEqual` throws on unequal lengths.
 */
export function hashesMatch(left: string, right: string): boolean {
  if (!HEX_64.test(left) || !HEX_64.test(right)) return false
  return timingSafeEqual(Buffer.from(left, "hex"), Buffer.from(right, "hex"))
}

/** Convenience: does this presented secret hash to the committed value? */
export function secretMatchesHash(secret: string, committedHash: string): boolean {
  if (!SECRET_PATTERN.test(secret)) return false
  return hashesMatch(hashSecret(secret), committedHash)
}

/* ══ Cookie ═══════════════════════════════════════════════════════════════ */

/**
 * The cookie carries `<handoffId>.<secret>`, and the binding is not decoration.
 *
 * A `Cookie` header carries no path information, so a runtime that hands back
 * several same-name cookies gives no way to tell which Report each belongs to.
 * Putting the handoff INSIDE the value means a cookie minted for Report A can
 * never authorise Report B, whatever the framework does with path scoping.
 * Unambiguous to split, because a uuid contains no `.` and base64url has none.
 */
export function encodeReportCookie(handoffId: string, secret: string): string {
  return `${handoffId}.${secret}`
}

export function decodeReportCookie(
  value: string,
): { handoffId: string; secret: string } | null {
  const separator = value.indexOf(".")
  if (separator === -1) return null
  const handoffId = value.slice(0, separator)
  const secret = value.slice(separator + 1)
  if (!isHandoffId(handoffId) || !SECRET_PATTERN.test(secret)) return null
  return { handoffId, secret }
}

/**
 * The per-Report cookie path. Scoping is what lets Reports coexist.
 *
 * Under RFC 6265 path matching, a cookie at `…/report/<A>` is sent for `<A>`
 * and its sub-paths and NEVER for `<B>`, so same-name cookies at distinct
 * Report paths do not collide. A customer may hold several purchased Reports
 * and all stay live.
 *
 * A PARENT-PATH COPY WOULD DESTROY THIS. A cookie at `/` — or even at
 * `REPORT_ROUTE_BASE` — is sent to every Report path and shadows the scoped
 * ones. Nothing may ever set this cookie at a parent path; a guard asserts it.
 */
export function reportCookiePath(handoffId: string): string {
  if (!isHandoffId(handoffId)) {
    throw new Error("reportCookiePath requires a handoff id")
  }
  return `${REPORT_ROUTE_BASE}/${handoffId}`
}

/**
 * Every attribute, assembled in one place so no caller assembles its own.
 *
 * `SameSite=Lax` rather than `Strict`: the customer arrives at their Report by
 * following a link from an email, and `Strict` would withhold the cookie on
 * exactly that navigation, sending a paying customer to a 404 on their own
 * Report.
 */
export function reportCookieAttributes(handoffId: string): {
  name: string
  path: string
  httpOnly: true
  secure: true
  sameSite: "lax"
} {
  return {
    name: REPORT_ACCESS_COOKIE_NAME,
    path: reportCookiePath(handoffId),
    httpOnly: true,
    secure: true,
    sameSite: "lax",
  }
}

/**
 * The secrets among presented cookies that claim THIS handoff.
 *
 * Takes every same-name cookie rather than the first, because the first is an
 * arbitrary choice the framework makes for us. Undecodable values are dropped
 * silently: a malformed cookie is not evidence of anything, and reporting on it
 * would tell a caller which of their guesses parsed.
 */
export function candidateSecretsFor(
  presented: readonly string[],
  handoffId: string,
): string[] {
  if (!isHandoffId(handoffId)) return []
  const out: string[] = []
  for (const raw of presented) {
    const decoded = decodeReportCookie(raw)
    if (decoded !== null && decoded.handoffId === handoffId) out.push(decoded.secret)
  }
  return out
}
