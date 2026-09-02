/**
 * The free result, in the order that makes it worth having.
 *
 * Before this phase the You result read: score → weakest-pillar callout →
 * share → **€49 CTA** → what the report includes → *then* the Three Biotics.
 * The only interpretation ahead of the sell was a callout that closed with
 * "This is a free insight — your full 30-day plan goes much deeper".
 *
 * So the load-bearing rule here is an ORDERING one, and it is asserted by
 * position rather than by presence: a section that exists but sits below the
 * CTA fails, which is precisely the state this phase found.
 *
 * Source-level, because the repository has no React testing library — same
 * approach as checkout-acknowledgement and assessment-questions. Where a claim
 * can be proved by running real code instead (the data invariants below), it is.
 */
import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { copyOf } from "./helpers/marketing-language"
import { BIOTIC_INTRO } from "@/lib/assessment/biotics"
import { getInsights } from "@/lib/assessment-scoring"

const RESULTS_PATH = "components/assessment/assessment-results.tsx"
const RESULTS = readFileSync(RESULTS_PATH, "utf8")
const CLIENT = readFileSync("components/assessment/assessment-client.tsx", "utf8")

const REVEAL = readFileSync("components/assessment/result/biotics-score-reveal.tsx", "utf8")
const PROFILE = readFileSync("components/assessment/result/food-system-profile.tsx", "utf8")
const BIOTICS = readFileSync("components/assessment/result/three-biotics-result.tsx", "utf8")
const PATTERN = readFileSync("components/assessment/result/food-system-pattern.tsx", "utf8")
const ACTION = readFileSync("components/assessment/result/one-free-action.tsx", "utf8")
const CONTRIBUTE = readFileSync("components/assessment/result/contribute-opt-in.tsx", "utf8")
const RING = readFileSync("components/assessment/score-ring.tsx", "utf8")
const SHARE = readFileSync("components/assessment/share-score-card.tsx", "utf8")

/**
 * Source with comments stripped, for every rule that forbids a construct BY
 * NAME.
 *
 * This file documents what it removed — getIdentityLabel, getProfile, the
 * timed advance — so a rule run against raw source fires on its own
 * explanation. That has now happened in four consecutive phases, which is
 * long past the point of treating it as a one-off: the default for a
 * negative rule is the CODE, and the commentary is not the code.
 */
const code = (src: string) => copyOf(src)

/** Every narrative surface's rendered copy, comments and classNames stripped. */
const NARRATIVE_COPY = [REVEAL, PROFILE, BIOTICS, PATTERN, ACTION].map(copyOf).join(" ")

/**
 * The Share surface's own copy, kept separate from NARRATIVE_COPY rather than
 * folded in: it isn't part of the score→profile→Biotics→pattern→action
 * sequence §12 orders, it's the thing a customer sends to someone else, so it
 * gets its own identity and vocabulary checks below rather than silently
 * riding on the narrative's.
 */
const SHARE_COPY = copyOf(SHARE)

/** Where a thing sits in the composed result. -1 when absent. */
const at = (needle: string) => RESULTS.indexOf(needle)

/* ── §12 Free value before commercial value ─────────────────────────────── */

describe("the free result stands on its own, before anything is sold", () => {
  const cta = at("── C. Single CTA")
  const reportFeatures = at("── D. What the report includes")

  it("renders the whole free narrative before the Consultation block", () => {
    expect(cta, "the €49 block must still exist").toBeGreaterThan(-1)
    for (const section of [
      "<BioticsScoreReveal",
      "<FoodSystemProfile",
      "<ThreeBioticsResult",
      "<FoodSystemPattern",
      "<OneFreeAction",
    ]) {
      const i = at(section)
      expect(i, `${section} must be rendered`).toBeGreaterThan(-1)
      expect(i, `${section} must come before the €49 CTA`).toBeLessThan(cta)
    }
  })

  it("renders the Three Biotics before the report-features block too", () => {
    // Both used to sit above it. Listing what the paid report contains is a
    // sales surface, not free value.
    expect(at("<ThreeBioticsResult")).toBeLessThan(reportFeatures)
    expect(at("<OneFreeAction")).toBeLessThan(reportFeatures)
  })

  it("keeps the narrative in its intended order", () => {
    const order = [
      at("<BioticsScoreReveal"),
      at("<FoodSystemProfile"),
      at("<ThreeBioticsResult"),
      at("<FoodSystemPattern"),
      at("<OneFreeAction"),
    ]
    expect(order).toEqual([...order].sort((a, b) => a - b))
  })

  it("does not advertise the paid plan inside the free insight", () => {
    expect(code(RESULTS)).not.toMatch(/your full 30-day plan goes much deeper/i)
    expect(NARRATIVE_COPY).not.toMatch(/goes much deeper/i)
  })
})

