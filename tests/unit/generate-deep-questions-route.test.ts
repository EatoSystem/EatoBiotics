import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"

import { FALLBACK_DEEP_QUESTIONS, type DeepQuestion } from "@/lib/deep-assessment"
import { ADDON_KEYS, type AddonType } from "@/lib/addon-types"
import { addonQuestionsFor } from "@/lib/assessment/addon-questions"
import { encodePaidReportSummary } from "@/lib/paid-report-session"

/**
 * POST /api/generate-deep-questions — snapshot reliability.
 *
 * Two invariants, both found while auditing #223:
 *
 *  1. No 200 may carry questions that were not persisted first. A questionnaire
 *     that exists nowhere cannot be submitted against — submit-deep-assessment
 *     reads the row back and 400s on an empty one — so returning one lets a
 *     customer answer up to 25 questions and then be refused.
 *
 *  2. Reuse keys on the stored snapshot, never on the row's `status`. Nothing in
 *     the codebase writes a status meaning "start over", so a status allowlist
 *     could only ever be wrong by regenerating over a live snapshot. Core ids
 *     are positional (dq1, dq2, …), so a regenerated set re-binds saved answers
 *     to different questions rather than dropping them.
 *
 * External services are mocked per the submit-deep-assessment-partial.test.ts
 * pattern.
 */

/* ── Chainable Supabase stub (queue per table, records writes) ──────────── */
type Queued = { data?: unknown; error?: unknown }

function makeSupabaseStub(
  queues: Record<string, Queued[]>,
  opts: { throwOnUpsert?: boolean } = {},
) {
  const writes: { table: string; method: string; payload: unknown }[] = []
  const from = (table: string) => {
    const next = (): Queued => queues[table]?.shift() ?? { data: null, error: null }
    const chain: Record<string, unknown> = {}
    const self = () => chain
    for (const m of ["select", "eq", "in", "not", "order", "limit"]) chain[m] = self
    for (const m of ["insert", "update", "upsert"]) {
      chain[m] = (payload: unknown) => {
        if (opts.throwOnUpsert && m === "upsert") throw new Error("connection reset")
        writes.push({ table, method: m, payload })
        return chain
      }
    }
    chain.maybeSingle = () => Promise.resolve(next())
    chain.single = () => Promise.resolve(next())
    chain.then = (resolve: (v: Queued) => void) => resolve(next())
    return chain
  }
  return { client: { from } as unknown, writes }
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

async function callRoute(req: NextRequest = makeRequest()) {
  const { POST } = await import("@/app/api/generate-deep-questions/route")
  return POST(req)
}

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

/** The questions actually written to deep_assessments, if any. */
function persistedQuestions(writes: { table: string; method: string; payload: unknown }[]) {
  const upserts = writes.filter((w) => w.table === "deep_assessments" && w.method === "upsert")
  if (upserts.length === 0) return null
  return (upserts[upserts.length - 1].payload as { questions: DeepQuestion[] }).questions
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
    const { client, writes } = makeSupabaseStub({ deep_assessments: [{ data: null }, {}] })
    mockGetSupabase.mockReturnValue(client)

    const res = await callRoute()
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(persistedQuestions(writes)).not.toBeNull()
    expect(body.questions).toEqual(persistedQuestions(writes))
    expect(body.questions[0].text).toBe("claude question 1")
  })

  it("no API key persists the fallback before returning", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "")
    const { client, writes } = makeSupabaseStub({ deep_assessments: [{ data: null }, {}] })
    mockGetSupabase.mockReturnValue(client)

    const res = await callRoute()
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(mockMessagesCreate).not.toHaveBeenCalled()
    expect(persistedQuestions(writes)).toEqual(body.questions)
    expect(body.questions.map((q: DeepQuestion) => q.id)).toEqual(
      FALLBACK_DEEP_QUESTIONS.map((q) => q.id),
    )
  })

  it("Claude failure persists the fallback before returning", async () => {
    mockMessagesCreate.mockRejectedValue(new Error("upstream 529"))
    const { client, writes } = makeSupabaseStub({ deep_assessments: [{ data: null }, {}] })
    mockGetSupabase.mockReturnValue(client)

    const res = await callRoute()
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(persistedQuestions(writes)).toEqual(body.questions)
    expect(body.questions.map((q: DeepQuestion) => q.id)).toEqual(
      FALLBACK_DEEP_QUESTIONS.map((q) => q.id),
    )
  })

  it("an unusable Claude response falls back and still persists", async () => {
    // Reuse hands this exact set back on every later request, so a set the
    // questionnaire cannot render must never be the thing that gets pinned.
    claudeReturns([{ id: "dq1", text: "no type field" }])
    const { client, writes } = makeSupabaseStub({ deep_assessments: [{ data: null }, {}] })
    mockGetSupabase.mockReturnValue(client)

    const res = await callRoute()
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.questions.map((q: DeepQuestion) => q.id)).toEqual(
      FALLBACK_DEEP_QUESTIONS.map((q) => q.id),
    )
    expect(persistedQuestions(writes)).toEqual(body.questions)
  })

  it("the response payload is identical to the persisted payload, field for field", async () => {
    const { client, writes } = makeSupabaseStub({ deep_assessments: [{ data: null }, {}] })
    mockGetSupabase.mockReturnValue(client)

    const body = await (await callRoute()).json()

    // Not just the ids: options and wording must match too, since the customer
    // answers the response and submit-deep-assessment reads the row.
    expect(JSON.stringify(body.questions)).toBe(JSON.stringify(persistedQuestions(writes)))
  })
})

