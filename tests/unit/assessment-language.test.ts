import { describe, it, expect } from "vitest"

import { getProfile, getInsights, computeSubScores } from "@/lib/assessment-scoring"

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
    const grounded =
      /your answers|the pieces|a solid base|some habits|an early starting point|thinnest part/i
    for (const profile of allProfiles()) {
      expect(profile.tagline, `${profile.type}: ${profile.tagline}`).toMatch(grounded)
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
