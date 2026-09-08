import {
  canWithdrawAnswer,
  continueGate,
  continueLocally,
  goNext,
  isEditingFromReview,
  isReviewing,
  optionalSkipOnContinue,
  returnToReview,
  skipOptional,
  withdrawOptionalAnswer,
  type ConsultationSessionState,
} from "@/lib/consultation/session"
import type { FinaliseOutcome, ReviewOutcome, SaveOutcome } from "./consultation-persistence"

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
 *   2. flush the pending mutations and REFUSE TO MOVE if they did not land;
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
 * ══ POSITION IS NOT THE ONLY THING THAT MOVES ═══════════════════════════════
 *
 * Leaving Review changes the PHASE as well as the cursor, and the two have to be
 * written together. Persisting an exit as a plain cursor move leaves storage
 * saying `review` while the screen shows ordinary questions, and since the
 * stored pair (phase, cursor) is the whole resumable editing state, the next
 * load reads that exit as a Review edit. So `commitMove` takes the state being
 * left as well as the one being entered, and asks the server for the retreat
 * when the transition is a real one.
 *
 * ══ THE ENGINE STILL DECIDES WHERE ══════════════════════════════════════════
 *
 * Nothing below computes a next question, judges an answer or evaluates
 * completeness. That is `lib/consultation/session.ts` over the canonical
 * Phase 3A engine, and this only sequences persistence around it.
 */

export interface NavigationDeps {
  /** Send everything still queued. False means something did not land. */
  flush: () => Promise<boolean>
  persistCursor: (questionId: string | null) => Promise<SaveOutcome>
  /**
   * Record a deliberate optional skip.
   *
   * QUEUED, not sent — it shares the one-in-flight-per-question ordering with
   * answer saves. Sending it directly is the race this parameter exists to
   * remove: an answer already on the wire would land after the skip and
   * resurrect the value the customer had just chosen to pass, because the
   * server's answer action un-skips by design.
   */
  queueSkip: (questionId: string, currentQuestionId?: string | null) => void
  /** Ask the SERVER whether Review may be entered. It decides, not this module. */
  requestReview: () => Promise<ReviewOutcome>
  /** The one phase retreat: review → questions, at a named applicable question. */
  leaveReview: (questionId: string) => Promise<SaveOutcome>
  /** Ask the SERVER to seal the Consultation. Takes nothing — see the adapter. */
  finalise: () => Promise<FinaliseOutcome>
}

export type NavigationOutcome =
  /** Move to this state. Position already persisted. */
  | { status: "moved"; state: ConsultationSessionState }
  /** Stay here — the engine refused. Carries the message to announce. */
  | { status: "refused"; state: ConsultationSessionState }
  /** Nothing was stored. Keep the customer where they are and say so. */
  | { status: "save-failed" }

/** True when this transition is a real exit from Review, not a move within it. */
function isLeavingReview(
  from: ConsultationSessionState,
  to: ConsultationSessionState,
): boolean {
  return from.phase === "review" && to.phase === "questions"
}

/**
 * Persist a position, then move to it.
 *
 * Three destinations, and they are written differently on purpose:
 *
 *   into Review     — a REQUEST. The server re-derives completeness and may
 *                     refuse, in which case it names the question to go back to
 *                     and this returns the customer THERE rather than reporting
 *                     an error: nothing has gone wrong from their point of view,
 *                     they simply have an answer left to give.
 *   out of Review   — the explicit retreat, so phase and cursor land together.
 *   anywhere else   — a plain cursor write.
 */
export async function commitMove(
  from: ConsultationSessionState,
  to: ConsultationSessionState,
  deps: NavigationDeps,
): Promise<NavigationOutcome> {
  // A refusal from the engine has no position to record: the customer has not
  // moved, so there is nothing for the server to be told.
  if (to.validationError) return { status: "refused", state: to }

  if (isReviewing(to)) {
    const outcome = await deps.requestReview()
    if (outcome.ok) return { status: "moved", state: to }

    if ("incomplete" in outcome && outcome.incomplete.firstQuestionId) {
      const target = outcome.incomplete.firstQuestionId
      const back: ConsultationSessionState = {
        ...to,
        phase: "questions",
        currentQuestionId: target,
        validationError: null,
      }
      // If storage already says `review`, being sent back is an EXIT and has to
      // be stored as one. This is the branch-open edit: the customer was in
      // Review, changed a parent, and a required branch opened behind them.
      const saved = isLeavingReview(from, back)
        ? await deps.leaveReview(target)
        : await deps.persistCursor(target)
      return saved.ok ? { status: "moved", state: back } : { status: "save-failed" }
    }

    return { status: "save-failed" }
  }

  if (isLeavingReview(from, to) && to.currentQuestionId) {
    const saved = await deps.leaveReview(to.currentQuestionId)
    return saved.ok ? { status: "moved", state: to } : { status: "save-failed" }
  }

  const saved = await deps.persistCursor(to.currentQuestionId)
  return saved.ok ? { status: "moved", state: to } : { status: "save-failed" }
}

