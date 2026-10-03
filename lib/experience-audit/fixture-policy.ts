/**
 * May this runtime serve the Experience Audit Fixture? — Experience 0.
 *
 * ══ WHAT THIS IS, AND WHAT IT IS NOT ════════════════════════════════════════
 *
 * AUDIT TOOLING. Not a product preview, not a demo, not a staging surface, and
 * not a future account architecture. It renders the REAL
 * `components/account/live-dashboard.tsx` from deterministic fixture props so
 * the Experience 0 UX audit can photograph the product's current home at
 * 390/834/1280 and count what is actually on screen.
 *
 * It exists because the two alternatives were both dishonest. `/account`
 * itself needs a production Supabase session, which this programme is
 * read-only against. And `app/demo/account/page.tsx` renders
 * `dashboard-client.tsx` — a different, ten-tab component that CLAUDE.md
 * explicitly warns is "demo/mock-data only … never used by the real /account
 * route. Do not confuse the two when reasoning about what a signed-in member
 * actually sees." Auditing the demo would have produced a beautiful report
 * about the wrong component.
 *
 * ══ WHY IT IS NOT UNDER /preview/ ═══════════════════════════════════════════
 *
 * `/preview/food-system-v1` is a product preview: a thing a reviewer walks to
 * evaluate the product. This is an instrument pointed at the product. Putting
 * it under the same prefix would invite somebody to read audit scaffolding as
 * a product direction, which is the opposite of its purpose. Hence `/audit/`,
 * and hence the banner the page renders.
 *
 * ══ WHY IT FAILS CLOSED IN PRODUCTION ═══════════════════════════════════════
 *
 * Because it renders a member dashboard populated with invented data. A
 * production URL serving that is a page somebody can find, link to and read as
 * a real account — fabricated scores, fabricated meals, fabricated reports.
 * The audit's own first finding is that the real dashboard already shows mock
 * meals as a member's own analysis; shipping a whole mock dashboard would be
 * that defect with a URL.
 *
 * ══ WHY THIS IS A FOURTH COPY AND NOT AN IMPORT ═════════════════════════════
 *
 * `lib/fss/preview/preview-policy.ts` and
 * `lib/report/presentation/preview-policy.ts` hold the identical six lines,
 * and both say why. The reason is restated once more rather than rediscovered:
 *
 *   these are INDEPENDENT gates on independent unfinished things, and a
 *   SHARED HELPER IS A SHARED SWITCH. One edit to make a product preview
 *   reachable must not make audit scaffolding reachable with it.
 *
 * This is the fourth such gate. The duplication is only defensible if it stays
 * faithful, so `tests/unit/fss-preview-gate.test.ts` pins all four behaviours
 * against each other across every environment any of them will ever see, and
 * asserts separately that each denies production outright — because "they all
 * agree" would still pass if all four agreed on the wrong answer.
 *
 * ══ AND WHY THE PROXY DOES NOT DECIDE ═══════════════════════════════════════
 *
 * `proxy.ts` runs on the edge, where Next compiles `process.env` into the
 * bundle at BUILD time, so an edge check reports whatever was true when `next
 * build` ran. `lib/v1-surface.ts` records that finding in full. The route is
 * therefore classified FIXTURE_SELF_GATED: the proxy passes it through and
 * THIS predicate, in the Node runtime, per request, refuses.
 */

/**
 * Deny by default. Every input this cannot prove is non-production returns
 * `false`, including an absent `VERCEL_ENV`: absence is not evidence of safety.
 */
export function isExperienceAuditFixtureEligible(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  const vercelEnv = env.VERCEL_ENV

  // 1. The real deployment. Nothing overrides this.
  if (vercelEnv === "production") return false

  // 2. Vercel's non-production deployments.
  if (vercelEnv === "preview" || vercelEnv === "development") return true

  // 3. No Vercel at all: a local dev server or a test runner, and only when the
  //    Node runtime says so positively.
  if (!vercelEnv && (env.NODE_ENV === "development" || env.NODE_ENV === "test")) return true

  // 4. An unknown VERCEL_ENV, or no VERCEL_ENV with NODE_ENV=production, is a
  //    runtime we cannot prove is safe. Deny.
  return false
}
