import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"

import { readQuestionSnapshot } from "@/lib/assessment/question-snapshot"
import { encodePaidReportSummary, type PaidReportSummary } from "@/lib/paid-report-session"
import { claimDeterministicConsultation } from "@/lib/consultation/session-claim"
import { readConsultationMode } from "@/lib/consultation/session-mode"
import { readDeterministicConsultationSnapshot } from "@/lib/consultation/session-envelope"
import type { DeepQuestion } from "@/lib/deep-assessment"
import { makeFakeDb, deferred, barrier } from "./helpers/fake-deep-assessments"

/**
 * Two flows, one row — Phase 3C-C2B §11.
 *
 * ══ WHY THIS FILE EXISTS SEPARATELY ═════════════════════════════════════════
 *
 * The claim tests prove the claimer reacts correctly to losing. The generator's
 * own concurrency suite proves the same about the generator. Both can pass while
 * the two DISAGREE — because until now they never raced each other. They store
 * incompatible shapes under the same column, and a customer whose row ends up
 * holding the other flow's value has answers that no longer match the questions
 * they were asked.
 *
 * So both REAL writers run here, against ONE fake table that enforces the two
 * database behaviours the arbitration rests on: `stripe_session_id` UNIQUE
 * (duplicate insert → 23505) and an UPDATE guarded on `questions IS NULL`
 * touching zero rows once anything has landed.
 *
 * ══ THE INVARIANT ══════════════════════════════════════════════════════════
 *
 * However the two are interleaved, and in either order:
 *   · exactly one mode ends up stored,
 *   · both callers agree on WHICH,
 *   · and the loser writes nothing over the winner.
 *
 * "Nobody wins" is also acceptable — a refusal is safe. What is not acceptable
 * is two winners, or a caller that returns a mode the row does not hold.
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
const SESSION_ID = "cs_test_cross_mode"
const SUB_SCORES = { prebiotics: 62, probiotics: 38, postbiotics: 67 }
const PROFILE = { type: "Emerging Balance", tagline: "Building blocks are there.", description: "…" }

const summary: PaidReportSummary = {
  tier: "personal",
  overall: 58,
  subScores: SUB_SCORES,
  profile: PROFILE,
  email: "buyer@example.com",
  foundationType: "you",
  selectedAddon: null,
}

/** The legacy generated set, with the positional ids the prompt specifies. */
const LEGACY_SET: DeepQuestion[] = [1, 2, 3].map(
  (n) =>
    ({
      id: `dq${n}`,
      type: "single",
      pillar: "prebiotics",
      section: "symptoms",
      text: `Legacy question ${n}`,
      options: [{ label: "opt", value: `v${n}` }],
      required: true,
    }) as DeepQuestion,
)

