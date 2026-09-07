import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"

import { createAnswerAutosave, type AutosaveStatus } from "@/lib/assessment/answer-autosave"
import { CONSULTATION_BANK_V1 } from "@/lib/consultation/bank-registry"
import { CONSULTATION_QUESTION_BANK } from "@/lib/consultation/question-bank"
import {
  applicableQuestions,
  begin,
  createConsultationSession,
  currentQuestion,
  editFromReview,
  enterReview,
  goBack,
  isEditingFromReview,
  isReviewing,
  setAnswer,
  skipOptional,
  type ConsultationSessionState,
} from "@/lib/consultation/session"
import type { ConsultationAnswers, ConsultationContext } from "@/lib/consultation/types"
import {
  createHttpConsultationPersistence,
  readLoadedConsultationState,
  type ConsultationPersistence,
  type LoadedConsultationState,
  type ReviewOutcome,
  type SaveOutcome,
} from "@/components/assessment/consultation/consultation-persistence"
import {
  commitMove,
  continueFrom,
  skipFrom,
  withdrawFrom,
  type NavigationDeps,
} from "@/components/assessment/consultation/consultation-navigation"
import {
  createConsultationMutationQueue,
  createNavigationDeps,
  hydratePersistedSession,
} from "@/components/assessment/consultation/persisted-consultation-client"

/**
 * Phase 3C-B — the persisted client, against a fake adapter.
 *
 * ══ NO STRIPE, NO DATABASE, NO ACTIVATION ═══════════════════════════════════
 *
 * The adapter interface is the whole surface a test has to replace, which is
 * what lets a contract forbidden to go live still be proven to work. Nothing
 * here touches a payment, a row, or a production write.
 *
 * ══ WHERE EACH RULE IS PROVEN ═══════════════════════════════════════════════
 *
 * The repository runs vitest in the `node` environment with no jsdom, so a hook
 * cannot be rendered here. That is why the two rules that matter most — Continue
 * flushes before it moves, and a failed save does not advance — do not live in
 * the component at all: they are in `consultation-navigation`, as pure async
 * functions, and are exercised directly below. Real clicks and focus are in
 * `tests/e2e/consultation-preview.spec.ts`.
 */

const you: ConsultationContext = { foundation: "you" }

const Q1 = "core_signals_post_meal_pattern_v1"
const Q2 = "core_signals_energy_shape_v1"
const Q3 = "core_signals_context_v1"
const CONSTRAINTS = "core_environment_constraints_v1"
const AVOIDANCES = "core_environment_food_avoidances_v1"
const SHARED_MEALS = "core_rhythm_household_shared_meals_v1"
const SEPARATE_REASON = "core_rhythm_household_separate_reason_v1"

/* ── A recording fake adapter ───────────────────────────────────────────── */

interface FakeOptions {
  load?: Partial<LoadedConsultationState>
  loadRejects?: boolean
  save?: SaveOutcome
  cursor?: SaveOutcome
  skip?: SaveOutcome
  review?: ReviewOutcome
  leave?: SaveOutcome
}

function fakeAdapter(options: FakeOptions = {}) {
  const calls: string[] = []
  const saved: Array<{ questionId: string; value: unknown }> = []
  const skips: Array<{ questionId: string; currentQuestionId?: string | null }> = []
  const cursors: Array<string | null> = []
  const left: string[] = []

  const persistence: ConsultationPersistence = {
    async load() {
      calls.push("load")
      if (options.loadRejects) throw new Error("load failed")
      return {
        bankVersion: CONSULTATION_BANK_V1,
        context: you,
        candidateAnswers: {},
        touchedQuestionIds: [],
        skippedOptionalQuestionIds: [],
        currentQuestionId: null,
        phase: "questions",
        started: false,
        ...options.load,
      }
    },
    async saveAnswer(questionId, value) {
      calls.push(`save:${questionId}`)
      saved.push({ questionId, value })
      return options.save ?? { ok: true }
    },
    async clearAnswer(questionId) {
      calls.push(`clear:${questionId}`)
      return options.save ?? { ok: true }
    },
    async skipOptional(questionId, currentQuestionId) {
      calls.push(`skip:${questionId}`)
      // The cursor argument is recorded separately from the call log because it
      // is a different claim: the log says WHAT was sent, this says where the
      // customer said they were while sending it.
      skips.push({ questionId, currentQuestionId })
      return options.skip ?? { ok: true }
    },
    async saveCursor(questionId) {
      calls.push(`cursor:${questionId ?? "null"}`)
      cursors.push(questionId)
      return options.cursor ?? { ok: true }
    },
    async enterReview() {
      calls.push("review")
      return options.review ?? { ok: true }
    },
    async leaveReview(questionId) {
      calls.push(`leave-review:${questionId}`)
      left.push(questionId)
      return options.leave ?? { ok: true }
    },
  }

  return { persistence, calls, saved, skips, cursors, left }
}

/**
 * The navigation dependencies exactly as the hook assembles them.
 *
 * Built from the adapter here rather than hand-stubbed, so a test cannot pass
 * against a wiring the component does not use.
 */
function depsFor(
  persistence: ConsultationPersistence,
  flush: () => Promise<boolean>,
  queueSkip: (questionId: string, currentQuestionId?: string | null) => void = (id, cursor) =>
    void persistence.skipOptional(id, cursor),
): NavigationDeps {
  return {
    flush,
    persistCursor: (id) => persistence.saveCursor(id),
    queueSkip,
    requestReview: () => persistence.enterReview(),
    leaveReview: (id) => persistence.leaveReview(id),
  }
}

/**
 * Navigation wired to the REAL mutation queue, exactly as the hook wires it.
 *
 * `depsFor` above stubs the queue so a test can drive `flush` directly; this one
 * cannot, which is the point — ordering between an answer and a skip is only
 * meaningful through the queue that enforces it.
 */
function queuedDepsFor(adapter: ReturnType<typeof fakeAdapter>) {
  const queue = createConsultationMutationQueue(adapter.persistence)
  // The hook's own assembler, not a hand-written copy of it.
  return { deps: createNavigationDeps(adapter.persistence, queue), queue }
}

const session = (answers: ConsultationAnswers = {}, over: Partial<ConsultationSessionState> = {}) => ({
  ...begin(createConsultationSession({ context: you, answers })),
  ...over,
})

/* ══ Hydration ═════════════════════════════════════════════════════════════ */

