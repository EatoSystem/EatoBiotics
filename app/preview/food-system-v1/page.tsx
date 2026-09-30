import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { isFoodSystemV1PreviewEligible } from "@/lib/fss/preview/preview-policy"
import { resolveQuestionSetV1 } from "@/lib/fss/questions/resolve"
import { CandidateWalk } from "./candidate-walk"

/**
 * The FSS-v1 candidate, walkable — Gate 2.
 *
 * ══ WHAT THIS PAGE IS ═══════════════════════════════════════════════════════
 *
 * The candidate canonical assessment and its result, end to end, so the central
 * intelligence of EatoBiotics can be inspected before anything is built around
 * it. "Tell us about your Food System" → a candidate Food System Score → the
 * five domains → What You Notice → Your Food Context → Your Priority.
 *
 * ══ WHAT IT DELIBERATELY IS NOT ═════════════════════════════════════════════
 *
 * No database read and no database write. No production Supabase anything —
 * answers live in the local repository adapter and nowhere else. No account, no
 * auth, no Stripe, no customer data, and no effect on any existing score: the
 * legacy instrument and its arithmetic are untouched and the methodology freeze
 * is intact.
 *
 * And no public access. `isFoodSystemV1PreviewEligible` denies production
 * outright — no environment variable, query parameter, header, cookie,
 * authenticated role or client flag can say otherwise. `notFound()` rather than
 * a redirect or an explanation: an ineligible runtime should not confirm that
 * the route exists.
 *
 * ══ WHY IT MUST NOT BE REACHABLE ════════════════════════════════════════════
 *
 * Everything on it is unapproved. The five domains are candidates frozen for
 * review with no named reviewer. The weights are a DEV_ONLY fixture chosen so
 * an arithmetic test reads clearly, not proposed as methodology. Seven of the
 * twenty-two questions are drafts. And it renders "Your Food System Score™",
 * which is the name the whole programme is withholding until the methodology
 * earns it.
 *
 * It is `noindex`, absent from `app/sitemap.ts`, and absent from `lib/nav.ts`:
 * nothing links to it and nothing should.
 */

export const metadata: Metadata = {
  title: "Food System v1 — candidate preview",
  robots: "noindex",
}

/*
 * ══ WITHOUT THIS THE GATE READS THE WRONG ENVIRONMENT ═══════════════════════
 *
 * Next prerenders a server component with no dynamic inputs at BUILD time, so
 * `isFoodSystemV1PreviewEligible()` would be evaluated once, during `next
 * build`, and its answer baked into static HTML. The first version of this page
 * had no directive and was marked `○` in the build output; served with
 * VERCEL_ENV=preview it still returned 404, because the build had run without
 * it.
 *
 * The failure was in the SAFE direction, which is exactly why it is worth a
 * comment: a gate that is accidentally too strict looks like it works, and the
 * only symptom is that the thing nobody can reach is also unreachable by the
 * people who are supposed to review it.
 *
 * It is the same shape as the finding recorded in lib/v1-surface.ts about the
 * edge runtime compiling `process.env` at build time — a different runtime,
 * the same mistake. The decision must happen per request, so the page is
 * dynamic, exactly as app/demo/food-system-report/page.tsx already is.
 */
export const dynamic = "force-dynamic"

export default function FoodSystemV1PreviewPage() {
  if (!isFoodSystemV1PreviewEligible()) notFound()

  // Resolved on the server so a pin mismatch fails loudly here, at the point of
  // rendering, rather than producing a half-instrument in the browser.
  const set = resolveQuestionSetV1()

  return (
    <div className="min-h-screen bg-background">
      {/*
        The review banner. Not a consumer disclaimer sprinkled through the
        experience — one unmissable statement at the top of a surface only
        reviewers can reach, so the walk itself reads as the product would while
        the build state stays impossible to mistake.
      */}
      <div
        className="border-b px-6 py-3 text-center"
        style={{ borderColor: "var(--border)", background: "color-mix(in srgb, var(--icon-yellow) 12%, var(--background))" }}
      >
        <p className="text-xs font-semibold uppercase tracking-wider text-foreground">
          FSS-v1 candidate · frozen for scientific review, not yet approved
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Fixture weights, draft questions, no named reviewer. Not reachable in production.
        </p>
      </div>

      <CandidateWalk set={set} />
    </div>
  )
}
