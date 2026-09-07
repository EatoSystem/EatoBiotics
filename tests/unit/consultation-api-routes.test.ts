import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"

import { CONSULTATION_QUESTION_BANK } from "@/lib/consultation/question-bank"
import { resolveApplicableQuestions } from "@/lib/consultation/applicability"
import {
  createDeterministicConsultationSnapshot,
  DETERMINISTIC_STATE_KIND,
  DETERMINISTIC_STATE_SCHEMA_VERSION,
  type DeterministicConsultationState,
} from "@/lib/consultation/session-envelope"
import type { ConsultationAnswers, ConsultationContext } from "@/lib/consultation/types"

/**
 * Phase 3C-B — the deterministic Consultation endpoints, exercised for real.
 *
 * ══ WHY BEHAVIOURAL AND NOT SOURCE-LEVEL ════════════════════════════════════
 *
 * `consultation-persistence-contract.test.ts` pins the SHAPE of these routes by
 * reading them. That catches a boundary being removed; it cannot catch a
 * boundary that is present and wrong — a navigation that quietly rewrites an
 * answer, a compare-and-set that gives up after losing once, a review entry that
 * writes before checking. Those are only visible by running the handler against
 * a database that enforces the constraints the route depends on.
 *
 * ══ WHAT IS FAKED, AND WHAT DELIBERATELY IS NOT ═════════════════════════════
 *
 * Supabase is a fake with real compare-and-set semantics, and the paid summary
 * is stubbed. Stripe's SETTLEMENT check is not stubbed: `isCheckoutSessionSettled`
 * runs for real against a mocked session object, because "an unpaid session is
 * refused" is one of the properties under test.
 *
 * No production write, no Stripe call, no real payment. Activating this for a
 * paying customer remains a separate decision that Phase 3C-B does not take.
 */

/* ── A fake deep_assessments with real CAS semantics ────────────────────── */

type Row = Record<string, unknown>

function makeDb(seed: Row | null, hooks: { beforeWrite?: (n: number) => void } = {}) {
  const rows = new Map<string, Row>()
  if (seed) rows.set(String(seed.stripe_session_id), { ...seed })
  let reads = 0
  let writes = 0
  const log: string[] = []

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
        reads += 1
        log.push("read")
        return { data: (key !== null ? rows.get(key) : undefined) ?? null, error: null }
      }
      writes += 1
      log.push("write")
      hooks.beforeWrite?.(writes)
      const row = key !== null ? rows.get(key) : undefined
      // Zero rows matched once the guard no longer holds — the CAS.
      if (!row || !preds.every((p) => p(row))) return { data: [], error: null }
      Object.assign(row, payload)
      return { data: [{ stripe_session_id: key }], error: null }
    }
    return chain
  }

  return {
    client: { from } as unknown,
    rows,
    log,
    counts: () => ({ reads, writes }),
    only: () => [...rows.values()][0] ?? null,
    state: () => [...rows.values()][0]?.answers as DeterministicConsultationState,
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
  // Settlement and foundation coercion stay REAL. Only the row lookup that
  // resolves a paid summary is replaced, because it reads a table this test is
  // not about.
  return { ...actual, resolvePaidReportSummary: (...a: unknown[]) => mockResolveSummary(...a) }
})

/* ── Fixtures ───────────────────────────────────────────────────────────── */

const SESSION = "cs_test_consultation_3cb"
const T0 = "2026-09-01T10:00:00.000Z"

const Q1 = "core_signals_post_meal_pattern_v1"
const Q2 = "core_signals_energy_shape_v1"
const Q3 = "core_signals_context_v1"
const CONSTRAINTS = "core_environment_constraints_v1"
const AVOIDANCES = "core_environment_food_avoidances_v1"

const you: ConsultationContext = { foundation: "you" }

const snapshot = () =>
  createDeterministicConsultationSnapshot({ foundation: "you", entitledLens: null })

function stateWith(over: Partial<DeterministicConsultationState> = {}): DeterministicConsultationState {
  return {
    kind: DETERMINISTIC_STATE_KIND,
    schemaVersion: DETERMINISTIC_STATE_SCHEMA_VERSION,
    candidateAnswers: {},
    touchedQuestionIds: [],
    skippedOptionalQuestionIds: [],
    currentQuestionId: null,
    phase: "questions",
    ...over,
  }
}

const rowWith = (over: Row = {}): Row => ({
  stripe_session_id: SESSION,
  tier: "personal",
  questions: snapshot(),
  answers: stateWith(),
  status: "in_progress",
  report_json: null,
  pdf_url: null,
  updated_at: T0,
  ...over,
})

/**
 * Every APPLICABLE question answered validly.
 *
 * Applicability is honoured rather than filling the whole bank: a fixture that
 * pre-answered questions nobody is being asked would make "editing a parent
 * opens an unanswered required branch" impossible to construct, because the
 * branch would already have an answer waiting for it.
 */
