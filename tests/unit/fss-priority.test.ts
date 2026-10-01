/**
 * Your Priority, as a structured object.
 *
 * ══ WHAT IS BEING PROVEN ════════════════════════════════════════════════════
 *
 * Four things, and the fourth is the one that matters most:
 *
 *   1. the selection rule — exact ties only, no tolerance, insufficient out;
 *   2. determinism — identical answers give identical priorities, every run;
 *   3. the awkward cases — all-insufficient, and a WITHHELD composite that
 *      still has per-domain findings worth acting on;
 *   4. the evidence is real — every quoted question and answer traces back to
 *      an item that exists in the instrument and an option that was offered.
 *
 * The fourth is what separates a structured priority from a label. A reason
 * that cannot be traced is a reason nobody can check.
 */
import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { resolveQuestionSetV1 } from "@/lib/fss/questions/resolve"
import {
  computeFoodSystemScore,
  INSUFFICIENT,
  type Answers,
  type FoodSystemScore,
} from "@/lib/fss/engine/score"
import {
  DEV_ONLY_FSS_V1_FIXTURE_WEIGHTS,
  nonProductionFixture,
} from "@/lib/fss/engine/weights"
import { FSS_V1_PROVENANCE, LEGACY_PROVENANCE } from "@/lib/fss/engine/provenance"
import { resolvePriorities, PRIORITY_MUST_NOT_MEAN } from "@/lib/fss/action/priority"
import { PRIORITY_COPY } from "@/lib/fss/presentation/domains"
import { PRIORITY_MAX } from "@/lib/fss/action/types"
import type { FssDomain } from "@/lib/fss/questions/types"

const SET = resolveQuestionSetV1()
const FIXTURE = nonProductionFixture("unit test")

const scoredIds = SET.questions.filter((q) => q.contributes === "fss")

/** Answer every item the same way. */
const answerAll = (v: number): Answers =>
  Object.fromEntries(SET.questions.map((q) => [q.id, v]))

/** Answer every scored item at `base`, except one domain's items at `low`. */
function answersWithLowDomain(domain: FssDomain, low: number, base = 3): Answers {
  const out: Record<string, number> = {}
  for (const q of SET.questions) {
    out[q.id] = q.contributes === "fss" && q.domain === domain ? low : base
  }
  return out
}

const scoreOf = (answers: Answers): FoodSystemScore =>
  computeFoodSystemScore({
    set: SET,
    answers,
    weights: DEV_ONLY_FSS_V1_FIXTURE_WEIGHTS,
    fixtureContext: FIXTURE,
  })

const prioritiesOf = (answers: Answers) =>
  resolvePriorities({ score: scoreOf(answers), set: SET, answers })