describe("persistence failure never returns questions", () => {
  it("an upsert error is a 503, not a degraded 200", async () => {
    const { client } = makeSupabaseStub({
      deep_assessments: [{ data: null }, { error: { message: "deadlock detected" } }],
    })
    mockGetSupabase.mockReturnValue(client)

    const res = await callRoute()
    const body = await res.json()

    expect(res.status).toBe(503)
    expect(body.questions).toBeUndefined()
    expect(body.error).toBeTruthy()
  })

  it("an upsert exception is a 503, not a degraded 200", async () => {
    const { client } = makeSupabaseStub({ deep_assessments: [{ data: null }] }, { throwOnUpsert: true })
    mockGetSupabase.mockReturnValue(client)

    const res = await callRoute()
    const body = await res.json()

    expect(res.status).toBe(503)
    expect(body.questions).toBeUndefined()
  })

  it("Stripe configured but Supabase missing is a 503", async () => {
    // A production misconfiguration: there is nowhere to persist, so there is
    // nothing safe to return.
    mockGetSupabase.mockReturnValue(null)

    const res = await callRoute()

    expect(res.status).toBe(503)
    expect((await res.json()).questions).toBeUndefined()
  })

  it("dev mode without Supabase still serves questions", async () => {
    // No Stripe session means no row to bind to; resolveTrustedQuestions
    // reconstructs the deterministic bank at submit time.
    vi.stubEnv("STRIPE_SECRET_KEY", "")
    mockGetSupabase.mockReturnValue(null)

    const res = await callRoute()

    expect(res.status).toBe(200)
    expect((await res.json()).questions.length).toBeGreaterThan(0)
  })
})

/* ══ Invariant 2: reuse follows the snapshot, not the status ═════════════ */

describe("an existing snapshot is reused whatever the status", () => {
  const STORED = claudeSet("stored")

  /* Every status any writer puts on this row, plus NULL. "partial" is written
     by submit-deep-assessment and was absent from the old four-value allowlist;
     an arbitrary string is what the unauthenticated save-deep-progress PATCH
     will write, since it passes `status` straight through. */
  it.each([
    ["in_progress", "stripe webhook / save-deep-progress default"],
    ["questions_generated", "this route"],
    ["analysing", "submit-deep-assessment steps 4 and 7"],
    ["complete", "submit-deep-assessment step 10"],
    ["partial", "submit-deep-assessment step 10 — absent from the old allowlist"],
    [null, "never written today, but a row can predate any writer"],
    ["something_a_caller_invented", "save-deep-progress passes status through"],
  ] as Array<[string | null, string]>)("status %p (%s) reuses the stored snapshot", async (status) => {
    const { client, writes } = makeSupabaseStub({
      deep_assessments: [{ data: { questions: STORED, status } }],
    })
    mockGetSupabase.mockReturnValue(client)

    const res = await callRoute()
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.questions).toEqual(STORED)
    expect(mockMessagesCreate).not.toHaveBeenCalled()
    expect(writes.filter((w) => w.method === "upsert")).toHaveLength(0)
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
    const { client } = makeSupabaseStub({ deep_assessments: [{ data: { questions: stored, status: "partial" } }] })
    mockGetSupabase.mockReturnValue(client)

    const body = await (await callRoute()).json()

    expect(JSON.stringify(body.questions)).toBe(JSON.stringify(stored))
  })

  it("a save-deep-progress-shaped row cannot have its snapshot replaced", async () => {
    // save-deep-progress upserts answers + status without touching `questions`.
    // The customer is mid-questionnaire: replacing the set now would re-bind
    // these answers to different question text, because ids are positional.
    const row = {
      questions: STORED,
      status: null,
      answers: { dq1: "already answered", dq2: "also answered" },
    }
    const { client, writes } = makeSupabaseStub({ deep_assessments: [{ data: row }] })
    mockGetSupabase.mockReturnValue(client)

    const body = await (await callRoute()).json()

    expect(body.questions).toEqual(STORED)
    expect(writes).toHaveLength(0)
    expect(mockMessagesCreate).not.toHaveBeenCalled()
  })

  it("reuse survives a status the allowlist would have rejected AND a second call", async () => {
    const { client, writes } = makeSupabaseStub({
      deep_assessments: [
        { data: { questions: STORED, status: "partial" } },
        { data: { questions: STORED, status: "partial" } },
      ],
    })
    mockGetSupabase.mockReturnValue(client)

    const first = await (await callRoute()).json()
    const second = await (await callRoute()).json()

    expect(first.questions).toEqual(second.questions)
    expect(writes).toHaveLength(0)
  })
})

