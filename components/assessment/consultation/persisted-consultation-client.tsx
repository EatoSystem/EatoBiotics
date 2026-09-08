"use client"

import { useEffect, useMemo, useRef, useState } from "react"

import { resolveConsultationBank } from "@/lib/consultation/bank-registry"
import { sanitiseCandidateAnswers } from "@/lib/consultation/session-envelope"
import { createAnswerAutosave, type AutosaveStatus } from "@/lib/assessment/answer-autosave"
import { SECTION_META } from "@/lib/consultation/types"
import type { ConsultationAnswer } from "@/lib/consultation/types"
import {
  begin,
  canGoBack as canGoBackFrom,
  createConsultationSession,
  currentQuestion as currentQuestionOf,
  editFromReview,
  goBack,
  isEditingFromReview,
  isLastQuestion,
  optionalSkipOnContinue,
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
  finaliseFrom,
  skipFrom,
  withdrawFrom,
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

/**
 * One pending change to one question.
 *
 * Tagged rather than three queues, because the ordering guarantee has to be
 * shared: a skip must be able to REPLACE a pending answer, and must be sent
 * after an answer that is already in flight. Two queues cannot express either.
 */
type QueuedMutation =
  | { kind: "answer"; value: ConsultationAnswer }
  | { kind: "skip"; currentQuestionId?: string | null }
  | { kind: "clear" }

/**
 * The one place answer, skip and clear are sequenced.
 *
 * Exported so a test drives the SAME queue the hook does. A test that rebuilt
 * this dispatch by hand could pass against a wiring the component does not use,
 * which for an ordering guarantee is worse than no test at all.
 */
export interface ConsultationMutationQueue {
  queueAnswer: (questionId: string, value: ConsultationAnswer) => void
  /** `currentQuestionId` states where the customer is; see `skipOptional`. */
  queueSkip: (questionId: string, currentQuestionId?: string | null) => void
  /** Send everything outstanding. False if anything failed. */
  flush: () => Promise<boolean>
  /** Drop pending timers without sending. For unmount. */
  cancel: () => void
}

export function createConsultationMutationQueue(
  persistence: ConsultationPersistence,
  onStatus?: (status: AutosaveStatus) => void,
): ConsultationMutationQueue {
  const autosave = createAnswerAutosave({
    onStatus,
    send: async (questionId, value) => {
      const mutation = value as QueuedMutation
      if (mutation.kind === "skip") {
        return persistence.skipOptional(questionId, mutation.currentQuestionId)
      }
      if (mutation.kind === "clear") return persistence.clearAnswer(questionId)
      return persistence.saveAnswer(questionId, mutation.value)
    },
  })

  return {
    queueAnswer: (questionId, value) => autosave.queue(questionId, { kind: "answer", value }),
    queueSkip: (questionId, currentQuestionId) =>
      autosave.queue(questionId, { kind: "skip", currentQuestionId }),
    async flush() {
      try {
        return await autosave.flush()
      } catch {
        return false
      }
    },
    cancel: () => autosave.cancel(),
  }
}

/**
 * The navigation contract, assembled from a queue and an adapter.
 *
 * Exported and used by BOTH the hook and its tests, because the assembly is
 * itself a correctness claim: `queueSkip` must be the QUEUE's, so a skip shares
 * ordering with an outstanding answer, and `leaveReview` must be the retreat
 * rather than a cursor write. A test that rebuilt this by hand would keep
 * passing while the hook wired either one to the wrong thing.
 */
export function createNavigationDeps(
  persistence: ConsultationPersistence,
  queue: ConsultationMutationQueue,
): NavigationDeps {
  return {
    flush: queue.flush,
    persistCursor: (questionId) => persistence.saveCursor(questionId),
    // The SAME per-question queue as an answer, which is what stops an
    // in-flight answer landing after the skip and resurrecting itself.
    queueSkip: queue.queueSkip,
    requestReview: () => persistence.enterReview(),
    leaveReview: (questionId) => persistence.leaveReview(questionId),
    // The adapter's, so the request shape stays in the one file that knows an
    // endpoint exists.
    finalise: () => persistence.finalise(),
  }
}

export type PersistedLoadState =
  | { status: "loading" }
  /** Sealed. The completion screen, not a session. */
  | { status: "completed" }
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
  persistence: ConsultationPersistence,
): UsePersistedConsultationResult {
  const [load, setLoad] = useState<PersistedLoadState>({ status: "loading" })
  const [saveStatus, setSaveStatus] = useState<AutosaveStatus>("idle")

  /**
   * ONE queue for every mutation of a question, not one for answers.
   *
   * Answer, skip and clear all decide the same thing — what the server ends up
   * holding for this question — so they have to share the ordering guarantee, or
   * the customer's newest intent can lose to their oldest. The race that forced
   * this: type an answer, press Skip while the save is still on the wire, and
   * the answer lands afterwards and un-skips itself, because the server's answer
   * action clears the skip marker by design.
   */
  const queue = useMemo(
    () => createConsultationMutationQueue(persistence, setSaveStatus),
    [persistence],
  )

  // Cancel pending timers on unmount. It does NOT claim the pending value was
  // saved — an unmount is not a save, and the status is left as it stands.
  useEffect(() => () => queue.cancel(), [queue])

  const cancelled = useRef(false)
  useEffect(() => {
    cancelled.current = false
    ;(async () => {
      try {
        const hydrated = hydratePersistedSession(await persistence.load())
        if (cancelled.current) return
        setLoad(
          hydrated.kind === "completed"
            ? { status: "completed" }
            : { status: "loaded", session: hydrated.session, fresh: hydrated.fresh },
        )
      } catch {
        if (!cancelled.current) setLoad({ status: "failed" })
      }
    })()
    return () => {
      cancelled.current = true
    }
  }, [persistence])

  const queueAnswer = queue.queueAnswer

  /**
   * Send anything still in the debounce window.
   *
   * Returns whether advancing is sound. Continue calls this BEFORE moving,
   * because advancing on an unsaved answer would leave the customer looking at
   * a later question while the server still has the earlier one blank — and a
   * resume would then send them backwards with no explanation.
   */
  const navigation = useMemo(
    () => createNavigationDeps(persistence, queue),
    [persistence, queue],
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
export type HydratedConsultation =
  /** A live Consultation, positioned where the server says it was. */
  | { kind: "session"; session: ConsultationSessionState; fresh: boolean }
  /**
   * Finished and sealed. There is no session to render, and deliberately no
   * way to make one: rehydrating a sealed Consultation into questions would
   * offer edits the server will refuse, on a record that is already frozen.
   */
  | { kind: "completed" }

export function hydratePersistedSession(state: LoadedConsultationState): HydratedConsultation {
  /*
   * `ready-for-report` used to throw here, which was right while nothing could
   * produce it. Phase 3C-C2A can now persist it, so a customer refreshing after
   * finishing would have seen the generic load-failure screen — the one message
   * that tells someone whose Consultation succeeded that something went wrong.
   *
   * Checked BEFORE the bank resolves, on purpose. A sealed Consultation needs
   * no bank: there are no questions left to render, and refusing a completed
   * customer because today's build no longer holds the bank they answered
   * against would be a regression, not a safety property.
   */
  if (state.phase === "ready-for-report") return { kind: "completed" }

  const bank = resolveConsultationBank(state.bankVersion)
  // Not a fallback to the current bank: resolving a session against a bank it
  // was not answered against is the exact failure the fingerprint prevents.
  if (!bank) throw new Error("unknown-bank")

  /*
   * Candidates are re-checked against the bank now that it is resolved.
   *
   * The server already sanitised them, so in the ordinary case this drops
   * nothing. It runs anyway because the strict load parser can only prove the
   * SHAPE of the payload — that it is an object of answers — and cannot know
   * whether a value is legal for the question it belongs to without the bank.
   * Rendering an answer the canonical contract would refuse is how a client and
   * a server start disagreeing about what was asked.
   *
   * Valid-but-inapplicable answers survive, exactly as they do server-side: a
   * closed branch is not an un-said answer.
   */
  const { answers } = sanitiseCandidateAnswers(state.candidateAnswers, state.bankVersion)

  // The server derives `started` from the state as STORED — see the note on it.
  // Re-deriving it here would be re-deriving it from a repaired cursor, which
  // cannot tell a new session from one paused on question one.
  const fresh = !state.started

  return {
    kind: "session",
    fresh,
    session: createConsultationSession({
      // The SERVER's context, never a caller's. It is the only one that has been
      // checked against the settled payment and the stored snapshot.
      context: state.context,
      questions: bank,
      answers,
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
  /** Test seam. Production supplies the HTTP adapter from `sessionId`. */
  persistence?: ConsultationPersistence
}

/**
 * Deliberately takes NO context.
 *
 * The foundation and lens are the server's to state, not a caller's: the
 * session route resolves them from the settled payment and the stored snapshot
 * and refuses when those disagree. A `context` prop here would let a page render
 * a Family Consultation for someone who paid for You — different questions,
 * different wording — and the server would then refuse every answer they gave.
 * There is nothing to pass, so nothing can be passed wrongly.
 */
export function PersistedConsultationClient({ sessionId, persistence }: Props) {
  const adapter = useMemo(
    () => persistence ?? createHttpConsultationPersistence(sessionId),
    [persistence, sessionId],
  )
  const { load, saveStatus, queueAnswer, navigation } = usePersistedConsultation(adapter)

  if (load.status === "loading") {
    return (
      <div className="mx-auto max-w-2xl px-6 py-24">
        <p role="status" aria-live="polite" className="text-base text-muted-foreground">
          Loading your Consultation…
        </p>
      </div>
    )
  }

  if (load.status === "completed") {
    // A refresh after finishing lands here, and shows the same thing the
    // customer saw when they finished. Not Review, not a question, not a
    // failure.
    return <ConsultationComplete />
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
  /** Set only once the SERVER confirms the seal. Never optimistically. */
  const [completed, setCompleted] = useState(false)
  const [finishError, setFinishError] = useState<string | null>(null)

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

  /**
   * Finish: flush, then seal.
   *
   * The ordering lives in `finaliseFrom`, which is where it can be proven —
   * this only reflects the outcome. Completion is rendered only on a confirmed
   * server success, so a failed request can never leave a customer believing
   * their Consultation was finalised when it was not.
   */
  async function handleFinish() {
    if (busy) return
    setBusy(true)
    setFinishError(null)
    try {
      const attempt = await finaliseFrom(navigation)
      if (attempt.status === "finalised") {
        setCompleted(true)
        return
      }
      if (attempt.status === "save-failed") {
        // Nothing was sealed. The answers are still on screen, and the customer
        // stays exactly where they were.
        setFinishError(
          "We couldn't save your latest answer, so nothing was finalised. Please try again.",
        )
        return
      }
      if (attempt.kind === "incomplete") {
        // The server is the authority on completeness, and it says something is
        // outstanding. Never a completion screen.
        setFinishError(
          "Something in your Consultation still needs an answer. Please reload to see what is missing.",
        )
        return
      }
      if (attempt.kind === "retryable") {
        setFinishError("We couldn't finish your Consultation just now. Please try again.")
        return
      }
      // A trust refusal. Retrying cannot change the answer, and the server's
      // reason is not something to put in front of a customer.
      setFinishError("We couldn't finish your Consultation. Please reload and try again.")
    } finally {
      setBusy(false)
    }
  }

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

  // Sealed. Nothing below this is reachable any more — the Review list, the
  // Edit controls and the Remove controls all describe a record that can no
  // longer change.
  //
  // Placed AFTER every hook rather than at the top of the component: an early
  // return above `useMemo` changes the hook order between renders, which React
  // forbids and which would have broken the moment a customer finished.
  if (completed) return <ConsultationComplete />

  return (
    <div className="min-h-screen bg-background pt-[57px]">
      {onOrientation && (
        // `fresh` decided Orientation vs resume at load. Reaching it again by
        // pressing Back from question one is a different thing and is allowed —
        // that is where Back goes.
        <ConsultationOrientation
          foundation={foundation}
          onBegin={() => void apply(() => commitMove(state, begin(state), navigation))}
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
            onBack={() => void apply(() => commitMove(state, goBack(state), navigation))}
            onNext={() => void apply(() => continueFrom(state, navigation))}
            // Offered only while the question is genuinely unanswered — which
            // is what the control's own description promises. Once an answer
            // exists, Skip would silently discard it, and there is no undo.
            onSkipOptional={
              optionalSkipOnContinue(state)
                ? () => void apply(() => skipFrom(state, question.id, navigation))
                : undefined
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
          onEdit={(id) => void apply(() => commitMove(state, editFromReview(state, id), navigation))}
          /* Queued, flushed, and applied only once the server confirms — the
           * answer stays on screen if the removal did not save. */
          onWithdraw={(id) => void apply(() => withdrawFrom(state, id, navigation))}
          footer={
            <ReviewFooter
              onBack={() => void apply(() => commitMove(state, goBack(state), navigation))}
              onFinish={() => void handleFinish()}
              busy={busy}
              error={finishError}
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
 * The Review footer — Phase 3C-C2B.
 *
 * ══ WHAT "FINISH" MEANS, AND WHAT IT DOES NOT ═══════════════════════════════
 *
 * It seals the answers. It does not start a Report, because Phase 4A does not
 * exist — so the copy says what happens and stops there. Anything that named a
 * Report as being produced, described analysis under way, or promised an
 * arrival time would be describing work that has not begun, to someone who has
 * just paid €49. A guard forbids each of those phrasings by name, which is why
 * none of them is written out here.
 *
 * ══ WHY THE BUSY STATE IS ONLY UX ═══════════════════════════════════════════
 *
 * Disabling the button while a request is in flight stops the obvious double
 * click, but it is not what makes finishing safe: two tabs, a refresh mid-flight
 * or a lost response all bypass it. The correctness boundary is the server's —
 * one Consultation seals once, and a retry returns the original handoff.
 */
function ReviewFooter({
  onBack,
  onFinish,
  busy,
  error,
}: {
  onBack: () => void
  onFinish: () => void
  busy: boolean
  error: string | null
}) {
  return (
    <div className="mt-12 rounded-2xl border border-border bg-secondary/40 p-6">
      <p className="font-semibold text-foreground">
        Your Consultation is ready for the next step.
      </p>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        Finishing saves your answers as final. You will not be able to change them
        afterwards.
      </p>

      {error && (
        <p role="alert" className="mt-4 text-sm leading-relaxed text-foreground">
          {error}
        </p>
      )}

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={onFinish}
          disabled={busy}
          aria-busy={busy}
          className="min-h-[44px] rounded-full bg-foreground px-6 py-2.5 text-sm font-semibold text-background transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {busy ? "Finishing…" : "Finish Consultation"}
        </button>
        <button
          type="button"
          onClick={onBack}
          disabled={busy}
          className="min-h-[44px] rounded-full border-2 border-border px-6 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-secondary/60 disabled:opacity-60"
        >
          Back to the last question
        </button>
      </div>
    </div>
  )
}

/**
 * The completion screen.
 *
 * Restrained on purpose. The record is sealed and that is genuinely all that
 * has happened: there is no Report, no PDF, no email and no queue position, so
 * there is nothing here to link to, count down to or animate. Saying more would
 * be inventing a deliverable to fill the silence.
 */
export function ConsultationComplete() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-24">
      <h1 className="text-2xl font-semibold leading-snug text-foreground sm:text-3xl">
        Your Consultation is complete.
      </h1>
      <p className="mt-4 text-base leading-relaxed text-muted-foreground">
        Your responses have been finalised and are ready for the next step.
      </p>
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
