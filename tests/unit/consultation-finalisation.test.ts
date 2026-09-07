import { describe, it, expect } from "vitest"
import { readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"

import { CONSULTATION_QUESTION_BANK, findConsultationQuestion } from "@/lib/consultation/question-bank"
import { resolveApplicableQuestions } from "@/lib/consultation/applicability"
import {
  createDeterministicConsultationSnapshot,
  DETERMINISTIC_STATE_KIND,
  DETERMINISTIC_STATE_SCHEMA_VERSION,
  type DeterministicConsultationSnapshot,
  type DeterministicConsultationState,
} from "@/lib/consultation/session-envelope"
import { SCIENCE_CONTRACT_VERSION } from "@/lib/consultation/science-contract"
import {
  CONSULTATION_FINALISATION_VERSION,
  FINALISATION_KIND,
  FINALISATION_SCHEMA_VERSION,
  prepareConsultationFinalisation,
  type FinalisationResult,
} from "@/lib/consultation/finalisation"
import type { ConsultationAnswers, ConsultationContext } from "@/lib/consultation/types"

/**
 * Phase 3C-C1 — the finalisation contract.
 *
 * ══ WHAT IS BEING PROVEN ════════════════════════════════════════════════════
 *
 * Not that a Report can be produced — no Report exists, and this phase adds no
 * route, no persistence and no handoff. What is proven is the SHAPE and the
 * PROVENANCE of the record a later phase will freeze: that every field was
 * derived from the customer's own stored answers by the canonical functions,
 * that nothing the projection refused can reach it, and that a Consultation
 * which is not actually finished cannot produce one at all.
 *
 * The stale-branch and withdrawal cases are the load-bearing ones. They are the
 * two ways an answer can stop counting, they mean different things, and only
 * one of them deletes.
 */

const you: ConsultationContext = { foundation: "you" }

const Q1 = "core_signals_post_meal_pattern_v1"
const Q2 = "core_signals_energy_shape_v1"
const Q3 = "core_signals_context_v1"
const CONSTRAINTS = "core_environment_constraints_v1"
const AVOIDANCES = "core_environment_food_avoidances_v1"
const SUCCESS = "core_intentions_success_v1"
const SHARED_MEALS = "core_rhythm_household_shared_meals_v1"

const AT = new Date("2026-09-06T12:00:00.000Z")

/** Every APPLICABLE question answered validly, honouring branching. */
function completeAnswers(
  context: ConsultationContext,
  overrides: ConsultationAnswers = {},
): ConsultationAnswers {
  const answers: ConsultationAnswers = { ...overrides }
  for (let pass = 0; pass < 4; pass += 1) {
    for (const q of resolveApplicableQuestions({
      questions: CONSULTATION_QUESTION_BANK,
      context,
      answers,
    })) {
      if (q.id in answers) continue
      if (q.type === "single") answers[q.id] = q.options![0].value
      else if (q.type === "multi") answers[q.id] = [q.options![0].value]
      else if (q.type === "textarea") answers[q.id] = "A sentence that is a real answer."
      else answers[q.id] = q.min ?? 0
    }
  }
  return answers
}

const snapshotFor = (
  foundation: "you" | "family" = "you",
  lens: null | "glucose" = null,
): DeterministicConsultationSnapshot =>
  createDeterministicConsultationSnapshot({ foundation, entitledLens: lens, now: AT })

function stateWith(over: Partial<DeterministicConsultationState> = {}): DeterministicConsultationState {
  return {
    kind: DETERMINISTIC_STATE_KIND,
    schemaVersion: DETERMINISTIC_STATE_SCHEMA_VERSION,
    candidateAnswers: {},
    touchedQuestionIds: [],
    skippedOptionalQuestionIds: [],
    currentQuestionId: null,
    phase: "review",
    ...over,
  }
}

const prepare = (
  state: DeterministicConsultationState,
  snapshot: DeterministicConsultationSnapshot = snapshotFor(),
) => prepareConsultationFinalisation({ snapshot, state, finalisedAt: AT })

/** Narrow a successful result, with a readable failure when it is not one. */
function mustFinalise(result: FinalisationResult) {
  expect(result.ok, result.ok ? "" : `refused: ${result.reason}`).toBe(true)
  if (!result.ok) throw new Error(result.reason)
  return result.finalisation
}

const readyState = (overrides: ConsultationAnswers = {}, over: Partial<DeterministicConsultationState> = {}) =>
  stateWith({ candidateAnswers: completeAnswers(you, overrides), ...over })

/* ══ Preconditions ═════════════════════════════════════════════════════════ */

describe("finalisation refuses anything that is not a finished Consultation", () => {
  it("a complete Review list finalises", () => {
    expect(prepare(readyState({ [Q1]: "bloating" })).ok).toBe(true)
  })

  it("the questions phase refuses — the customer has not reached Review", () => {
    const result = prepare(readyState({ [Q1]: "bloating" }, { phase: "questions", currentQuestionId: Q1 }))
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toBe("not-in-review")
  })

  it("an ACTIVE Review edit refuses — the record would freeze mid-correction", () => {
    // (review, questionId) is the editing state. Both halves of the pair matter.
    const result = prepare(readyState({ [Q1]: "bloating" }, { currentQuestionId: Q2 }))
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toBe("review-edit-active")
  })

  it("an incomplete Consultation refuses and names the first outstanding question", () => {
    const answers = completeAnswers(you, { [Q1]: "bloating" })
    delete answers[Q2]
    const result = prepare(stateWith({ candidateAnswers: answers }))

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.reason).toBe("incomplete")
    expect(result.firstQuestionId).toBe(Q2)
    expect(result.missingQuestionIds).toContain(Q2)
  })

  it("an invalid required answer refuses the same way", () => {
    const answers = { ...completeAnswers(you, { [Q1]: "bloating" }), [Q2]: "not-an-option" }
    const result = prepare(stateWith({ candidateAnswers: answers }))
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toBe("incomplete")
  })

  it("a bank this build does not hold refuses", () => {
    const drifted = { ...snapshotFor(), bankVersion: "consultation-v99" }
    const result = prepare(readyState({ [Q1]: "bloating" }), drifted)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toBe("bank-unavailable")
  })

  it("a fingerprint that no longer matches the bank refuses", () => {
    // Held, but drifted: answers given against a different set of questions are
    // not answers to these ones.
    const drifted = { ...snapshotFor(), bankFingerprint: "0000000000000000" }
    const result = prepare(readyState({ [Q1]: "bloating" }), drifted)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toBe("bank-mismatch")
  })

  it("an ordinary unfinished Consultation is a value, never a throw", () => {
    expect(() => prepare(stateWith({ candidateAnswers: {} }))).not.toThrow()
  })
})

