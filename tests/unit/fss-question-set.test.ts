import { describe, it, expect } from "vitest"
import { execFileSync } from "node:child_process"
import { readFileSync } from "node:fs"
import { createHash } from "node:crypto"
import { QUESTIONS } from "@/lib/assessment-data"
import { CANDIDATE_ITEMS } from "@/lib/fss/questions/candidate-items"
import { legacyQuestion, pinOf, currentPins } from "@/lib/fss/questions/legacy-pin"
import { QUESTION_SET_V1, QUESTION_SET_VERSION, ASSESSMENT_VERSION } from "@/lib/fss/questions/v1"
import {
  resolveQuestionSetV1,
  scoredQuestions,
  QuestionSetResolutionError,
} from "@/lib/fss/questions/resolve"

/**
 * ══ questions-v1.0 IS A MANIFEST, AND A MANIFEST CAN LIE ═════════════════════
 *
 * The candidate set does not copy the fifteen frozen questions; it references
 * them. That buys one source per sentence and costs one new failure mode: the
 * thing referenced can move, and the reference would quietly follow it.
 *
 * These tests exist to make that impossible. The pin is the mechanism; this
 * file is the proof the mechanism works, including the counterfactual — a
 * changed frozen item MUST fail resolution, asserted by actually changing one.
 */

const LEGACY_REFS = QUESTION_SET_V1.filter((e) => e.kind === "legacy-ref")

describe("every referenced legacy item exists", () => {
  it.each(LEGACY_REFS.map((r) => r.id))("%s is a real question in the frozen instrument", (id) => {
    expect(legacyQuestion(id), `${QUESTION_SET_VERSION} references "${id}"`).not.toBeNull()
  })

  it("references are not vacuous — the manifest actually contains some", () => {
    // Without this, deleting every reference would make the suite above pass
    // by iterating nothing, which is how a corpus check becomes decoration.
    expect(LEGACY_REFS.length).toBe(15)
  })
})

describe("every referenced legacy item still matches its pin", () => {
  it.each(LEGACY_REFS.map((r) => [r.id, r.kind === "legacy-ref" ? r.pin : ""] as const))(
    "%s hashes to its pinned revision",
    (id, pin) => {
      const q = legacyQuestion(id)!
      expect(pinOf(q), `"${id}" has changed since ${QUESTION_SET_VERSION} was defined against it`).toBe(pin)
    },
  )
})

describe("CHANGING A FROZEN ITEM FAILS RESOLUTION", () => {
  /*
   * The counterfactual, and the reason the pin is not decoration. Asserted
   * against the real hash function rather than a mock: if `pinOf` were ever
   * weakened to ignore a field, this is what would notice.
   */
  const sample = QUESTIONS.find((q) => q.id === "q6")!

  it.each([
    ["the question text", { ...sample, text: sample.text + " (reworded)" }],
    ["an option label", { ...sample, options: sample.options.map((o, i) => (i === 0 ? { ...o, label: "Different" } : o)) }],
    ["an option value", { ...sample, options: sample.options.map((o, i) => (i === 0 ? { ...o, value: 1 } : o)) }],
    ["the section title", { ...sample, sectionTitle: "Somewhere Else" }],
    ["the pillar", { ...sample, pillar: "probiotics" }],
    ["the index", { ...sample, index: 99 }],
  ])("a changed %s moves the pin", (_why, mutated) => {
    expect(pinOf(mutated)).not.toBe(pinOf(sample))
  })

  it("an answer DESCRIPTION does not move the pin, exactly as it does not move the freeze", () => {
    /*
     * Deliberate, and the other direction of the same decision. A description
     * is explanatory text beside an option, not the option itself — pinning it
     * would make a copy edit look like a methodology change, and the freeze
     * takes the same view.
     */
    const reworded = {
      ...sample,
      options: sample.options.map((o, i) => (i === 0 ? { ...o, description: "Reworded help text." } : o)),
    }
    expect(pinOf(reworded)).toBe(pinOf(sample))
  })

  /*
   * ══ THESE EXERCISE THE RESOLVER, NOT THE DATA ═══════════════════════════════
   *
   * The first version of this block asserted that a wrong pin differs from the
   * real one and that the real manifest resolves — both true, and neither
   * touching the code that enforces the pin. Sabotage case 1020 then replaced
   * the comparison with `if (false)` and the whole suite stayed green: every
   * pin matches, so a disabled check behaves identically to a working one.
   *
   * A check only exercised by data that satisfies it is not exercised. So the
   * manifest is injectable now and these hand the resolver input that SHOULD
   * be refused.
   */
  it("resolution throws, and names the question, when a pin no longer matches", () => {
    const broken = QUESTION_SET_V1.map((e) =>
      e.kind === "legacy-ref" && e.id === "q6" ? { ...e, pin: "0".repeat(64) } : e,
    )
    expect(() => resolveQuestionSetV1(broken)).toThrow(QuestionSetResolutionError)
    expect(() => resolveQuestionSetV1(broken)).toThrow(/q6/)
    // And it says what to do instead of repinning.
    expect(() => resolveQuestionSetV1(broken)).toThrow(/methodology change/)
  })

  it("resolution throws when a referenced question no longer exists", () => {
    const missing = QUESTION_SET_V1.map((e) =>
      e.kind === "legacy-ref" && e.id === "q6" ? { ...e, id: "q99" } : e,
    )
    expect(() => resolveQuestionSetV1(missing)).toThrow(/q99/)
  })

  it("resolution throws on a duplicate item", () => {
    const dupe = [...QUESTION_SET_V1, QUESTION_SET_V1[0]]
    expect(() => resolveQuestionSetV1(dupe)).toThrow(/more than once/)
  })

  it("resolution throws when a scored item names no domain", () => {
    const noDomain = QUESTION_SET_V1.map((e) =>
      e.kind === "legacy-ref" && e.id === "q1" ? { ...e, domain: undefined } : e,
    )
    expect(() => resolveQuestionSetV1(noDomain)).toThrow(/names no domain/)
  })

  it("resolution throws when an UNSCORED item claims a domain", () => {
    /*
     * The one that matters most: a domain on a Food Context item is how "these
     * never reach the Score" quietly stops being true.
     */
    const contextScored = QUESTION_SET_V1.map((e) =>
      e.id === "fc1" ? ({ ...e, domain: "mealRhythm" } as typeof e) : e,
    )
    expect(() => resolveQuestionSetV1(contextScored)).toThrow(/reach the Score by no path/)
  })

  it("the real manifest resolves cleanly", () => {
    expect(() => resolveQuestionSetV1()).not.toThrow()
  })
})

