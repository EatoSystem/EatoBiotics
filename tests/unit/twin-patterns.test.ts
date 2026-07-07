import { describe, it, expect } from "vitest"
import { detectPatterns } from "@/lib/account/patterns"
import type { AccountTwinMeal } from "@/lib/agent-loop/account-twin"

/** Fixed "now": Thursday 2026-07-02T12:00Z (2026-07-04/05 are Sat/Sun). */
const NOW = new Date("2026-07-02T12:00:00Z").getTime()

function meal(daysAgo: number, score: number, over: Partial<AccountTwinMeal> = {}): AccountTwinMeal {
  return {
    name: over.name ?? `Meal ${daysAgo}-${score}`,
    score,
    prebiotic: over.prebiotic ?? 50,
    probiotic: over.probiotic ?? 50,
    postbiotic: over.postbiotic ?? 50,
    createdAt: new Date(NOW - daysAgo * 86_400_000).toISOString(),
    ...over,
  }
}

describe("detectPatterns", () => {
  it("is silent with no or insufficient data", () => {
    expect(detectPatterns([], NOW)).toEqual([])
    // Two meals: not enough for any detector except none.
    const few = detectPatterns([meal(1, 70), meal(2, 72)], NOW)
    expect(few.every((p) => p.id !== "weekend-dip" && p.id !== "rhythm")).toBe(true)
  })

  it("detects a weekend dip only with ≥3 meals each side and a ≥5-point gap", () => {
    // NOW is Thu 2 Jul 2026; 4-5 days ago = Sat/Sun 27-28 Jun.
    const weekday = [meal(0, 80), meal(1, 78), meal(2, 82)]
    const weekend = [meal(4, 60), meal(5, 62), meal(11, 58)]
    const ps = detectPatterns([...weekday, ...weekend], NOW)
    const dip = ps.find((p) => p.id === "weekend-dip")
    expect(dip).toBeTruthy()
    expect(dip!.title).toMatch(/weekends dip \d+ points/)
    // Small gap → silent.
    const close = detectPatterns([...weekday, meal(4, 79), meal(5, 78), meal(11, 80)], NOW)
    expect(close.find((p) => p.id.startsWith("weekend"))).toBeUndefined()
  })

  it("names the dominant biotic of the best meals", () => {
    const meals = [
      meal(1, 85, { probiotic: 90, prebiotic: 40, postbiotic: 30 }),
      meal(2, 80, { probiotic: 85, prebiotic: 45, postbiotic: 35 }),
      meal(3, 78, { probiotic: 80, prebiotic: 42, postbiotic: 30 }),
      meal(4, 40, { probiotic: 10, prebiotic: 70, postbiotic: 20 }),
    ]
    const p = detectPatterns(meals, NOW).find((x) => x.id === "best-lean-probiotic")
    expect(p).toBeTruthy()
    expect(p!.title).toContain("Probiotics")
    expect(p!.detail.toLowerCase()).toContain("fermented")
  })

  it("finds a repeat winner (same meal ≥2× averaging ≥70)", () => {
    const meals = [
      meal(1, 82, { name: "Kefir & berries" }),
      meal(3, 76, { name: "Kefir & Berries!" }), // normalised match
      meal(5, 50, { name: "Toast" }),
      meal(6, 52, { name: "Toast" }), // repeats but below 70 → not the winner
    ]
    const p = detectPatterns(meals, NOW).find((x) => x.id === "repeat-winner")
    expect(p).toBeTruthy()
    expect(p!.title).toContain("Kefir & berries")
    expect(p!.detail).toMatch(/2 times/)
  })

  it("spots a fortnight biotic trend (last 7d vs prior 7d, ≥6 points)", () => {
    const recent = [1, 2, 3].map((d) => meal(d, 70, { prebiotic: 80 }))
    const prior = [8, 9, 10].map((d) => meal(d, 70, { prebiotic: 60 }))
    const p = detectPatterns([...recent, ...prior], NOW).find((x) => x.id === "trend-up-prebiotic")
    expect(p).toBeTruthy()
    expect(p!.title).toMatch(/Prebiotics climbed \d+ points/)
  })

  it("recognises a weekly rhythm (≥4 distinct days in 7)", () => {
    const meals = [meal(0, 70), meal(1, 70), meal(2, 70), meal(3, 70)]
    const p = detectPatterns(meals, NOW).find((x) => x.id === "rhythm")
    expect(p).toBeTruthy()
    expect(p!.title).toContain("4 of the last 7 days")
  })

  it("keeps every pattern non-medical and garden-free", () => {
    const meals = [
      ...[0, 1, 2, 3].map((d) => meal(d, 80, { name: "Kefir bowl", probiotic: 85 })),
      ...[4, 5, 11].map((d) => meal(d, 55)),
      ...[8, 9, 10].map((d) => meal(d, 70, { prebiotic: 30 })),
    ]
    const ps = detectPatterns(meals, NOW)
    expect(ps.length).toBeGreaterThan(0)
    for (const p of ps) {
      expect(`${p.title} ${p.detail}`).not.toMatch(/cure|treat|diagnos|garden/i)
    }
  })
})
