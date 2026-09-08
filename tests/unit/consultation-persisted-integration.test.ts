import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { NextRequest } from "next/server"

import {
  createDeterministicConsultationSnapshot,
  readDeterministicConsultationSnapshot,
  DETERMINISTIC_STATE_KIND,
  DETERMINISTIC_STATE_SCHEMA_VERSION,
  type DeterministicConsultationState,
} from "@/lib/consultation/session-envelope"
import { CONSULTATION_QUESTION_BANK } from "@/lib/consultation/question-bank"
import { prepareConsultationFinalisation } from "@/lib/consultation/finalisation"
import { resolveApplicableQuestions } from "@/lib/consultation/applicability"
import type { ConsultationAnswers } from "@/lib/consultation/types"
import {
  begin,
  currentQuestion,
  editFromReview,
  goBack,
  isEditingFromReview,
  isReviewing,
  setAnswer,
  type ConsultationSessionState,
} from "@/lib/consultation/session"
import { buildConsultationReview } from "@/lib/consultation/review"
import { createHttpConsultationPersistence } from "@/components/assessment/consultation/consultation-persistence"
import {
  commitMove,
  continueFrom,
  skipFrom,
  withdrawFrom,
  type NavigationDeps,
  type NavigationOutcome,
} from "@/components/assessment/consultation/consultation-navigation"
import { hydratePersistedSession } from "@/components/assessment/consultation/persisted-consultation-client"

/**
 * Phase 3C-B — the persisted contract, end to end, with nothing real behind it.
 *
 * ══ WHAT THIS PROVES THAT THE OTHER FILES DO NOT ════════════════════════════
 *
 * The route tests exercise the server against a fake database. The client tests
 * exercise the client against a fake adapter. Both can pass while the two
 * disagree — a field the server names one way and the client reads another, a
 * refusal the server returns and the client cannot interpret, a cursor written
 * in a shape resume will not accept. This file puts the REAL client adapter in
 * front of the REAL route handlers and walks a whole Consultation through them:
 *
 *   load → Orientation → answer → save → navigate → review entry → reload
 *
 * ══ STILL NO ACTIVATION ═════════════════════════════════════════════════════
 *
 * Supabase is a fake, the paid summary is stubbed, and Stripe is a mocked object
 * whose settlement is checked for real. No payment is taken, no row is written
 * anywhere but in memory, and no page renders any of this for a paying customer.
 */

/* ── The fake row store ─────────────────────────────────────────────────── */

type Row = Record<string, unknown>

function makeDb(seed: Row) {
  const rows = new Map<string, Row>([[String(seed.stripe_session_id), { ...seed }]])

  function from(_table: string) {
    let action: "select" | "update" = "select"
    let payload: Row = {}
    let key: string | null = null
    const preds: Array<(r: Row) => boolean> = []

    const chain: Record<string, unknown> = {
      select: () => chain,
      update(p: Row) {
        action = "update"
        payload = p
        return chain
      },
      eq(col: string, val: unknown) {
        if (col === "stripe_session_id") key = String(val)
        else preds.push((r) => r[col] === val)
        return chain
      },
      is(col: string, val: unknown) {
        preds.push((r) => (r[col] ?? null) === val)
        return chain
      },
      maybeSingle: () => run(),
      then: (res: (v: unknown) => void, rej?: (e: unknown) => void) => run().then(res, rej),
    }

    async function run(): Promise<{ data: unknown; error: unknown }> {
      if (action === "select") {
        return { data: (key !== null ? rows.get(key) : undefined) ?? null, error: null }
      }
      const row = key !== null ? rows.get(key) : undefined
      if (!row || !preds.every((p) => p(row))) return { data: [], error: null }
      Object.assign(row, payload)
      return { data: [{ stripe_session_id: key }], error: null }
    }
    return chain
  }

  return {
    client: { from } as unknown,
    row: () => [...rows.values()][0],
    state: () => [...rows.values()][0].answers as DeterministicConsultationState,
  }
}

/* ── Mocks ──────────────────────────────────────────────────────────────── */

const mockGetSupabase = vi.fn()
const mockRetrieveSession = vi.fn()
const mockResolveSummary = vi.fn()

vi.mock("@/lib/supabase", () => ({ getSupabase: () => mockGetSupabase() }))
vi.mock("@/lib/stripe-server", () => ({
  stripe: { checkout: { sessions: { retrieve: (...a: unknown[]) => mockRetrieveSession(...a) } } },
}))
vi.mock("@/lib/paid-report-session", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/paid-report-session")>()
  return { ...actual, resolvePaidReportSummary: (...a: unknown[]) => mockResolveSummary(...a) }
})

/* ── Fixtures ───────────────────────────────────────────────────────────── */

const SESSION = "cs_test_integration_3cb"

const Q1 = "core_signals_post_meal_pattern_v1"
const Q2 = "core_signals_energy_shape_v1"
const Q3 = "core_signals_context_v1"

let db = makeDb({ stripe_session_id: SESSION })
const originalFetch = globalThis.fetch

/**
 * A distinct client per test.
 *
 * The routes rate-limit per IP from a module-level counter that outlives a
 * single test, so a shared address would make later tests fail on a 429 that
 * has nothing to do with what they are checking. Stamped where a proxy would
 * stamp it, not by the adapter.
 */
