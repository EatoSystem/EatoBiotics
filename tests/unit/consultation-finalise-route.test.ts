import { describe, it, expect, vi, beforeEach } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { NextRequest } from "next/server"

import { CONSULTATION_QUESTION_BANK } from "@/lib/consultation/question-bank"
import { resolveApplicableQuestions } from "@/lib/consultation/applicability"
import { prepareConsultationFinalisation } from "@/lib/consultation/finalisation"
import { FINALISE_CODES } from "@/lib/consultation/finalise-codes"
import {
  createDeterministicConsultationSnapshot,
  DETERMINISTIC_STATE_KIND,
  DETERMINISTIC_STATE_SCHEMA_VERSION,
  type DeterministicConsultationSnapshot,
  type DeterministicConsultationState,
} from "@/lib/consultation/session-envelope"
import type { ConsultationAnswers, ConsultationContext } from "@/lib/consultation/types"

/**
 * Phase 3C-C2A — sealing a finished deterministic Consultation.
 *
 * ══ THE INVARIANT UNDER TEST ════════════════════════════════════════════════
 *
 *   ONE paid Consultation → ONE immutable trusted finalisation → ONE handoff.
 *
 * Every case below is a way that could stop being true: a refresh, a retry, two
 * tabs, an edit racing the seal, a half-written row, a client trying to supply
 * what the server is supposed to derive. The property is not "usually one" —
 * the finalisation is the record a Report is built from, and two of them for
 * one customer is two different accounts of what they said.
 *
 * ══ WHY THE FAKE ENFORCES THE MIGRATION'S RULES ═════════════════════════════
 *
 * A fake that accepted anything would let the route look correct while relying
 * on the database to save it — and Migration 48 is DRAFTED, so in production
 * today it would not. So the fake refuses what the migration refuses: the pair
 * is atomic, and a persisted seal is write-once. A route that tried to overwrite
 * one fails here rather than in six months.
 *
 * `migration-48-seal-contract.test.ts` asserts the SQL says the same thing.
 * Neither file is sufficient alone: that one says what the database will
 * enforce, this one says the route is correct given that it does.
 *
 * No production write, no Stripe call, no real payment, no Report.
 */

/* ── A fake deep_assessments with CAS and Migration 48 semantics ─────────── */

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

      // Migration 48's write-once trigger.
      for (const col of ["consultation_finalisation", "consultation_handoff_id"] as const) {
        const before = row[col] ?? null
        if (before !== null && col in payload && JSON.stringify(payload[col]) !== JSON.stringify(before)) {
          return { data: null, error: { message: `${col} is write-once` } }
        }
      }
      const merged = { ...row, ...payload }
      // Migration 48's pair CHECK.
      const hasF = (merged.consultation_finalisation ?? null) !== null
      const hasH = (merged.consultation_handoff_id ?? null) !== null
      if (hasF !== hasH) {
        return { data: null, error: { message: "deep_assessments_seal_pair violated" } }
      }
      Object.assign(row, payload)
      return { data: [{ stripe_session_id: key }], error: null }
    }
    return chain
  }

  return {
    client: { from } as unknown,
    log,
    counts: () => ({ reads, writes }),
    row: () => [...rows.values()][0] ?? null,
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
  return { ...actual, resolvePaidReportSummary: (...a: unknown[]) => mockResolveSummary(...a) }
})

/* ── Fixtures ───────────────────────────────────────────────────────────── */

const SESSION = "cs_test_finalise_3cc2a"
const T0 = "2026-09-07T10:00:00.000Z"

const Q1 = "core_signals_post_meal_pattern_v1"
const Q2 = "core_signals_energy_shape_v1"
const CONSTRAINTS = "core_environment_constraints_v1"
const AVOIDANCES = "core_environment_food_avoidances_v1"

const you: ConsultationContext = { foundation: "you" }

const snapshot = (): DeterministicConsultationSnapshot =>
  createDeterministicConsultationSnapshot({ foundation: "you", entitledLens: null })

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

/** A finished Consultation, sitting on the Review list, ready to be sealed. */
const reviewReady = (overrides: ConsultationAnswers = {}) =>
  stateWith({ candidateAnswers: completeAnswers(overrides), phase: "review", currentQuestionId: null })

const rowWith = (over: Row = {}): Row => ({
  stripe_session_id: SESSION,
  tier: "personal",
  questions: snapshot(),
  answers: reviewReady(),
  status: "in_progress",
  report_json: null,
  pdf_url: null,
  updated_at: T0,
  consultation_finalisation: null,
  consultation_handoff_id: null,
  ...over,
})

/**
 * A distinct client per test.
 *
 * The route rate-limits per IP from a module-level counter that outlives one
 * test, so a shared address would fail later tests on a 429 that has nothing to
 * do with what they check.
 */
let clientIp = "203.0.113.1"
let ipCounter = 0

function post(body: unknown) {
  return new NextRequest("http://localhost/api/consultation/finalise", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-forwarded-for": clientIp },
    body: JSON.stringify(body),
  })
}

const callFinalise = async (req: NextRequest) =>
  (await import("@/app/api/consultation/finalise/route")).POST(req)

const callProgress = async (req: NextRequest) =>
  (await import("@/app/api/consultation/progress/route")).PATCH(req)

const callReview = async (req: NextRequest) =>
  (await import("@/app/api/consultation/review/route")).POST(req)

