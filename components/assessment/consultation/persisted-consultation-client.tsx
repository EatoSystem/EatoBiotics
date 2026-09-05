"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import { resolveConsultationBank } from "@/lib/consultation/bank-registry"
import { createAnswerAutosave, type AutosaveStatus } from "@/lib/assessment/answer-autosave"
import { SECTION_META } from "@/lib/consultation/types"
import type { ConsultationAnswer, ConsultationContext } from "@/lib/consultation/types"
import {
  begin,
  canGoBack as canGoBackFrom,
  createConsultationSession,
  currentQuestion as currentQuestionOf,
  editFromReview,
  goBack,
  isEditingFromReview,
  isLastQuestion,
  isReviewing,
  isSectionStart,
  progress as progressOf,
  setAnswer,
  type ConsultationSessionState,
} from "@/lib/consultation/session"
import { buildConsultationReview } from "@/lib/consultation/review"
import { ConsultationOrientation } from "./consultation-orientation"
import { ConsultationProgressBar } from "./consultation-progress"
import { ConsultationQuestionView } from "./consultation-question"
import { ConsultationReviewView } from "./consultation-review"
import {
  createHttpConsultationPersistence,
  type ConsultationPersistence,
  type LoadedConsultationState,
} from "./consultation-persistence"
import {
  commitMove,
  continueFrom,
  skipFrom,
  type NavigationDeps,
  type NavigationOutcome,
} from "./consultation-navigation"

/**
 * The persistence-aware Consultation — Phase 3C-B, DORMANT.
 *
 * ══ NOT WIRED TO ANY LIVE PAID SESSION ══════════════════════════════════════
 *
 * `/assessment/deep` still resolves every real paid customer to the legacy
 * client, and a guard asserts this component has no route caller. Phase 3C-B
 * builds and proves the architecture; activating it is a separate decision.
 *
 * ══ WHAT IT ADDS TO THE EPHEMERAL CLIENT ════════════════════════════════════
 *
 * Only persistence. The rendering, the state machine, Review and Edit are all
 * the same modules the preview uses — this loads server state, hydrates the
 * session from it, and owns the save queue. Nothing below decides what a
 * question is or whether an answer is valid.
 *
 * ══ SERVER STATE IS AUTHORITY ON LOAD ═══════════════════════════════════════
 *
 * Hydration takes the server's sanitised state whole. There is no merge with a
 * local cache: the server already dropped unknown ids and invalid values, and
 * re-introducing a browser's copy would put back exactly what it removed.
 *
 * ══ FAIL CLOSED ════════════════════════════════════════════════════════════
 *
 * A load that fails — a 409, a legacy row, an unreadable state, a bank this
 * build does not hold — becomes an error screen, never an empty Consultation.
 * Starting someone from scratch on top of answers that exist but could not be
 * read is the worst available outcome.
 */

/** Shown when the Consultation could not be loaded. No technical detail (§40). */
const LOAD_FAILED_MESSAGE = "We couldn't load your Consultation. Please try again."

/**
 * Shown when Continue could not store the answer.
 *
 * The customer's answer stays on screen and stays editable. Advancing on a
 * failed save would leave the server holding an earlier value than the one they
 * are looking at, and the next resume would silently send them backwards.
 */
const SAVE_FAILED_MESSAGE = "We couldn't save that yet. Try Continue again."

export type PersistedLoadState =
  | { status: "loading" }
  | { status: "loaded"; session: ConsultationSessionState; fresh: boolean }
  | { status: "failed" }

export interface UsePersistedConsultationResult {
  load: PersistedLoadState
  saveStatus: AutosaveStatus
  /** Queue an answer save. Never blocks the keystroke. */
  queueAnswer: (questionId: string, value: ConsultationAnswer) => void
  /**
   * Everything navigation needs, in the shape `consultation-navigation` takes.
   *
   * Handed over whole rather than as loose callbacks so the component cannot
   * assemble a partial set — a Continue wired to `persistCursor` but not to
   * `flush` would compile and be exactly the defect §17 is about.
   */
  navigation: NavigationDeps
}

