import type {
  ConsultationAnswer,
  ConsultationAnswers,
  ConsultationContext,
  ConsultationQuestion,
} from "./types"
import { CONSULTATION_QUESTION_BANK } from "./question-bank"
import { resolveApplicableQuestions } from "./applicability"
import { validateAnswer } from "./validation"

/**
 * Server-side authority over "is this Consultation finished, and what may be
 * trusted from it" — built now, wired in later.
 *
 * ══ WHY THIS HAS TO BE THE SERVER'S JOB ═════════════════════════════════════
 *
 * Today the client decides when the deep assessment is complete and posts
 * whatever answer map it holds. Three things follow from that, and all three
 * are real:
 *
 *   1. A Consultation can be submitted incomplete and the Report is generated
 *      anyway, from a set with holes in it.
 *   2. An answer to a question the customer was never asked is indistinguishable
 *      from one they were.
 *   3. A branch answer that STOPPED applying — they answered the follow-up, then
 *      went back and changed the trigger — is still in the map, and the Report
 *      reads it as current.
 *
 * (3) is the one that is easiest to dismiss and hardest to notice: nothing
 * errors, the Report is simply about a person who does not exist. Cleaning it
 * up client-side is not sufficient either, because the server cannot verify
 * that the client did.
 *
 * `projectTrustedAnswers` is the fix, and it is a projection rather than a
 * cleanup: it starts from what the bank says was applicable and keeps only what
 * survives, so an answer with no live question behind it is unrepresentable
 * rather than filtered.
 *
 * Neither function is called by `app/api/submit-deep-assessment/route.ts` yet.
 * That is Phase 3B/3C, when the deterministic bank is what customers answer.
 */

export interface ConsultationCompletenessInput {
  /** Defaults to the v1 bank; overridable for a stored question snapshot. */
  questions?: readonly ConsultationQuestion[]
  context: ConsultationContext
  answers: ConsultationAnswers
}

export interface ConsultationCompletenessResult {
  /** Every required applicable question has a valid answer, and none is invalid. */
  complete: boolean
  /** Applicable question ids, in bank order. */
  applicableQuestionIds: readonly string[]
  /** Required + applicable + no valid answer. */
  missingQuestionIds: readonly string[]
  /** Answered, but the answer cannot be trusted. */
  invalidQuestionIds: readonly string[]
  /** Answers present for questions that do not apply — dropped, and named. */
  droppedQuestionIds: readonly string[]
  /** The only answers anything downstream should read. */
  trustedAnswers: ConsultationAnswers
}

/**
 * Validate a whole Consultation.
 *
 * Never throws for an ordinary incomplete set: a Consultation in progress is
 * the normal state of a Consultation, and a thrown error would make "not
 * finished yet" and "something is broken" the same event.
 */
export function validateConsultationAnswers(
  input: ConsultationCompletenessInput,
): ConsultationCompletenessResult {
  const bank = input.questions ?? CONSULTATION_QUESTION_BANK
  const answers = input.answers ?? {}

  const applicable = resolveApplicableQuestions({
    questions: bank,
    context: input.context,
    answers,
  })
  const applicableIds = applicable.map((q) => q.id)
  const applicableSet = new Set(applicableIds)

  const missing: string[] = []
  const invalid: string[] = []
  const trusted: ConsultationAnswers = {}

  for (const q of applicable) {
    const result = validateAnswer(q, answers[q.id])
    if (result.status === "valid") {
      trusted[q.id] = result.value
      continue
    }
    if (result.status === "invalid") {
      invalid.push(q.id)
      continue
    }
    // Missing. Only a problem if the question is required in this run — an
    // adaptive question that applies IS required in this run when it says so.
    if (q.required) missing.push(q.id)
  }

  // Everything the customer sent that no live question accounts for: answers to
  // questions for the other foundation, answers to branches that stopped
  // applying, and ids that were never in the bank at all.
  const dropped = Object.keys(answers).filter((id) => !applicableSet.has(id))

  return {
    complete: missing.length === 0 && invalid.length === 0,
    applicableQuestionIds: applicableIds,
    missingQuestionIds: missing,
    invalidQuestionIds: invalid,
    droppedQuestionIds: dropped,
    trustedAnswers: trusted,
  }
}

/**
 * The answers a Report may be built from, and nothing else.
 *
 * Four properties, in order:
 *
 *   1. only questions that apply under this context and these answers;
 *   2. only values that pass their own question's domain and shape rules;
 *   3. no answer to a branch whose trigger has since changed;
 *   4. no invented defaults — a question with no valid answer is simply absent,
 *      which is a state every downstream branch has to handle anyway.
 *
 * Deliberately the same computation as `validateConsultationAnswers`, exposed
 * separately because the persistence path wants the answers and the UI path
 * wants the diagnosis, and two implementations of "what counts" would
 * eventually disagree about a customer's report.
 */
export function projectTrustedAnswers(input: ConsultationCompletenessInput): ConsultationAnswers {
  return validateConsultationAnswers(input).trustedAnswers
}

/**
 * Trusted answers keyed by semantic answer field rather than question id.
 *
 * The Report architecture should eventually read `rhythm.longestGap`, not
 * `core_rhythm_longest_gap_v1`: that is what lets a question be revised to v2
 * without every reader of its answer having to change. Phase 3A establishes
 * the mapping; it does NOT redesign the Report generator, and nothing consumes
 * this yet.
 */
export function trustedAnswersByField(
  input: ConsultationCompletenessInput,
): Record<string, ConsultationAnswer> {
  const bank = input.questions ?? CONSULTATION_QUESTION_BANK
  const byId = new Map(bank.map((q) => [q.id, q]))
  const trusted = projectTrustedAnswers(input)

  const out: Record<string, ConsultationAnswer> = {}
  for (const [id, value] of Object.entries(trusted)) {
    const field = byId.get(id)?.answerField
    if (field) out[field] = value
  }
  return out
}