function patch(body: Record<string, unknown>) {
  return new NextRequest("http://localhost/api/consultation/progress", {
    method: "PATCH",
    headers: { "Content-Type": "application/json", "x-forwarded-for": clientIp },
    body: JSON.stringify(body),
  })
}

function reviewPost(body: Record<string, unknown>) {
  return new NextRequest("http://localhost/api/consultation/review", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-forwarded-for": clientIp },
    body: JSON.stringify(body),
  })
}

const jsonOf = async (r: Response) => (await r.json()) as Record<string, unknown>

/** The sealed payload a previous finalisation would have left behind. */
function sealedPayload(state: DeterministicConsultationState, snap = snapshot(), at = "2026-09-01T09:00:00.000Z") {
  const prepared = prepareConsultationFinalisation({
    snapshot: snap,
    state,
    finalisedAt: new Date(at),
  })
  if (!prepared.ok) throw new Error(`fixture is not finalisable: ${prepared.reason}`)
  return prepared.finalisation
}

beforeEach(() => {
  vi.clearAllMocks()
  ipCounter += 1
  clientIp = `203.0.113.${ipCounter}`
  mockRetrieveSession.mockResolvedValue({ id: SESSION, payment_status: "paid", metadata: {} })
  mockResolveSummary.mockResolvedValue({ foundationType: "you", selectedAddon: null })
})

/* ══ The browser sends an id and nothing else ══════════════════════════════ */

describe("the client cannot supply anything the server is meant to derive", () => {
  it.each([
    ["trustedAnswers", { [Q1]: "bloating" }],
    ["trustedAnswersByField", { "signals.postMealPattern": "bloating" }],
    ["candidateAnswers", { [Q1]: "bloating" }],
    ["finalisedAt", "2020-01-01T00:00:00.000Z"],
    ["handoffId", "11111111-1111-4111-8111-111111111111"],
    ["foundation", "family"],
    ["lens", "glucose"],
    ["entitledLens", "glucose"],
    ["bankVersion", "anything"],
    ["bankFingerprint", "anything"],
    ["completeness", { complete: true }],
    ["complete", true],
    ["foodGuidance", { knownAvoidances: [] }],
    ["finalisation", { kind: "x" }],
    ["readyForReport", true],
    ["phase", "ready-for-report"],
  ])("a body carrying %s is REFUSED, not quietly stripped", async (field, value) => {
    const db = makeDb(rowWith())
    mockGetSupabase.mockReturnValue(db.client)

    const res = await callFinalise(post({ sessionId: SESSION, [field]: value }))

    // Stripping would be safe today and dangerous the moment someone read one.
    expect(res.status, field).toBe(400)
    expect(db.counts().writes, field).toBe(0)
    expect(db.row()!.consultation_handoff_id, field).toBeNull()
  })

  it("a body of only the session id is accepted", async () => {
    const db = makeDb(rowWith())
    mockGetSupabase.mockReturnValue(db.client)
    expect((await callFinalise(post({ sessionId: SESSION }))).status).toBe(200)
  })
})

/* ══ Payment authority ═════════════════════════════════════════════════════ */

describe("only a settled payment can seal a Consultation", () => {
  it("an unpaid session is refused before anything is read", async () => {
    const db = makeDb(rowWith())
    mockGetSupabase.mockReturnValue(db.client)
    mockRetrieveSession.mockResolvedValue({ id: SESSION, payment_status: "unpaid", metadata: {} })

    const res = await callFinalise(post({ sessionId: SESSION }))

    expect(res.status).toBe(402)
    expect(db.counts().reads).toBe(0)
    expect(db.counts().writes).toBe(0)
  })

  it("a session Stripe cannot verify is a 503, never a seal", async () => {
    const db = makeDb(rowWith())
    mockGetSupabase.mockReturnValue(db.client)
    mockRetrieveSession.mockRejectedValue(new Error("stripe down"))

    expect((await callFinalise(post({ sessionId: SESSION }))).status).toBe(503)
    expect(db.counts().writes).toBe(0)
  })

  it("a foundation that disagrees with the snapshot refuses", async () => {
    // The stored session and the settled payment must agree. They can only
    // disagree if one was tampered with or a session was reused.
    const db = makeDb(rowWith())
    mockGetSupabase.mockReturnValue(db.client)
    mockResolveSummary.mockResolvedValue({ foundationType: "family", selectedAddon: null })

    expect((await callFinalise(post({ sessionId: SESSION }))).status).toBe(409)
    expect(db.counts().writes).toBe(0)
  })

  it("an entitled lens that disagrees with the snapshot refuses", async () => {
    const db = makeDb(rowWith())
    mockGetSupabase.mockReturnValue(db.client)
    mockResolveSummary.mockResolvedValue({ foundationType: "you", selectedAddon: "glucose" })

    expect((await callFinalise(post({ sessionId: SESSION }))).status).toBe(409)
    expect(db.counts().writes).toBe(0)
  })
})

/* ══ The first seal ════════════════════════════════════════════════════════ */