describe("server state is the authority on load", () => {
  it("hydrates answers, touches and skips exactly as stored", () => {
    const { session: s } = hydratePersistedSession({
      context: you,
      bankVersion: CONSULTATION_BANK_V1,
      candidateAnswers: { [Q1]: "bloating", [CONSTRAINTS]: ["allergy"] },
      touchedQuestionIds: [Q1, CONSTRAINTS],
      skippedOptionalQuestionIds: [AVOIDANCES],
      currentQuestionId: Q3,
      phase: "questions",
      started: true,
    })
    expect(s.answers[Q1]).toBe("bloating")
    expect(s.touched.has(CONSTRAINTS)).toBe(true)
    expect(s.skipped.has(AVOIDANCES)).toBe(true)
    expect(s.currentQuestionId).toBe(Q3)
  })

  it("a brand-new session lands on Orientation, not on question one", () => {
    const { session: s, fresh } = hydratePersistedSession({
      context: you,
      bankVersion: CONSULTATION_BANK_V1,
      candidateAnswers: {},
      touchedQuestionIds: [],
      skippedOptionalQuestionIds: [],
      // The server REPAIRS a null cursor to the first outstanding question, so
      // the cursor alone cannot distinguish this from a session paused there.
      currentQuestionId: Q1,
      phase: "questions",
      started: false,
    })
    expect(fresh).toBe(true)
    expect(s.currentQuestionId).toBeNull()
    expect(currentQuestion(s)).toBeNull()
  })

  it("a returning session resumes where it was, without Orientation", () => {
    const { session: s, fresh } = hydratePersistedSession({
      context: you,
      bankVersion: CONSULTATION_BANK_V1,
      candidateAnswers: { [Q1]: "bloating" },
      touchedQuestionIds: [Q1],
      skippedOptionalQuestionIds: [],
      currentQuestionId: Q2,
      phase: "questions",
      started: true,
    })
    expect(fresh).toBe(false)
    expect(currentQuestion(s)?.id).toBe(Q2)
  })

  it("a session stored in review hydrates onto the Review list", () => {
    const { session: s } = hydratePersistedSession({
      context: you,
      bankVersion: CONSULTATION_BANK_V1,
      candidateAnswers: { [Q1]: "nothing" },
      touchedQuestionIds: [Q1],
      skippedOptionalQuestionIds: [],
      currentQuestionId: null,
      phase: "review",
      started: true,
    })
    expect(isReviewing(s)).toBe(true)
  })

  it("an interrupted Review edit hydrates back into that edit", () => {
    const { session: s } = hydratePersistedSession({
      context: you,
      bankVersion: CONSULTATION_BANK_V1,
      candidateAnswers: { [Q1]: "nothing" },
      touchedQuestionIds: [Q1],
      skippedOptionalQuestionIds: [],
      currentQuestionId: Q2,
      phase: "review",
      started: true,
    })
    expect(isEditingFromReview(s)).toBe(true)
    expect(currentQuestion(s)?.id).toBe(Q2)
  })

  it("a bank this build does not hold refuses instead of falling back", () => {
    expect(() =>
      hydratePersistedSession({
        context: you,
        bankVersion: "consultation-v99",
        candidateAnswers: { [Q1]: "bloating" },
        touchedQuestionIds: [Q1],
        skippedOptionalQuestionIds: [],
        currentQuestionId: Q1,
        phase: "questions",
        started: true,
      }),
    ).toThrow()
  })

  it("a finalisation phase this build cannot render refuses", () => {
    expect(() =>
      hydratePersistedSession({
        context: you,
        bankVersion: CONSULTATION_BANK_V1,
        candidateAnswers: {},
        touchedQuestionIds: [],
        skippedOptionalQuestionIds: [],
        currentQuestionId: null,
        phase: "ready-for-report",
        started: true,
      }),
    ).toThrow()
  })
})

/* ══ The context is the server's ═══════════════════════════════════════════ */

describe("the canonical context comes from the server and nowhere else", () => {
  const payload = (over: Record<string, unknown> = {}) => ({
    kind: "deterministic",
    bankVersion: CONSULTATION_BANK_V1,
    context: { foundation: "you", lens: null },
    candidateAnswers: {},
    touchedQuestionIds: [],
    skippedOptionalQuestionIds: [],
    currentQuestionId: null,
    phase: "questions",
    started: false,
    ...over,
  })

  it("hydration takes no context argument at all, so none can be supplied", () => {
    // The strongest available form of "a caller cannot override this": there is
    // no parameter to override it with. A You session cannot be rendered as a
    // household one by a page that thinks it knows better.
    expect(hydratePersistedSession.length).toBe(1)
  })

  it("a Family session branches and words itself as Family", () => {
    const { session: s } = hydratePersistedSession(
      readLoadedConsultationState(
        payload({
          context: { foundation: "family", lens: null },
          candidateAnswers: { [SHARED_MEALS]: "never" },
          touchedQuestionIds: [SHARED_MEALS],
          currentQuestionId: SHARED_MEALS,
          started: true,
        }),
      ),
    )
    expect(s.context.foundation).toBe("family")
    const ids = applicableQuestions(s).map((q) => q.id)
    // The household branch is open and the personal signal question is absent.
    expect(ids).toContain(SEPARATE_REASON)
    expect(ids).not.toContain(Q1)
  })

  it("a You session stays You", () => {
    const { session: s } = hydratePersistedSession(readLoadedConsultationState(payload()))
    expect(s.context.foundation).toBe("you")
    expect(applicableQuestions(s).map((q) => q.id)).toContain(Q1)
  })

  it("carries a real lens through unchanged", () => {
    const state = readLoadedConsultationState(
      payload({ context: { foundation: "you", lens: "glucose" } }),
    )
    expect(state.context.lens).toBe("glucose")
  })

  it("refuses an unknown lens rather than narrowing it to none", () => {
    // `null` and "this build does not understand what they bought" are opposite
    // statements. Coercing the second into the first serves a lens-less
    // Consultation to someone who paid for a lens.
    expect(() =>
      readLoadedConsultationState(payload({ context: { foundation: "you", lens: "telepathy" } })),
    ).toThrow()
  })

  it("refuses an invalid foundation", () => {
    expect(() =>
      readLoadedConsultationState(payload({ context: { foundation: "team", lens: null } })),
    ).toThrow()
  })

  it("refuses a missing context", () => {
    const without = payload()
    delete (without as Record<string, unknown>).context
    expect(() => readLoadedConsultationState(without)).toThrow()
  })
})

/* ══ The strict load contract ══════════════════════════════════════════════ */

