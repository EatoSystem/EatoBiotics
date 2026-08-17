import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"

import { FALLBACK_DEEP_QUESTIONS, type DeepQuestion } from "@/lib/deep-assessment"
import { ADDON_KEYS, type AddonType } from "@/lib/addon-types"
import { addonQuestionsFor } from "@/lib/assessment/addon-questions"
import { encodePaidReportSummary } from "@/lib/paid-report-session"
import { PROMPT_QUESTION_FIELDS } from "@/lib/assessment/question-snapshot"
import { makeFakeDb, type Row } from "./helpers/fake-deep-assessments"

/**
 * POST /api/generate-deep-questions — snapshot reliability.
 *
 * Three invariants, all found while auditing #223:
 *
 *  1. No 200 may carry questions that were not persisted first. A questionnaire
 *     that exists nowhere cannot be submitted against — submit-deep-assessment
 *     reads the row back and 400s on an empty one — so returning one lets a
 *     customer answer up to 25 questions and then be refused.
 *
 *  2. Reuse keys on the stored snapshot, never on the row's `status`. Nothing in
 *     the codebase writes a status meaning "start over", so a status allowlist
 *     could only ever be wrong by regenerating over a live snapshot.
 *
 *  3. The install is a compare-and-set, never a blind write, so two concurrent
 *     requests cannot each install a different set. The interleaving proofs live
 *     in generate-deep-questions-concurrency.test.ts; this file covers the
 *     single-request behaviour of the same mechanism.
 *
 * Core ids are positional (dq1, dq2, …), which is what makes a replaced
 * snapshot harmful rather than merely wasteful: saved answers re-bind to
 * different question text instead of being dropped.
 */

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
const SESSION_ID = "cs_test_snapshot_1"
const SUB_SCORES = { prebiotics: 62, probiotics: 38, postbiotics: 67 }
const PROFILE = { type: "Emerging Balance", tagline: "Building blocks are there.", description: "…" }

/** A Claude-shaped core set — positional ids, exactly like the real prompt asks for. */
const claudeSet = (marker: string): DeepQuestion[] =>
  [1, 2, 3].map(
    (n) =>
      ({
        id: `dq${n}`,
        type: "single",
        pillar: "prebiotics",
        section: "symptoms",
        text: `${marker} question ${n}`,
        options: [{ label: `${marker} option`, value: `${marker}_${n}` }],
        required: true,
      }) as DeepQuestion,
  )

function claudeReturns(questions: unknown) {
  mockMessagesCreate.mockResolvedValue({
    content: [{ type: "text", text: JSON.stringify({ questions }) }],
  })
}

/** A row shaped the way the Stripe webhook or save-deep-progress leaves it. */
const rowWith = (over: Row = {}): Row => ({
  stripe_session_id: SESSION_ID,
  tier: "personal",
  free_scores: {},
  status: "in_progress",
  questions: null,
  ...over,
})

function makeRequest(sessionId = SESSION_ID): NextRequest {
  return new NextRequest("http://localhost/api/generate-deep-questions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sessionId,
      tier: "personal",
      overall: 58,
      subScores: SUB_SCORES,
      profile: PROFILE,
    }),
  })
}

/** A request whose body deliberately disagrees with the settled session. */
function hostileRequest(overrides: Record<string, unknown>): NextRequest {
  return new NextRequest("http://localhost/api/generate-deep-questions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sessionId: SESSION_ID,
      tier: "personal",
      overall: 58,
      subScores: SUB_SCORES,
      profile: PROFILE,
      ...overrides,
    }),
  })
}

async function callRoute(req: NextRequest = makeRequest()) {
  const { POST } = await import("@/app/api/generate-deep-questions/route")
  return POST(req)
}

const bodyOf = async (res: Response) => (await res.json()) as { questions?: DeepQuestion[]; error?: string }