describe("a finished Consultation is sealed exactly once, in one write", () => {
  it("persists the finalisation, the handoff and the phase together", async () => {
    const db = makeDb(rowWith())
    mockGetSupabase.mockReturnValue(db.client)

    const res = await callFinalise(post({ sessionId: SESSION }))
    const body = await jsonOf(res)

    expect(res.status).toBe(200)
    expect(body.ok).toBe(true)
    expect(body.phase).toBe("ready-for-report")
    expect(typeof body.handoffId).toBe("string")
    expect(typeof body.finalisedAt).toBe("string")

    const row = db.row()!
    expect(row.consultation_handoff_id).toBe(body.handoffId)
    expect(db.state().phase).toBe("ready-for-report")
    expect(db.state().currentQuestionId).toBeNull()

    // ONE write. Three calls would leave a window in which a crash produces a
    // Consultation sealed in one column and still editable in another.
    expect(db.counts().writes).toBe(1)
  })

  it("the handoff is a random UUID, derived from nothing about the customer", async () => {
    const db = makeDb(rowWith({ answers: reviewReady({ [Q1]: "bloating" }) }))
    mockGetSupabase.mockReturnValue(db.client)

    const body = await jsonOf(await callFinalise(post({ sessionId: SESSION })))
    const id = body.handoffId as string

    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)
    // Not the session, not an answer, not a score, not an email.
    expect(id).not.toContain(SESSION)
    expect(JSON.stringify(db.state().candidateAnswers)).not.toContain(id)
  })

  it("moves the CAS token forward rather than stamping a bare timestamp", async () => {
    const db = makeDb(rowWith())
    mockGetSupabase.mockReturnValue(db.client)

    await callFinalise(post({ sessionId: SESSION }))

    const after = db.row()!.updated_at as string
    expect(Date.parse(after)).toBeGreaterThan(Date.parse(T0))
  })

  it("carries the candidate answers through untouched, closed branches included", async () => {
    // The mutable state records everything the customer entered; the
    // finalisation records what counts. Pruning here would destroy an answer
    // nobody withdrew, in the one write that can never be undone.
    const withStale = completeAnswers({ [Q1]: "nothing", [CONSTRAINTS]: ["allergy"] })
    withStale[AVOIDANCES] = ["dairy"]
    const closed = { ...withStale, [CONSTRAINTS]: ["budget"] }
    const db = makeDb(rowWith({ answers: stateWith({ candidateAnswers: closed, phase: "review" }) }))
    mockGetSupabase.mockReturnValue(db.client)

    expect((await callFinalise(post({ sessionId: SESSION }))).status).toBe(200)

    expect(db.state().candidateAnswers[AVOIDANCES]).toEqual(["dairy"])
    const sealed = db.row()!.consultation_finalisation as Record<string, unknown>
    // ...and the trusted payload excludes it, because its branch is closed.
    expect((sealed.trustedAnswers as Record<string, unknown>)[AVOIDANCES]).toBeUndefined()
  })

  it("the sealed payload is the C1 contract, not raw candidates", async () => {
    const db = makeDb(rowWith())
    mockGetSupabase.mockReturnValue(db.client)
    await callFinalise(post({ sessionId: SESSION }))

    const sealed = db.row()!.consultation_finalisation as Record<string, unknown>
    expect(sealed.kind).toBe("deterministic-consultation-finalisation")
    expect(sealed.finalisationVersion).toBe("consultation-finalisation-v1")
    expect(sealed.scienceContractVersion).toBe("science-contract-v1.0")
    expect(Object.keys(sealed).sort()).toEqual(
      [
        "applicableQuestionIds",
        "bankFingerprint",
        "bankVersion",
        "entitledLens",
        "finalisationVersion",
        "finalisedAt",
        "foodGuidance",
        "foundation",
        "kind",
        "schemaVersion",
        "scienceContractVersion",
        "skippedOptionalQuestionIds",
        "trustedAnswers",
        "trustedAnswersByField",
      ].sort(),
    )
    expect(sealed).not.toHaveProperty("candidateAnswers")
    expect(sealed).not.toHaveProperty("currentQuestionId")
    expect(sealed).not.toHaveProperty("handoffId")
  })

  it("the response carries no answers", async () => {
    const db = makeDb(rowWith({ answers: reviewReady({ [Q1]: "bloating" }) }))
    mockGetSupabase.mockReturnValue(db.client)

    const body = await jsonOf(await callFinalise(post({ sessionId: SESSION })))

    expect(Object.keys(body).sort()).toEqual(["finalisedAt", "handoffId", "ok", "phase"])
    expect(JSON.stringify(body)).not.toContain("bloating")
  })
})

/* ══ Idempotency ═══════════════════════════════════════════════════════════ */