describe("a deterministic payload must be complete, or it is refused", () => {
  const payload = (over: Record<string, unknown> = {}) => ({
    kind: "deterministic",
    bankVersion: CONSULTATION_BANK_V1,
    context: { foundation: "you", lens: null },
    candidateAnswers: {},
    touchedQuestionIds: [],
    skippedOptionalQuestionIds: [],
    currentQuestionId: null,
    phase: "questions",
    started: false,
    ...over,
  })

  it("accepts a complete one", () => {
    expect(readLoadedConsultationState(payload()).phase).toBe("questions")
  })

  it.each([
    ["candidateAnswers as an array", { candidateAnswers: [] }],
    ["candidateAnswers as a string", { candidateAnswers: "none" }],
    ["touchedQuestionIds as a string", { touchedQuestionIds: "qid" }],
    ["touchedQuestionIds holding a non-string", { touchedQuestionIds: [1] }],
    ["skippedOptionalQuestionIds as an object", { skippedOptionalQuestionIds: {} }],
    ["currentQuestionId as a number", { currentQuestionId: 123 }],
    ["an undeclared phase", { phase: "complete" }],
    ["started as a string", { started: "yes" }],
    ["an empty bankVersion", { bankVersion: "   " }],
    ["a legacy payload", { kind: "legacy" }],
  ])("refuses %s", (_label, over) => {
    expect(() => readLoadedConsultationState(payload(over))).toThrow()
  })

  it("repairs nothing — there is no default anywhere in the parser", () => {
    const source = readFileSync(
      join(process.cwd(), "components/assessment/consultation/consultation-persistence.ts"),
      "utf8",
    )
    // The parser SECTION, helpers included — bounded so the adapter below it
    // does not count. That code reads a refusal body, which is advisory
    // information rather than state, and defaults there mean something else.
    const parser = source.slice(
      source.indexOf("The strict load parser"),
      source.indexOf("The HTTP adapter"),
    )
    expect(parser.length).toBeGreaterThan(500)
    // The 3C-A fail-open patterns, in the shapes they would take here.
    expect(parser).not.toMatch(/\?\?\s*\{\}/)
    expect(parser).not.toMatch(/\?\?\s*\[\]/)
    expect(parser).not.toMatch(/\?\?\s*"questions"/)
    expect(parser).not.toMatch(/Array\.isArray\([^)]*\)\s*\?/)
  })

  it("drops a stored value the canonical contract would reject, after resolving the bank", () => {
    // The parser can prove the SHAPE of the answer map but not that a value is
    // legal for its question — that needs the bank.
    const { session: s } = hydratePersistedSession(
      readLoadedConsultationState(
        payload({
          candidateAnswers: { [Q1]: "not-an-option", [Q2]: "steady" },
          touchedQuestionIds: [Q1, Q2],
          currentQuestionId: Q2,
          started: true,
        }),
      ),
    )
    expect(s.answers[Q1]).toBeUndefined()
    expect(s.answers[Q2]).toBe("steady")
  })

  it("keeps a valid answer whose branch has closed", () => {
    const { session: s } = hydratePersistedSession(
      readLoadedConsultationState(
        payload({
          candidateAnswers: { [Q1]: "nothing", [Q3]: ["rushed"] },
          touchedQuestionIds: [Q1, Q3],
          currentQuestionId: Q1,
          started: true,
        }),
      ),
    )
    expect(s.answers[Q3], "a closed branch is not an un-said answer").toEqual(["rushed"])
    expect(applicableQuestions(s).map((q) => q.id)).not.toContain(Q3)
  })
})

/* ══ The HTTP adapter ══════════════════════════════════════════════════════ */

describe("the HTTP adapter is the only thing that speaks to a server", () => {
  const originalFetch = globalThis.fetch
  let seen: Array<{ url: string; init?: RequestInit }> = []

  function stubFetch(reply: (url: string) => { status: number; body?: unknown }) {
    seen = []
    globalThis.fetch = (async (url: unknown, init?: RequestInit) => {
      seen.push({ url: String(url), init })
      const { status, body } = reply(String(url))
      return {
        ok: status >= 200 && status < 300,
        status,
        json: async () => body,
      } as Response
    }) as typeof globalThis.fetch
  }

  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  it("loads a deterministic payload and carries `started` through", async () => {
    stubFetch(() => ({
      status: 200,
      body: {
        kind: "deterministic",
        bankVersion: CONSULTATION_BANK_V1,
        context: { foundation: "you", lens: null },
        candidateAnswers: { [Q1]: "bloating" },
        touchedQuestionIds: [Q1],
        skippedOptionalQuestionIds: [],
        currentQuestionId: Q2,
        phase: "questions",
        started: true,
      },
    }))
    const state = await createHttpConsultationPersistence("cs_test_1234").load()
    expect(state.started).toBe(true)
    expect(state.currentQuestionId).toBe(Q2)
    expect(seen[0].url).toContain("/api/consultation/session?session_id=cs_test_1234")
  })

  it("refuses a legacy payload rather than degrading to an empty Consultation", async () => {
    stubFetch(() => ({ status: 200, body: { kind: "legacy" } }))
    await expect(createHttpConsultationPersistence("cs_test_1234").load()).rejects.toThrow()
  })

  it("refuses a payload missing `started`, rather than guessing Orientation", async () => {
    stubFetch(() => ({
      status: 200,
      body: {
        kind: "deterministic",
        bankVersion: CONSULTATION_BANK_V1,
        context: { foundation: "you", lens: null },
        candidateAnswers: {},
        touchedQuestionIds: [],
        skippedOptionalQuestionIds: [],
        currentQuestionId: null,
        phase: "questions",
      },
    }))
    await expect(createHttpConsultationPersistence("cs_test_1234").load()).rejects.toThrow()
  })

  it("refuses a 409 rather than starting from scratch", async () => {
    stubFetch(() => ({ status: 409, body: { error: "This Consultation cannot be resumed" } }))
    await expect(createHttpConsultationPersistence("cs_test_1234").load()).rejects.toThrow()
  })

  it("sends one explicit action per write", async () => {
    stubFetch(() => ({ status: 200, body: { ok: true } }))
    const p = createHttpConsultationPersistence("cs_test_1234")
    await p.saveAnswer(Q1, "bloating")
    await p.clearAnswer(Q1)
    await p.skipOptional(AVOIDANCES)
    await p.saveCursor(null)

    const bodies = seen.map((s) => JSON.parse(String(s.init!.body)))
    expect(bodies.map((b) => b.action)).toEqual(["answer", "clear", "skip", "navigate"])
    expect(bodies[0]).toEqual({ action: "answer", questionId: Q1, value: "bloating", sessionId: "cs_test_1234" })
    expect(bodies[3]).toEqual({ action: "navigate", currentQuestionId: null, sessionId: "cs_test_1234" })
    // A body the strict server schema would refuse is a body this must not send.
    for (const body of bodies) expect(body).not.toHaveProperty("phase")
  })

  it("separates retryable transport faults from permanent refusals", async () => {
    stubFetch(() => ({ status: 503 }))
    expect(await createHttpConsultationPersistence("cs_x_1234").saveAnswer(Q1, "bloating")).toEqual({
      ok: false,
      retryable: true,
    })
    stubFetch(() => ({ status: 422 }))
    expect(await createHttpConsultationPersistence("cs_x_1234").saveAnswer(Q1, "bad")).toEqual({
      ok: false,
      retryable: false,
    })
  })

  it("turns a review refusal into somewhere to send the customer", async () => {
    stubFetch(() => ({
      status: 409,
      body: {
        error: "Your Consultation is not finished yet",
        firstQuestionId: Q2,
        missingQuestionIds: [Q2],
        invalidQuestionIds: [],
      },
    }))
    const outcome = await createHttpConsultationPersistence("cs_x_1234").enterReview()
    expect(outcome).toEqual({
      ok: false,
      incomplete: { firstQuestionId: Q2, missingQuestionIds: [Q2], invalidQuestionIds: [] },
    })
  })

  it("a review failure that is not a refusal carries no question ids to trust", async () => {
    stubFetch(() => ({ status: 503, body: { error: "Could not open your review" } }))
    expect(await createHttpConsultationPersistence("cs_x_1234").enterReview()).toEqual({
      ok: false,
      failed: true,
    })
  })
})

