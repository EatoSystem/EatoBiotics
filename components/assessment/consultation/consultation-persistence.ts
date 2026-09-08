import { isAddon } from "@/lib/addon-types"
import { CONSULTATION_FOUNDATIONS } from "@/lib/consultation/types"
import type {
  ConsultationAnswer,
  ConsultationAnswers,
  ConsultationContext,
  ConsultationFoundation,
} from "@/lib/consultation/types"
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
  /**
   * The canonical context, as the SERVER resolved it.
   *
   * Not a caller's opinion. The session route derives this from the settled
   * Stripe session, the paid summary and the stored snapshot, and refuses when
   * any of them disagree — so by the time it reaches here it is the only
   * statement about foundation and lens that has been checked against what was
   * actually paid for. A client that branched on its own context could render a
   * different questionnaire from the one the server will accept answers to.
   */
  context: ConsultationContext
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

/**
 * What came back from asking the server to seal the Consultation.
 *
 * Four cases because the customer's next move differs in each, and collapsing
 * any two would either hide a refusal behind a retry button or offer a retry
 * for something that will never succeed.
 *
 * `handoffId` and `finalisedAt` are the server's identities for the sealed
 * record. They are carried so a caller COULD log or correlate them; the UI
 * shows neither, because neither means anything to the person reading it.
 */
export type FinaliseOutcome =
  | { ok: true; handoffId: string; finalisedAt: string }
  /** Canonical completeness says something is outstanding. Never show success. */
  | { ok: false; kind: "incomplete" }
  /** Transient — a 5xx, a rate limit, or the network. Retrying is reasonable. */
  | { ok: false; kind: "retryable" }
  /** The server refused on trust grounds. Retrying cannot change the answer. */
  | { ok: false; kind: "refused" }

export type ReviewOutcome =
  | { ok: true }
  | { ok: false; incomplete: ReviewRefusal }
  | { ok: false; failed: true }

export interface ConsultationPersistence {
  /** Server-sanitised state. Rejecting is fail-closed — never an empty session. */
  load(): Promise<LoadedConsultationState>
  saveAnswer(questionId: string, value: ConsultationAnswer): Promise<SaveOutcome>
  clearAnswer(questionId: string): Promise<SaveOutcome>
  /**
   * Record an optional question as deliberately passed.
   *
   * `currentQuestionId` states where the customer IS while doing it, and exists
   * because the server cannot infer it. A skip sent without one is resolved
   * against the stored cursor, and for a withdrawal taken from the Review list
   * the stored cursor is `null` — which the server would otherwise have to fill
   * in from somewhere. Passing `null` says "still on the Review list", so the
   * answer, the touched mark, the skip and the position all land in ONE
   * mutation. Omit it for an ordinary skip during the question flow, where the
   * stored cursor already names the question being passed.
   */
  skipOptional(questionId: string, currentQuestionId?: string | null): Promise<SaveOutcome>
  /** Move without changing an answer. `null` means the Review list. */
  saveCursor(questionId: string | null): Promise<SaveOutcome>
  /** Ask the server whether Review may be entered. It decides, not the client. */
  enterReview(): Promise<ReviewOutcome>
  /**
   * Leave Review for a question — the one phase RETREAT the browser may request.
   *
   * Separate from `saveCursor` because the two are different statements. A
   * cursor move inside Review is an edit and must keep the review phase; leaving
   * Review is an exit and must clear it. Persisting an exit as a cursor move is
   * the divergence this exists to close: storage would still say `review` while
   * the screen showed ordinary questions, and the next resume would believe
   * storage.
   */
  leaveReview(questionId: string): Promise<SaveOutcome>
  /**
   * Ask the server to seal the Consultation — Phase 3C-C2B.
   *
   * Takes nothing. Everything the sealed record contains is derived server-side
   * from the settled payment and the stored answers, and a parameter here would
   * be a way for the browser to claim any of it. The route refuses a body
   * carrying trusted fields rather than ignoring them.
   */
  finalise(): Promise<FinaliseOutcome>
}

/* ══ The strict load parser ════════════════════════════════════════════════ */

/**
 * Phase 3C-A's fail-closed rule, applied to the WIRE as well as to storage.
 *
 * The stored-state parser refuses a malformed envelope rather than repairing
 * it, because a value that cannot be characterised must not be overwritten or
 * emptied. A client parser that shrugged malformed fields into defaults would
 * reinstate exactly that fail-open behaviour one layer out: the server would
 * hold answers it refused to describe, and the browser would render a session
 * built from `{}` on top of them.
 *
 * So a payload claiming `kind: "deterministic"` must carry the COMPLETE
 * recognised shape. Anything else throws, and the wrapper shows its load-failure
 * screen. Every field below is CHECKED and then used as it stands: there is
 * deliberately no coalescing default for the answer map, no shape fallback for
 * the id lists, and no fallback for the phase. A guard forbids all three, and
 * naming them in prose here would trip it.
 */

