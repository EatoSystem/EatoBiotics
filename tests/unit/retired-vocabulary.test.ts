/**
 * Retired vocabulary must not come back to the live journey.
 *
 * Phase 0 removed a set of names the product no longer uses: the live €49
 * report called itself "Full Report", its delivery email labelled the score
 * panel "Feed · Seed · Regenerate", the report's closing CTA sold a retired
 * Grow/Restore/Transform ladder, and the paid page's own title said "Deep
 * Assessment". None of that was caught by anything, because the existing claims
 * corpus polices health CLAIMS — whether a sentence overstates what food does —
 * and says nothing about which product names are current.
 *
 * ── Why this is scoped rather than a tree-wide grep ──────────────────────────
 *
 * Every retired name is still a legitimate INTERNAL value. `PaidReportTier` is
 * still `starter | full | premium`; stored `report_json` blobs still carry
 * `heal`; `membership_tier` still accepts grow/restore/transform for existing
 * subscribers; Stripe price mappings still reference them. A guard that failed
 * on those would be demanding a data migration to satisfy a naming rule, and
 * the honest response would be to delete the guard.
 *
 * So this reads only the surfaces a customer actually sees on the Snapshot →
 * Consultation → Report journey, and only their extracted COPY — `copyOf`
 * strips imports, comments, class names and method calls, so a type union or a
 * compatibility map is invisible to it while a rendered string is not.
 */
import { describe, it, expect } from "vitest"
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs"
import { join } from "node:path"
import { copyOf } from "./helpers/marketing-language"

/**
 * The customer-facing journey. Demo and preview routes are excluded on purpose:
 * `/assessment/preview` is an internal index of static demos, and the demo
 * renderers describe reports delivered under the old model — restating those in
 * today's vocabulary would misdescribe what those buyers actually received.
 */
function journeySurfaces(): string[] {
  const out: string[] = []
  const walk = (dir: string, pageOnly: boolean) => {
    if (!existsSync(dir)) return
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry)
      if (statSync(full).isDirectory()) {
        if (entry === "demo" || entry === "preview") continue
        walk(full, pageOnly)
        continue
      }
      if (pageOnly && entry !== "page.tsx") continue
      if (!/\.(ts|tsx)$/.test(entry)) continue
      out.push(full)
    }
  }
  walk("app/assessment", true)
  walk("components/assessment", false)
  return [
    ...out.filter((p) => !/(full-report-client|report-starter|paid-report-client|demo-client)\.tsx$/.test(p)),
    // Named individually because they are the live paid artefact and its
    // delivery email — the two surfaces that carried the worst of this.
    "components/assessment/paid-report-client.tsx",
    "lib/email/paid-report-email.ts",
    "app/pricing/pricing-client.tsx",
    "lib/report/offer.ts",
    // ── Phase 1: the rest of the current-offer corpus ──────────────────
    // A NAMED list, not a tree walk. The point of naming each file is that
    // adding one is a decision someone made, and the reason is reviewable.
    // Deliberately absent: Family and Mind surfaces (their product naming is
    // deferred and a rule here would demand names nobody has approved),
    // /about's founder practice, the book, historical storage, and the demo
    // renderers that describe reports delivered under the old model.
    "app/page.tsx",
    "components/home/membership-teaser.tsx",
    "components/home/feed-seed-heal.tsx",
    "app/start/page.tsx",
    ...startFunnel(),
    "app/pricing/page.tsx",
    "app/method/page.tsx",
    "lib/nav.ts",
    "app/api/checkout/route.ts",
    "lib/email/results-email.ts",
    "lib/email/sequence-email.ts",
    "lib/email/trial-winback-email.ts",
    "app/api/email/nurture/route.ts",
    "components/analyse/free-scan-upsell.tsx",
    "app/analyse/result/[hash]/page.tsx",
    // Demo-only, but they are commercial cards a person is shown and both sold
    // a retired ladder until Phase 1.
    "components/account/report-bridge-card.tsx",
    "components/account/day8-challenge-card.tsx",
    // §39: /roadmap is guarded so PR #126's vocabulary cannot land unnoticed.
    // The route itself is not rewritten in Phase 1.
    "app/roadmap/page.tsx",
  ].filter((p) => existsSync(p))
}

/** The nine /start components. One funnel, one decision. */
function startFunnel(): string[] {
  const dir = "components/start"
  if (!existsSync(dir)) return []
  return readdirSync(dir).filter((f) => /\.tsx$/.test(f)).map((f) => join(dir, f))
}

/**
 * Each rule is the CURRENT-OFFER sense of a name, not the name itself.
 * `full: "Full Report"` as a legacy tier key is fine; a heading that reads
 * "Full Report" to a buyer is not.
 */
/*
 * Case-insensitive throughout, deliberately.
 *
 * The first version of this guard was case-SENSITIVE, and it missed a live
 * defect for that reason alone: the Consultation page's own `<meta
 * description>` read "Complete your personalised deep assessment to unlock
 * your full report." Lowercase, so `/\bDeep Assessment\b/` and
 * `/\b(Full|Starter|Premium) Report\b/` both walked straight past it — on the
 * page metadata, which is what a search engine and a shared link display.
 *
 * A rule that only catches Title Case catches the heading and misses the
 * sentence, which is the half more likely to be written casually.
 */