/* ── §3 The score, and what it is not ───────────────────────────────────── */

describe("the Biotics Score is the result, and claims no more than it is", () => {
  it("is the primary, named result", () => {
    expect(copyOf(REVEAL)).toMatch(/Your Biotics Score™/)
  })

  it("says where the number came from", () => {
    expect(copyOf(REVEAL)).toMatch(/from your answers|Calculated from your answers/i)
  })

  it("denies being a lab test or a ranking", () => {
    expect(copyOf(REVEAL)).toMatch(/not a lab test/i)
    expect(copyOf(REVEAL)).toMatch(/not a ranking/i)
  })

  it("shows no population comparison anywhere in the narrative", () => {
    for (const rule of [
      /percentile/i,
      /top \d+%/i,
      /higher than \d+%/i,
      /above average/i,
      /better than .{0,20}people/i,
    ]) {
      expect(NARRATIVE_COPY, String(rule)).not.toMatch(rule)
    }
  })

  it("carries no competing person-level score name", () => {
    for (const rule of [/\bGut Score\b/, /\bGut Health Score\b/, /\bFood System Score\b/, /\bEatoBiotics Score\b/]) {
      expect(NARRATIVE_COPY, String(rule)).not.toMatch(rule)
    }
  })

  it("never labels a score with an action word", () => {
    // Feed · Seed · Regenerate are how someone acts, not what they score.
    //
    // Asserted against the rendered STRINGS as well as the component source:
    // the Biotic copy lives in BIOTIC_INTRO and reaches the page through a
    // lookup, so a rule reading only the component sees `BIOTIC_INTRO[...]`
    // and never the words. Sabotage walked straight through the first
    // version of this rule.
    const rule = /\b(Feed|Seed|Regenerate)\s*(score|:)/i
    expect(NARRATIVE_COPY).not.toMatch(rule)
    for (const [biotic, copy] of Object.entries(BIOTIC_INTRO)) {
      expect(copy, biotic).not.toMatch(rule)
    }
  })
})

/* ── §6 One identity, and it is the profile ─────────────────────────────── */

describe("the profile is the only identity on the You result", () => {
  it("does not use the gamified identity labels", () => {
    // getIdentityLabel returns "Gut Athlete" / "Biotic Champion" / "Gut
    // Optimizer" — a second identity beside the canonical profile. The module
    // and its five other callers are untouched; this surface stops using it.
    expect(code(RESULTS)).not.toMatch(/getIdentityLabel/)
    expect(code(REVEAL)).not.toMatch(/getIdentityLabel/)
    expect(NARRATIVE_COPY).not.toMatch(/Gut Athlete|Gut Explorer|Biotic Champion|Gut Optimizer/)
  })

  it("uses the canonical profile and invents no thresholds", () => {
    expect(PROFILE).toMatch(/profile\.type/)
    expect(PROFILE).toMatch(/profile\.tagline/)
    expect(code(PROFILE)).not.toMatch(/overall\s*[><]=?\s*\d/)
  })

  it("frames the profile as a pattern, not a verdict", () => {
    expect(copyOf(PROFILE)).toMatch(/your answers currently suggest|answers suggest/i)
    expect(copyOf(PROFILE)).toMatch(/not a diagnosis/i)
  })
})

/* ── §6b The Share surface uses the same identity, and the true duration ── */

