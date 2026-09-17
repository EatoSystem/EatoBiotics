import "server-only"

import { resolveApplicableQuestions } from "@/lib/consultation/applicability"
import { prepareConsultationFinalisation } from "@/lib/consultation/finalisation"
import { CONSULTATION_QUESTION_BANK } from "@/lib/consultation/question-bank"
import {
  createDeterministicConsultationSnapshot,
  DETERMINISTIC_STATE_KIND,
  DETERMINISTIC_STATE_SCHEMA_VERSION,
  type DeterministicConsultationState,
} from "@/lib/consultation/session-envelope"
import type { ConsultationAnswers, ConsultationFoundation } from "@/lib/consultation/types"
import { composePersonalFoodSystemReport } from "@/lib/report/deterministic/compose"
import type { PersonalFoodSystemReportV1 } from "@/lib/report/deterministic/report-types"

/**
 * A fixture Report for the preview page — Phase 4B-S2.
 *
 * ══ WHY IT COMPOSES FOR REAL ════════════════════════════════════════════════
 *
 * Every step is the production one: real question bank, real applicability
 * resolution, real finalisation builder, real composer. A hand-written Report
 * literal would be a shape that never occurs, and a design signed off against
 * one is a design signed off against a fiction — the exact reason
 * `tests/unit/narrative-fixtures.ts` composes rather than mocks.
 *
 * ══ WHY IT IS NOT IN tests/ ═════════════════════════════════════════════════
 *
 * The preview page is application code and cannot import a test file. The logic
 * is duplicated from the test fixture rather than the test fixture being lifted
 * into `lib/`, because moving it would put a module whose whole job is to
 * manufacture plausible answers on the import graph of the real application.
 * Forty lines of duplication is the cheaper risk.
 *
 * ══ WHAT IT IS NOT ══════════════════════════════════════════════════════════
 *
 * Not a customer, not a database read, not a claim, not a seal. The answers
 * below are invented here and the handoff id is a fixed literal. Nothing this
 * file produces may ever be persisted, delivered or presented as somebody's
 * document — the page that renders it is fenced to non-production runtimes for
 * that reason.
 *
 * `server-only` is imported so an accidental client import fails the build
 * rather than shipping the composer to a browser.
 */

/** Fixed, so the preview renders identically on every request and every build. */
const FINALISED_AT = new Date("2026-09-10T09:00:00.000Z")

/** A literal, and obviously not a real handoff. Never written anywhere. */
const FIXTURE_HANDOFF_ID = "11111111-1111-4111-8111-111111111111"

/**
 * The first option of every applicable question, plus whatever is overridden.
 *
 * Four passes because applicability is conditional: answering one question can
 * bring another into scope, and the bank is not deep enough to need more.
 */
function fixtureAnswers(
  foundation: ConsultationFoundation,
  overrides: ConsultationAnswers,
): ConsultationAnswers {
  const answers: ConsultationAnswers = { ...overrides }
  for (let pass = 0; pass < 4; pass += 1) {
    for (const question of resolveApplicableQuestions({
      questions: CONSULTATION_QUESTION_BANK,
      context: { foundation },
      answers,
    })) {
      if (question.id in answers) continue
      if (question.type === "single") answers[question.id] = question.options![0].value
      else if (question.type === "multi") answers[question.id] = [question.options![0].value]
      else if (question.type === "textarea") answers[question.id] = "Fewer rushed mornings."
      else answers[question.id] = question.min ?? 0
    }
  }
  return answers
}

/**
 * Compose a fixture Report, or throw.
 *
 * Throws rather than returning a refusal: the only caller is a preview page
 * that has already proven it is not production, and a fixture that stops
 * composing is a broken build, not a customer-facing outcome to be handled.
 */
export function previewReport(
  foundation: ConsultationFoundation,
  overrides: ConsultationAnswers = {},
): PersonalFoodSystemReportV1 {
  const snapshot = createDeterministicConsultationSnapshot({
    foundation,
    entitledLens: null,
    now: FINALISED_AT,
  })
  const state: DeterministicConsultationState = {
    kind: DETERMINISTIC_STATE_KIND,
    schemaVersion: DETERMINISTIC_STATE_SCHEMA_VERSION,
    candidateAnswers: fixtureAnswers(foundation, overrides),
    touchedQuestionIds: [],
    skippedOptionalQuestionIds: [],
    currentQuestionId: null,
    phase: "review",
  }

  const finalised = prepareConsultationFinalisation({
    snapshot,
    state,
    finalisedAt: FINALISED_AT,
  })
  if (!finalised.ok) throw new Error(`preview fixture did not finalise: ${finalised.reason}`)

  const composed = composePersonalFoodSystemReport({
    finalisation: finalised.finalisation,
    handoffId: FIXTURE_HANDOFF_ID,
  })
  if (!composed.ok) {
    throw new Error(`preview fixture did not compose: ${composed.reason} — ${composed.detail}`)
  }
  return composed.report
}
