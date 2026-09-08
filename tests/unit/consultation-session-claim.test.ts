import { describe, it, expect, vi, beforeEach } from "vitest"

import { claimDeterministicConsultation } from "@/lib/consultation/session-claim"
import {
  createDeterministicConsultationSnapshot,
  DETERMINISTIC_STATE_KIND,
  EMPTY_DETERMINISTIC_STATE,
} from "@/lib/consultation/session-envelope"
import type { PaidReportSummary } from "@/lib/paid-report-session"

/**
 * Claiming a paid row for the deterministic Consultation — Phase 3C-C2B.
 *
 * ══ WHAT A "CLAIM" HAS TO SURVIVE ═══════════════════════════════════════════
 *
 * Two flows write `deep_assessments.questions`, they store incompatible shapes
 * under it, and either can arrive first: the legacy generator
 * (`generate-deep-questions`), the Stripe webhook creating the row, and now
 * this. A customer's session is destroyed if a claim ever lands on top of the
 * other flow's work — their stored answers stop matching the questions they
 * were asked, and there is no way back.
 *
 * So the property under test is not "the claim succeeds". It is that the claim
 * only ever lands on a row that is genuinely empty, that it accepts defeat
 * whenever it does not, and that a repeat call is a no-op rather than a second
 * snapshot.
 *
 * ══ WHY A STUB AND NOT A DATABASE ═══════════════════════════════════════════
 *
 * The races here are decided by two things PostgREST reports back: the row count
 * a conditional UPDATE touched, and error code 23505 from the UNIQUE constraint
 * on `stripe_session_id`. Both are modelled exactly. The constraint itself is
 * proven against real PostgreSQL in the Migration 48 suite; what needs proving
 * here is how this module REACTS to losing.
 */

/* ── Chainable stub: records writes, replays a queued result per call ────── */
type Queued = { data?: unknown; error?: unknown; throws?: string }

function makeStub(queue: Queued[]) {
  const writes: { method: string; payload: Record<string, unknown> }[] = []
  const filters: Record<string, unknown>[] = []
  const from = () => {
    const chain: Record<string, unknown> = {}
    const current: Record<string, unknown> = {}
    filters.push(current)
    chain.select = () => chain
    chain.eq = (col: string, value: unknown) => {
      current[`eq:${col}`] = value
      return chain
    }
    chain.is = (col: string, value: unknown) => {
      current[`is:${col}`] = value
      return chain
    }
    for (const m of ["insert", "update", "upsert"]) {
      chain[m] = (payload: Record<string, unknown>) => {
        writes.push({ method: m, payload })
        return chain
      }
    }
    const settle = () => {
      const q = queue.shift() ?? { data: null, error: null }
      return q.throws ? Promise.reject(new Error(q.throws)) : Promise.resolve(q)
    }
    chain.maybeSingle = settle
    chain.single = settle
    chain.then = (resolve: (v: Queued) => void, reject?: (e: unknown) => void) =>
      settle().then(resolve, reject)
    return chain
  }
  return { client: { from }, writes, filters }
}

/* ── Fixtures ───────────────────────────────────────────────────────────── */
const SESSION_ID = "cs_test_claim"
const OBSERVED = "2026-09-01T10:00:00.000Z"

const summary: PaidReportSummary = {
  tier: "personal",
  overall: 61,
  subScores: { diversity: 3 },
  profile: { type: "explorer", tagline: "t", description: "d" },
  email: "buyer@example.com",
  foundationType: "you",
  selectedAddon: null,
}

const snapshot = (over: Record<string, unknown> = {}) => ({
  ...createDeterministicConsultationSnapshot({ foundation: "you", entitledLens: null }),
  ...over,
})

/** A stored legacy question set: the shape the live product writes today. */
const LEGACY = [{ id: "dq1", text: "How is your digestion?", type: "scale" }]

const found = (questions: unknown, over: Record<string, unknown> = {}): Queued => ({
  data: { questions, answers: null, report_json: null, updated_at: OBSERVED, ...over },
})
const noRow: Queued = { data: null }
/** A conditional UPDATE that proved, through `.select()`, that it touched a row. */
const CLAIM_LANDED: Queued = { data: [{ stripe_session_id: SESSION_ID }] }
/** …and one that matched nothing: somebody else claimed first. */
const CLAIM_LOST: Queued = { data: [] }
const INSERT_OK: Queued = { error: null }
const INSERT_CONFLICT: Queued = { error: { code: "23505", message: "duplicate key" } }