let clientIp = "203.0.113.1"

/**
 * `fetch`, wired straight to the route handlers.
 *
 * No HTTP server: the adapter builds a request, this hands it to the real
 * exported handler, and the real `Response` comes back. Everything between the
 * client's `fetch` call and the route's first line is therefore the actual
 * code, including the URL the adapter builds and the body it serialises.
 */
function wireFetchToRoutes() {
  globalThis.fetch = (async (input: unknown, init?: RequestInit) => {
    const url = String(input)
    const absolute = url.startsWith("http") ? url : `http://localhost${url}`

    const headers = { ...((init?.headers ?? {}) as Record<string, string>), "x-forwarded-for": clientIp }
    const body = init?.body as BodyInit | undefined

    if (absolute.includes("/api/consultation/session")) {
      const { GET } = await import("@/app/api/consultation/session/route")
      return GET(new NextRequest(absolute, { headers }))
    }
    if (absolute.includes("/api/consultation/progress")) {
      const { PATCH } = await import("@/app/api/consultation/progress/route")
      return PATCH(new NextRequest(absolute, { body, headers, method: "PATCH" }))
    }
    if (absolute.includes("/api/consultation/review")) {
      const { POST } = await import("@/app/api/consultation/review/route")
      return POST(new NextRequest(absolute, { body, headers, method: "POST" }))
    }
    // Phase 3C-C2B: Finish goes over the wire like everything else, so the
    // sealed row this file then reloads is one the REAL route wrote.
    if (absolute.includes("/api/consultation/finalise")) {
      const { POST } = await import("@/app/api/consultation/finalise/route")
      return POST(new NextRequest(absolute, { body, headers, method: "POST" }))
    }
    throw new Error(`unrouted request: ${absolute}`)
  }) as typeof globalThis.fetch
}

const persistence = () => createHttpConsultationPersistence(SESSION)

const depsFor = (): NavigationDeps => {
  const p = persistence()
  return {
    // The real queue is covered in the client tests; here the interest is the
    // ordering across the wire, so the flush is a direct save of nothing
    // outstanding.
    flush: async () => true,
    persistCursor: (id) => p.saveCursor(id),
    // The real ordered queue is exercised in the client tests; here the
    // interest is the wire contract, so the skip goes straight out.
    queueSkip: (id, cursor) => void p.skipOptional(id, cursor),
    requestReview: () => p.enterReview(),
    leaveReview: (id) => p.leaveReview(id),
    finalise: () => p.finalise(),
  }
}

/** Assert a navigation actually moved, and narrow to the state it moved to. */
function mustMove(outcome: NavigationOutcome, what: string): ConsultationSessionState {
  expect(outcome.status, what).toBe("moved")
  if (outcome.status !== "moved") throw new Error(what)
  return outcome.state
}

/** Load from the server and hydrate, exactly as the wrapper does on mount. */
async function load() {
  const hydrated = hydratePersistedSession(await persistence().load())
  // Phase 3C-C2B: a sealed Consultation hydrates as `completed` and has no
  // session. Every walk in this file is a live one, so this asserts rather than
  // casts — a silently sealed fixture would otherwise read as a load failure.
  expect(hydrated.kind, "expected a live session").toBe("session")
  if (hydrated.kind !== "session") throw new Error("unreachable")
  return hydrated
}

/** Answer the current question over the wire, then Continue. */
async function answerAndContinue(state: ConsultationSessionState, value: unknown) {
  const q = currentQuestion(state)!
  const saved = await persistence().saveAnswer(q.id, value as never)
  expect(saved.ok, `saving ${q.id}`).toBe(true)
  return mustMove(
    await continueFrom(setAnswer(state, q.id, value as never), depsFor()),
    `continuing past ${q.id}`,
  )
}

/** A valid answer for whatever question the customer is on. */
function validValueFor(state: ConsultationSessionState): unknown {
  const q = currentQuestion(state)!
  if (q.type === "single") return q.options![0].value
  if (q.type === "multi") return [q.options![0].value]
  if (q.type === "textarea") return "A sentence that is a real answer."
  return q.min ?? 0
}

let ipCounter = 0
beforeEach(() => {
  vi.clearAllMocks()
  ipCounter += 1
  clientIp = `203.0.113.${ipCounter}`
  db = makeDb({
    stripe_session_id: SESSION,
    tier: "personal",
    questions: createDeterministicConsultationSnapshot({ foundation: "you", entitledLens: null }),
    answers: null,
    status: "in_progress",
    report_json: null,
    pdf_url: null,
    updated_at: null,
  })
  mockGetSupabase.mockReturnValue(db.client)
  mockRetrieveSession.mockResolvedValue({ id: SESSION, payment_status: "paid", metadata: {} })
  mockResolveSummary.mockResolvedValue({ foundationType: "you", selectedAddon: null })
  wireFetchToRoutes()
})

afterEach(() => {
  globalThis.fetch = originalFetch
})

/* ══ The whole walk ════════════════════════════════════════════════════════ */

