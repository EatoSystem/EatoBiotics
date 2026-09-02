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
const JOURNEY = readFileSync("components/assessment/journey-next-step.tsx", "utf8")
const FAMILY = readFileSync("components/family-assessment/family-assessment-results.tsx", "utf8")

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

  it("keeps every commercial surface below the free narrative", () => {
    // Phase 2C asserted this against "What your report includes", the
    // three-card brochure that sat under the CTA. Phase 2D deleted that block
    // as duplicate commercial material, so the rule now reads against what
    // remains: the €49 card is the last thing on the page that sells, and the
    // free narrative is complete before it.
    expect(copyOf(RESULTS), "the brochure must stay gone").not.toMatch(
      /What your report includes/i,
    )
    expect(at("<ThreeBioticsResult")).toBeLessThan(cta)
    expect(at("<OneFreeAction")).toBeLessThan(cta)
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

  it("distinguishes a choice on this result from a restored preference", () => {
    // choice is seeded from a PRIOR run's localStorage value — the flag is
    // set only inside handle(), so the restored state can't describe a
    // choice this render never saw made.
    expect(code(CONTRIBUTE)).toMatch(/chosenThisResult/)
    expect(code(CONTRIBUTE)).toMatch(/setChosenThisResult\(true\)/)
    // The confirmation must sit behind that flag, not render unconditionally
    // for every opted-in state.
    expect(code(CONTRIBUTE)).toMatch(/chosenThisResult\s*\?/)
  })

  it("does not claim the contribution succeeded — only that it was chosen", () => {
    // The POST is fire-and-forget with its failure swallowed (.catch(() =>
    // {})), so the component never learns whether the request arrived. A
    // failed network call must not be able to produce a success claim —
    // checked against raw source, not just comment-stripped, because this is
    // a literal customer-facing string rather than a construct name a
    // comment might legitimately mention.
    expect(CONTRIBUTE).not.toMatch(/your results were contributed/i)
    expect(code(CONTRIBUTE)).not.toMatch(/your results were contributed/i)
    expect(copyOf(CONTRIBUTE)).toMatch(/you chose to contribute this result/i)
    expect(copyOf(CONTRIBUTE)).toMatch(/You previously chose to contribute/i)
    expect(copyOf(CONTRIBUTE)).toMatch(/Nothing from this result was shared/i)
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


/* ── Phase 2D — the result ends, rather than opening a second product ───── */

/**
 * The compact branch of JourneyNextStep, sliced out of the source.
 *
 * The default branch legitimately keeps the CombinedReport link and the four
 * marketing cards — Family still renders it — so "compact does not contain X"
 * cannot be asserted against the whole file. The slice is bounded by markers
 * and floored below, so a rename that silently empties it fails loudly rather
 * than making every assertion pass on an empty string.
 */
const COMPACT_START = JOURNEY.indexOf("if (compact) {")
const DEFAULT_START = JOURNEY.indexOf("Add a deeper focus")
const COMPACT_BRANCH = JOURNEY.slice(COMPACT_START, DEFAULT_START)

describe("the You result closes instead of starting again", () => {
  it("extracts a real compact branch to assert against", () => {
    expect(COMPACT_START).toBeGreaterThan(-1)
    expect(DEFAULT_START).toBeGreaterThan(COMPACT_START)
    expect(COMPACT_BRANCH.length).toBeGreaterThan(200)
  })

  it("puts the Consultation ahead of everything that follows it", () => {
    const cta = at("── C. Single CTA")
    for (const section of [
      "── A few more ideas",
      "── F. Save results",
      "<JourneyNextStep compact />",
      "── Lottery winner",
      "── Retake + Disclaimer",
    ]) {
      const i = at(section)
      expect(i, `${section} must exist`).toBeGreaterThan(-1)
      expect(i, `${section} must come after the €49 CTA`).toBeGreaterThan(cta)
    }
  })

  it("closes on Save, then drops to the tertiary tail", () => {
    // Save is the closure moment: after the last free material, before the
    // onward links, the lottery and retake.
    expect(at("── A few more ideas")).toBeLessThan(at("── F. Save results"))
    expect(at("── F. Save results")).toBeLessThan(at("<JourneyNextStep compact />"))
    expect(at("<JourneyNextStep compact />")).toBeLessThan(at("── Lottery winner"))
    expect(at("── Lottery winner")).toBeLessThan(at("── Retake + Disclaimer"))
  })

  it("no longer renders a second brochure for the product it just sold", () => {
    // REPORT_OFFER_FEATURES inside the primary card is the description; the
    // three-card grid under it was the same pitch a second time.
    expect(copyOf(RESULTS)).not.toMatch(/What your report includes/i)
    expect(copyOf(RESULTS)).not.toMatch(/Your 30-Day Plan/i)
    expect(copyOf(RESULTS)).not.toMatch(/Your Five-Food Strategy/i)
    expect(copyOf(RESULTS)).not.toMatch(/Your 7-Day Starter Plan/i)
    // …but the primary card still describes the offer.
    expect(RESULTS).toMatch(/REPORT_OFFER_FEATURES/)
  })

  it("folds the leftover free material into one quiet cluster", () => {
    expect(copyOf(RESULTS)).toMatch(/A few more ideas/)
    expect(copyOf(RESULTS)).not.toMatch(/Your Gut Starter Pack/i)
    expect(copyOf(RESULTS)).not.toMatch(/More to try/i)
    // No second programme: the cluster claims nothing about plans or matching.
    expect(copyOf(RESULTS)).not.toMatch(/personalised picks/i)
    expect(copyOf(RESULTS)).not.toMatch(/matched to your profile/i)
  })

  it("keeps the remaining actions the result already produced", () => {
    expect(RESULTS).toMatch(/nextActions\.slice\(1\)/)
    // Quietly: the numbered brand-gradient markers are what made this read as
    // a second programme beside One thing you can try.
    expect(code(RESULTS)).not.toMatch(/brand-gradient text-sm font-bold text-white/)
  })

  it("shows three foods, with no call to action on any of them", () => {
    expect(code(RESULTS)).toMatch(/STARTER_PACK\[profile\.type\] \?\? DEFAULT_STARTER/)
    // Raw source: copyOf() strips ".word(", which would eat the slice itself.
    expect(RESULTS).toMatch(/\.slice\(0, 3\)/)
    expect(code(RESULTS)).not.toMatch(/myplate\?add=/)
    expect(copyOf(RESULTS)).not.toMatch(/Add to Plate/i)
  })

  it("keeps exactly one quiet route into the food library", () => {
    const links = code(RESULTS).match(/href="\/food"/g) ?? []
    expect(links).toHaveLength(1)
    expect(copyOf(RESULTS)).toMatch(/Browse the food library/i)
  })

  it("does not end the customer's result on the mission", () => {
    // MissionNote itself and its six other consumers are untouched — this is
    // a placement decision about the You result only.
    expect(code(RESULTS)).not.toMatch(/MissionNote/)
  })

  it("keeps the lottery conditional, its event, and its low prominence", () => {
    expect(RESULTS).toMatch(/\{winnerCode && \(/)
    expect(RESULTS).toMatch(/lottery_winner_code_copied/)
  })
})

describe("the onward journey is tertiary on You, unchanged everywhere else", () => {
  it("asks for compact mode on the You result", () => {
    expect(RESULTS).toMatch(/<JourneyNextStep compact \/>/)
  })

  it("still persists the completed foundation", () => {
    // Load-bearing side effect: compact mode renders almost nothing, but the
    // component must keep mounting or signed-in customers stop being recorded
    // as having completed their foundation.
    expect(code(JOURNEY)).toMatch(/void persist\(\)/)
    expect(code(JOURNEY)).toMatch(/useEffect\(/)
  })

  it("leaves a pending Lens on its existing prominent resume path", () => {
    // Checked before the compact branch: someone mid-journey is not the case
    // this phase quietens.
    expect(JOURNEY.indexOf("if (pendingAddon)")).toBeGreaterThan(-1)
    expect(JOURNEY.indexOf("if (pendingAddon)")).toBeLessThan(COMPACT_START)
    expect(JOURNEY).toMatch(/resumeAddonRoute/)
  })

  it("offers the four Lenses as quiet links in compact mode", () => {
    expect(COMPACT_BRANCH).toMatch(/HEALTH_SYSTEMS\[c\.key\]\.label/)
    expect(COMPACT_BRANCH).toMatch(/assessment\/add\//)
    expect(COMPACT_BRANCH).not.toMatch(/brand-gradient/)
    for (const key of ["stability", "glucose", "mind", "performance"]) {
      expect(JOURNEY, key).toMatch(new RegExp(`key: "${key}"`))
    }
  })

  it("does not offer a competing report identity in compact mode", () => {
    // /assessment/results is the free CombinedReport, not the paid Personal
    // Food System Report the customer was just offered.
    expect(COMPACT_BRANCH).not.toMatch(/View my Food System report/)
    expect(COMPACT_BRANCH).not.toMatch(/assessment\/results/)
    // The default branch keeps it — this was scoped, not deleted.
    expect(JOURNEY).toMatch(/View my Food System report/)
  })

  it("leaves every other caller on the default rendering", () => {
    expect(FAMILY).toMatch(/<JourneyNextStep \/>/)
    expect(FAMILY).not.toMatch(/<JourneyNextStep compact/)
    expect(JOURNEY).toMatch(/compact = false/)
  })
})
