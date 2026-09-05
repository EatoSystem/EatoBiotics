import type { AddonType } from "@/lib/addon-types"

import type { ConsultationAnswers, ConsultationContext, ConsultationFoundation } from "./types"
import { resolveConsultationBank } from "./bank-registry"
import {
  createDeterministicConsultationSnapshot,
  readDeterministicConsultationSnapshot,
  readDeterministicConsultationState,
  sanitiseCandidateAnswers,
  snapshotIsResolvable,
  EMPTY_DETERMINISTIC_STATE,
  type DeterministicConsultationSnapshot,
  type DeterministicConsultationState,
} from "./session-envelope"
import { resolveApplicableQuestions } from "./applicability"
import { validateConsultationAnswers } from "./completeness"

/**
 * Opening and resuming a deterministic Consultation — Phase 3C-A.
 *
 * ══ NOT WIRED TO ANY LIVE PAID SESSION ══════════════════════════════════════
 *
 * Nothing here is called by `/assessment/deep` for a real customer. Phase 3C-A
 * builds and proves the contract; activating it is a separate, later decision,
 * and `tests/unit/consultation-persistence-contract.test.ts` asserts the live
 * page still resolves paid traffic to the legacy client.
 *
 * ══ WHY THE OUTCOMES ARE TYPED RATHER THAN THROWN ═══════════════════════════
 *
 * Every refusal here is a different thing to tell a caller: a legacy session is
 * ordinary and expected, a foundation conflict is a trust failure, an unknown
 * bank is a deployment problem. Collapsing them into an exception would make the
 * route answer the same way to all three, and the only safe generic answer is
 * "refuse", which would strand legacy customers.
 */

export type InitOutcome =
  /** No snapshot stored — a deterministic session may be opened. */
  | { status: "initialise"; snapshot: DeterministicConsultationSnapshot }
  /** The stored snapshot is ours and agrees with Stripe. Reuse it. */
  | { status: "reuse"; snapshot: DeterministicConsultationSnapshot }
  /** A legacy generated question array is stored. Leave it completely alone. */
  | { status: "legacy_session" }
  /** Stored deterministic session disagrees with the settled Stripe context. */
  | { status: "context_conflict"; field: "foundation" | "entitledLens" }
  /** Stored snapshot names a bank this build does not hold, or has drifted. */
  | { status: "bank_unavailable"; bankVersion: string }
  /** Present, non-null, and not characterisable as either format. */
  | { status: "unreadable" }

export interface InitInput {
  /** `deep_assessments.questions` as stored. Unknown shape by definition. */
  persistedQuestions: unknown
  /** Derived from the SETTLED Stripe session — never from a request body. */
  foundation: ConsultationFoundation
  entitledLens: AddonType | null
  now?: Date
}

/**
 * Decide what to do with a session's stored question column.
 *
 * Idempotent by design: calling it twice with the same trusted context returns
 * `reuse` the second time, so a retried request cannot install a second
 * snapshot or move an existing one.
 */
export function resolveDeterministicInit(input: InitInput): InitOutcome {
  const { persistedQuestions, foundation, entitledLens } = input

  // A legacy array is recognised FIRST and returned untouched. Ordering matters:
  // every other branch below can decline, and a decline that reached a legacy
  // row would be a decline about someone else's data.
  if (Array.isArray(persistedQuestions)) return { status: "legacy_session" }

  if (persistedQuestions === null || persistedQuestions === undefined) {
    return {
      status: "initialise",
      snapshot: createDeterministicConsultationSnapshot({ foundation, entitledLens, now: input.now }),
    }
  }

  const snapshot = readDeterministicConsultationSnapshot(persistedQuestions)
  if (!snapshot) return { status: "unreadable" }

  if (!snapshotIsResolvable(snapshot)) {
    return { status: "bank_unavailable", bankVersion: snapshot.bankVersion }
  }

  // Stripe is the authority on both. A stored session that disagrees is never
  // rewritten to match — the disagreement is the signal, and silently adopting
  // the new value would change which questions a paid customer is asked
  // mid-Consultation.
  if (snapshot.foundation !== foundation) {
    return { status: "context_conflict", field: "foundation" }
  }
  if (snapshot.entitledLens !== entitledLens) {
    return { status: "context_conflict", field: "entitledLens" }
  }

  return { status: "reuse", snapshot }
}

/* ══ Resume ════════════════════════════════════════════════════════════════ */