describe("the Share card carries the same identity as the result, honestly", () => {
  it("does not use getIdentityLabel or any gamified identity word", () => {
    // NARRATIVE_COPY (§6 above) never included this file — the identity
    // system stayed live here for the whole of Phase 2C's first pass, found
    // by an independent checkpoint review after that PR was already open.
    expect(code(SHARE)).not.toMatch(/getIdentityLabel/)
    expect(SHARE_COPY).not.toMatch(
      /Gut Athlete|Gut Explorer|Biotic Champion|Gut Optimizer|Food Strategist|Plant Builder/,
    )
  })

  it("uses the canonical profile as the shared identity", () => {
    expect(SHARE).toMatch(/profile\.type/)
  })

  it("names the product and the real duration, not the retired copy", () => {
    expect(SHARE_COPY).not.toMatch(/gut health baseline/i)
    expect(SHARE_COPY).toMatch(/about 5 minutes/i)
    expect(SHARE_COPY).not.toMatch(/\b(only|just)?\s*2 minutes\b/i)
  })

  it("shows no visible ranking or percentile language", () => {
    // percentile itself stays as a query-string parameter for
    // /api/og/score-card's existing contract (Phase 2G retires it) — this
    // checks the customer-visible sentences, not that bare identifier.
    for (const rule of [/higher than \d+%/i, /top \d+ ?% of people/i, /\bpercentile\b.{0,20}(rank|compare|people)/i]) {
      expect(SHARE_COPY, String(rule)).not.toMatch(rule)
    }
  })
})

/* ── §8 The three Biotics, and the Postbiotics boundary ─────────────────── */

describe("each Biotic arrives with its meaning and its score", () => {
  it("reuses the canonical meanings rather than restating them", () => {
    expect(BIOTICS).toMatch(/BIOTIC_INTRO/)
  })

  it("ties every score to a name rather than to a colour", () => {
    expect(BIOTICS).toMatch(/\{insight\.label\}: \{insight\.score\} out of 100/)
  })

  it("claims no measurement the Assessment cannot make", () => {
    const forbidden =
      /metabolite|short-chain|SCFA|microbial (product|abundance)|biomarker|microbiome composition|clinical|laborator/i
    expect(copyOf(BIOTICS), "section copy").not.toMatch(forbidden)
    expect(BIOTIC_INTRO.Postbiotics, "the shared Postbiotics line").not.toMatch(forbidden)
    expect(BIOTIC_INTRO.Postbiotics).toMatch(/appears to respond/i)
  })
})

/* ── §10 Pattern, without judgement ─────────────────────────────────────── */

describe("the pattern names a place to explore, not a failure", () => {
  it("reuses the existing weakest-first ordering", () => {
    expect(PATTERN).toMatch(/insights\[0\]/)
    expect(PATTERN).toMatch(/insights\[insights\.length - 1\]/)
  })

  it("uses no judgemental or diagnostic framing", () => {
    for (const rule of [
      /weakest/i,
      /failing/i,
      /deficien/i,
      /problem area/i,
      /\bpoor\b/i,
      /unhealthy/i,
    ]) {
      expect(copyOf(PATTERN), String(rule)).not.toMatch(rule)
    }
    expect(copyOf(PATTERN)).toMatch(/Appears strongest/)
    expect(copyOf(PATTERN)).toMatch(/Most worth exploring/)
  })

  it("claims no stand-out when the three scores are equal", () => {
    // An all-zero sheet is a real result — it is the floor case in the
    // methodology freeze — and it used to render a card headed "Appears
    // strongest" above text calling that same Biotic the thinner part.
    expect(code(PATTERN)).toMatch(/focus\.score === strongest\.score/)
    expect(copyOf(PATTERN)).toMatch(/All three sit level/)
    expect(copyOf(PATTERN)).toMatch(/came out at the same score/)
  })

  it("decides that by the scores, not by a tolerance somebody picked", () => {
    expect(code(PATTERN)).not.toMatch(/Math\.abs/)
    expect(code(PATTERN)).not.toMatch(/<\s*\d+\s*(\)|&&)/)
  })

  it("can produce a weakest pillar with no opportunity to explore", () => {
    // Real code, not source pattern: getInsights() sets `opportunity` only
    // below its own strength threshold (65), independently per pillar — so a
    // result where all three are high but unequal (70/75/90) leaves the
    // weakest of the three with a `strength` and no `opportunity`. This is
    // the exact shape "Most worth exploring" used to mislabel.
    const insights = getInsights({ prebiotics: 70, probiotics: 75, postbiotics: 90 })
    expect(insights[0].opportunity).toBeUndefined()
    expect(insights[0].strength).toBeDefined()
  })

  it("does not label a strength as something to explore", () => {
    // The card only renders when the weakest pillar actually has an
    // opportunity — otherwise the fallback used to show strength copy under a
    // heading calling it something to explore.
    expect(code(PATTERN)).toMatch(/!sameOne\s*&&\s*!!focus\.opportunity/)
    expect(code(PATTERN)).not.toMatch(/focus\.opportunity\s*\?\?\s*focus\.strength/)
    expect(code(PATTERN)).toMatch(/showExploring\s*&&/)
  })
})