/* ══ The save queue ════════════════════════════════════════════════════════ */

describe("answers are queued through the shared autosave discipline", () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  /** The queue exactly as the hook builds it: `send` IS the adapter. */
  function queueOver(adapter: ReturnType<typeof fakeAdapter>, onStatus?: (s: AutosaveStatus) => void) {
    return createAnswerAutosave({
      onStatus,
      send: (questionId, value) => adapter.persistence.saveAnswer(questionId, value as string),
    })
  }

  it("the newest value for one question is the one that reaches the server", async () => {
    const adapter = fakeAdapter()
    const queue = queueOver(adapter)
    queue.queue(Q1, "fullness")
    queue.queue(Q1, "bloating")
    queue.queue(Q1, "dip")

    await vi.advanceTimersByTimeAsync(1000)
    await queue.flush()

    expect(adapter.saved.at(-1)).toEqual({ questionId: Q1, value: "dip" })
  })

  it("flush reports true only when everything actually landed", async () => {
    const ok = fakeAdapter()
    const okQueue = queueOver(ok)
    okQueue.queue(Q1, "bloating")
    expect(await okQueue.flush()).toBe(true)

    const broken = fakeAdapter({ save: { ok: false, retryable: false } })
    const brokenQueue = queueOver(broken)
    brokenQueue.queue(Q1, "bloating")
    expect(await brokenQueue.flush()).toBe(false)
  })

  it("status reaches Saved only after the server confirms", async () => {
    const seen: AutosaveStatus[] = []
    const adapter = fakeAdapter()
    const queue = queueOver(adapter, (s) => seen.push(s))
    queue.queue(Q1, "bloating")
    // Nothing has been sent yet — the debounce window is real, which is why no
    // copy anywhere may promise an instant save.
    expect(seen).not.toContain("saved")
    await queue.flush()
    expect(seen).toContain("saved")
  })

  it("a failed save reports unsaved rather than staying quiet", async () => {
    const seen: AutosaveStatus[] = []
    const adapter = fakeAdapter({ save: { ok: false, retryable: false } })
    const queue = queueOver(adapter, (s) => seen.push(s))
    queue.queue(Q1, "bloating")
    await queue.flush()
    expect(seen).toContain("unsaved")
  })

  it("cancelling on unmount sends nothing and claims nothing", async () => {
    const seen: AutosaveStatus[] = []
    const adapter = fakeAdapter()
    const queue = queueOver(adapter, (s) => seen.push(s))
    queue.queue(Q1, "bloating")
    queue.cancel()
    await vi.advanceTimersByTimeAsync(5000)

    expect(adapter.saved).toEqual([])
    expect(seen).not.toContain("saved")
  })
})

/* ══ Skip and answer share one order ═══════════════════════════════════════ */

describe("the customer's newest intent for a question is what the server ends up with", () => {
  /** An adapter whose answer save can be held open, to model one in flight. */
  function heldAdapter() {
    const calls: string[] = []
    let release: (() => void) | null = null
    const inFlight = new Promise<void>((resolve) => {
      release = resolve
    })

    const persistence: ConsultationPersistence = {
      load: async () => {
        throw new Error("unused")
      },
      async saveAnswer(questionId) {
        calls.push(`answer:${questionId}`)
        await inFlight
        calls.push(`answer-settled:${questionId}`)
        return { ok: true }
      },
      async clearAnswer(questionId) {
        calls.push(`clear:${questionId}`)
        return { ok: true }
      },
      async skipOptional(questionId) {
        calls.push(`skip:${questionId}`)
        return { ok: true }
      },
      async saveCursor(questionId) {
        calls.push(`cursor:${questionId ?? "null"}`)
        return { ok: true }
      },
      async enterReview() {
        return { ok: true }
      },
      async leaveReview(questionId) {
        calls.push(`leave-review:${questionId}`)
        return { ok: true }
      },
    }

    return { persistence, calls, release: () => release?.() }
  }

  it("a skip REPLACES an answer that is still pending, so the answer is never sent", async () => {
    const adapter = fakeAdapter()
    const queue = createConsultationMutationQueue(adapter.persistence)

    queue.queueAnswer(AVOIDANCES, ["dairy"])
    queue.queueSkip(AVOIDANCES)
    expect(await queue.flush()).toBe(true)

    // The answer never reached the wire at all — there was nothing to resurrect.
    expect(adapter.saved).toEqual([])
    expect(adapter.calls).toEqual([`skip:${AVOIDANCES}`])
  })

  it("a skip queued behind an IN-FLIGHT answer is sent after it, never before", async () => {
    const held = heldAdapter()
    const queue = createConsultationMutationQueue(held.persistence)

    queue.queueAnswer(AVOIDANCES, ["dairy"])
    const flushing = queue.flush()
    // Let the answer reach `send` and block there.
    await Promise.resolve()
    await Promise.resolve()
    queue.queueSkip(AVOIDANCES)
    held.release()

    expect(await flushing).toBe(true)
    // Order is the whole assertion: the skip is the LAST thing the server sees,
    // so the answer cannot land afterwards and un-skip itself.
    expect(held.calls).toEqual([
      `answer:${AVOIDANCES}`,
      `answer-settled:${AVOIDANCES}`,
      `skip:${AVOIDANCES}`,
    ])
    expect(held.calls.at(-1)).toBe(`skip:${AVOIDANCES}`)
  })

  it("Skip through the navigation contract lands before the customer moves", async () => {
    const adapter = fakeAdapter()
    const { deps } = queuedDepsFor(adapter)
    const s = createConsultationSession({
      context: you,
      answers: { [Q1]: "nothing", [CONSTRAINTS]: ["allergy"] },
      startAtQuestionId: AVOIDANCES,
    })

    const outcome = await skipFrom(s, AVOIDANCES, deps)

    expect(outcome.status).toBe("moved")
    expect(adapter.calls[0]).toBe(`skip:${AVOIDANCES}`)
    expect(adapter.calls[1]).toMatch(/^cursor:/)
  })
})