const RETIRED: Array<[string, RegExp]> = [
  // Feed · Seed · Regenerate is the action vocabulary. It never labels a score,
  // and Regenerate is never Postbiotics renamed. `Heal` stays case-sensitive:
  // lowercase "heal" is an ordinary English verb that appears in legitimate
  // educational prose, whereas capital-H Heal is the retired pathway name.
  ["Heal or Regenerate as a pathway name", /\bHeal\b|\bRegenerates\b/],
  ["five-pillar model", /\b(five|5) pillars\b/i],
  ["retired report titles", /\b(full|starter|premium) report\b/i],
  ["Grow/Restore/Transform as a current offer", /\bstart (grow|restore|transform)\b|\b(grow|restore|transform) plan\b/i],
  ["Deep Assessment as a product title", /\bdeep assessment\b/i],
  ["diagnostic framing", /\bgut imbalance\b/i],
  ["instant delivery promise", /\binstant report\b/i],
  ["report promised before the Consultation", /\bgenerate my\b/i],
  ["a competing branded score", /\bfood system score\b/i],
  // ── Phase 1 ────────────────────────────────────────────────────────────
  // The free product is the Food System Assessment. "Snapshot" is caught only
  // in its product sense: bare "snapshot" is ordinary English ("an educational
  // snapshot of how your meals line up"), and `systemSnapshot` is a stored
  // report_json key, so a bare-word rule would demand a data migration to
  // satisfy a naming rule. The two shapes below are unambiguous.
  ["Snapshot as the free product name", /\bfood system snapshot\b|\byour snapshot\b|\bthe snapshot\b(?!\s+(of|in)\b)/i],
  // Retired plan names presented as something to buy. Narrow on purpose:
  // "Grow" is a common verb and existing subscribers' tiers are legitimate
  // internal values, so this fires on the SELL, not the word.
  ["a retired plan sold as a current offer", /\b(start|see|join|get|try|upgrade to)\s+(grow|restore|transform)\b|\b(grow|restore|transform)\s+(membership|subscription)\b/i],
  // €9.99 was the Grow price. There is no current €9.99 offer at all, so any
  // appearance on a commercial surface is a retired price being quoted.
  ["the retired €9.99 entry price", /€\s?9\.99/],
  // The 30 days are INCLUDED with a €49 purchase. Calling them a free trial
  // makes the paid thing sound free and the included thing sound conditional.
  // The internal `trial` tier is invisible to copyOf, so this only catches prose.
  ["the included 30 days called a free trial", /\bfree trial\b|\bstart your trial\b|\btrial starts\b/i],
  // Phase 6 activation semantics, promised before they exist.
  ["future 30-day activation semantics", /\b30 days start (after|when)\b|\bpractice[- ]ready\b|\breport[- ]ready\b|\bactivation window\b/i],
  // Feed/Seed/Regenerate are actions. A score is not an action.
  ["actions used as score names", /\b(feed|seed|regenerate)\s+score\b|\bscores? across feed\b|\bfeed\s*[·/]\s*seed\s*[·/]\s*regenerate\b(?=[^.]{0,40}\bscore)/i],
  // Regenerate is not Postbiotics renamed, in either direction.
  ["Regenerate equated with Postbiotics", /\bregenerate\s*(=|\u2014|-|:)\s*postbiotics\b|\bpostbiotics,?\s+(also |now )?(called|known as|renamed)\s+regenerate\b/i],
]

/**
 * Retained on purpose, each for a stated reason.
 *
 * All three are the LEGACY-tier branches of surfaces that also serve the live
 * product. Those reports were delivered under those names, and re-labelling an
 * old artefact in today's vocabulary would misdescribe what that buyer actually
 * received — which is the same dishonesty this guard exists to prevent, pointed
 * the other way.
 *
 * Kept as entries rather than by narrowing the rules: a rule narrowed to miss
 * these would also miss a genuine reintroduction on the live path.
 */
const RETAINED_FOR_LEGACY_REPORTS = [
  // The premium tier's own title, shown only when rendering a premium report
  // that was sold under it. `full` was renamed to "Personal Food System
  // Report"; premium keeps its name because it is still a distinct artefact.
  'components/assessment/paid-report-client.tsx → retired report titles: "Premium Report"',
  // The email's legacy branches: `tier !== "personal"` renders the five-pillar
  // panel and the old tier label, for re-sends of reports already delivered.
  'lib/email/paid-report-email.ts → five-pillar model: "5 Pillars"',
  'lib/email/paid-report-email.ts → retired report titles: "Full Report"',
  // The results email's NON-GUT branches. Both sit behind `variant !== "gut"`
  // and serve the Mind and Family assessments, whose product naming is
  // explicitly deferred out of Phase 1 (§41). Rewriting them here would invent
  // names nobody has approved, so the You-journey branch was corrected and
  // these were left exactly as they were — deliberately, and recorded here
  // rather than by narrowing the rules.
  'lib/email/results-email.ts → five-pillar model: "5 Pillars"',
  'lib/email/results-email.ts → retired report titles: "Full Report"',
]

