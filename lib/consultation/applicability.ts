import type {
  ConsultationAnswers,
  ConsultationApplicability,
  ConsultationContext,
  ConsultationQuestion,
} from "./types"
import { CONSULTATION_QUESTION_BANK } from "./question-bank"
import { validateAnswer } from "./validation"

/**
 * The one deterministic resolver for "which questions apply right now".
 *
 * ══ WHY THERE CAN ONLY BE ONE ═══════════════════════════════════════════════
 *
 * The legacy model splices a `followUp` question into the queue inside the
 * client (components/assessment/deep/deep-assessment-client.tsx). That makes
 * the client the only thing that knows the branch happened, which means resume,
 * a future Answer Review, server completeness validation and the report's own
 * view of what was asked can all disagree with each other — and with the
 * client — about whether a question exists. None of them can be right, because
 * only one of them ran the splice.
 *
 * This module is that answer instead, and it is pure: same bank, same context,
 * same answers, same result, on the server and in the browser. Phase 3B's
 * client sequence, Phase 3C's review screen and the eventual server
 * completeness check are all intended to call THIS, so that "was this question
 * asked?" has exactly one implementation.
 *
 * Nothing calls it yet. Phase 3A ships it and tests it; Phase 3B wires it in.
 *
 * ══ SINGLE PASS ═════════════════════════════════════════════════════════════
 *
 * `validateConsultationBank` enforces that a trigger question appears before
 * the question it triggers, and that the graph is acyclic. So walking the bank
 * in order and consulting decisions already made is enough — there is no
 * iterate-to-fixed-point, and a rule can never be evaluated against a parent
 * whose own applicability is still unknown.
 */

/** A question is only reachable if its trigger was itself asked. */
function evaluateRule(
  rule: ConsultationApplicability,
  parent: ConsultationQuestion | undefined,
  answers: ConsultationAnswers,
  applicableSoFar: ReadonlySet<string>,
): boolean {
  // A trigger that was never asked cannot have produced a live answer. Without
  // this, a stale answer left behind by an earlier route through the
  // Consultation would keep resurrecting a branch that no longer applies.
  if (!parent || !applicableSoFar.has(rule.questionId)) return false

  /*
   * ── The trigger answer must be valid AS A WHOLE ──────────────────────────
   *
   * Not merely "contains a value that matches". An earlier version of this
   * function domain-checked each value individually, which left `includes`
   * open: `["health-event", "not-a-real-option"]` revealed the branch because
   * one member happened to be legitimate. Per-value checking cannot see
   * duplicates, cannot see an exclusive value combined with a substantive one,
   * and cannot see a below-minimum selection — all of which are answers the
   * rest of the system refuses to trust.
   *
   * So applicability now asks exactly the question the trusted projection
   * asks, using exactly the same function. That is the point: a second, more
   * permissive notion of "valid enough to branch on" is how a malformed answer
   * ends up governing which questions a customer is asked while being dropped
   * from the answers a Report is built from.
   *
   * Fail-closed in every direction:
   *   missing trigger  → hidden (a `notEquals` rule must not read "unknown"
   *                      as "not equal", which is why this is a guard rather
   *                      than a fall-through)
   *   invalid trigger  → hidden
   *   valid + matches  → shown
   *   valid, no match  → hidden
   */
  const parentAnswer = validateAnswer(parent, answers[rule.questionId])
  if (parentAnswer.status !== "valid") return false
  const value = parentAnswer.value

  switch (rule.operator) {
    case "equals":
      return typeof value === "string" && rule.values.includes(value)
    case "notEquals":
      return typeof value === "string" && !rule.values.includes(value)
    case "includes":
      return Array.isArray(value) && value.some((v) => rule.values.includes(v))
    default:
      // Unknown operator: reveal nothing. An operator added to the type but
      // not to this switch must not silently mean "always applicable".
      return false
  }
}

export interface ResolveApplicableInput {
  /** Defaults to the v1 bank. Overridable so tests and a future stored
   *  question snapshot can resolve against the set that was actually asked. */
  questions?: readonly ConsultationQuestion[]
  context: ConsultationContext
  answers?: ConsultationAnswers
}

/**
 * The questions that apply, in bank order.
 *
 * Foundation first — a `you`-only question is not merely unasked for a Family
 * Consultation, it is unreachable — then each adaptive question's declared
 * rule, evaluated against answers already given.
 */
export function resolveApplicableQuestions(
  input: ResolveApplicableInput,
): readonly ConsultationQuestion[] {
  const bank = input.questions ?? CONSULTATION_QUESTION_BANK
  const answers = input.answers ?? {}
  const { foundation } = input.context

  const applicable: ConsultationQuestion[] = []
  const applicableIds = new Set<string>()
  const byId = new Map(bank.map((q) => [q.id, q]))

  for (const q of bank) {
    if (!q.foundations.includes(foundation)) continue
    if (q.applicableWhen) {
      const parent = byId.get(q.applicableWhen.questionId)
      if (!evaluateRule(q.applicableWhen, parent, answers, applicableIds)) continue
    }
    applicable.push(q)
    applicableIds.add(q.id)
  }

  return applicable
}

/** Just the ids, in bank order. */
export function resolveApplicableQuestionIds(input: ResolveApplicableInput): readonly string[] {
  return resolveApplicableQuestions(input).map((q) => q.id)
}

/**
 * True when this question applies under the given context and answers.
 *
 * Convenience over the resolver rather than a second implementation — a second
 * implementation is exactly what this module exists to prevent.
 */
export function isQuestionApplicable(
  questionId: string,
  input: ResolveApplicableInput,
): boolean {
  return resolveApplicableQuestions(input).some((q) => q.id === questionId)
}