describe("the resolved set is deterministic and well formed", () => {
  const set = resolveQuestionSetV1()

  it("resolves to a stable, explicit order", () => {
    const a = resolveQuestionSetV1().questions.map((q) => q.id)
    const b = resolveQuestionSetV1().questions.map((q) => q.id)
    expect(a).toEqual(b)
    expect(set.questions.map((q) => q.order)).toEqual(
      Array.from({ length: set.questions.length }, (_, i) => i + 1),
    )
  })

  it("is NOT simply the legacy order — q5 and q13–q15 have moved", () => {
    /*
     * The assertion that stops this being the old instrument under a new
     * version number. q5 leaves the Prebiotics run for Food Quality, and
     * q13–q15 leave the scored body entirely.
     */
    const ids = set.questions.map((q) => q.id)
    expect(ids.indexOf("q5")).toBeGreaterThan(ids.indexOf("q9"))
    for (const id of ["q13", "q14", "q15"]) {
      expect(set.questions.find((q) => q.id === id)!.contributes).toBe("what-you-notice")
    }
  })

  it("carries its versions", () => {
    expect(set.questionSetVersion).toBe(QUESTION_SET_VERSION)
    expect(set.assessmentVersion).toBe(ASSESSMENT_VERSION)
  })

  it("has no duplicate item", () => {
    const ids = set.questions.map((q) => q.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it("every scored item names a domain, and no unscored item does", () => {
    for (const q of set.questions) {
      if (q.contributes === "fss") expect(q.domain, q.id).toBeTruthy()
      else expect(q.domain, q.id).toBeUndefined()
    }
  })

  it("the engine can only ever see the scored items", () => {
    const scored = scoredQuestions(set)
    expect(scored.every((q) => q.contributes === "fss")).toBe(true)
    expect(scored.length).toBe(15)
    expect(scored.length).toBeLessThan(set.questions.length)
  })

  it("all five domains are represented, and none rests on a single item", () => {
    const counts = new Map<string, number>()
    for (const q of scoredQuestions(set)) counts.set(q.domain!, (counts.get(q.domain!) ?? 0) + 1)
    expect([...counts.keys()].sort()).toEqual([
      "diversity",
      "fermentedFoods",
      "foodQuality",
      "mealRhythm",
      "plantsAndFibre",
    ])
    for (const [domain, n] of counts) {
      expect(n, `${domain} rests on ${n} item(s)`).toBeGreaterThanOrEqual(2)
    }
  })
})

describe("every candidate item declares what it contributes", () => {
  it.each(CANDIDATE_ITEMS.map((i) => i.id))("%s declares a contribution", (id) => {
    const item = CANDIDATE_ITEMS.find((i) => i.id === id)!
    expect(["fss", "what-you-notice", "food-context"]).toContain(item.contributes)
  })

  it.each(CANDIDATE_ITEMS.map((i) => i.id))("%s is marked as a draft pending review", (id) => {
    /*
     * Status travels with the ITEM, into the resolved artefact, rather than
     * living in a comment. A reviewer sees which questions have not been
     * signed off without having to be told.
     */
    expect(CANDIDATE_ITEMS.find((i) => i.id === id)!.status).toBe("draft-pending-review")
  })

  it("candidate items use the same 0–3 four-option shape as the frozen instrument", () => {
    for (const item of CANDIDATE_ITEMS) {
      expect(item.options.map((o) => o.value), item.id).toEqual([0, 1, 2, 3])
    }
  })
})

describe("candidate items cannot enter the legacy methodology hash", () => {
  /*
   * The containment assertion. questions-v1.0 adds seven items; the frozen
   * instrument must still be exactly the fifteen it was, or the new work has
   * silently changed what every historical score means.
   */
  const candidateIds = new Set(CANDIDATE_ITEMS.map((i) => i.id))

  it("no candidate id appears in lib/assessment-data.ts", () => {
    for (const q of QUESTIONS) {
      expect(candidateIds.has(q.id), `"${q.id}" is in BOTH the frozen instrument and the candidate set`).toBe(false)
    }
  })

  it("the frozen instrument is still exactly fifteen questions", () => {
    expect(QUESTIONS).toHaveLength(15)
  })

  it("the recorded methodology hash is untouched by any of this work", () => {
    /*
     * Deliberately duplicated from assessment-methodology-freeze.test.ts. That
     * file guards the instrument; this one guards the claim THIS work makes
     * about it — that adding a candidate set changed nothing. If the two ever
     * disagree, the disagreement is the finding.
     */
    const canonical = JSON.stringify(
      QUESTIONS.map((q) => ({
        id: q.id,
        index: q.index,
        pillar: q.pillar,
        sectionTitle: q.sectionTitle,
        type: q.type,
        text: q.text,
        options: q.options.map((o) => ({ value: o.value, label: o.label })),
      })),
    )
    expect(createHash("sha256").update(canonical, "utf8").digest("hex")).toBe(
      "abb60e912d9de32fbda5290d38f7c2a2932ee4cd40689610d7f84f2814793196",
    )
  })

  it("every pin in the manifest is one the frozen instrument currently produces", () => {
    const pins = currentPins()
    for (const ref of LEGACY_REFS) {
      if (ref.kind !== "legacy-ref") continue
      expect(pins[ref.id], ref.id).toBe(ref.pin)
    }
  })
})

describe("the resolved set renders as one artefact for scientific review", () => {
  it("the committed artefact matches what the manifest resolves to", () => {
    /*
     * Regenerated and compared, not merely "exists". A generated document that
     * has drifted from its source describes an instrument nobody is running,
     * which is worse than no document — a reviewer would sign off the wrong
     * thing.
     */
    expect(() =>
      execFileSync("npx", ["tsx", "scripts/generate-assessment-v1-artefact.ts", "--check"], {
        encoding: "utf-8",
        stdio: "pipe",
      }),
    ).not.toThrow()
  })

  it("the artefact names every item, its origin and its contribution", () => {
    const doc = readFileSync("docs/fss/generated/ASSESSMENT_V1_RESOLVED.md", "utf-8")
    const set = resolveQuestionSetV1()
    for (const q of set.questions) {
      expect(doc, `${q.id} missing from the artefact`).toContain(`\`${q.id}\``)
      expect(doc).toContain(q.text)
    }
    expect(doc).toContain("Not Yet Scientifically Approved")
    expect(doc).toContain("legacy-frozen")
    expect(doc).toContain("candidate-v1")
  })

  it("the artefact says plainly that nothing in it is approved", () => {
    const doc = readFileSync("docs/fss/generated/ASSESSMENT_V1_RESOLVED.md", "utf-8")
    expect(doc).toMatch(/What this document does not establish/)
    expect(doc).toMatch(/draft — pending sign-off/)
  })
})

describe("NON-VACUITY: the resolver refuses malformed manifests", () => {
  it("QuestionSetResolutionError is the error a caller must not swallow", () => {
    const err = new QuestionSetResolutionError("test")
    expect(err.name).toBe("QuestionSetResolutionError")
    expect(err).toBeInstanceOf(Error)
  })
})