function retiredHits(): string[] {
  const hits: string[] = []
  for (const file of journeySurfaces()) {
    const copy = copyOf(readFileSync(file, "utf8"))
    for (const [name, rule] of RETIRED) {
      const hit = copy.match(rule)
      if (hit) hits.push(`${file} → ${name}: "${hit[0]}"`)
    }
  }
  return hits.sort()
}

describe("the live journey uses only current vocabulary", () => {
  it("carries none of the retired names", () => {
    const offenders = retiredHits().filter((h) => !RETAINED_FOR_LEGACY_REPORTS.includes(h))
    expect(offenders, "retired vocabulary on a live customer surface").toEqual([])
  })

  it("keeps the retained list honest — every entry still matches", () => {
    // The other direction. Without this, a fixed line would leave a stale entry
    // sitting here looking like coverage, and the next real reintroduction on
    // that file could land inside an exemption nobody re-checked.
    const hits = new Set(retiredHits())
    const stale = RETAINED_FOR_LEGACY_REPORTS.filter((e) => !hits.has(e))
    expect(stale, "retained entries that no longer match").toEqual([])
  })

  it("is reading real surfaces, and each rule matches its real shape", () => {
    // Both halves matter. A walk over the wrong roots passes by finding
    // nothing; a rule written against a shape the code never uses does the
    // same. These are the exact strings Phase 0 removed.
    const surfaces = journeySurfaces()
    expect(surfaces.length).toBeGreaterThan(10)
    expect(surfaces).toContain("components/assessment/paid-report-client.tsx")
    expect(surfaces).toContain("lib/email/paid-report-email.ts")

    const probes: Array<[string, string]> = [
      ["Regenerates your gut", "Heal or Regenerate as a pathway name"],
      ["Your 5 Pillars at a Glance", "five-pillar model"],
      ["Your Full Report is ready", "retired report titles"],
      ["Start Restore today", "Grow/Restore/Transform as a current offer"],
      ["Your Deep Assessment", "Deep Assessment as a product title"],
      ["signs of gut imbalance", "diagnostic framing"],
      ["get your instant report", "instant delivery promise"],
      ["Generate My Food System Report", "report promised before the Consultation"],
      ["Your Food System Score is 72", "a competing branded score"],
    ]
    for (const [probe, ruleName] of probes) {
      const rule = RETIRED.find(([n]) => n === ruleName)![1]
      expect(probe, `${ruleName} does not match its own example`).toMatch(rule)
    }
  })

  it("catches retired names in any case, not only Title Case", () => {
    // The gap that let a live defect through. These rules were case-sensitive,
    // so the Consultation page's own meta description — "Complete your
    // personalised deep assessment to unlock your full report." — matched
    // nothing, on the text a search result and a shared link display.
    const titles = RETIRED.find(([n]) => n === "retired report titles")![1]
    const deep = RETIRED.find(([n]) => n === "Deep Assessment as a product title")![1]

    for (const variant of ["full report", "Full Report", "FULL REPORT", "Full report"]) {
      expect(variant, `${variant} must be caught`).toMatch(titles)
    }
    for (const variant of ["deep assessment", "Deep Assessment", "DEEP ASSESSMENT", "Deep assessment"]) {
      expect(variant, `${variant} must be caught`).toMatch(deep)
    }
  })

  it("would have failed on the exact metadata defect this pass fixed", () => {
    // The verbatim string that shipped, proving the strengthened rules catch it
    // rather than merely being more permissive in principle.
    const SHIPPED = "Complete your personalised deep assessment to unlock your full report."
    const caught = RETIRED.filter(([, rule]) => rule.test(SHIPPED)).map(([name]) => name)
    expect(caught.sort()).toEqual([
      "Deep Assessment as a product title",
      "retired report titles",
    ])

    // And the replacement is clean under every rule.
    const NOW =
      "A guided digital process that produces your Personal Food System Report. " +
      "Educational and non-diagnostic."
    for (const [name, rule] of RETIRED) {
      expect(NOW, `${name} fired on the corrected metadata`).not.toMatch(rule)
    }
  })

  it("does not fire on internal compatibility values", () => {
    // The property that keeps this guard alive. None of these is customer copy,
    // and demanding their removal would mean migrating stored data to satisfy a
    // naming rule.
    for (const internal of [
      'const TIER_LABEL: Record<"starter" | "full" | "premium", string>',
      'type PaidReportTier = "personal" | "starter" | "full" | "premium"',
      'const sub = { prebiotics: 1, feed: 1, heal: 1 }',
      'PAID_TIERS = ["trial", "member", "grow", "restore", "transform"]',
      '// the Heal pillar was renamed; stored rows still say heal',
    ]) {
      const copy = copyOf(internal)
      for (const [name, rule] of RETIRED) {
        expect(copy, `${name} fired on internal value: ${internal}`).not.toMatch(rule)
      }
    }
  })
})
