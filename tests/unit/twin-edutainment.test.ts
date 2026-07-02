import { describe, it, expect } from "vitest"
import { buildAccountTwin, type AccountTwinInput } from "@/lib/agent-loop/account-twin"
import {
  buildInsideYouChapters,
  chapterIndexAtFrame,
  INSIDE_YOU_CHAPTER_FRAMES,
  INSIDE_YOU_DURATION_FRAMES,
} from "@/lib/account/inside-you"
import { systemMapState, SYSTEM_HOTSPOTS } from "@/lib/account/system-map"

function sampleInput(over: Partial<AccountTwinInput> = {}): AccountTwinInput {
  return {
    score: 74,
    previousScore: 68,
    profileType: "Emerging Balance",
    biotics: { prebiotic: 71, probiotic: 23, postbiotic: 48 },
    streak: 3,
    meals: [
      { name: "Kefir & berries", score: 78, prebiotic: 55, probiotic: 65, postbiotic: 44, createdAt: "2026-05-10T09:00:00Z" },
    ],
    ...over,
  }
}

describe("buildInsideYouChapters", () => {
  it("builds the four personalized chapters with the member's live values", async () => {
    const { twin } = await buildAccountTwin(sampleInput())
    const chapters = buildInsideYouChapters(twin)
    expect(chapters.map((c) => c.key)).toEqual(["eat", "prebiotics", "probiotics", "postbiotics"])
    // Chapter 1 carries the Food System Score; the rest carry their biotic level.
    expect(chapters[0].value).toBe(74)
    expect(chapters[1].value).toBe(twin.biotics.prebiotics.score)
    expect(chapters[2].value).toBe(twin.biotics.probiotics.score)
    expect(chapters[3].value).toBe(twin.biotics.postbiotics.score)
    // Frame layout tiles the composition exactly.
    expect(chapters[0].fromFrame).toBe(0)
    expect(chapters[3].fromFrame).toBe(3 * INSIDE_YOU_CHAPTER_FRAMES)
    expect(chapters.reduce((s, c) => s + c.durationInFrames, 0)).toBe(INSIDE_YOU_DURATION_FRAMES)
    // Copy is personalized, non-medical, and garden-free (brand decision).
    expect(chapters[1].takeaway.toLowerCase()).toContain("prebiotic")
    for (const c of chapters) {
      expect(c.narration).not.toMatch(/cure|treat|diagnos/i)
      expect(`${c.title} ${c.narration} ${c.takeaway}`).not.toMatch(/garden/i)
      expect(c.takeaway.length).toBeGreaterThan(10)
    }
  })

  it("maps frames to chapters for pill highlighting", () => {
    expect(chapterIndexAtFrame(0)).toBe(0)
    expect(chapterIndexAtFrame(INSIDE_YOU_CHAPTER_FRAMES)).toBe(1)
    expect(chapterIndexAtFrame(INSIDE_YOU_DURATION_FRAMES - 1)).toBe(3)
    // Clamped outside the composition.
    expect(chapterIndexAtFrame(INSIDE_YOU_DURATION_FRAMES + 500)).toBe(3)
    expect(chapterIndexAtFrame(-10)).toBe(0)
  })
})

describe("systemMapState", () => {
  it("attaches the member's live biotic level to each hotspot", async () => {
    const { twin } = await buildAccountTwin(sampleInput())
    const state = systemMapState(twin)
    expect(state.length).toBe(SYSTEM_HOTSPOTS.length)
    const byKey = Object.fromEntries(state.map((h) => [h.key, h]))
    expect(byKey.digestion.biotic).toBe("prebiotics")
    expect(byKey.digestion.score).toBe(twin.biotics.prebiotics.score)
    expect(byKey.mind.score).toBe(twin.biotics.probiotics.score)
    expect(byKey.defence.score).toBe(twin.biotics.postbiotics.score)
    for (const h of state) {
      // Positions stay on the figure stage and copy stays non-diagnostic.
      expect(h.x).toBeGreaterThan(0)
      expect(h.x).toBeLessThan(100)
      expect(h.y).toBeGreaterThan(0)
      expect(h.y).toBeLessThan(100)
      expect(h.level).toBeTruthy()
      expect(h.bioticLabel[0]).toBe(h.bioticLabel[0].toUpperCase())
      expect(h.what).not.toMatch(/cure|treat|diagnos/i)
      expect(`${h.what} ${h.action}`).not.toMatch(/garden/i)
      expect(h.action.length).toBeGreaterThan(10)
    }
  })
})