/* ══ Authority ═════════════════════════════════════════════════════════════ */

describe("context comes from the snapshot and nowhere else", () => {
  it("Family finalises as Family, with its own applicable sequence", () => {
    const family: ConsultationContext = { foundation: "family" }
    const state = stateWith({
      candidateAnswers: completeAnswers(family, { [SHARED_MEALS]: "never" }),
    })
    const f = mustFinalise(prepare(state, snapshotFor("family")))

    expect(f.foundation).toBe("family")
    expect(f.applicableQuestionIds).not.toContain(Q1)
    expect(f.applicableQuestionIds).toContain(SHARED_MEALS)
  })

  it("the entitled lens is carried through from the snapshot", () => {
    const f = mustFinalise(prepare(readyState({ [Q1]: "bloating" }), snapshotFor("you", "glucose")))
    expect(f.entitledLens).toBe("glucose")
  })

  it("the builder accepts no context, trusted answers or completeness verdict", () => {
    // The strongest available proof: there is no parameter to pass them in.
    // A caller that could would be claiming trust rather than establishing it.
    const source = readFileSync(join(process.cwd(), "lib/consultation/finalisation.ts"), "utf8")
    const input = source.slice(
      source.indexOf("export interface FinalisationInput"),
      source.indexOf("export function prepareConsultationFinalisation"),
    )
    expect(input).toContain("snapshot")
    expect(input).toContain("state")
    expect(input).toContain("finalisedAt")
    for (const banned of ["trustedAnswers", "context", "complete", "bank:"]) {
      expect(input, `input accepts ${banned}`).not.toContain(banned)
    }
  })
})

