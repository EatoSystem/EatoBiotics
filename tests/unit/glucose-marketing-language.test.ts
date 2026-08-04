import { describe, it, expect } from "vitest"

import {
  DISCLAIMER_SECTION,
  assertClean,
  copyOf,
  marketingCopy,
  readSource,
} from "./helpers/marketing-language"

/**
 * Glucose marketing language guard.
 *
 * Phases 6 and 6.1 held the assessment *result* copy to one standard: describe
 * the habits someone reported, never the body; no claimed measurement, no
 * promised outcome, no timeline. The pages that sell the assessment were never
 * swept, so a visitor read "Steady your glucose system in 30 days" on the way
 * in and a hedged, answers-based report on the way out.
 *
 * These four files are the whole /glucose marketing surface: the two pages and
 * the two components they render copy from. hero.tsx is included because the
 * page's loudest claim lived there, not in the page file — a guard scoped to
 * app/glucose/** would have passed while the H1 still promised results in 30
 * days.
 *
 * The standard these assert is the one already written down in
 * lib/assessment-disclaimers.ts:16 — "This is a glucose-supportive behavior
 * score. It does not measure blood glucose." The page used to contradict it in
 * four places.
 *
 * The extractor, the CLAIMS list and assertClean live in
 * ./helpers/marketing-language and are shared with the You guard — one list, so
 * a rule added for either surface protects both. The assertions below are
 * unchanged from when they were local.
 */

const PAGES = ["app/glucose/page.tsx", "app/glucose/glp1/page.tsx"] as const
const COMPONENTS = [
  "components/eatobetics/home/hero.tsx",
  "components/eatobetics/EbFramework.tsx",
] as const

describe("glucose marketing pages hold the Phase 6 language standard", () => {
  /**
   * Extraction floors. Without these, a regex that silently stopped matching —
   * a renamed attribute, a moved disclaimer marker — would empty the string and
   * every assertion below would pass on nothing. Same reason the protocol guard
   * asserts its iteration count.
   */
  const FLOORS: Record<string, [number, string]> = {
    "app/glucose/page.tsx": [4000, "The 3 Pillars"],
    "app/glucose/glp1/page.tsx": [3000, "Keep the "],
    "components/eatobetics/home/hero.tsx": [400, "Glucose Assessment"],
    "components/eatobetics/EbFramework.tsx": [200, "Glucose Score"],
  }

  it("extracts real copy from every file before asserting anything about it", () => {
    for (const f of [...PAGES, ...COMPONENTS]) {
      const copy = marketingCopy(f)
      const [minLength, anchor] = FLOORS[f]
      expect(copy.length, `${f} extracted only ${copy.length} chars`).toBeGreaterThan(minLength)
      expect(copy, `${f} is missing its anchor phrase`).toContain(anchor)
    }
  })

  it("makes no claim, promise or timeline on any glucose marketing surface", () => {
    for (const f of [...PAGES, ...COMPONENTS]) {
      assertClean(marketingCopy(f), f)
    }
  })

  it("keeps both medical disclaimers, which are the one legal use of those words", () => {
    for (const f of PAGES) {
      const source = readSource(f)
      const match = source.match(DISCLAIMER_SECTION)
      expect(match, `${f} has no disclaimer section`).not.toBeNull()

      const disclaimer = copyOf(match![0])
      expect(disclaimer, f).toMatch(/does not diagnose, treat, cure, or prevent/i)
      expect(disclaimer, f).toMatch(/qualified healthcare professional/i)
      // The disclaimer is the last section: nothing markets after the warning.
      expect(source.indexOf(match![0]), f).toBeGreaterThan(source.length * 0.8)
    }
  })

  it("states plainly that the Glucose Score is not a blood-glucose measurement", () => {
    // The positive half of the rule. Removing the claims is not enough if the
    // page still leaves a reader thinking the score reads their blood.
    expect(marketingCopy("app/glucose/page.tsx")).toMatch(/does not measure blood glucose/i)
  })

  it("still describes the 30-day plan, which is a product fact and not a promise", () => {
    // Guards against over-correction: the rewrite should remove the deadline on
    // the *result*, not the plan length the product actually ships.
    expect(marketingCopy("app/glucose/page.tsx")).toMatch(/30-day plan/i)
  })
})