const claim = (queue: Queued[], stub = makeStub(queue)) => ({
  stub,
  run: () =>
    claimDeterministicConsultation({
      supabase: stub.client as never,
      sessionId: SESSION_ID,
      summary,
    }),
})

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {})
})

/* ══ The row is already owned ══════════════════════════════════════════════ */

describe("a row another flow owns is reported, never rewritten", () => {
  it("a stored legacy array returns legacy and writes nothing", async () => {
    const { stub, run } = claim([found(LEGACY)])
    await expect(run()).resolves.toEqual({ status: "legacy" })
    expect(stub.writes, "a legacy session must not be touched").toEqual([])
  })

  it("a stored snapshot is reused, not re-installed", async () => {
    // Idempotence is what makes a refresh safe. A second snapshot would move a
    // customer's `createdAt` and could change the bank they are questioned
    // against half way through.
    const stored = snapshot()
    const { stub, run } = claim([found(stored)])
    const result = await run()

    expect(result).toMatchObject({ status: "deterministic", claimed: false })
    if (result.status === "deterministic") expect(result.snapshot.createdAt).toBe(stored.createdAt)
    expect(stub.writes).toEqual([])
  })

  it("an unreadable non-null value refuses rather than guessing", async () => {
    // Neither parser accepts it, so no writer in this repository produced it.
    // Overwriting it would be overwriting something we cannot describe.
    const { stub, run } = claim([found({ some: "other shape" })])
    await expect(run()).resolves.toEqual({ status: "refused", reason: "unreadable" })
    expect(stub.writes).toEqual([])
  })

  it("a snapshot whose foundation disagrees with Stripe refuses", async () => {
    // Stripe is the authority. Adopting the stored value would let a tampered
    // or stale row decide which questions a paid customer is asked.
    const { stub, run } = claim([found(snapshot({ foundation: "family" }))])
    await expect(run()).resolves.toEqual({ status: "refused", reason: "context-conflict" })
    expect(stub.writes).toEqual([])
  })

  it("a snapshot whose entitled lens disagrees with Stripe refuses", async () => {
    const { stub, run } = claim([found(snapshot({ entitledLens: "glucose" }))])
    await expect(run()).resolves.toEqual({ status: "refused", reason: "context-conflict" })
    expect(stub.writes).toEqual([])
  })

  it("a snapshot naming a bank this build does not hold refuses", async () => {
    // A deployment problem, not a customer problem — and answering questions
    // from a bank we cannot resolve is not a recovery.
    const { stub, run } = claim([found(snapshot({ bankVersion: "consultation-v99" }))])
    await expect(run()).resolves.toEqual({ status: "refused", reason: "bank-unavailable" })
    expect(stub.writes).toEqual([])
  })
})

/* ══ Occupancy ═════════════════════════════════════════════════════════════ */

describe("an empty question column is not the same as an empty row", () => {
  it("a row carrying answers is refused as occupied", async () => {
    // Some other path has already started work here. A snapshot on top of it
    // would claim their answers as answers to our questions.
    const { stub, run } = claim([found(null, { answers: { q1: "already answered" } })])
    await expect(run()).resolves.toEqual({ status: "refused", reason: "occupied" })
    expect(stub.writes).toEqual([])
  })

  it("a historical row carrying a Report is refused as occupied", async () => {
    // Legitimately has no persisted question set — the legacy flow stored the
    // questions in the request, not the row. It is finished work, not an opening.
    const { stub, run } = claim([found(null, { report_json: { summary: "a finished report" } })])
    await expect(run()).resolves.toEqual({ status: "refused", reason: "occupied" })
    expect(stub.writes).toEqual([])
  })
})

/* ══ The claim itself ══════════════════════════════════════════════════════ */