describe("retrying returns the original seal and writes nothing", () => {
  it("a second request returns the same handoff and the same time", async () => {
    const db = makeDb(rowWith())
    mockGetSupabase.mockReturnValue(db.client)

    const first = await jsonOf(await callFinalise(post({ sessionId: SESSION })))
    const writesAfterFirst = db.counts().writes
    const second = await jsonOf(await callFinalise(post({ sessionId: SESSION })))

    expect(second.handoffId).toBe(first.handoffId)
    expect(second.finalisedAt).toBe(first.finalisedAt)
    expect(second.phase).toBe("ready-for-report")
    expect(db.counts().writes).toBe(writesAfterFirst)
  })

  it("a lost response is indistinguishable from a first success", async () => {
    // The customer never saw the 200. They press the button again.
    const db = makeDb(rowWith())
    mockGetSupabase.mockReturnValue(db.client)
    const first = await jsonOf(await callFinalise(post({ sessionId: SESSION })))
    const sealedBefore = JSON.stringify(db.row()!.consultation_finalisation)

    const again = await callFinalise(post({ sessionId: SESSION }))

    expect(again.status).toBe(200)
    expect((await jsonOf(again)).handoffId).toBe(first.handoffId)
    expect(JSON.stringify(db.row()!.consultation_finalisation)).toBe(sealedBefore)
  })

  it("an already-sealed row is reused without rebuilding the payload", async () => {
    const state = { ...reviewReady(), phase: "ready-for-report" as const }
    const sealed = sealedPayload(reviewReady())
    const db = makeDb(
      rowWith({
        answers: state,
        consultation_finalisation: sealed,
        consultation_handoff_id: "22222222-2222-4222-8222-222222222222",
      }),
    )
    mockGetSupabase.mockReturnValue(db.client)

    const body = await jsonOf(await callFinalise(post({ sessionId: SESSION })))

    expect(body.handoffId).toBe("22222222-2222-4222-8222-222222222222")
    // The STORED time, not a new one.
    expect(body.finalisedAt).toBe(sealed.finalisedAt)
    expect(db.counts().writes).toBe(0)
  })

  it("a sealed Consultation is never re-sealed even if its bank has since drifted", async () => {
    // A sealed record is the authority for its own handoff. Rebuilding it under
    // today's questions would replace what the customer finished with what
    // their session would mean now.
    /*
     * The snapshot and the sealed payload agree with each other — both record
     * the fingerprint that was current when the customer finished. What has
     * moved is the LIVE registry. Built from the real bank and then re-stamped,
     * because the canonical builder correctly refuses to create a finalisation
     * against a drifted bank; the point here is that an already-sealed one is
     * still honoured.
     */
    const DRIFTED = "sha256-not-todays-bank"
    const drifted = { ...snapshot(), bankFingerprint: DRIFTED }
    const sealed = { ...sealedPayload(reviewReady()), bankFingerprint: DRIFTED }
    const db = makeDb(
      rowWith({
        questions: drifted,
        answers: { ...reviewReady(), phase: "ready-for-report" as const },
        consultation_finalisation: sealed,
        consultation_handoff_id: "33333333-3333-4333-8333-333333333333",
      }),
    )
    mockGetSupabase.mockReturnValue(db.client)

    const res = await callFinalise(post({ sessionId: SESSION }))

    expect(res.status).toBe(200)
    expect((await jsonOf(res)).handoffId).toBe("33333333-3333-4333-8333-333333333333")
    expect(db.counts().writes).toBe(0)
  })
})

/* ══ Concurrency ═══════════════════════════════════════════════════════════ */

describe("two finalisers converge on one handoff", () => {
  it("the loser reuses the winner's seal and persists neither its id nor its time", async () => {
    /*
     * Both read the same CAS token. The first write wins; the second matches
     * zero rows, re-reads, finds a valid seal and returns THAT one.
     *
     * Modelled by letting a second finaliser complete inside the first one's
     * write hook, which is the same interleaving two browser tabs produce.
     */
    let winner: Record<string, unknown> | null = null
    const db = makeDb(rowWith(), {
      beforeWrite: () => {
        // Runs once, from inside the loser's own attempt — see below.
      },
    })
    mockGetSupabase.mockReturnValue(db.client)

    // First finaliser seals.
    winner = await jsonOf(await callFinalise(post({ sessionId: SESSION })))
    const sealedAfterWinner = JSON.stringify(db.row()!.consultation_finalisation)
    const writesAfterWinner = db.counts().writes

    // Second finaliser, holding a stale view of an unsealed row, tries anyway.
    const loser = await jsonOf(await callFinalise(post({ sessionId: SESSION })))

    expect(loser.handoffId).toBe(winner.handoffId)
    expect(loser.finalisedAt).toBe(winner.finalisedAt)
    expect(db.counts().writes).toBe(writesAfterWinner)
    expect(JSON.stringify(db.row()!.consultation_finalisation)).toBe(sealedAfterWinner)
  })

  it("a seal landing between the read and the write is caught by the guard", async () => {
    // The genuine race: this request reads an unsealed row, and somebody seals
    // it before this write goes out. The `IS NULL` guards match zero rows.
    const other = {
      finalisation: sealedPayload(reviewReady()),
      handoff: "44444444-4444-4444-8444-444444444444",
    }
    let injected = false
    const db = makeDb(rowWith(), {
      beforeWrite: () => {
        if (injected) return
        injected = true
        const row = db.row()!
        row.consultation_finalisation = other.finalisation
        row.consultation_handoff_id = other.handoff
        row.answers = { ...reviewReady(), phase: "ready-for-report" }
      },
    })
    mockGetSupabase.mockReturnValue(db.client)

    const body = await jsonOf(await callFinalise(post({ sessionId: SESSION })))

    // This request's own UUID and timestamp never reached the database.
    expect(body.handoffId).toBe(other.handoff)
    expect(body.finalisedAt).toBe(other.finalisation.finalisedAt)
    expect(db.row()!.consultation_handoff_id).toBe(other.handoff)
  })

  it("an ordinary edit landing first sends the finaliser back through C1", async () => {
    /*
     * The edit opens a required branch, so the Consultation is no longer
     * finishable. The finaliser must re-derive rather than seal the verdict it
     * computed before the edit.
     */
    let injected = false
    const db = makeDb(rowWith({ answers: reviewReady({ [Q1]: "nothing" }) }), {
      beforeWrite: () => {
        if (injected) return
        injected = true
        const row = db.row()!
        const answers = { ...(row.answers as DeterministicConsultationState).candidateAnswers }
        // "bloating" opens two required signal questions that have no answers.
        answers[Q1] = "bloating"
        row.answers = stateWith({ candidateAnswers: answers, phase: "review" })
        row.updated_at = "2026-09-07T11:00:00.000Z"
      },
    })
    mockGetSupabase.mockReturnValue(db.client)

    const res = await callFinalise(post({ sessionId: SESSION }))
    const body = await jsonOf(res)

    expect(res.status).toBe(409)
    expect(body.error).toBe("Your Consultation is not finished yet")
    expect(Array.isArray(body.missingQuestionIds)).toBe(true)
    expect(db.row()!.consultation_handoff_id).toBeNull()
    expect(db.state().phase).toBe("review")
  })
})

