import { describe, it, expect } from "vitest"

import {
  assertClean,
  assertExtractionFloor,
  marketingCopy,
} from "./helpers/marketing-language"

/**
 * Mind and Stability marketing language guard.
 *
 * The last two unswept marketing surfaces. #203 gave both a disclaimer section
 * but deliberately left their body copy unchecked; this closes that.
 *
 * Both pages carry legitimate safety wording *outside* their disclaimer
 * sections — "does not constitute medical advice, diagnosis, or treatment"
 * mid-page on /mind, "for education and self-tracking, not diagnosis" on
 * /stability. That is correct copy and is not touched here.
 *
 * It also means the two rules are not interchangeable, and it is worth being
 * precise about which applies where:
 *
 *   - the shared CLAIMS list (below) runs in full on both surfaces. It catches
 *     claims — "powers your mood", "single measure of" — and contains no word
 *     that appears in a disclaiming construction. `treatment` is not
 *     `\btreats?\b`, and `diagnosis` is not in the list at all.
 *   - the stricter MEDICAL vocabulary rule in disclaimer-coverage.test.ts does
 *     include `diagnosis` and `treatment`, so it still applies to /you and
 *     /family only. Extending it here would fail on the safety copy above;
 *     relaxing it there would gut it.
 */

const MIND = ["app/mind/page.tsx", "components/mind/MindHero.tsx", "components/mind/MindFramework.tsx", "components/mind/MindScoreShowcase.tsx"] as const
const STABILITY = [
  "app/stability/page.tsx",
  "components/stability/StabilityHero.tsx",
  "components/stability/StabilityFramework.tsx",
  "components/stability/StabilityScoreShowcase.tsx",
] as const

/** [minimum extracted length, a phrase that must survive extraction] */
const FLOORS: Record<string, [number, string]> = {
  "app/mind/page.tsx": [4000, "The Food System Inside Your Mind"],
  "components/mind/MindHero.tsx": [300, "Mind Assessment"],
  "components/mind/MindFramework.tsx": [150, "Your gut microbiome"],
  "components/mind/MindScoreShowcase.tsx": [150, "Brain Nutrition"],
  "app/stability/page.tsx": [4000, "Stability"],
  "components/stability/StabilityHero.tsx": [300, "The Stability System"],
  "components/stability/StabilityFramework.tsx": [150, "Stability Score"],
  "components/stability/StabilityScoreShowcase.tsx": [150, "Improving Stability"],
}

describe("Mind and Stability marketing surfaces hold the Phase 6 standard", () => {
  it.each([...MIND, ...STABILITY])("%s yields real copy before anything is asserted", (f) => {
    const [minLength, anchor] = FLOORS[f]
    assertExtractionFloor(f, minLength, anchor)
  })

  it.each([...MIND, ...STABILITY])("%s makes no claim, promise or timeline", (f) => {
    assertClean(marketingCopy(f), f)
  })

  /**
   * A limit of the "acts on the body" rule, measured rather than assumed.
   *
   * Its noun list is energy|immunity|mood|digestion|microbiome|health. Adding
   * `gut` and `brain` looks obvious on a gut-brain page, and was tried: it
   * produces two false positives on /you — "the compounds your gut bacteria
   * produce" and "three things your gut needs" — and catches no real claim.
   * The rule's `\w+s your` shape cannot tell a verb from a plural noun, and for
   * those two words the plural-noun reading is the common one.
   *
   * So the list stays as it is. "the neurotransmitters your gut produces" on
   * /mind was reworded to "produced in the gut" for readability; that was a
   * choice, not something this guard required, and it is recorded here so
   * nobody later reads it as rule-driven.
   */
  it("keeps the mechanism copy that is legitimate education", () => {
    // Over-correction guard. "What you eat feeds the gut microbiome, which
    // produces the neurotransmitters" is the gut-brain axis explained, and the
    // page would be worse without it. The fix was dropping the possessive, not
    // deleting the mechanism.
    const mind = marketingCopy("app/mind/page.tsx")
    expect(mind).toMatch(/feeds the gut microbiome/i)
    expect(mind).toMatch(/neurotransmitters/i)
  })

  it("still frames the Stability score as a behaviour score", () => {
    expect(marketingCopy("app/stability/page.tsx")).toMatch(/not a clinical measurement/i)
  })
})