/** A settled Stripe session carrying the given entitlement. */
function paidSession(addon: AddonType | null, foundation: "you" | "family" = "you") {
  return {
    payment_status: "paid",
    metadata: {
      result_summary: encodePaidReportSummary({
        tier: "personal",
        overall: 58,
        subScores: SUB_SCORES,
        profile: PROFILE,
        foundationType: foundation,
        selectedAddon: addon,
      }),
    },
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.unstubAllEnvs()
  // Default: real paid flow, no add-on, Claude available.
  vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_123")
  vi.stubEnv("ANTHROPIC_API_KEY", "sk-ant-test")
  mockRetrieveSession.mockResolvedValue(paidSession(null))
  claudeReturns(claudeSet("claude"))
})

/* ══ Invariant 1: nothing is returned that was not stored ════════════════ */

describe("every successful response was persisted first", () => {
  it("Claude success persists before returning", async () => {
    const db = makeFakeDb()
    mockGetSupabase.mockReturnValue(db.client)

    const res = await callRoute()
    const body = await bodyOf(res)

    expect(res.status).toBe(200)
    expect(db.only()?.questions).toEqual(body.questions)
    expect(body.questions?.[0].text).toBe("claude question 1")
  })

  it("no API key persists the fallback before returning", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "")
    const db = makeFakeDb()
    mockGetSupabase.mockReturnValue(db.client)

    const res = await callRoute()
    const body = await bodyOf(res)

    expect(res.status).toBe(200)
    expect(mockMessagesCreate).not.toHaveBeenCalled()
    expect(db.only()?.questions).toEqual(body.questions)
    expect(body.questions?.map((q) => q.id)).toEqual(FALLBACK_DEEP_QUESTIONS.map((q) => q.id))
  })

  it("Claude failure persists the fallback before returning", async () => {
    mockMessagesCreate.mockRejectedValue(new Error("upstream 529"))
    const db = makeFakeDb()
    mockGetSupabase.mockReturnValue(db.client)

    const res = await callRoute()
    const body = await bodyOf(res)

    expect(res.status).toBe(200)
    expect(db.only()?.questions).toEqual(body.questions)
    expect(body.questions?.map((q) => q.id)).toEqual(FALLBACK_DEEP_QUESTIONS.map((q) => q.id))
  })

  it("an unusable Claude response falls back and still persists", async () => {
    // Reuse hands this exact set back on every later request, so a set the
    // questionnaire cannot render must never be the thing that gets pinned.
    claudeReturns([{ id: "dq1", text: "no type field" }])
    const db = makeFakeDb()
    mockGetSupabase.mockReturnValue(db.client)

    const res = await callRoute()
    const body = await bodyOf(res)

    expect(res.status).toBe(200)
    expect(body.questions?.map((q) => q.id)).toEqual(FALLBACK_DEEP_QUESTIONS.map((q) => q.id))
    expect(db.only()?.questions).toEqual(body.questions)
  })

  it("the response payload is structurally equivalent to the persisted payload", async () => {
    const db = makeFakeDb()
    mockGetSupabase.mockReturnValue(db.client)

    const body = await bodyOf(await callRoute())

    /*
     * Structural equivalence, not byte equality — and that distinction is real
     * rather than pedantic. `questions` is a jsonb column, and Postgres jsonb
     * does not preserve object key order (it also drops duplicate keys), so the
     * bytes a later reader gets back are not guaranteed to match the bytes this
     * route sent. Byte equality was never the available guarantee, so asserting
     * it here would only be testing the fake, which stores the object by
     * reference.
     *
     * `toEqual` is key-order-insensitive, which is exactly the jsonb semantics.
     */
    expect(body.questions).toEqual(db.only()?.questions)

    // The values report generation actually consumes must match exactly — these
    // are the three the downstream contract is pinned to, and all are scalars,
    // so key ordering cannot affect them.
    const values = (qs: DeepQuestion[] | undefined) =>
      (qs ?? []).map((q) => PROMPT_QUESTION_FIELDS.map((f) => q[f]))
    expect(values(body.questions)).toEqual(values(db.only()?.questions as DeepQuestion[]))

    // Wording and options still round-trip; they are simply not what the
    // contract guarantees.
    expect(body.questions?.[0].options).toEqual(
      (db.only()?.questions as DeepQuestion[])[0].options,
    )
  })

  it("a first write creates the row via insert; an existing row is updated in place", async () => {
    const fresh = makeFakeDb()
    mockGetSupabase.mockReturnValue(fresh.client)
    await callRoute()
    expect(fresh.counts().insert).toBe(1)
    expect(fresh.counts().update).toBe(0)

    vi.clearAllMocks()
    claudeReturns(claudeSet("claude"))
    mockRetrieveSession.mockResolvedValue(paidSession(null))
    const existing = makeFakeDb(rowWith())
    mockGetSupabase.mockReturnValue(existing.client)
    await callRoute()
    expect(existing.counts().update).toBe(1)
    expect(existing.counts().insert).toBe(0)
  })

  it("updating an existing row leaves tier and free_scores alone", async () => {
    // The Stripe webhook writes those from the settled session; this route only
    // has the request body, so it writes the columns it owns and nothing else.
    const db = makeFakeDb(rowWith({ tier: "premium", free_scores: { fromWebhook: true } }))
    mockGetSupabase.mockReturnValue(db.client)

    await callRoute()

    expect(db.only()?.tier).toBe("premium")
    expect(db.only()?.free_scores).toEqual({ fromWebhook: true })
    expect(db.only()?.status).toBe("questions_generated")
  })
})

