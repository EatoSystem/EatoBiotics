/**
 * The one definition of "which Health-system add-on can be purchased".
 *
 * ── Why this module exists ───────────────────────────────────────────────────
 *
 * This set was written out by hand in four places: `PaidReportHealthSystem` in
 * lib/paid-report-session.ts, a `HEALTH_SYSTEMS` array in the checkout route, an
 * inline union in the submit-deep-assessment route, and `AssessedSystemKey` in
 * lib/assessment/registry.ts. Four copies of the same list is four chances for
 * a fifth add-on to be added to three of them, and the failure is silent: an
 * unrecognised value simply stops being an add-on somewhere in the middle of
 * checkout → report.
 *
 * It is a dependency-free leaf on purpose. `paid-report-session.ts` pulls in
 * Stripe types and Buffer, and `registry.ts` is reachable from client
 * components; neither can safely import the other, but both can import this.
 *
 * NOT the same list as `HealthSystemKey` in lib/systems.ts. That one is the
 * marketing catalogue and includes `recovery` and `longevity`, which are
 * presented on the site but have no assessment and cannot be bought as a lens.
 * Widening this union is a product decision: it requires a question bank
 * (lib/assessment/addon-questions.ts) and a lens builder
 * (lib/report/addon-lens.ts), and the tests will fail until both exist.
 */
export type AddonType = "stability" | "glucose" | "mind" | "performance"

/** Stable iteration order — used by UI, report builders and tests alike. */
export const ADDON_KEYS: readonly AddonType[] = ["stability", "glucose", "mind", "performance"]

export function isAddon(value: unknown): value is AddonType {
  return typeof value === "string" && (ADDON_KEYS as readonly string[]).includes(value)
}

/**
 * Narrow an untrusted value to a known add-on, or `null`.
 *
 * Every boundary that accepts an add-on — a request body, Stripe metadata, a
 * stored `free_scores` blob — must go through this. An unknown value becomes
 * `null` and the report is built with no lens, rather than carrying a string
 * nothing downstream can render.
 */
export function asAddonType(value: unknown): AddonType | null {
  return isAddon(value) ? value : null
}
