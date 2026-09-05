import type { ConsultationAnswer, ConsultationAnswers } from "@/lib/consultation/types"
import type { ConsultationPhase } from "@/lib/consultation/session-envelope"

/**
 * The persistence contract for a deterministic Consultation — Phase 3C-B.
 *
 * ══ WHY AN INTERFACE RATHER THAN FETCH CALLS IN COMPONENTS ══════════════════
 *
 * Two reasons, and the second is the load-bearing one.
 *
 * First, the ephemeral preview must stay network-free. It renders the same
 * question components, and if those components knew endpoint URLs the preview
 * would either start making requests or need a flag to suppress them — and a
 * suppressed request is one refactor away from an unsuppressed one.
 *
 * Second, this is the whole surface a test has to replace. Everything below can
 * be exercised against a fake adapter with no Stripe session, no database row
 * and no production write, which is what lets a contract that is forbidden to
 * go live still be proven to work.
 *
 * `null` is the ephemeral case: no adapter, no persistence, nothing to fail.
 */

export interface LoadedConsultationState {
  bankVersion: string
  candidateAnswers: ConsultationAnswers
  touchedQuestionIds: readonly string[]
  skippedOptionalQuestionIds: readonly string[]
  currentQuestionId: string | null
  phase: ConsultationPhase
  /**
   * Has this Consultation been started?
   *
   * Server-derived, because it cannot be recovered from the fields beside it:
   * resume repairs a null cursor to the first outstanding question, so by the
   * time this payload exists a new session and one paused on question one look
   * the same. It is the only thing that separates Orientation from resume.
   */
  started: boolean
}

/** Why a review-entry attempt was refused, and where to send the customer. */
export interface ReviewRefusal {
  firstQuestionId: string | null
  missingQuestionIds: readonly string[]
  invalidQuestionIds: readonly string[]
}

export type SaveOutcome = { ok: true } | { ok: false; retryable: boolean }

export type ReviewOutcome =
  | { ok: true }
  | { ok: false; incomplete: ReviewRefusal }
  | { ok: false; failed: true }

export interface ConsultationPersistence {
  /** Server-sanitised state. Rejecting is fail-closed — never an empty session. */
  load(): Promise<LoadedConsultationState>
  saveAnswer(questionId: string, value: ConsultationAnswer): Promise<SaveOutcome>
  clearAnswer(questionId: string): Promise<SaveOutcome>
  skipOptional(questionId: string): Promise<SaveOutcome>
  /** Move without changing an answer. `null` means the Review list. */
  saveCursor(questionId: string | null): Promise<SaveOutcome>
  /** Ask the server whether Review may be entered. It decides, not the client. */
  enterReview(): Promise<ReviewOutcome>
}

/**
 * The HTTP adapter.
 *
 * The only place in the deterministic experience that knows an endpoint exists.
 * A guard asserts no component imports these paths directly.
 */
export function createHttpConsultationPersistence(sessionId: string): ConsultationPersistence {
  async function patch(body: Record<string, unknown>): Promise<SaveOutcome> {
    try {
      const res = await fetch("/api/consultation/progress", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...body, sessionId }),
      })
      if (res.ok) return { ok: true }
      // Same reasoning as the legacy autosave queue: 5xx and rate limiting are
      // transient, but a 4xx means this exact request will keep being refused,
      // so retrying only delays telling the customer it did not save. The
      // response body is never read — it is the server's words, not something
      // to put in front of a customer.
      return { ok: false, retryable: res.status >= 500 || res.status === 429 }
    } catch {
      return { ok: false, retryable: true }
    }
  }

  return {
    async load() {
      const res = await fetch(`/api/consultation/session?session_id=${encodeURIComponent(sessionId)}`)
      if (!res.ok) throw new Error("consultation-load-failed")
      const data = await res.json()
      // A legacy session, or anything that is not a well-formed deterministic
      // payload, throws rather than degrading to an empty Consultation — the
      // same fail-closed rule the server applies to unreadable stored state.
      if (
        !data ||
        data.kind !== "deterministic" ||
        typeof data.bankVersion !== "string" ||
        // Strict rather than defaulted. Guessing it wrong either re-shows
        // Orientation to someone mid-Consultation or hides it from someone who
        // has never seen it, and a payload without it is not a shape this build
        // understands.
        typeof data.started !== "boolean"
      ) {
        throw new Error("consultation-not-deterministic")
      }
      return {
        bankVersion: data.bankVersion,
        started: data.started,
        candidateAnswers: (data.candidateAnswers ?? {}) as ConsultationAnswers,
        touchedQuestionIds: Array.isArray(data.touchedQuestionIds) ? data.touchedQuestionIds : [],
        skippedOptionalQuestionIds: Array.isArray(data.skippedOptionalQuestionIds)
          ? data.skippedOptionalQuestionIds
          : [],
        currentQuestionId:
          typeof data.currentQuestionId === "string" ? data.currentQuestionId : null,
        phase: (data.phase ?? "questions") as ConsultationPhase,
      }
    },

    saveAnswer: (questionId, value) => patch({ action: "answer", questionId, value }),
    clearAnswer: (questionId) => patch({ action: "clear", questionId }),
    skipOptional: (questionId) => patch({ action: "skip", questionId }),
    saveCursor: (currentQuestionId) => patch({ action: "navigate", currentQuestionId }),

    async enterReview() {
      try {
        const res = await fetch("/api/consultation/review", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        })
        if (res.ok) return { ok: true }
        if (res.status === 409) {
          const data = await res.json().catch(() => null)
          // A 409 carrying question ids is the "not finished yet" refusal, and
          // it is the one case where the response body IS for the customer's
          // benefit: it says which question to go back to.
          if (data && Array.isArray(data.missingQuestionIds)) {
            return {
              ok: false,
              incomplete: {
                firstQuestionId:
                  typeof data.firstQuestionId === "string" ? data.firstQuestionId : null,
                missingQuestionIds: data.missingQuestionIds,
                invalidQuestionIds: Array.isArray(data.invalidQuestionIds)
                  ? data.invalidQuestionIds
                  : [],
              },
            }
          }
        }
        return { ok: false, failed: true }
      } catch {
        return { ok: false, failed: true }
      }
    },
  }
}
