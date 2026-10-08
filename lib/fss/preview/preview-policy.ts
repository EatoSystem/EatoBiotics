/**
 * May this runtime serve the FSS-v1 candidate preview? — Gate 2.
 *
 * ══ WHAT THE PREVIEW IS ═════════════════════════════════════════════════════
 *
 * The candidate canonical assessment and its result, end to end, on fixture
 * weights. It exists so the central intelligence of EatoBiotics can be walked
 * and inspected BEFORE anything is built around it. It reads no database,
 * writes nothing, touches no customer data, and scores nobody.
 *
 * ══ WHY IT FAILS CLOSED IN PRODUCTION ═══════════════════════════════════════
 *
 * Because everything it renders is unapproved. The five domains are candidates
 * frozen for review with no named reviewer; the weights are a DEV_ONLY fixture
 * chosen for legibility in a test, not proposed; three of the questions are
 * drafts. A production URL serving that is a page someone can find, link to,
 * screenshot and read as the product — and "Your Food System Score™" appearing
 * on a real domain is exactly the claim the whole phase exists to withhold
 * until the methodology earns it.
 *
 * So production is denied before anything else is consulted. No environment
 * variable, no query parameter, no header, no cookie, no authenticated role and
 * no client flag can say otherwise.
 *
 * ══ WHY THIS IS A SECOND PREDICATE AND NOT AN IMPORT ════════════════════════
 *
 * `lib/report/presentation/preview-policy.ts` has the identical shape, and it
 * in turn says it is deliberately the same shape as
 * `lib/consultation/persisted-activation-policy.ts`. Three copies of six lines
 * looks like something to factor out, and the codebase has twice decided
 * otherwise — for a reason worth restating rather than rediscovering:
 *
 *   these are INDEPENDENT gates on independent unfinished features, and a
 *   shared helper is a shared switch. One edit to make the Report preview
 *   reachable somewhere would silently make this reachable there too.
 *
 * Six duplicated lines are cheaper than that coupling, and the duplication is
 * pinned by a test that compares the two behaviours across every environment.
 *
 * ══ WHY IT IS NOT CLIENT-READABLE ═══════════════════════════════════════════
 *
 * It reads `process.env` and nothing else — no request, no header, no cookie,
 * no search parameter, and nothing `NEXT_PUBLIC_`-prefixed. A client-readable
 * switch would ship the decision to the browser, where a query parameter could
 * imitate it.
 *
 * ══ AND WHY THE PROXY DOES NOT DECIDE ═══════════════════════════════════════
 *
 * `proxy.ts` runs on the edge, where Next compiles `process.env` into the
 * bundle at BUILD time — so an edge check reports whatever was true when
 * `next build` ran. lib/v1-surface.ts records that finding in full. The route
 * is therefore classified FIXTURE_SELF_GATED: the proxy passes it through and
 * THIS predicate, in the Node runtime, refuses.
 */

/**
 * Deny by default. Every input this cannot prove is non-production returns
 * `false`, including an absent `VERCEL_ENV`: absence is not evidence of safety.
 */
export function isFoodSystemV1PreviewEligible(
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