/**
 * Load, hydrate and persist one deterministic Consultation.
 *
 * The save queue is `createAnswerAutosave` — the same one the legacy paid
 * questionnaire uses, and reused rather than reimplemented because its
 * invariant is not obvious and was expensive to get right: at most one request
 * in flight per question, newest value last. Two answers typed quickly into the
 * same question must not race, and a weaker debounce would lose the newer one.
 */
export function usePersistedConsultation(
  context: ConsultationContext,
  persistence: ConsultationPersistence,
): UsePersistedConsultationResult {
  const [load, setLoad] = useState<PersistedLoadState>({ status: "loading" })
  const [saveStatus, setSaveStatus] = useState<AutosaveStatus>("idle")

  const autosave = useMemo(
    () =>
      createAnswerAutosave({
        onStatus: setSaveStatus,
        send: async (questionId, value) =>
          persistence.saveAnswer(questionId, value as ConsultationAnswer),
      }),
    [persistence],
  )

  // Cancel pending timers on unmount. It does NOT claim the pending value was
  // saved — an unmount is not a save, and the status is left as it stands.
  useEffect(() => () => autosave.cancel(), [autosave])

  const cancelled = useRef(false)
  useEffect(() => {
    cancelled.current = false
    ;(async () => {
      try {
        const { session, fresh } = hydratePersistedSession(context, await persistence.load())
        if (!cancelled.current) setLoad({ status: "loaded", session, fresh })
      } catch {
        if (!cancelled.current) setLoad({ status: "failed" })
      }
    })()
    return () => {
      cancelled.current = true
    }
  }, [context, persistence])

  const queueAnswer = useCallback(
    (questionId: string, value: ConsultationAnswer) => {
      autosave.queue(questionId, value)
    },
    [autosave],
  )

  /**
   * Send anything still in the debounce window.
   *
   * Returns whether advancing is sound. Continue calls this BEFORE moving,
   * because advancing on an unsaved answer would leave the customer looking at
   * a later question while the server still has the earlier one blank — and a
   * resume would then send them backwards with no explanation.
   */
  const flush = useCallback(async () => {
    try {
      return await autosave.flush()
    } catch {
      return false
    }
  }, [autosave])

  const navigation = useMemo<NavigationDeps>(
    () => ({
      flush,
      persistCursor: (questionId) => persistence.saveCursor(questionId),
      persistSkip: (questionId) => persistence.skipOptional(questionId),
      requestReview: () => persistence.enterReview(),
    }),
    [flush, persistence],
  )

  return { load, saveStatus, queueAnswer, navigation }
}

/* ══ Hydration ═════════════════════════════════════════════════════════════ */

/**
 * Turn server state into a positioned session, or refuse.
 *
 * Pure and exported so the fail-closed rules are testable without a browser:
 * a bank this build does not hold and a phase this build cannot render both
 * THROW rather than degrading to an empty Consultation. Starting someone from
 * scratch on top of answers that exist is the worst available outcome, and it
 * is the outcome every convenient default produces.
 */
export function hydratePersistedSession(
  context: ConsultationContext,
  state: LoadedConsultationState,
): { session: ConsultationSessionState; fresh: boolean } {
  const bank = resolveConsultationBank(state.bankVersion)
  // Not a fallback to the current bank: resolving a session against a bank it
  // was not answered against is the exact failure the fingerprint prevents.
  if (!bank) throw new Error("unknown-bank")
  if (state.phase === "ready-for-report") throw new Error("unsupported-phase")

  // The server derives `started` from the state as STORED — see the note on it.
  // Re-deriving it here would be re-deriving it from a repaired cursor, which
  // cannot tell a new session from one paused on question one.
  const fresh = !state.started

  return {
    fresh,
    session: createConsultationSession({
      context,
      questions: bank,
      answers: state.candidateAnswers,
      touchedQuestionIds: state.touchedQuestionIds,
      skippedOptionalQuestionIds: state.skippedOptionalQuestionIds,
      phase: state.phase,
      // A brand-new session starts on Orientation. A returning one resumes
      // where the server says it was — never at question one, and never on an
      // Orientation screen they have already read.
      startAtQuestionId: fresh ? null : state.currentQuestionId,
    }),
  }
}

