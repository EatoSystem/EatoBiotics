import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { SCORE_BANDS, getScoreBand as legacyGetScoreBand } from "@/lib/scoring"
import { getScoreBand as dashboardBand } from "@/components/account/dashboard-client-data"
import {
  INTERPRETATION_LADDERS,
  KNOWN_NON_BAND_LADDERS,
  getScoreBand,
  ladderFor,
  UnknownInterpretationVersionError,
} from "@/lib/fss/interpretation/bands"

/**
 * ══ A REGISTRY THAT DRIFTS FROM ITS SOURCES IS WORSE THAN NO REGISTRY ═══════
 *
 * This module transcribes ten existing ladders so the divergence between them
 * becomes addressable. A transcription can go stale the moment somebody edits
 * the original — at which point the registry confidently reports thresholds
 * nobody is using, and a future consolidation would be built on fiction.
 *
 * So the transcriptions are checked against the real implementations by
 * behaviour, across the full 0–100 range, not by eye.
 */

const ALL_SCORES = Array.from({ length: 101 }, (_, i) => i)

describe("the registry is a faithful transcription, not an approximation", () => {
  it("interpretation-legacy-published matches lib/scoring.ts at every score", () => {
    for (const s of ALL_SCORES) {
      const mine = getScoreBand(s, "interpretation-legacy-published")
      const theirs = legacyGetScoreBand(s)
      expect(mine.label, `score ${s}`).toBe(theirs.label)
      expect(mine.color, `score ${s}`).toBe(theirs.color)
      expect(mine.min, `score ${s}`).toBe(theirs.min)
    }
  })

  it("interpretation-legacy-account matches the dashboard at every score", () => {
    for (const s of ALL_SCORES) {
      expect(getScoreBand(s, "interpretation-legacy-account").label, `score ${s}`).toBe(dashboardBand(s))
    }
  })

  it("interpretation-legacy-account matches result-builder and share-client at source", () => {
    /*
     * These two keep module-private ladders, so they cannot be imported and
     * compared behaviourally. Checked at source instead — and the check is the
     * thresholds AND the labels together, because a ladder that agreed on cut
     * points while disagreeing on words would still show a customer two
     * different things.
     */
    for (const file of ["components/analyse/result-builder.tsx", "app/share/share-client.tsx"]) {
      const src = readFileSync(file, "utf-8")
      for (const [min, label] of [
        [80, "Exceptional"],
        [65, "Strong Foundation"],
        [50, "Good Start"],
        [35, "Getting There"],
      ] as const) {
        expect(src, `${file} no longer uses ${min} → ${label}`).toMatch(
          new RegExp(`>=\\s*${min}[^\\n]*${label}`),
        )
      }
      expect(src).toContain("Starting Out")
    }
  })

  it("interpretation-legacy-email matches the meal email, INCLUDING its drifted colour", () => {
    const src = readFileSync("lib/email/meal-analysis-email.ts", "utf-8")
    const ladder = ladderFor("interpretation-legacy-email")
    for (const band of ladder.bands) {
      expect(src, `${band.label} / ${band.color}`).toContain(band.color)
    }
    /*
     * The drift, pinned deliberately. The web ladder ends #ef4444 and the
     * email ladder ends #ef5350 — the same band, two reds. Recorded rather
     * than reconciled: merging them here would hide a live inconsistency
     * behind a shared name, and picking one is a design decision.
     */
    expect(ladderFor("interpretation-legacy-account").bands.at(-1)!.color).toBe("#ef4444")
    expect(ladder.bands.at(-1)!.color).toBe("#ef5350")
  })

  it("the tenth ladder — per-pillar strength in the email — is recorded", () => {
    const src = readFileSync("lib/email/meal-analysis-email.ts", "utf-8")
    expect(src).toMatch(/pct >= 70 \? "Strong"/)
    const ladder = ladderFor("interpretation-legacy-pillar-strength-email")
    expect(ladder.bands.map((b) => [b.min, b.label])).toEqual([
      [70, "Strong"],
      [50, "Moderate"],
      [30, "Building"],
      [0, "Low"],
    ])
  })

  it("every registered ladder names a real file", () => {
    for (const ladder of INTERPRETATION_LADDERS) {
      for (const file of ladder.source.split(",").map((s) => s.trim().split(" ")[0])) {
        expect(() => readFileSync(file, "utf-8"), `${ladder.version} → ${file}`).not.toThrow()
      }
    }
  })
})

describe("the divergence is recorded, not resolved", () => {
  it("the published ladder and the account ladder genuinely disagree", () => {
    /*
     * The finding, asserted so it cannot quietly go away. /method publishes one
     * scale; the result, share card, dashboard and email use another. A score
     * of 62 is "Excellent" on the published methodology and "Good Start" to the
     * customer who earned it.
     */
    expect(getScoreBand(62, "interpretation-legacy-published").label).toBe("Excellent")
    expect(getScoreBand(62, "interpretation-legacy-account").label).toBe("Good Start")
  })

  it("NO canonical interpretation version is registered", () => {
    /*
     * The thresholds are not approved, so asking for them must fail rather
     * than return somebody's guess. This is the same refusal as the weights.
     */
    for (const v of ["interpretation-v1.0", "interpretation-canonical", "interpretation-approved"]) {
      expect(() => getScoreBand(50, v)).toThrow(UnknownInterpretationVersionError)
    }
  })

  it("there is no default version and no fallback", () => {
    // @ts-expect-error — the version is required; omitting it is the accident being prevented
    expect(() => getScoreBand(50)).toThrow(UnknownInterpretationVersionError)
    expect(() => getScoreBand(50, "")).toThrow(UnknownInterpretationVersionError)
  })

  it("the non-band ladders are recorded so the count is honest", () => {
    const sources = KNOWN_NON_BAND_LADDERS.map((l) => l.source)
    expect(sources.some((s) => s.includes("getProfile"))).toBe(true)
    expect(sources.some((s) => s.includes("identity-labels"))).toBe(true)
    for (const l of KNOWN_NON_BAND_LADDERS) expect(l.why.length).toBeGreaterThan(40)
  })
})

describe("the boundary behaves at the edges", () => {
  it("a threshold is inclusive", () => {
    expect(getScoreBand(80, "interpretation-legacy-account").label).toBe("Exceptional")
    expect(getScoreBand(79, "interpretation-legacy-account").label).toBe("Strong Foundation")
  })

  it("0 and 100 both resolve", () => {
    expect(getScoreBand(0, "interpretation-legacy-account").label).toBe("Starting Out")
    expect(getScoreBand(100, "interpretation-legacy-account").label).toBe("Exceptional")
  })

  it("a nonsensical score still resolves rather than returning undefined", () => {
    expect(getScoreBand(-10, "interpretation-legacy-account").label).toBe("Starting Out")
  })

  it("every ladder is ordered descending, so `find` means what it looks like", () => {
    for (const ladder of INTERPRETATION_LADDERS) {
      const mins = ladder.bands.map((b) => b.min)
      expect([...mins].sort((a, b) => b - a), ladder.version).toEqual(mins)
      expect(mins.at(-1), `${ladder.version} must reach 0`).toBe(0)
    }
  })
})

describe("NON-VACUITY", () => {
  it("a transcription error WOULD be caught", () => {
    /*
     * Proof the comparison above is real: the published ladder differs from
     * the account ladder at a score the two disagree about, so a test that
     * compared the wrong pair could not pass.
     */
    const published = SCORE_BANDS.find((b) => 62 >= b.min)!
    expect(published.label).not.toBe(dashboardBand(62))
  })
})