describe("persistence failure never returns questions", () => {
  it("a write error is a 503, not a degraded 200", async () => {
    const db = makeFakeDb(null, {}, { writeError: true })
    mockGetSupabase.mockReturnValue(db.client)

    const res = await callRoute()
    const body = await bodyOf(res)

    expect(res.status).toBe(503)
    expect(body.questions).toBeUndefined()
    expect(body.error).toBeTruthy()
  })

  it("a write exception is a 503, not a degraded 200", async () => {
    const db = makeFakeDb(null, {}, { writeThrows: true })
    mockGetSupabase.mockReturnValue(db.client)

    const res = await callRoute()

    expect(res.status).toBe(503)
    expect((await bodyOf(res)).questions).toBeUndefined()
  })

  it("a failed read-before-install is a 503 — a winner cannot be told from a loser", async () => {
    const db = makeFakeDb(null, {}, { selectError: true })
    mockGetSupabase.mockReturnValue(db.client)

    const res = await callRoute()

    expect(res.status).toBe(503)
    expect((await bodyOf(res)).questions).toBeUndefined()
    expect(db.validSnapshots()).toHaveLength(0)
  })

  it("Stripe configured but Supabase missing is a 503", async () => {
    // A production misconfiguration: there is nowhere to persist, so there is
    // nothing safe to return.
    mockGetSupabase.mockReturnValue(null)

    const res = await callRoute()

    expect(res.status).toBe(503)
    expect((await bodyOf(res)).questions).toBeUndefined()
  })

  it("dev mode without Supabase still serves questions", async () => {
    // No Stripe session means no row to bind to; resolveTrustedQuestions
    // reconstructs the deterministic bank at submit time.
    vi.stubEnv("STRIPE_SECRET_KEY", "")
    mockGetSupabase.mockReturnValue(null)

    const res = await callRoute()

    expect(res.status).toBe(200)
    expect((await bodyOf(res)).questions?.length).toBeGreaterThan(0)
  })
})

/* ══ Invariant 2: reuse follows the snapshot, not the status ═════════════ */

