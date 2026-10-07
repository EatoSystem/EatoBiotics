/**
 * The current "You" journey, as a named list — one place, grouped by domain.
 *
 * ── Why this exists ──────────────────────────────────────────────────────────
 *
 * Phase 1's guards were green while real live surfaces carried a competing
 * product model, for one reason: those files were never in any guard's corpus.
 * Independent review found them, not CI. That is the failure mode this module
 * addresses, and it is a different failure from a rule being too weak — a rule
 * can only be wrong about a file it reads.
 *
 * Before this, `retired-vocabulary`, `score-hierarchy` and `commercial-model`
 * each maintained their own inline list. Three lists drift, and the gap is
 * always found later than it was made — the same argument that produced
 * lib/report/offer.ts and lib/nav.ts. One list, read by all three, so adding a
 * surface protects it everywhere at once and an omission is visible here rather
 * than silent everywhere.
 *
 * ── What this deliberately is NOT ───────────────────────────────────────────
 *
 * Not a tree walker. An automatic scanner would sweep in Family, Mind, the
 * book, historical demos and the retired report renderers, and the honest
 * response to the resulting failures would be to weaken the rules until they
 * passed — which is how a guard becomes decoration. Naming each file means
 * every inclusion is a decision someone made and a reviewer can question.
 *
 * ── Adding a surface ────────────────────────────────────────────────────────
 *
 * If you ship a customer-visible surface on the You journey — Assessment, meal
 * analysis, the account's commercial cards, or a lifecycle email — add it to
 * the right group. `assertManifestIsReal()` fails if a path here does not
 * exist, so a rename cannot quietly empty a group.
 */
import { existsSync, readdirSync, statSync } from "node:fs"
import { join } from "node:path"

/** Every file under `dir` matching `.ts`/`.tsx`, one level, sorted. */
function filesIn(dir: string): string[] {
  if (!existsSync(dir)) return []
  return readdirSync(dir)
    .filter((f) => /\.(ts|tsx)$/.test(f) && statSync(join(dir, f)).isFile())
    .map((f) => join(dir, f))
    .sort()
}

/** Pages and components on the free Food System Assessment journey. */
export const ASSESSMENT_SURFACES = [
  "components/assessment/assessment-intro.tsx",
  "components/assessment/assessment-results.tsx",
  "components/assessment/personal-report-cta.tsx",
  "components/assessment/report-membership-cta.tsx",
  "components/assessment/paid-report-client.tsx",
  "components/assessment/share-score-card.tsx",
  "components/assessment/score-card.tsx",
  // Shared by ~20 callers; it rendered the synthetic "Top X%" badge.
  "components/assessment/score-ring.tsx",
  "components/assessment/deep/deep-assessment-client.tsx",
  // The free result's narrative, extracted out of assessment-results.tsx in
  // Phase 2C. The copy moved with it, so the corpus has to move with it too —
  // otherwise the three vocabulary guards keep reading a file the customer no
  // longer sees the words in.
  "components/assessment/result/biotics-score-reveal.tsx",
  "components/assessment/result/food-system-profile.tsx",
  "components/assessment/result/three-biotics-result.tsx",
  "components/assessment/result/food-system-pattern.tsx",
  "components/assessment/result/one-free-action.tsx",
  "components/assessment/result/contribute-opt-in.tsx",
]

/**
 * The meal-analysis path. A meal gets a Meal Biotics Score; it is never the
 * person's Biotics Score™, and it is never evidence about their health.
 */
export const MEAL_SURFACES = [
  "components/analyse/free-scan-upsell.tsx",
  "components/analyse/result-builder.tsx",
  "components/analyse/guest-scan-flow.tsx",
  "components/analyse/share-meal-card.tsx",
  "app/analyse/result/[hash]/page.tsx",
  "app/api/og/meal-scan/route.tsx",
  // The route-colocated OG image for a shared meal. Missed by the first
  // manifest and by every guard before it, which is how "GUT SCORE" survived
  // on the image a customer actually posts. A route's opengraph-image.tsx is
  // as customer-visible as its page.tsx.
  "app/analyse/result/[hash]/opengraph-image.tsx",
]