export interface ResumedSession {
  snapshot: DeterministicConsultationSnapshot
  context: ConsultationContext
  state: DeterministicConsultationState
  /** Ids present in the applicable sequence right now, in bank order. */
  applicableQuestionIds: readonly string[]
  /** Only what survives projection. Never what was merely stored. */
  trustedAnswers: ConsultationAnswers
  droppedUnknownIds: readonly string[]
  droppedInvalidIds: readonly string[]
  /** True when the stored cursor no longer applied and was repaired. */
  cursorRepaired: boolean
}

export type ResumeOutcome =
  | { status: "ok"; session: ResumedSession }
  | { status: "legacy_session" }
  | { status: "not_deterministic" }
  | { status: "bank_unavailable"; bankVersion: string }

/**
 * Rebuild a deterministic session from storage, server-side.
 *
 * ══ THE STORED ROW IS DATA, THE BANK IS AUTHORITY ═══════════════════════════
 *
 * The legacy path treats the persisted question array as the questionnaire —
 * it IS the questionnaire, because Claude generated it per session. The
 * deterministic path must not copy that: the bank named by the snapshot is
 * authoritative, and the row contributes only the customer's own answers and
 * where they had got to. So this returns questions resolved from the bank, and
 * never hands back a stored question list as if it were a set to render.
 *
 * ══ THE CURSOR IS REPAIRED, NOT TRUSTED ════════════════════════════════════
 *
 * A stored `currentQuestionId` may have stopped applying while the customer was
 * away — they changed a parent answer on another device, or the branch closed.
 * Rather than dropping them at a question that no longer exists, or at an
 * arbitrary index, resume lands them on the first applicable question they have
 * not validly answered, and says it repaired the cursor.
 */
export function resumeDeterministicSession(input: {
  persistedQuestions: unknown
  persistedAnswers: unknown
}): ResumeOutcome {
  if (Array.isArray(input.persistedQuestions)) return { status: "legacy_session" }

  const snapshot = readDeterministicConsultationSnapshot(input.persistedQuestions)
  if (!snapshot) return { status: "not_deterministic" }

  const bank = resolveConsultationBank(snapshot.bankVersion)
  if (!bank || !snapshotIsResolvable(snapshot)) {
    return { status: "bank_unavailable", bankVersion: snapshot.bankVersion }
  }

  const stored = readDeterministicConsultationState(input.persistedAnswers) ?? EMPTY_DETERMINISTIC_STATE
  const { answers, droppedUnknownIds, droppedInvalidIds } = sanitiseCandidateAnswers(
    stored.candidateAnswers,
    snapshot.bankVersion,
  )

  const context: ConsultationContext = {
    foundation: snapshot.foundation,
    lens: snapshot.entitledLens,
  }

  const applicable = resolveApplicableQuestions({ questions: bank, context, answers })
  const applicableIds = applicable.map((q) => q.id)
  const completeness = validateConsultationAnswers({ questions: bank, context, answers })

  // A stored answer counts as touched: a saved slider value is an answer the
  // customer already gave, and asking them to move it again to re-assert it
  // would be the untouched-default rule applied backwards.
  const touched = new Set<string>([...stored.touchedQuestionIds, ...Object.keys(answers)])

  const storedCursorApplies =
    stored.currentQuestionId !== null && applicableIds.includes(stored.currentQuestionId)

  const firstOutstanding =
    applicableIds.find(
      (id) =>
        completeness.missingQuestionIds.includes(id) || completeness.invalidQuestionIds.includes(id),
    ) ?? null

  const currentQuestionId = storedCursorApplies
    ? stored.currentQuestionId
    : (firstOutstanding ?? applicableIds[applicableIds.length - 1] ?? null)

  return {
    status: "ok",
    session: {
      snapshot,
      context,
      state: {
        ...stored,
        candidateAnswers: answers,
        touchedQuestionIds: [...touched].filter((id) => applicableIds.includes(id) || id in answers),
        skippedOptionalQuestionIds: stored.skippedOptionalQuestionIds.filter((id) =>
          bank.some((q) => q.id === id && !q.required),
        ),
        currentQuestionId,
      },
      applicableQuestionIds: applicableIds,
      trustedAnswers: completeness.trustedAnswers,
      droppedUnknownIds,
      droppedInvalidIds,
      cursorRepaired: stored.currentQuestionId !== null && !storedCursorApplies,
    },
  }
}
