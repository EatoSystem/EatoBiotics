import type {
  ConsultationAnswer,
  ConsultationAnswers,
  ConsultationContext,
  ConsultationOption,
  ConsultationQuestion,
  ConsultationSection,
} from "./types"
import { CONSULTATION_QUESTION_BANK } from "./question-bank"
import { resolveApplicableQuestions } from "./applicability"
import { validateAnswer } from "./validation"
import { validateConsultationAnswers } from "./completeness"
import type { ConsultationPhase } from "./session-envelope"

/**
 * The Consultation as a headless state machine — Phase 3B.
 *
 * ══ WHY THE LOGIC IS NOT IN THE COMPONENT ═══════════════════════════════════
 *
 * The legacy client (components/assessment/deep/deep-assessment-client.tsx)
 * keeps the questionnaire's rules inside React: it splices a `followUp` into
 * the queue in `handleNext`, tracks position by array index, and advances on a
 * 350ms timer fired from the option button. Every one of those decisions is
 * then invisible to the server, to resume, and to a future review screen —
 * they cannot agree about what was asked, because only the component ran the
 * splice.
 *
 * So Phase 3B puts the questionnaire's behaviour here instead, as pure
 * functions over a plain state object. The component renders this and calls
 * these; it decides nothing on its own. Three things follow:
 *
 *   1. every rule in §9–§18 of the phase spec is testable in Node, with no DOM
 *      and no timers — including the ones a rendering test would struggle to
 *      prove, like "selecting an option does not advance";
 *   2. Phase 3C's server-side completeness check can call the same functions,
 *      so "was this question asked?" keeps exactly one implementation;
 *   3. the frozen rules cannot be quietly re-decided in JSX.
 *
 * ══ WHAT THIS MODULE IS NOT ═════════════════════════════════════════════════
 *
 * It is not a second applicability engine. Branching comes from
 * `resolveApplicableQuestions`, answer legality from `validateAnswer`, and
 * trust from `validateConsultationAnswers` — all canonical, all Phase 3A. What
 * is added here is only the things a questionnaire needs that a resolver does
 * not have an opinion about: where the customer currently is, what Back means,
 * how far through a section they are, and whether a slider has been touched.
 *
 * ══ POSITION IS AN ID, NEVER AN INDEX ═══════════════════════════════════════
 *
 * `currentQuestionId`, not `currentIndex`. The applicable sequence changes
 * length as branches open and close, so an index means a different question
 * before and after a customer edits an earlier answer — which is precisely the
 * bug class this phase exists to remove.
 */

/* ══ State ═════════════════════════════════════════════════════════════════ */

export interface ConsultationSessionState {
  context: ConsultationContext
  /**
   * Candidate answers — everything the customer has entered, including answers
   * to branches that have since closed.
   *
   * Deliberately NOT pruned when a branch closes. `trustedAnswers` is the
   * projection that decides what counts, and it already excludes anything with
   * no live question behind it; deleting here as well would mean two rules
   * about what an answer is worth, and the destructive one would be the one
   * running in a browser with no way for the server to verify it happened.
   * A customer who re-opens a branch legitimately gets their own earlier answer
   * back rather than a blank they already filled in.
   */
  answers: ConsultationAnswers
  /**
   * Questions the customer has actually interacted with.
   *
   * Exists for `slider`, where the control has a thumb position from the moment
   * it renders and that position is not an answer (§18). Tracked generically
   * rather than only for sliders so no future control type has to remember to
   * opt in.
   */
  touched: ReadonlySet<string>
  /**
   * Optional questions the customer deliberately moved past without answering.
   *
   * A DIFFERENT state from both "not reached yet" and from having chosen
   * "I'd rather not say" — that last one is an ANSWER, and conflating the two
   * would record a declined disclosure the customer never made. Persisted as
   * `skippedOptionalQuestionIds` (Phase 3C-A), which is why the engine now
   * tracks it rather than leaving it to the UI.
   */
  skipped: ReadonlySet<string>
  /** `null` while the customer is on Orientation, before the first question. */
  currentQuestionId: string | null
  /** Set when Continue was refused, cleared on any answer change or navigation. */
  validationError: string | null
  /**
   * Where the Consultation is, in the SAME vocabulary the server persists.
   *
   * Phase 3B had a local `finished` boolean; Phase 3C-A introduced a persisted
   * `phase`. Keeping both would be two names for one idea, and they would drift
   * the first time one was set without the other — so `finished` is gone and
   * this is the single notion.
   *
   * `ready-for-report` is deliberately unreachable from here: nothing in this
   * module sets it, and a guard asserts that. It belongs to a later phase that
   * owns finalisation.
   */
  phase: Exclude<ConsultationPhase, "ready-for-report">
  /** Overridable so a test — or a future stored snapshot — can supply a bank. */
  questions: readonly ConsultationQuestion[]
}

