import { createHmac, timingSafeEqual } from "node:crypto"
import { getSupabase } from "@/lib/supabase"

/* ── Email unsubscribe / opt-out ────────────────────────────────────────────
   Single source of truth for email compliance:
   - a signed (HMAC) token so unsubscribe links / one-click POSTs can't be
     forged for arbitrary addresses,
   - the List-Unsubscribe headers (RFC 8058 one-click),
   - and the opt-out ledger (email_optouts, Migration 32) every sender checks.

   Server-only (node:crypto + service-role Supabase). Mirrors lib/admin-auth.ts.
──────────────────────────────────────────────────────────────────────────── */

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://eatobiotics.com"
const PURPOSE = "eatobiotics-unsubscribe-v1"

/**
 * Secret used to sign unsubscribe tokens. `null` when none is configured.
 *
 * ══ WHAT WAS HERE, AND WHY IT HAD TO GO ════════════════════════════════════
 *
 * This chain used to end in the literal "eatobiotics-unsubscribe-fallback".
 * A signing secret committed to the repository is not a secret: anyone who
 * could read this file could mint a valid one-click token for ANY address and
 * opt a stranger out of their own mail. The token exists precisely so that
 * cannot happen, so a hardcoded default did not weaken the control — it
 * removed it, while leaving something that looked like one.
 *
 * The ADMIN_SESSION_SECRET / ADMIN_PASSWORD fallbacks went with it. An admin
 * password is an unrelated credential, and once UNSUBSCRIBE_SECRET is required
 * at launch (GO-LIVE.md §2) a substitute buys nothing but a second way to be
 * surprised about which secret is actually in use.
 *
 * With no secret: no token, no one-click header, and the human opt-out still
 * works — see `unsubscribeToken` below.
 */
function secret(): string | null {
  return process.env.UNSUBSCRIBE_SECRET || null
}

const norm = (email: string) => email.trim().toLowerCase()

/**
 * A signed token for this address, or `null` when no secret is configured.
 *
 * Nullable rather than throwing, on purpose: an unconfigured optional secret
 * must not break transactional email that has nothing to do with unsubscribe.
 * Callers omit what they cannot sign.
 */
export function unsubscribeToken(email: string): string | null {
  const key = secret()
  if (!key) return null
  return createHmac("sha256", key).update(`${PURPOSE}:${norm(email)}`).digest("hex")
}

/**
 * Timing-safe token check for one-click unsubscribe.
 *
 * False when no secret is configured: there is nothing to verify against, and
 * accepting anything would be the forgeable fallback again in a new place.
 * The opt-out itself is unaffected — the route records a token-less request as
 * "manual", because it only ever ADDS an opt-out and already requires the
 * address.
 */
export function verifyUnsubscribeToken(email: string, token: string | null | undefined): boolean {
  if (!token) return false
  const expected = unsubscribeToken(email)
  if (!expected) return false
  const a = Buffer.from(token)
  const b = Buffer.from(expected)
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

/**
 * Human-facing unsubscribe link (the /unsubscribe page) — for email footers.
 *
 * Without a secret the token is simply absent. The page then shows its manual
 * confirm button instead of unsubscribing on arrival, which is the shape
 * app/api/email/nurture/route.ts already uses for a link with no address.
 */
export function unsubscribeUrl(email: string): string {
  const e = encodeURIComponent(norm(email))
  const token = unsubscribeToken(email)
  return token
    ? `${SITE_URL}/unsubscribe?email=${e}&token=${token}`
    : `${SITE_URL}/unsubscribe?email=${e}`
}

/**
 * Machine endpoint for RFC 8058 one-click (handles POST) — for the header.
 * `null` when the URL cannot be signed.
 */
export function unsubscribeOneClickUrl(email: string): string | null {
  const token = unsubscribeToken(email)
  if (!token) return null
  const e = encodeURIComponent(norm(email))
  return `${SITE_URL}/api/unsubscribe?email=${e}&token=${token}`
}

/**
 * List-Unsubscribe + one-click headers for marketing email.
 *
 * Returns NOTHING when the URL cannot be signed. An unsigned one-click URL
 * would be an open endpoint for unsubscribing strangers, advertised in a
 * header to every mail client that reads it — worse than not offering
 * one-click at all. Set UNSUBSCRIBE_SECRET (GO-LIVE.md §2) to turn it on;
 * until then the footer link and the /unsubscribe page carry the opt-out.
 */
export function unsubscribeHeaders(email: string): Record<string, string> {
  const oneClick = unsubscribeOneClickUrl(email)
  if (!oneClick) return {}
  const mailto = process.env.EMAIL_FROM ?? "hello@eatobiotics.com"
  return {
    "List-Unsubscribe": `<${oneClick}>, <mailto:${mailto}?subject=unsubscribe>`,
    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
  }
}

/** True if this address has opted out. Fails open (false) if Supabase is down. */
export async function isOptedOut(email: string): Promise<boolean> {
  const supabase = getSupabase()
  if (!supabase) return false
  const { data } = await supabase
    .from("email_optouts")
    .select("email")
    .eq("email", norm(email))
    .maybeSingle()
  return !!data
}

/** Returns the subset of `emails` that have opted out (for batch/cron senders). */
export async function filterOptedOut(emails: string[]): Promise<Set<string>> {
  const supabase = getSupabase()
  if (!supabase || emails.length === 0) return new Set()
  const { data } = await supabase
    .from("email_optouts")
    .select("email")
    .in("email", emails.map(norm))
  return new Set((data ?? []).map((r) => r.email as string))
}

/** Record an opt-out (idempotent). */
export async function recordOptOut(email: string, source?: string): Promise<boolean> {
  const supabase = getSupabase()
  if (!supabase) return false
  const { error } = await supabase
    .from("email_optouts")
    .upsert({ email: norm(email), source: source ?? null }, { onConflict: "email" })
  return !error
}
