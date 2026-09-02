/**
 * Phase 2B is a UX change. This file exists to make that claim falsifiable.
 *
 * The risk in a "presentation only" pass is that a wording tweak, a reordered
 * option or a nudged value slips in beside the layout work and silently
 * becomes a methodology change — every stored result before it and every one
 * after it now mean different things, and nothing in a visual review would
 * catch it.
 *
 * Two locks, deliberately different in kind:
 *
 *   1. A hash over the canonical shape of QUESTIONS. One assertion, catches any
 *      change to an id, order, index, section, type, option value or label.
 *      A hash rather than a giant inline snapshot: a snapshot that large stops
 *      being read, and people update it reflexively when it fails.
 *
 *   2. Golden end-to-end scoring cases. The hash would not notice a change to
 *      the WEIGHTS, so fixed answers are pinned to fixed scores and profiles.
 *
 * If either fails, the change under review is not a UX change. Do not update
 * these to make a build pass — establish first that the methodology change is
 * intended, versioned, and that historical results have been considered.
 */
import { describe, it, expect } from "vitest"
import { createHash } from "node:crypto"
import { QUESTIONS } from "@/lib/assessment-data"
import { computeResult, computeSubScores, computeOverall, getProfile } from "@/lib/assessment-scoring"

/** Everything about a question that changes what a score MEANS. */
function canonical(): string {
  return JSON.stringify(
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
}

describe("the Assessment methodology is frozen", () => {
  it("still asks exactly 15 questions, q1–q15 in order", () => {
    expect(QUESTIONS).toHaveLength(15)
    expect(QUESTIONS.map((q) => q.id)).toEqual(
      Array.from({ length: 15 }, (_, i) => `q${i + 1}`),
    )
    expect(QUESTIONS.map((q) => q.index)).toEqual(
      Array.from({ length: 15 }, (_, i) => i + 1),
    )
  })

  it("matches the recorded question hash", () => {
    // Recorded 2026-09-01 against merged main dbeb806. Regenerate ONLY as
    // part of a deliberate, reviewed methodology change — print
    // sha256(canonical()) and paste it, having first established that the
    // change is intended and that historical stored results have been
    // considered. Updating it to make a build pass defeats the whole file.
    expect(createHash("sha256").update(canonical(), "utf8").digest("hex")).toBe(
      "abb60e912d9de32fbda5290d38f7c2a2932ee4cd40689610d7f84f2814793196",
    )
  })

  it("keeps every option value inside the 0–3 scale", () => {
    for (const q of QUESTIONS) {
      expect(q.options.map((o) => o.value), q.id).toEqual([0, 1, 2, 3])
    }
  })

  it("keeps the three Biotic bands where the scoring expects them", () => {
    // q1–q6 prebiotics, q7–q9 probiotics, q10–q15 postbiotics. computeSubScores
    // reads these bands; moving a question between them changes three scores.
    const pillarOf = (id: string) => QUESTIONS.find((q) => q.id === id)!.pillar
    for (const id of ["q1", "q2", "q3", "q4", "q5", "q6"]) expect(pillarOf(id), id).toBe("prebiotics")
    for (const id of ["q7", "q8", "q9"]) expect(pillarOf(id), id).toBe("probiotics")
    for (const id of ["q10", "q11", "q12", "q13", "q14", "q15"]) expect(pillarOf(id), id).toBe("postbiotics")
  })
})

/* ── Golden scoring cases ───────────────────────────────────────────────── */

const allAnswers = (value: number) =>
  Object.fromEntries(QUESTIONS.map((q) => [q.id, value])) as Record<string, number>

describe("the same answers still produce the same result", () => {
  it("scores a floor sheet identically", () => {
    // 20, not 0: computeOverall floors each pillar at 20 so one absent
    // habit cannot drag the whole score to nothing. Pinning the real number
    // rather than the intuitive one is the point — if that floor is ever
    // removed or changed, this is where it surfaces.
    const r = computeResult(allAnswers(0))
    expect(r.overall).toBe(20)
    expect(r.subScores.prebiotics).toBe(0)
    expect(r.subScores.probiotics).toBe(0)
    expect(r.subScores.postbiotics).toBe(0)
    expect(r.profile.type).toBe("Early Builder")
  })

  it("scores a ceiling sheet identically", () => {
    const r = computeResult(allAnswers(3))
    expect(r.overall).toBe(100)
    expect(r.subScores.prebiotics).toBe(100)
    expect(r.subScores.probiotics).toBe(100)
    expect(r.subScores.postbiotics).toBe(100)
    expect(r.profile.type).toBe("Thriving Food System")
  })

  it("scores a mixed sheet identically", () => {
    // Uneven on purpose: a uniform sheet would not notice a weighting change
    // that only shows up when the three bands differ.
    const answers: Record<string, number> = {}
    QUESTIONS.forEach((q, i) => { answers[q.id] = i % 4 })
    const r = computeResult(answers)
    const sub = computeSubScores(answers)
    expect(r.subScores).toEqual(sub)
    expect(r.overall).toBe(computeOverall(sub))
    expect(r.profile.type).toBe(getProfile(r.overall, sub).type)
    // Pinned literals, so a weighting change fails here rather than silently
    // agreeing with itself through the same functions. Each was derived from
    // the formula by hand, not copied from a run:
    //   q1–q6  = 0,1,2,3,0,1 → 7/18  = 38.9 → 39
    //   q7–q9  = 2,3,0       → 5/9   = 55.6 → 56
    //   q10–q15= 1,2,3,0,1,2 → 9/18  = 50.0 → 50
    //   overall = 39×0.4 + 56×0.2 + 50×0.4 = 46.8 → 47
    expect(sub.prebiotics).toBe(39)
    expect(sub.probiotics).toBe(56)
    expect(sub.postbiotics).toBe(50)
    expect(r.overall).toBe(47)
    expect(r.profile.type).toBe("Developing System")
  })
})