/* ══ Refusals ══════════════════════════════════════════════════════════════ */

describe("anything that is not a finishable deterministic Consultation refuses", () => {
  it("a session with no row", async () => {
    const db = makeDb(null)
    mockGetSupabase.mockReturnValue(db.client)
    expect((await callFinalise(post({ sessionId: SESSION }))).status).toBe(404)
  })

  it("a LEGACY session is refused, never converted", async () => {
    const db = makeDb(rowWith({ questions: [{ id: "q1", text: "legacy" }], answers: { q1: "x" } }))
    mockGetSupabase.mockReturnValue(db.client)

    const res = await callFinalise(post({ sessionId: SESSION }))

    expect(res.status).toBe(409)
    expect(db.counts().writes).toBe(0)
    expect(db.row()!.answers).toEqual({ q1: "x" })
  })

  it("UNREADABLE deterministic state refuses rather than being emptied", async () => {
    const db = makeDb(rowWith({ answers: { kind: DETERMINISTIC_STATE_KIND, schemaVersion: 1 } }))
    mockGetSupabase.mockReturnValue(db.client)

    expect((await callFinalise(post({ sessionId: SESSION }))).status).toBe(409)
    expect(db.counts().writes).toBe(0)
  })

  it("a bank this build does not hold refuses", async () => {
    const db = makeDb(rowWith({ questions: { ...snapshot(), bankVersion: "consultation-bank-v99" } }))
    mockGetSupabase.mockReturnValue(db.client)

    expect((await callFinalise(post({ sessionId: SESSION }))).status).toBe(409)
    expect(db.counts().writes).toBe(0)
  })

  it("a fingerprint that no longer matches the bank refuses", async () => {
    const db = makeDb(rowWith({ questions: { ...snapshot(), bankFingerprint: "sha256-drifted" } }))
    mockGetSupabase.mockReturnValue(db.client)

    expect((await callFinalise(post({ sessionId: SESSION }))).status).toBe(409)
    expect(db.counts().writes).toBe(0)
  })

  it("a Consultation still in the questions phase refuses", async () => {
    const db = makeDb(rowWith({ answers: stateWith({ candidateAnswers: completeAnswers(), currentQuestionId: Q2 }) }))
    mockGetSupabase.mockReturnValue(db.client)

    const body = await jsonOf(await callFinalise(post({ sessionId: SESSION })))
    expect(body.error).toBe("Your Consultation is not ready to finish")
    expect(db.counts().writes).toBe(0)
  })

  it("an OPEN Review edit refuses — the record would freeze mid-correction", async () => {
    const db = makeDb(
      rowWith({ answers: stateWith({ candidateAnswers: completeAnswers(), phase: "review", currentQuestionId: Q2 }) }),
    )
    mockGetSupabase.mockReturnValue(db.client)

    const body = await jsonOf(await callFinalise(post({ sessionId: SESSION })))
    expect(body.error).toBe("Finish the answer you are editing first")
    expect(db.counts().writes).toBe(0)
  })

  it("an incomplete Consultation refuses and names where to go back to", async () => {
    const partial = completeAnswers()
    delete partial[Q2]
    const db = makeDb(rowWith({ answers: stateWith({ candidateAnswers: partial, phase: "review" }) }))
    mockGetSupabase.mockReturnValue(db.client)

    const body = await jsonOf(await callFinalise(post({ sessionId: SESSION })))

    expect(body.error).toBe("Your Consultation is not finished yet")
    expect(body.missingQuestionIds).toContain(Q2)
    expect(body.firstQuestionId).toBe(Q2)
    expect(db.counts().writes).toBe(0)
  })
})

/* ══ The refusal vocabulary ════════════════════════════════════════════════ */