export interface CreateSessionInput {
  context: ConsultationContext
  /** Prior answers, e.g. a resumed session. Answers restored this way count as
   *  touched: a saved slider value is an answer the customer already gave. */
  answers?: ConsultationAnswers
  questions?: readonly ConsultationQuestion[]
  /** Start on a specific question instead of Orientation. */
  startAtQuestionId?: string | null
  /** Restored from persisted state. */
  touchedQuestionIds?: readonly string[]
  skippedOptionalQuestionIds?: readonly string[]
  phase?: Exclude<ConsultationPhase, "ready-for-report">
}

export function createConsultationSession(input: CreateSessionInput): ConsultationSessionState {
  const answers = { ...(input.answers ?? {}) }
  return {
    context: input.context,
    answers,
    // A stored answer counts as touched even if the persisted touched-set has
    // lost it: the customer gave that answer, and the untouched-slider rule is
    // about a control nobody has moved, not about a value nobody re-asserted.
    touched: new Set([...(input.touchedQuestionIds ?? []), ...Object.keys(answers)]),
    skipped: new Set(input.skippedOptionalQuestionIds ?? []),
    currentQuestionId: input.startAtQuestionId ?? null,
    validationError: null,
    phase: input.phase ?? "questions",
    questions: input.questions ?? CONSULTATION_QUESTION_BANK,
  }
}

/* ══ Derived sequence ══════════════════════════════════════════════════════ */

/**
 * The questions that currently apply, in bank order.
 *
 * Recomputed from the canonical resolver on every read rather than cached.
 * A cache would be a second copy of the branching decision, and it would be
 * stale for exactly the case that matters — the moment after a parent answer
 * changes.
 */
export function applicableQuestions(
  state: ConsultationSessionState,
): readonly ConsultationQuestion[] {
  return resolveApplicableQuestions({
    questions: state.questions,
    context: state.context,
    answers: state.answers,
  })
}

export function currentQuestion(
  state: ConsultationSessionState,
): ConsultationQuestion | null {
  if (!state.currentQuestionId) return null
  return applicableQuestions(state).find((q) => q.id === state.currentQuestionId) ?? null
}

/** Position of the current question in the live sequence, or -1. */
function currentIndex(state: ConsultationSessionState): number {
  if (!state.currentQuestionId) return -1
  return applicableQuestions(state).findIndex((q) => q.id === state.currentQuestionId)
}

/* ══ Progress ══════════════════════════════════════════════════════════════ */

export interface SectionProgress {
  section: ConsultationSection
  /** 1-based position of the current question WITHIN its section. */
  questionNumber: number
  /** Applicable questions in this section right now. Can change as branches move. */
  questionCount: number
}

export interface ConsultationProgress {
  /** Sections that currently have at least one applicable question, in order. */
  sections: readonly ConsultationSection[]
  /** 0-based index of the current section within `sections`, or -1. */
  sectionIndex: number
  current: SectionProgress | null
  /**
   * Overall position, for assistive technology and tests.
   *
   * Present but deliberately NOT the headline the customer reads (§9): the
   * total moves as adaptive questions open and close, so a prominent "7 / 16"
   * would be a number that changes for reasons the customer cannot see. Section
   * position is stable enough to be honest.
   */
  overallNumber: number
  overallCount: number
}

export function progress(state: ConsultationSessionState): ConsultationProgress {
  const applicable = applicableQuestions(state)
  const sections: ConsultationSection[] = []
  for (const q of applicable) if (!sections.includes(q.section)) sections.push(q.section)

  const index = currentIndex(state)
  const question = index === -1 ? null : applicable[index]

  if (!question) {
    return {
      sections,
      sectionIndex: -1,
      current: null,
      overallNumber: 0,
      overallCount: applicable.length,
    }
  }

  const inSection = applicable.filter((q) => q.section === question.section)
  return {
    sections,
    sectionIndex: sections.indexOf(question.section),
    current: {
      section: question.section,
      questionNumber: inSection.findIndex((q) => q.id === question.id) + 1,
      questionCount: inSection.length,
    },
    overallNumber: index + 1,
    overallCount: applicable.length,
  }
}

/** True when the current question opens a section the previous one was not in. */
export function isSectionStart(state: ConsultationSessionState): boolean {
  const applicable = applicableQuestions(state)
  const index = currentIndex(state)
  if (index < 0) return false
  if (index === 0) return true
  return applicable[index - 1].section !== applicable[index].section
}