describe("a persisted Consultation runs end to end without a real payment", () => {
  it("a session nobody has opened loads onto Orientation", async () => {
    const { session, fresh } = await load()
    expect(fresh).toBe(true)
    expect(session.currentQuestionId).toBeNull()
    expect(currentQuestion(session)).toBeNull()
  })

  it("Begin persists the first question, so a reload resumes there", async () => {
    const { session } = await load()
    const outcome = await commitMove(session, begin(session), depsFor())
    expect(outcome.status).toBe("moved")

    const again = await load()
    expect(again.fresh, "the session is no longer new").toBe(false)
    expect(currentQuestion(again.session)?.id).toBe(Q1)
  })

  it("an answer survives a full reload as the identical canonical value", async () => {
    const { session } = await load()
    const started = mustMove(await commitMove(session, begin(session), depsFor()), "Begin")
    await answerAndContinue(started, "bloating")

    const again = await load()
    expect(again.session.answers[Q1]).toBe("bloating")
    expect(again.session.touched.has(Q1), "a stored answer is a touched answer").toBe(true)
  })

  it("answering the trigger opens its branch on the server as well as the client", async () => {
    const { session } = await load()
    const started = mustMove(await commitMove(session, begin(session), depsFor()), "Begin")
    const after = await answerAndContinue(started, "bloating")

    // The client moved into the branch...
    expect(after.currentQuestionId).toBe(Q2)
    // ...and the server accepted a cursor into it, which it would refuse if its
    // own applicability disagreed.
    const cursorIntoBranch = await persistence().saveCursor(Q3)
    expect(cursorIntoBranch.ok).toBe(true)
  })

  it("the server refuses a cursor to a question its own engine says does not apply", async () => {
    const { session } = await load()
    const started = mustMove(await commitMove(session, begin(session), depsFor()), "Begin")
    await answerAndContinue(started, "nothing")

    expect((await persistence().saveCursor(Q3)).ok).toBe(false)
  })

  it("a deliberate skip comes back as a skip and not as an answer", async () => {
    const { session } = await load()
    let s = mustMove(await commitMove(session, begin(session), depsFor()), "Begin")
    s = await answerAndContinue(s, "nothing")
    // Walk to the constraints question, taking a safety constraint so the
    // optional avoidance question opens.
    for (let i = 0; i < 20 && currentQuestion(s)?.id !== "core_environment_constraints_v1"; i += 1) {
      s = await answerAndContinue(s, validValueFor(s))
    }
    s = await answerAndContinue(s, ["allergy"])
    expect(currentQuestion(s)?.id).toBe("core_environment_food_avoidances_v1")

    const skipped = await persistence().skipOptional("core_environment_food_avoidances_v1")
    expect(skipped.ok).toBe(true)

    const again = await load()
    expect(again.session.skipped.has("core_environment_food_avoidances_v1")).toBe(true)
    expect(again.session.answers["core_environment_food_avoidances_v1"]).toBeUndefined()
  })

  it("completing the Consultation enters Review, and a reload comes back to Review", async () => {
    const { session } = await load()
    let s = mustMove(await commitMove(session, begin(session), depsFor()), "Begin")
    for (let i = 0; i < 40 && !isReviewing(s); i += 1) {
      s = await answerAndContinue(s, validValueFor(s))
    }

    expect(isReviewing(s)).toBe(true)
    expect(db.state().phase).toBe("review")
    expect(db.state().currentQuestionId).toBeNull()

    const again = await load()
    expect(isReviewing(again.session), "a reload returns to Review, not to question one").toBe(true)
  })

  it("Review shows exactly what the server stored, in customer wording", async () => {
    const { session } = await load()
    let s = mustMove(await commitMove(session, begin(session), depsFor()), "Begin")
    for (let i = 0; i < 40 && !isReviewing(s); i += 1) {
      s = await answerAndContinue(s, validValueFor(s))
    }

    const reloaded = (await load()).session
    const review = buildConsultationReview({
      context: reloaded.context,
      candidateAnswers: reloaded.answers,
      skippedOptionalQuestionIds: [...reloaded.skipped],
    })
    expect(review.complete).toBe(true)
    expect(review.missingRequiredIds).toEqual([])
    for (const item of review.sections.flatMap((x) => x.items)) {
      expect(item.question, item.questionId).not.toMatch(/core_[a-z]/)
    }
  })

  it("an interrupted Review edit is resumable from the stored pair alone", async () => {
    const { session } = await load()
    let s = mustMove(await commitMove(session, begin(session), depsFor()), "Begin")
    for (let i = 0; i < 40 && !isReviewing(s); i += 1) {
      s = await answerAndContinue(s, validValueFor(s))
    }

    const opened = await commitMove(s, editFromReview(s, Q2), depsFor())
    expect(opened.status).toBe("moved")

    // Nothing else was stored — phase stayed `review` and only the cursor moved.
    expect(db.state().phase).toBe("review")
    expect(db.state().currentQuestionId).toBe(Q2)

    const again = await load()
    expect(again.session.phase).toBe("review")
    expect(currentQuestion(again.session)?.id).toBe(Q2)
  })

  it("an edit that opens a required branch is refused Review by the server", async () => {
    const { session } = await load()
    let s = mustMove(await commitMove(session, begin(session), depsFor()), "Begin")
    // Take the branch-free path, so the Consultation completes without Q3.
    s = await answerAndContinue(s, "nothing")
    for (let i = 0; i < 40 && !isReviewing(s); i += 1) {
      s = await answerAndContinue(s, validValueFor(s))
    }
    expect(isReviewing(s)).toBe(true)

    // Now edit Q1 so a required branch opens behind them.
    const editing = mustMove(await commitMove(s, editFromReview(s, Q1), depsFor()), "opening the edit")
    const saved = await persistence().saveAnswer(Q1, "bloating")
    expect(saved.ok).toBe(true)

    const back = await continueFrom(setAnswer(editing, Q1, "bloating"), depsFor())

    expect(back.status).toBe("moved")
    // Not a falsely complete Review: the server named the newly-required
    // question and the customer is sent there.
    expect(back.status === "moved" && isReviewing(back.state)).toBe(false)
    expect(back.status === "moved" && back.state.currentQuestionId).toBe(Q3)
  })

  it("Back from Review is stored as an EXIT, and reloads as ordinary questions", async () => {
    const { session } = await load()
    let s = mustMove(await commitMove(session, begin(session), depsFor()), "Begin")
    for (let i = 0; i < 40 && !isReviewing(s); i += 1) {
      s = await answerAndContinue(s, validValueFor(s))
    }
    expect(db.state().phase).toBe("review")

    const back = mustMove(await commitMove(s, goBack(s), depsFor()), "Back from Review")

    // The whole point of the correction: the phase moves with the cursor.
    expect(db.state().phase).toBe("questions")
    expect(db.state().currentQuestionId).toBe(back.currentQuestionId)
    expect(db.state().currentQuestionId).not.toBeNull()

    const again = await load()
    expect(again.session.phase).toBe("questions")
    expect(isEditingFromReview(again.session), "not a Review edit").toBe(false)
    expect(currentQuestion(again.session)?.id).toBe(back.currentQuestionId)
  })

  it("an edit that opens a required branch is stored as an exit too", async () => {
    const { session } = await load()
    let s = mustMove(await commitMove(session, begin(session), depsFor()), "Begin")
    s = await answerAndContinue(s, "nothing")
    for (let i = 0; i < 40 && !isReviewing(s); i += 1) {
      s = await answerAndContinue(s, validValueFor(s))
    }
    expect(db.state().phase).toBe("review")

    const editing = mustMove(
      await commitMove(s, editFromReview(s, Q1), depsFor()),
      "opening the edit",
    )
    // Opening an item is an edit, so the phase must still say review.
    expect(db.state().phase).toBe("review")
    expect(db.state().currentQuestionId).toBe(Q1)

    expect((await persistence().saveAnswer(Q1, "bloating")).ok).toBe(true)
    const out = mustMove(
      await continueFrom(setAnswer(editing, Q1, "bloating"), depsFor()),
      "saving the edit",
    )

    expect(out.currentQuestionId).toBe(Q3)
    expect(db.state().phase, "the refusal is an exit, not a cursor move").toBe("questions")
    expect(db.state().currentQuestionId).toBe(Q3)

    const again = await load()
    expect(again.session.phase).toBe("questions")
    expect(isEditingFromReview(again.session), "not a Review edit").toBe(false)
    expect(currentQuestion(again.session)?.id).toBe(Q3)
  })

  it("a harmless Review edit stays in Review", async () => {
    const { session } = await load()
    let s = mustMove(await commitMove(session, begin(session), depsFor()), "Begin")
    for (let i = 0; i < 40 && !isReviewing(s); i += 1) {
      s = await answerAndContinue(s, validValueFor(s))
    }

    const editing = mustMove(await commitMove(s, editFromReview(s, Q2), depsFor()), "edit")
    expect((await persistence().saveAnswer(Q2, "slow-start")).ok).toBe(true)
    const back = mustMove(
      await continueFrom(setAnswer(editing, Q2, "slow-start"), depsFor()),
      "return to Review",
    )

    expect(isReviewing(back)).toBe(true)
    expect(db.state().phase).toBe("review")
    expect(db.state().currentQuestionId).toBeNull()
  })

  it("the retreat is refused when the session is not in review", async () => {
    const { session } = await load()
    const started = mustMove(await commitMove(session, begin(session), depsFor()), "Begin")
    expect(db.state().phase).toBe("questions")
    void started

    // Nothing to leave: the browser cannot use the retreat as a general
    // "set phase to questions".
    expect((await persistence().leaveReview(Q1)).ok).toBe(false)
    expect(db.state().phase).toBe("questions")
  })

  it("the retreat refuses a target that does not apply, and changes nothing", async () => {
    const { session } = await load()
    let s = mustMove(await commitMove(session, begin(session), depsFor()), "Begin")
    s = await answerAndContinue(s, "nothing")
    for (let i = 0; i < 40 && !isReviewing(s); i += 1) {
      s = await answerAndContinue(s, validValueFor(s))
    }
    expect(db.state().phase).toBe("review")

    // Q3 needs a substantive post-meal signal, which this session does not have.
    expect((await persistence().leaveReview(Q3)).ok).toBe(false)
    expect(db.state().phase, "still in review").toBe("review")
    expect(db.state().currentQuestionId).toBeNull()
  })

  it("the retreat alters no answer, touch or skip", async () => {
    const { session } = await load()
    let s = mustMove(await commitMove(session, begin(session), depsFor()), "Begin")
    for (let i = 0; i < 40 && !isReviewing(s); i += 1) {
      s = await answerAndContinue(s, validValueFor(s))
    }
    const before = db.state()

    const last = [...s.questions].reverse().find((q) => before.candidateAnswers[q.id] !== undefined)!
    expect((await persistence().leaveReview(last.id)).ok).toBe(true)

    const after = db.state()
    expect(after.candidateAnswers).toEqual(before.candidateAnswers)
    expect(after.touchedQuestionIds).toEqual(before.touchedQuestionIds)
    expect(after.skippedOptionalQuestionIds).toEqual(before.skippedOptionalQuestionIds)
    expect(after.phase).toBe("questions")
    expect(after.currentQuestionId).toBe(last.id)
  })

  it("a stale candidate answer survives a branch closing and is not reviewed", async () => {
    const { session } = await load()
    let s = mustMove(await commitMove(session, begin(session), depsFor()), "Begin")
    s = await answerAndContinue(s, "bloating")
    s = await answerAndContinue(s, validValueFor(s))
    expect(currentQuestion(s)?.id).toBe(Q3)
    await persistence().saveAnswer(Q3, ["rushed"])

    // Close the branch from the server's point of view.
    await persistence().saveCursor(Q1)
    expect((await persistence().saveAnswer(Q1, "nothing")).ok).toBe(true)

    const again = await load()
    expect(again.session.answers[Q3], "still stored").toEqual(["rushed"])
    const review = buildConsultationReview({
      context: again.session.context,
      candidateAnswers: again.session.answers,
    })
    expect(review.questionIds, "but not reviewed").not.toContain(Q3)
  })

  it("nothing in the whole walk writes a Report field or a finalisation phase", async () => {
    const { session } = await load()
    let s = mustMove(await commitMove(session, begin(session), depsFor()), "Begin")
    for (let i = 0; i < 40 && !isReviewing(s); i += 1) {
      s = await answerAndContinue(s, validValueFor(s))
      expect(db.state().phase).not.toBe("ready-for-report")
    }
    await commitMove(s, goBack(s), depsFor())

    const row = db.row()
    expect(row.report_json).toBeNull()
    expect(row.pdf_url).toBeNull()
    expect(row.status).toBe("in_progress")
    expect(db.state().phase).not.toBe("ready-for-report")
  })
})

