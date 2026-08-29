/**
 * May an UNVERIFIED paid flow run in this runtime?
 *
 * ── The defect this replaces ─────────────────────────────────────────────────
 *
 * Two routes decided it with `const devMode = !process.env.STRIPE_SECRET_KEY`.
 * That is fail-OPEN on the one path that touches money: an environment missing
 * its Stripe key was treated as permission to skip payment verification, trust
 * the request body for the score/tier/lens, and insert a `deep_assessments`
 * row — which `lib/auth/reconcile-account.ts` then counts as proof of purchase
 * and grants a 30-day trial for. A missing secret is a misconfiguration, not a
 * grant. Every other gate in this repository (CRON_SECRET, ADMIN_SESSION_SECRET)
 * fails closed; this one did the opposite.
 *
 * ── The rule ─────────────────────────────────────────────────────────────────
 *
 * The bypass requires BOTH an explicit opt-in AND a runtime that can be proven
 * non-production. Neither alone is enough, and anything unrecognised is denied.
 *
 * ── Why NODE_ENV is never sufficient on its own ──────────────────────────────
 *
 * Vercel Preview deployments run application code with `NODE_ENV=production`,
 * so `NODE_ENV !== "production"` would deny the bypass in Preview (merely
 * annoying) while `NODE_ENV === "production"` proves nothing about whether the
 * runtime is the real production deployment (actively dangerous). `VERCEL_ENV`
 * is the deployment-environment signal and is consulted first; NODE_ENV is used
 * only to recognise a local dev/test process where no VERCEL_ENV exists at all.
 *
 * Deliberately NOT `NEXT_PUBLIC_`-prefixed: a client-readable flag would ship
 * the bypass switch to the browser. Server-only, and never logged — callers log
 * the decision, never the values behind it.
 */

/** The one variable that can enable this. Server-only by construction. */
export const UNVERIFIED_PAID_FLOW_FLAG = "EATOBIOTICS_ALLOW_UNVERIFIED_PAID_FLOW"

/**
 * `true` only for an explicitly opted-in, demonstrably non-production runtime.
 * Defaults to `false` for every input it does not recognise.
 */
export function isUnverifiedPaidFlowAllowed(env: NodeJS.ProcessEnv = process.env): boolean {
  // 1. Explicit opt-in, or nothing. Exact string — a truthy "1" or "yes" is a
  //    config accident, not a decision to disable payment verification.
  if (env[UNVERIFIED_PAID_FLOW_FLAG] !== "true") return false

  const vercelEnv = env.VERCEL_ENV

  // 2. The real deployment. The flag cannot override this, so a misplaced
  //    production env var cannot open the bypass on the live site.
  if (vercelEnv === "production") return false

  // 3. Vercel's non-production deployments.
  if (vercelEnv === "preview" || vercelEnv === "development") return true

  // 4. No Vercel at all: a local dev server or a test runner, and only when the
  //    Node runtime says so positively.
  if (!vercelEnv && (env.NODE_ENV === "development" || env.NODE_ENV === "test")) return true

  // 5. Anything else — an unknown VERCEL_ENV value, or no VERCEL_ENV with
  //    NODE_ENV=production — is a runtime we cannot prove is safe. Deny.
  return false
}