/* ══ Continue on an unanswered optional question ═══════════════════════════ */

describe("passing an optional question is stored as a decision, not as silence", () => {
  const atAvoidances = () =>
    createConsultationSession({
      context: you,
      answers: { [Q1]: "nothing", [CONSTRAINTS]: ["allergy"] },
      startAtQuestionId: AVOIDANCES,
    })

  it("Continue on an empty optional question persists the same skip the button does", async () => {
    const adapter = fakeAdapter()
    const { deps } = queuedDepsFor(adapter)

    const outcome = await continueFrom(atAvoidances(), deps)

    expect(outcome.status).toBe("moved")
    expect(adapter.calls[0]).toBe(`skip:${AVOIDANCES}`)
    // And the engine agrees, so a reload and the live state say the same thing.
    expect(outcome.status === "moved" && outcome.state.skipped.has(AVOIDANCES)).toBe(true)
    expect(outcome.status === "moved" && outcome.state.answers[AVOIDANCES]).toBeUndefined()
  })

  it("Continue and Skip converge on the identical persisted state", async () => {
    const viaContinue = fakeAdapter()
    const viaButton = fakeAdapter()

    const a = await continueFrom(atAvoidances(), queuedDepsFor(viaContinue).deps)
    const b = await skipFrom(atAvoidances(), AVOIDANCES, queuedDepsFor(viaButton).deps)

    expect(viaContinue.calls).toEqual(viaButton.calls)
    expect(a.status === "moved" && [...a.state.skipped]).toEqual(
      b.status === "moved" ? [...b.state.skipped] : null,
    )
  })

  it("choosing to decline is an ANSWER and records no skip", async () => {
    const adapter = fakeAdapter()
    const { deps } = queuedDepsFor(adapter)
    const answered = setAnswer(atAvoidances(), AVOIDANCES, ["prefer-not-to-say"])

    const outcome = await continueFrom(answered, deps)

    expect(outcome.status).toBe("moved")
    expect(adapter.calls.some((c) => c.startsWith("skip:"))).toBe(false)
    expect(outcome.status === "moved" && outcome.state.answers[AVOIDANCES]).toEqual([
      "prefer-not-to-say",
    ])
    expect(outcome.status === "moved" && outcome.state.skipped.has(AVOIDANCES)).toBe(false)
  })

  it("an ANSWERED optional question is passed without recording a skip", async () => {
    const adapter = fakeAdapter()
    const { deps } = queuedDepsFor(adapter)
    const answered = setAnswer(atAvoidances(), AVOIDANCES, ["dairy"])

    await continueFrom(answered, deps)

    expect(adapter.calls.some((c) => c.startsWith("skip:"))).toBe(false)
  })

  it("Continue on a REQUIRED question records nothing and refuses", async () => {
    const adapter = fakeAdapter()
    const { deps } = queuedDepsFor(adapter)

    expect((await continueFrom(session(), deps)).status).toBe("refused")
    expect(adapter.calls).toEqual([])
  })

  it("answering a previously skipped question clears the skip", () => {
    const skipped = skipOptional(atAvoidances(), AVOIDANCES)
    expect(skipped.skipped.has(AVOIDANCES)).toBe(true)
    const answered = setAnswer(skipped, AVOIDANCES, ["dairy"])
    expect(answered.skipped.has(AVOIDANCES)).toBe(false)
    expect(answered.answers[AVOIDANCES]).toEqual(["dairy"])
  })
})

/* ══ Continue ══════════════════════════════════════════════════════════════ */

describe("Continue flushes before it moves, and refuses to move if it cannot", () => {
  it("flushes, then persists the new cursor, in that order", async () => {
    const adapter = fakeAdapter()
    const order: string[] = []
    const deps = depsFor(adapter.persistence, async () => {
      order.push("flush")
      return true
    })
    const originalCursor = deps.persistCursor
    deps.persistCursor = async (id) => {
      order.push("cursor")
      return originalCursor(id)
    }

    const outcome = await continueFrom(setAnswer(session(), Q1, "bloating"), deps)

    expect(outcome.status).toBe("moved")
    expect(order).toEqual(["flush", "cursor"])
    expect(adapter.cursors).toEqual([Q2])
  })

  it("a failed flush blocks the advance and stores no cursor", async () => {
    const adapter = fakeAdapter()
    const deps = depsFor(adapter.persistence, async () => false)

    const outcome = await continueFrom(setAnswer(session(), Q1, "bloating"), deps)

    expect(outcome.status).toBe("save-failed")
    expect(adapter.calls).toEqual([])
  })

  it("a failed cursor write blocks the advance too", async () => {
    const adapter = fakeAdapter({ cursor: { ok: false, retryable: true } })
    const deps = depsFor(adapter.persistence, async () => true)

    const outcome = await continueFrom(setAnswer(session(), Q1, "bloating"), deps)

    expect(outcome.status).toBe("save-failed")
  })

  it("a refused question never reaches the network at all", async () => {
    const adapter = fakeAdapter()
    let flushed = false
    const deps = depsFor(adapter.persistence, async () => {
      flushed = true
      return true
    })

    // Required, unanswered.
    const outcome = await continueFrom(session(), deps)

    expect(outcome.status).toBe("refused")
    expect(outcome.status === "refused" && outcome.state.validationError).toBeTruthy()
    expect(flushed).toBe(false)
    expect(adapter.calls).toEqual([])
  })
})

/* ══ Navigation and skips ══════════════════════════════════════════════════ */