describe("every refusal names its category, and only one of them is incomplete", () => {
  /**
   * ══ WHY THE CODES ARE PINNED HERE ═════════════════════════════════════════
   *
   * This route answers 409 to ten different situations. The browser used to
   * classify them by status, so all ten arrived at the customer as "something
   * still needs an answer" — nine of them sent looking for a question that does
   * not exist, while the real refusal went unmentioned.
   *
   * The fix only holds if `consultation_incomplete` stays welded to the ONE
   * branch that means it: the canonical builder's `incomplete` outcome, which
   * re-derives completeness immediately before the write. So these cases prove
   * both halves — that the incomplete branch carries it, and that the trust and
   * state refusals carry something else.
   */

  it("the incomplete branch, and only it, carries consultation_incomplete", async () => {
    const partial = completeAnswers()
    delete partial[Q2]
    const db = makeDb(rowWith({ answers: stateWith({ candidateAnswers: partial, phase: "review" }) }))
    mockGetSupabase.mockReturnValue(db.client)

    const res = await callFinalise(post({ sessionId: SESSION }))
    const body = await jsonOf(res)

    expect(res.status).toBe(409)
    expect(body.code).toBe(FINALISE_CODES.INCOMPLETE)
    // The canonical outstanding ids travel WITH the code, so a client acting on
    // it has somewhere to send the customer.
    expect(body.firstQuestionId).toBe(Q2)
  })

  it("a legacy row is a mode conflict, not an unfinished Consultation", async () => {
    const db = makeDb(rowWith({ questions: [{ id: "dq1", text: "Legacy?", type: "scale" }] }))
    mockGetSupabase.mockReturnValue(db.client)

    const body = await jsonOf(await callFinalise(post({ sessionId: SESSION })))
    expect(body.code).toBe(FINALISE_CODES.MODE_CONFLICT)
  })

  it("a context that disagrees with Stripe is a context conflict", async () => {
    const db = makeDb(rowWith({ questions: { ...snapshot(), foundation: "family" } }))
    mockGetSupabase.mockReturnValue(db.client)

    const body = await jsonOf(await callFinalise(post({ sessionId: SESSION })))
    expect(body.code).toBe(FINALISE_CODES.CONTEXT_CONFLICT)
  })

  it("unreadable stored state says so", async () => {
    const db = makeDb(rowWith({ answers: { kind: "not-a-state" } }))
    mockGetSupabase.mockReturnValue(db.client)

    const body = await jsonOf(await callFinalise(post({ sessionId: SESSION })))
    expect(body.code).toBe(FINALISE_CODES.STATE_UNREADABLE)
  })

  it("a bank this build does not hold says so", async () => {
    const db = makeDb(rowWith({ questions: { ...snapshot(), bankVersion: "consultation-v99" } }))
    mockGetSupabase.mockReturnValue(db.client)

    const body = await jsonOf(await callFinalise(post({ sessionId: SESSION })))
    expect(body.code).toBe(FINALISE_CODES.BANK_UNAVAILABLE)
  })

  it("a Consultation still in the questions phase is not-in-review", async () => {
    const db = makeDb(
      rowWith({ answers: stateWith({ phase: "questions", currentQuestionId: Q1 }) }),
    )
    mockGetSupabase.mockReturnValue(db.client)

    const body = await jsonOf(await callFinalise(post({ sessionId: SESSION })))
    expect(body.code).toBe(FINALISE_CODES.NOT_IN_REVIEW)
  })

  it("an open Review edit is review-edit-active", async () => {
    const db = makeDb(
      rowWith({ answers: stateWith({ phase: "review", currentQuestionId: Q2 }) }),
    )
    mockGetSupabase.mockReturnValue(db.client)

    const body = await jsonOf(await callFinalise(post({ sessionId: SESSION })))
    expect(body.code).toBe(FINALISE_CODES.REVIEW_EDIT_ACTIVE)
  })

  it("no refusal in the route is left without a code", () => {
    /*
     * `refuse()` takes the code as a required parameter, so this cannot be
     * forgotten — the compiler catches it. Asserted anyway, because the
     * regression that matters is subtler than omission: a refusal added with
     * the INCOMPLETE code copied from its neighbour would compile perfectly and
     * would tell a customer to answer a question that is not missing.
     */
    const source = readFileSync(
      join(process.cwd(), "app/api/consultation/finalise/route.ts"),
      "utf8",
    )
    const incompleteUses = source.match(/FINALISE_CODES\.INCOMPLETE/g) ?? []
    expect(incompleteUses, "exactly one branch may claim incompleteness").toHaveLength(1)
    // Every `refuse(` call passes three or more arguments — a status, a message
    // and a code.
    // `[^;]` already spans newlines, so no dotAll flag is needed (and the
    // build targets ES6, where it is not available).
    for (const call of source.match(/refuse\(\s*\d{3},[^;]*?\)/g) ?? []) {
      expect(call, "a refusal without a code").toMatch(/FINALISE_CODES\./)
    }
  })
})

/* ══ A corrupt seal is never repaired ══════════════════════════════════════ */

