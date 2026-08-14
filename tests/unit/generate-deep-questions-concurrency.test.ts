import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"

import { FALLBACK_DEEP_QUESTIONS, type DeepQuestion } from "@/lib/deep-assessment"
import { readQuestionSnapshot } from "@/lib/assessment/question-snapshot"
import { encodePaidReportSummary } from "@/lib/paid-report-session"
import { makeFakeDb, deferred, barrier } from "./helpers/fake-deep-assessments"

/**
 * POST /api/generate-deep-questions — concurrent duplicate requests.
 *
 * The race this closes recreates the exact defect #226 fixes elsewhere:
 *
 *   A and B both read no snapshot → A persists set A and returns it → B
 *   persists set B afterwards → the client holding A submits answers against
 *   ids now bound to B.
 *
 * Core ids are positional (dq1, dq2, …), so a regenerated set reuses the same
 * ids with different text: those answers RE-BIND to different questions rather
 * than being dropped, and `answersForTrustedQuestions`' id filter cannot see it.
 *
 * It is reachable. `/assessment/deep` calls this route on load, while the
 * Stripe webhook that creates the row is asynchronous — so the route routinely
 * runs before any row exists and two in-flight requests can both take the
 * insert path (StrictMode double-mount, two tabs, a refresh during the
 * multi-second Claude call).
 *
 * ── The fake table ──────────────────────────────────────────────────────────
 *
 * These tests run against a fake that enforces the REAL constraints rather
 * than replaying canned replies, because the fix depends on them:
 *
 *   - `stripe_session_id` is NOT NULL + UNIQUE (verified read-only against
 *     production: PK is `id`, and stripe_session_id carries its own unique
 *     constraint) — so a duplicate insert raises 23505;
 *   - a guarded update only matches rows still satisfying `questions IS NULL`,
 *     and `.select()` reports how many rows it actually touched.
 *
 * Both requests share one table, so "only one valid snapshot remains" is
 * observed rather than inferred.
 */

/* ── Deterministic scheduling helpers ───────────────────────────────────── */

/**
 * Both requests parked inside the Claude call, each holding its own gate.
 *
 * Reaching Claude proves the request already completed its snapshot read, so
 * waiting on this barrier — rather than on a timer — is what makes "both read
 * empty before either wrote" a guarantee instead of a hope.
 */
function gatedClaude(outcomes: Array<DeepQuestion[] | Error> = [SET_A, SET_B]) {
  const entered = barrier(outcomes.length)
  const gates = outcomes.map(() => deferred())
  let call = 0
  mockMessagesCreate.mockImplementation(async () => {
    const i = call++
    entered.arrive()
    await gates[i].promise
    const outcome = outcomes[i]
    if (outcome instanceof Error) throw outcome
    return { content: [{ type: "text", text: JSON.stringify({ questions: outcome }) }] }
  })
  return { gates, bothInsideClaude: entered.reached }
}

/* ── Mocks ──────────────────────────────────────────────────────────────── */
const mockGetSupabase = vi.fn()
const mockMessagesCreate = vi.fn()
const mockRetrieveSession = vi.fn()

vi.mock("@/lib/supabase", () => ({ getSupabase: () => mockGetSupabase() }))
vi.mock("@/lib/anthropic", () => ({
  anthropic: { messages: { create: (...a: unknown[]) => mockMessagesCreate(...a) } },
  CLAUDE_MODEL: "claude-test",
}))
vi.mock("@/lib/stripe-server", () => ({
  stripe: { checkout: { sessions: { retrieve: (...a: unknown[]) => mockRetrieveSession(...a) } } },
}))

/* ── Fixtures ───────────────────────────────────────────────────────────── */
const SESSION_ID = "cs_test_race_1"
const SUB_SCORES = { prebiotics: 62, probiotics: 38, postbiotics: 67 }
const PROFILE = { type: "Emerging Balance", tagline: "Building blocks are there.", description: "…" }

