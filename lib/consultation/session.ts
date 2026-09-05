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
  /** `null` while the customer is on Orientation, before the first question. */
  currentQuestionId: string | null
  /** Set when Continue was refused, cleared on any answer change or navigation. */
  validationError: string | null
  /** True once the customer has passed the last applicable question. */
  finished: boolean
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
}

export function createConsultationSession(input: CreateSessionInput): ConsultationSessionState {
  const answers = { ...(input.answers ?? {}) }
  return {
    context: input.context,
    answers,
    touched: new Set(Object.keys(answers)),
    currentQuestionId: input.startAtQuestionId ?? null,
    validationError: null,
    finished: false,
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
  return {
    ...state,
    answers: { ...state.answers, [questionId]: value },
    touched,
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
    finished: !first,
    validationError: null,
  }
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

  if (!next) return { ...state, finished: true, validationError: null }
  return { ...state, currentQuestionId: next.id, validationError: null }
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

  if (state.finished) {
    const last = applicable[applicable.length - 1]
    return {
      ...state,
      finished: false,
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
  return state.finished || currentIndex(state) > 0
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