describe("an unusable stored set takes the regeneration path", () => {
  it.each([
    ["missing", undefined],
    ["null", null],
    ["empty", []],
    ["not an array", { dq1: "x" }],
    ["malformed elements", [{ id: "dq1", text: "no type" }]],
    ["a partly-malformed set", [...FALLBACK_DEEP_QUESTIONS, { id: "dq99" }]],
  ])("regenerates when the stored questions are %s", async (_label, questions) => {
    const { client, writes } = makeSupabaseStub({
      deep_assessments: [{ data: { questions, status: "in_progress" } }, {}],
    })
    mockGetSupabase.mockReturnValue(client)

    const res = await callRoute()
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(mockMessagesCreate).toHaveBeenCalledTimes(1)
    expect(body.questions).toEqual(persistedQuestions(writes))
    expect(body.questions[0].text).toBe("claude question 1")
  })

  it("a failed idempotency read regenerates rather than serving nothing", async () => {
    const client = {
      from: () => ({
        select: () => ({ eq: () => ({ maybeSingle: () => Promise.reject(new Error("timeout")) }) }),
        upsert: () => ({ then: (r: (v: Queued) => void) => r({ error: null }) }),
      }),
    }
    mockGetSupabase.mockReturnValue(client)

    const res = await callRoute()

    expect(res.status).toBe(200)
    expect((await res.json()).questions.length).toBeGreaterThan(0)
  })
})

/* ══ #221 entitlement behaviour is unchanged ════════════════════════════ */

describe("entitlement-derived lens questions are retained", () => {
  it("no add-on yields the core set only", async () => {
    mockRetrieveSession.mockResolvedValue(paidSession(null))
    const { client, writes } = makeSupabaseStub({ deep_assessments: [{ data: null }, {}] })
    mockGetSupabase.mockReturnValue(client)

    const body = await (await callRoute()).json()

    expect(body.questions).toHaveLength(claudeSet("claude").length)
    expect(body.questions.some((q: DeepQuestion) => /lens/i.test(q.id))).toBe(false)
    expect(persistedQuestions(writes)).toEqual(body.questions)
  })

  it.each(ADDON_KEYS)("%s appends exactly its four lens questions", async (addon) => {
    mockRetrieveSession.mockResolvedValue(paidSession(addon))
    const { client, writes } = makeSupabaseStub({ deep_assessments: [{ data: null }, {}] })
    mockGetSupabase.mockReturnValue(client)

    const body = await (await callRoute()).json()
    const expectedLens = addonQuestionsFor(addon, "you")

    expect(expectedLens).toHaveLength(4)
    expect(body.questions).toHaveLength(claudeSet("claude").length + 4)
    // Appended, never interleaved — the core set stays what it was.
    expect(body.questions.slice(0, 3).map((q: DeepQuestion) => q.id)).toEqual(["dq1", "dq2", "dq3"])
    expect(body.questions.slice(3)).toEqual(expectedLens)
    expect(persistedQuestions(writes)).toEqual(body.questions)
  })

  it("family foundation changes lens wording but not the id set", async () => {
    mockRetrieveSession.mockResolvedValue(paidSession("mind", "family"))
    const { client } = makeSupabaseStub({ deep_assessments: [{ data: null }, {}] })
    mockGetSupabase.mockReturnValue(client)

    const body = await (await callRoute()).json()

    expect(body.questions.slice(3)).toEqual(addonQuestionsFor("mind", "family"))
  })

  it("the lens is re-derived from the session, not read from the stored row", async () => {
    // A row storing a Mind lens under a Glucose entitlement must not resurrect
    // the Mind questions — but reuse also must not rewrite the row. Reuse wins
    // here; submit-deep-assessment is where the lens is re-derived (#221), and
    // resolveTrustedQuestions discards stored lens entries outright.
    mockRetrieveSession.mockResolvedValue(paidSession("glucose"))
    const stored = [...claudeSet("stored"), ...addonQuestionsFor("mind", "you")]
    const { client, writes } = makeSupabaseStub({ deep_assessments: [{ data: { questions: stored, status: "in_progress" } }] })
    mockGetSupabase.mockReturnValue(client)

    const body = await (await callRoute()).json()

    expect(body.questions).toEqual(stored)
    expect(writes).toHaveLength(0)
  })
})