/* ══ Answering ═════════════════════════════════════════════════════════════ */

/**
 * Apply an exclusive-option rule to a multi-select toggle.
 *
 * Reads `exclusive` off the option itself (§16), never a label or a hard-coded
 * id: "Nothing in particular" and "I'd rather not say" are exclusive because
 * the bank declares them so, and a rephrase must not silently switch that off.
 *
 * Both directions, because only doing one of them leaves a contradiction the
 * canonical validator would then reject as invalid — the customer would be
 * blocked by a state the UI let them build.
 */
export function toggleMultiValue(
  options: readonly ConsultationOption[],
  selected: readonly string[],
  value: string,
): string[] {
  const byValue = new Map(options.map((o) => [o.value, o]))
  const isExclusive = Boolean(byValue.get(value)?.exclusive)

  if (selected.includes(value)) return selected.filter((v) => v !== value)
  // Choosing an exclusive option clears everything else.
  if (isExclusive) return [value]
  // Choosing a substantive option drops any exclusive one that was active.
  return [...selected.filter((v) => !byValue.get(v)?.exclusive), value]
}

/**
 * Record an answer. Never advances (§10) — that is `goNext`'s job alone.
 *
 * The frozen rule is that no answer control moves the customer on, so this
 * function structurally cannot: it returns a state whose `currentQuestionId` is
 * the one it was given. An auto-advance regression has to add a call to
 * `goNext`, which the sabotage tests watch for.
 */
export function setAnswer(
  state: ConsultationSessionState,
  questionId: string,
  value: ConsultationAnswer,
): ConsultationSessionState {
  const touched = new Set(state.touched)
  touched.add(questionId)
  // Answering un-skips (§12). A skip marker beside a real answer would
  // misdescribe both — the customer did engage with the question after all —
  // and the same rule runs server-side in the progress route.
  const skipped = new Set(state.skipped)
  skipped.delete(questionId)
  return {
    ...state,
    answers: { ...state.answers, [questionId]: value },
    touched,
    skipped,
    validationError: null,
  }
}

/** Remove an answer — used when an optional question is cleared by the customer. */
export function clearAnswer(
  state: ConsultationSessionState,
  questionId: string,
): ConsultationSessionState {
  const answers = { ...state.answers }
  delete answers[questionId]
  const touched = new Set(state.touched)
  touched.delete(questionId)
  return { ...state, answers, touched, validationError: null }
}

/* ══ Gate ══════════════════════════════════════════════════════════════════ */

export type ContinueGate =
  | { allowed: true }
  | { allowed: false; reason: string }

/**
 * May the customer leave the current question?
 *
 * Required questions are enforced through the canonical validator, not through
 * a second opinion about what counts as answered (§14). An optional question
 * may always be passed, answered or not (§15) — but an optional question that
 * has been answered BADLY still blocks, because storing a value the projection
 * would refuse is worse than an empty one.
 */
export function continueGate(state: ConsultationSessionState): ContinueGate {
  const question = currentQuestion(state)
  if (!question) return { allowed: true }

  const result = validateAnswer(question, state.answers[question.id])

  // A slider renders with its thumb somewhere, and that position is not a
  // statement (§18). Only an interaction makes the value an answer.
  const untouchedSlider = question.type === "slider" && !state.touched.has(question.id)

  if (question.required) {
    if (result.status === "valid" && !untouchedSlider) return { allowed: true }
    if (result.status === "invalid") return { allowed: false, reason: result.reason }
    return { allowed: false, reason: "Please choose an answer to continue." }
  }

  if (result.status === "invalid") return { allowed: false, reason: result.reason }
  return { allowed: true }
}

/* ══ Navigation ════════════════════════════════════════════════════════════ */

/** Enter the first applicable question from Orientation. */
export function begin(state: ConsultationSessionState): ConsultationSessionState {
  const first = applicableQuestions(state)[0]
  return {
    ...state,
    currentQuestionId: first ? first.id : null,
    phase: first ? "questions" : "review",
    validationError: null,
  }
}

/**
 * Is this a session nobody has started yet?
 *
 * Derived, never persisted. Phase 3C-A's resume repairs a null cursor to the
 * first outstanding question, which is right for someone coming back — but it
 * makes a brand-new session look identical to one paused on question one, and
 * the client would then skip Orientation for a customer who has never seen it.
 *
 * The stored contract already distinguishes them without a new field: a session
 * nobody has touched has no answers, nothing touched, nothing skipped, no
 * stored cursor, and is still in the questions phase. Any one of those being
 * non-empty means somebody has been here.
 */