describe("an existing snapshot is reused whatever the status", () => {
  const STORED = claudeSet("stored")

  /* Every status any writer puts on this row.
     `status` is NOT NULL with a DEFAULT of 'pending' in production, so a NULL
     is unreachable and 'pending' is the value a row created without an explicit
     status carries — both were outside the old four-value allowlist, as was
     'partial', which submit-deep-assessment really does write. */
  it.each([
    ["pending", "the column DEFAULT — outside the old allowlist"],
    ["in_progress", "stripe webhook / save-deep-progress default"],
    ["questions_generated", "this route"],
    ["analysing", "submit-deep-assessment steps 4 and 7"],
    ["complete", "submit-deep-assessment step 10"],
    ["partial", "submit-deep-assessment step 10 — outside the old allowlist"],
    ["something_a_caller_invented", "save-deep-progress passes status through"],
    [null, "defensive only: the column is NOT NULL, so this cannot occur"],
  ] as Array<[string | null, string]>)("status %p (%s) reuses the stored snapshot", async (status) => {
    const db = makeFakeDb(rowWith({ questions: STORED, status }))
    mockGetSupabase.mockReturnValue(db.client)

    const res = await callRoute()
    const body = await bodyOf(res)

    expect(res.status).toBe(200)
    expect(body.questions).toEqual(STORED)
    expect(mockMessagesCreate).not.toHaveBeenCalled()
    expect(db.counts().insert + db.counts().update + db.counts().upsert).toBe(0)
  })

  it("reuse returns the stored wording and options verbatim", async () => {
    const stored = [
      {
        id: "dq1",
        type: "single",
        pillar: "prebiotics",
        text: "The exact question the customer is part-way through answering",
        options: [{ label: "Original label", value: "original_value" }],
        required: true,
      },
    ]
    const db = makeFakeDb(rowWith({ questions: stored, status: "partial" }))
    mockGetSupabase.mockReturnValue(db.client)

    const body = await bodyOf(await callRoute())

    expect(JSON.stringify(body.questions)).toBe(JSON.stringify(stored))
  })

  it("a save-deep-progress-shaped row cannot have its snapshot replaced", async () => {
    // save-deep-progress upserts answers + status without touching `questions`.
    // The customer is mid-questionnaire: replacing the set now would re-bind
    // these answers to different question text, because ids are positional.
    const db = makeFakeDb(
      rowWith({
        questions: STORED,
        status: "something_a_caller_invented",
        answers: { dq1: "already answered", dq2: "also answered" },
      }),
    )
    mockGetSupabase.mockReturnValue(db.client)

    const body = await bodyOf(await callRoute())

    expect(body.questions).toEqual(STORED)
    expect(db.log.filter((op) => op !== "select")).toHaveLength(0)
    expect(mockMessagesCreate).not.toHaveBeenCalled()
  })

  it("reuse survives a status the allowlist would have rejected AND a second call", async () => {
    const db = makeFakeDb(rowWith({ questions: STORED, status: "partial" }))
    mockGetSupabase.mockReturnValue(db.client)

    const first = await bodyOf(await callRoute())
    const second = await bodyOf(await callRoute())

    expect(first.questions).toEqual(second.questions)
    expect(db.log.filter((op) => op !== "select")).toHaveLength(0)
  })
})

