import { describe, it, expect } from "vitest"

import {
  assertClean,
  assertExtractionFloor,
  marketingCopy,
} from "./helpers/marketing-language"

/**
 * You marketing language guard.
 *
 * The last unswept marketing surface. #198 brought the /glucose pages to the
 * Phase 6 standard, but its guard covered only those files — so
 * `{ num: "30 days", label: "To results" }` sat on the You hero untouched, the
 * identical stat pattern that PR had just removed from the glucose hero. It was
 * found while verifying the #198 merge, not by any rule.
 *
 * That is why the rules now live in ./helpers/marketing-language and are shared:
 * one list, so a rule written for either surface protects both. This file adds
 * the four You files to that coverage.
 *
 * Unlike the glucose pages, /you has **no medical disclaimer section**, so there
 * is no disclaimer assertion here and the whole file body is checked. The
 * missing disclaimer is reported separately — adding one is new copy, not a
 * language cleanup.
 */

const YOU_SURFACE = [
  "components/you/you-hero.tsx",
  "app/you/page.tsx",
  "components/you/YouFramework.tsx",
  "components/you/YouScoreShowcase.tsx",
] as const

/** [minimum extracted length, a phrase that must survive extraction] */
const FLOORS: Record<string, [number, string]> = {
  "components/you/you-hero.tsx": [400, "Start Free Assessment"],
  "app/you/page.tsx": [4000, "The Food System"],
  "components/you/YouFramework.tsx": [200, "Biotics Score"],
  "components/you/YouScoreShowcase.tsx": [200, "EatoBiotics Score"],
}

describe("You marketing pages hold the Phase 6 language standard", () => {
  it("extracts real copy from every file before asserting anything about it", () => {
    for (const f of YOU_SURFACE) {
      const [minLength, anchor] = FLOORS[f]
      assertExtractionFloor(f, minLength, anchor)
    }
  })

  it("makes no claim, promise or timeline on any You marketing surface", () => {
    // The two components are included even though they were already clean when
    // this was written. Covering the surface rather than the known-bad slice is
    // the whole lesson of #198: the file nobody was checking is where the claim
    // survived.
    for (const f of YOU_SURFACE) {
      assertClean(marketingCopy(f), f)
    }
  })

  it("does not attach a result to the 30-day plan", () => {
    // The specific regression. "30 days" is legitimate as a plan length; it was
    // the "To results" label beneath it that promised an outcome by a deadline.
    const hero = marketingCopy("components/you/you-hero.tsx")
    expect(hero).toMatch(/30 days/i)
    expect(hero, "the stat label must not promise results").not.toMatch(
      /\b(to|for) results\b/i,
    )
  })

  it("keeps the microbiome framed as shaped by many things, not by food alone", () => {
    // The positive half. Removing "shaped entirely by what you eat" is not
    // enough if the replacement still implies diet is the sole input — the page
    // should say plainly that it is one of several.
    const page = marketingCopy("app/you/page.tsx")
    expect(page).toMatch(/shaped by many things|one of the things that shapes it/i)
  })
})