/**
 * Signed-in account surfaces that make a commercial statement.
 *
 * Both dashboards, deliberately. `live-dashboard.tsx` is the real /account;
 * `dashboard-client.tsx` renders mock data but serves /account-you, which
 * proxy.ts lists as a PUBLIC route — so it is customer-visible regardless of
 * where its numbers come from.
 */
export const ACCOUNT_SURFACES = [
  "components/account/live-dashboard.tsx",
  "components/account/dashboard-client.tsx",
  "components/account/report-bridge-card.tsx",
  "components/account/day8-challenge-card.tsx",
  // Not a component: a DATA module whose labels are rendered verbatim by the
  // dashboards (it carried the customer-facing "30-Day Trial" badge). A copy
  // source counts as a surface.
  "components/account/dashboard-client-data.ts",
  // Both render directly on /account-you and both carried the five-dimension
  // model independently of the dashboard that mounts them — which is exactly
  // why the first correction pass missed them. A component is a surface.
  "components/account/progress-chart.tsx",
  "components/account/score-progress-card.tsx",
  // The focus-label sources. Each keeps its own map keyed by the internal
  // dimension and each rendered that dimension name to the customer; they were
  // found by looking at the RENDERED page, not the source, which is the lesson.
  "components/account/welcome-screen.tsx",
  "components/account/goal-progress-card.tsx",
  "components/account/monthly-progress-card.tsx",
  "components/account/seven-day-guide.tsx",
  "components/account/upgrade-gate.tsx",
  /*
   * ── GATE 3.6: THE PRODUCERS, NOT ONLY THE MOUNTER ─────────────────
   *
   * `live-dashboard.tsx` has been first in this list from the beginning. Every
   * file BELOW was outside it — and those are the files that actually WRITE
   * the sentences live-dashboard renders: the loop's rationale, the learning
   * feed, the week story, the Inside You chapters, the body-map hotspots.
   *
   * So the guard read the importer and not the imported module, which is
   * verbatim what this file's own docblock says went wrong with
   * `biotics-prompt.ts` — the surface was listed, and the module that gave it
   * its words was not. Gate 3.6 found five live personal-Biotic claims in
   * here, including the member's three Biotic scores drawn onto a public PNG.
   *
   * A COPY SOURCE COUNTS AS A SURFACE, which this list already says of
   * `dashboard-client-data.ts`. These are the same thing, generated at runtime.
   */
  // 0R-3. `ask-twin.tsx` was in NO corpus until P0-TRUST-05 was traced — the
  // one live surface that offers the member a question to ask a model. Its
  // claim was interpolated, so the behavioural guard in
  // `agent-loop-claims.test.ts` is what actually reads it; this entry closes
  // the coverage half.
  "components/account/twin/ask-twin.tsx",
  "components/account/twin/twin-stage.tsx",
  "components/account/twin/twin-sections.tsx",
  "components/account/twin/share-twin.tsx",
  "components/account/twin/meal-reveal.tsx",
  "components/agent-loop/NextBestActionCard.tsx",
  "components/agent-loop/BioticsProgressPanel.tsx",
]

/**
 * Lifecycle email templates on the You journey.
 *
 * Absent on purpose: the Mind and Family variants inside results-email.ts are
 * reached through `variant !== "gut"` branches whose product naming is
 * deferred, and results-email.ts is listed here for its gut branch only — its
 * two legacy strings are carried as named exemptions in the guard rather than
 * by narrowing a rule.
 */
export const EMAIL_SURFACES = [
  "lib/email/results-email.ts",
  "lib/email/sequence-email.ts",
  "lib/email/trial-winback-email.ts",
  "lib/email/paid-report-email.ts",
  "lib/email/meal-analysis-email.ts",
  // In NO guard's corpus until Tranche 2C, while carrying the same "Live
  // Foods" pillar label the other three did. A group is only as good as its
  // membership.
  "lib/email/nudge-email.ts",
  "app/api/email/nurture/route.ts",
]