/* ══ The component ═════════════════════════════════════════════════════════ */

interface Props {
  /** The settled Stripe checkout session this Consultation belongs to. */
  sessionId: string
  context: ConsultationContext
  /** Test seam. Production supplies the HTTP adapter from `sessionId`. */
  persistence?: ConsultationPersistence
}

export function PersistedConsultationClient({ sessionId, context, persistence }: Props) {
  const adapter = useMemo(
    () => persistence ?? createHttpConsultationPersistence(sessionId),
    [persistence, sessionId],
  )
  const { load, saveStatus, queueAnswer, navigation } = usePersistedConsultation(context, adapter)

  if (load.status === "loading") {
    return (
      <div className="mx-auto max-w-2xl px-6 py-24">
        <p role="status" aria-live="polite" className="text-base text-muted-foreground">
          Loading your Consultation…
        </p>
      </div>
    )
  }

  if (load.status === "failed") {
    // Deliberately the same message for every cause. A customer cannot act on
    // "the stored state could not be parsed", and naming the failure would put
    // the shape of their record on screen.
    return (
      <div className="mx-auto max-w-2xl px-6 py-24">
        <p role="alert" className="text-base leading-relaxed text-foreground">
          {LOAD_FAILED_MESSAGE}
        </p>
      </div>
    )
  }

  return (
    <PersistedConsultationSession
      key={sessionId}
      initial={load.session}
      saveStatus={saveStatus}
      queueAnswer={queueAnswer}
      navigation={navigation}
    />
  )
}

interface SessionProps extends Omit<UsePersistedConsultationResult, "load"> {
  /**
   * The hydrated session, already positioned. Orientation vs resume was decided
   * during load from the server's `started`, so this component never has to ask
   * again — and cannot get it wrong from a repaired cursor.
   */
  initial: ConsultationSessionState
}

/**
 * The loaded Consultation.
 *
 * Split from the loader so the session state is initialised ONCE, from state
 * that already exists. A single component would have to seed `useState` from a
 * value that is undefined on the first render, and the usual repair for that —
 * an effect that overwrites state after hydration — is how a customer's first
 * keystroke gets thrown away.
 */