/* ══ The payload ═══════════════════════════════════════════════════════════ */

describe("the payload carries provenance and trusted answers only", () => {
  const f = mustFinalise(prepare(readyState({ [Q1]: "bloating" })))

  it("states every version it was frozen under", () => {
    expect(f.kind).toBe(FINALISATION_KIND)
    expect(f.schemaVersion).toBe(FINALISATION_SCHEMA_VERSION)
    expect(f.finalisationVersion).toBe(CONSULTATION_FINALISATION_VERSION)
    expect(f.bankVersion).toBe("consultation-v1")
    expect(f.bankFingerprint).toEqual(expect.any(String))
    expect(f.bankFingerprint.length).toBeGreaterThan(0)
    expect(f.scienceContractVersion).toBe(SCIENCE_CONTRACT_VERSION)
  })

  it("the three versions are genuinely distinct", () => {
    // A bank can be revised without the contract moving, and the payload's own
    // shape can change without either. Collapsing them would make a stored
    // record unable to say what it was frozen under.
    const versions = [f.bankVersion, f.scienceContractVersion, f.finalisationVersion]
    expect(new Set(versions).size).toBe(3)
  })

  it("carries the applicable sequence, trusted answers and a timestamp", () => {
    expect(f.applicableQuestionIds.length).toBeGreaterThan(10)
    expect(Object.keys(f.trustedAnswers).length).toBe(f.applicableQuestionIds.length)
    expect(f.trustedAnswers[Q1]).toBe("bloating")
    expect(f.finalisedAt).toBe(AT.toISOString())
  })

  it("contains no UI state, no candidate map and no Report content", () => {
    const keys = Object.keys(f).sort()
    expect(keys).toEqual(
      [
        "applicableQuestionIds",
        "bankFingerprint",
        "bankVersion",
        "entitledLens",
        "finalisationVersion",
        "finalisedAt",
        "foodGuidance",
        "foundation",
        "kind",
        "schemaVersion",
        "scienceContractVersion",
        "skippedOptionalQuestionIds",
        "trustedAnswers",
        "trustedAnswersByField",
      ].sort(),
    )
    const serialised = JSON.stringify(f)
    for (const banned of ["candidateAnswers", "currentQuestionId", "validationError", "handoffId", "reportJobId"]) {
      expect(serialised, banned).not.toContain(banned)
    }
  })

  it("adds no biological state, score or diagnosis", () => {
    // Combining trusted answers still does not create a biomarker.
    const serialised = JSON.stringify(f)
    for (const banned of [
      "bodySignalMap",
      "microbiome",
      "metabolic",
      "postbiotic",
      "diagnosis",
      "riskScore",
      "severity",
      "likelihood",
    ]) {
      expect(serialised.toLowerCase(), banned).not.toContain(banned.toLowerCase())
    }
  })

  it("is deterministic — identical input, deep-equal payload", () => {
    // This is what makes a later idempotent handoff possible at all.
    const a = mustFinalise(prepare(readyState({ [Q1]: "bloating" })))
    const b = mustFinalise(prepare(readyState({ [Q1]: "bloating" })))
    expect(a).toEqual(b)
    expect(JSON.stringify(a)).toBe(JSON.stringify(b))
  })
})

/* ══ Semantic fields ═══════════════════════════════════════════════════════ */

describe("answers are also projected by semantic field", () => {
  const f = mustFinalise(prepare(readyState({ [Q1]: "bloating" })))

  it("keys the same answers by answerField", () => {
    const q1 = findConsultationQuestion(Q1)!
    expect(f.trustedAnswersByField[q1.answerField]).toBe("bloating")
    expect(Object.keys(f.trustedAnswersByField).length).toBe(Object.keys(f.trustedAnswers).length)
  })

  it("keeps BOTH maps — one for the Report, one for the audit", () => {
    // The field map survives a question being revised to v2; the id map says
    // which exact question produced the value.
    for (const [id, value] of Object.entries(f.trustedAnswers)) {
      const field = findConsultationQuestion(id)!.answerField
      expect(f.trustedAnswersByField[field]).toEqual(value)
    }
  })
})

