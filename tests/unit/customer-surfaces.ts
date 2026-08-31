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
export const MARKETING_SURFACES = [
  "app/page.tsx",
  "components/home/membership-teaser.tsx",
  "components/home/feed-seed-heal.tsx",
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

/** Live system prompts. Judged separately — an instruction is not page copy. */
export const AI_PROMPT_SURFACES = [
  "app/api/consult/route.ts",
  "app/api/demo/consult/route.ts",
  "app/api/eatobiotic/route.ts",
]

/** Everything a customer can read, by group. */
export const CUSTOMER_SURFACES: Record<string, string[]> = {
  assessment: ASSESSMENT_SURFACES,
  meal: MEAL_SURFACES,
  account: ACCOUNT_SURFACES,
  email: EMAIL_SURFACES,
  marketing: MARKETING_SURFACES,
  sampleReports: SAMPLE_REPORT_SURFACES,
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
