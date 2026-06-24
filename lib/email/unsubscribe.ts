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

/** Secret used to sign unsubscribe tokens. Falls back to the admin secret. */
function secret(): string {
  return (
    process.env.UNSUBSCRIBE_SECRET ||
    process.env.ADMIN_SESSION_SECRET ||
    process.env.ADMIN_PASSWORD ||
    "eatobiotics-unsubscribe-fallback"
  )
}

const norm = (email: string) => email.trim().toLowerCase()

export function unsubscribeToken(email: string): string {
  return createHmac("sha256", secret()).update(`${PURPOSE}:${norm(email)}`).digest("hex")
}

/** Timing-safe token check for one-click unsubscribe. */
export function verifyUnsubscribeToken(email: string, token: string | null | undefined): boolean {
  if (!token) return false
  const a = Buffer.from(token)
  const b = Buffer.from(unsubscribeToken(email))
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

/** Human-facing unsubscribe link (the /unsubscribe page) — for email footers. */
export function unsubscribeUrl(email: string): string {
  const e = encodeURIComponent(norm(email))
  return `${SITE_URL}/unsubscribe?email=${e}&token=${unsubscribeToken(email)}`
}

/** Machine endpoint for RFC 8058 one-click (handles POST) — for the header. */
export function unsubscribeOneClickUrl(email: string): string {
  const e = encodeURIComponent(norm(email))
  return `${SITE_URL}/api/unsubscribe?email=${e}&token=${unsubscribeToken(email)}`
}

/** List-Unsubscribe + one-click headers to attach to every marketing email. */
export function unsubscribeHeaders(email: string): Record<string, string> {
  const mailto = process.env.EMAIL_FROM ?? "hello@eatobiotics.com"
  return {
    "List-Unsubscribe": `<${unsubscribeOneClickUrl(email)}>, <mailto:${mailto}?subject=unsubscribe>`,
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