/* ══ Stale branch vs withdrawal ════════════════════════════════════════════ */

describe("the two ways an answer stops counting stay different", () => {
  it("a CLOSED BRANCH answer is retained in storage and absent from finalisation", () => {
    // The customer answered the branch, then changed a parent. They never
    // un-said the child, so storage keeps it — but it was not asked at
    // finalisation, so it is not part of the record.
    const answers = completeAnswers(you, { [Q1]: "nothing" })
    answers[Q3] = ["rushed"]
    const state = stateWith({ candidateAnswers: answers })

    const f = mustFinalise(prepare(state))

    expect(state.candidateAnswers[Q3], "still stored").toEqual(["rushed"])
    expect(f.applicableQuestionIds).not.toContain(Q3)
    expect(f.trustedAnswers[Q3]).toBeUndefined()
    const q3 = findConsultationQuestion(Q3)!
    expect(f.trustedAnswersByField[q3.answerField]).toBeUndefined()
    expect(JSON.stringify(f)).not.toContain("rushed")
  })

  it("an EXPLICITLY WITHDRAWN answer is gone from storage and from finalisation", () => {
    const answers = completeAnswers(you, { [Q1]: "nothing", [CONSTRAINTS]: ["allergy"] })
    expect(answers[AVOIDANCES], "fixture: the optional branch was answered").toBeDefined()
    // What `withdrawOptionalAnswer` produces: the answer deleted, the skip set.
    delete answers[AVOIDANCES]
    const state = stateWith({
      candidateAnswers: answers,
      skippedOptionalQuestionIds: [AVOIDANCES],
    })

    const f = mustFinalise(prepare(state))

    expect(f.trustedAnswers[AVOIDANCES]).toBeUndefined()
    // Still applicable — the customer removed the answer, not the question.
    expect(f.applicableQuestionIds).toContain(AVOIDANCES)
    expect(f.skippedOptionalQuestionIds).toContain(AVOIDANCES)
  })

  it("an unknown question id never reaches the payload", () => {
    const answers = { ...completeAnswers(you, { [Q1]: "bloating" }), not_a_question_v1: "value" }
    const f = mustFinalise(prepare(stateWith({ candidateAnswers: answers })))
    expect(JSON.stringify(f)).not.toContain("not_a_question_v1")
  })
})

/* ══ Skip provenance ═══════════════════════════════════════════════════════ */

describe("skipped ids are filtered, not copied", () => {
  it("a stale skip for a question that no longer applies is dropped", () => {
    // The customer skipped the optional avoidance branch, then removed the
    // allergy. Freezing that marker would record a statement about a question
    // nobody was asked.
    const state = stateWith({
      candidateAnswers: completeAnswers(you, { [Q1]: "nothing", [CONSTRAINTS]: ["budget"] }),
      skippedOptionalQuestionIds: [AVOIDANCES],
    })
    const f = mustFinalise(prepare(state))
    expect(f.applicableQuestionIds).not.toContain(AVOIDANCES)
    expect(f.skippedOptionalQuestionIds).not.toContain(AVOIDANCES)
  })

  it("a skip marker beside a real answer is dropped", () => {
    const answers = completeAnswers(you, { [Q1]: "nothing", [CONSTRAINTS]: ["allergy"] })
    const state = stateWith({
      candidateAnswers: answers,
      skippedOptionalQuestionIds: [AVOIDANCES],
    })
    const f = mustFinalise(prepare(state))
    expect(f.trustedAnswers[AVOIDANCES], "fixture: it IS answered").toBeDefined()
    expect(f.skippedOptionalQuestionIds).not.toContain(AVOIDANCES)
  })

  it("a skip for a REQUIRED question is never recorded", () => {
    const state = stateWith({
      candidateAnswers: completeAnswers(you, { [Q1]: "bloating" }),
      skippedOptionalQuestionIds: [Q2],
    })
    expect(mustFinalise(prepare(state)).skippedOptionalQuestionIds).not.toContain(Q2)
  })

  it("surviving skips come out in bank order", () => {
    const answers = completeAnswers(you, { [Q1]: "nothing", [CONSTRAINTS]: ["allergy"] })
    delete answers[AVOIDANCES]
    delete answers[SUCCESS]
    const state = stateWith({
      // Deliberately reversed on the way in: stable output cannot come from the
      // stored order, or an idempotent handoff would depend on set iteration.
      candidateAnswers: answers,
      skippedOptionalQuestionIds: [SUCCESS, AVOIDANCES],
    })
    const f = mustFinalise(prepare(state))
    const order = CONSULTATION_QUESTION_BANK.map((q) => q.id)
    expect(f.skippedOptionalQuestionIds).toEqual(
      [...f.skippedOptionalQuestionIds].sort((a, b) => order.indexOf(a) - order.indexOf(b)),
    )
    expect(f.skippedOptionalQuestionIds).toEqual([AVOIDANCES, SUCCESS])
  })
})

