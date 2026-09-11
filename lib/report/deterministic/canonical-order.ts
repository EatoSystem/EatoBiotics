import { findConsultationQuestion } from "@/lib/consultation/question-bank"
import type { ConsultationAnswers } from "@/lib/consultation/types"

/**
 * The one place the Report decides what order an answer's values are in —
 * Phase 4A-S2 review fix.
 *
 * ══ WHY THIS MODULE EXISTS ══════════════════════════════════════════════════
 *
 * A multi-select answer is stored as the array the customer's clicks happened
 * to build. That array is a record of INTERACTION, not of meaning: the same
 * two selections made in the other sequence are the same answer. Reading it in
 * stored order therefore lets the Report differ between two Consultations that
 * said exactly the same thing — which is the determinism guarantee failing
 * quietly, in the direction hardest to notice.
 *
 * The canonical order is the frozen bank's own option order. It is authored,
 * reviewed, versioned into the bank fingerprint, and identical for every
 * customer.
 *
 * Three copies of this rule previously lived in the composer and the priority
 * resolver, and one of them was reading stored order. One implementation is
 * the fix; three that agree today is the defect waiting to come back.
 *
 * ══ THE TWO EMPTY ANSWERS, KEPT APART ═══════════════════════════════════════
 *
 * `null`  — this is not an enumerated question in THIS build: either unknown
 *           here, or free text whose answer is prose rather than option
 *           values. Looking such an answer up as an option is a category
 *           error, and the caller must handle it as one.
 * `[]`    — an enumerated question that selected nothing.
 *
 * Same discipline as `templateFor`'s `undefined`-vs-`null`: absence of a
 * concept and an answered-nothing are different facts, and collapsing them is
 * how a coverage gap becomes a silent skip.
 */
export function canonicalValues(
  answers: ConsultationAnswers,
  questionId: string,
): readonly string[] | null {
  const question = findConsultationQuestion(questionId)
  if (!question?.options || question.options.length === 0) return null

  const raw = answers[questionId]
  const chosen = Array.isArray(raw)
    ? raw.filter((v): v is string => typeof v === "string")
    : typeof raw === "string"
      ? [raw]
      : []
  if (chosen.length === 0) return []

  /*
   * Intersected with the bank, not merely sorted by it. A stored value this
   * build's bank does not offer is dropped: the seal recorded it under a bank
   * version whose meaning this build cannot vouch for, and paraphrasing a
   * value we cannot describe is worse than omitting it. Fail-closed, and
   * pinned by a test so the behaviour is a decision rather than a side effect.
   */
  const selected = new Set(chosen)
  return question.options.map((o) => o.value).filter((v) => selected.has(v))
}