function completeAnswers(overrides: ConsultationAnswers = {}): ConsultationAnswers {
  const answers: ConsultationAnswers = { ...overrides }
  for (let pass = 0; pass < 4; pass += 1) {
    for (const q of resolveApplicableQuestions({
      questions: CONSULTATION_QUESTION_BANK,
      context: you,
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

function patch(body: Record<string, unknown>) {
  return new NextRequest("http://localhost/api/consultation/progress", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

function reviewPost(body: Record<string, unknown>) {
  return new NextRequest("http://localhost/api/consultation/review", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

const callProgress = async (req: NextRequest) =>
  (await import("@/app/api/consultation/progress/route")).PATCH(req)

const callReview = async (req: NextRequest) =>
  (await import("@/app/api/consultation/review/route")).POST(req)

const jsonOf = async (r: Response) => (await r.json()) as Record<string, unknown>

beforeEach(() => {
  vi.clearAllMocks()
  mockRetrieveSession.mockResolvedValue({ id: SESSION, payment_status: "paid", metadata: {} })
  mockResolveSummary.mockResolvedValue({ foundationType: "you", selectedAddon: null })
})

/* ══ Progress — the action contract ════════════════════════════════════════ */

describe("PATCH progress accepts exactly one explicit action per request", () => {
  it("answer stores the validated value and marks it touched", async () => {
    const db = makeDb(rowWith())
    mockGetSupabase.mockReturnValue(db.client)

    const res = await callProgress(
      patch({ action: "answer", sessionId: SESSION, questionId: Q1, value: "bloating" }),
    )

    expect(res.status).toBe(200)
    expect(db.state().candidateAnswers[Q1]).toBe("bloating")
    expect(db.state().touchedQuestionIds).toContain(Q1)
  })

  it("clear removes the answer and its touched mark", async () => {
    const db = makeDb(
      rowWith({ answers: stateWith({ candidateAnswers: { [Q1]: "bloating" }, touchedQuestionIds: [Q1] }) }),
    )
    mockGetSupabase.mockReturnValue(db.client)

    const res = await callProgress(patch({ action: "clear", sessionId: SESSION, questionId: Q1 }))

    expect(res.status).toBe(200)
    expect(db.state().candidateAnswers[Q1]).toBeUndefined()
    expect(db.state().touchedQuestionIds).not.toContain(Q1)
  })

  it("skip records an optional skip and stores no value", async () => {
    const db = makeDb(
      rowWith({ answers: stateWith({ candidateAnswers: { [CONSTRAINTS]: ["allergy"] } }) }),
    )
    mockGetSupabase.mockReturnValue(db.client)

    const res = await callProgress(
      patch({ action: "skip", sessionId: SESSION, questionId: AVOIDANCES }),
    )

    expect(res.status).toBe(200)
    expect(db.state().skippedOptionalQuestionIds).toContain(AVOIDANCES)
    expect(db.state().candidateAnswers[AVOIDANCES]).toBeUndefined()
  })

  it("skip is refused on a REQUIRED question", async () => {
    const db = makeDb(rowWith())
    mockGetSupabase.mockReturnValue(db.client)

    const res = await callProgress(patch({ action: "skip", sessionId: SESSION, questionId: Q1 }))

    expect(res.status).toBe(422)
    expect(db.counts().writes).toBe(0)
  })

  it("answering an optional question later removes its skip", async () => {
    const db = makeDb(
      rowWith({
        answers: stateWith({
          candidateAnswers: { [CONSTRAINTS]: ["allergy"] },
          skippedOptionalQuestionIds: [AVOIDANCES],
        }),
      }),
    )
    mockGetSupabase.mockReturnValue(db.client)

    await callProgress(
      patch({ action: "answer", sessionId: SESSION, questionId: AVOIDANCES, value: ["dairy"] }),
    )

    expect(db.state().skippedOptionalQuestionIds).not.toContain(AVOIDANCES)
    expect(db.state().candidateAnswers[AVOIDANCES]).toEqual(["dairy"])
  })

  it("a body carrying two intents at once cannot parse", async () => {
    const db = makeDb(rowWith())
    mockGetSupabase.mockReturnValue(db.client)

    // `navigate` structurally cannot carry a questionId or a value, so a body
    // asserting both a move and a write is refused by the schema rather than
    // resolved by whichever branch the handler happens to test first.
    const res = await callProgress(
      patch({ action: "navigate", sessionId: SESSION, questionId: Q1, value: "bloating", currentQuestionId: Q2 }),
    )

    expect(res.status).toBe(400)
    expect(db.counts().writes).toBe(0)
  })

  it("an unknown action is refused", async () => {
    const db = makeDb(rowWith())
    mockGetSupabase.mockReturnValue(db.client)
    const res = await callProgress(patch({ action: "finalise", sessionId: SESSION }))
    expect(res.status).toBe(400)
    expect(db.counts().writes).toBe(0)
  })
})

/* ══ Progress — navigation ═════════════════════════════════════════════════ */

describe("PATCH progress navigate moves the cursor and nothing else", () => {
  const seeded = () =>
    rowWith({
      answers: stateWith({
        candidateAnswers: { [Q1]: "bloating", [CONSTRAINTS]: ["budget"] },
        touchedQuestionIds: [Q1, CONSTRAINTS],
        skippedOptionalQuestionIds: [],
        currentQuestionId: Q2,
      }),
    })

  it("moves to an applicable question", async () => {
    const db = makeDb(seeded())
    mockGetSupabase.mockReturnValue(db.client)

    const res = await callProgress(
      patch({ action: "navigate", sessionId: SESSION, currentQuestionId: Q1 }),
    )

    expect(res.status).toBe(200)
    expect(db.state().currentQuestionId).toBe(Q1)
  })

  it("preserves every answer, touch and skip it did not ask to change", async () => {
    const row = rowWith({
      answers: stateWith({
        candidateAnswers: { [Q1]: "bloating", [CONSTRAINTS]: ["allergy"] },
        touchedQuestionIds: [Q1, CONSTRAINTS],
        skippedOptionalQuestionIds: [AVOIDANCES],
        currentQuestionId: Q2,
      }),
    })
    const db = makeDb(row)
    mockGetSupabase.mockReturnValue(db.client)

    await callProgress(patch({ action: "navigate", sessionId: SESSION, currentQuestionId: Q1 }))

    const after = db.state()
    expect(after.candidateAnswers).toEqual({ [Q1]: "bloating", [CONSTRAINTS]: ["allergy"] })
    expect(after.touchedQuestionIds.slice().sort()).toEqual([CONSTRAINTS, Q1].sort())
    expect(after.skippedOptionalQuestionIds).toEqual([AVOIDANCES])
  })

  it("clears the cursor for the Review list when sent null", async () => {
    const db = makeDb(seeded())
    mockGetSupabase.mockReturnValue(db.client)

    const res = await callProgress(
      patch({ action: "navigate", sessionId: SESSION, currentQuestionId: null }),
    )

    expect(res.status).toBe(200)
    expect(db.state().currentQuestionId).toBeNull()
  })

  it("refuses an unknown question id without writing", async () => {
    const db = makeDb(seeded())
    mockGetSupabase.mockReturnValue(db.client)

    const res = await callProgress(
      patch({ action: "navigate", sessionId: SESSION, currentQuestionId: "not_a_question_v1" }),
    )

    expect(res.status).toBe(422)
    expect(db.counts().writes).toBe(0)
    expect(db.state().currentQuestionId).toBe(Q2)
  })

  it("refuses a question that does not currently apply, rather than relocating quietly", async () => {
    // Q3 needs a substantive post-meal signal. Landing the customer somewhere
    // else instead would look like Back skipping a question.
    const db = makeDb(
      rowWith({
        answers: stateWith({ candidateAnswers: { [Q1]: "nothing" }, currentQuestionId: Q2 }),
      }),
    )
    mockGetSupabase.mockReturnValue(db.client)

    const res = await callProgress(
      patch({ action: "navigate", sessionId: SESSION, currentQuestionId: Q3 }),
    )

    expect(res.status).toBe(422)
    expect(db.counts().writes).toBe(0)
  })

  it("never changes the phase", async () => {
    const db = makeDb(
      rowWith({ answers: stateWith({ candidateAnswers: { [Q1]: "bloating" }, phase: "review" }) }),
    )
    mockGetSupabase.mockReturnValue(db.client)

    await callProgress(patch({ action: "navigate", sessionId: SESSION, currentQuestionId: Q1 }))

    // An edit from within Review keeps the review phase and moves the cursor —
    // that pair IS the resumable editing state.
    expect(db.state().phase).toBe("review")
  })

  it("cannot be asked to set a phase at all", async () => {
    const db = makeDb(rowWith())
    mockGetSupabase.mockReturnValue(db.client)

    const res = await callProgress(
      patch({ action: "navigate", sessionId: SESSION, currentQuestionId: Q1, phase: "review" }),
    )

    // Refused, not stripped. A body that names a phase is asking for something
    // this endpoint does not grant, and answering it with a 200 would suggest
    // otherwise.
    expect(res.status).toBe(400)
    expect(db.counts().writes).toBe(0)
    expect(db.state().phase).toBe("questions")
  })
})

/* ══ Progress — leaving Review ═════════════════════════════════════════════ */

describe("PATCH progress leave-review is the one phase retreat the browser may ask for", () => {
  const inReview = (over: Partial<DeterministicConsultationState> = {}) =>
    rowWith({
      answers: stateWith({
        candidateAnswers: completeAnswers({ [Q1]: "bloating" }),
        touchedQuestionIds: [Q1],
        skippedOptionalQuestionIds: [],
        currentQuestionId: null,
        phase: "review",
        ...over,
      }),
    })

  it("moves phase and cursor together", async () => {
    const db = makeDb(inReview())
    mockGetSupabase.mockReturnValue(db.client)

    const res = await callProgress(
      patch({ action: "leave-review", sessionId: SESSION, currentQuestionId: Q2 }),
    )

    expect(res.status).toBe(200)
    expect(db.state().phase).toBe("questions")
    expect(db.state().currentQuestionId).toBe(Q2)
  })

  it("is refused when the session is not in review", async () => {
    const db = makeDb(
      rowWith({ answers: stateWith({ candidateAnswers: { [Q1]: "bloating" }, phase: "questions" }) }),
    )
    mockGetSupabase.mockReturnValue(db.client)

    const res = await callProgress(
      patch({ action: "leave-review", sessionId: SESSION, currentQuestionId: Q2 }),
    )

    // Otherwise the retreat would be a general "set phase to questions", which
    // is a much larger permission than the one being granted.
    expect(res.status).toBe(409)
    expect(db.counts().writes).toBe(0)
  })

  it("is refused for a question that does not currently apply", async () => {
    const answers = completeAnswers({ [Q1]: "nothing" })
    const db = makeDb(
      rowWith({ answers: stateWith({ candidateAnswers: answers, currentQuestionId: null, phase: "review" }) }),
    )
    mockGetSupabase.mockReturnValue(db.client)

    const res = await callProgress(
      patch({ action: "leave-review", sessionId: SESSION, currentQuestionId: Q3 }),
    )

    expect(res.status).toBe(422)
    expect(db.counts().writes).toBe(0)
    expect(db.state().phase).toBe("review")
  })

  it("cannot clear the cursor — leaving Review means landing on a question", async () => {
    const db = makeDb(inReview())
    mockGetSupabase.mockReturnValue(db.client)

    const res = await callProgress(
      patch({ action: "leave-review", sessionId: SESSION, currentQuestionId: null }),
    )

    // A null cursor describes the Review list, which is the thing being left.
    expect(res.status).toBe(400)
    expect(db.counts().writes).toBe(0)
  })

  it("cannot name a phase of its own", async () => {
    const db = makeDb(inReview())
    mockGetSupabase.mockReturnValue(db.client)

    const res = await callProgress(
      patch({
        action: "leave-review",
        sessionId: SESSION,
        currentQuestionId: Q2,
        phase: "ready-for-report",
      }),
    )

    expect(res.status).toBe(400)
    expect(db.state().phase).toBe("review")
  })

  it("alters no answer, touched mark or skip", async () => {
    const answers = completeAnswers({ [Q1]: "nothing", [CONSTRAINTS]: ["allergy"] })
    delete answers[AVOIDANCES]
    const db = makeDb(
      rowWith({
        answers: stateWith({
          candidateAnswers: answers,
          touchedQuestionIds: [Q1, CONSTRAINTS],
          skippedOptionalQuestionIds: [AVOIDANCES],
          currentQuestionId: null,
          phase: "review",
        }),
      }),
    )
    mockGetSupabase.mockReturnValue(db.client)

    await callProgress(
      patch({ action: "leave-review", sessionId: SESSION, currentQuestionId: Q2 }),
    )

    const after = db.state()
    expect(after.candidateAnswers).toEqual(answers)
    expect(after.touchedQuestionIds.slice().sort()).toEqual([CONSTRAINTS, Q1].sort())
    expect(after.skippedOptionalQuestionIds).toEqual([AVOIDANCES])
  })

  it("never reaches the finalisation phase, whatever it is given", async () => {
    const db = makeDb(inReview())
    mockGetSupabase.mockReturnValue(db.client)
    await callProgress(patch({ action: "leave-review", sessionId: SESSION, currentQuestionId: Q2 }))
    expect(db.state().phase).toBe("questions")
    expect(db.state().phase).not.toBe("ready-for-report")
  })

  it("an unreadable state is refused without a write", async () => {
    const legacy = { dq1: "yes" }
    const db = makeDb(rowWith({ answers: legacy }))
    mockGetSupabase.mockReturnValue(db.client)

    const res = await callProgress(
      patch({ action: "leave-review", sessionId: SESSION, currentQuestionId: Q2 }),
    )

    expect(res.status).toBe(409)
    expect(db.only()!.answers).toEqual(legacy)
  })
})

/* ══ Progress — persistence discipline ═════════════════════════════════════ */

describe("PATCH progress keeps the persistence discipline it inherited", () => {
  it("retries after a compare-and-set collision and lands the write", async () => {
    // Someone else writes between our read and our write, exactly once.
    let bumped = false
    const db = makeDb(rowWith(), {
      beforeWrite: () => {
        if (bumped) return
        bumped = true
        const row = db.only()!
        row.updated_at = "2026-09-01T10:05:00.000Z"
      },
    })
    mockGetSupabase.mockReturnValue(db.client)

    const res = await callProgress(
      patch({ action: "answer", sessionId: SESSION, questionId: Q1, value: "bloating" }),
    )

    expect(res.status).toBe(200)
    expect(db.counts().writes).toBeGreaterThan(1)
    expect(db.log.slice(0, 3)).toEqual(["read", "write", "read"])
    expect(db.state().candidateAnswers[Q1]).toBe("bloating")
  })

  it("an unreadable stored state is refused and never overwritten", async () => {
    // A legacy flat answer map: present, and not our envelope.
    const legacy = { dq1: "yes", dq2: "no" }
    const db = makeDb(rowWith({ answers: legacy }))
    mockGetSupabase.mockReturnValue(db.client)

    const res = await callProgress(
      patch({ action: "answer", sessionId: SESSION, questionId: Q1, value: "bloating" }),
    )

    expect(res.status).toBe(409)
    expect(db.counts().writes).toBe(0)
    expect(db.only()!.answers).toEqual(legacy)
  })

  it("a legacy question array is refused rather than converted", async () => {
    const db = makeDb(rowWith({ questions: [{ id: "dq1", type: "single", text: "Legacy?" }] }))
    mockGetSupabase.mockReturnValue(db.client)

    const res = await callProgress(
      patch({ action: "answer", sessionId: SESSION, questionId: Q1, value: "bloating" }),
    )

    expect(res.status).toBe(409)
    expect(db.counts().writes).toBe(0)
  })

  it("an unsettled payment is refused before the row is read", async () => {
    mockRetrieveSession.mockResolvedValue({ id: SESSION, payment_status: "unpaid", metadata: {} })
    const db = makeDb(rowWith())
    mockGetSupabase.mockReturnValue(db.client)

    const res = await callProgress(
      patch({ action: "answer", sessionId: SESSION, questionId: Q1, value: "bloating" }),
    )

    expect(res.status).toBe(402)
    expect(db.counts()).toEqual({ reads: 0, writes: 0 })
  })

  it("a stored session that disagrees with the payment is refused", async () => {
    mockResolveSummary.mockResolvedValue({ foundationType: "family", selectedAddon: null })
    const db = makeDb(rowWith())
    mockGetSupabase.mockReturnValue(db.client)

    const res = await callProgress(
      patch({ action: "answer", sessionId: SESSION, questionId: Q1, value: "bloating" }),
    )

    expect(res.status).toBe(409)
    expect(db.counts().writes).toBe(0)
  })

  it("an invalid answer value is refused by the canonical validator", async () => {
    const db = makeDb(rowWith())
    mockGetSupabase.mockReturnValue(db.client)

    const res = await callProgress(
      patch({ action: "answer", sessionId: SESSION, questionId: Q1, value: "not-an-option" }),
    )

    expect(res.status).toBe(422)
    expect(db.counts().writes).toBe(0)
  })

  it("a candidate answer whose branch closed is kept, not pruned", async () => {
    const db = makeDb(
      rowWith({
        answers: stateWith({
          candidateAnswers: { [Q1]: "bloating", [Q3]: ["rushed"] },
          touchedQuestionIds: [Q1, Q3],
          currentQuestionId: Q1,
        }),
      }),
    )
    mockGetSupabase.mockReturnValue(db.client)

    await callProgress(
      patch({ action: "answer", sessionId: SESSION, questionId: Q1, value: "nothing" }),
    )

    // Q3 no longer applies. Deleting it here would lose an answer the customer
    // gave, and would reappear as a blank if they reopened the branch.
    expect(db.state().candidateAnswers[Q3]).toEqual(["rushed"])
  })
})

/* ══ Review entry ══════════════════════════════════════════════════════════ */

describe("POST review lets the SERVER decide whether Review may be entered", () => {
  it("a complete Consultation enters review with a cleared cursor", async () => {
    const db = makeDb(
      rowWith({
        answers: stateWith({
          candidateAnswers: completeAnswers({ [Q1]: "bloating" }),
          currentQuestionId: Q1,
        }),
      }),
    )
    mockGetSupabase.mockReturnValue(db.client)

    const res = await callReview(reviewPost({ sessionId: SESSION }))

    expect(res.status).toBe(200)
    expect(db.state().phase).toBe("review")
    expect(db.state().currentQuestionId).toBeNull()
  })

  it("an incomplete Consultation is refused and named the first correction", async () => {
    const answers = completeAnswers({ [Q1]: "bloating" })
    delete answers[Q2]
    const db = makeDb(rowWith({ answers: stateWith({ candidateAnswers: answers }) }))
    mockGetSupabase.mockReturnValue(db.client)

    const res = await callReview(reviewPost({ sessionId: SESSION }))
    const body = await jsonOf(res)

    expect(res.status).toBe(409)
    expect(body.firstQuestionId).toBe(Q2)
    expect(body.missingQuestionIds).toContain(Q2)
    expect(db.state().phase, "no phase change on a refusal").toBe("questions")
    expect(db.counts().writes).toBe(0)
  })

  it("an invalid stored answer blocks review the same way a missing one does", async () => {
    const answers = { ...completeAnswers({ [Q1]: "bloating" }), [Q2]: "not-an-option" }
    const db = makeDb(rowWith({ answers: stateWith({ candidateAnswers: answers }) }))
    mockGetSupabase.mockReturnValue(db.client)

    const res = await callReview(reviewPost({ sessionId: SESSION }))
    const body = await jsonOf(res)

    expect(res.status).toBe(409)
    // Sanitisation drops the unusable value; completeness then reports the
    // question as outstanding, which is the state the customer must fix.
    expect(body.firstQuestionId).toBe(Q2)
    expect(db.counts().writes).toBe(0)
  })

  it("a stale candidate for a CLOSED branch does not block a complete session", async () => {
    // The customer answered Q3, then changed Q1 so Q3 stopped applying. The
    // stale answer is still stored and must not be treated as outstanding.
    const answers = completeAnswers({ [Q1]: "nothing" })
    answers[Q3] = ["rushed"]
    const db = makeDb(rowWith({ answers: stateWith({ candidateAnswers: answers }) }))
    mockGetSupabase.mockReturnValue(db.client)

    const res = await callReview(reviewPost({ sessionId: SESSION }))

    expect(res.status).toBe(200)
    expect(db.state().phase).toBe("review")
    expect(db.state().candidateAnswers[Q3], "and it is still stored").toEqual(["rushed"])
  })

  it("a skipped optional question does not block review", async () => {
    const answers = completeAnswers({ [Q1]: "nothing", [CONSTRAINTS]: ["allergy"] })
    delete answers[AVOIDANCES]
    const db = makeDb(
      rowWith({
        answers: stateWith({
          candidateAnswers: answers,
          skippedOptionalQuestionIds: [AVOIDANCES],
        }),
      }),
    )
    mockGetSupabase.mockReturnValue(db.client)

    expect((await callReview(reviewPost({ sessionId: SESSION }))).status).toBe(200)
    expect(db.state().skippedOptionalQuestionIds).toEqual([AVOIDANCES])
  })

  it("the body may not claim the Consultation is complete", async () => {
    const answers = completeAnswers({ [Q1]: "bloating" })
    delete answers[Q2]
    const db = makeDb(rowWith({ answers: stateWith({ candidateAnswers: answers }) }))
    mockGetSupabase.mockReturnValue(db.client)

    const res = await callReview(
      reviewPost({ sessionId: SESSION, complete: true, phase: "review", missingQuestionIds: [] }),
    )

    // Refused at the schema. The claim never reaches the handler, so there is no
    // code path in which it could be believed.
    expect(res.status).toBe(400)
    expect(db.counts().writes).toBe(0)
    expect(db.state().phase).toBe("questions")
  })

  it("a lone completeness claim in the body changes nothing", async () => {
    // The refusal above carries three unknown keys, so it can be refused at the
    // schema without the handler ever weighing the claim. This one carries only
    // `complete`, which is what a fail-open would actually look like: the
    // outcome that must never happen is entering Review on the browser's word.
    const answers = completeAnswers({ [Q1]: "bloating" })
    delete answers[Q2]
    const db = makeDb(rowWith({ answers: stateWith({ candidateAnswers: answers }) }))
    mockGetSupabase.mockReturnValue(db.client)

    const res = await callReview(reviewPost({ sessionId: SESSION, complete: true }))

    expect(res.status).not.toBe(200)
    expect(db.state().phase).toBe("questions")
    expect(db.counts().writes).toBe(0)
  })

  it("cannot be asked for the finalisation phase", async () => {
    const db = makeDb(
      rowWith({ answers: stateWith({ candidateAnswers: completeAnswers({ [Q1]: "bloating" }) }) }),
    )
    mockGetSupabase.mockReturnValue(db.client)

    const refused = await callReview(reviewPost({ sessionId: SESSION, phase: "ready-for-report" }))
    expect(refused.status).toBe(400)
    expect(db.state().phase).toBe("questions")

    // And the request it WILL accept writes the only phase it can write.
    const res = await callReview(reviewPost({ sessionId: SESSION }))
    expect(res.status).toBe(200)
    expect(db.state().phase, "the only phase this route can write").toBe("review")
  })

  it("an unsettled payment is refused before the row is read", async () => {
    mockRetrieveSession.mockResolvedValue({ id: SESSION, payment_status: "unpaid", metadata: {} })
    const db = makeDb(rowWith())
    mockGetSupabase.mockReturnValue(db.client)

    expect((await callReview(reviewPost({ sessionId: SESSION }))).status).toBe(402)
    expect(db.counts()).toEqual({ reads: 0, writes: 0 })
  })

  it("a legacy row is refused", async () => {
    const db = makeDb(rowWith({ questions: [{ id: "dq1", type: "single", text: "Legacy?" }] }))
    mockGetSupabase.mockReturnValue(db.client)

    expect((await callReview(reviewPost({ sessionId: SESSION }))).status).toBe(409)
    expect(db.counts().writes).toBe(0)
  })

  it("an unreadable state is refused without a write", async () => {
    const legacy = { dq1: "yes" }
    const db = makeDb(rowWith({ answers: legacy }))
    mockGetSupabase.mockReturnValue(db.client)

    expect((await callReview(reviewPost({ sessionId: SESSION }))).status).toBe(409)
    expect(db.counts().writes).toBe(0)
    expect(db.only()!.answers).toEqual(legacy)
  })

  it("a bank this build does not hold is refused", async () => {
    const drifted = { ...snapshot(), bankVersion: "consultation-v99" }
    const db = makeDb(rowWith({ questions: drifted }))
    mockGetSupabase.mockReturnValue(db.client)

    expect((await callReview(reviewPost({ sessionId: SESSION }))).status).toBe(409)
    expect(db.counts().writes).toBe(0)
  })

  it("a snapshot whose fingerprint no longer matches the bank is refused", async () => {
    const drifted = { ...snapshot(), bankFingerprint: "0000000000000000" }
    const db = makeDb(rowWith({ questions: drifted }))
    mockGetSupabase.mockReturnValue(db.client)

    expect((await callReview(reviewPost({ sessionId: SESSION }))).status).toBe(409)
    expect(db.counts().writes).toBe(0)
  })

  it("a session whose foundation disagrees with the payment is refused", async () => {
    mockResolveSummary.mockResolvedValue({ foundationType: "family", selectedAddon: null })
    const db = makeDb(
      rowWith({ answers: stateWith({ candidateAnswers: completeAnswers({ [Q1]: "bloating" }) }) }),
    )
    mockGetSupabase.mockReturnValue(db.client)

    expect((await callReview(reviewPost({ sessionId: SESSION }))).status).toBe(409)
    expect(db.counts().writes).toBe(0)
  })

  it("re-checks completeness after a compare-and-set collision", async () => {
    // A concurrent edit opens a required branch between our read and our write.
    // Blindly retrying the same write would enter Review on a Consultation that
    // is no longer complete.
    let bumped = false
    const db = makeDb(
      rowWith({
        answers: stateWith({ candidateAnswers: completeAnswers({ [Q1]: "nothing" }) }),
      }),
      {
        beforeWrite: () => {
          if (bumped) return
          bumped = true
          const row = db.only()!
          row.updated_at = "2026-09-01T10:05:00.000Z"
          row.answers = stateWith({
            candidateAnswers: { ...completeAnswers({ [Q1]: "nothing" }), [Q1]: "bloating" },
          })
        },
      },
    )
    mockGetSupabase.mockReturnValue(db.client)

    const res = await callReview(reviewPost({ sessionId: SESSION }))
    const body = await jsonOf(res)

    expect(res.status).toBe(409)
    expect(body.missingQuestionIds).toContain(Q3)
    expect(db.state().phase).toBe("questions")
  })

  it("writes nothing but the phase and the cursor", async () => {
    const before = completeAnswers({ [Q1]: "bloating" })
    const db = makeDb(
      rowWith({
        answers: stateWith({
          candidateAnswers: before,
          touchedQuestionIds: [Q1],
          currentQuestionId: Q1,
        }),
        report_json: { keep: "me" },
        pdf_url: "https://example.test/report.pdf",
        status: "in_progress",
      }),
    )
    mockGetSupabase.mockReturnValue(db.client)

    await callReview(reviewPost({ sessionId: SESSION }))

    const row = db.only()!
    expect(row.status).toBe("in_progress")
    expect(row.report_json).toEqual({ keep: "me" })
    expect(row.pdf_url).toBe("https://example.test/report.pdf")
    expect(db.state().candidateAnswers).toEqual(before)
    expect(db.state().touchedQuestionIds).toEqual([Q1])
  })
})

/* ══ The Report boundary, at runtime ═══════════════════════════════════════ */

describe("neither route can begin a Report", () => {
  it("a successful review entry produces no report, pdf or handoff field", async () => {
    const db = makeDb(
      rowWith({ answers: stateWith({ candidateAnswers: completeAnswers({ [Q1]: "bloating" }) }) }),
    )
    mockGetSupabase.mockReturnValue(db.client)

    const res = await callReview(reviewPost({ sessionId: SESSION }))
    const body = await jsonOf(res)

    expect(res.status).toBe(200)
    expect(body).toEqual({ ok: true, phase: "review" })
    const row = db.only()!
    expect(row.report_json).toBeNull()
    expect(row.pdf_url).toBeNull()
    expect(Object.keys(db.state()).sort()).toEqual(
      [
        "candidateAnswers",
        "currentQuestionId",
        "kind",
        "phase",
        "schemaVersion",
        "skippedOptionalQuestionIds",
        "touchedQuestionIds",
      ].sort(),
    )
  })

  it("no sequence of progress writes can reach the finalisation phase", async () => {
    const db = makeDb(rowWith({ answers: stateWith({ phase: "review" }) }))
    mockGetSupabase.mockReturnValue(db.client)

    for (const body of [
      { action: "answer", sessionId: SESSION, questionId: Q1, value: "bloating" },
      { action: "navigate", sessionId: SESSION, currentQuestionId: Q1 },
      { action: "clear", sessionId: SESSION, questionId: Q1 },
    ]) {
      await callProgress(patch(body))
      expect(db.state().phase).not.toBe("ready-for-report")
    }
  })
})

/* ══ Progress — skip, and the Review-list position ═════════════════════════ */

/**
 * Phase 3C-C1 corrections — what a `skip` must leave behind.
 *
 * ══ WHY THESE ARE ROUTE TESTS AND NOT CLIENT TESTS ══════════════════════════
 *
 * The client sends an explicit `null` cursor when a withdrawal comes from the
 * Review list, and a fake-adapter test proves it does. But two layers each
 * closing the same hole means neither is proven by the other: with the client
 * fixed, a route that still synthesised a position from `questionId` would go
 * unnoticed, and the next caller to omit a cursor would reopen it. So the route
 * is asserted here on its own terms, against a body that names no position.
 */
describe("PATCH progress skip leaves the customer where they actually are", () => {
  /** On the Review list, with the optional question answered and touched. */
  const onReviewList = () =>
    rowWith({
      answers: stateWith({
        candidateAnswers: completeAnswers({ [Q1]: "nothing", [CONSTRAINTS]: ["allergy"] }),
        touchedQuestionIds: [AVOIDANCES, Q1],
        skippedOptionalQuestionIds: [],
        currentQuestionId: null,
        phase: "review",
      }),
    })

  it("a skip from the Review list keeps the null cursor, even with none in the body", async () => {
    // The defect this closes: `null` filled in from `questionId` stored
    // (review, withdrawnId) — a Review EDIT of the answer just removed — while
    // the browser stayed on the list. Resume believes storage.
    const db = makeDb(onReviewList())
    mockGetSupabase.mockReturnValue(db.client)

    const res = await callProgress(
      patch({ action: "skip", sessionId: SESSION, questionId: AVOIDANCES }),
    )

    expect(res.status).toBe(200)
    expect(db.state().currentQuestionId).toBeNull()
    expect(db.state().phase).toBe("review")
  })

  it("an explicit null cursor reaches the same place", async () => {
    const db = makeDb(onReviewList())
    mockGetSupabase.mockReturnValue(db.client)

    const res = await callProgress(
      patch({
        action: "skip",
        sessionId: SESSION,
        questionId: AVOIDANCES,
        currentQuestionId: null,
      }),
    )

    expect(res.status).toBe(200)
    expect(db.state().currentQuestionId).toBeNull()
    expect(db.state().phase).toBe("review")
  })

  it("all five properties land in the ONE mutation", async () => {
    const db = makeDb(onReviewList())
    mockGetSupabase.mockReturnValue(db.client)
    const writesBefore = db.counts().writes

    await callProgress(
      patch({
        action: "skip",
        sessionId: SESSION,
        questionId: AVOIDANCES,
        currentQuestionId: null,
      }),
    )

    const after = db.state()
    expect(after.candidateAnswers[AVOIDANCES]).toBeUndefined()
    expect(after.touchedQuestionIds).not.toContain(AVOIDANCES)
    expect(after.skippedOptionalQuestionIds).toContain(AVOIDANCES)
    expect(after.phase).toBe("review")
    expect(after.currentQuestionId).toBeNull()
    // A second request to repair the position would leave a partial state
    // reachable: answer gone, position wrong, repair failed.
    expect(db.counts().writes - writesBefore).toBe(1)
  })

  it("a skip CLEARS the touched mark, exactly as the engine does locally", async () => {
    // A withdrawal is a skip of a question the customer HAD answered, so a
    // stale touched mark is guaranteed rather than hypothetical. It would say
    // they had interacted with a question that now holds nothing.
    const db = makeDb(onReviewList())
    mockGetSupabase.mockReturnValue(db.client)

    await callProgress(patch({ action: "skip", sessionId: SESSION, questionId: AVOIDANCES }))

    expect(db.state().touchedQuestionIds).not.toContain(AVOIDANCES)
    // And it touches nobody else's marks.
    expect(db.state().touchedQuestionIds).toContain(Q1)
  })

  it("an ordinary skip during the question flow still keeps its own position", async () => {
    // The non-regression half. Question flow is untouched: a skip that names no
    // position leaves the stored cursor exactly where it was.
    const db = makeDb(
      rowWith({
        answers: stateWith({
          candidateAnswers: { [Q1]: "nothing", [CONSTRAINTS]: ["allergy"] },
          touchedQuestionIds: [Q1, CONSTRAINTS],
          skippedOptionalQuestionIds: [],
          currentQuestionId: AVOIDANCES,
          phase: "questions",
        }),
      }),
    )
    mockGetSupabase.mockReturnValue(db.client)

    const res = await callProgress(
      patch({ action: "skip", sessionId: SESSION, questionId: AVOIDANCES }),
    )

    expect(res.status).toBe(200)
    const after = db.state()
    expect(after.currentQuestionId).toBe(AVOIDANCES)
    expect(after.phase).toBe("questions")
    expect(after.skippedOptionalQuestionIds).toContain(AVOIDANCES)
    expect(after.candidateAnswers[AVOIDANCES]).toBeUndefined()
  })

  it("a first answer on a session with no stored position still records one", async () => {
    // The other half of the non-regression: with nothing stored, an action that
    // names no position is still enough to say where the customer is.
    const db = makeDb(
      rowWith({
        answers: stateWith({ currentQuestionId: null, phase: "questions" }),
      }),
    )
    mockGetSupabase.mockReturnValue(db.client)

    const res = await callProgress(
      patch({ action: "answer", sessionId: SESSION, questionId: Q1, value: "nothing" }),
    )

    expect(res.status).toBe(200)
    expect(db.state().currentQuestionId).toBe(Q1)
  })

  it("a REQUIRED question is still refused, and nothing is written", async () => {
    const db = makeDb(onReviewList())
    mockGetSupabase.mockReturnValue(db.client)
    const before = db.counts().writes

    const res = await callProgress(
      patch({ action: "skip", sessionId: SESSION, questionId: Q1, currentQuestionId: null }),
    )

    expect(res.status).toBe(422)
    expect(db.counts().writes).toBe(before)
    expect(db.state().candidateAnswers[Q1]).toBeDefined()
  })
})