/* ══ Food guidance ═════════════════════════════════════════════════════════ */

describe("the food-safety state is derived, never inferred", () => {
  it("a declared allergy with a named avoidance resolves", () => {
    const answers = completeAnswers(you, {
      [Q1]: "nothing",
      [CONSTRAINTS]: ["allergy"],
      [AVOIDANCES]: ["dairy"],
    })
    const f = mustFinalise(prepare(stateWith({ candidateAnswers: answers })))

    expect(f.foodGuidance.requiresSpecificAvoidance).toBe(true)
    expect(f.foodGuidance.knownAvoidances).toEqual(["dairy"])
    expect(f.foodGuidance.unresolvedSpecificAvoidance).toBe(false)
  })

  it("WITHDRAWING the avoidance detail leaves it unresolved, not safe", () => {
    // The whole reason the safety helper exists. Removing the detail removes
    // information; it does not create an assurance.
    const answers = completeAnswers(you, {
      [Q1]: "nothing",
      [CONSTRAINTS]: ["allergy"],
      [AVOIDANCES]: ["dairy"],
    })
    delete answers[AVOIDANCES]
    const f = mustFinalise(
      prepare(stateWith({ candidateAnswers: answers, skippedOptionalQuestionIds: [AVOIDANCES] })),
    )

    expect(f.trustedAnswers[AVOIDANCES]).toBeUndefined()
    expect(f.foodGuidance.knownAvoidances).toEqual([])
    expect(f.foodGuidance.requiresSpecificAvoidance).toBe(true)
    expect(f.foodGuidance.unresolvedSpecificAvoidance).toBe(true)
    expect(f.foodGuidance.declaresNoConstraints, "not a claim of no constraint").toBe(false)
  })

  it("declining to disclose is not a declaration of no constraint", () => {
    const answers = completeAnswers(you, {
      [Q1]: "nothing",
      [CONSTRAINTS]: ["prefer-not-to-say"],
    })
    const f = mustFinalise(prepare(stateWith({ candidateAnswers: answers })))
    expect(f.foodGuidance.constraintsUndisclosed).toBe(true)
    expect(f.foodGuidance.declaresNoConstraints).toBe(false)
  })

  it("carries no severity, risk or likelihood alongside it", () => {
    const answers = completeAnswers(you, { [Q1]: "nothing", [CONSTRAINTS]: ["allergy"] })
    const f = mustFinalise(prepare(stateWith({ candidateAnswers: answers })))
    expect(Object.keys(f.foodGuidance).sort()).toEqual(
      [
        "constraintsUndisclosed",
        "declaredConstraints",
        "declaresNoConstraints",
        "knownAvoidances",
        "practicalConstraints",
        "requiresSpecificAvoidance",
        "safetyConstraints",
        "unresolvedSpecificAvoidance",
      ].sort(),
    )
  })
})

/* ══ Boundaries ════════════════════════════════════════════════════════════ */