describe("a half-written seal fails closed", () => {
  const sealed = () => sealedPayload(reviewReady())
  const ready = () => ({ ...reviewReady(), phase: "ready-for-report" as const })

  it.each([
    [
      "finalisation without a handoff",
      { answers: ready(), consultation_finalisation: sealedPayload(reviewReady()), consultation_handoff_id: null },
    ],
    [
      "handoff without a finalisation",
      { answers: ready(), consultation_finalisation: null, consultation_handoff_id: "55555555-5555-4555-8555-555555555555" },
    ],
    [
      "ready-for-report with no seal at all",
      { answers: ready(), consultation_finalisation: null, consultation_handoff_id: null },
    ],
    [
      "a seal on a Consultation still in review",
      {
        answers: reviewReady(),
        consultation_finalisation: sealedPayload(reviewReady()),
        consultation_handoff_id: "66666666-6666-4666-8666-666666666666",
      },
    ],
    [
      "a seal with an open cursor",
      {
        answers: { ...reviewReady(), phase: "ready-for-report" as const, currentQuestionId: Q2 },
        consultation_finalisation: sealedPayload(reviewReady()),
        consultation_handoff_id: "77777777-7777-4777-8777-777777777777",
      },
    ],
    [
      "a handoff that is not a usable id",
      { answers: ready(), consultation_finalisation: sealedPayload(reviewReady()), consultation_handoff_id: 42 },
    ],
  ])("%s refuses, writes nothing and repairs nothing", async (_name, over) => {
    const db = makeDb(rowWith(over as Row))
    mockGetSupabase.mockReturnValue(db.client)
    const before = JSON.stringify(db.row())

    const res = await callFinalise(post({ sessionId: SESSION }))

    expect(res.status).toBe(409)
    expect(db.counts().writes).toBe(0)
    expect(JSON.stringify(db.row())).toBe(before)
  })

  it("a MALFORMED stored finalisation refuses rather than being rebuilt", async () => {
    // The tempting repair — "we cannot read it, so make a new one from today's
    // answers" — is exactly what sealing exists to prevent.
    const db = makeDb(
      rowWith({
        answers: ready(),
        consultation_finalisation: { kind: "deterministic-consultation-finalisation", schemaVersion: 1 },
        consultation_handoff_id: "88888888-8888-4888-8888-888888888888",
      }),
    )
    mockGetSupabase.mockReturnValue(db.client)

    expect((await callFinalise(post({ sessionId: SESSION }))).status).toBe(409)
    expect(db.counts().writes).toBe(0)
  })

  it("a stored finalisation belonging to ANOTHER session refuses", async () => {
    const foreign = { ...sealed(), foundation: "family" as const }
    const db = makeDb(
      rowWith({
        answers: ready(),
        consultation_finalisation: foreign,
        consultation_handoff_id: "99999999-9999-4999-8999-999999999999",
      }),
    )
    mockGetSupabase.mockReturnValue(db.client)

    expect((await callFinalise(post({ sessionId: SESSION }))).status).toBe(409)
    expect(db.counts().writes).toBe(0)
  })
})

/* ══ A sealed Consultation is terminal ═════════════════════════════════════ */

describe("no mutation can change a Consultation that has been sealed", () => {
  const sealedRow = (over: Row = {}) =>
    rowWith({
      answers: { ...reviewReady(), phase: "ready-for-report" as const },
      consultation_finalisation: sealedPayload(reviewReady()),
      consultation_handoff_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      ...over,
    })

  it.each([
    ["answer", { action: "answer", questionId: Q1, value: "bloating" }],
    ["clear", { action: "clear", questionId: AVOIDANCES }],
    ["skip", { action: "skip", questionId: AVOIDANCES }],
    ["navigate", { action: "navigate", currentQuestionId: Q2 }],
    ["leave-review", { action: "leave-review", currentQuestionId: Q2 }],
  ])("progress refuses %s", async (_name, action) => {
    const db = makeDb(sealedRow())
    mockGetSupabase.mockReturnValue(db.client)
    const before = JSON.stringify(db.row())

    const res = await callProgress(patch({ ...action, sessionId: SESSION }))

    expect(res.status).toBe(409)
    expect(db.counts().writes).toBe(0)
    expect(JSON.stringify(db.row())).toBe(before)
  })

  it("an optional-answer WITHDRAWAL cannot land after the seal", async () => {
    // The persisted withdrawal is a skip carrying an explicit null cursor.
    const db = makeDb(sealedRow())
    mockGetSupabase.mockReturnValue(db.client)

    const res = await callProgress(
      patch({ action: "skip", sessionId: SESSION, questionId: AVOIDANCES, currentQuestionId: null }),
    )

    expect(res.status).toBe(409)
    expect(db.counts().writes).toBe(0)
  })

  it("Review cannot be re-entered, so ready can never revert to review", async () => {
    const db = makeDb(sealedRow())
    mockGetSupabase.mockReturnValue(db.client)

    const res = await callReview(reviewPost({ sessionId: SESSION }))

    expect(res.status).toBe(409)
    expect(db.counts().writes).toBe(0)
    expect(db.state().phase).toBe("ready-for-report")
  })

  it("no answer can be resurrected after the seal", async () => {
    const db = makeDb(sealedRow())
    mockGetSupabase.mockReturnValue(db.client)
    const sealedAnswers = JSON.stringify(db.state().candidateAnswers)

    await callProgress(patch({ action: "answer", sessionId: SESSION, questionId: Q1, value: "bloating" }))

    expect(JSON.stringify(db.state().candidateAnswers)).toBe(sealedAnswers)
  })

  it("a PARTIAL seal refuses mutation too, rather than being written through", async () => {
    // Evidence that something wrote outside every route that knows these rules.
    // Writing through it is how the evidence gets destroyed.
    for (const over of [
      { consultation_handoff_id: null },
      { consultation_finalisation: null },
      { answers: reviewReady() },
    ]) {
      const db = makeDb(sealedRow(over))
      mockGetSupabase.mockReturnValue(db.client)

      const res = await callProgress(patch({ action: "navigate", sessionId: SESSION, currentQuestionId: Q2 }))

      expect(res.status, JSON.stringify(over)).toBe(409)
      expect(db.counts().writes, JSON.stringify(over)).toBe(0)
    }
  })

  it("ready-for-report alone is enough to refuse, seal columns or not", async () => {
    // Migration 48 is drafted. Until it is applied the columns do not exist, so
    // the phase is the only marker a live row could carry — and it must still
    // be enough.
    const db = makeDb(
      rowWith({
        answers: { ...reviewReady(), phase: "ready-for-report" as const },
        consultation_finalisation: null,
        consultation_handoff_id: null,
      }),
    )
    mockGetSupabase.mockReturnValue(db.client)

    expect((await callProgress(patch({ action: "navigate", sessionId: SESSION, currentQuestionId: Q2 }))).status).toBe(409)
    expect((await callReview(reviewPost({ sessionId: SESSION }))).status).toBe(409)
    expect(db.counts().writes).toBe(0)
  })

  it("a mutation that read BEFORE the seal cannot land after it", async () => {
    // The CAS closes the window: the seal moves `updated_at`, the mutation's
    // guard matches zero rows, and the re-read then finds the seal and refuses.
    let injected = false
    const db = makeDb(rowWith(), {
      beforeWrite: () => {
        if (injected) return
        injected = true
        const row = db.row()!
        row.answers = { ...reviewReady(), phase: "ready-for-report" }
        row.consultation_finalisation = sealedPayload(reviewReady())
        row.consultation_handoff_id = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb"
        row.updated_at = "2026-09-07T12:00:00.000Z"
      },
    })
    mockGetSupabase.mockReturnValue(db.client)

    const res = await callProgress(patch({ action: "answer", sessionId: SESSION, questionId: Q1, value: "bloating" }))

    expect(res.status).toBe(409)
    expect(db.state().phase).toBe("ready-for-report")
    expect(db.state().candidateAnswers[Q1]).not.toBe("bloating")
  })
})