describe("the selection rule", () => {
  it("one clearly lowest domain gives exactly one priority", () => {
    const p = prioritiesOf(answersWithLowDomain("fermentedFoods", 0))
    expect(p).toHaveLength(1)
    expect(p[0].sourceDomain).toBe("fermentedFoods")
    expect(p[0].domainScore).toBe(0)
  })

  it("every domain tied gives at most PRIORITY_MAX, never five", () => {
    // All-2s: every domain scores 67, so all five tie at the lowest.
    const p = prioritiesOf(answerAll(2))
    expect(p.length).toBeLessThanOrEqual(PRIORITY_MAX)
    expect(p).toHaveLength(3)
    expect(new Set(p.map((x) => x.sourceDomain)).size).toBe(3)
  })

  it("a domain one point higher is NOT a priority — there is no tolerance", () => {
    /*
     * The decision Gate 2 took and Gate 3 kept: a "close enough" window is a
     * threshold nobody chose. So a domain that is nearly as low is simply not
     * selected, and this test is what stops a tolerance being added quietly as
     * a usability improvement.
     */
    const answers: Record<string, number> = {}
    const low = SET.questions.filter((q) => q.contributes === "fss" && q.domain === "diversity")
    const nearly = SET.questions.filter(
      (q) => q.contributes === "fss" && q.domain === "mealRhythm",
    )
    for (const q of SET.questions) out(q.id)
    function out(id: string) {
      answers[id] = 3
    }
    for (const q of low) answers[q.id] = 0
    for (const q of nearly) answers[q.id] = 1

    const p = prioritiesOf(answers)
    expect(p.map((x) => x.sourceDomain)).toEqual(["diversity"])
    expect(p[0].domainScore).toBeLessThan(33)
  })

  it("refuses to look like it has a tolerance, in source", () => {
    const src = readFileSync("lib/fss/action/priority.ts", "utf-8")
      .replace(/\/\*[\s\S]*?\*\//g, " ")
      .replace(/^\s*\/\/.*$/gm, " ")
    // A tolerance would read as an addition to the lowest score. Catching the
    // shape rather than a name, since the name is whatever someone picks.
    expect(src, "a tolerance was added to the lowest score").not.toMatch(
      /lowest\s*[+-]|[+-]\s*(TOLERANCE|tolerance|MARGIN|margin|BAND|band)\b/,
    )
  })

  it("insufficient domains are excluded", () => {
    // Leave one domain almost entirely unanswered: below 60% it is insufficient.
    const answers: Record<string, number> = {}
    for (const q of SET.questions) answers[q.id] = 3
    const diversity = SET.questions.filter(
      (q) => q.contributes === "fss" && q.domain === "diversity",
    )
    for (const q of diversity) delete answers[q.id]

    const s = scoreOf(answers)
    expect(s.domains.find((d) => d.domain === "diversity")!.state).toBe(INSUFFICIENT)

    const p = resolvePriorities({ score: s, set: SET, answers })
    expect(
      p.map((x) => x.sourceDomain),
      "a domain we could not characterise cannot be the thing we are most confident about",
    ).not.toContain("diversity")
  })

  it("all-insufficient yields NO priority, and the copy says so", () => {
    const empty: Answers = {}
    const s = scoreOf(empty)
    expect(s.state).toBe("withheld")
    expect(resolvePriorities({ score: s, set: SET, answers: empty })).toEqual([])
    // The surface must have something to say. An empty section reads as a bug.
    expect(PRIORITY_COPY.noneAvailable.length).toBeGreaterThan(40)
  })

  it("a WITHHELD composite still yields priorities from the domains that scored", () => {
    /*
     * Withholding the overall score is a statement about the OVERALL score.
     * The per-domain findings are still there, and refusing to act on them
     * because a different domain was unanswered would charge the person for
     * the same gap twice.
     */
    const answers: Record<string, number> = {}
    for (const q of SET.questions) answers[q.id] = 3
    for (const q of SET.questions.filter(
      (q) => q.contributes === "fss" && q.domain === "foodQuality",
    )) {
      delete answers[q.id]
    }
    for (const q of SET.questions.filter(
      (q) => q.contributes === "fss" && q.domain === "mealRhythm",
    )) {
      answers[q.id] = 0
    }

    const s = scoreOf(answers)
    expect(s.state).toBe("withheld")
    expect(s.score).toBeUndefined()

    const p = resolvePriorities({ score: s, set: SET, answers })
    expect(p, "a withheld composite must not withhold the per-domain findings").not.toEqual([])
    expect(p.map((x) => x.sourceDomain)).toEqual(["mealRhythm"])
  })
})

describe("determinism", () => {
  it("the same answers give byte-identical priorities, repeatedly", () => {
    const answers = answerAll(2)
    const runs = [1, 2, 3, 4, 5].map(() => prioritiesOf(answers))
    for (const r of runs) {
      expect(JSON.stringify(r)).toBe(JSON.stringify(runs[0]))
    }
  })

  it("ids are derived from the domain, never from a counter", () => {
    const p = prioritiesOf(answersWithLowDomain("plantsAndFibre", 0))
    expect(p[0].id).toBe("priority:plantsAndFibre")
    // Two separate calls must agree, which a counter would not.
    expect(prioritiesOf(answersWithLowDomain("plantsAndFibre", 0))[0].id).toBe(p[0].id)
  })

  it("ties resolve in instrument order, not alphabetically or by chance", () => {
    const p = prioritiesOf(answerAll(2))
    const engineOrder = scoreOf(answerAll(2)).domains.map((d) => d.domain)
    expect(p.map((x) => x.sourceDomain)).toEqual(engineOrder.slice(0, 3))
  })
})

describe("the structure is complete, and the evidence is real", () => {
  const p = prioritiesOf(answersWithLowDomain("mealRhythm", 1))[0]

  it("carries every field the gate asked for", () => {
    expect(Object.keys(p).sort()).toEqual([
      "confidence",
      "domainScore",
      "evidence",
      "explanation",
      "headline",
      "id",
      "provenance",
      "rationale",
      "sourceDomain",
      "status",
    ])
    expect(p.status).toBe("candidate-pending-review")
  })

  it("carries provenance, taken from the score it was derived from", () => {
    expect(p.provenance).toEqual(FSS_V1_PROVENANCE)

    // And an explicit provenance overrides it, so a legacy score cannot have
    // its priorities silently stamped with the candidate method.
    const answers = answersWithLowDomain("mealRhythm", 1)
    const legacy = resolvePriorities({
      score: scoreOf(answers),
      set: SET,
      answers,
      provenance: LEGACY_PROVENANCE,
    })
    expect(legacy[0].provenance).toEqual(LEGACY_PROVENANCE)
  })

  it("every piece of evidence quotes a real item and a real option", () => {
    expect(p.evidence.length).toBeGreaterThan(0)
    for (const e of p.evidence) {
      const q = SET.questions.find((x) => x.id === e.questionId)
      expect(q, `${e.questionId} is not in the instrument`).toBeDefined()
      expect(q!.contributes).toBe("fss")
      expect(q!.domain).toBe(p.sourceDomain)
      expect(e.question).toBe(q!.text)
      expect(e.order).toBe(q!.order)
      // The answer is an option that was actually offered for that item.
      expect(
        q!.options.map((o) => o.label),
        `"${e.answer}" was never an option for ${e.questionId}`,
      ).toContain(e.answer)
      expect(q!.options.find((o) => o.label === e.answer)!.value).toBe(e.value)
    }
  })

  it("evidence is in asked order", () => {
    const orders = p.evidence.map((e) => e.order)
    expect(orders).toEqual([...orders].sort((a, b) => a - b))
  })

  it("unanswered items are not quoted as evidence", () => {
    const answers = answersWithLowDomain("mealRhythm", 1)
    const rhythm = SET.questions.filter((q) => q.contributes === "fss" && q.domain === "mealRhythm")
    const dropped = rhythm[0].id
    const partial = { ...answers }
    delete partial[dropped]

    const got = resolvePriorities({ score: scoreOf(partial), set: SET, answers: partial })
    const rhythmPriority = got.find((x) => x.sourceDomain === "mealRhythm")
    if (rhythmPriority) {
      expect(rhythmPriority.evidence.map((e) => e.questionId)).not.toContain(dropped)
    }
  })

  it("confidence is completeness, and is not called a confidence interval", () => {
    expect(p.confidence.total).toBeGreaterThan(0)
    expect(p.confidence.completeness).toBeCloseTo(p.confidence.answered / p.confidence.total)
    // The architecture review's reason: a CI would imply sampling properties
    // this instrument does not have.
    const src = readFileSync("lib/fss/action/types.ts", "utf-8")
    expect(src).toMatch(/not a confidence interval/i)
  })

  it("only scored items reach the evidence — never What You Notice or Food Context", () => {
    const unscored = new Set(
      SET.questions.filter((q) => q.contributes !== "fss").map((q) => q.id),
    )
    expect(unscored.size).toBeGreaterThan(0)
    for (const d of ["diversity", "plantsAndFibre", "fermentedFoods", "foodQuality", "mealRhythm"] as FssDomain[]) {
      const got = prioritiesOf(answersWithLowDomain(d, 0))
      for (const e of got[0].evidence) {
        expect(unscored.has(e.questionId), `${e.questionId} is unscored and reached a priority`).toBe(
          false,
        )
      }
    }
    expect(scoredIds.length).toBe(15)
  })
})

describe("a priority is a starting point, and says so", () => {
  it("names a rank, and the refusals are recorded as data", () => {
    const p = prioritiesOf(answersWithLowDomain("diversity", 0))[0]
    expect(p.rationale).toMatch(/rank/i)
    expect(PRIORITY_MUST_NOT_MEAN.length).toBeGreaterThanOrEqual(8)
    expect(PRIORITY_MUST_NOT_MEAN).toContain("a biological weakness")
    expect(PRIORITY_MUST_NOT_MEAN).toContain("the root cause")
  })

  /*
   * The vocabulary the €49 Report's priority module refuses, transcribed and
   * enforced here because that module cannot be imported — the science
   * contract's importer allow-list is pinned to five files under lib/report/.
   */
  const REFUSED =
    /\b(weakness|deficien\w+|root cause|highest risk|treatment target|damaging|blocker|disease|disorder|diagnos\w+)\b/i

  it("no priority sentence uses the refused vocabulary", () => {
    for (const d of ["diversity", "plantsAndFibre", "fermentedFoods", "foodQuality", "mealRhythm"] as FssDomain[]) {
      const got = prioritiesOf(answersWithLowDomain(d, 0))[0]
      for (const [label, sentence] of [
        ["explanation", got.explanation],
        ["rationale", got.rationale],
        ["headline", got.headline],
      ] as const) {
        expect(sentence, `${d} ${label}: "${sentence}"`).not.toMatch(REFUSED)
      }
    }
    expect(PRIORITY_COPY.noneAvailable).not.toMatch(REFUSED)
  })

  it("NON-VACUITY: the refused vocabulary would be caught", () => {
    for (const bad of [
      "This is your biggest weakness.",
      "A likely fibre deficiency.",
      "The root cause of your symptoms.",
      "Your highest risk area.",
      "The biggest blocker in your system.",
      "Signs of disease.",
    ]) {
      expect(bad, `"${bad}" must be refused`).toMatch(REFUSED)
    }
    // And it does not fire on the shipped sentence.
    expect(PRIORITY_COPY.explanation).not.toMatch(REFUSED)
  })

  it("the sentence a person reads is unchanged from Gate 2", () => {
    // The restructuring must not move a word of customer copy, or it stops
    // being a restructuring. This is the Gate 2 string, verbatim.
    expect(PRIORITY_COPY.explanation).toBe(
      "Of the five, this is where your answers described the least — which usually makes it the most direct place to start rather than the most important one.",
    )
  })

  it("names no Biotic anywhere", () => {
    for (const d of ["diversity", "plantsAndFibre", "fermentedFoods", "foodQuality", "mealRhythm"] as FssDomain[]) {
      const got = prioritiesOf(answersWithLowDomain(d, 0))[0]
      const all = [got.explanation, got.rationale, got.headline].join(" ")
      for (const b of ["Prebiotics", "Probiotics", "Postbiotics"]) {
        expect(all, `${d} names ${b}`).not.toContain(b)
      }
    }
  })
})

describe("there is only ONE priority selector", () => {
  /*
   * COMMENT-STRIPPED, and this file is the seventh place in the engagement
   * where that mattered. The first version of the second assertion below read
   * the raw source and failed — not because the component still called the old
   * selector, but because a comment in it EXPLAINS that the old selector moved,
   * and the comment contains the name. A guard that reads prose is asserting
   * what the code says about itself rather than what it does.
   */
  const strip = (src: string) =>
    src
      .replace(/\{\/\*[\s\S]*?\*\/\}/g, " ")
      .replace(/\/\*[\s\S]*?\*\//g, " ")
      .replace(/^\s*\/\/.*$/gm, " ")
  const code = (f: string) => strip(readFileSync(f, "utf-8"))

  it("the Gate 2 function is gone, not left beside the new one", () => {
    expect(
      code("lib/fss/presentation/domains.ts"),
      "priorityFor must have MOVED, not been duplicated",
    ).not.toMatch(/export function priorityFor/)
  })

  it("and the result component calls NO selector at all", () => {
    /*
     * ── REPOINTED IN GATE 4, AND THE DIRECTION IS WORTH STATING ───────────
     *
     * This asserted `resolvePriorities(` was PRESENT in the result component.
     * Gate 4 moved selection out of it, so the old assertion would now fail —
     * which is the right reason for a guard to fail, so it is repointed rather
     * than deleted, and the invariant it protects gets stronger rather than
     * weaker.
     *
     * The invariant was "there is only one priority selector". Gate 3 satisfied
     * it by having the component call the single shared one. Gate 4 cannot: a
     * selection is now a DECISION, written down under `SYSTEM_MODEL_VERSION`
     * and read back, so a component that selected for itself would be a second
     * selector again — agreeing today, diverging the first time the rule moved,
     * and showing a result page that disagreed with the Food System it had just
     * created.
     *
     * So the component now calls NEITHER selector and receives the selection as
     * a prop. Both halves are asserted: the Gate 2 function is still gone, and
     * the Gate 3 one is not called here either.
     */
    const src = code("components/fss/candidate-result.tsx")
    expect(src, "the component must not still call the Gate 2 selector").not.toMatch(
      /priorityFor\(/,
    )
    expect(
      src,
      "selection is a recorded decision — the component receives it, it does not make it",
    ).not.toMatch(/resolvePriorities\(|buildPlan\(/)
    // NON-VACUITY: it does still render priorities, so this is not passing
    // because the component stopped having anything to do with them.
    expect(src).toMatch(/priorities/)
  })

  it("NON-VACUITY: the stripper does not hide a real call", () => {
    // Proving the repair did not simply blind the rule: a genuine call
    // survives stripping, and only the prose form is removed.
    expect(strip("const p = priorityFor(score)")).toMatch(/priorityFor\(/)
    expect(strip("/* Gate 2 called priorityFor here */")).not.toMatch(/priorityFor/)
    expect(strip("{/* Gate 2 called priorityFor here */}")).not.toMatch(/priorityFor/)
  })
})
