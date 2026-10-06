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
  /*
   * ══ REPOINTED IN GATE 3.6 ════════════════════════════════════
   *
   * This asserted, by value, that chapters 2–4 each carry
   * `twin.biotics.<key>.score` — so it REQUIRED three personal Biotic numbers,
   * which `inside-you-journey.tsx:199-202` then rendered beside the labels
   * "Your prebiotic level today" / "Your postbiotic level today" on /account.
   * A third guard enforcing the defect it should have refused.
   *
   * The overall-score assertion is kept: that figure is the Biotics Score™, a
   * result the product computes and may show. The other three become the
   * refusal, plus a check that only ONE chapter has a value at all — so a
   * future author cannot reintroduce two of them and stay green.
   */
  it("gives only the overall-score chapter a number", async () => {
    const { twin } = await buildAccountTwin(sampleInput())
    const chapters = buildInsideYouChapters(twin)
    expect(chapters.map((c) => c.key)).toEqual(["eat", "prebiotics", "probiotics", "postbiotics"])
    expect(chapters[0].value).toBe(74)
    for (const c of chapters.slice(1)) {
      expect(c.value, `${c.key} still carries a personal Biotic number`).toBeNull()
      expect(c.valueLabel, `${c.key} still labels a personal Biotic value`).toBe("")
    }
    expect(chapters.filter((c) => c.value != null).map((c) => c.key)).toEqual(["eat"])
    // Frame layout tiles the composition exactly.
    expect(chapters[0].fromFrame).toBe(0)
    expect(chapters[3].fromFrame).toBe(3 * INSIDE_YOU_CHAPTER_FRAMES)
    expect(chapters.reduce((s, c) => s + c.durationInFrames, 0)).toBe(INSIDE_YOU_DURATION_FRAMES)
    // Copy is personalized, non-medical, and garden-free (brand decision).
    // Was `toContain("prebiotic")`. The takeaway now names the behaviour that
    // moves this chapter rather than a personal level of the Biotic.
    expect(chapters[1].takeaway.toLowerCase()).toContain("plant variety")
    expect(chapters[1].takeaway).not.toMatch(/\b(Prebiotics|Probiotics|Postbiotics)\b/)
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
  /*
   * ══ INVERTED IN GATE 3.6, AND THAT IS THE POINT ══════════════════════
   *
   * This test was called "attaches the member's live biotic level to each
   * hotspot" and asserted, by value:
   *
   *   expect(byKey.mind.score).toBe(twin.biotics.probiotics.score)
   *
   * So it REQUIRED the hotspot to carry the person's Postbiotics and
   * Probiotics scores, which `TwinStage` then rendered on /account as
   * "Building · 45", a filled bar, and "Fed by Postbiotics". The guard was
   * enforcing the defect — which is why a green suite never mentioned it.
   *
   * Repointed to the opposite invariant, with the educational and action copy
   * checks kept intact so this is a removal of a claim and not of a feature.
   */
  it("carries no personal Biotic number, label or band — only what it teaches", async () => {
    const { twin } = await buildAccountTwin(sampleInput())
    const state = systemMapState(twin)
    expect(state.length).toBe(SYSTEM_HOTSPOTS.length)

    const byKey = Object.fromEntries(state.map((h) => [h.key, h]))
    /*
     * 0R-5 · this asserted `byKey.digestion.biotic === "prebiotics"` — the
     * Gate 3.6 data key that "survives: it is how a hotspot picks its food
     * action". By 0R-5 that was no longer true: `action` is a literal on each
     * hotspot, nothing was looked up, and the only reader left was
     * `twin-stage.tsx` passing it into a colour function. The hotspot now
     * carries a static palette `tone` instead, so the same colour appears when
     * a member taps it without a `BioticKey` in the path at all.
     */
    expect(
      (byKey.digestion as unknown as Record<string, unknown>).biotic,
      "the BioticKey data key is back on the hotspot",
    ).toBeUndefined()
    expect(byKey.digestion.tone, "the hotspot lost its static tint").toBe("lime")

    for (const h of state) {
      /*
       * The fields are ABSENT, not falsy. `toBeUndefined` on a key the type no
       * longer declares is what makes "removed" checkable at runtime as well
       * as at compile time — a plain truthiness check would also pass for a
       * field that was merely blanked, and a blanked field is one line away
       * from being filled in again.
       */
      for (const banned of ["score", "level", "bioticLabel", "biotic"]) {
        expect(
          (h as unknown as Record<string, unknown>)[banned],
          `a hotspot still carries ${banned}`,
        ).toBeUndefined()
      }

      // No value on the object may be a number that could read as a score.
      for (const [k, v] of Object.entries(h)) {
        if (k === "x" || k === "y") continue
        expect(typeof v, `${h.key}.${k} is numeric`).not.toBe("number")
      }

      // Positions stay on the figure stage and copy stays non-diagnostic.
      expect(h.x).toBeGreaterThan(0)
      expect(h.x).toBeLessThan(100)
      expect(h.y).toBeGreaterThan(0)
      expect(h.y).toBeLessThan(100)
      expect(h.what).not.toMatch(/cure|treat|diagnos/i)
      expect(`${h.what} ${h.action}`).not.toMatch(/garden/i)
      expect(h.action.length).toBeGreaterThan(10)
    }
  })

  it("NON-VACUITY: the removed fields would be caught if they came back", () => {
    const revived = { key: "mind", x: 50, y: 40, what: "x", action: "a food action here", biotic: "probiotics", score: 45 }
    expect((revived as Record<string, unknown>).score).not.toBeUndefined()
    expect(typeof (revived as Record<string, unknown>).score).toBe("number")
  })
})