/* ══ Withdrawing an optional answer, against the real route ════════════════ */

/**
 * Phase 3C-C1 corrections — the load-bearing test.
 *
 * ══ WHY THE FAKE ADAPTER WAS NOT ENOUGH ═════════════════════════════════════
 *
 * The client tests prove the client's half against a fake `skipOptional` that
 * returns `{ ok: true }` and stores nothing. The route's cursor resolution and
 * its touched handling live on the other side of that fake, so a withdrawal
 * could pass every client test and still store the wrong position — which is
 * exactly what it did: with no cursor in the body, the route resolved
 * `stored.currentQuestionId ?? questionId`, and `null ?? questionId` on the
 * Review list stored (review, withdrawnId). That pair is an interrupted EDIT,
 * so the next reload opened the question the customer had just removed.
 *
 * These tests put the real adapter in front of the real handler and then read
 * the ROW, because the row is the only thing the next session will see.
 */
describe("a withdrawal taken from the Review list survives the round trip", () => {
  const CONSTRAINTS = "core_environment_constraints_v1"
  const AVOIDANCES = "core_environment_food_avoidances_v1"
  const SUCCESS = "core_intentions_success_v1"

  /** Every applicable answer, valid, with the branch-opening choices taken. */
  function completeAnswers(overrides: ConsultationAnswers = {}): ConsultationAnswers {
    const answers: ConsultationAnswers = { ...overrides }
    for (let pass = 0; pass < 4; pass += 1) {
      for (const q of resolveApplicableQuestions({
        questions: CONSULTATION_QUESTION_BANK,
        context: { foundation: "you" },
        answers,
      })) {
        if (q.id in answers) continue
        if (q.type === "single") answers[q.id] = q.options![0].value
        else if (q.type === "multi") answers[q.id] = [q.options![0].value]
        else if (q.type === "textarea") answers[q.id] = "A sentence that is a real answer."
        else answers[q.id] = q.min ?? 0
      }
    }
    return answers
  }

  /** Seed the row exactly as a finished Consultation sitting on Review looks. */
  function seedReviewList(overrides: ConsultationAnswers = {}) {
    const candidateAnswers = completeAnswers({
      [Q1]: "nothing",
      [CONSTRAINTS]: ["allergy"],
      ...overrides,
    })
    db = makeDb({
      stripe_session_id: SESSION,
      tier: "personal",
      questions: createDeterministicConsultationSnapshot({ foundation: "you", entitledLens: null }),
      answers: {
        kind: DETERMINISTIC_STATE_KIND,
        schemaVersion: DETERMINISTIC_STATE_SCHEMA_VERSION,
        candidateAnswers,
        // Everything answered has been touched, which is what makes a stale
        // touched marker after a withdrawal a certainty rather than a maybe.
        touchedQuestionIds: Object.keys(candidateAnswers),
        skippedOptionalQuestionIds: [],
        currentQuestionId: null,
        phase: "review",
      } satisfies DeterministicConsultationState,
      status: "in_progress",
      report_json: null,
      pdf_url: null,
      updated_at: null,
    })
    mockGetSupabase.mockReturnValue(db.client)
    return candidateAnswers
  }

  /**
   * Navigation whose flush actually waits for the skip.
   *
   * The file's shared `depsFor` fires mutations with `void` and stubs `flush` to
   * `true`, which is fine where the interest is the wire contract. Here the
   * assertions read the row immediately afterwards, so the flush has to mean
   * what it means in the real queue: everything outstanding has landed.
   */
  function awaitingDeps() {
    const p = persistence()
    const outstanding: Array<Promise<{ ok: boolean }>> = []
    const deps: NavigationDeps = {
      flush: async () => {
        const results = await Promise.all(outstanding.splice(0))
        return results.every((r) => r.ok)
      },
      persistCursor: (id) => p.saveCursor(id),
      queueSkip: (id, cursor) => void outstanding.push(p.skipOptional(id, cursor)),
      requestReview: () => p.enterReview(),
      leaveReview: (id) => p.leaveReview(id),
      finalise: () => p.finalise(),
    }
    return deps
  }

  /** The stored state hydrated back into a session, as a reload would. */
  async function reload() {
    return (await load()).session
  }

  it("stores all five properties, and leaves the customer on the Review list", async () => {
    seedReviewList()
    const before = await reload()
    expect(isReviewing(before)).toBe(true)

    const outcome = await withdrawFrom(before, AVOIDANCES, awaitingDeps())
    expect(outcome.status).toBe("moved")

    const stored = db.state()
    expect(stored.candidateAnswers[AVOIDANCES], "candidate answer").toBeUndefined()
    expect(stored.touchedQuestionIds, "touched marker").not.toContain(AVOIDANCES)
    expect(stored.skippedOptionalQuestionIds, "skip marker").toContain(AVOIDANCES)
    expect(stored.phase, "phase").toBe("review")
    expect(stored.currentQuestionId, "cursor").toBeNull()
  })

  it("a reload lands on the Review list, NOT on an edit of what was removed", async () => {
    seedReviewList()
    await withdrawFrom(await reload(), AVOIDANCES, awaitingDeps())

    const resumed = await reload()
    expect(isReviewing(resumed), "the Review list").toBe(true)
    expect(isEditingFromReview(resumed), "not an interrupted edit").toBe(false)
    expect(resumed.currentQuestionId).toBeNull()
    expect(currentQuestion(resumed)).toBeNull()

    const review = buildConsultationReview({
      context: resumed.context,
      candidateAnswers: resumed.answers,
      skippedOptionalQuestionIds: [...resumed.skipped],
    })
    const item = review.sections.flatMap((s) => s.items).find((i) => i.questionId === AVOIDANCES)!
    expect(item.state, "described as a decision, not as silence").toBe("skipped")
    expect(item.answer).toEqual([])
    // Still complete: an optional question is optional.
    expect(review.complete).toBe(true)
  })

  it("free text is gone from the row, not blanked, and leaves no touched marker", async () => {
    const sentence = "A distinctive sentence only this test would ever write."
    seedReviewList({ [SUCCESS]: sentence })
    expect(JSON.stringify(db.state())).toContain(sentence)

    await withdrawFrom(await reload(), SUCCESS, awaitingDeps())

    const stored = db.state()
    expect(JSON.stringify(stored), "no resurrection").not.toContain(sentence)
    expect(stored.candidateAnswers).not.toHaveProperty(SUCCESS)
    expect(stored.touchedQuestionIds).not.toContain(SUCCESS)
    expect(stored.skippedOptionalQuestionIds).toContain(SUCCESS)

    // And an Edit after the reload opens it empty rather than pre-filled.
    const resumed = await reload()
    expect(resumed.answers[SUCCESS]).toBeUndefined()
    const editing = editFromReview(resumed, SUCCESS)
    expect(currentQuestion(editing)?.id).toBe(SUCCESS)
    expect(editing.answers[SUCCESS]).toBeUndefined()
  })

  it("a withdrawn avoidance detail stays UNRESOLVED, never safe", async () => {
    seedReviewList({ [AVOIDANCES]: ["dairy"] })
    await withdrawFrom(await reload(), AVOIDANCES, awaitingDeps())

    const stored = db.state()
    expect(JSON.stringify(stored)).not.toContain("dairy")
    expect(stored.touchedQuestionIds).not.toContain(AVOIDANCES)
    expect(stored.skippedOptionalQuestionIds).toContain(AVOIDANCES)
    expect(stored.phase).toBe("review")
    expect(stored.currentQuestionId).toBeNull()

    // The finalisation contract, unchanged, reading the row the route wrote.
    const snapshot = readDeterministicConsultationSnapshot(db.row().questions)!
    const result = prepareConsultationFinalisation({
      snapshot,
      state: stored,
      finalisedAt: new Date("2026-09-07T09:00:00.000Z"),
    })
    expect(result.ok, "a complete Consultation still finalises").toBe(true)
    if (!result.ok) throw new Error("unreachable")

    // Removing the detail removed information. It did not create an assurance.
    expect(result.finalisation.foodGuidance.requiresSpecificAvoidance).toBe(true)
    expect(result.finalisation.foodGuidance.knownAvoidances).toEqual([])
    expect(result.finalisation.foodGuidance.unresolvedSpecificAvoidance).toBe(true)
    expect(result.finalisation.foodGuidance.declaresNoConstraints).toBe(false)
    expect(result.finalisation.trustedAnswers[AVOIDANCES]).toBeUndefined()
    expect(result.finalisation.skippedOptionalQuestionIds).toContain(AVOIDANCES)
  })

  it("an ordinary Skip in the question flow is unaffected", async () => {
    // The non-regression, over the same real route: skip stores the decision,
    // clears any touched mark, and the position follows the navigation
    // sequence rather than staying on the question that was passed.
    const { session } = await load()
    let s = mustMove(await commitMove(session, begin(session), depsFor()), "Begin")
    for (let i = 0; i < 40 && currentQuestion(s)?.id !== AVOIDANCES; i += 1) {
      s = await answerAndContinue(s, currentQuestion(s)!.id === Q1 ? "nothing" : validValueFor(s))
      if (currentQuestion(s)?.id === CONSTRAINTS) {
        const saved = await persistence().saveAnswer(CONSTRAINTS, ["allergy"] as never)
        expect(saved.ok).toBe(true)
        s = mustMove(
          await continueFrom(setAnswer(s, CONSTRAINTS, ["allergy"] as never), depsFor()),
          "past the constraints question",
        )
      }
    }
    expect(currentQuestion(s)?.id, "reached the optional question").toBe(AVOIDANCES)

    const moved = await skipFrom(s, AVOIDANCES, awaitingDeps())
    expect(moved.status).toBe("moved")

    const stored = db.state()
    expect(stored.skippedOptionalQuestionIds).toContain(AVOIDANCES)
    expect(stored.candidateAnswers[AVOIDANCES]).toBeUndefined()
    expect(stored.touchedQuestionIds).not.toContain(AVOIDANCES)
    expect(stored.phase).toBe("questions")
    // The customer moved on, and the stored position says so.
    expect(stored.currentQuestionId).not.toBe(AVOIDANCES)
    expect(stored.currentQuestionId).not.toBeNull()

    const resumed = await reload()
    expect(isReviewing(resumed)).toBe(false)
    expect(currentQuestion(resumed)?.id).toBe(stored.currentQuestionId)
  })
})

