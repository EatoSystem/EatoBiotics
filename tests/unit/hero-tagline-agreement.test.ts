import { describe, it, expect } from "vitest"

import { heroTaglineFor, framingForScores, framingFor } from "@/lib/report/framing"
import { buildFallbackPaidReport } from "@/lib/fallback-paid-report"
import { getProfile, computeOverall } from "@/lib/assessment-scoring"
import { band } from "@/lib/report/build-food-system-report"
import type { DeepPremiumReport } from "@/lib/claude-report"

/**
 * The hero headline must never contradict the report's own opening.
 *
 * ── The bug this guards ──────────────────────────────────────────────────────
 *
 * Fix #3 of the PR #216 review pointed the hero at `freeScores.profile.tagline`
 * to stop the opening rendering twice. But that tagline comes from `getProfile`
 * (lib/assessment-scoring.ts), which keys PURELY on the overall score — and its
 * `>= 80` branch returns "Your answers point to all three pathways being well
 * supported."
 *
 * Probiotics carries only 20% of the weighted total and is floored at 20, so
 * that branch is reachable with a strained probiotics pathway:
 * pre 95 / pro 25 / post 95 → 0.4·95 + 0.2·25 + 0.4·95 = 81. That customer got a
 * hero claiming all three pathways are well supported, sitting directly above a
 * "Your Pattern" card correctly telling them Probiotics is under-supported at
 * 25/100 — the exact self-contradiction the Framing work exists to prevent,
 * reintroduced on the most prominent line of the page.
 *
 * `getProfile` is deliberately NOT changed: it also feeds the free results page,
 * the emails and the share card. The correction lives in `heroTaglineFor`
 * (lib/report/framing.ts), which applies the same `Framing` the report body uses.
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

describe("the defect is real and the fixtures reproduce it", () => {
  it("getProfile's >= 80 tagline claims all pathways are well supported", () => {
    // If this stops holding, the rest of this file is guarding nothing.
    const profile = getProfile(95, PROFILES.strongOverallStrainedPathway.subScores)
    expect(profile.tagline.toLowerCase()).toContain("all three pathways being well supported")
  })

  it("that profile's priority pathway is genuinely strained", () => {
    const resolved = framingForScores(95, PROFILES.strongOverallStrainedPathway.subScores)
    expect(resolved?.priorityPathway).toBe("probiotics")
    expect(band(resolved!.priorityScore)).toBe("strained")
    expect(resolved?.framing).toBe("mixed")
  })

  it("the contradiction is reachable through the real scorer, not just synthetic input", () => {
    // pre 100 / pro 25 / post 100 is the ceiling with a strained probiotics
    // pathway, and it still clears 80.
    const subScores = { prebiotics: 100, probiotics: 25, postbiotics: 100 }
    const overall = computeOverall(subScores)
    expect(overall).toBe(85)
    expect(getProfile(overall, subScores).tagline.toLowerCase()).toContain("well supported")
    expect(framingForScores(overall, subScores)?.framing).toBe("mixed")

    // …and the fix covers it.
    const tagline = heroTaglineFor({ overall, subScores, profile: getProfile(overall, subScores) })
    expect(tagline).toBe("A strong overall base, with Probiotics the thinnest part of your answers.")
  })
})

describe("hero tagline never disagrees with the opening", () => {
  it.each(NAMES)("%s — no 'all pathways well supported' claim over a strained pathway", (name) => {
    const fs = freeScoresFor(name)
    const tagline = heroTaglineFor(fs)
    expect(tagline, `${name} produced no tagline`).toBeTruthy()

    const resolved = framingForScores(fs.overall, fs.subScores)!
    if (resolved.framing === "mixed") {
      for (const claim of WELL_SUPPORTED_CLAIMS) {
        expect(tagline!.toLowerCase(), `${name}: "${tagline}"`).not.toContain(claim)
      }
    }
  })

  it.each(NAMES)("%s — tagline and opening agree on whether everything is fine", (name) => {
    const fs = freeScoresFor(name)
    const tagline = heroTaglineFor(fs)!.toLowerCase()
    const opening = openingFor(name).toLowerCase()

    const taglineSaysAllFine = WELL_SUPPORTED_CLAIMS.some((c) => tagline.includes(c))
    const openingSaysAllFine = WELL_SUPPORTED_CLAIMS.some((c) => opening.includes(c))

    expect(taglineSaysAllFine, `${name}\ntagline: ${tagline}\nopening: ${opening}`).toBe(
      openingSaysAllFine,
    )
  })

  it.each(NAMES)("%s — a strained priority pathway is named, not glossed", (name) => {
    const fs = freeScoresFor(name)
    const resolved = framingForScores(fs.overall, fs.subScores)!
    if (resolved.framing !== "mixed") return

    const tagline = heroTaglineFor(fs)!
    expect(tagline).toContain("Probiotics")
    expect(tagline.toLowerCase()).toMatch(/thinnest|under-supported|strong overall base/)
  })
})

describe("hero tagline leaves honest profiles alone", () => {
  it.each(["uniformlyStrong", "uniformlyEarly"] as const)("%s keeps its authored tagline", (name) => {
    const fs = freeScoresFor(name)
    expect(framingForScores(fs.overall, fs.subScores)!.framing).not.toBe("mixed")
    expect(heroTaglineFor(fs)).toBe(fs.profile.tagline)
  })

  it("the 72 adversarial profile's authored tagline was already honest, and is made specific", () => {
    const fs = freeScoresFor("adversarial72")
    // getProfile's >= 65 branch is honest but generic.
    expect(fs.profile.tagline).toContain("one pathway thinner than the rest")
    // The override names which one.
    expect(heroTaglineFor(fs)).toBe(
      "A strong overall base, with Probiotics the thinnest part of your answers.",
    )
  })
})

describe("heroTaglineFor degrades safely", () => {
  it("returns the authored tagline when sub-scores cannot be resolved", () => {
    expect(framingForScores(90, {})).toBeNull()
    expect(heroTaglineFor({ overall: 90, subScores: {}, profile: { tagline: "Authored." } })).toBe(
      "Authored.",
    )
  })

  it("returns null when there is no tagline to fall back to", () => {
    expect(heroTaglineFor({ overall: 90, subScores: {}, profile: { tagline: "  " } })).toBeNull()
    expect(heroTaglineFor({ overall: 90, subScores: null, profile: {} })).toBeNull()
  })

  it("framingFor maps the four states", () => {
    expect(framingFor("strong", "strained")).toBe("mixed")
    expect(framingFor("strong", "building")).toBe("protect")
    expect(framingFor("strong", "strong")).toBe("protect")
    expect(framingFor("building", "strained")).toBe("building")
    expect(framingFor("strained", "strained")).toBe("early")
  })
})