/**
 * Publicly reachable sample reports.
 *
 * `/report` and `/report-you` explain the product to someone deciding whether
 * to buy it, so their vocabulary is current-product vocabulary. `/report`'s
 * shared metadata also covers Family and Mind, whose naming is deferred — it is
 * corrected to neutral wording rather than to a You-specific name, so including
 * it here forces no Family/Mind decision.
 *
 * `components/report/demo-report.tsx` is deliberately ABSENT: it is the shared
 * renderer for all three sample reports, and guarding it would mean either
 * making Family/Mind naming decisions or weakening a rule to accommodate them.
 * The You data lives in app/report-you/page.tsx, which is guarded.
 */
export const SAMPLE_REPORT_SURFACES = [
  "app/report/page.tsx",
  "app/report-you/page.tsx",
]

/** Public marketing and commercial pages. */
/**
 * The Report family — Experience 0R-1.
 *
 * ══ WHY THIS LIST DID NOT EXIST ═════════════════════════════════════════════
 *
 * `P0-GUARD-02`. Not one report generator or component had ever been in any
 * claims corpus, and `/assessment/report` is `V1_CORE_ROUTES:94` — the live €49
 * product. So the one Report EatoBiotics actually sells was the least guarded
 * surface in the repository.
 *
 * This is the THIRD instance of the same enforcement failure: Account was
 * outside the scan (`P0-GUARD-01`), Assessment was outside the scan, Report was
 * outside the scan. 0R-2's derivation exists so this is the last list anyone
 * has to remember to write.
 *
 * ══ GENERATORS AND COMPONENTS, DELIBERATELY ═════════════════════════════════
 *
 * `build-food-system-report.ts` composes the sentence; `food-system-section.tsx`
 * renders it. Gate 3.6 learned this the hard way — the guard read the importer
 * and not the module that gave it its words. A COPY SOURCE COUNTS AS A SURFACE.
 */
export const REPORT_SURFACES = [
  // The generators. `build-food-system-report.ts:457-469` composes
  // `dominantPattern`, which is `P0-SCIENCE-06` — a personal Biotic ranking on
  // the money path.
  "lib/report/build-food-system-report.ts",
  "lib/report/subscores.ts",
  "lib/report/framing.ts",
  "lib/report/addon-lens.ts",
  // "what a paying customer actually receives" when generation fails.
  "lib/fallback-paid-report.ts",
  "lib/assessment-report.ts",
  // The renderers.
  "components/report/food-system-section.tsx",
  "components/report/demo-report.tsx",
  "components/assessment/full-report-client.tsx",
] as const

export const MARKETING_SURFACES = [
  "app/page.tsx",
  // The holding page — the ONLY page a visitor sees while the password gate is
  // on, and until Step 7B the only customer-facing surface no guard was
  // reading. It linked to /waitlist ("See what's coming — Book, App & Course")
  // and /waitlist sold "three launches", a pre-order price and waitlist-only
  // early-bird pricing, none of which EatoBiotics has ever sold under the V1
  // commercial model. That page is refused now; this one is guarded, which is
  // the half that stops it happening again.
  "app/enter/page.tsx",
  "app/enter/waitlist-hero.tsx",
  ...filesIn("components/waitlist"),
  "components/home/membership-teaser.tsx",
  "components/home/feed-seed-heal.tsx",
  // The framework cards the holding page and /c/[country] actually render.
  // app/enter/page.tsx joined this list in Step 7B, but the sections it renders
  // did not, so the three vocabulary guards were reading a page wrapper while
  // the copy on it stayed unguarded — the same shape as the gap that list was
  // added to close.
  "components/home/the-framework.tsx",
  // The four-step explainer, on the homepage AND the holding page. It shipped
  // "See your Food System Score instantly." — a banned term, on the only page a
  // visitor can currently reach — and no guard was reading it. Same gap as
  // the-framework.tsx above, found the same way: by looking, not by CI.
  "components/home/how-it-works.tsx",
  "app/start/page.tsx",
  ...filesIn("components/start"),
  "app/pricing/page.tsx",
  "app/pricing/pricing-client.tsx",
  "app/method/page.tsx",
  "app/share/share-client.tsx",
  "lib/nav.ts",
  "app/api/checkout/route.ts",
  "app/api/score-card/route.tsx",
  "app/api/og/score-card/route.tsx",
  // Person-level progress share card, generated from the account dashboard.
  "app/api/og/progress/route.tsx",
  // Guarded, not rewritten: PR #126 would reintroduce Heal, Food System Score
  // and Feed/Seed/Regenerate-as-scores here.
  "app/roadmap/page.tsx",
]