function generatorRequest(): NextRequest {
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

/** The REAL legacy generator. */
async function runGenerator() {
  const { POST } = await import("@/app/api/generate-deep-questions/route")
  return POST(generatorRequest())
}

/** The REAL deterministic claimer. */
const runClaimer = (client: unknown, now?: Date) =>
  claimDeterministicConsultation({
    supabase: client as never,
    sessionId: SESSION_ID,
    summary,
    now,
  })

/**
 * What the row actually ended up holding, by the shared classifier.
 *
 * Deliberately the same reader the page, the claimer and the legacy boundary
 * use: asking a different question here would let this file pass while the
 * product disagreed about the same bytes.
 */
const storedMode = (db: ReturnType<typeof makeFakeDb>) =>
  readConsultationMode(db.only()?.questions).kind

beforeEach(() => {
  vi.clearAllMocks()
  vi.unstubAllEnvs()
  vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_123")
  vi.stubEnv("ANTHROPIC_API_KEY", "sk-ant-test")
  vi.spyOn(console, "error").mockImplementation(() => {})
  mockRetrieveSession.mockResolvedValue({
    payment_status: "paid",
    metadata: { result_summary: encodePaidReportSummary(summary) },
  })
  mockMessagesCreate.mockResolvedValue({
    content: [{ type: "text", text: JSON.stringify({ questions: LEGACY_SET }) }],
  })
})

/* ══ Sequential: whoever is second concedes ════════════════════════════════ */

describe("the second writer concedes, in both orders", () => {
  it("generator first, then claimer → the row stays legacy", async () => {
    const db = makeFakeDb()
    mockGetSupabase.mockReturnValue(db.client)

    const generated = await runGenerator()
    expect(generated.status).toBe(200)
    expect(storedMode(db)).toBe("legacy")

    const claim = await runClaimer(db.client)
    expect(claim, "the claimer must report legacy, not claim it").toEqual({ status: "legacy" })
    expect(storedMode(db), "and must not have converted the row").toBe("legacy")
    expect(readQuestionSnapshot(db.only()?.questions)).toHaveLength(LEGACY_SET.length)
  })

  it("claimer first, then generator → the generator refuses rather than overwriting", async () => {
    const db = makeFakeDb()
    mockGetSupabase.mockReturnValue(db.client)

    const claim = await runClaimer(db.client)
    expect(claim).toMatchObject({ status: "deterministic", claimed: true })
    expect(storedMode(db)).toBe("deterministic")

    const generated = await runGenerator()
    // The generator cannot render a snapshot and cannot safely replace a value
    // it does not recognise, so it refuses. A 200 here would mean it had
    // overwritten a live Consultation.
    expect(generated.status).not.toBe(200)
    expect(storedMode(db), "the Consultation survived").toBe("deterministic")
  })
})

/* ══ Concurrent: both read an empty row ════════════════════════════════════ */

describe("both writers read nothing and then both try to install", () => {
  /**
   * Park the generator inside the Claude call — which it only reaches after its
   * snapshot read — and hold the claimer's first write behind the same gate.
   * That makes "both observed an empty row" a guarantee rather than a hope.
   */
  function gatedGenerator() {
    const entered = barrier(1)
    const gate = deferred()
    mockMessagesCreate.mockImplementation(async () => {
      entered.arrive()
      await gate.promise
      return { content: [{ type: "text", text: JSON.stringify({ questions: LEGACY_SET }) }] }
    })
    return { release: gate.resolve, insideClaude: entered.reached }
  }

  it("the claimer installs while the generator is generating → generator concedes", async () => {
    const db = makeFakeDb()
    mockGetSupabase.mockReturnValue(db.client)
    const { release, insideClaude } = gatedGenerator()

    const generating = runGenerator()
    await insideClaude
    // The claimer runs to completion in the window the generator left open.
    const claim = await runClaimer(db.client)
    expect(claim).toMatchObject({ status: "deterministic", claimed: true })

    release()
    const generated = await generating

    expect(generated.status).not.toBe(200)
    expect(storedMode(db), "exactly one mode is stored").toBe("deterministic")
    expect(db.rows.size, "and exactly one row exists").toBe(1)
  })

  it("two claimers converge on ONE snapshot, with one shared createdAt", async () => {
    // The second must not install a second snapshot. A moved `createdAt` would
    // silently restart the record a customer is already answering against.
    const db = makeFakeDb()
    mockGetSupabase.mockReturnValue(db.client)

    const first = await runClaimer(db.client, new Date("2026-09-01T00:00:00.000Z"))
    const second = await runClaimer(db.client, new Date("2026-09-02T00:00:00.000Z"))

    expect(first).toMatchObject({ status: "deterministic", claimed: true })
    expect(second, "the second call must reuse, not re-claim").toMatchObject({
      status: "deterministic",
      claimed: false,
    })
    if (first.status === "deterministic" && second.status === "deterministic") {
      expect(second.snapshot.createdAt).toBe(first.snapshot.createdAt)
    }
    expect(readDeterministicConsultationSnapshot(db.only()?.questions)?.createdAt).toBe(
      first.status === "deterministic" ? first.snapshot.createdAt : null,
    )
  })

  it("a claimer losing the UPDATE race hands the row to the generator's set", async () => {
    // The decisive interleaving: the claimer reads an empty row, the generator
    // installs, and the claimer's guarded UPDATE then matches nothing. It must
    // re-read and concede — never widen its guard and win.
    const db = makeFakeDb(
      { stripe_session_id: SESSION_ID, tier: "personal", questions: null, updated_at: null },
      {
        // Fires between the claimer's read and its install.
        beforeUpdate: async ({ seq }) => {
          if (seq === 1) await runGenerator()
        },
      },
    )
    mockGetSupabase.mockReturnValue(db.client)

    const claim = await runClaimer(db.client)

    expect(claim).toEqual({ status: "legacy" })
    expect(storedMode(db)).toBe("legacy")
    expect(readQuestionSnapshot(db.only()?.questions)).toHaveLength(LEGACY_SET.length)
  })
})

/* ══ The webhook ═══════════════════════════════════════════════════════════ */

describe("the Stripe webhook's row is joined, never fought over", () => {
  it("a webhook row created before the claim is claimed in place", async () => {
    // The ordinary production ordering. The webhook owns `tier`/`free_scores`;
    // the claimer adds the snapshot and must not disturb what it did not write.
    const db = makeFakeDb({
      stripe_session_id: SESSION_ID,
      tier: "personal",
      free_scores: { overall: 58, subScores: SUB_SCORES, profile: PROFILE },
      email: "buyer@example.com",
      questions: null,
      answers: null,
      report_json: null,
      updated_at: null,
    })
    mockGetSupabase.mockReturnValue(db.client)

    const claim = await runClaimer(db.client)
    expect(claim).toMatchObject({ status: "deterministic", claimed: true })
    expect(db.rows.size, "no second row was created").toBe(1)
    expect(db.only()?.free_scores, "the webhook's columns are untouched").toEqual({
      overall: 58,
      subScores: SUB_SCORES,
      profile: PROFILE,
    })
  })

  it("a claimer that creates the row first describes the purchase identically", async () => {
    // Whichever writer wins, the row has to say the same thing about what was
    // bought — which is why both project these two columns through the same
    // helper rather than each building its own.
    const claimed = makeFakeDb()
    mockGetSupabase.mockReturnValue(claimed.client)
    await runClaimer(claimed.client)

    const generated = makeFakeDb()
    mockGetSupabase.mockReturnValue(generated.client)
    await runGenerator()

    expect(claimed.only()?.tier).toBe(generated.only()?.tier)
    expect(claimed.only()?.free_scores).toEqual(generated.only()?.free_scores)
  })
})