describe("an unusable stored set: regenerate when absent, refuse when unreadable", () => {
  it.each([
    ["no row at all", null],
    ["an explicit null", rowWith({ questions: null })],
  ] as Array<[string, Row | null]>)("regenerates and installs when questions are %s", async (_label, seed) => {
    const db = makeFakeDb(seed)
    mockGetSupabase.mockReturnValue(db.client)

    const res = await callRoute()
    const body = await bodyOf(res)

    expect(res.status).toBe(200)
    expect(mockMessagesCreate).toHaveBeenCalledTimes(1)
    expect(db.only()?.questions).toEqual(body.questions)
    expect(body.questions?.[0].text).toBe("claude question 1")
  })

  /**
   * Non-null but unreadable. The CAS guard is `questions IS NULL`, so it can
   * never match these — and overwriting a value we cannot characterise is
   * precisely what the guard exists to prevent. The route refuses instead of
   * spinning, and leaves the stored value untouched.
   *
   * Unreachable from this codebase: the route validates before storing, and
   * neither the Stripe webhook nor save-deep-progress writes `questions`.
   */
  it.each([
    ["empty", []],
    ["not an array", { dq1: "x" }],
    ["malformed elements", [{ id: "dq1", text: "no type" }]],
    ["a partly-malformed set", [...FALLBACK_DEEP_QUESTIONS, { id: "dq99" }]],
  ])("refuses with 503 when stored questions are %s, without overwriting", async (_label, questions) => {
    const db = makeFakeDb(rowWith({ questions }))
    mockGetSupabase.mockReturnValue(db.client)

    const res = await callRoute()

    expect(res.status).toBe(503)
    expect((await bodyOf(res)).questions).toBeUndefined()
    expect(db.only()?.questions).toEqual(questions)
    expect(db.counts().update + db.counts().insert).toBe(0)
    // Bounded: an unbounded retry would blow past this rather than fail.
    expect(db.counts().select).toBeLessThanOrEqual(4)
  })

  it("a transient blip on the first read still converges", async () => {
    // The reuse read is best-effort; the read-before-install is the one that
    // must succeed. A single failed read must not cost the customer anything.
    const db = makeFakeDb(null, {}, { selectErrorOnSeq: 1 })
    mockGetSupabase.mockReturnValue(db.client)

    const res = await callRoute()
    const body = await bodyOf(res)

    expect(res.status).toBe(200)
    expect(db.only()?.questions).toEqual(body.questions)
  })
})

/* ══ #228: tier and free_scores are Stripe-owned ════════════════════════ */

/**
 * The request body carries `tier`, `overall`, `subScores` and `profile`, and
 * anyone holding the session id can set them to anything. `tier` and
 * `free_scores` describe what was PURCHASED, and the Stripe webhook writes both
 * from the settled checkout — so if this route wrote them from the body, the
 * row's meaning would depend on which writer landed first.
 *
 * Every case below makes the body disagree with the session and asserts the
 * STORED ROW follows the session. The existing suite cannot catch this on its
 * own: its fixtures make body and session agree, so both sources produce the
 * same row.
 */
