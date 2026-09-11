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
 * ══ THREE OUTCOMES, KEPT APART ══════════════════════════════════════════════
 *
 * `not-enumerated`    — this is not an enumerated question in THIS build:
 *                       either unknown here, or free text whose answer is
 *                       prose rather than option values. Looking such an
 *                       answer up as an option is a category error.
 * `values`            — enumerated, in bank option order. May be empty.
 * `unsupported-value` — the seal holds a value this bank does not offer.
 *
 * Same discipline as `templateFor`'s `undefined`-vs-`null`: absence of a
 * concept and an answered-nothing are different facts, and collapsing them is
 * how a coverage gap becomes a silent skip.
 *
 * ══ WHY AN UNSUPPORTED VALUE IS REPORTED AND NOT DROPPED ════════════════════
 *
 * The first version intersected the stored answer with today's options and
 * returned what survived, calling that fail-closed. It is not. A finalisation
 * is an IMMUTABLE TRUSTED INPUT: every value in it was valid when the
 * customer gave it. Silently discarding one produces a Report that is quietly
 * short of something they said — the worst available outcome, because it
 * looks exactly like a Report they answered less of.
 *
 * So the value is surfaced, and `composePersonalFoodSystemReport` refuses.
 * The seal is not touched; the Report simply declines to interpret it. In
 * practice this is unreachable while the bank-identity boundary
 * (`report-bank.ts`) holds, which is the point — it is the second wall.
 */
export type CanonicalValuesResult =
  | { readonly kind: "not-enumerated" }
  | { readonly kind: "values"; readonly values: readonly string[] }
  | { readonly kind: "unsupported-value"; readonly values: readonly string[] }

export function canonicalValues(
  answers: ConsultationAnswers,
  questionId: string,
): CanonicalValuesResult {
  const question = findConsultationQuestion(questionId)
  if (!question?.options || question.options.length === 0) return { kind: "not-enumerated" }

  const raw = answers[questionId]
  const chosen = Array.isArray(raw)
    ? raw.filter((v): v is string => typeof v === "string")
    : typeof raw === "string"
      ? [raw]
      : []
  if (chosen.length === 0) return { kind: "values", values: [] }

  const offered = question.options.map((o) => o.value)
  const known = new Set(offered)
  const unsupported = chosen.filter((v) => !known.has(v))
  if (unsupported.length > 0) return { kind: "unsupported-value", values: unsupported }

  // Ordered BY the bank, not merely filtered against it: the stored array is
  // the order of somebody's clicks, and two customers who chose the same
  // things must read the same Report.
  const selected = new Set(chosen)
  return { kind: "values", values: offered.filter((v) => selected.has(v)) }
}
