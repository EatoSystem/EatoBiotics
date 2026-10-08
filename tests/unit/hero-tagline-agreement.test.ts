import { describe, it, expect } from "vitest"

import { heroTaglineFor, framingForScores, framingFor } from "@/lib/report/framing"
import { buildFallbackPaidReport } from "@/lib/fallback-paid-report"
import { getProfile } from "@/lib/assessment-scoring"
import type { DeepPremiumReport } from "@/lib/claude-report"

/**
 * The hero headline must never state a personal Biotic state.
 *
 * ══ WHAT THIS FILE USED TO GUARD, AND WHY IT CHANGED AT 0R-6R ══════════════
 *
 * It guarded a CONTRADICTION. `getProfile` keys purely on the overall score and
 * its `>= 80` branch returns "Your answers point to all three pathways being
 * well supported" — reachable with probiotics at 25, because probiotics carries
 * 20% of the weighted total and is floored at 20. That customer got a hero
 * claiming all three pathways were well supported, directly above a "Your
 * Pattern" card telling them Probiotics was under-supported at 25/100.
 *
 * `heroTaglineFor` fixed it by substituting, on `mixed` framing only, a sentence
 * naming the strongest pathway and the thinnest one.
 *
 * ── BOTH HALVES WERE PROHIBITED, WHICH THE CONTRADICTION FRAME HID ────────
 *
 * 0R-6R removed the card and the ranking. That left the tagline — and the
 * tagline is not merely in tension with something else, it is itself a BAND
 * WORD applied to this member's three Biotics, which the permanent product rule
 * prohibits alongside a number and a bar.
 *
 * So the subject of this file moves from "do the two agree" to "may either be
 * said at all", and the answer is no. `heroTaglineFor` now REFUSES the claim
 * and returns null, and the hero falls back to the tier label.
 *
 * `getProfile` is still deliberately NOT changed: it feeds the free results
 * page, the emails and the share card. That those surfaces state the same claim
 * is a wider finding, recorded in the register rather than repaired here.
 */

const WELL_SUPPORTED_CLAIMS = [
  "all three pathways being well supported",
  "well supported across the board",
  "all three pathways are well supported",
]

const PROFILES = {
  /**
   * The >= 80 branch with a strained pathway — the defect.
   *
   * NOTE: `computeOverall` cannot actually reach 95 with probiotics at 25 (the
   * ceiling is 0.4·200 + 0.2·25 = 85), so `overall: 95` is passed directly to
   * exercise the >= 80 tagline branch as strongly as possible. The reachable
   * worst case is covered separately by `reachableCeiling` below.
   */
  strongOverallStrainedPathway: {
    overall: 95,
    subScores: { prebiotics: 95, probiotics: 25, postbiotics: 95 },
  },
  /** The named adversarial profile — the >= 65 branch. */
  adversarial72: {
    overall: 72,
    subScores: { prebiotics: 85, probiotics: 20, postbiotics: 85 },
  },
  uniformlyStrong: {
    overall: 95,
    subScores: { prebiotics: 95, probiotics: 94, postbiotics: 96 },
  },
  uniformlyEarly: {
    overall: 22,
    subScores: { prebiotics: 24, probiotics: 20, postbiotics: 22 },
  },
} as const

type ProfileName = keyof typeof PROFILES
const NAMES = Object.keys(PROFILES) as ProfileName[]

function freeScoresFor(name: ProfileName) {
  const p = PROFILES[name]
  return { overall: p.overall, subScores: { ...p.subScores }, profile: getProfile(p.overall, p.subScores) }
}

function openingFor(name: ProfileName): string {
  const p = PROFILES[name]
  const report = buildFallbackPaidReport({
    tier: "premium",
    overall: p.overall,
    subScores: { ...p.subScores },
    profile: getProfile(p.overall, p.subScores),
    questions: [],
    answers: {},
  }) as DeepPremiumReport
  return report.opening
}

describe("the claim is real and the fixtures reproduce it", () => {
  it("getProfile's >= 80 tagline claims all pathways are well supported", () => {
    // If this stops holding, the rest of this file is guarding nothing.
    const profile = getProfile(95, PROFILES.strongOverallStrainedPathway.subScores)
    expect(profile.tagline.toLowerCase()).toContain("all three pathways being well supported")
  })
})

describe("0R-6R · the hero states no personal pathway state", () => {
  it.each(NAMES)("%s — the hero never claims all three pathways are supported", (name) => {
    const tagline = heroTaglineFor(freeScoresFor(name))
    if (tagline === null) return
    for (const claim of WELL_SUPPORTED_CLAIMS) {
      expect(
        tagline.toLowerCase().includes(claim),
        `the hero rendered "${tagline}" — a band word applied to this member's ` +
          `three Biotics. heroTaglineFor must refuse it and return null.`,
      ).toBe(false)
    }
  })

  it("the strong-overall profile's tagline is refused outright", () => {
    // NON-VACUITY: the authored tagline exists and carries the claim, so the
    // null below is a refusal rather than an absent profile.
    const fs = freeScoresFor("strongOverallStrainedPathway")
    expect(fs.profile.tagline.toLowerCase()).toContain("all three pathways")
    expect(heroTaglineFor(fs)).toBeNull()
  })

  it("a tagline that makes no such claim is passed through unchanged", () => {
    expect(
      heroTaglineFor({ profile: { tagline: "  A steady pattern worth repeating.  " } }),
    ).toBe("A steady pattern worth repeating.")
  })

  it("degrades safely on a missing or blank tagline", () => {
    expect(heroTaglineFor({ profile: { tagline: "  " } })).toBeNull()
    expect(heroTaglineFor({ profile: {} })).toBeNull()
  })
})

describe("0R-6R · the hero names no pathway, and neither does the opening", () => {
  const BIOTIC = /\b(?:pre|pro|post)biotics?\b/i

  it.each(NAMES)("%s — neither the hero nor the fallback opening names a Biotic", (name) => {
    const tagline = heroTaglineFor(freeScoresFor(name))
    if (tagline) expect(tagline, `hero: "${tagline}"`).not.toMatch(BIOTIC)

    const opening = openingFor(name)
    // NON-VACUITY: the opening is still a real paragraph about this customer.
    expect(opening.length, "the fallback opening is empty").toBeGreaterThan(80)
    expect(opening, `opening: "${opening}"`).not.toMatch(BIOTIC)
    expect(opening, "the opening still ranks the pathways").not.toMatch(/strongest|weakest|thinnest/i)
  })
})

describe("framing keys on the overall band alone", () => {
  it("framingFor maps the three states", () => {
    expect(framingFor("strong")).toBe("protect")
    expect(framingFor("building")).toBe("building")
    expect(framingFor("strained")).toBe("early")
  })

  it("framingForScores needs nothing but the overall score", () => {
    expect(framingForScores(95).framing).toBe("protect")
    expect(framingForScores(22).framing).toBe("early")
  })

  it("NON-VACUITY: the retired `mixed` framing is unreachable", () => {
    // `mixed` was the only branch that read a priority band, and the only one
    // whose copy named two pathways. It cannot be produced from any score.
    const produced = new Set([0, 22, 50, 64, 65, 72, 79, 80, 95, 100].map((n) => framingForScores(n).framing))
    expect([...produced].sort()).toEqual(["building", "early", "protect"])
  })
})