/** Positional ids, exactly as the generation prompt specifies. */
const setNamed = (marker: string): DeepQuestion[] =>
  [1, 2, 3].map(
    (n) =>
      ({
        id: `dq${n}`,
        type: "single",
        pillar: "prebiotics",
        section: "symptoms",
        text: `${marker} question ${n}`,
        options: [{ label: `${marker} opt`, value: `${marker}_${n}` }],
        required: true,
      }) as DeepQuestion,
  )

const SET_A = setNamed("ALPHA")
const SET_B = setNamed("BRAVO")

function request(): NextRequest {
  return new NextRequest("http://localhost/api/generate-deep-questions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sessionId: SESSION_ID,
      tier: "personal",
      overall: 58,
      subScores: SUB_SCORES,
      profile: PROFILE,
    }),
  })
}

async function callRoute() {
  const { POST } = await import("@/app/api/generate-deep-questions/route")
  return POST(request())
}

const bodyOf = async (res: Response) => (await res.json()) as { questions?: DeepQuestion[]; error?: string }

beforeEach(() => {
  vi.clearAllMocks()
  vi.unstubAllEnvs()
  vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_123")
  vi.stubEnv("ANTHROPIC_API_KEY", "sk-ant-test")
  mockRetrieveSession.mockResolvedValue({
    payment_status: "paid",
    metadata: {
      result_summary: encodePaidReportSummary({
        tier: "personal",
        overall: 58,
        subScores: SUB_SCORES,
        profile: PROFILE,
        foundationType: "you",
        selectedAddon: null,
      }),
    },
  })
})

/* ══ The controlled interleaving ════════════════════════════════════════ */

