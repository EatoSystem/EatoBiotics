import { describe, it, expect } from "vitest"

import { SECTION_META, type ConsultationQuestion } from "@/lib/consultation/types"
import { CONSULTATION_QUESTION_BANK } from "@/lib/consultation/question-bank"

/**
 * Claims guards over the NEW Consultation bank only.
 *
 * ══ WHY THE SCOPE IS NARROW ═════════════════════════════════════════════════
 *
 * A repo-wide banned-word sweep would fail on the Terms page, the medical
 * disclaimers, the legacy fallback bank and every internal comment that
 * discusses the words in order to forbid them — and the honest response to
 * those failures is to weaken the rule until it passes, which is how a guard
 * becomes decoration. So this reads exactly one corpus: the customer-facing
 * strings of the Phase 3A bank.
 *
 * The legacy fallback bank (lib/deep-assessment.ts) is deliberately NOT in
 * scope. It is still live, Phase 3A must not change it, and its known wording
 * risks are inventoried in
 * docs/phase-3a-consultation-question-bank-review.md instead. What this file
 * guarantees is narrower and more useful: the new bank did not inherit any of
 * it.
 *
 * ══ WHAT COUNTS AS CUSTOMER-FACING ══════════════════════════════════════════
 *
 * Question text, household wording, support lines, option labels and the
 * section purposes — everything a paying customer could read. NOT `intent`,
 * `whyNeeded` or `deeperBecause`, which are review documentation written FOR
 * this argument and necessarily contain the words being forbidden. A guard
 * that matched its own rationale would be the third time this project shipped
 * a rule that only ever matched its own explanatory comment.
 */

function customerFacingStrings(q: ConsultationQuestion): string[] {
  return [
    q.text,
    q.familyText,
    q.supportText,
    q.familySupportText,
    ...(q.options ?? []).flatMap((o) => [o.label, o.familyLabel]),
  ].filter((s): s is string => typeof s === "string" && s.length > 0)
}

const QUESTION_COPY: Array<{ id: string; text: string }> = CONSULTATION_QUESTION_BANK.flatMap((q) =>
  customerFacingStrings(q).map((text) => ({ id: q.id, text })),
)

const SECTION_COPY: Array<{ id: string; text: string }> = Object.entries(SECTION_META).flatMap(
  ([section, meta]) => [
    { id: `section:${section}`, text: meta.title },
    { id: `section:${section}`, text: meta.familyTitle },
    { id: `section:${section}`, text: meta.purpose },
  ],
)

const ALL_COPY = [...QUESTION_COPY, ...SECTION_COPY]

function offenders(pattern: RegExp): string[] {
  return ALL_COPY.filter((c) => pattern.test(c.text)).map((c) => `${c.id}: "${c.text}"`)
}

describe("the corpus is real", () => {
  it("reads every question and every section", () => {
    // A guard that silently examined nothing would pass everything below.
    expect(QUESTION_COPY.length).toBeGreaterThan(80)
    expect(SECTION_COPY.length).toBe(12)
    expect(new Set(QUESTION_COPY.map((c) => c.id)).size).toBe(CONSULTATION_QUESTION_BANK.length)
  })
})

describe("no clinical or diagnostic claim", () => {
  const BANNED: Array<[string, RegExp]> = [
    ["diagnosis language", /\bdiagnos(is|e|ed|es|tic|tically)\b/i],
    ["treatment language", /\btreat(s|ed|ing|ment|ments)?\b/i],
    ["intervention", /\bintervention\b/i],
    ["protocol", /\bprotocol\b/i],
    ["screening", /\bscreen(ing|ed)\b/i],
    ["imbalance", /\bimbalance[sd]?\b/i],
    ["specific imbalance", /\bspecific imbalance\b/i],
    ["heal", /\bheal(s|ed|ing)?\b/i],
    ["cure or fix language", /\bcures?\b|\bfixes your\b/i],
    ["expert claim", /\bgut health expert\b|\bexperts? (say|recommend)\b/i],
    ["clinical adequacy", /\bclinically\b|\badequate levels?\b|\bsufficient levels?\b/i],
    ["disease claim", /\bdisease\b|\bdisorder\b|\bcondition you have\b/i],
  ]

  it.each(BANNED)("the new bank never uses %s", (label, pattern) => {
    const hits = offenders(pattern)
    expect(hits, `${label}:\n${hits.join("\n")}`).toEqual([])
  })

  it("the matchers are not vacuous", () => {
    // Each of these is a real sentence this guard exists to reject.
    expect(BANNED[0][1].test("Have you been diagnosed with anything?")).toBe(true)
    expect(BANNED[1][1].test("This treatment supports your gut.")).toBe(true)
    expect(BANNED[3][1].test("Your goal shapes the protocol we build for you.")).toBe(true)
    expect(BANNED[5][1].test("Each one points to a specific imbalance.")).toBe(true)
    expect(BANNED[7][1].test("Sleep is when your gut heals its lining.")).toBe(true)
  })
})