describe("claiming a genuinely empty row", () => {
  it("installs the snapshot and an EMPTY state, guarded on questions IS NULL", async () => {
    const { stub, run } = claim([found(null), CLAIM_LANDED])
    const result = await run()

    expect(result).toMatchObject({ status: "deterministic", claimed: true })
    expect(stub.writes).toHaveLength(1)
    const payload = stub.writes[0].payload
    expect(stub.writes[0].method).toBe("update")
    expect(payload.answers).toEqual(EMPTY_DETERMINISTIC_STATE)
    expect((payload.answers as { kind: string }).kind).toBe(DETERMINISTIC_STATE_KIND)
    // The CAS token moves, so a concurrent writer holding the old one loses.
    expect(payload.updated_at).not.toBe(OBSERVED)

    // The two conditions that make this atomic rather than merely ordered.
    const update = stub.filters[stub.filters.length - 1]
    expect(update["is:questions"], "the claim must require an unclaimed row").toBe(null)
    expect(update["eq:updated_at"], "the claim must be guarded on the observed token").toBe(OBSERVED)
    expect(update["eq:stripe_session_id"]).toBe(SESSION_ID)
  })

  it("a lost UPDATE race re-reads and accepts the legacy winner", async () => {
    // Zero rows touched means somebody claimed between the read and the write.
    // The answer is to find out who won — never to widen the condition and win.
    const { stub, run } = claim([found(null), CLAIM_LOST, found(LEGACY)])
    await expect(run()).resolves.toEqual({ status: "legacy" })
    expect(stub.writes, "exactly one claim was attempted, and it did not land").toHaveLength(1)
  })

  it("a lost UPDATE race re-reads and reuses a deterministic winner", async () => {
    const winner = snapshot()
    const { run } = claim([found(null), CLAIM_LOST, found(winner)])
    const result = await run()
    expect(result).toMatchObject({ status: "deterministic", claimed: false })
    if (result.status === "deterministic") expect(result.snapshot.createdAt).toBe(winner.createdAt)
  })
})

/* ══ No row yet ════════════════════════════════════════════════════════════ */

describe("the customer can arrive before the Stripe webhook creates the row", () => {
  it("inserts the row with the paid fields taken from the settled summary", async () => {
    const { stub, run } = claim([noRow, INSERT_OK])
    const result = await run()

    expect(result).toMatchObject({ status: "deterministic", claimed: true })
    expect(stub.writes).toHaveLength(1)
    const payload = stub.writes[0].payload
    expect(stub.writes[0].method).toBe("insert")
    // `tier` and `free_scores` are NOT NULL with no default. They come from the
    // shared helper so this row says exactly what the legacy generator's row
    // would say about what was bought.
    expect(payload.tier).toBe("personal")
    expect(payload.free_scores).toMatchObject({ overall: 61, foundationType: "you" })
    expect(payload.answers).toEqual(EMPTY_DETERMINISTIC_STATE)
  })

  it("a 23505 on insert is a lost race, re-read and conceded", async () => {
    // `stripe_session_id` is UNIQUE, so the constraint IS the arbitration.
    const { stub, run } = claim([noRow, INSERT_CONFLICT, found(LEGACY)])
    await expect(run()).resolves.toEqual({ status: "legacy" })
    expect(stub.writes, "the loser must not retry the insert").toHaveLength(1)
  })

  it("any other insert error refuses instead of retrying blind", async () => {
    const { run } = claim([noRow, { error: { code: "42501", message: "denied" } }])
    await expect(run()).resolves.toEqual({ status: "refused", reason: "unavailable" })
  })
})

/* ══ Failure ═══════════════════════════════════════════════════════════════ */

describe("failure refuses; it never falls back", () => {
  it("a read error refuses", async () => {
    const { stub, run } = claim([{ error: { message: "connection reset" } }])
    await expect(run()).resolves.toEqual({ status: "refused", reason: "unavailable" })
    expect(stub.writes).toEqual([])
  })

  it("a thrown transport error refuses", async () => {
    // An awaited PostgREST call resolves with `{ error }`, but the socket
    // underneath can still throw. Both paths have to end in the same refusal.
    const { run } = claim([{ throws: "socket hang up" }])
    await expect(run()).resolves.toEqual({ status: "refused", reason: "unavailable" })
  })

  it("a race that never converges refuses rather than looping", async () => {
    // Bounded at three attempts. An unbounded retry against a row that keeps
    // changing is a request that never returns, holding a paid customer at a
    // blank screen.
    const { stub, run } = claim([
      found(null), CLAIM_LOST,
      found(null), CLAIM_LOST,
      found(null), CLAIM_LOST,
    ])
    await expect(run()).resolves.toEqual({ status: "refused", reason: "unavailable" })
    expect(stub.writes).toHaveLength(3)
  })
})
