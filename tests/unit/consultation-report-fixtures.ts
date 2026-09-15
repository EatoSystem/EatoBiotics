import { CONSULTATION_QUESTION_BANK } from "@/lib/consultation/question-bank"
import { resolveApplicableQuestions } from "@/lib/consultation/applicability"
import { prepareConsultationFinalisation } from "@/lib/consultation/finalisation"
import {
  createDeterministicConsultationSnapshot,
  DETERMINISTIC_STATE_KIND,
  DETERMINISTIC_STATE_SCHEMA_VERSION,
  type DeterministicConsultationState,
} from "@/lib/consultation/session-envelope"
import type { AddonType } from "@/lib/addon-types"
import type { ConsultationAnswers, ConsultationFoundation } from "@/lib/consultation/types"
import { composePersonalFoodSystemReport } from "@/lib/report/deterministic/compose"
import { serialiseReport } from "@/lib/report/deterministic/serialise"

import { reportDigest } from "@/lib/report/persisted/digest"
import type {
  AssessmentRowForHistory,
  PersistedReportRow,
} from "@/lib/report/persisted/internal/historical-read"
import type { ReportPersistenceClient } from "@/lib/report/persisted/testing/report-seam"

/**
 * Real sealed rows, built by the real builders.
 *
 * A hand-written finalisation literal would prove the persistence layer works
 * on a shape that may never occur. Everything below goes through the canonical
 * C1 builder and the S2 composer, so what the tests store is what a sealed row
 * would actually hold.
 */

export const SEALED_AT = new Date("2026-09-10T09:00:00.000Z")
export const ASSESSMENT_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"
export const HANDOFF_ID = "11111111-1111-4111-8111-111111111111"

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
      else if (q.type === "textarea") answers[q.id] = "Fewer rushed mornings."
      else answers[q.id] = q.min ?? 0
    }
  }
  return answers
}

export interface SealedFixture {
  readonly row: AssessmentRowForHistory
  readonly canonicalText: string
  readonly digest: string
  readonly reportRow: PersistedReportRow
}

/** A sealed `deep_assessments` row, plus the Report it would produce. */
export function sealedFixture(options?: {
  foundation?: ConsultationFoundation
  lens?: AddonType | null
  overrides?: ConsultationAnswers
  handoffId?: string
  assessmentId?: string
}): SealedFixture {
  const foundation = options?.foundation ?? "you"
  const lens = options?.lens ?? null
  const handoffId = options?.handoffId ?? HANDOFF_ID
  const assessmentId = options?.assessmentId ?? ASSESSMENT_ID

  const snapshot = createDeterministicConsultationSnapshot({
    foundation,
    entitledLens: lens,
    now: SEALED_AT,
  })
  const working: DeterministicConsultationState = {
    kind: DETERMINISTIC_STATE_KIND,
    schemaVersion: DETERMINISTIC_STATE_SCHEMA_VERSION,
    candidateAnswers: completeAnswers(foundation, options?.overrides ?? {}),
    touchedQuestionIds: [],
    skippedOptionalQuestionIds: [],
    currentQuestionId: null,
    phase: "review",
  }
  const prepared = prepareConsultationFinalisation({
    snapshot,
    state: working,
    finalisedAt: SEALED_AT,
  })
  if (!prepared.ok) throw new Error(`fixture did not finalise: ${prepared.reason}`)

  const sealedState: DeterministicConsultationState = {
    ...working,
    phase: "ready-for-report",
    currentQuestionId: null,
  }

  const row: AssessmentRowForHistory = {
    id: assessmentId,
    questions: JSON.parse(JSON.stringify(snapshot)),
    answers: JSON.parse(JSON.stringify(sealedState)),
    consultation_finalisation: JSON.parse(JSON.stringify(prepared.finalisation)),
    consultation_handoff_id: handoffId,
  }

  // A lens seal composes nothing — the composer refuses it — so those fixtures
  // carry no Report, and the helpers below return empty text for them.
  const composed = composePersonalFoodSystemReport({
    finalisation: prepared.finalisation,
    handoffId,
  })
  const canonicalText = composed.ok ? serialiseReport(composed.report) : ""
  const digest = composed.ok ? reportDigest(canonicalText) : ""

  return {
    row,
    canonicalText,
    digest,
    reportRow: {
      consultation_handoff_id: handoffId,
      assessment_id: assessmentId,
      canonical_report: canonicalText,
      canonical_report_sha256: digest,
    },
  }
}

/** An UNSEALED row: a Consultation still at Review. */
export function unsealedFixture(): AssessmentRowForHistory {
  const sealed = sealedFixture()
  const state = JSON.parse(JSON.stringify(sealed.row.answers)) as DeterministicConsultationState
  return {
    id: ASSESSMENT_ID,
    questions: sealed.row.questions,
    answers: { ...state, phase: "review" },
    consultation_finalisation: null,
    consultation_handoff_id: null,
  }
}

/* ══ A database that behaves like one ══════════════════════════════════════ */

export interface FakeDbOptions {
  assessment?: AssessmentRowForHistory | null
  report?: PersistedReportRow | null
  assessmentError?: string
  reportError?: string
  /** Fires once, just before the INSERT — the way a race actually happens. */
  onInsert?: (store: { report: PersistedReportRow | null }) => void
}

export interface FakeDb {
  client: ReportPersistenceClient
  store: { report: PersistedReportRow | null }
  inserts: number
  readReports: number
}

/**
 * The narrow client the core uses, with real unique-constraint behaviour.
 *
 * `insertReport` refuses a second row for the same handoff or the same
 * assessment with a `23505`, exactly as the database would — which is what
 * makes the race tests mean anything.
 */
export function fakeDb(options: FakeDbOptions = {}): FakeDb {
  const state: FakeDb = {
    store: { report: options.report ?? null },
    inserts: 0,
    readReports: 0,
    client: {
      async readAssessment() {
        if (options.assessmentError) return { ok: false, detail: options.assessmentError }
        return { ok: true, row: options.assessment ?? null }
      },
      async readReport() {
        state.readReports += 1
        if (options.reportError) return { ok: false, detail: options.reportError }
        return { ok: true, row: state.store.report }
      },
      async insertReport({ handoffId, assessmentId, canonicalText, digest }) {
        state.inserts += 1
        options.onInsert?.(state.store)
        const existing = state.store.report
        if (
          existing &&
          (existing.consultation_handoff_id === handoffId || existing.assessment_id === assessmentId)
        ) {
          return { ok: false, uniqueViolation: true, detail: "duplicate key value" }
        }
        state.store.report = {
          consultation_handoff_id: handoffId,
          assessment_id: assessmentId,
          canonical_report: canonicalText,
          canonical_report_sha256: digest,
        }
        return { ok: true }
      },
    },
  }
  return state
}
