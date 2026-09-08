/**
 * Two different questions about the persisted deterministic Consultation.
 *
 * ══ WHY THEY ARE TWO ════════════════════════════════════════════════════════
 *
 * They were one, and that was a defect. A single conflated predicate gated both
 * "may an unclaimed session be claimed" and "may an already-deterministic
 * session render" — so turning the rollout off would have stranded a customer
 * who was half way through a Consultation, in an environment that was otherwise
 * perfectly able to serve it. Their answers would still be in the row; the page
 * would simply stop showing them the flow that could read it. (That predicate
 * is deleted rather than deprecated, and a guard asserts no file names it.)
 *
 * A rollout toggle decides who STARTS something. It must never decide whether
 * something already started may continue, because the second is not a rollout
 * decision at all — it is a decision about a customer's existing work.
 *
 *   isPersistedRuntimeEligible()   — may this runtime execute the persisted
 *                                    deterministic stack at all?
 *   isNewDeterministicClaimAllowed() — may an UNCLAIMED paid session be newly
 *                                    claimed for it?
 *
 * ══ WHY RUNTIME ELIGIBILITY IS STILL FAIL-CLOSED ════════════════════════════
 *
 * Phase 3C-C2A sealed a finished Consultation into an immutable trusted
 * handoff. Phase 4A, which turns that handoff into the Report the customer paid
 * €49 for, does not exist. Activating this for a real buyer would take their
 * money, walk them through twenty minutes of questions, seal the record — and
 * leave them in front of nothing.
 *
 * There is a second, mechanical reason. Migration 48 is drafted and NOT
 * applied, so `consultation_finalisation` and `consultation_handoff_id` do not
 * exist in production. Every deterministic route reads them. Against the live
 * schema they would error. Runtime eligibility is what keeps that unreachable
 * rather than merely unlikely.
 *
 * So production is denied here, before any flag is consulted, and dropping the
 * flag from THIS decision widens nothing: a stored deterministic session can
 * only exist where a claim happened, and claiming still requires the flag.
 *
 * ══ WHY NEITHER IS CLIENT-READABLE ══════════════════════════════════════════
 *
 * Neither consults a request, a header, a cookie or a query parameter, and the
 * flag is deliberately NOT `NEXT_PUBLIC_`-prefixed: a client-readable switch
 * would ship the activation decision to the browser, where a query parameter
 * could imitate it. The existing demo-preview parameter remains what it has
 * always been — nested inside the demo gate, reading nothing from a database,
 * and named only on the page that honours it.
 */

/**
 * The one variable that can enable NEW claims. Server-only by construction.
 *
 * The environment variable name is unchanged, so no deployment has to be
 * touched; what changed is what it is allowed to decide.
 */
export const NEW_DETERMINISTIC_CLAIM_FLAG = "EATOBIOTICS_ENABLE_PERSISTED_CONSULTATION_PREVIEW"

/**
 * May this runtime execute the persisted deterministic stack at all?
 *
 * Runtime only — no flag. Defaults to `false` for every input it cannot prove
 * is non-production.
 */
export function isPersistedRuntimeEligible(env: NodeJS.ProcessEnv = process.env): boolean {
  const vercelEnv = env.VERCEL_ENV

  // 1. The real deployment. Nothing overrides this.
  if (vercelEnv === "production") return false

  // 2. Vercel's non-production deployments.
  if (vercelEnv === "preview" || vercelEnv === "development") return true

  // 3. No Vercel at all: a local dev server or a test runner, and only when the
  //    Node runtime says so positively. Absence of a Vercel variable is not
  //    evidence of safety.
  if (!vercelEnv && (env.NODE_ENV === "development" || env.NODE_ENV === "test")) return true

  // 4. An unknown VERCEL_ENV, or no VERCEL_ENV with NODE_ENV=production, is a
  //    runtime we cannot prove is safe. Deny.
  return false
}

/**
 * May an UNCLAIMED paid session be newly claimed as deterministic?
 *
 * Both halves: a runtime that may run this at all, AND an explicit opt-in. The
 * exact string — a truthy "1" or "yes" is a config accident, not a decision to
 * put customers into an unfinished product path.
 */
export function isNewDeterministicClaimAllowed(env: NodeJS.ProcessEnv = process.env): boolean {
  if (!isPersistedRuntimeEligible(env)) return false
  return env[NEW_DETERMINISTIC_CLAIM_FLAG] === "true"
}