/**
 * Live system prompts. Judged separately — an instruction is not page copy.
 *
 * Three were missing until Tranche 2B, and the omission had teeth: a prompt
 * sentence is regenerated into many customer-facing forms, in wording nobody
 * reviews. `app/api/eatobiotic/route.ts` WAS listed and carried no claim of
 * its own, because the claim lived in `lib/biotics-prompt.ts` — which was not
 * listed. A guard reading the importer and not the imported module is the same
 * gap `the-framework.tsx` and `how-it-works.tsx` fell through.
 */
export const AI_PROMPT_SURFACES = [
  "app/api/consult/route.ts",
  "app/api/demo/consult/route.ts",
  "app/api/eatobiotic/route.ts",
  "app/api/report-chat/route.ts",
  "app/api/food-intelligence/route.ts",
  // The shared classifier and framework text behind /api/analyse,
  // /api/analyse/stream, /api/analyse-plate, /api/create-plate and
  // /api/eatobiotic — the prompt that actually assigns a Meal Biotics Score.
  "lib/biotics-prompt.ts",
  /*
   * Gate 3.7. Behind /account/twin, which V1 refuses — listed anyway, because a
   * prompt is where a removed claim waits patiently for the route to come back.
   * Its system prompt told the model the member's "weakest biotic" and asked it
   * for "what it feeds", months after every page had lost both.
   */
  "app/api/menu-scan/route.ts",
]

/** Everything a customer can read, by group. */
/**
 * React Native companion — named list, not a tree walker, for the same
 * reason every other group here is named: an automatic scanner would sweep
 * in Expo boilerplate, assets typings and a future design-kit mock, and the
 * honest response would be to weaken the rules.
 *
 * `assertManifestIsReal()` / `manifestProblems()` fail if a path here does
 * not exist. Add a file the moment it can speak to a member.
 */
export const MOBILE_SURFACES = [
  "apps/mobile/App.tsx",
  "apps/mobile/src/config.ts",
]

export const CUSTOMER_SURFACES: Record<string, string[]> = {
  assessment: ASSESSMENT_SURFACES,
  meal: MEAL_SURFACES,
  account: ACCOUNT_SURFACES,
  email: EMAIL_SURFACES,
  marketing: MARKETING_SURFACES,
  sampleReports: SAMPLE_REPORT_SURFACES,
  mobile: MOBILE_SURFACES,
}

/** Flat list of customer-copy surfaces. AI prompts are NOT included. */
export function allCustomerSurfaces(): string[] {
  return Object.values(CUSTOMER_SURFACES).flat().filter((p) => existsSync(p))
}

/**
 * Every named path must exist, and no group may be empty.
 *
 * Without this the manifest degrades exactly the way the old inline lists did:
 * a file is renamed, its entry silently matches nothing, and the guard reports
 * green over a surface nobody is reading any more.
 */
export function manifestProblems(): string[] {
  const out: string[] = []
  for (const [group, files] of Object.entries({ ...CUSTOMER_SURFACES, aiPrompts: AI_PROMPT_SURFACES })) {
    if (files.length === 0) out.push(`${group}: group is empty`)
    for (const f of files) if (!existsSync(f)) out.push(`${group}: missing ${f}`)
  }
  return out
}