/* ══ Residual: concurrent duplicate requests ════════════════════════════ */

describe("concurrent duplicate requests (measured, not fixed)", () => {
  /**
   * Two requests for the same session that both miss the snapshot both call
   * Claude and both upsert. Last write wins, and each caller keeps the array it
   * was handed — so one caller can be answering a set that is no longer the one
   * stored. Because core ids are positional, submit-deep-assessment then binds
   * that caller's answers to the other set's question text.
   *
   * Not closed here: no lock, no RPC, no migration. Reuse-first strictly
   * NARROWS the pre-existing last-write-wins window (the old code regenerated
   * on far more paths); the window that remains is "both requests arrive before
   * either upsert commits", which needs near-simultaneous duplicate loads of
   * one paid session. The one mechanism the current schema would already allow
   * — a conditional update `.is("questions", null)` + `.select()` as a
   * compare-and-set on the existing primary key — is reported in the PR rather
   * than implemented: the row usually already exists (the Stripe webhook
   * creates it at checkout.session.completed), so it needs its own
   * insert-if-missing handling and its own test against that concurrent upsert.
   */
  it("both callers get a persisted set; the stored set matches only one of them", async () => {
    let call = 0
    mockMessagesCreate.mockImplementation(async () => ({
      content: [{ type: "text", text: JSON.stringify({ questions: claudeSet(`gen${++call}`) }) }],
    }))

    const { client, writes } = makeSupabaseStub({
      deep_assessments: [{ data: null }, { data: null }, {}, {}],
    })
    mockGetSupabase.mockReturnValue(client)

    const [a, b] = await Promise.all([callRoute(makeRequest()), callRoute(makeRequest())])
    const [bodyA, bodyB] = [await a.json(), await b.json()]

    // What still holds: nobody got an unpersisted set, and both are usable.
    expect(a.status).toBe(200)
    expect(b.status).toBe(200)
    expect(writes.filter((w) => w.method === "upsert")).toHaveLength(2)
    for (const body of [bodyA, bodyB]) {
      expect(body.questions.length).toBeGreaterThan(0)
    }

    // The residual, stated as an assertion so it cannot quietly change: the two
    // callers hold different sets, and only one of them is what got stored.
    const stored = JSON.stringify(persistedQuestions(writes))
    const held = [JSON.stringify(bodyA.questions), JSON.stringify(bodyB.questions)]
    expect(held[0]).not.toBe(held[1])
    expect(held.filter((h) => h === stored)).toHaveLength(1)
  })

  it("once a snapshot exists, further concurrent requests all agree", async () => {
    const STORED = claudeSet("stored")
    const { client, writes } = makeSupabaseStub({
      deep_assessments: [
        { data: { questions: STORED, status: "partial" } },
        { data: { questions: STORED, status: "partial" } },
        { data: { questions: STORED, status: "partial" } },
      ],
    })
    mockGetSupabase.mockReturnValue(client)

    const results = await Promise.all([callRoute(), callRoute(), callRoute()])
    const bodies = await Promise.all(results.map((r) => r.json()))

    for (const body of bodies) expect(body.questions).toEqual(STORED)
    expect(writes).toHaveLength(0)
    expect(mockMessagesCreate).not.toHaveBeenCalled()
  })
})