function PersistedConsultationSession({
  initial,
  saveStatus,
  queueAnswer,
  navigation,
}: SessionProps) {
  const [state, setState] = useState<ConsultationSessionState>(initial)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const question = currentQuestionOf(state)
  const progress = useMemo(() => progressOf(state), [state])
  const { foundation } = state.context

  const review = useMemo(
    () =>
      buildConsultationReview({
        context: state.context,
        candidateAnswers: state.answers,
        skippedOptionalQuestionIds: [...state.skipped],
        questions: state.questions,
      }),
    [state],
  )

  function handleAnswer(id: string, value: ConsultationAnswer) {
    setSaveError(null)
    setState((s) => setAnswer(s, id, value))
    // Queued, not awaited. A save that blocked the keystroke would make typing
    // feel like the network.
    queueAnswer(id, value)
  }

  /**
   * Apply one navigation outcome.
   *
   * The decision — validate, flush, refuse or move — belongs to
   * `consultation-navigation`, which is where it can be proven. This only
   * reflects the result on screen, so a reordering of those steps has to happen
   * in the module that tests them rather than quietly here.
   */
  async function apply(run: () => Promise<NavigationOutcome>) {
    setBusy(true)
    try {
      const outcome = await run()
      if (outcome.status === "save-failed") {
        // The customer's answer stays on screen and stays editable. Nothing is
        // discarded and nothing pretends to have been stored.
        setSaveError(SAVE_FAILED_MESSAGE)
        return
      }
      setSaveError(null)
      setState(outcome.state)
    } finally {
      setBusy(false)
    }
  }

  const sectionTitle = progress.current
    ? foundation === "family"
      ? SECTION_META[progress.current.section].familyTitle
      : SECTION_META[progress.current.section].title
    : ""

  const onOrientation = state.phase === "questions" && state.currentQuestionId === null

  return (
    <div className="min-h-screen bg-background pt-[57px]">
      {onOrientation && (
        // `fresh` decided Orientation vs resume at load. Reaching it again by
        // pressing Back from question one is a different thing and is allowed —
        // that is where Back goes.
        <ConsultationOrientation
          foundation={foundation}
          onBegin={() => void apply(() => commitMove(begin(state), navigation))}
        />
      )}

      {question && (
        <>
          {!isEditingFromReview(state) && (
            <>
              <ConsultationProgressBar progress={progress} foundation={foundation} />
              {isSectionStart(state) && progress.current && (
                <SectionTransition
                  title={sectionTitle}
                  purpose={SECTION_META[progress.current.section].purpose}
                />
              )}
            </>
          )}
          <ConsultationQuestionView
            key={question.id}
            question={question}
            foundation={foundation}
            answer={state.answers[question.id]}
            touched={state.touched.has(question.id)}
            onAnswer={handleAnswer}
            onBack={() => void apply(() => commitMove(goBack(state), navigation))}
            onNext={() => void apply(() => continueFrom(state, navigation))}
            onSkipOptional={
              question.required
                ? undefined
                : () => void apply(() => skipFrom(state, question.id, navigation))
            }
            canGoBack={!isEditingFromReview(state) && canGoBackFrom(state)}
            isLast={isLastQuestion(state)}
            editingFromReview={isEditingFromReview(state)}
            validationError={state.validationError}
            sectionTitle={sectionTitle}
            questionNumber={progress.current?.questionNumber ?? 1}
            questionCount={progress.current?.questionCount ?? 1}
          />
        </>
      )}

      {isReviewing(state) && (
        <ConsultationReviewView
          review={review}
          onEdit={(id) => void apply(() => commitMove(editFromReview(state, id), navigation))}
          footer={
            <ReviewFooter
              onBack={() => void apply(() => commitMove(goBack(state), navigation))}
            />
          }
        />
      )}

      <div className="mx-auto max-w-2xl px-6 pb-10" aria-busy={busy}>
        <ConsultationSaveStatus status={saveStatus} />
        {saveError && (
          <p role="alert" className="mt-2 text-sm leading-relaxed text-foreground">
            {saveError}
          </p>
        )}
      </div>
    </div>
  )
}

/**
 * A short beat when a section opens.
 *
 * The section's own `purpose` from the canonical `SECTION_META`, not new copy.
 */
function SectionTransition({ title, purpose }: { title: string; purpose: string }) {
  return (
    <div className="border-b bg-secondary/40">
      <div className="mx-auto max-w-2xl px-6 py-4">
        <p className="font-serif text-lg font-semibold text-foreground">{title}</p>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{purpose}</p>
      </div>
    </div>
  )
}

/**
 * The end of Phase 3C-B.
 *
 * Review is the last screen here too. No submit, no sealing of the answers, no
 * immutable trusted snapshot, and no button dressed up as one — the real handoff
 * belongs to the later phase that owns it.
 */
function ReviewFooter({ onBack }: { onBack: () => void }) {
  return (
    <div className="mt-12 rounded-2xl border border-border bg-secondary/40 p-6">
      <p className="font-semibold text-foreground">
        Your Consultation is ready for the next step.
      </p>
      <button
        type="button"
        onClick={onBack}
        className="mt-6 min-h-[44px] rounded-full border-2 border-border px-6 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-secondary/60"
      >
        Back to the last question
      </button>
    </div>
  )
}

/* ══ Save status ═══════════════════════════════════════════════════════════ */

/**
 * Restrained, truthful save feedback.
 *
 * "Saved" appears only once the server has confirmed the write — the queue
 * reports `saved` from a real response, never from having sent something. There
 * is a debounce window in which nothing has been sent at all, so any promise
 * that everything is stored the moment it is typed would be untrue, and a guard
 * forbids that wording.
 */
export function ConsultationSaveStatus({ status }: { status: AutosaveStatus }) {
  const label =
    status === "saving"
      ? "Saving…"
      : status === "saved"
        ? "Saved"
        : status === "unsaved"
          ? "Couldn't save yet"
          : null

  return (
    <p role="status" aria-live="polite" className="text-xs text-muted-foreground">
      {label}
    </p>
  )
}