describe("server-owned fields come from the settled session, never the body", () => {
  /** The session says: personal tier, these scores, this profile. */
  const SESSION_SCORES = { prebiotics: 62, probiotics: 38, postbiotics: 67 }

  beforeEach(() => {
    mockRetrieveSession.mockResolvedValue(paidSession(null))
  })

  it("a body claiming a higher tier cannot raise the stored tier", async () => {
    const db = makeFakeDb()
    mockGetSupabase.mockReturnValue(db.client)

    const res = await callRoute(hostileRequest({ tier: "premium" }))

    expect(res.status).toBe(200)
    expect(db.only()?.tier).toBe("personal")
    expect(db.only()?.tier).not.toBe("premium")
  })

  it("altered scores in the body never reach free_scores", async () => {
    const db = makeFakeDb()
    mockGetSupabase.mockReturnValue(db.client)

    await callRoute(
      hostileRequest({
        overall: 99,
        subScores: { prebiotics: 99, probiotics: 99, postbiotics: 99 },
        profile: { type: "FORGED", tagline: "forged", description: "forged" },
      }),
    )

    const stored = db.only()?.free_scores as Record<string, unknown>
    expect(stored.overall).toBe(58)
    expect(stored.subScores).toEqual(SESSION_SCORES)
    expect((stored.profile as { type: string }).type).toBe("Emerging Balance")
    expect(JSON.stringify(stored)).not.toContain("FORGED")
    expect(JSON.stringify(stored)).not.toContain("99")
  })

  it("a body-supplied add-on neither reaches the row nor the questionnaire", async () => {
    // Session grants no add-on; the body asks for the mind lens.
    const db = makeFakeDb()
    mockGetSupabase.mockReturnValue(db.client)

    const body = await bodyOf(await callRoute(hostileRequest({ selectedAddon: "mind" })))

    // No lens questions appended…
    expect(body.questions).toHaveLength(claudeSet("claude").length)
    expect(body.questions?.some((q) => /_lens/.test(q.id))).toBe(false)
    // …and the stored entitlement records the session's answer, not the body's.
    expect((db.only()?.free_scores as { selectedAddon: unknown }).selectedAddon).toBeNull()
  })

  it("the stored fields match the shape the Stripe webhook writes", async () => {
    // The two authoritative writers must agree field-for-field, or the row's
    // meaning depends on which one landed first.
    mockRetrieveSession.mockResolvedValue(paidSession("glucose", "family"))
    const db = makeFakeDb()
    mockGetSupabase.mockReturnValue(db.client)

    await callRoute(hostileRequest({ tier: "premium", overall: 99 }))

    expect(db.only()?.free_scores).toEqual({
      overall: 58,
      subScores: SESSION_SCORES,
      profile: PROFILE,
      foundationType: "family",
      selectedAddon: "glucose",
    })
    expect(db.only()?.tier).toBe("personal")
  })

  it("webhook lag still produces a Stripe-owned row", async () => {
    // The row is absent precisely because the webhook has not landed. That is
    // the only path that creates it here, and it must not use body values.
    const db = makeFakeDb(null)
    mockGetSupabase.mockReturnValue(db.client)

    const res = await callRoute(hostileRequest({ tier: "premium", overall: 99 }))

    expect(res.status).toBe(200)
    expect(db.counts().insert).toBe(1)
    expect(db.only()?.tier).toBe("personal")
    expect((db.only()?.free_scores as { overall: number }).overall).toBe(58)
  })

  it("an existing webhook-written row keeps its values when questions are installed", async () => {
    const db = makeFakeDb(rowWith({ tier: "personal", free_scores: { fromWebhook: true } }))
    mockGetSupabase.mockReturnValue(db.client)

    await callRoute(hostileRequest({ tier: "premium", overall: 99 }))

    expect(db.only()?.tier).toBe("personal")
    expect(db.only()?.free_scores).toEqual({ fromWebhook: true })
    expect(db.counts().insert).toBe(0)
  })

  it("an unsettled checkout is refused and writes nothing", async () => {
    mockRetrieveSession.mockResolvedValue({ payment_status: "unpaid", metadata: {} })
    const db = makeFakeDb()
    mockGetSupabase.mockReturnValue(db.client)

    const res = await callRoute(hostileRequest({ tier: "premium" }))

    expect(res.status).toBe(401)
    expect(db.rows.size).toBe(0)
    expect(mockMessagesCreate).not.toHaveBeenCalled()
  })

  it("a settled session with no readable summary refuses rather than trusting the body", async () => {
    // No authoritative value exists. The body is not an acceptable substitute,
    // so the route must refuse instead of silently falling back.
    mockRetrieveSession.mockResolvedValue({ payment_status: "paid", metadata: {} })
    const db = makeFakeDb()
    mockGetSupabase.mockReturnValue(db.client)

    const res = await callRoute(hostileRequest({ tier: "premium", overall: 99 }))

    expect(res.status).toBe(503)
    expect((await bodyOf(res)).questions).toBeUndefined()
    expect(db.rows.size).toBe(0)
  })

  it("a 100%-promo checkout (no_payment_required) is honoured, not rejected", async () => {
    // Stripe marks a fully-discounted checkout `no_payment_required`. The
    // webhook and submit-deep-assessment both accept it; gating on
    // `payment_status === "paid"` here used to 401 those buyers out of their
    // own questionnaire.
    mockRetrieveSession.mockResolvedValue({
      ...paidSession(null),
      payment_status: "no_payment_required",
    })
    const db = makeFakeDb()
    mockGetSupabase.mockReturnValue(db.client)

    const res = await callRoute()

    expect(res.status).toBe(200)
    expect(db.only()?.tier).toBe("personal")
  })

  it("reuse rewrites nothing, so a later hostile call cannot revise the row", async () => {
    const stored = claudeSet("stored")
    const db = makeFakeDb(rowWith({ questions: stored, tier: "personal", free_scores: { fromWebhook: true } }))
    mockGetSupabase.mockReturnValue(db.client)

    const body = await bodyOf(await callRoute(hostileRequest({ tier: "premium", overall: 99 })))

    expect(body.questions).toEqual(stored)
    expect(db.only()?.tier).toBe("personal")
    expect(db.only()?.free_scores).toEqual({ fromWebhook: true })
    expect(db.log.filter((op) => op !== "select")).toHaveLength(0)
  })

  it("dev mode has no session, so it is the one named exception", async () => {
    // No Stripe key ⇒ nothing authoritative exists to read. This path is
    // explicit rather than a silent degradation, and cannot occur in production
    // because devMode is `!process.env.STRIPE_SECRET_KEY`.
    vi.stubEnv("STRIPE_SECRET_KEY", "")
    const db = makeFakeDb()
    mockGetSupabase.mockReturnValue(db.client)

    const res = await callRoute(hostileRequest({ tier: "premium" }))

    expect(res.status).toBe(200)
    expect(db.only()?.tier).toBe("premium")
    expect(mockRetrieveSession).not.toHaveBeenCalled()
  })
})

