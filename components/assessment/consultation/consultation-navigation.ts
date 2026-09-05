import {
  continueGate,
  goNext,
  isEditingFromReview,
  isReviewing,
  returnToReview,
  skipOptional,
  type ConsultationSessionState,
} from "@/lib/consultation/session"
import type { ReviewOutcome, SaveOutcome } from "./consultation-persistence"

/**
 * Moving through a PERSISTED Consultation — Phase 3C-B.
 *
 * ══ WHY THIS IS NOT INSIDE THE COMPONENT ════════════════════════════════════
 *
 * The ordering here is the whole safety property of persisted mode, and it is
 * three lines of ordinary-looking code:
 *
 *   1. validate locally, so a question that cannot be left never reaches the
 *      network;
 *   2. flush the pending save and REFUSE TO MOVE if it did not land;
 *   3. persist the resulting position before showing it.
 *
 * Each is trivially reversible by accident. Advancing before the flush, or
 * advancing anyway when the flush fails, leaves the customer looking at a later
 * question while the server still holds the earlier one blank — and the next
 * resume then sends them backwards with no explanation. Neither mistake changes
 * what the screen looks like, so neither would be caught by rendering.
 *
 * Living here, as pure async functions over an injected adapter, both are
 * provable against a fake: a reordered flush and a swallowed failure each fail a
 * test rather than a review.
 *
 * ══ THE ENGINE STILL DECIDES WHERE ══════════════════════════════════════════
 *
 * Nothing below computes a next question, judges an answer or evaluates
 * completeness. That is `lib/consultation/session.ts` over the canonical
 * Phase 3A engine, and this only sequences persistence around it.
 */

export interface NavigationDeps {
  /** Send anything still in the debounce window. False means it did not land. */
  flush: () => Promise<boolean>
  persistCursor: (questionId: string | null) => Promise<SaveOutcome>
  persistSkip: (questionId: string) => Promise<SaveOutcome>
  /** Ask the SERVER whether Review may be entered. It decides, not this module. */
  requestReview: () => Promise<ReviewOutcome>
}

export type NavigationOutcome =
  /** Move to this state. Position already persisted. */
  | { status: "moved"; state: ConsultationSessionState }
  /** Stay here — the engine refused. Carries the message to announce. */
  | { status: "refused"; state: ConsultationSessionState }
  /** Nothing was stored. Keep the customer where they are and say so. */
  | { status: "save-failed" }

/**
 * Persist a position, then move to it.
 *
 * Entering Review is a request rather than a write: the server re-derives
 * completeness and may refuse, in which case it names the question to go back
 * to — and this returns the customer THERE rather than reporting an error,
 * because nothing has gone wrong from their point of view. They have an answer
 * left to give.
 */
export async function commitMove(
  next: ConsultationSessionState,
  deps: NavigationDeps,
): Promise<NavigationOutcome> {
  // A refusal from the engine has no position to record: the customer has not
  // moved, so there is nothing for the server to be told.
  if (next.validationError) return { status: "refused", state: next }

  if (isReviewing(next)) {
    const outcome = await deps.requestReview()
    if (outcome.ok) return { status: "moved", state: next }
    if ("incomplete" in outcome && outcome.incomplete.firstQuestionId) {
      return {
        status: "moved",
        state: {
          ...next,
          phase: "questions",
          currentQuestionId: outcome.incomplete.firstQuestionId,
          validationError: null,
        },
      }
    }
    return { status: "save-failed" }
  }

  const saved = await deps.persistCursor(next.currentQuestionId)
  return saved.ok ? { status: "moved", state: next } : { status: "save-failed" }
}

/**
 * Continue.
 *
 * From an ordinary question, the next one. From a Review edit, back to the
 * Review list — but only if the Consultation is still complete, because the
 * edit may have opened a required branch behind them.
 */
export async function continueFrom(
  state: ConsultationSessionState,
  deps: NavigationDeps,
): Promise<NavigationOutcome> {
  const gate = continueGate(state)
  if (!gate.allowed) {
    // Nothing is flushed and nothing is persisted on a refusal. A save here
    // would store an answer the projection has already said it will not accept.
    return { status: "refused", state: { ...state, validationError: gate.reason } }
  }

  if (!(await deps.flush())) return { status: "save-failed" }

  return commitMove(isEditingFromReview(state) ? returnToReview(state) : goNext(state), deps)
}

/**
 * Move past an OPTIONAL question without answering it.
 *
 * The skip is persisted BEFORE the move, for the same reason the answer is: a
 * customer who returns must find the question in the state they left it, and
 * "deliberately skipped" is a different state from "not reached yet".
 */
export async function skipFrom(
  state: ConsultationSessionState,
  questionId: string,
  deps: NavigationDeps,
): Promise<NavigationOutcome> {
  const skipped = skipOptional(state, questionId)
  // Unchanged means the engine refused — a required question, or one the bank
  // does not hold. Persisting a skip the engine would not make is exactly the
  // disagreement this architecture exists to prevent.
  if (skipped === state) return { status: "refused", state }

  if (!(await deps.persistSkip(questionId)).ok) return { status: "save-failed" }

  return commitMove(isEditingFromReview(skipped) ? returnToReview(skipped) : goNext(skipped), deps)
}
