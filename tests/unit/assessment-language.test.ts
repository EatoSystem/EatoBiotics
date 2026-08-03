import { describe, it, expect } from "vitest"

import { getProfile, getInsights, computeSubScores } from "@/lib/assessment-scoring"
import { getMindProfile, getMindInsights } from "@/lib/mind-assessment-scoring"
import { getFamilyProfile, getFamilyInsights } from "@/lib/family-assessment-scoring"
import {
  getGlucoseProfile,
  getMealTimingPattern,
  buildProtocol,
} from "@/lib/glucose-assessment-scoring"
import { readFileSync } from "node:fs"
import { join } from "node:path"

/**
 * Phase 6 — health-language guard for live assessment copy.
 *
 * This copy is not confined to the results page. `profile.description` reaches
 * the public share page (app/discover/[code]), the results email, and — via
 * app/api/submit-deep-assessment — the Claude prompt that writes the paid
 * report. `insight` copy reaches the share page, the nurture email, and the AI
 * consultant's prompt. So an overconfident sentence here does not just get read;
 * it gets used as an example of house style by two model prompts.
 *
 * The bar is the one the Phase 2 builder already holds itself to: describe the
 * ANSWERS, not the person, and never promise an outcome or a timeframe.
 */

/** Every customer-facing string the scoring module can emit, across all bands. */

/**
 * getProfile takes `overall` as a parameter, so bands are driven directly.
 * Deriving them from answers cannot reach every branch — uniform or skewed
 * answers only ever land in three of the five bands, which would have left the
 * Strong-Foundation and Developing-System copy untested while the suite looked
 * green.
 */
const BANDS = [85, 70, 55, 40, 20]
const SKEWS = ["prebiotics", "probiotics", "postbiotics"] as const

function subFor(skew: (typeof SKEWS)[number]) {
  const answers: Record<string, number> = {}
  for (let i = 1; i <= 15; i++) answers[`q${i}`] = 2
  const sub = computeSubScores(answers)
  // Push one pathway down so getWeakestPillar picks it — that is what selects
  // between the two Developing-System variants.
  return { ...sub, [skew]: Math.max(0, (sub[skew] ?? 0) - 40) }
}

function allProfiles() {
  return BANDS.flatMap((overall) => SKEWS.map((skew) => getProfile(overall, subFor(skew))))
}

function allCopy(): string[] {
  const out: string[] = []
  for (const profile of allProfiles()) out.push(profile.tagline, profile.description)
  for (const skew of SKEWS) {
    for (const ins of getInsights(subFor(skew))) {
      if (ins.strength) out.push(ins.strength)
      if (ins.opportunity) out.push(ins.opportunity)
      out.push(ins.action)
    }
  }
  // Strength copy only appears at >= 65, so score the pathways high too.
  const strong: Record<string, number> = {}
  for (let i = 1; i <= 15; i++) strong[`q${i}`] = 4
  for (const ins of getInsights(computeSubScores(strong))) {
    if (ins.strength) out.push(ins.strength)
    if (ins.opportunity) out.push(ins.opportunity)
    out.push(ins.action)
  }
  return out
}