/**
 * Continue.
 *
 * From an ordinary question, the next one. From a Review edit, back to the
 * Review list — but only if the Consultation is still complete, because the
 * edit may have opened a required branch behind them.
 *
 * An applicable OPTIONAL question left empty is recorded as a deliberate skip on
 * the way past, so it is stored the same way the Skip button stores it. The
 * customer was asked and chose to move on; that is not the same as never having
 * reached the question, and only one of the two is true.
 */
export async function continueFrom(
  state: ConsultationSessionState,
  deps: NavigationDeps,
): Promise<NavigationOutcome> {
  const gate = continueGate(state)
  if (!gate.allowed) {
    // Nothing is queued and nothing is persisted on a refusal. A save here
    // would store an answer the projection has already said it will not accept.
    return { status: "refused", state: { ...state, validationError: gate.reason } }
  }

  // The skip is QUEUED before the flush, so it is part of what has to land
  // before the move. `continueLocally` then applies the identical transition
  // the preview applies — one definition, so the two cannot drift.
  const passing = optionalSkipOnContinue(state)
  if (passing) deps.queueSkip(passing)

  if (!(await deps.flush())) return { status: "save-failed" }

  return commitMove(state, continueLocally(state), deps)
}

/**
 * Move past an OPTIONAL question without answering it.
 *
 * The skip goes through the same queue as an answer, then the flush confirms it
 * landed before anything moves — for the same reason the answer does. A customer
 * who returns must find the question in the state they left it, and
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

  deps.queueSkip(questionId)
  if (!(await deps.flush())) return { status: "save-failed" }

  return commitMove(
    state,
    isEditingFromReview(skipped) ? returnToReview(skipped) : goNext(skipped),
    deps,
  )
}

/**
 * Withdraw a previously supplied OPTIONAL answer, from Review.
 *
 * ══ THE ORDER IS THE POINT ══════════════════════════════════════════════════
 *
 * Queue, flush, and only THEN apply locally. Removing the answer from the
 * screen first and hoping the write lands is the one thing this must not do:
 * the customer would watch their disclosure disappear while the server still
 * held it, and the next resume would put it back. Better to leave it visible
 * and say the removal did not save.
 *
 * The skip goes through the SAME per-question queue as an answer, so an answer
 * still in flight cannot land afterwards and resurrect the value the customer
 * has just asked to remove — the server's answer action clears the skip marker
 * by design, which is exactly the race that ordering closes.
 *
 * ══ ONE MUTATION, INCLUDING THE POSITION ════════════════════════════════════
 *
 * Nothing moves, and the request SAYS so: the skip carries an explicit `null`
 * cursor, because "the customer is on the Review list" is a fact only the
 * client holds and the server would otherwise have to guess. It is one request
 * rather than a skip followed by a cursor repair, so there is no in-between
 * state where the answer is gone and the position is wrong — a repair that
 * failed on its own would leave exactly that, and the customer would come back
 * to an edit of the answer they had just removed.
 */
export async function withdrawFrom(
  state: ConsultationSessionState,
  questionId: string,
  deps: NavigationDeps,
): Promise<NavigationOutcome> {
  // The engine decides whether this is withdrawable — applicable, optional and
  // currently answered. Asking the server to record a skip the engine would not
  // make is the disagreement this architecture exists to prevent.
  if (!canWithdrawAnswer(state, questionId)) return { status: "refused", state }

  deps.queueSkip(questionId, null)
  if (!(await deps.flush())) return { status: "save-failed" }

  return { status: "moved", state: withdrawOptionalAnswer(state, questionId) }
}


/* ══ Finishing ═════════════════════════════════════════════════════════════ */

export type FinaliseAttempt =
  /** Sealed. The Consultation is finished and cannot be changed again. */
  | { status: "finalised" }
  /** The pending answers could not be saved, so nothing was sealed. */
  | { status: "save-failed" }
  /** The server refused. `kind` says whether retrying could ever help. */
  | { status: "refused"; kind: "incomplete" | "retryable" | "refused" }

/**
 * Finish the Consultation: flush first, then seal — Phase 3C-C2B.
 *
 * ══ WHY THE ORDER IS THE WHOLE FUNCTION ═════════════════════════════════════
 *
 * The customer's last answer may still be sitting in the autosave debounce
 * while they look at the Review list. Sealing first would freeze a record that
 * is missing it — permanently, because the seal is write-once — and the
 * evidence would be a Report built from an answer the customer can see on
 * their own screen. So the queue is flushed, and the seal is attempted ONLY if
 * that flush is confirmed.
 *
 * A failed flush is not a failed finalisation. Nothing is sent, the customer
 * stays on Review with their answers visible, and they can try again.
 *
 * ══ WHY THE SERVER IS STILL THE AUTHORITY ═══════════════════════════════════
 *
 * Completeness is not checked here. It is re-derived inside the finalise route
 * immediately before the write, because a verdict computed in a browser is a
 * verdict about a state the server may not have.
 */
export async function finaliseFrom(deps: NavigationDeps): Promise<FinaliseAttempt> {
  if (!(await deps.flush())) return { status: "save-failed" }

  const outcome = await deps.finalise()
  if (outcome.ok) return { status: "finalised" }
  return { status: "refused", kind: outcome.kind }
}
