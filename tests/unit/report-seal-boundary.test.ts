import { describe, it, expect } from "vitest"

import { CONSULTATION_QUESTION_BANK } from "@/lib/consultation/question-bank"
import { resolveApplicableQuestions } from "@/lib/consultation/applicability"
import {
  prepareConsultationFinalisation,
  readConsultationFinalisation,
  type ConsultationFinalisation,
} from "@/lib/consultation/finalisation"
import { createDeterministicConsultationSnapshot, DETERMINISTIC_STATE_KIND, DETERMINISTIC_STATE_SCHEMA_VERSION, type DeterministicConsultationState } from "@/lib/consultation/session-envelope"
import type { ConsultationAnswers, ConsultationFoundation } from "@/lib/consultation/types"
import { composePersonalFoodSystemReport } from "@/lib/report/deterministic/compose"

/**
 * Report refusal is not seal invalidity — Phase 4A-S2 review fix.
 *
 * ══ THE DISTINCTION THIS FILE DEFENDS ═══════════════════════════════════════
 *
 * Report v1 now refuses to interpret a finalisation whose bank identity it was
 * not built against. That is a statement about THIS REPORT VERSION, and it
 * must never become a statement about the seal.
 *
 * A sealed finalisation is the authority for its own handoff. C2B deliberately
 * keeps historical sealed sessions readable when the bank has since moved —
 * `readConsultationFinalisation` never recomputes the digest, and its optional
 * snapshot check compares the seal against the SESSION it belongs to, not
 * against today's bank. If a Report refusal ever started mutating, rebuilding
 * or rejecting a seal, an immutable record would have become a function of
 * whatever the current build happens to think.
 *
 * So: same drifted fixture, two layers, two answers.
 */

const AT = new Date("2026-09-11T09:00:00.000Z")
const HANDOFF = "22222222-2222-4222-8222-222222222222"

function completeAnswers(foundation: ConsultationFoundation): ConsultationAnswers {
  const answers: ConsultationAnswers = {}
  for (let pass = 0; pass < 4; pass += 1) {
    for (const q of resolveApplicableQuestions({
      questions: CONSULTATION_QUESTION_BANK,
      context: { foundation },
      answers,
    })) {
      if (q.id in answers) continue
      if (q.type === "single") answers[q.id] = q.options![0].value
      else if (q.type === "multi") answers[q.id] = [q.options![0].value]
      else if (q.type === "textarea") answers[q.id] = "Fewer rushed mornings."
      else answers[q.id] = q.min ?? 0
    }
  }
  return answers
}

/** A real finalisation, then its stored form with a drifted bank identity. */
function drifted(overrides: { bankVersion?: string; bankFingerprint?: string }) {
  const snapshot = createDeterministicConsultationSnapshot({
    foundation: "you",
    entitledLens: null,
    now: AT,
  })
  const state: DeterministicConsultationState = {
    kind: DETERMINISTIC_STATE_KIND,
    schemaVersion: DETERMINISTIC_STATE_SCHEMA_VERSION,
    candidateAnswers: completeAnswers("you"),
    touchedQuestionIds: [],
    skippedOptionalQuestionIds: [],
    currentQuestionId: null,
    phase: "review",
  }
  const prepared = prepareConsultationFinalisation({ snapshot, state, finalisedAt: AT })
  if (!prepared.ok) throw new Error(`fixture did not finalise: ${prepared.reason}`)

  // The STORED payload, as a row would hold it, with the identity moved.
  const stored = { ...prepared.finalisation, ...overrides }
  return { stored, snapshot }
}

const HISTORICAL_FINGERPRINT = "0123456789abcdef0123456789abcdef"

describe("a Report refusal leaves the seal exactly as it was", () => {
  const { stored, snapshot } = drifted({ bankFingerprint: HISTORICAL_FINGERPRINT })

  it("the seal layer still reads it", () => {
    // The finalisation reader does not recompute the digest, so a historical
    // seal stays readable however far the bank has moved.
    const read = readConsultationFinalisation(stored)
    expect(read.ok, read.ok ? "" : `seal became unreadable: ${read.reason}`).toBe(true)
  })

  it("and returns the stored identity verbatim, not today's", () => {
    const read = readConsultationFinalisation(stored)
    expect(read.ok).toBe(true)
    if (!read.ok) return
    expect(read.finalisation.bankFingerprint).toBe(HISTORICAL_FINGERPRINT)
    expect(read.finalisation.bankVersion).toBe(stored.bankVersion)
  })

  it("it still matches its own session, because identity is session-relative", () => {
    // The snapshot check asks "was this written for this session", never "is
    // this current". Against its own (equally historical) session it passes.
    const read = readConsultationFinalisation(stored, {
      foundation: snapshot.foundation,
      entitledLens: snapshot.entitledLens,
      bankVersion: stored.bankVersion,
      bankFingerprint: HISTORICAL_FINGERPRINT,
    })
    expect(read.ok).toBe(true)
  })

  it("while the Report declines to interpret it", () => {
    const result = composePersonalFoodSystemReport({
      finalisation: stored as ConsultationFinalisation,
      handoffId: HANDOFF,
    })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.reason).toBe("bank-fingerprint-unsupported")
  })

  it("and the refusal did not touch the payload", () => {
    const before = JSON.stringify(stored)
    composePersonalFoodSystemReport({
      finalisation: stored as ConsultationFinalisation,
      handoffId: HANDOFF,
    })
    // Composition is pure. Said here as well as in the composer's own tests
    // because THIS is the claim that matters for an immutable record.
    expect(JSON.stringify(stored)).toBe(before)
  })
})

describe("an unknown bank generation behaves the same way", () => {
  const { stored } = drifted({ bankVersion: "consultation-v9" })

  it("reads at the seal layer", () => {
    expect(readConsultationFinalisation(stored).ok).toBe(true)
  })

  it("and refuses at the Report layer, with the other reason", () => {
    const result = composePersonalFoodSystemReport({
      finalisation: stored as ConsultationFinalisation,
      handoffId: HANDOFF,
    })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.reason).toBe("bank-unsupported")
  })
})