describe("controlled A/B interleaving: both read empty, then both write", () => {
  it("two concurrent Claude-success requests return the SAME persisted snapshot", async () => {
    const db = makeFakeDb()
    mockGetSupabase.mockReturnValue(db.client)
    const { gates, bothInsideClaude } = gatedClaude()

    // Both requests start and park inside the Claude call, so both have
    // already read "no snapshot" before either one writes.
    const a = callRoute()
    const b = callRoute()
    await bothInsideClaude
    expect(db.counts().select).toBeGreaterThanOrEqual(2)

    // A completes fully first, then B resumes — the worst case, because A has
    // already returned by the time B tries to install.
    gates[0].resolve()
    const resA = await a
    gates[1].resolve()
    const resB = await b

    const [bodyA, bodyB] = [await bodyOf(resA), await bodyOf(resB)]

    expect(resA.status).toBe(200)
    expect(resB.status).toBe(200)

    // The invariant: one snapshot, and everybody is answering it.
    expect(db.rows.size).toBe(1)
    expect(db.validSnapshots()).toHaveLength(1)
    const stored = readQuestionSnapshot([...db.rows.values()][0].questions)
    expect(stored).toEqual(SET_A)
    expect(bodyA.questions).toEqual(stored)
    expect(bodyB.questions).toEqual(stored)
  })

  it("the losing request never returns the set it generated", async () => {
    const db = makeFakeDb()
    mockGetSupabase.mockReturnValue(db.client)
    const { gates, bothInsideClaude } = gatedClaude()

    const a = callRoute()
    const b = callRoute()
    await bothInsideClaude

    gates[0].resolve()
    await a
    gates[1].resolve()
    const bodyB = await bodyOf(await b)

    // B generated SET_B and lost. Returning SET_B is the actual customer harm:
    // B's client would answer BRAVO wording against dq1..dq3, which now carry
    // ALPHA wording in the row submit-deep-assessment reads.
    expect(bodyB.questions).not.toEqual(SET_B)
    expect(bodyB.questions).toEqual(SET_A)
    expect(JSON.stringify(db.rows.get(SESSION_ID)?.questions)).not.toContain("BRAVO")
  })

  it("Claude success racing the deterministic fallback converges on one snapshot", async () => {
    const db = makeFakeDb()
    mockGetSupabase.mockReturnValue(db.client)

    // Second caller's Claude call fails, so it falls back to the bank.
    const { gates, bothInsideClaude } = gatedClaude([SET_A, new Error("upstream 529")])

    const a = callRoute()
    const b = callRoute()
    await bothInsideClaude

    gates[0].resolve()
    const resA = await a
    gates[1].resolve()
    const resB = await b
    const [bodyA, bodyB] = [await bodyOf(resA), await bodyOf(resB)]

    expect(db.validSnapshots()).toHaveLength(1)
    expect(bodyA.questions).toEqual(bodyB.questions)
    expect(bodyA.questions).toEqual(SET_A)
    // The fallback set was generated but discarded — it never reached the row.
    expect(bodyB.questions).not.toEqual(FALLBACK_DEEP_QUESTIONS)
  })

  it("two deterministic-fallback requests converge on one row", async () => {
    // No Claude at all, so the interleaving is forced at the write instead:
    // the first write waits until both requests have read.
    vi.stubEnv("ANTHROPIC_API_KEY", "")
    const bothRead = barrier(2)
    const db = makeFakeDb(null, {
      beforeSelect: () => bothRead.arrive(),
      beforeInsert: async ({ seq }) => {
        if (seq === 1) await bothRead.reached
      },
    })
    mockGetSupabase.mockReturnValue(db.client)

    const [resA, resB] = await Promise.all([callRoute(), callRoute()])
    const [bodyA, bodyB] = [await bodyOf(resA), await bodyOf(resB)]

    expect(resA.status).toBe(200)
    expect(resB.status).toBe(200)
    expect(db.rows.size).toBe(1)
    expect(db.validSnapshots()).toHaveLength(1)
    // Both sets are the same deterministic bank, so the mechanism is what
    // matters: exactly one install succeeded and the other request recovered.
    expect(bodyA.questions).toEqual(bodyB.questions)
    expect(mockMessagesCreate).not.toHaveBeenCalled()
  })

  it("a request arriving after the webhook row exists uses the guarded update, not an insert", async () => {
    // The other real ordering: the Stripe webhook created the row first, with
    // status in_progress and no questions.
    const db = makeFakeDb({
      stripe_session_id: SESSION_ID,
      tier: "personal",
      free_scores: {},
      status: "in_progress",
      questions: null,
    })
    mockGetSupabase.mockReturnValue(db.client)
    mockMessagesCreate.mockResolvedValue({
      content: [{ type: "text", text: JSON.stringify({ questions: SET_A }) }],
    })

    const body = await bodyOf(await callRoute())

    expect(body.questions).toEqual(SET_A)
    expect(db.counts().update).toBe(1)
    expect(db.counts().insert).toBe(0)
    expect(db.rows.size).toBe(1)
  })
})

/* ══ The mechanism ══════════════════════════════════════════════════════ */