describe("assessment copy stays educational and non-diagnostic", () => {
  const copy = allCopy()

  it("covers every profile band, so the guard is not testing one branch", () => {
    const types = new Set(allProfiles().map((p) => p.type))
    expect([...types].sort()).toEqual([
      "Developing System",
      "Early Builder",
      "Emerging Balance",
      "Strong Foundation",
      "Thriving Food System",
    ])
    expect(copy.length).toBeGreaterThan(40)
  })

  it("makes no time-bound promise", () => {
    // "within weeks" was the worst offender: a fermented food "makes a
    // measurable difference within weeks" is an efficacy claim with a deadline.
    for (const line of copy) {
      expect(line, line).not.toMatch(/within (a few )?(days|weeks|months)/i)
      expect(line, line).not.toMatch(/\bin (just )?\d+ (days|weeks)\b/i)
    }
  })

  it("makes no efficacy or outcome guarantee", () => {
    for (const line of copy) {
      expect(line, line).not.toMatch(/measurable difference/i)
      // "will accelerate" slipped past the first version of this guard, which
      // only listed a handful of verbs. Any "will <verb>" is a promise.
      expect(line, line).not.toMatch(/\bwill \w+/i)
      expect(line, line).not.toMatch(/\b(guarantee|guaranteed|proven to)\b/i)
      expect(line, line).not.toMatch(/\b(treat|treats|cure|cures|prevents?)\b/i)
    }
  })

  it("describes the answers, not the person", () => {
    // "You have solid food habits" and "your gut health is benefiting" state
    // facts about a body from a fifteen-question survey.
    for (const line of copy) {
      expect(line, line).not.toMatch(/\bYou have\b/)
      expect(line, line).not.toMatch(/\bYou(&#39;|'|\u2019)ve built\b/i)
      expect(line, line).not.toMatch(/your gut health is\b/i)
      expect(line, line).not.toMatch(/your (scores )?reflect an? .*(system|microbiome)/i)
      // Claims about the reader's body or its wants, rather than their answers.
      expect(line, line).not.toMatch(/your gut is (waiting|craving|crying|starving|hungry)/i)
      expect(line, line).not.toMatch(/your gut bacteria are (hungry|starving|waiting)/i)
      expect(line, line).not.toMatch(/inner food system is (working|thriving|struggling)/i)
      expect(line, line).not.toMatch(/your (gut|body|microbiome|system) (needs|is missing|requires)\b/i)
    }
  })

  it("keeps every tagline about the answers, not the body", () => {
    // The first version of this file put taglines into allCopy() and then only
    // asserted patterns that happened not to appear in them — so five claim-y
    // taglines passed a guard that looked like it covered them. This rule is
    // specific to taglines so that cannot recur silently.
    // The anchor must be explicit. An earlier version of this list also allowed
    // "some habits", "a solid base" and "an early starting point" — phrases that
    // describe a state without attributing it to anything, which let two
    // unanchored taglines through a guard whose name said otherwise. Requiring
    // the words "your answers" removes the escape hatch.
    const answerAnchor = /your answers/i
    for (const profile of allProfiles()) {
      expect(profile.tagline, `${profile.type}: ${profile.tagline}`).toMatch(answerAnchor)
      // Short is still the point — these render as a single line under the score.
      expect(profile.tagline.length, profile.type).toBeLessThanOrEqual(90)
    }
  })

  it("uses hedged, educational framing in every profile description", () => {
    const hedges =
      /your answers suggest|this pattern may indicate|is associated with|may support|a useful place to (start|begin)|tends to/i
    for (const profile of allProfiles()) {
      expect(profile.description, profile.type).toMatch(hedges)
    }
  })
})

/**
 * Phase 6.1 — the same standard, extended to the other assessment families.
 *
 * Mind, Family and Glucose each have their own scoring module and their own
 * results page (mind-assessment-results:177, family-assessment-results:192,
 * glucose-report:70). None of them feed a prompt or an email — I traced that
 * before editing — so the blast radius is smaller than the You flow's, but the
 * copy is just as customer-facing.
 *
 * Glucose carried the strongest claims of the three, because it named a
 * physiological measure: "Your glucose rhythm is working in your favour" and
 * "supporting steadier glucose" assert something about blood glucose that a
 * questionnaire cannot see.
 */
describe("other assessment families hold the same language standard", () => {
  const BANDS = [85, 70, 60, 45, 30, 20]

  function familyCopy(): string[] {
    const out: string[] = []
    for (const overall of BANDS) {
      for (const p of [getMindProfile(overall), getFamilyProfile(overall), getGlucoseProfile(overall)]) {
        out.push(p.tagline, p.description)
      }
    }
    return out
  }

  it("makes no body claim, timeline or outcome promise", () => {
    for (const line of familyCopy()) {
      expect(line, line).not.toMatch(/\bYou have\b/)
      expect(line, line).not.toMatch(/\bYou(&#39;|'|\u2019)ve built\b/i)
      expect(line, line).not.toMatch(/within (a few )?(days|weeks|months)/i)
      expect(line, line).not.toMatch(/\bwill \w+/i)
      expect(line, line).not.toMatch(/measurable difference/i)
      expect(line, line).not.toMatch(/\b(guarantee|guaranteed|proven to)\b/i)
      expect(line, line).not.toMatch(/\b(treat|treats|cure|cures|prevents?)\b/i)
      expect(line, line).not.toMatch(/your (gut|body|microbiome|system) (needs|is missing|requires)\b/i)
      expect(line, line).not.toMatch(/your gut is (waiting|craving|hungry)/i)
    }
  })

  it("does not claim to know the reader's glucose", () => {
    // A 15-question survey cannot measure blood glucose. Habits may be
    // "associated with" steadier energy; the reading itself is not knowable.
    for (const overall of BANDS) {
      const p = getGlucoseProfile(overall)
      for (const line of [p.tagline, p.description]) {
        expect(line, line).not.toMatch(/your glucose (rhythm|response|curve|level)/i)
        expect(line, line).not.toMatch(/(support|supporting|supports) (steady|steadier|stable) glucose/i)
      }
    }
  })

  it("anchors every profile in the answers", () => {
    for (const overall of BANDS) {
      for (const [name, p] of [
        ["mind", getMindProfile(overall)],
        ["family", getFamilyProfile(overall)],
        ["glucose", getGlucoseProfile(overall)],
      ] as const) {
        expect(`${p.tagline} ${p.description}`, `${name} @ ${overall}`).toMatch(
          /your answers|is associated with|are associated with|a useful place to (start|begin)|may support/i,
        )
      }
    }
  })

  it("keeps the pillar insight copy hedged too", () => {
    const insightCopy = [
      ...getMindInsights({ nourish: 40, steady: 40, protect: 40, recover: 40 } as never),
      ...getFamilyInsights({ variety: 40, rhythm: 40, together: 40, calm: 40 } as never),
    ].flatMap((i) => [i.strength, i.opportunity, i.action].filter(Boolean) as string[])

    for (const line of insightCopy) {
      expect(line, line).not.toMatch(/\bYou have\b/)
      expect(line, line).not.toMatch(/within (a few )?(days|weeks|months)/i)
      expect(line, line).not.toMatch(/\bwill \w+/i)
      expect(line, line).not.toMatch(/measurable difference/i)
    }
  })

  it("holds the glucose pillar copy to the same rule, read from source", () => {
    // getGlucoseInsights is not exported, so the copy table is checked at
    // source rather than through a call — the alternative is exporting an
    // internal purely to test it.
    const src = readFileSync(join(process.cwd(), "lib/glucose-assessment-scoring.ts"), "utf8")
    const strings = [...src.matchAll(/(strength|opportunity|actionLow|actionHigh):\s*"([^"]+)"/g)].map(
      (m) => m[2],
    )
    expect(strings.length).toBeGreaterThan(8)
    for (const line of strings) {
      expect(line, line).not.toMatch(/\bYou(&#39;|'|\u2019)re protecting\b/i)
      expect(line, line).not.toMatch(/within (a few )?(days|weeks|months)/i)
      expect(line, line).not.toMatch(/\bwill \w+/i)
      expect(line, line).not.toMatch(/(support|supporting|supports) (steady|steadier|stable) glucose/i)
      expect(line, line).not.toMatch(/steadier glucose (curve|response)/i)
    }
  })

  it("confirms performance and lib/scoring.ts remain clean", () => {
    // Measured at 0 in Phase 6 and left untouched; this pins that.
    for (const f of ["lib/performance-assessment-scoring.ts", "lib/scoring.ts"]) {
      const src = readFileSync(join(process.cwd(), f), "utf8")
      expect(src, f).not.toMatch(/\bYou have\b/)
      expect(src, f).not.toMatch(/within (a few )?(days|weeks|months)/i)
      expect(src, f).not.toMatch(/measurable difference/i)
    }
  })
})

/**
 * Phase 6.1 follow-up — the rest of the glucose result surface.
 *
 * The first version of these guards covered getGlucoseProfile and PILLAR_COPY
 * and stopped there, which read as covering "the glucose copy" while leaving
 * getMealTimingPattern, buildProtocol and the static JSX in glucose-report.tsx
 * unchecked. All three render on the same page, and all three still claimed to
 * know or change the reader's glucose:
 *
 *   "will smooth your curve"                      (mealTiming, Variable)
 *   "one of the fastest ways to steady your energy" (mealTiming, Irregular)
 *   "soften your glucose response"                (protocol, week 3)
 *   "keep your energy and glucose steady"         (protocol, week 4)
 *   "steadies glucose" / "flattens the curve"     (report page tiles)
 *   "helps your body handle the glucose"          (report page tile)
 *
 * Same lesson as the tagline gap in #196: partial coverage under a general name
 * is what lets the next miss through.
 */
describe("the whole glucose result surface, not just the profile", () => {
  const GLUCOSE_CLAIMS = [
    /your glucose (rhythm|response|curve|level)/i,
    /(smooth|flatten|steady|soften)(s|ing)? (your|the) (curve|glucose)/i,
    /(support|supporting|supports) (steady|steadier|stable) glucose/i,
    /steadies glucose/i,
    /handle the glucose/i,
    /\bwill \w+/i,
    /within (a few )?(days|weeks|months)/i,
    /fastest way/i,
    /measurable difference/i,
  ]

  function assertClean(line: string, where: string) {
    for (const claim of GLUCOSE_CLAIMS) {
      expect(line, `${where}: ${line}`).not.toMatch(claim)
    }
  }

  it("holds every meal-timing description", () => {
    // All three bands, driven by rhythm score.
    for (const rhythm of [90, 70, 55, 45, 30, 0]) {
      const p = getMealTimingPattern(rhythm)
      assertClean(p.description, `mealTiming@${rhythm}`)
      expect(p.description, `mealTiming@${rhythm}`).toMatch(
        /your answers|is associated with|are associated with|a useful place to (start|begin)/i,
      )
    }
  })

  it("holds every protocol week, across weakest pillars and GLP-1 states", () => {
    const pillars = ["plate", "rhythm", "strength", "recovery"] as const
    const states = ["active", "considering", "none"] as const
    let checked = 0
    for (const pillar of pillars) {
      for (const glp1 of states) {
        for (const week of buildProtocol(pillar, glp1)) {
          assertClean(week.body, `protocol ${pillar}/${glp1}/${week.week}`)
          assertClean(week.title, `protocol title ${pillar}/${glp1}`)
          checked++
        }
      }
    }
    // 4 pillars x 3 GLP-1 states x 4 weeks — proves the loop actually ran.
    expect(checked).toBe(48)
  })

  it("holds the static copy on the glucose result page", () => {
    // Read from source: this copy lives in JSX, and rendering the component
    // needs a full GlucoseResult plus client hooks. The source read is the
    // honest option — it checks the strings that actually ship.
    const src = readFileSync(
      join(process.cwd(), "components/eatobetics/glucose-report.tsx"),
      "utf8",
    )
    const strings = [...src.matchAll(/(?:body|title|children):\s*"([^"]{20,})"/g)].map((m) => m[1])
    const longQuoted = [...src.matchAll(/"([^"]{60,})"/g)].map((m) => m[1])
    const all = [...strings, ...longQuoted]
    expect(all.length).toBeGreaterThan(3)
    for (const line of all) assertClean(line, "glucose-report.tsx")
  })
})
