/**
 * May the PERSISTED deterministic Consultation run in this runtime?
 *
 * ══ WHY THIS EXISTS AT ALL ══════════════════════════════════════════════════
 *
 * Phase 3C-C2A sealed a finished Consultation into an immutable trusted
 * handoff. Phase 4A, which turns that handoff into the Report the customer
 * paid €49 for, does not exist. Activating the deterministic flow for a real
 * buyer would therefore take their money, walk them through twenty minutes of
 * questions, seal the record — and leave them in front of nothing.
 *
 * There is a second, mechanical reason. Migration 48 is drafted and NOT
 * applied, so `consultation_finalisation` and `consultation_handoff_id` do not
 * exist in production. Every deterministic route reads them. Against the live
 * schema they would error. This policy is what keeps that unreachable rather
 * than merely unlikely.
 *
 * ══ THE RULE ════════════════════════════════════════════════════════════════
 *
 * Identical in shape to `lib/paid-flow-policy.ts`, deliberately: an explicit
 * opt-in AND a runtime that can be PROVEN non-production. Neither alone, and
 * anything unrecognised denied.
 *
 * `VERCEL_ENV === "production"` is checked after the flag and cannot be
 * overridden by it, so a variable pasted into the wrong project's settings
 * cannot switch the live site.
 *
 * Deliberately NOT `NEXT_PUBLIC_`-prefixed: a client-readable flag would ship
 * the activation switch to the browser, where a query parameter could imitate
 * it. The existing demo-preview parameter remains what it has always been —
 * nested inside the demo gate, reading nothing from a database, and named only
 * on the page that honours it. A guard asserts no other file mentions it, so
 * this note describes it rather than repeating it.
 *
 * ══ WHAT THIS DOES NOT DECIDE ═══════════════════════════════════════════════
 *
 * Only whether an UNCLAIMED session may be opened as deterministic. It has no
 * say over a session that has already been claimed: converting a live
 * Consultation in either direction destroys it, so a rollout toggle must never
 * be able to. Stickiness lives in the stored `questions`, not here.
 */

/** The one variable that can enable this. Server-only by construction. */
export const PERSISTED_CONSULTATION_FLAG = "EATOBIOTICS_ENABLE_PERSISTED_CONSULTATION_PREVIEW"

/**
 * `true` only for an explicitly opted-in, demonstrably non-production runtime.
 * Defaults to `false` for every input it does not recognise.
 */
export function isPersistedConsultationAllowed(env: NodeJS.ProcessEnv = process.env): boolean {
  // 1. Explicit opt-in, or nothing. Exact string — a truthy "1" or "yes" is a
  //    config accident, not a decision to activate an unfinished product path.
  if (env[PERSISTED_CONSULTATION_FLAG] !== "true") return false

  const vercelEnv = env.VERCEL_ENV

  // 2. The real deployment. The flag cannot override this.
  if (vercelEnv === "production") return false

  // 3. Vercel's non-production deployments.
  if (vercelEnv === "preview" || vercelEnv === "development") return true

  // 4. No Vercel at all: a local dev server or a test runner, and only when the
  //    Node runtime says so positively.
  if (!vercelEnv && (env.NODE_ENV === "development" || env.NODE_ENV === "test")) return true

  // 5. An unknown VERCEL_ENV, or no VERCEL_ENV with NODE_ENV=production, is a
  //    runtime we cannot prove is safe. Deny.
  return false
}