const PHASES: readonly ConsultationPhase[] = ["questions", "review", "ready-for-report"]

const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v)

const isStringArray = (v: unknown): v is string[] =>
  Array.isArray(v) && v.every((s) => typeof s === "string" && s.trim().length > 0)

/**
 * The canonical context, or `null` if this is not one.
 *
 * An unknown lens is REFUSED rather than narrowed to `null`. Those two mean
 * opposite things: `null` is "this customer bought no lens", and an unknown
 * string is "this build does not understand what they bought". Coercing the
 * second into the first would quietly serve a lens-less Consultation to someone
 * who paid for a lens, which is the failure the snapshot check exists to catch.
 */
function readContext(value: unknown): ConsultationContext | null {
  if (!isPlainObject(value)) return null

  const foundation = value.foundation
  if (!CONSULTATION_FOUNDATIONS.includes(foundation as ConsultationFoundation)) return null

  const lens = value.lens
  if (lens !== null && !isAddon(lens)) return null

  return { foundation: foundation as ConsultationFoundation, lens }
}

/** Throws unless the payload is a complete, well-formed deterministic state. */
export function readLoadedConsultationState(data: unknown): LoadedConsultationState {
  const fail = (): never => {
    throw new Error("consultation-load-malformed")
  }

  if (!isPlainObject(data)) return fail()
  if (data.kind !== "deterministic") return fail()
  if (typeof data.bankVersion !== "string" || data.bankVersion.trim().length === 0) return fail()

  const context = readContext(data.context)
  if (!context) return fail()

  if (!isPlainObject(data.candidateAnswers)) return fail()
  if (!isStringArray(data.touchedQuestionIds)) return fail()
  if (!isStringArray(data.skippedOptionalQuestionIds)) return fail()
  if (data.currentQuestionId !== null && typeof data.currentQuestionId !== "string") return fail()
  if (!PHASES.includes(data.phase as ConsultationPhase)) return fail()
  // Guessing this wrong either re-shows Orientation to someone mid-Consultation
  // or hides it from someone who has never seen it.
  if (typeof data.started !== "boolean") return fail()

  return {
    bankVersion: data.bankVersion,
    context,
    candidateAnswers: data.candidateAnswers as ConsultationAnswers,
    touchedQuestionIds: data.touchedQuestionIds,
    skippedOptionalQuestionIds: data.skippedOptionalQuestionIds,
    currentQuestionId: data.currentQuestionId,
    phase: data.phase as ConsultationPhase,
    started: data.started,
  }
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
      // A legacy session, or anything that is not a COMPLETE well-formed
      // deterministic payload, throws rather than degrading to an empty
      // Consultation — the same fail-closed rule the server applies to
      // unreadable stored state.
      return readLoadedConsultationState(await res.json())
    },

    saveAnswer: (questionId, value) => patch({ action: "answer", questionId, value }),
    clearAnswer: (questionId) => patch({ action: "clear", questionId }),
    skipOptional: (questionId, currentQuestionId) =>
      // Sent only when the caller states one. An absent key and an explicit
      // `null` mean different things to the route — "leave the position alone"
      // versus "the position is the Review list" — so the two must not be
      // collapsed into one body.
      patch(
        currentQuestionId === undefined
          ? { action: "skip", questionId }
          : { action: "skip", questionId, currentQuestionId },
      ),
    saveCursor: (currentQuestionId) => patch({ action: "navigate", currentQuestionId }),

    async finalise() {
      try {
        const res = await fetch("/api/consultation/finalise", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          // The session id and nothing else. See the note on the interface.
          body: JSON.stringify({ sessionId }),
        })
        if (res.ok) {
          const data = await res.json().catch(() => null)
          if (data && typeof data.handoffId === "string" && typeof data.finalisedAt === "string") {
            return { ok: true as const, handoffId: data.handoffId, finalisedAt: data.finalisedAt }
          }
          // A 200 whose body we cannot read is not a completion we can show.
          return { ok: false as const, kind: "retryable" as const }
        }
        // 409 is the "not finished yet" refusal and the only one the customer
        // can act on. Every other 4xx is a trust decision: retrying will keep
        // being refused, and the reason string is the server's words, not
        // something to put in front of a customer.
        if (res.status === 409) return { ok: false as const, kind: "incomplete" as const }
        if (res.status >= 500 || res.status === 429) {
          return { ok: false as const, kind: "retryable" as const }
        }
        return { ok: false as const, kind: "refused" as const }
      } catch {
        return { ok: false as const, kind: "retryable" as const }
      }
    },
    leaveReview: (currentQuestionId) => patch({ action: "leave-review", currentQuestionId }),

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
