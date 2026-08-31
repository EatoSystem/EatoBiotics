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
import {
  allCustomerSurfaces,
  AI_PROMPT_SURFACES,
  manifestProblems,
} from "./customer-surfaces"

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
    // Everything else comes from the shared manifest — see
    // tests/unit/customer-surfaces.ts for why this stopped being an inline
    // list. The walk above stays because app/assessment and
    // components/assessment grow new files often, and a walk catches those
    // without anyone remembering; the manifest carries the named surfaces that
    // no walk would ever reach.
    ...allCustomerSurfaces(),
  ]
    .filter((p, i, a) => a.indexOf(p) === i)
    .filter((p) => existsSync(p))
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
  // "Your Three Pillars" shipped as the heading above the three-biotic
  // breakdown and no rule caught it: the five-pillar rule is about the RETIRED
  // COUNT, and this had the right count with the wrong noun. The breakdown is
  // Prebiotics · Probiotics · Postbiotics — biotics, not pillars.
  //
  // Anchored on the POSSESSIVE, and that is the whole rule. A first draft
  // matched any "three pillars" and immediately failed on /roadmap's "Three
  // pillars, one mission" — Substack, book and app, which are business strands
  // and ordinary English. "YOUR three pillars" is the customer's score
  // breakdown and nothing else.
  ["pillars as the current score model", /\byour (three|3) pillars\b/i],
  // ── Synthetic population comparison ────────────────────────────────────
  // "You scored higher than 63% of people with typical eating habits" came
  // from lib/percentile.ts — a normal CDF against an ASSUMED mean of 55 and
  // std of 17, with no observed population at any score. It read as a
  // measurement of other people and was not one.
  //
  // Matches the interpolated form too (`{percentile}%`, `${percentile}%`),
  // because the number being computed rather than typed was never what made it
  // true. Scoped to the COMPARISON shape, not to percentages: the product
  // legitimately says "up to 45 pts", "70+ is excellent", "30 plants per week",
  // and "Free · 3 minutes" — none of which claim anything about other people.
  [
    "an unsupported population comparison",
    /\b(higher|better|more)\s+than\s+(\{|\$\{|<strong>)?[\w.\s{}$<>/-]{0,24}%?\s*(<\/strong>)?\s*%?\s*of\s+(people|users|members)\b|\btop\s+(\{|\$\{|\d)[\w.\s{}$-]{0,24}%/i,
  ],
  [
    "a vague comparative claim about other people",
    /\b(higher|better|healthier)\s+than\s+most\s+(people|users|members)\b|\babove\s+average\s+(gut|score|for)\b/i,
  ],
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
  // ── Phase 1 completion pass ────────────────────────────────────────────
  // Every rule below exists because a live surface carried the shape and no
  // guard was reading that file. Independent review found them, not CI.
  //
  // A meal has a Meal Biotics Score. "Gut Score" and "Gut Health Score" are
  // retired names, and on a meal they also claim something about the person.
  ["a retired gut-score name", /\bgut (health )?score\b|\bgut health metrics\b/i],
  // A meal is not a partial version of the person's score. The Assessment
  // produces that, and this shape sold the meal as a fragment of it.
  ["a meal sold as part of the person's score", /\b(full|complete|whole) (biotics|food system) score\b/i],
  // Feed / Seed / Regenerate are actions. A number beside one makes it a score.
  // CASE-SENSITIVE and anchored to a rendered value, deliberately: `feed:` and
  // `seed:` are object keys all over this codebase (mock scores in
  // app/assessment/deep/page.tsx, the pillar maps, `{ feed, seed, heal }`
  // destructuring) and copyOf does not strip object literals. Title-case plus a
  // number or an interpolation is the shape a CUSTOMER sees; lowercase plus a
  // value is code. Matching both would have meant weakening the rule until it
  // passed, which is how a guard becomes decoration.
  ["an action used as a score label", /\b(Feed|Seed|Regenerate):\s*[{\d]/],
  // The 30 days are INCLUDED in a €49 purchase. Calling them free makes the
  // paid thing sound free and the included thing sound conditional.
  //
  // Scoped to the PURCHASED access. "Create a free account to score unlimited
  // meals" in guest-scan-flow.tsx is a genuinely free signup and a different
  // thing entirely — a rule that failed on it would be demanding a lie in the
  // opposite direction.
  ["purchased access called free", /\bfree 30[- ]day\b|\byour free (eatobiotics )?account\b/i],
  // Phase 6 has not built an activation clock; promising one describes
  // behaviour that does not exist.
  ["a 30-day clock that does not exist", /\bafter your report is ready\b|\byour 30 days (begin|start)\b/i],
  // A numeric efficacy claim needs an evidence contract. There isn't one, and
  // the honest response to that is to not make the claim.
  ["an unsupported numeric outcome claim", /\b(most|many) (members|users|people)[^.]{0,40}\bimprove\b[^.]{0,30}\d+\s*[\u2013\u2014-]\s*\d+\s*points?\b/i],
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

describe("the surface manifest is real", () => {
  it("names only files that exist, with no empty group", () => {
    // The manifest degrades exactly the way the old inline lists did if a
    // rename silently empties an entry: the guard then reports green over a
    // surface nobody reads any more.
    expect(manifestProblems(), "manifest problems").toEqual([])
  })

  it("actually widens the corpus beyond the assessment walk", () => {
    const surfaces = journeySurfaces()
    for (const f of [
      "components/analyse/result-builder.tsx",
      "components/analyse/share-meal-card.tsx",
      "components/account/live-dashboard.tsx",
      "components/account/dashboard-client.tsx",
      "lib/email/meal-analysis-email.ts",
      "app/api/og/meal-scan/route.tsx",
    ]) {
      expect(surfaces, `${f} must be in the corpus`).toContain(f)
    }
  })
})

describe("live AI instructions do not name internal dimensions as scores", () => {
  // Judged apart from page copy on purpose: a system prompt is an instruction,
  // and `copyOf` would strip the very comments that carry its intent. The
  // shape below is the one that shipped — `"Your Adding score of 38 tells
  // me..."` told the model to quote an internal sub-score key at the customer.
  const NAMED_AS_SCORE =
    /\byour (adding|diversity|feeding|feeling|consistency) score\b|\b(adding|diversity|feeding|feeling|consistency) (score|pillar) of \d/i

  it("never instructs the model to quote an internal dimension", () => {
    const offenders: string[] = []
    for (const file of AI_PROMPT_SURFACES) {
      if (!existsSync(file)) continue
      // Read raw: the instruction IS the artefact here, comments included.
      const src = readFileSync(file, "utf8")
      // The negative instruction telling the model NOT to do this is the guard
      // working, so a line that forbids the shape does not count as using it.
      for (const line of src.split("\n")) {
        if (/\bnever say\b|\bnot\s+"your\b|\bnot customer-facing\b/i.test(line)) continue
        const m = line.match(NAMED_AS_SCORE)
        if (m) offenders.push(`${file}: "${m[0]}"`)
      }
    }
    expect(offenders, "internal dimension named as a customer score").toEqual([])
  })

  it("matches the shape that actually shipped", () => {
    expect('Always reference their actual numbers: "Your Adding score of 38 tells me..."').toMatch(
      NAMED_AS_SCORE,
    )
    expect("Their weakest dimension is adding — focus advice here first.").not.toMatch(NAMED_AS_SCORE)
  })
})

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