describe("no claim to measure the microbiome, and no postbiotics claim", () => {
  /**
   * The boundary, stated plainly: EatoBiotics measures nothing biological. It
   * reads self-reported rhythm, comfort, energy and food patterns. Those are
   * reported patterns and context. They do not quantify Postbiotics, they do
   * not describe microbial composition, and no question may imply otherwise —
   * including by the back door of an innocent-sounding support line.
   */
  const BANNED: Array<[string, RegExp]> = [
    ["a measurement claim", /\bmeasur(e|es|ed|ing|ement)\b/i],
    ["a microbiome-composition claim", /\bmicrobiome\b|\bmicrobial\b|\bmicrobes?\b|\bgut flora\b|\bgut bacteria\b/i],
    ["a postbiotics claim", /\bpostbiotics?\b|\bprebiotics?\b|\bprobiotics?\b/i],
    ["a metabolite claim", /\bmetabolit/i],
    ["a diversity claim", /\bdiversity\b/i],
    ["a direct-mechanism claim", /\bdirectly (increases|reduces|suppresses|improves|boosts)\b/i],
    ["a reset claim", /\bresets? your\b|\brebuilds? your\b|\brestores? your\b/i],
    ["an inference-from-symptoms claim", /\bindicates\b|\bthis means (your|you)\b|\bpoints to (a|an|your)\b/i],
    [
      "a levels claim",
      // Both word orders. "low postbiotic production" and "postbiotic
      // production is low" are the same claim, and an earlier version of this
      // pattern only caught the first — which its own non-vacuity check
      // exposed, using a sentence written the other way round.
      /\b(low|high)\s+(?:\w+\s+){0,2}(levels?|production)\b|\b(levels?|production)\s+(?:is|are|seems?)\s+(low|high)\b/i,
    ],
  ]

  const rule = (label: string): RegExp => {
    const found = BANNED.find(([l]) => l === label)
    if (!found) throw new Error(`no rule named "${label}"`)
    return found[1]
  }

  it.each(BANNED)("the new bank never makes %s", (label, pattern) => {
    const hits = offenders(pattern)
    expect(hits, `${label}:\n${hits.join("\n")}`).toEqual([])
  })

  it("the matchers are not vacuous", () => {
    // Every string here is real legacy wording from the current AI-generated
    // fallback bank, which is exactly what the new bank must not inherit.
    expect(rule("a microbiome-composition claim").test("A key indicator of microbiome composition.")).toBe(true)
    expect(rule("a postbiotics claim").test("Do you regularly eat prebiotic-rich foods?")).toBe(true)
    expect(rule("a direct-mechanism claim").test("Regular movement directly increases diversity.")).toBe(true)
    expect(rule("a levels claim").test("Your postbiotic production is low.")).toBe(true)
    expect(rule("a levels claim").test("This suggests low postbiotic production.")).toBe(true)
    expect(rule("a measurement claim").test("This measures your gut health.")).toBe(true)
  })

  it("asks what someone notices, rather than what they have", () => {
    const asked = CONSULTATION_QUESTION_BANK.map((q) => `${q.text} ${q.familyText ?? ""}`).join("\n")

    // Deliberately narrow. A blanket ban on "do you have" fails on "when do
    // you have your first proper meal?", which is an innocent use of the verb
    // — and the honest response to that failure would be to delete the rule.
    // The real risk is being asked what CONDITION you have.
    const asksWhatYouHave =
      /\bdo you (?:suffer from|have)\b[^?.]{0,40}\b(conditions?|symptoms?|problems?|issues?|diagnos\w*|illness\w*)\b/i
    const asksIfEverDiagnosed = /\bhave you ever been\b/i
    expect(asked).not.toMatch(asksWhatYouHave)
    expect(asked).not.toMatch(asksIfEverDiagnosed)

    expect(asksWhatYouHave.test("Do you have any digestive symptoms?")).toBe(true)
    expect(asksWhatYouHave.test("Do you suffer from a condition?")).toBe(true)
    expect(asksWhatYouHave.test("When do you have your first proper meal?")).toBe(false)
    expect(asksIfEverDiagnosed.test("Have you ever been diagnosed with IBS?")).toBe(true)

    // And the Signals section, which is the one at risk, is framed as noticing.
    const signals = CONSULTATION_QUESTION_BANK.filter((q) => q.section === "signals")
    expect(signals.some((q) => /notice/i.test(q.text))).toBe(true)
  })
})