export function isFreshSession(input: {
  answers: ConsultationAnswers
  touchedQuestionIds: readonly string[]
  skippedOptionalQuestionIds: readonly string[]
  currentQuestionId: string | null
  phase: ConsultationPhase
}): boolean {
  return (
    input.phase === "questions" &&
    input.currentQuestionId === null &&
    Object.keys(input.answers).length === 0 &&
    input.touchedQuestionIds.length === 0 &&
    input.skippedOptionalQuestionIds.length === 0
  )
}

/**
 * Explicit Continue (§10).
 *
 * Refused states return the SAME question with an error to announce, rather
 * than a thrown exception or a silent no-op: the customer needs to be told why
 * they are still here.
 */
export function goNext(state: ConsultationSessionState): ConsultationSessionState {
  const gate = continueGate(state)
  if (!gate.allowed) return { ...state, validationError: gate.reason }

  // Recomputed AFTER the answer is in place, so an answer that opens a branch
  // sends the customer into that branch, and one that closes it does not.
  const applicable = applicableQuestions(state)
  const index = currentIndex(state)
  const next = index >= 0 ? applicable[index + 1] : applicable[0]

  // Past the last applicable question, the Consultation goes to Review — but
  // only if it is actually complete. An optional question the customer skipped
  // is fine; a required one that opened late is not, and `enterReview` sends
  // them to it rather than showing a Review that is missing an answer.
  if (!next) return enterReview(state)
  return { ...state, currentQuestionId: next.id, validationError: null }
}

/**
 * Move the customer past an OPTIONAL question without answering it.
 *
 * Records the skip rather than writing a value. Choosing "I'd rather not say"
 * is an answer and goes through `setAnswer`; this is the customer declining to
 * engage with the question at all, and the two must stay distinguishable
 * because a Report may legitimately read them differently.
 *
 * A required question cannot be skipped — the gate refuses it anyway, but this
 * refuses it at the source so no caller can construct the state.
 */
export function skipOptional(
  state: ConsultationSessionState,
  questionId: string,
): ConsultationSessionState {
  const question = state.questions.find((q) => q.id === questionId)
  if (!question || question.required) return state

  const answers = { ...state.answers }
  delete answers[questionId]
  const touched = new Set(state.touched)
  touched.delete(questionId)
  const skipped = new Set(state.skipped)
  skipped.add(questionId)

  return { ...state, answers, touched, skipped, validationError: null }
}

/**
 * The optional question the customer is passing WITHOUT answering, if any.
 *
 * Pressing Continue on an applicable optional question they have left empty is
 * the same statement as pressing Skip: they were asked, and they chose to move
 * on. Recording only the button press would make the two indistinguishable in
 * storage, and "deliberately passed" would collapse into "never reached" — a
 * distinction a Report may legitimately read differently.
 *
 * Returns `null` for a required question, an answered one, and an INVALID one:
 * the last is refused by the gate rather than skipped, because an unusable
 * value is a correction to make, not a decision to record.
 */
export function optionalSkipOnContinue(state: ConsultationSessionState): string | null {
  const question = currentQuestion(state)
  if (!question || question.required) return null

  const result = validateAnswer(question, state.answers[question.id])
  if (result.status === "invalid") return null

  // Same rule as the gate: a slider nobody moved is not an answer (§18), so
  // passing it is a skip even though the control reports a value.
  const untouchedSlider = question.type === "slider" && !state.touched.has(question.id)
  if (result.status === "valid" && !untouchedSlider) return null

  return question.id
}

/**
 * Continue, as one engine transition.
 *
 * Named here rather than written out in a component because BOTH paths need it
 * to mean the same thing. The persisted path sequences persistence around these
 * same steps; the preview stores nothing but must still describe the customer's
 * actions identically, or the same person answering the same way sees a Review
 * that says "Not answered (optional)" in one and "Not answered yet" in the
 * other. A preview that disagrees with the real experience is worse than none.
 *
 * Three steps: record a deliberate pass over an unanswered optional question,
 * then either return to Review (from an edit) or advance. Refusals come back as
 * the same state carrying a message, exactly as `goNext` produces them.
 */
export function continueLocally(state: ConsultationSessionState): ConsultationSessionState {
  const passing = optionalSkipOnContinue(state)
  const moving = passing ? skipOptional(state, passing) : state
  return isEditingFromReview(moving) ? returnToReview(moving) : goNext(moving)
}

/**
 * Back (§11).
 *
 * The previous question in the LIVE sequence, so it crosses sections and stays
 * correct after a branch has opened or closed. Answers are untouched, so the
 * customer sees what they entered. Never leaves the questionnaire: Back from
 * the first question returns to Orientation.
 */
