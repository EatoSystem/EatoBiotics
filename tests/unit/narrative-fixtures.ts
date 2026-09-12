import { CONSULTATION_QUESTION_BANK } from "@/lib/consultation/question-bank"
import { resolveApplicableQuestions } from "@/lib/consultation/applicability"
import {
  prepareConsultationFinalisation,
  type ConsultationFinalisation,
} from "@/lib/consultation/finalisation"
import {
  createDeterministicConsultationSnapshot,
  DETERMINISTIC_STATE_KIND,
  DETERMINISTIC_STATE_SCHEMA_VERSION,
  type DeterministicConsultationState,
} from "@/lib/consultation/session-envelope"
import type { ConsultationAnswers, ConsultationFoundation } from "@/lib/consultation/types"
import { composePersonalFoodSystemReport } from "@/lib/report/deterministic/compose"
import type { PersonalFoodSystemReportV1 } from "@/lib/report/deterministic/report-types"
import type {
  NarrativeRewriteRequest,
  NarrativeRewriteResponse,
  NarrativeRewriter,
} from "@/lib/report/narrative/types"

/**
 * Shared fixtures for the Phase 4A-S3 narrative suite.
 *
 * Reports are composed by the REAL S2 composer from real answers through the
 * real finalisation builder — the same path a sealed row takes. A hand-written
 * Report literal would let the narrative layer be tested against a shape that
 * never occurs, which is how a layer passes its own tests and fails in
 * production.
 *
 * Rewriters here are FAKES, and deliberately so: S3 wires no provider, and a
 * test that reached a network would be testing the network.
 */

const AT = new Date("2026-09-10T09:00:00.000Z")
const HANDOFF = "11111111-1111-4111-8111-111111111111"

export function completeAnswers(
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
      else if (q.type === "textarea") answers[q.id] = "Fewer rushed mornings."
      else answers[q.id] = q.min ?? 0
    }
  }
  return answers
}

export function finalise(
  foundation: ConsultationFoundation,
  overrides: ConsultationAnswers = {},
): ConsultationFinalisation {
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
  const result = prepareConsultationFinalisation({ snapshot, state, finalisedAt: AT })
  if (!result.ok) throw new Error(`fixture did not finalise: ${result.reason}`)
  return result.finalisation
}

export function reportFor(
  foundation: ConsultationFoundation,
  overrides: ConsultationAnswers = {},
): PersonalFoodSystemReportV1 {
  const result = composePersonalFoodSystemReport({
    finalisation: finalise(foundation, overrides),
    handoffId: HANDOFF,
  })
  if (!result.ok) throw new Error(`fixture did not compose: ${result.reason} — ${result.detail}`)
  return result.report
}

/* ══ Fakes ═════════════════════════════════════════════════════════════════ */

export interface RecordingRewriter extends NarrativeRewriter {
  /** Every payload that was handed over, in call order. */
  readonly calls: NarrativeRewriteRequest[]
}

/**
 * Records what it was sent and returns whatever `reply` says.
 *
 * The recorder is the strongest guard in the suite: the privacy claim is not
 * "the payload builder looks minimal", it is "here is every object that
 * crossed the boundary, and this is all that was in them".
 */
export function recordingRewriter(
  reply: (request: NarrativeRewriteRequest) => unknown = (r) => ({ rewritten: r.text }),
): RecordingRewriter {
  const calls: NarrativeRewriteRequest[] = []
  return {
    calls,
    async rewrite(request: NarrativeRewriteRequest): Promise<NarrativeRewriteResponse> {
      calls.push(request)
      return reply(request) as NarrativeRewriteResponse
    },
  }
}

/** Returns the sentence unchanged — the model's always-acceptable answer. */
export function echoRewriter(): RecordingRewriter {
  return recordingRewriter((r) => ({ rewritten: r.text }))
}

/** Throws. Every throw is one reason, because the consequence is identical. */
export function throwingRewriter(): RecordingRewriter {
  return recordingRewriter(() => {
    throw new Error("provider exploded")
  })
}

/** Never resolves, so a deadline is the only way out. */
export function hangingRewriter(): RecordingRewriter {
  const calls: NarrativeRewriteRequest[] = []
  return {
    calls,
    rewrite(request: NarrativeRewriteRequest): Promise<NarrativeRewriteResponse> {
      calls.push(request)
      return new Promise<NarrativeRewriteResponse>(() => {})
    },
  }
}

/** Applies a transformation to the sentence — the adversarial shape. */
export function mutatingRewriter(mutate: (text: string) => string): RecordingRewriter {
  return recordingRewriter((r) => ({ rewritten: mutate(r.text) }))
}
