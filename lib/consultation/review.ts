import type {
  ConsultationAnswer,
  ConsultationAnswers,
  ConsultationContext,
  ConsultationQuestion,
  ConsultationSection,
} from "./types"
import { SECTION_META } from "./types"
import { CONSULTATION_QUESTION_BANK, optionLabelFor, questionTextFor } from "./question-bank"
import { resolveApplicableQuestions } from "./applicability"
import { validateAnswer } from "./validation"

/**
 * The Review model — Phase 3C-B.
 *
 * ══ DERIVED EVERY TIME, NEVER STORED ════════════════════════════════════════
 *
 * Review is a projection of (bank + context + candidate answers), rebuilt on
 * every render. Persisting a review list would be a second copy of "what was
 * asked", and it would be stale in exactly the case that matters: the moment a
 * customer edits a parent answer and a branch closes behind them. Deriving it
 * makes the closed branch disappear by construction rather than by cleanup.
 *
 * ══ CUSTOMER WORDING ONLY ══════════════════════════════════════════════════
 *
 * Every string here comes from the canonical bank through `questionTextFor` and
 * `optionLabelFor`, so the Review shows what the customer actually read, in the
 * right voice for their foundation. Nothing internal — no ids, no answer
 * fields, no governance metadata — reaches the display records, and no answer
 * is rewritten, summarised or interpreted. Review reflects; it does not explain.
 *
 * ══ WHAT AN UNANSWERED OPTIONAL QUESTION IS ════════════════════════════════
 *
 * Three states, kept apart on purpose: answered, deliberately skipped, and not
 * yet reached. None of them may be rendered as "No", "None" or "Prefer not to
 * say" — those are answers a customer could have given and did not.
 */

export type ReviewAnswerState = "answered" | "skipped" | "unanswered"

export interface ReviewItem {
  questionId: string
  /** Customer-facing question text, in this foundation's voice. */
  question: string
  /** Customer-facing answer, already resolved to labels. Empty when unanswered. */
  answer: readonly string[]
  state: ReviewAnswerState
  required: boolean
}

export interface ReviewSection {
  section: ConsultationSection
  /** Section heading, in this foundation's voice. */
  title: string
  items: readonly ReviewItem[]
}

export interface ConsultationReview {
  sections: readonly ReviewSection[]
  /** Every applicable question id, in bank order — for tests and navigation. */
  questionIds: readonly string[]
  /** Applicable, required and still without a valid answer. */
  missingRequiredIds: readonly string[]
  complete: boolean
}

export interface BuildReviewInput {
  context: ConsultationContext
  candidateAnswers: ConsultationAnswers
  skippedOptionalQuestionIds?: readonly string[]
  questions?: readonly ConsultationQuestion[]
}

/** The customer-facing rendering of one validated answer. */
function displayAnswer(
  question: ConsultationQuestion,
  value: ConsultationAnswer,
  foundation: ConsultationContext["foundation"],
): string[] {
  if (question.type === "textarea") return [String(value)]
  if (question.type === "slider") return [String(value)]

  const options = question.options ?? []
  const labelFor = (v: string) => {
    const option = options.find((o) => o.value === v)
    // A value with no option cannot happen for a validated answer, but showing
    // the raw semantic value would leak an internal token to the customer, so
    // it is dropped rather than printed.
    return option ? optionLabelFor(option, foundation) : null
  }

  if (Array.isArray(value)) {
    return value.map(labelFor).filter((l): l is string => l !== null)
  }
  const single = labelFor(String(value))
  return single ? [single] : []
}

/**
 * Build the Review for the current state.
 *
 * Only questions that apply RIGHT NOW appear. A candidate answer to a closed
 * branch is still stored — Phase 3C-A keeps it deliberately — but it is not
 * part of what the customer is reviewing, because they are not being asked it.
 */
export function buildConsultationReview(input: BuildReviewInput): ConsultationReview {
  const bank = input.questions ?? CONSULTATION_QUESTION_BANK
  const { foundation } = input.context
  const skipped = new Set(input.skippedOptionalQuestionIds ?? [])

  const applicable = resolveApplicableQuestions({
    questions: bank,
    context: input.context,
    answers: input.candidateAnswers,
  })

  const sections: ReviewSection[] = []
  const missingRequiredIds: string[] = []

  for (const question of applicable) {
    const result = validateAnswer(question, input.candidateAnswers[question.id])

    let state: ReviewAnswerState
    let answer: string[] = []
    if (result.status === "valid") {
      state = "answered"
      answer = displayAnswer(question, result.value, foundation)
    } else {
      // An invalid stored value is shown as unanswered rather than printed: it
      // is not something the customer can be asked to confirm, and the
      // projection would refuse it anyway.
      state = skipped.has(question.id) ? "skipped" : "unanswered"
      if (question.required) missingRequiredIds.push(question.id)
    }

    const item: ReviewItem = {
      questionId: question.id,
      question: questionTextFor(question, foundation),
      answer,
      state,
      required: question.required,
    }

    const existing = sections.find((s) => s.section === question.section)
    if (existing) {
      ;(existing.items as ReviewItem[]).push(item)
      continue
    }
    const meta = SECTION_META[question.section]
    sections.push({
      section: question.section,
      title: foundation === "family" ? meta.familyTitle : meta.title,
      items: [item],
    })
  }

  return {
    sections,
    questionIds: applicable.map((q) => q.id),
    missingRequiredIds,
    complete: missingRequiredIds.length === 0,
  }
}