export function goBack(state: ConsultationSessionState): ConsultationSessionState {
  const applicable = applicableQuestions(state)

  // From the Review list, Back returns to the last question rather than out of
  // the Consultation.
  if (state.phase === "review" && state.currentQuestionId === null) {
    const last = applicable[applicable.length - 1]
    return {
      ...state,
      phase: "questions",
      currentQuestionId: last ? last.id : null,
      validationError: null,
    }
  }

  const index = currentIndex(state)
  if (index <= 0) {
    return { ...state, currentQuestionId: null, validationError: null }
  }
  return { ...state, currentQuestionId: applicable[index - 1].id, validationError: null }
}

export function canGoBack(state: ConsultationSessionState): boolean {
  if (state.phase === "review" && state.currentQuestionId === null) return true
  return currentIndex(state) > 0
}

/* ══ Review ════════════════════════════════════════════════════════════════ */

/**
 * Ask to enter Review.
 *
 * Gated on canonical completeness, not on the customer having walked to the
 * end: an edit can open a required branch behind them, and a Review that
 * silently omitted an unanswered required question would be a Review of a
 * Consultation that does not exist. When something is outstanding this returns
 * the customer to the FIRST such question instead, in the questions phase.
 *
 * The server repeats this check in `/api/consultation/review` and owns the
 * persisted transition — this is the same rule evaluated locally so the UI does
 * not have to round-trip to know what it will say.
 */
export function enterReview(state: ConsultationSessionState): ConsultationSessionState {
  const { missingQuestionIds, invalidQuestionIds, applicableQuestionIds } = sessionCompleteness(state)
  const outstanding = applicableQuestionIds.find(
    (id) => missingQuestionIds.includes(id) || invalidQuestionIds.includes(id),
  )

  if (outstanding) {
    return {
      ...state,
      phase: "questions",
      currentQuestionId: outstanding,
      validationError: null,
    }
  }

  return { ...state, phase: "review", currentQuestionId: null, validationError: null }
}

/** True when the customer is looking at the Review list itself. */
export function isReviewing(state: ConsultationSessionState): boolean {
  return state.phase === "review" && state.currentQuestionId === null
}

/** True when the customer is editing one answer from within Review. */
export function isEditingFromReview(state: ConsultationSessionState): boolean {
  return state.phase === "review" && state.currentQuestionId !== null
}

/**
 * Open one Review item for editing.
 *
 * The cursor moves while the phase stays `review`, which is what makes an
 * interrupted edit resumable: the persisted pair (phase, currentQuestionId)
 * already says "in Review, editing this one", so no second editing cursor has
 * to be invented or stored.
 */
export function editFromReview(
  state: ConsultationSessionState,
  questionId: string,
): ConsultationSessionState {
  const applicable = applicableQuestions(state)
  if (!applicable.some((q) => q.id === questionId)) return state
  return { ...state, phase: "review", currentQuestionId: questionId, validationError: null }
}

/**
 * Finish a Review edit.
 *
 * Re-runs completeness rather than assuming the edit was harmless: changing a
 * parent can open a required branch, and returning to a Review that still
 * looked complete would hide it. Complete → back to the list; incomplete →
 * out of Review, to the first question that now needs an answer.
 */
export function returnToReview(state: ConsultationSessionState): ConsultationSessionState {
  const gate = continueGate(state)
  if (!gate.allowed) return { ...state, validationError: gate.reason }
  return enterReview(state)
}

/** True when the current question is the last one that currently applies. */
export function isLastQuestion(state: ConsultationSessionState): boolean {
  const index = currentIndex(state)
  return index >= 0 && index === applicableQuestions(state).length - 1
}

/* ══ Trust ═════════════════════════════════════════════════════════════════ */

/**
 * The canonical completeness verdict for this session.
 *
 * Straight delegation. Phase 3B does not decide what a Consultation's answers
 * are worth — it shows a customer the questions and hands the canonical
 * projection whatever they entered.
 */
export function sessionCompleteness(state: ConsultationSessionState) {
  return validateConsultationAnswers({
    questions: state.questions,
    context: state.context,
    answers: state.answers,
  })
}

/**
 * Answers that survive projection — the only ones anything downstream may read.
 *
 * The stale-branch case (§13) is handled entirely by this: an answer whose
 * question stopped applying is absent here, without the client having deleted
 * anything. Phase 3C consumes this; Phase 3B only proves it is correct.
 */
export function trustedAnswers(state: ConsultationSessionState): ConsultationAnswers {
  return sessionCompleteness(state).trustedAnswers
}