describe("every position the customer reaches is stored before they see it", () => {
  const deps = (adapter: ReturnType<typeof fakeAdapter>) =>
    depsFor(adapter.persistence, async () => true)

  it("Back persists the previous applicable question", async () => {
    const adapter = fakeAdapter()
    const s = setAnswer(session(), Q1, "bloating")
    const moved = await continueFrom(s, deps(adapter))
    expect(moved.status).toBe("moved")

    const from = (moved as { state: ConsultationSessionState }).state
    const back = await commitMove(from, goBack(from), deps(adapter))

    expect(back.status).toBe("moved")
    expect(adapter.cursors.at(-1)).toBe(Q1)
  })

  it("a failed cursor write on Back leaves the customer where they were", async () => {
    const adapter = fakeAdapter({ cursor: { ok: false, retryable: true } })
    const s = setAnswer(session({ [Q1]: "bloating" }), Q2, "steady")
    expect((await commitMove(s, goBack(s), deps(adapter))).status).toBe("save-failed")
  })

  it("an optional skip is persisted before the move", async () => {
    const adapter = fakeAdapter()
    const s = createConsultationSession({
      context: you,
      answers: { [Q1]: "nothing", [CONSTRAINTS]: ["allergy"] },
      startAtQuestionId: AVOIDANCES,
    })

    const outcome = await skipFrom(s, AVOIDANCES, deps(adapter))

    expect(outcome.status).toBe("moved")
    expect(adapter.calls[0]).toBe(`skip:${AVOIDANCES}`)
    expect(adapter.calls[1]).toMatch(/^cursor:/)
  })

  it("a failed skip write does not move the customer past the question", async () => {
    // Through the real queue: a skip that does not land surfaces as a failed
    // flush, which is the only way the caller can know.
    const adapter = fakeAdapter({ skip: { ok: false, retryable: false } })
    const s = createConsultationSession({
      context: you,
      answers: { [Q1]: "nothing", [CONSTRAINTS]: ["allergy"] },
      startAtQuestionId: AVOIDANCES,
    })

    expect((await skipFrom(s, AVOIDANCES, queuedDepsFor(adapter).deps)).status).toBe("save-failed")
    expect(adapter.cursors).toEqual([])
  })

  it("a REQUIRED question cannot be skipped, and nothing is sent", async () => {
    const adapter = fakeAdapter()
    expect((await skipFrom(session(), Q1, deps(adapter))).status).toBe("refused")
    expect(adapter.calls).toEqual([])
  })

  it("opening a Review item persists that exact cursor", async () => {
    const adapter = fakeAdapter()
    const s = createConsultationSession({
      context: you,
      answers: { [Q1]: "nothing" },
      phase: "review",
      startAtQuestionId: null,
    })

    const outcome = await commitMove(s, editFromReview(s, Q2), deps(adapter))

    expect(outcome.status).toBe("moved")
    // A cursor write, NOT the retreat: the phase stays `review`, which is what
    // makes an interrupted edit resumable as an edit.
    expect(adapter.cursors).toEqual([Q2])
    expect(adapter.left).toEqual([])
  })
})

/* ══ Review entry is the server's call ═════════════════════════════════════ */

describe("the browser asks to enter Review and the server answers", () => {
  it("a server yes moves the customer to the Review list", async () => {
    const adapter = fakeAdapter({ review: { ok: true } })
    const complete = { ...session({ [Q1]: "nothing" }), phase: "review" as const, currentQuestionId: null }

    const outcome = await commitMove(complete, complete, depsFor(adapter.persistence, async () => true))

    expect(outcome.status).toBe("moved")
    expect(adapter.calls).toEqual(["review"])
    // Entering Review is a request, not a cursor write: the server owns the
    // transition and writes the cleared cursor itself.
    expect(adapter.cursors).toEqual([])
  })

  it("a server refusal sends the customer to the named question, not to an error", async () => {
    const adapter = fakeAdapter({
      review: {
        ok: false,
        incomplete: { firstQuestionId: Q3, missingQuestionIds: [Q3], invalidQuestionIds: [] },
      },
    })
    const complete = { ...session({ [Q1]: "bloating" }), phase: "review" as const, currentQuestionId: null }

    const outcome = await commitMove(complete, complete, depsFor(adapter.persistence, async () => true))

    expect(outcome.status).toBe("moved")
    expect(outcome.status === "moved" && outcome.state.phase).toBe("questions")
    expect(outcome.status === "moved" && outcome.state.currentQuestionId).toBe(Q3)
    // Stored as an EXIT, not a cursor move: storage that still said `review`
    // would read this as an edit on the next load.
    expect(adapter.left).toEqual([Q3])
    expect(adapter.cursors).toEqual([])
  })

  it("a server failure keeps the customer where they are", async () => {
    const adapter = fakeAdapter({ review: { ok: false, failed: true } })
    const complete = { ...session({ [Q1]: "nothing" }), phase: "review" as const, currentQuestionId: null }

    expect(
      (await commitMove(complete, complete, depsFor(adapter.persistence, async () => true))).status,
    ).toBe("save-failed")
  })

  it("a client-side completeness verdict is never sent as a claim", async () => {
    const adapter = fakeAdapter({ review: { ok: true } })
    const complete = { ...session({ [Q1]: "nothing" }), phase: "review" as const, currentQuestionId: null }
    await commitMove(complete, complete, depsFor(adapter.persistence, async () => true))
    // `enterReview()` takes no arguments at all, so there is nothing to assert.
    expect(adapter.persistence.enterReview.length).toBe(0)
  })
})

/* ══ Boundaries ════════════════════════════════════════════════════════════ */