describe("finalisation is pure, dormant and produces no Report", () => {
  const SOURCE = readFileSync(join(process.cwd(), "lib/consultation/finalisation.ts"), "utf8")

  it("imports only canonical Consultation modules", () => {
    const specs = [...SOURCE.matchAll(/^\s*import\s[^"']*["']([^"']+)["']/gm)].map((m) => m[1])
    for (const spec of specs) {
      expect(spec.startsWith("./") || spec === "@/lib/addon-types", `imports ${spec}`).toBe(true)
    }
  })

  it("touches no server, transport or model surface", () => {
    for (const banned of [
      "supabase",
      "stripe",
      "next/server",
      "anthropic",
      "openai",
      "fetch(",
      "submit-deep-assessment",
    ]) {
      expect(SOURCE.toLowerCase(), banned).not.toContain(banned.toLowerCase())
    }
  })

  it("creates no handoff id and no report id", () => {
    for (const banned of ["handoffId", "reportJobId", "reportId", "randomUUID", "Math.random"]) {
      expect(SOURCE, banned).not.toContain(banned)
    }
  })

  it("cannot set the finalisation phase", () => {
    expect(SOURCE).not.toMatch(/phase:\s*["']ready-for-report["']/)
    expect(SOURCE).not.toMatch(/(?<![=!])=\s*["']ready-for-report["']/)
  })

  it("nothing in the app calls it yet", () => {
    // Phase 3C-C2 owns the route. Defining the payload first is what keeps it
    // reviewable on its own terms.
    const walk = (dir: string, out: string[] = []): string[] => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        if (entry.name === "node_modules" || entry.name === ".next") continue
        const full = join(dir, entry.name)
        if (entry.isDirectory()) walk(full, out)
        else if (/\.(ts|tsx)$/.test(entry.name)) out.push(full)
      }
      return out
    }
    const callers = ["app", "components", "lib", "scripts"]
      .flatMap((d) => walk(join(process.cwd(), d)))
      .filter((f) => !f.endsWith("lib/consultation/finalisation.ts"))
      .filter((f) => /from\s+["'][^"']*consultation\/finalisation["']/.test(readFileSync(f, "utf8")))
    expect(callers, "finalisation has acquired a caller").toEqual([])
  })

  it("no finalisation API route exists", () => {
    expect(readdirSync(join(process.cwd(), "app/api/consultation")).sort()).toEqual([
      "progress",
      "review",
      "session",
    ])
  })

  it("the state envelope was not extended to persist it", () => {
    /*
     * Phase 3C-C2 decides the persisted shape. The type existing is not a
     * reason to store it.
     *
     * Asserted structurally — no import of the module, and no field declared
     * for it — rather than by scanning the file for the word. The envelope's
     * own prose already discusses the phase it is reserving, and a guard that
     * cannot tell prose from a persisted field would have to be relaxed the
     * first time either changed. These two assertions are the actual rule.
     */
    const envelope = readFileSync(join(process.cwd(), "lib/consultation/session-envelope.ts"), "utf8")
    expect(envelope, "the envelope imports the module").not.toMatch(
      /from\s+["'][^"']*finalisation["']/i,
    )
    expect(envelope, "the envelope declares a finalisation field").not.toMatch(
      /\bfinalis\w*\s*\??\s*:/i,
    )
  })
})

/* ══ The Science Contract version ══════════════════════════════════════════ */

describe("the Science Contract version is pinned metadata", () => {
  it("is exactly v1.0", () => {
    // Pinned so a future v2.0 adjudication has to be a deliberate change here
    // rather than silently reusing v1 metadata on newly frozen records.
    expect(SCIENCE_CONTRACT_VERSION).toBe("science-contract-v1.0")
  })

  it("adding it changed no contract decision", () => {
    const source = readFileSync(join(process.cwd(), "lib/consultation/science-contract.ts"), "utf8")
    // The gates are still open and nothing is marked reviewed — the constant is
    // metadata, not an adjudication.
    expect(source).not.toContain('scienceReview: "reviewed"')
    expect(source).toContain("SPECIALIST_REVIEW")
  })
})