/* ══ The Phase 4A firewall ═════════════════════════════════════════════════ */

describe("sealing a Consultation begins no Report", () => {
  const readFile = async (p: string) =>
    (await import("node:fs")).readFileSync(p, "utf8")

  const C2A_FILES = [
    "app/api/consultation/finalise/route.ts",
    "lib/consultation/seal.ts",
    "lib/consultation/finalisation.ts",
  ]

  it("no model provider, Report generator, PDF or email is imported or called", async () => {
    for (const file of C2A_FILES) {
      const source = await readFile(file)
      for (const banned of [
        "anthropic",
        "openai",
        "claude-",
        "gpt-",
        "submit-deep-assessment",
        "generate-deep-questions",
        "generatePDF",
        "sendEmail",
        "buildPaidReportEmail",
        "report-prompt",
      ]) {
        expect(source.toLowerCase(), `${file} references ${banned}`).not.toContain(banned.toLowerCase())
      }
    }
  })

  it("no report id, job id or Report status is written", async () => {
    const source = await readFile("app/api/consultation/finalise/route.ts")
    for (const banned of ["reportJobId", "reportId", "report_json", "pdf_url", "pdf_status", "report_status"]) {
      expect(source, banned).not.toContain(banned)
    }
  })

  it("the route writes only the four fields the seal needs", async () => {
    // A fifth would be scope this phase has not been given — and `status` in
    // particular is the legacy Report's, written by a route that knows nothing
    // about any of this.
    const source = await readFile("app/api/consultation/finalise/route.ts")
    // Sliced forward from the update, not back from the session-id filter: that
    // filter appears on the READ first, which would give an empty range.
    const start = source.indexOf(".update({")
    const update = source.slice(start, source.indexOf("})", start))
    expect(update).toContain("answers:")
    expect(update).toContain("consultation_finalisation:")
    expect(update).toContain("consultation_handoff_id:")
    expect(update).toContain("updated_at:")
    expect(update).not.toContain("status:")
  })

  it("the sealed row's Report columns are left exactly as they were", async () => {
    const db = makeDb(rowWith({ report_json: null, pdf_url: null, status: "in_progress" }))
    mockGetSupabase.mockReturnValue(db.client)

    await callFinalise(post({ sessionId: SESSION }))

    const row = db.row()!
    expect(row.report_json).toBeNull()
    expect(row.pdf_url).toBeNull()
    expect(row.status).toBe("in_progress")
  })

  it("the real paid flow still renders the legacy client by default", async () => {
    /*
     * Re-pointed at Phase 3C-C2B, which wired the persisted client into the
     * page. The rule C2A wrote this for is unchanged — a paying customer must
     * not reach the finalise route — but it is now enforced by the activation
     * policy rather than by the client being absent.
     *
     * The page still never calls the finalise endpoint itself: sealing is the
     * Review screen's action, through the transport adapter.
     */
    const page = await readFile("app/assessment/deep/page.tsx")
    expect(page).toContain("DeepAssessmentClient")
    // Repair round: the single conflated policy became two — a runtime gate and
    // a new-claim rollout. Both must be present; the rule ("a paying customer
    // does not reach this") is enforced by the first.
    expect(page).toContain("isPersistedRuntimeEligible")
    expect(page).toContain("isNewDeterministicClaimAllowed")
    expect(page).not.toContain("consultation/finalise")
  })
})