/* ══ Finish, and come back to it ═══════════════════════════════════════════ */

describe("a finished Consultation reloads as finished — Phase 3C-C2B", () => {
  const CONSTRAINTS = "core_environment_constraints_v1"

  /** Every applicable answer, valid, with the branch-opening choices taken. */
  function completeAnswers(overrides: ConsultationAnswers = {}): ConsultationAnswers {
    const answers: ConsultationAnswers = { ...overrides }
    for (let pass = 0; pass < 4; pass += 1) {
      for (const q of resolveApplicableQuestions({
        questions: CONSULTATION_QUESTION_BANK,
        context: { foundation: "you" },
        answers,
      })) {
        if (q.id in answers) continue
        if (q.type === "single") answers[q.id] = q.options![0].value
        else if (q.type === "multi") answers[q.id] = [q.options![0].value]
        else if (q.type === "textarea") answers[q.id] = "A sentence that is a real answer."
        else answers[q.id] = q.min ?? 0
      }
    }
    return answers
  }

  /** A row sitting on a COMPLETE Review list, ready to be finished. */
  function seedFinishable(over: Record<string, unknown> = {}) {
    db = makeDb({
      stripe_session_id: SESSION,
      tier: "personal",
      questions: createDeterministicConsultationSnapshot({ foundation: "you", entitledLens: null }),
      answers: {
        kind: DETERMINISTIC_STATE_KIND,
        schemaVersion: DETERMINISTIC_STATE_SCHEMA_VERSION,
        candidateAnswers: completeAnswers({ [Q1]: "nothing", [CONSTRAINTS]: ["allergy"] }),
        touchedQuestionIds: [],
        skippedOptionalQuestionIds: [],
        currentQuestionId: null,
        phase: "review",
      },
      status: "in_progress",
      report_json: null,
      pdf_url: null,
      updated_at: null,
      consultation_finalisation: null,
      consultation_handoff_id: null,
      ...over,
    })
    mockGetSupabase.mockReturnValue(db.client)
  }

  /** Finish over the real route, through the real adapter. */
  const finish = () => persistence().finalise()

  it("Finish seals the row, and the reload comes back completed rather than editable", async () => {
    // The property that matters to a customer: refreshing after finishing shows
    // the same finished thing. Before C2B this threw `unsupported-phase`, i.e.
    // the one person whose Consultation had definitely worked was shown the
    // generic failure screen.
    seedFinishable()
    const outcome = await finish()
    expect(outcome.ok, "finalise").toBe(true)

    const row = db.row()
    expect(row.consultation_finalisation, "the seal was written").toBeTruthy()
    expect(typeof row.consultation_handoff_id).toBe("string")
    expect((row.answers as DeterministicConsultationState).phase).toBe("ready-for-report")

    const hydrated = hydratePersistedSession(await persistence().load())
    expect(hydrated.kind).toBe("completed")
  })

  it("the reload is a plain load, not a second seal", async () => {
    // Loading must never write. A GET that repaired or re-sealed would make the
    // handoff depend on when it was last read.
    seedFinishable()
    await finish()
    const sealed = { ...db.row() }

    await persistence().load()
    const after = db.row()
    expect(after.consultation_finalisation).toEqual(sealed.consultation_finalisation)
    expect(after.consultation_handoff_id).toBe(sealed.consultation_handoff_id)
    expect(after.answers).toEqual(sealed.answers)
  })

  it("finishing twice is the same seal, and still loads as completed", async () => {
    // C2A's idempotency, seen from the outside: a double-click, a retried
    // request and a refresh mid-flight all converge on ONE handoff.
    seedFinishable()
    const first = await finish()
    const handoff = db.row().consultation_handoff_id
    const second = await finish()

    expect(first.ok && second.ok).toBe(true)
    if (first.ok && second.ok) expect(second.handoffId).toBe(first.handoffId)
    expect(db.row().consultation_handoff_id).toBe(handoff)
    expect(hydratePersistedSession(await persistence().load()).kind).toBe("completed")
  })

  it("an incomplete Consultation is refused, and stays loadable as a session", async () => {
    // The refusal has to leave the customer somewhere they can act. A refused
    // finish that also broke the load would strand them with no way back.
    seedFinishable()
    const state = db.row().answers as DeterministicConsultationState
    const answers = { ...state.candidateAnswers }
    delete answers[Q2]
    ;(db.row().answers as DeterministicConsultationState) = { ...state, candidateAnswers: answers }

    expect(await finish()).toEqual({ ok: false, kind: "incomplete" })
    expect(db.row().consultation_finalisation, "nothing was sealed").toBeFalsy()
    expect(hydratePersistedSession(await persistence().load()).kind).toBe("session")
  })

  it("ready-for-report with NO seal is refused by the session route, never served", async () => {
    // A completion claim with nothing behind it. Serving it would show a
    // completion screen for a record that does not exist, and repairing it would
    // invent a handoff nobody made.
    seedFinishable({
      answers: {
        kind: DETERMINISTIC_STATE_KIND,
        schemaVersion: DETERMINISTIC_STATE_SCHEMA_VERSION,
        candidateAnswers: completeAnswers({ [Q1]: "nothing", [CONSTRAINTS]: ["allergy"] }),
        touchedQuestionIds: [],
        skippedOptionalQuestionIds: [],
        currentQuestionId: null,
        phase: "ready-for-report",
      },
    })
    await expect(persistence().load()).rejects.toThrow()
    expect(db.row().consultation_finalisation, "and it was not repaired").toBeFalsy()
  })

  it("a sealed row whose stored payload does not match the snapshot is refused", async () => {
    // The stored finalisation is VALIDATED against this session's snapshot, and
    // a mismatch is a contradiction rather than a reason to rebuild. Rebuilding
    // would replace what the customer finished with what their answers would
    // mean today.
    seedFinishable()
    await finish()
    const stored = db.row().consultation_finalisation as Record<string, unknown>
    db.row().consultation_finalisation = { ...stored, foundation: "family" }

    await expect(persistence().load()).rejects.toThrow()
  })

  it("an UNFINISHED Consultation carrying a seal is refused", async () => {
    // The other direction of the same contradiction: a frozen record with a
    // live session on top of it. Whatever the customer does next, one of the
    // two is wrong.
    seedFinishable()
    await finish()
    const sealed = db.row()
    ;(sealed.answers as DeterministicConsultationState) = {
      ...(sealed.answers as DeterministicConsultationState),
      phase: "review",
    }

    await expect(persistence().load()).rejects.toThrow()
  })

  it("a half seal — finalisation with no handoff id — is refused", async () => {
    // Migration 48's CHECK makes this unstorable, so seeing one means the
    // migration is not applied or something wrote outside every route that
    // knows these rules. Both are reasons to stop.
    seedFinishable()
    await finish()
    db.row().consultation_handoff_id = null

    await expect(persistence().load()).rejects.toThrow()
  })

  it("the sealed payload is never sent to the browser", async () => {
    // The client needs to know it is finished. It does not need the trusted
    // handoff, and shipping it would put a record built for a server pipeline
    // into a place a customer can edit and replay.
    seedFinishable()
    await finish()

    const loaded = (await persistence().load()) as unknown as Record<string, unknown>
    expect(loaded.phase).toBe("ready-for-report")
    for (const key of ["finalisation", "handoffId", "consultation_finalisation", "trustedAnswers"]) {
      expect(key in loaded, `${key} must not be in the response`).toBe(false)
    }
  })
})
