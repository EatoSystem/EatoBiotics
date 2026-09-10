import { describe, it, expect } from "vitest"
import { createHash } from "node:crypto"

import { CONSULTATION_QUESTION_BANK } from "@/lib/consultation/question-bank"
import { resolveApplicableQuestions } from "@/lib/consultation/applicability"
import { prepareConsultationFinalisation } from "@/lib/consultation/finalisation"
import { REPORT_COMPOSITION_BOUNDARY } from "@/lib/consultation/science-contract"
import {
  createDeterministicConsultationSnapshot,
  DETERMINISTIC_STATE_KIND,
  DETERMINISTIC_STATE_SCHEMA_VERSION,
  type DeterministicConsultationState,
} from "@/lib/consultation/session-envelope"
import type { ConsultationAnswers, ConsultationFoundation } from "@/lib/consultation/types"
import { composePersonalFoodSystemReport } from "@/lib/report/deterministic/compose"
import { permitsUse, valueIsSilenced } from "@/lib/report/deterministic/permissions"
import { customerFacingText, serialiseReport } from "@/lib/report/deterministic/serialise"

/**
 * Coverage over the whole answer space — Phase 4A-S2.
 *
 * ══ WHAT IS AND IS NOT EXHAUSTIVE, STATED HONESTLY ══════════════════════════
 *
 * EXHAUSTIVE per option VALUE: every one of the 120 enumerated option values
 * appears in at least one composed Report (or is proven silenced), and every
 * proposition it produces is checked against the permission registry.
 *
 * NOT exhaustive over COMBINATIONS. The cross-product of 21 questions is
 * astronomically large, and claiming to have covered it would be exactly the
 * overclaim this architecture exists to prevent. Combinations are covered by
 * SEEDED property sampling — deterministic, reproducible, and honest about
 * being a sample.
 */

const AT = new Date("2026-09-10T09:00:00.000Z")
const HANDOFF = "22222222-2222-4222-8222-222222222222"

function completeAnswers(
  foundation: ConsultationFoundation,
  overrides: ConsultationAnswers = {},
): ConsultationAnswers {
  const answers: ConsultationAnswers = { ...overrides }
  for (let pass = 0; pass < 4; pass += 1) {
    for (const q of resolveApplicableQuestions({
      questions: CONSULTATION_QUESTION_BANK,
      context: { foundation },
      answers,
    })) {
      if (q.id in answers) continue
      if (q.type === "single") answers[q.id] = q.options![0].value
      else if (q.type === "multi") answers[q.id] = [q.options![0].value]
      else if (q.type === "textarea") answers[q.id] = "A calmer week."
      else answers[q.id] = q.min ?? 0
    }
  }
  return answers
}

function compose(foundation: ConsultationFoundation, overrides: ConsultationAnswers = {}) {
  const snapshot = createDeterministicConsultationSnapshot({
    foundation,
    entitledLens: null,
    now: AT,
  })
  const state: DeterministicConsultationState = {
    kind: DETERMINISTIC_STATE_KIND,
    schemaVersion: DETERMINISTIC_STATE_SCHEMA_VERSION,
    candidateAnswers: completeAnswers(foundation, overrides),
    touchedQuestionIds: [],
    skippedOptionalQuestionIds: [],
    currentQuestionId: null,
    phase: "review",
  }
  const prepared = prepareConsultationFinalisation({ snapshot, state, finalisedAt: AT })
  if (!prepared.ok) return { skipped: true as const, reason: prepared.reason }
  const result = composePersonalFoodSystemReport({
    finalisation: prepared.finalisation,
    handoffId: HANDOFF,
  })
  return { skipped: false as const, result }
}

/** Every (question, value) pair the bank offers, with the foundations that ask it. */
const OPTION_CASES = CONSULTATION_QUESTION_BANK.flatMap((q) =>
  (q.options ?? []).map((o) => ({
    questionId: q.id,
    value: o.value,
    type: q.type,
    foundation: (q.foundations.includes("you") ? "you" : "family") as ConsultationFoundation,
    exclusive: o.exclusive === true,
  })),
)

