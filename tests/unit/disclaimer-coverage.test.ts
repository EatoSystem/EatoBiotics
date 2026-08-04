import { describe, it, expect } from "vitest"

import {
  DISCLAIMER_SECTION,
  marketingCopy,
  readSource,
} from "./helpers/marketing-language"
import {
  GLOBAL_DISCLAIMER,
  MIND_DISCLAIMER,
  SYSTEM_SUPPORT_DISCLAIMER,
  disclaimerFor,
} from "@/lib/assessment-disclaimers"

/**
 * Every marketing surface carries a disclaimer section.
 *
 * #202 reported /stability, /family and /mind as all missing one. That was
 * wrong: only /family was. The audit behind it used a line-based grep, which
 * missed /stability (its text lives in the MedicalDisclaimer component, not the
 * page) and /mind (its "does not diagnose" wraps across a source line). This
 * file replaces that eyeballing with an assertion.
 */

const SURFACES = [
  "app/you/page.tsx",
  "app/family/page.tsx",
  "app/mind/page.tsx",
  "app/stability/page.tsx",
] as const

/**
 * Medical vocabulary is correct inside a disclaimer and wrong in copy that
 * sells. Applied to the two pages where all such wording lives inside the
 * marked section.
 *
 * /mind and /stability are deliberately excluded: both carry legitimate safety
 * wording *outside* their disclaimer section — "does not constitute medical
 * advice, diagnosis, or treatment" mid-page on /mind, "for education and
 * self-tracking, not diagnosis" on /stability. Asserting the strict rule there
 * would fail on correct copy, and relaxing the rule for everyone to accommodate
 * them would gut it. They get section-existence coverage instead; a full
 * language sweep of those two surfaces is separate work.
 */
const STRICT = ["app/you/page.tsx", "app/family/page.tsx"] as const
const MEDICAL = /\b(diagnosis|diagnose|treatment|treats?|cures?|prevents?)\b/i

describe("marketing surfaces carry a disclaimer", () => {
  it.each(SURFACES)("%s has a disclaimer section, and nothing follows it", (page) => {
    const source = readSource(page)
    const match = source.match(DISCLAIMER_SECTION)
    expect(match, `${page} has no disclaimer section`).not.toBeNull()
    expect(source.indexOf(match![0]), page).toBeGreaterThan(source.length * 0.8)
  })

  it.each(STRICT)("%s keeps medical wording out of the marketing copy", (page) => {
    expect(marketingCopy(page), `medical wording in ${page} marketing copy`).not.toMatch(
      MEDICAL,
    )
  })

  it("puts that wording where it belongs instead", () => {
    // The other half of the rule: absent from the sell, present in the safety copy.
    expect(`${SYSTEM_SUPPORT_DISCLAIMER} ${GLOBAL_DISCLAIMER}`).toMatch(MEDICAL)
  })
})

describe("each surface uses the constant chosen for it", () => {
  it("family and you resolve to the global framing", () => {
    // ASSESSMENT_DISCLAIMERS has both as null, so disclaimerFor() returns the
    // global line. Pages call disclaimerFor() rather than naming a constant, so
    // the per-surface decision stays in one file.
    expect(disclaimerFor("family")).toBe(GLOBAL_DISCLAIMER)
    expect(disclaimerFor("you")).toBe(GLOBAL_DISCLAIMER)
  })

  it("mind renders its own exact constant", () => {
    const section = readSource("app/mind/page.tsx").match(DISCLAIMER_SECTION)![0]
    expect(section).toMatch(/MIND_DISCLAIMER/)
    expect(MIND_DISCLAIMER).toMatch(/not a mental-health screening or diagnosis/i)
  })

  it("family renders the shared component", () => {
    const section = readSource("app/family/page.tsx").match(DISCLAIMER_SECTION)![0]
    expect(section).toMatch(/SystemDisclaimer/)
    expect(section).toMatch(/disclaimerFor\("family"\)/)
  })
})