describe("no time or effort promise", () => {
  const BANNED: Array<[string, RegExp]> = [
    ["a duration estimate", /\b\d+\s*(–|-|to)?\s*\d*\s*(minutes?|mins?|hours?)\b/i],
    ["a speed claim", /\bquick\b|\bjust a few\b|\bin no time\b|\btakes only\b/i],
    ["a question count", /\b\d+\s+questions?\b|\bonly \w+ questions?\b/i],
    ["an instant-result claim", /\binstant(ly)?\b|\bimmediately\b|\bright away\b/i],
  ]

  it.each(BANNED)("the new bank never makes %s", (label, pattern) => {
    const hits = offenders(pattern)
    expect(hits, `${label}:\n${hits.join("\n")}`).toEqual([])
  })

  it("the matchers are not vacuous", () => {
    expect(BANNED[0][1].test("This takes about 15 minutes.")).toBe(true)
    expect(BANNED[2][1].test("Just 12 questions to go.")).toBe(true)
  })
})

describe("tone stays neutral and non-judgemental", () => {
  const BANNED: Array<[string, RegExp]> = [
    ["a judgement about the customer", /\bunhealthy\b|\bpoor (diet|habits?|choices?)\b|\bbad (diet|habits?|foods?)\b/i],
    ["failure language", /\bfailure\b|\byou failed\b|\byou should have\b/i],
    ["blame", /\byour fault\b|\byou need to stop\b|\byou must\b/i],
    ["wellness hype", /\bsupercharge\b|\btransform your\b|\boptimi[sz]e your\b|\bgame[- ]chang/i],
  ]

  it.each(BANNED)("the new bank never uses %s", (label, pattern) => {
    const hits = offenders(pattern)
    expect(hits, `${label}:\n${hits.join("\n")}`).toEqual([])
  })

  it("offers a way out of every sensitive question", () => {
    // Non-judgemental is not only about wording. A question someone cannot
    // decline is a judgement of its own.
    for (const q of CONSULTATION_QUESTION_BANK) {
      if (q.sensitivity === "low") continue
      const canDecline =
        !q.required ||
        (q.options ?? []).some((o) => /prefer not to say|nothing|none|not sure|no —/i.test(o.label))
      expect(canDecline, `${q.id} is sensitive, required, and offers no way to decline`).toBe(true)
    }
  })

  it("no question implies the customer controls a biological outcome", () => {
    const asked = CONSULTATION_QUESTION_BANK.flatMap(customerFacingStrings).join("\n")
    expect(asked).not.toMatch(/\byour gut (needs|wants|is telling)\b/i)
    expect(asked).not.toMatch(/\bwhat your body is telling you\b/i)
  })
})

describe("no emoji or visual choice is baked into the semantic contract", () => {
  it("the bank carries no emoji", () => {
    // Section icons and chrome belong to Phase 3B. A pictogram frozen into a
    // persisted answer contract is a design decision nobody can revisit.
    const emoji = /\p{Extended_Pictographic}/u
    const hits = ALL_COPY.filter((c) => emoji.test(c.text)).map((c) => c.id)
    expect(hits).toEqual([])
  })
})