describe("the persisted wrapper is dormant and stays inside its boundary", () => {
  const DIR = join(process.cwd(), "components/assessment/consultation")
  const read = (f: string) => readFileSync(join(DIR, f), "utf8")
  const files = readdirSync(DIR).filter((f) => f.endsWith(".ts") || f.endsWith(".tsx"))

  it("no real paid route renders it", () => {
    const page = readFileSync(join(process.cwd(), "app/assessment/deep/page.tsx"), "utf8")
    const realFlow = page.slice(page.indexOf("// ── Real flow "))
    expect(realFlow).toContain("<DeepAssessmentClient")
    expect(realFlow).not.toContain("Persisted")
    expect(realFlow).not.toContain("Deterministic")
  })

  it("nothing outside this directory imports it at all", () => {
    const roots = ["app", "components", "lib", "scripts"]
    const walk = (dir: string, out: string[] = []): string[] => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const full = join(dir, entry.name)
        if (entry.isDirectory()) walk(full, out)
        else if (/\.(ts|tsx|mjs)$/.test(entry.name)) out.push(full)
      }
      return out
    }
    const importers = roots
      .flatMap((r) => walk(join(process.cwd(), r)))
      .filter((f) => !f.startsWith(DIR))
      // Import specifiers only. These module names appear in prose elsewhere,
      // and a guard that counted a mention as a caller would fail on a comment.
      .filter((f) =>
        /from\s+["'][^"']*(persisted-consultation-client|consultation-persistence|consultation-navigation)["']/.test(
          readFileSync(f, "utf8"),
        ),
      )
    expect(importers, "the persisted wrapper has acquired a caller").toEqual([])
  })

  it("only the adapter names an endpoint", () => {
    for (const file of files) {
      if (file === "consultation-persistence.ts") continue
      expect(read(file), file).not.toMatch(/["'`]\/api\//)
      expect(read(file), file).not.toMatch(/\bfetch\(/)
    }
  })

  it("no file in the directory can write the finalisation phase", () => {
    for (const file of files) {
      const source = read(file)
      expect(source, file).not.toMatch(/phase:\s*["']ready-for-report["']/)
      expect(source, file).not.toMatch(/(?<![=!])=\s*["']ready-for-report["']/)
    }
  })

  it("nor can the deterministic routes or the engine", () => {
    for (const file of [
      "app/api/consultation/progress/route.ts",
      "app/api/consultation/review/route.ts",
      "app/api/consultation/session/route.ts",
      "lib/consultation/session.ts",
      "lib/consultation/session-init.ts",
      "lib/consultation/review.ts",
    ]) {
      const source = readFileSync(join(process.cwd(), file), "utf8")
      expect(source, file).not.toMatch(/phase:\s*["']ready-for-report["']/)
      expect(source, file).not.toMatch(/(?<![=!])=\s*["']ready-for-report["']/)
    }
  })

  it("nothing here can begin a Report", () => {
    for (const file of files) {
      const source = read(file)
      expect(source, file).not.toContain("submit-deep-assessment")
      expect(source, file).not.toContain("generate-deep-questions")
      expect(source, file).not.toMatch(/anthropic|openai|claude-|gpt-/i)
      expect(source, file).not.toMatch(/report-?pdf|sendReport|reportPrompt/i)
    }
  })

  it("the load failure says nothing technical", () => {
    const source = read("persisted-consultation-client.tsx")
    expect(source).toContain("We couldn't load your Consultation. Please try again.")
    expect(source).toContain("We couldn't save that yet. Try Continue again.")
    // No status codes, no table names, no provider names in what is displayed.
    // Scoped to the two message constants: they are the whole of the customer
    // copy this component owns, and a whole-file scan would be reading comments.
    const messages = [...source.matchAll(/_MESSAGE = "([^"]+)"/g)].map((m) => m[1])
    expect(messages).toHaveLength(2)
    for (const message of messages) {
      expect(message, message).not.toMatch(/supabase|stripe|\b\d{3}\b|postgres|deep_assessments|bank/i)
    }
  })
})

/* ══ Withdrawing an optional answer ════════════════════════════════════════ */

/**
 * Phase 3C-C1 — the customer takes an optional answer back, on a real session.
 *
 * ══ WHY THE ORDER IS THE TEST ═══════════════════════════════════════════════
 *
 * Every case below is about WHEN the local state changes relative to the write.
 * A withdrawal that updates the screen first would show the customer their
 * disclosure vanishing while the server still held it, and the next resume
 * would hand it back — the worst possible way to learn that a removal did not
 * take. So the answer stays visible until the server has confirmed, and these
 * assertions are what stop that being reversed by a later refactor.
 */
describe("removing an optional answer is saved before it is shown as removed", () => {
  /** A complete You session sitting on the Review list, as a resume would leave it. */
  function reviewSession() {
    const answers: ConsultationAnswers = {
      [Q1]: "nothing",
      [CONSTRAINTS]: ["allergy"],
      [AVOIDANCES]: ["dairy"],
    }
    for (let pass = 0; pass < 3; pass += 1) {
      for (const q of CONSULTATION_QUESTION_BANK) {
        if (!q.foundations.includes("you")) continue
        if (q.id in answers) continue
        if (q.type === "single") answers[q.id] = q.options![0].value
        else if (q.type === "multi") answers[q.id] = [q.options![0].value]
        else if (q.type === "textarea") answers[q.id] = "A sentence that is a real answer."
        else answers[q.id] = q.min ?? 0
      }
    }
    const s = enterReview(begin(createConsultationSession({ context: you, answers })))
    // The fixture is only meaningful if it is genuinely complete: `enterReview`
    // refuses otherwise, so this assertion is what makes the rest trustworthy.
    expect(isReviewing(s)).toBe(true)
    return s
  }

  it("the server records the skip, and only then does the answer go", async () => {
    const adapter = fakeAdapter()
    const { deps } = queuedDepsFor(adapter)
    const before = reviewSession()

    const outcome = await withdrawFrom(before, AVOIDANCES, deps)

    expect(adapter.calls).toEqual([`skip:${AVOIDANCES}`])
    expect(outcome.status).toBe("moved")
    if (outcome.status !== "moved") throw new Error("unreachable")
    expect(outcome.state.answers[AVOIDANCES]).toBeUndefined()
    expect(outcome.state.skipped.has(AVOIDANCES)).toBe(true)
  })

  it("a failed save leaves the answer on screen and says so", async () => {
    const adapter = fakeAdapter({ skip: { ok: false, retryable: true } })
    const { deps } = queuedDepsFor(adapter)
    const before = reviewSession()

    const outcome = await withdrawFrom(before, AVOIDANCES, deps)

    expect(outcome.status).toBe("save-failed")
    // No new state is handed back, so the caller keeps rendering the answer.
    expect(outcome).not.toHaveProperty("state")
    expect(before.answers[AVOIDANCES]).toEqual(["dairy"])
  })

  it("nothing moves — no cursor, no review entry, no leaving Review", async () => {
    const adapter = fakeAdapter()
    const { deps } = queuedDepsFor(adapter)

    const outcome = await withdrawFrom(reviewSession(), AVOIDANCES, deps)

    expect(adapter.calls.some((c) => c.startsWith("cursor:"))).toBe(false)
    expect(adapter.calls).not.toContain("review")
    expect(adapter.calls.some((c) => c.startsWith("leave-review:"))).toBe(false)
    if (outcome.status !== "moved") throw new Error("unreachable")
    expect(isReviewing(outcome.state)).toBe(true)
    expect(outcome.state.currentQuestionId).toBeNull()
    expect(isEditingFromReview(outcome.state)).toBe(false)
  })

  it("it sends the SAME server action the Skip button sends", async () => {
    // One action, one meaning. A separate "withdraw" action would be a second
    // way to say a thing the server already understands, and the newer one
    // would be the less-tested path carrying the customer's removal.
    const viaWithdraw = fakeAdapter()
    await withdrawFrom(reviewSession(), AVOIDANCES, queuedDepsFor(viaWithdraw).deps)

    const viaSkip = fakeAdapter()
    await skipFrom(
      createConsultationSession({
        context: you,
        answers: { [Q1]: "nothing", [CONSTRAINTS]: ["allergy"] },
        startAtQuestionId: AVOIDANCES,
      }),
      AVOIDANCES,
      queuedDepsFor(viaSkip).deps,
    )

    expect(viaWithdraw.calls[0]).toBe(`skip:${AVOIDANCES}`)
    expect(viaSkip.calls[0]).toBe(viaWithdraw.calls[0])
    // Skip moves the customer on; a withdrawal from Review does not.
    expect(viaSkip.calls[1]).toMatch(/^cursor:/)
    expect(viaWithdraw.calls).toHaveLength(1)
  })

  it("a still-pending answer for the same question never reaches the server", async () => {
    // The race this closes: the customer edits, then immediately removes. The
    // shared per-question queue drops the superseded answer, so nothing can land
    // after the skip and restore the value they just took back.
    const adapter = fakeAdapter()
    const { deps, queue } = queuedDepsFor(adapter)
    queue.queueAnswer(AVOIDANCES, ["nuts"])

    const outcome = await withdrawFrom(reviewSession(), AVOIDANCES, deps)

    expect(outcome.status).toBe("moved")
    expect(adapter.saved).toEqual([])
    expect(adapter.calls).toEqual([`skip:${AVOIDANCES}`])
  })

  it("a REQUIRED question asks the server for nothing at all", async () => {
    const adapter = fakeAdapter()
    const { deps } = queuedDepsFor(adapter)

    const outcome = await withdrawFrom(reviewSession(), Q1, deps)

    expect(outcome.status).toBe("refused")
    expect(adapter.calls).toEqual([])
  })

  it("an already-skipped question asks the server for nothing either", async () => {
    const adapter = fakeAdapter()
    const { deps } = queuedDepsFor(adapter)
    const already = skipOptional(reviewSession(), AVOIDANCES)

    const outcome = await withdrawFrom(already, AVOIDANCES, deps)

    expect(outcome.status).toBe("refused")
    expect(adapter.calls).toEqual([])
  })

  it("a question whose branch has closed asks the server for nothing", async () => {
    // Its answer is retained, not withdrawn — the customer never un-said it.
    const adapter = fakeAdapter()
    const { deps } = queuedDepsFor(adapter)
    const closed = setAnswer(reviewSession(), CONSTRAINTS, ["budget"])

    const outcome = await withdrawFrom(closed, AVOIDANCES, deps)

    expect(outcome.status).toBe("refused")
    expect(adapter.calls).toEqual([])
    expect(closed.answers[AVOIDANCES]).toEqual(["dairy"])
  })
})

/* ══ The withdrawal states its position ════════════════════════════════════ */

/**
 * Phase 3C-C1 corrections — the client half of the atomic Review withdrawal.
 *
 * The server cannot infer where the customer is standing. A skip that names no
 * position is resolved against the stored cursor, and on the Review list the
 * stored cursor is `null` — the one value that looks like "nothing stored".
 * So the client says it outright, in the same request that removes the answer.
 *
 * The route is asserted separately, in `consultation-api-routes.test.ts`.
 * Neither test proves the other: with both layers correct, a regression in
 * either one alone would be masked by the other.
 */
describe("a Review withdrawal tells the server where the customer is", () => {
  function reviewSession() {
    const answers: ConsultationAnswers = {
      [Q1]: "nothing",
      [CONSTRAINTS]: ["allergy"],
      [AVOIDANCES]: ["dairy"],
    }
    for (let pass = 0; pass < 3; pass += 1) {
      for (const q of CONSULTATION_QUESTION_BANK) {
        if (!q.foundations.includes("you")) continue
        if (q.id in answers) continue
        if (q.type === "single") answers[q.id] = q.options![0].value
        else if (q.type === "multi") answers[q.id] = [q.options![0].value]
        else if (q.type === "textarea") answers[q.id] = "A sentence that is a real answer."
        else answers[q.id] = q.min ?? 0
      }
    }
    const s = enterReview(begin(createConsultationSession({ context: you, answers })))
    expect(isReviewing(s)).toBe(true)
    return s
  }

  it("the skip carries an explicit null cursor — the Review list", async () => {
    const adapter = fakeAdapter()
    const { deps } = queuedDepsFor(adapter)

    await withdrawFrom(reviewSession(), AVOIDANCES, deps)

    expect(adapter.skips).toHaveLength(1)
    // Explicitly null, not absent. The two are different statements to the
    // route: "the position is the Review list" versus "I am not saying".
    expect(adapter.skips[0]).toEqual({ questionId: AVOIDANCES, currentQuestionId: null })
    expect(adapter.skips[0].currentQuestionId).toBeNull()
  })

  it("an ordinary Skip during the question flow names no cursor", async () => {
    // Non-regression: question flow keeps its own semantics, where the stored
    // cursor already names the question being passed and `skipFrom` persists
    // the new position itself once the move is committed.
    const adapter = fakeAdapter()
    const { deps } = queuedDepsFor(adapter)

    await skipFrom(
      createConsultationSession({
        context: you,
        answers: { [Q1]: "nothing", [CONSTRAINTS]: ["allergy"] },
        startAtQuestionId: AVOIDANCES,
      }),
      AVOIDANCES,
      deps,
    )

    expect(adapter.skips).toHaveLength(1)
    expect(adapter.skips[0].currentQuestionId).toBeUndefined()
  })

  it("the cursor survives the queue, rather than being dropped in transit", async () => {
    // The queue stores one pending mutation per question and sends the newest.
    // A cursor dropped on the way in would be invisible at the call site and
    // only show up as a wrong position in the database.
    const adapter = fakeAdapter()
    const { queue } = queuedDepsFor(adapter)

    queue.queueSkip(AVOIDANCES, null)
    expect(await queue.flush()).toBe(true)

    expect(adapter.skips[0].currentQuestionId).toBeNull()
  })

  it("a withdrawal still supersedes a pending answer, cursor and all", async () => {
    const adapter = fakeAdapter()
    const { deps, queue } = queuedDepsFor(adapter)
    queue.queueAnswer(AVOIDANCES, ["nuts"])

    await withdrawFrom(reviewSession(), AVOIDANCES, deps)

    expect(adapter.saved).toEqual([])
    expect(adapter.skips).toEqual([{ questionId: AVOIDANCES, currentQuestionId: null }])
  })
})

/* ══ Withdrawal is a Review-list operation ═════════════════════════════════ */

describe("withdrawal refuses from anywhere that is not the Review list", () => {
  const answered = (over: Partial<ConsultationSessionState> = {}) => ({
    ...begin(
      createConsultationSession({
        context: you,
        answers: { [Q1]: "nothing", [CONSTRAINTS]: ["allergy"], [AVOIDANCES]: ["dairy"] },
      }),
    ),
    ...over,
  })

  it("the question flow asks the server for nothing", async () => {
    const adapter = fakeAdapter()
    const { deps } = queuedDepsFor(adapter)

    const outcome = await withdrawFrom(
      answered({ phase: "questions", currentQuestionId: AVOIDANCES }),
      AVOIDANCES,
      deps,
    )

    expect(outcome.status).toBe("refused")
    expect(adapter.calls).toEqual([])
  })

  it("an open Review EDIT asks the server for nothing", async () => {
    const adapter = fakeAdapter()
    const { deps } = queuedDepsFor(adapter)

    const outcome = await withdrawFrom(
      answered({ phase: "review", currentQuestionId: AVOIDANCES }),
      AVOIDANCES,
      deps,
    )

    expect(outcome.status).toBe("refused")
    expect(adapter.calls).toEqual([])
  })
})