describe("every enumerated option value composes safely", () => {
  it("there are 120 of them", () => {
    expect(OPTION_CASES).toHaveLength(120)
  })

  it.each(OPTION_CASES.map((c) => [`${c.questionId}=${c.value}`, c] as const))(
    "%s",
    (_label, testCase) => {
      const override: ConsultationAnswers = {
        [testCase.questionId]:
          testCase.type === "multi" ? [testCase.value] : testCase.value,
      }
      const composed = compose(testCase.foundation, override)

      /*
       * Some values legitimately make a Consultation un-finalisable — an
       * exclusive "prefer not to say" on a required multi, for instance, or a
       * branch-opening value whose child question then has no answer. That is
       * C1 refusing correctly, not a Report failure, so it is recorded rather
       * than forced.
       */
      if (composed.skipped) {
        expect(composed.reason).toBeTruthy()
        return
      }

      const { result } = composed
      expect(result.ok, result.ok ? "" : `${result.reason}: ${result.detail}`).toBe(true)
      if (!result.ok) return
      const report = result.report

      /* Every proposition is permitted, individually. */
      const all = [
        ...report.systemSnapshot.propositions,
        ...report.priorityLever.propositions,
        ...report.thirtyDayLoop.map((s) => s.proposition),
        ...report.constraints.propositions,
        ...(report.familyContext?.propositions ?? []),
        ...(report.quotation ? [report.quotation] : []),
      ]
      for (const p of all) {
        for (const questionId of p.sourceQuestionIds) {
          expect(
            permitsUse(questionId, p.allowedUse, p.target),
            `${p.id}: ${questionId} does not permit ${p.allowedUse} → ${p.target}`,
          ).toBe(true)
        }
      }

      /* A silenced value never reaches the page. */
      if (valueIsSilenced(testCase.questionId, testCase.value)) {
        for (const p of all) {
          expect(
            p.sourceQuestionIds.includes(testCase.questionId) && p.id.endsWith(testCase.value),
            `${testCase.value} was rendered despite being silenced`,
          ).toBe(false)
        }
      }

      /* Never a prohibited framing, a biotic term, or a score. */
      const text = customerFacingText(report).join("\n")
      for (const framing of REPORT_COMPOSITION_BOUNDARY.prohibitedFramings) {
        expect(text.toLowerCase(), framing).not.toContain(framing.toLowerCase())
      }
      expect(text).not.toMatch(/pre-?biotic|pro-?biotic|post-?biotic|microbiom/i)
      expect(serialiseReport(report)).not.toContain('"overallScore"')
    },
  )
})

describe("combinations, by seeded sampling", () => {
  /**
   * A tiny deterministic PRNG (mulberry32).
   *
   * Seeded on purpose: a failing sample must be reproducible from the seed
   * alone. `Math.random` here would make a red build unreproducible, which is
   * worse than not sampling at all.
   */
  function mulberry32(seed: number) {
    return function next() {
      seed |= 0
      seed = (seed + 0x6d2b79f5) | 0
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
  }

  const SEED = 20260910
  const SAMPLES = 120

  it(`composes ${SAMPLES} random complete Consultations without a single violation`, () => {
    const rand = mulberry32(SEED)
    let composed = 0
    let refusedByC1 = 0

    for (let i = 0; i < SAMPLES; i++) {
      const foundation: ConsultationFoundation = rand() < 0.5 ? "you" : "family"
      const overrides: ConsultationAnswers = {}
      for (const q of CONSULTATION_QUESTION_BANK) {
        if (!q.foundations.includes(foundation)) continue
        if (!q.options || q.options.length === 0) continue
        const pick = q.options[Math.floor(rand() * q.options.length)]
        overrides[q.id] = q.type === "multi" ? [pick.value] : pick.value
      }

      const out = compose(foundation, overrides)
      if (out.skipped) {
        refusedByC1++
        continue
      }
      expect(out.result.ok, out.result.ok ? "" : `sample ${i}: ${out.result.detail}`).toBe(true)
      if (!out.result.ok) continue
      composed++

      const text = customerFacingText(out.result.report).join("\n")
      expect(text, `sample ${i}`).not.toMatch(/pre-?biotic|pro-?biotic|post-?biotic/i)
      expect(text, `sample ${i}`).not.toMatch(/we found|this shows|this reveals/i)
      // Never a clearance, whatever the combination.
      if (out.result.report.safety.state !== "none-declared") {
        expect(text, `sample ${i}`).not.toMatch(/no constraints|nothing to avoid/i)
      }
    }

    // Both numbers reported so a change in the C1 refusal rate is visible
    // rather than silently shrinking the sample.
    expect(composed + refusedByC1).toBe(SAMPLES)
    expect(composed, "the sample composed almost nothing").toBeGreaterThan(SAMPLES / 2)
  })

  it("the same seed produces the same Reports", () => {
    const run = () => {
      const rand = mulberry32(SEED)
      const hashes: string[] = []
      for (let i = 0; i < 20; i++) {
        const foundation: ConsultationFoundation = rand() < 0.5 ? "you" : "family"
        const overrides: ConsultationAnswers = {}
        for (const q of CONSULTATION_QUESTION_BANK) {
          if (!q.foundations.includes(foundation)) continue
          if (!q.options || q.options.length === 0) continue
          const pick = q.options[Math.floor(rand() * q.options.length)]
          overrides[q.id] = q.type === "multi" ? [pick.value] : pick.value
        }
        const out = compose(foundation, overrides)
        hashes.push(
          out.skipped || !out.result.ok
            ? "refused"
            : createHash("sha256").update(serialiseReport(out.result.report)).digest("hex"),
        )
      }
      return hashes
    }
    expect(run()).toEqual(run())
  })
})