/* ── §11 One free action, promising nothing ─────────────────────────────── */

describe("the free action is useful and promises nothing", () => {
  it("appears before the commercial block", () => {
    expect(at("<OneFreeAction")).toBeLessThan(at("── C. Single CTA"))
  })

  it("comes from the result's own actions", () => {
    expect(RESULTS).toMatch(/<OneFreeAction action=\{nextActions\[0\]\}/)
  })

  it("makes no score-improvement or timeframe promise", () => {
    for (const rule of [
      /improve your score/i,
      /increase your score/i,
      /raise your score/i,
      /fix your gut/i,
      /heal your microbiome/i,
      /in \d+ days/i,
    ]) {
      expect(copyOf(ACTION), String(rule)).not.toMatch(rule)
    }
  })

  it("no longer promises the starter foods will improve a score", () => {
    expect(copyOf(RESULTS)).not.toMatch(/start improving your score/i)
  })
})

/* ── §15 The optional ask, after the result ─────────────────────────────── */

describe("the optional contribution no longer gates the result", () => {
  it("is not a view the You journey passes through", () => {
    expect(code(CLIENT)).not.toMatch(/view === "privacy"/)
    expect(code(CLIENT)).not.toMatch(/<PrivacyOptIn/)
    // Also the state that would route there — the branch and the transition
    // are two separate things, and only forbidding the branch left the
    // transition free to come back on its own.
    expect(code(CLIENT)).not.toMatch(/view:\s*"privacy"/)
  })

  it("sits after the whole free narrative", () => {
    const contribute = at("<ContributeOptIn")
    expect(contribute).toBeGreaterThan(at("<OneFreeAction"))
  })

  it("preselects nothing and keeps declining easy", () => {
    expect(CONTRIBUTE).toMatch(/useState<"opted-in" \| "opted-out" \| null>/)
    expect(copyOf(CONTRIBUTE)).toMatch(/Not now/)
    expect(copyOf(CONTRIBUTE)).toMatch(/[Oo]ptional/)
  })

  it("does not touch the required health-data consent", () => {
    // Different statement, different record, different moment.
    expect(code(CONTRIBUTE)).not.toMatch(/HEALTH_CONSENT|healthDataConsent/)
  })

  it("does not overclaim anonymity /api/contribute cannot back up", () => {
    // The route stores `country` (from eb_country) alongside the scores —
    // not a name or email, but not "no identifier of any kind" either.
    expect(copyOf(CONTRIBUTE)).not.toMatch(/no identifier of any kind/i)
    expect(copyOf(CONTRIBUTE)).not.toMatch(/completely anonymous/i)
    expect(copyOf(CONTRIBUTE)).toMatch(/country/i)
    expect(copyOf(CONTRIBUTE)).toMatch(/name and email.{0,20}not/i)
  })

  it("does not claim this result was contributed unless it actually POSTed", () => {
    // choice is seeded from a PRIOR run's localStorage value — the fix is a
    // flag set only inside handle(), so the restored state can't describe a
    // request this render never made.
    expect(code(CONTRIBUTE)).toMatch(/justPosted/)
    expect(code(CONTRIBUTE)).toMatch(/setJustPosted\(true\)/)
    // The claim must sit behind that flag, not render unconditionally for
    // every opted-in state.
    expect(code(CONTRIBUTE)).toMatch(/justPosted\s*\?/)
  })

  it("sends no payload field the endpoint never reads", () => {
    // /api/contribute destructures only { overall, subScores, profile }.
    expect(code(CONTRIBUTE)).not.toMatch(/completedAt/)
  })
})

