/**
 * May this runtime serve the canonical-Report PREVIEW page? — Phase 4B-S2.
 *
 * ══ WHAT THE PREVIEW IS ═════════════════════════════════════════════════════
 *
 * A fixture Report, composed by the real composer from fixture answers, run
 * through the real Presentation Model and the real renderer. It exists so the
 * document can be designed, reviewed and screenshotted before anything real is
 * wired to it. It reads no database, mints no capability, touches no Stripe
 * object and contains no customer's data.
 *
 * ══ WHY IT STILL FAILS CLOSED IN PRODUCTION ═════════════════════════════════
 *
 * Because "it is only a fixture" is a claim about today's code, and the URL
 * outlives it. A preview route that answers in production is a page a customer
 * can find, link to, and read as the product — and the first person to give it
 * a query parameter turns it into a way of asking the application to render
 * something. Phase 4B has not authorised ANY public Report access: S1 built the
 * authority layer and left it dormant, S3 has not built delivery, and the
 * migrations it all rests on are drafted and unapplied.
 *
 * So production is denied before anything else is consulted, and there is no
 * override — no flag, no header, no query parameter. The shape is deliberately
 * the same as `lib/consultation/persisted-activation-policy.ts`, which learned
 * it the same way: one predicate, server-only, denying anything it cannot prove
 * is non-production.
 *
 * ══ WHY IT IS NOT CLIENT-READABLE ═══════════════════════════════════════════
 *
 * It reads `process.env` and nothing else. No request, no header, no cookie, no
 * search parameter, and nothing here is `NEXT_PUBLIC_`-prefixed — a
 * client-readable switch would ship the decision to the browser, where a query
 * parameter could imitate it.
 */

/**
 * Deny by default. Every input this cannot prove is non-production returns
 * `false`, including an absent `VERCEL_ENV`: absence is not evidence of safety.
 */
export function isCanonicalReportPreviewEligible(
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