/* ══ #221 entitlement behaviour is unchanged ════════════════════════════ */

describe("entitlement-derived lens questions are retained", () => {
  it("no add-on yields the core set only", async () => {
    mockRetrieveSession.mockResolvedValue(paidSession(null))
    const db = makeFakeDb()
    mockGetSupabase.mockReturnValue(db.client)

    const body = await bodyOf(await callRoute())

    expect(body.questions).toHaveLength(claudeSet("claude").length)
    expect(body.questions?.some((q) => /lens/i.test(q.id))).toBe(false)
    expect(db.only()?.questions).toEqual(body.questions)
  })

  it.each(ADDON_KEYS)("%s appends exactly its four lens questions", async (addon) => {
    mockRetrieveSession.mockResolvedValue(paidSession(addon))
    const db = makeFakeDb()
    mockGetSupabase.mockReturnValue(db.client)

    const body = await bodyOf(await callRoute())
    const expectedLens = addonQuestionsFor(addon, "you")

    expect(expectedLens).toHaveLength(4)
    expect(body.questions).toHaveLength(claudeSet("claude").length + 4)
    // Appended, never interleaved — the core set stays what it was.
    expect(body.questions?.slice(0, 3).map((q) => q.id)).toEqual(["dq1", "dq2", "dq3"])
    expect(body.questions?.slice(3)).toEqual(expectedLens)
    expect(db.only()?.questions).toEqual(body.questions)
  })

  it("family foundation changes lens wording but not the id set", async () => {
    mockRetrieveSession.mockResolvedValue(paidSession("mind", "family"))
    const db = makeFakeDb()
    mockGetSupabase.mockReturnValue(db.client)

    const body = await bodyOf(await callRoute())

    expect(body.questions?.slice(3)).toEqual(addonQuestionsFor("mind", "family"))
  })

  it("the lens is re-derived from the session, not read from the stored row", async () => {
    // A row storing a Mind lens under a Glucose entitlement must not resurrect
    // the Mind questions — but reuse also must not rewrite the row. Reuse wins
    // here; submit-deep-assessment is where the lens is re-derived (#221), and
    // resolveTrustedQuestions discards stored lens entries outright.
    mockRetrieveSession.mockResolvedValue(paidSession("glucose"))
    const stored = [...claudeSet("stored"), ...addonQuestionsFor("mind", "you")]
    const db = makeFakeDb(rowWith({ questions: stored }))
    mockGetSupabase.mockReturnValue(db.client)

    const body = await bodyOf(await callRoute())

    expect(body.questions).toEqual(stored)
    expect(db.log.filter((op) => op !== "select")).toHaveLength(0)
  })
})