/* ── §19 No wizard ──────────────────────────────────────────────────────── */

describe("the result is one scrollable page", () => {
  it("adds no stage machine and no new persisted step", () => {
    for (const rule of [/resultMoment/, /resultStage/, /setStage\(/, /currentMoment/]) {
      expect(code(RESULTS), String(rule)).not.toMatch(rule)
      expect(code(CLIENT), String(rule)).not.toMatch(rule)
    }
  })
})

/* ── §5 Motion ──────────────────────────────────────────────────────────── */

describe("nobody has to wait for an animation to read their score", () => {
  it("gates both animations on the motion preference", () => {
    expect(REVEAL).toMatch(/usePrefersReducedMotion/)
    expect(RING).toMatch(/usePrefersReducedMotion/)
    expect(RING).toMatch(/if \(reducedMotion\)/)
  })

  it("exposes the final score immediately, whatever the animation is doing", () => {
    // The ticking digits are hidden from assistive technology; the sr-only line
    // carries the real number from first paint.
    expect(REVEAL).toMatch(/Your Biotics Score is \{overall\} out of 100/)
    expect(REVEAL).toMatch(/aria-hidden/)
  })

  it("celebrates nothing", () => {
    expect(NARRATIVE_COPY).not.toMatch(/congratulations|confetti|unlocked|you win/i)
  })

  it("gives the page one heading descent, starting at the score", () => {
    // Found in visual validation, not by a rule: the results screen had no h1
    // at all, so its outline was ten sibling h2s and nothing naming the page.
    // The score is what the page is, so it is the h1 — and every section under
    // it stays an h2, which is what makes it a descent rather than a list.
    expect(code(REVEAL)).toMatch(/<h1[^>]*>/)
    for (const src of [PROFILE, BIOTICS, PATTERN, ACTION]) {
      expect(code(src)).not.toMatch(/<h1[^>]*>/)
      expect(code(src)).toMatch(/<h2[^>]*>/)
    }
  })
})

/* ── §24 Data invariants ────────────────────────────────────────────────── */

describe("the narrative displays the result rather than inventing one", () => {
  it("passes the canonical values straight through", () => {
    expect(RESULTS).toMatch(/<BioticsScoreReveal overall=\{overall\}/)
    expect(RESULTS).toMatch(/<FoodSystemProfile profile=\{profile\}/)
    expect(RESULTS).toMatch(/<ThreeBioticsResult insights=\{insights\}/)
    expect(RESULTS).toMatch(/<FoodSystemPattern insights=\{insights\}/)
  })

  it("duplicates no scoring in a UI component", () => {
    // A component recomputing a score is a second answer to the same question.
    for (const source of [REVEAL, PROFILE, BIOTICS, PATTERN, ACTION].map(code)) {
      expect(source).not.toMatch(/computeSubScores|computeOverall|getProfile\(/)
      expect(source).not.toMatch(/\/\s*18\s*\)|\/\s*9\s*\)/)
    }
  })

  it("hard-codes no score", () => {
    expect(code(REVEAL)).not.toMatch(/score=\{\d+\}/)
    expect(REVEAL).toMatch(/score=\{overall\}/)
  })
})

/* ── The checkout contract is not this phase's business ─────────────────── */

describe("Phase 2C leaves the paid contract alone", () => {
  it("still sends both consents and the same fields", () => {
    expect(RESULTS).toMatch(/\[HEALTH_CONSENT_FIELD\]: true/)
    expect(RESULTS).toMatch(/\[IMMEDIATE_START_FIELD\]: true/)
    expect(RESULTS).toMatch(/fetch\("\/api\/checkout"/)
  })
})
