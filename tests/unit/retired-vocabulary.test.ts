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
  // The purchased 30 days, badged as a trial. Specific on purpose — the word
  // "trial" alone is a legitimate internal tier id that appears in type
  // unions and DB values throughout.
  ["included access badged as a trial", /\b\d+[- ]day trial\b|\bfree trial\b/i],
  [
    "a vague comparative claim about other people",
    /\b(higher|better|healthier)\s+than\s+most\s+(people|users|members)\b|\babove\s+average\s+(gut|score|for)\b/i,
  ],
  // A rank quantified in WORDS rather than digits. The first draft of the
  // numeric rule missed "places you in the top third of people who take this
  // assessment" on the public sample report — same claim, no digit in it.
  [
    "a word-quantified population rank",
    /\btop\s+(third|half|quarter|tenth|fifth)\b|\b(bottom|lower)\s+(third|half|quarter)\s+of\s+(people|users)\b/i,
  ],
  // The free product is the Food System Assessment. "EatoBiotics Assessment"
  // is a fourth name for it, and a customer meeting two of them cannot tell
  // whether they are the same thing.
  ["a competing name for the free product", /\bEatoBiotics Assessment\b/],
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

describe("the account dashboards score by biotic, not by historical dimension", () => {
  /*
   * The defect: /account-you rendered scored bars for Plant Diversity,
   * Feeding, Live Foods, Consistency and Feeling — the stored sub_scores keys
   * — as the customer's scoring model. A customer's Biotics Score™ breaks into
   * three biotics.
   *
   * This is a TEST, not a vocabulary rule, and that is the point. A rule
   * matching "plant diversity" fires on ten legitimate surfaces — "you eat a
   * good variety of plant foods", "your plant diversity has been strong" —
   * which is ordinary biology, not a score model. What makes it a MODEL is the
   * five appearing together as a scored set. So the check is: how many of the
   * five does this file render, and does it derive three biotics instead.
   *
   * The dimensions may still drive focus logic, prompts and recommendations —
   * `deriveReportPillars` is exactly that, deriving the three from the five.
   */
  const DIMENSIONS = ["Plant Diversity", "Feeding", "Live Foods", "Consistency", "Feeling"]
  const DASHBOARDS = [
    "components/account/dashboard-client.tsx",
    "components/account/live-dashboard.tsx",
  ].filter(existsSync)

  it.each(DASHBOARDS)("%s does not present the five dimensions as a scored set", (file) => {
    const copy = copyOf(readFileSync(file, "utf8"))
    const present = DIMENSIONS.filter((d) => new RegExp(`\\b${d}\\b`, "i").test(copy))
    expect(
      present.length,
      `${file} renders ${present.length} of the five historical dimensions (${present.join(", ")}) — four or more reads as the scoring model`,
    ).toBeLessThan(4)
  })

  it("derives the three biotics from the shared helper rather than a new mapping", () => {
    // deriveReportPillars already backed the paid-report card before this
    // change. Reusing it is what stops the bars and the card disagreeing.
    const src = readFileSync("components/account/dashboard-client.tsx", "utf8")
    expect(src, "the dashboard must derive biotics via the shared helper").toMatch(
      /deriveReportPillars\(/,
    )
    for (const b of ["Prebiotics", "Probiotics", "Postbiotics"]) {
      expect(readFileSync("components/account/dashboard-client-data.ts", "utf8")).toContain(b)
    }
  })
})

describe("the current framework is not sold as pillars", () => {
  /*
   * SURFACE-SPECIFIC on purpose, and that is the whole design.
   *
   * The previous pass wrote a rule matching "plant diversity" and had to throw
   * it away: it fired on ten legitimate surfaces where the phrase is biology,
   * not a score model. "pillar", "most people", "significantly" and "diversity"
   * all have honest uses elsewhere in this product, so none of them is banned
   * globally. These assertions name the file and the phrase together.
   *
   * What each caught, on the surface named:
   *   dashboard  a "Pillar Scores" heading sitting directly above cards that
   *              already rendered Prebiotics / Probiotics / Postbiotics — an
   *              earlier pass fixed the cards and left their label.
   *   gate       the Member upgrade gate selling "your weakest pillar" and
   *              "Pillar-by-pillar food protocols" — the surface that sells the
   *              dashboard kept the framework the dashboard had dropped.
   */
  const FRAMEWORK_SURFACES: Array<[string, RegExp[]]> = [
    [
      "components/account/dashboard-client.tsx",
      [/\bPillar Scores\b/],
    ],
    [
      "components/account/upgrade-gate.tsx",
      [/\bweakest pillars?\b/i, /\bpillar-by-pillar\b/i, /\bLive Foods \+ Diversity\b/i],
    ],
  ]

  it.each(FRAMEWORK_SURFACES.map(([f]) => f))("%s sells no five-dimension framing", (file) => {
    const rules = FRAMEWORK_SURFACES.find(([f]) => f === file)![1]
    const copy = copyOf(readFileSync(file, "utf8"))
    const hits = rules.map((r) => copy.match(r)?.[0]).filter(Boolean)
    expect(hits, `retired framework framing in ${file}`).toEqual([])
  })

  it("matches the shapes that actually shipped", () => {
    // A rule written against a shape the code never used passes by finding
    // nothing. These are the exact strings this pass removed.
    const [, dash] = FRAMEWORK_SURFACES[0]
    const [, gate] = FRAMEWORK_SURFACES[1]
    expect("Pillar Scores").toMatch(dash[0])
    expect("Nudges based on your weakest pillar").toMatch(gate[0])
    expect("Pillar-by-pillar food protocols").toMatch(gate[1])
    expect("This month's focus — Live Foods + Diversity").toMatch(gate[2])
    // And the words stay usable where they are honest.
    expect("deriveReportPillars derives the three").not.toMatch(dash[0])
  })
})

describe("the public sample report claims nothing about other people", () => {
  /*
   * /report-you explains the product to someone deciding whether to buy it, so
   * its claims are commercial claims. Two classes are checked, both scoped to
   * this one file so that "most people" and "significantly" stay usable
   * elsewhere:
   *
   *   population   "Most people with a Probiotics score below 50 also score low
   *                on Prebiotics" — there is no observed comparison population.
   *   magnitude    "can shift your Probiotics score significantly" — a promise
   *                about score movement with nothing behind it.
   *
   * NOT checked here, and reported for scientific review instead: claims about
   * microbiome science ("the bacteria most strongly associated with gut health
   * and mood support"). Those need evidence, not rewording.
   */
  const FILE = "app/report-you/page.tsx"
  const UNSUPPORTED: Array<[string, RegExp]> = [
    ["a population claim about other people", /\bmost people\b|\bmore common than you might think\b|\bcommonly reported\b/i],
    ["a population rank", /\btop (third|half|quarter)\b|\bhigher than \d+% of people\b/i],
    ["a promise about score movement", /\bshift your \w+ score significantly\b|\bscore significantly\b|\bsignificantly (improve|increase|raise)\b/i],
    ["a comparative-difficulty claim", /\beasiest gap\b|\bfastest (way|gap)\b/i],
  ]

  it("carries none of them", () => {
    const copy = copyOf(readFileSync(FILE, "utf8"))
    const hits = UNSUPPORTED.filter(([, r]) => r.test(copy)).map(([n]) => n)
    expect(hits, `unsupported claims on the public sample report`).toEqual([])
  })

  it("matches the shapes that actually shipped", () => {
    const probes: Array<[string, string]> = [
      ["Most people with a Probiotics score below 50 also score low on Prebiotics", "a population claim about other people"],
      ["A score of 68 places you in the top third of people who take this assessment", "a population rank"],
      ["can shift your Probiotics score significantly", "a promise about score movement"],
      ["this is the easiest gap to close", "a comparative-difficulty claim"],
      ["This pattern is more common than you might think", "a population claim about other people"],
    ]
    for (const [probe, expected] of probes) {
      const matched = UNSUPPORTED.filter(([, r]) => r.test(probe)).map(([n]) => n)
      expect(matched, `"${probe}" should trip ${expected}`).toContain(expected)
    }
  })
})

describe("the synthetic percentile module warns rather than invites", () => {
  it("carries no customer-style example and no 'accurate-feeling' framing", () => {
    // The previous pass reported this header as rewritten. It was not: the
    // script that rewrote it threw before writing, and the claim was reported
    // without re-reading the file. This test is why that cannot recur.
    const src = readFileSync("lib/percentile.ts", "utf8")
    // The two phrases may appear ONLY inside the paragraph explaining that they
    // were removed, which names itself.
    const explanation = "The header this replaces"
    const beforeExplanation = src.split(explanation)[0]
    expect(beforeExplanation, "stale framing above its own explanation").not.toMatch(
      /accurate-feeling/i,
    )
    expect(beforeExplanation).not.toMatch(/you beat \d+% of people/i)
    expect(src, "must state it is not observed data").toMatch(/not observed data|assumed distribution/i)
    expect(src, "must forbid customer display").toMatch(/never be shown to a customer/i)
    expect(src, "the label helper must stay deleted").not.toMatch(/export function getPercentileLabel/)
  })
})

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