describe("compare-and-set mechanics", () => {
  it("a valid snapshot is never overwritten, even by a request already mid-flight", async () => {
    // The guard is `questions IS NULL`: once a snapshot lands, no writer can
    // replace it. Modelled by seeding the row between the read and the write.
    const db = makeFakeDb({
      stripe_session_id: SESSION_ID,
      tier: "personal",
      free_scores: {},
      status: "in_progress",
      questions: null,
    })
    mockGetSupabase.mockReturnValue(db.client)
    mockMessagesCreate.mockImplementation(async () => {
      // Another request wins while this one is still talking to Claude.
      db.rows.get(SESSION_ID)!.questions = SET_A
      db.rows.get(SESSION_ID)!.status = "questions_generated"
      return { content: [{ type: "text", text: JSON.stringify({ questions: SET_B }) }] }
    })

    const body = await bodyOf(await callRoute())

    expect(body.questions).toEqual(SET_A)
    expect(readQuestionSnapshot(db.rows.get(SESSION_ID)!.questions)).toEqual(SET_A)
    expect(JSON.stringify(db.rows.get(SESSION_ID)!.questions)).not.toContain("BRAVO")
  })

  it("an existing valid snapshot causes no generation and no write at all", async () => {
    const db = makeFakeDb({
      stripe_session_id: SESSION_ID,
      tier: "personal",
      free_scores: {},
      status: "partial",
      questions: SET_A,
    })
    mockGetSupabase.mockReturnValue(db.client)

    const body = await bodyOf(await callRoute())

    expect(body.questions).toEqual(SET_A)
    expect(mockMessagesCreate).not.toHaveBeenCalled()
    expect(db.counts().insert).toBe(0)
    expect(db.counts().update).toBe(0)
    expect(db.counts().upsert).toBe(0)
  })

  it("the route issues no upsert on any path — last-write-wins is gone", async () => {
    const db = makeFakeDb()
    mockGetSupabase.mockReturnValue(db.client)
    mockMessagesCreate.mockResolvedValue({
      content: [{ type: "text", text: JSON.stringify({ questions: SET_A }) }],
    })

    await callRoute()

    expect(db.counts().upsert).toBe(0)
    expect(db.log).not.toContain("upsert")
  })
})

/* ══ Failure and boundedness ════════════════════════════════════════════ */

describe("failures return no questionnaire, and retries are bounded", () => {
  it("a write error is a 503 with no questions", async () => {
    const db = makeFakeDb(null, {}, { writeError: true })
    mockGetSupabase.mockReturnValue(db.client)
    mockMessagesCreate.mockResolvedValue({
      content: [{ type: "text", text: JSON.stringify({ questions: SET_A }) }],
    })

    const res = await callRoute()

    expect(res.status).toBe(503)
    expect((await bodyOf(res)).questions).toBeUndefined()
    expect(db.validSnapshots()).toHaveLength(0)
  })

  it("malformed stored data returns 503 after a bounded number of attempts", async () => {
    // A non-null but unrenderable value. The CAS guard can never match it, so
    // the route must give up rather than spin — and must never overwrite data
    // it cannot characterise.
    const db = makeFakeDb({
      stripe_session_id: SESSION_ID,
      tier: "personal",
      free_scores: {},
      status: "in_progress",
      questions: [{ id: "dq1", text: "no type field" }],
    })
    mockGetSupabase.mockReturnValue(db.client)
    mockMessagesCreate.mockResolvedValue({
      content: [{ type: "text", text: JSON.stringify({ questions: SET_A }) }],
    })

    const res = await callRoute()

    expect(res.status).toBe(503)
    expect((await bodyOf(res)).questions).toBeUndefined()
    // Bounded: an infinite retry loop fails here rather than hanging the suite.
    expect(db.counts().select).toBeLessThanOrEqual(4)
    expect(mockMessagesCreate).toHaveBeenCalledTimes(1)
    // Untouched — the unreadable value is preserved, not replaced.
    expect(db.rows.get(SESSION_ID)!.questions).toEqual([{ id: "dq1", text: "no type field" }])
  })

  it("Claude is called at most once even when the install has to retry", async () => {
    const db = makeFakeDb()
    mockGetSupabase.mockReturnValue(db.client)
    let generated = 0
    mockMessagesCreate.mockImplementation(async () => {
      generated++
      // Somebody else inserts first, forcing this request down the recovery path.
      db.rows.set(SESSION_ID, {
        stripe_session_id: SESSION_ID,
        tier: "personal",
        free_scores: {},
        status: "questions_generated",
        questions: SET_A,
      })
      return { content: [{ type: "text", text: JSON.stringify({ questions: SET_B }) }] }
    })

    const body = await bodyOf(await callRoute())

    expect(generated).toBe(1)
    expect(body.questions).toEqual(SET_A)
    expect(db.validSnapshots()).toHaveLength(1)
  })
})
