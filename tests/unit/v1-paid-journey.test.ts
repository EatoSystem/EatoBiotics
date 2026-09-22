/**
 * The €49 commercial journey, proven against the real handlers — Step 7.
 *
 * ══ WHY THIS FILE EXISTS ════════════════════════════════════════════════════
 *
 * `tests/unit/stripe-webhook-route.test.ts` mocks `isCheckoutSessionSettled`
 * to return `false` unconditionally, and its `@/lib/paid-report-session`
 * factory omits `resolvePaidReportSummary` — which the route imports and
 * calls. So the `checkout.session.completed` branch, the €49 branch, has
 * **never executed in any test and cannot, as that file is written.** Its five
 * guard-rail assertions are correct and are left alone; the commercial proof
 * lives here instead.
 *
 * That is the recurring defect class in a new costume: a test that looks
 * structurally complete while its fixture makes the behaviour under test
 * impossible to reach. The guard in
 * `tests/unit/stripe-mock-coverage.test.ts` exists so it cannot recur silently.
 *
 * ══ WHAT IS GENUINELY EXERCISED ═════════════════════════════════════════════
 *
 * • **Signatures are real.** Stripe's webhook signing is HMAC-SHA256 over
 *   `timestamp.payload` and needs no network, so the real SDK signs
 *   (`generateTestHeaderString`) and the real route verifies
 *   (`constructEvent`). Tampering, a wrong secret and an out-of-tolerance
 *   timestamp are refused for the real reason.
 * • **The route is real.** No handler logic is reimplemented here.
 * • **`lib/paid-report-session` is real** — `resolvePaidReportSummary` and
 *   `isCheckoutSessionSettled` run against stored intent rows, both settled
 *   and unsettled.
 *
 * ══ WHAT IS A DOUBLE ════════════════════════════════════════════════════════
 *
 * The database only. `tests/unit/support/postgrest-double.ts` states exactly
 * what it models and what it does not. **No assertion here is evidence that
 * Supabase behaves this way** — it is evidence about the handler. Step 7's
 * report files these as PROVEN IN CI (DOUBLE); real Stripe delivery, real
 * storage and real Resend delivery are in the external runbook.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { NextRequest } from "next/server"
import Stripe from "stripe"
import { PostgrestDouble, Barrier } from "./support/postgrest-double"

const WEBHOOK_SECRET = "whsec_step7_fixture_secret"

/* ── The real SDK, for real signing and real verification ────────────────── */
const realStripe = new Stripe("sk_test_step7_offline_fixture")

const subscriptionsRetrieve = vi.fn(async (..._a: unknown[]) => ({ current_period_end: 0 }))

const hoisted = vi.hoisted(() => ({
  db: null as PostgrestDouble | null,
}))

vi.mock("@/lib/stripe-server", () => ({
  stripe: {
    // Real: this is the thing under test.
    webhooks: realStripe.webhooks,
    // Stubbed: reaching Stripe's API is impossible here and irrelevant to the
    // invariants this file proves.
    subscriptions: { retrieve: (...a: unknown[]) => subscriptionsRetrieve(...(a as [])) },
    checkout: { sessions: { retrieve: async () => ({}) } },
  },
}))

vi.mock("@/lib/supabase", () => ({
  getSupabase: () => hoisted.db?.client() ?? null,
}))

const sendEmail = vi.fn(async (..._a: unknown[]) => ({ id: "email_1" }))
vi.mock("@/lib/email/send", () => ({ sendEmail: (...a: unknown[]) => sendEmail(...(a as [])) }))

const logServerEvent = vi.fn(async (..._a: unknown[]) => {})
vi.mock("@/lib/statsig-server", () => ({
  logServerEvent: (...a: unknown[]) => logServerEvent(...(a as [])),
}))

const reportError = vi.fn(async (..._a: unknown[]) => {})
vi.mock("@/lib/report-error", () => ({ reportError: (...a: unknown[]) => reportError(...(a as [])) }))

/* `@/lib/paid-report-session`, `@/lib/auth/reconcile-account` and
 * `@/lib/membership` are deliberately NOT mocked — they are part of what is
 * being proven. */

/* ── Fixtures ───────────────────────────────────────────────────────────── */

const BUYER = "buyer@example.com"
const SESSION_ID = "cs_test_step7_primary"
const INTENT_TOKEN = "a".repeat(64)

const SUMMARY = {
  tier: "personal",
  overall: 56,
  subScores: { prebiotics: 44, probiotics: 66, postbiotics: 67 },
  profile: {
    type: "Emerging Balance",
    tagline: "The building blocks are there.",
    description: "Awareness and some strong habits, not yet a reliable pattern.",
    color: "var(--icon-lime)",
  },
  email: BUYER,
  foundationType: "you",
  selectedAddon: null,
}

/** A Stripe-shaped settled one-time checkout session. */
function settledSession(overrides: Record<string, unknown> = {}) {
  return {
    id: SESSION_ID,
    object: "checkout.session",
    mode: "payment",
    status: "complete",
    payment_status: "paid",
    amount_total: 4900,
    currency: "eur",
    livemode: false,
    // Real sessions always carry this. It is the purchase-correlated fallback
    // the entitlement uses when no durable row is readable, and it is stable
    // across every event about this session.
    created: Math.floor(Date.UTC(2026, 0, 1) / 1000),
    customer_details: { email: BUYER },
    metadata: {
      summary_token: INTENT_TOKEN,
      report_tier: "personal",
      requested_immediate_start: "true",
    },
    ...overrides,
  }
}

function checkoutCompleted(
  eventId = "evt_step7_paid_1",
  sessionOverrides: Record<string, unknown> = {},
  type = "checkout.session.completed",
) {
  return {
    id: eventId,
    object: "event",
    api_version: "2024-06-20",
    created: Math.floor(Date.now() / 1000),
    type,
    livemode: false,
    data: { object: settledSession(sessionOverrides) },
  }
}

/** A fresh database with the buyer's intent row and profile in place. */
function freshDb(opts: { withProfile?: boolean; intent?: boolean } = {}) {
  const { withProfile = true, intent = true } = opts
  return new PostgrestDouble({
    stripe_processed_events: { primaryKey: "event_id", rows: [] },
    paid_report_intents: {
      primaryKey: "token",
      rows: intent
        ? [{ token: INTENT_TOKEN, stripe_session_id: SESSION_ID, summary: SUMMARY }]
        : [],
    },
    deep_assessments: {
      primaryKey: "stripe_session_id",
      rows: [],
      // Verified against production (2026-09-22): timestamptz DEFAULT now(),
      // zero nulls. The entitlement window is derived from it.
      defaults: { created_at: () => new Date().toISOString() },
    },
    profiles: {
      primaryKey: "id",
      rows: withProfile
        ? [{ id: "user_1", email: BUYER, membership_tier: "free", trial_expires_at: null }]
        : [],
    },
    subscription_events: { primaryKey: "id", rows: [] },
  })
}

/** POST the event to the real route with a REAL Stripe signature. */
async function deliver(
  event: unknown,
  opts: { secret?: string; tamper?: boolean; timestamp?: number } = {},
) {
  const payload = JSON.stringify(event)
  const header = realStripe.webhooks.generateTestHeaderString({
    payload,
    secret: opts.secret ?? WEBHOOK_SECRET,
    ...(opts.timestamp ? { timestamp: opts.timestamp } : {}),
  })
  const body = opts.tamper ? payload.replace('"amount_total":4900', '"amount_total":1') : payload

  const { POST } = await import("@/app/api/stripe/webhook/route")
  return POST(
    new NextRequest("http://localhost/api/stripe/webhook", {
      method: "POST",
      headers: { "stripe-signature": header },
      body,
    }),
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.resetModules()
  process.env.STRIPE_WEBHOOK_SECRET = WEBHOOK_SECRET
  hoisted.db = freshDb()
})

afterEach(() => {
  hoisted.db = null
})

/* ══ 1. Signature verification, for real ═════════════════════════════════ */

describe("webhook signature verification (real HMAC, no network)", () => {
  it("accepts a correctly signed event", async () => {
    const res = await deliver(checkoutCompleted())
    expect(res.status).toBe(200)
  })

  it("refuses a tampered payload under a signature made for the original", async () => {
    const res = await deliver(checkoutCompleted(), { tamper: true })
    expect(res.status).toBe(400)
    expect((await res.json()).error).toBe("Invalid signature")
  })

  it("refuses a signature made with a different secret", async () => {
    const res = await deliver(checkoutCompleted(), { secret: "whsec_not_ours" })
    expect(res.status).toBe(400)
  })

  it("refuses a replay outside Stripe's timestamp tolerance", async () => {
    const longAgo = Math.floor(Date.now() / 1000) - 60 * 60
    const res = await deliver(checkoutCompleted(), { timestamp: longAgo })
    expect(res.status).toBe(400)
    expect(hoisted.db!.rowsOf("deep_assessments")).toHaveLength(0)
  })
})

/* ══ 2. The normal successful purchase ═══════════════════════════════════ */

describe("a normal settled €49 purchase", () => {
  it("writes the paid assessment row, carrying the buyer's email", async () => {
    const res = await deliver(checkoutCompleted())
    expect(res.status).toBe(200)

    const rows = hoisted.db!.rowsOf("deep_assessments")
    expect(rows).toHaveLength(1)
    expect(rows[0].stripe_session_id).toBe(SESSION_ID)
    expect(rows[0].email).toBe(BUYER)
    expect(rows[0].tier).toBe("personal")
    expect((rows[0].free_scores as Record<string, unknown>).overall).toBe(56)
  })

  it("grants the 30-day access exactly once", async () => {
    await deliver(checkoutCompleted())
    const profile = hoisted.db!.rowsOf("profiles")[0]
    expect(profile.membership_tier).toBe("trial")
    expect(profile.membership_status).toBe("active")
    expect(profile.trial_expires_at).toBeTruthy()

    const trialEvents = logServerEvent.mock.calls.filter((c) => c[0] === "trial_started")
    expect(trialEvents).toHaveLength(1)
  })

  it("records the purchase once, with the amount actually charged", async () => {
    await deliver(checkoutCompleted())
    const purchases = logServerEvent.mock.calls.filter((c) => c[0] === "report_purchased")
    expect(purchases).toHaveLength(1)
    expect(purchases[0][2]).toMatchObject({ amount: "49", currency: "EUR", tier: "personal" })
  })

  it("marks the event processed only after the side effects succeeded", async () => {
    await deliver(checkoutCompleted())
    expect(hoisted.db!.rowsOf("stripe_processed_events").map((r) => r.event_id)).toEqual([
      "evt_step7_paid_1",
    ])
  })
})

/* ══ 3. Duplicate and replayed delivery ══════════════════════════════════ */

describe("duplicate delivery", () => {
  it("a sequential redelivery of the same event changes nothing", async () => {
    await deliver(checkoutCompleted())
    const first = logServerEvent.mock.calls.length

    const res = await deliver(checkoutCompleted())
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ received: true, deduped: true })
    expect(logServerEvent.mock.calls.length).toBe(first)
    expect(hoisted.db!.rowsOf("deep_assessments")).toHaveLength(1)
  })

  it("a replay after state already exists does not re-grant or re-extend access", async () => {
    await deliver(checkoutCompleted())
    const grantedAt = hoisted.db!.rowsOf("profiles")[0].trial_expires_at

    // A DIFFERENT event id carrying the same settled session — the shape a
    // genuine Stripe replay or a manual resend takes.
    await deliver(checkoutCompleted("evt_step7_paid_replay"))

    const profile = hoisted.db!.rowsOf("profiles")[0]
    expect(profile.trial_expires_at).toBe(grantedAt)
    expect(logServerEvent.mock.calls.filter((c) => c[0] === "trial_started")).toHaveLength(1)
    expect(hoisted.db!.rowsOf("deep_assessments")).toHaveLength(1)
  })

  it("REPRODUCTION: two concurrent deliveries of one event both run the side effects", async () => {
    const barrier = new Barrier(2)
    hoisted.db!.beforeSettle = async (table, op) => {
      // Both invocations complete the idempotency READ before either writes.
      if (table === "stripe_processed_events" && op === "select") await barrier.arrive()
    }

    const [a, b] = await Promise.all([
      deliver(checkoutCompleted()),
      deliver(checkoutCompleted()),
    ])
    barrier.abort()

    expect(a.status).toBe(200)
    expect(b.status).toBe(200)

    // The invariant: one delivery, one purchase recorded. Exactly one of the
    // two must have been refused the claim.
    const purchases = logServerEvent.mock.calls.filter((c) => c[0] === "report_purchased")
    expect(purchases).toHaveLength(1)
  })
})

/* ══ 4. Idempotency store failure ════════════════════════════════════════ */

describe("the idempotency store", () => {
  it("REPRODUCTION: a read failure must not be read as 'not yet processed'", async () => {
    hoisted.db!.fail({
      table: "stripe_processed_events",
      op: "select",
      error: { code: "57014", message: "canceling statement due to statement timeout" },
    })

    const res = await deliver(checkoutCompleted())

    // If the store cannot say whether this event was handled, the safe answer
    // is not "run every side effect again".
    expect(res.status).toBe(500)
    expect(logServerEvent.mock.calls.filter((c) => c[0] === "report_purchased")).toHaveLength(0)
    expect(hoisted.db!.rowsOf("deep_assessments")).toHaveLength(0)
  })

  it("Stripe's retry then succeeds exactly once when the store is healthy again", async () => {
    hoisted.db!.fail({
      table: "stripe_processed_events",
      op: "select",
      error: { code: "57014", message: "statement timeout" },
      times: 1,
    })

    await deliver(checkoutCompleted()) // refused
    const res = await deliver(checkoutCompleted()) // Stripe retries

    expect(res.status).toBe(200)
    expect(logServerEvent.mock.calls.filter((c) => c[0] === "report_purchased")).toHaveLength(1)
    expect(hoisted.db!.rowsOf("deep_assessments")).toHaveLength(1)
  })

  it("a failed handler RELEASES its claim, so Stripe's retry can take it", async () => {
    // Thrown, not returned: the route's try/catch is what must run. An
    // injected `{ error }` on a write whose result the route does not inspect
    // would leave the handler succeeding, and this test would pass while
    // proving nothing about the release.
    hoisted.db!.fail({
      table: "profiles",
      op: "update",
      error: { code: "08006", message: "connection failure" },
      throws: true,
    })

    const failed = await deliver(checkoutCompleted())
    expect(failed.status).toBe(500)

    // The claim must be gone — otherwise the event is marked handled for ever
    // while none of its side effects happened.
    expect(hoisted.db!.rowsOf("stripe_processed_events")).toHaveLength(0)

    hoisted.db!.clearFailures()
    const retry = await deliver(checkoutCompleted())

    expect(retry.status).toBe(200)
    expect(await retry.json()).toEqual({ received: true })
    expect(logServerEvent.mock.calls.filter((c) => c[0] === "report_purchased")).toHaveLength(1)
    expect(hoisted.db!.rowsOf("deep_assessments")).toHaveLength(1)
    expect(hoisted.db!.rowsOf("stripe_processed_events")).toHaveLength(1)
  })
})

/* ══ 5. The paid boundary ════════════════════════════════════════════════ */

describe("an unsettled session cannot satisfy the paid boundary", () => {
  it("an unpaid completed session writes no paid row and grants no access", async () => {
    const res = await deliver(
      checkoutCompleted("evt_step7_unpaid", { payment_status: "unpaid", amount_total: 4900 }),
    )
    expect(res.status).toBe(200)
    expect(hoisted.db!.rowsOf("deep_assessments")).toHaveLength(0)
    expect(hoisted.db!.rowsOf("profiles")[0].membership_tier).toBe("free")
  })

  it("a subscription-mode session is not treated as a report purchase", async () => {
    await deliver(checkoutCompleted("evt_step7_sub", { mode: "subscription" }))
    expect(hoisted.db!.rowsOf("deep_assessments")).toHaveLength(0)
  })

  it("a 100% promotion code settles as no_payment_required and is honoured", async () => {
    await deliver(
      checkoutCompleted("evt_step7_free", {
        payment_status: "no_payment_required",
        amount_total: 0,
      }),
    )
    expect(hoisted.db!.rowsOf("deep_assessments")).toHaveLength(1)
  })
})

/* ══ 6. Session binding ══════════════════════════════════════════════════ */

describe("intent binding", () => {
  it("a token replayed against a different session resolves nothing", async () => {
    await deliver(
      checkoutCompleted("evt_step7_other_session", { id: "cs_test_someone_else" }),
    )
    // The intent row belongs to SESSION_ID, so the summary must not resolve
    // for a different session id. No summary means no paid row is written.
    const rows = hoisted.db!.rowsOf("deep_assessments")
    expect(rows.every((r) => r.stripe_session_id !== "cs_test_someone_else")).toBe(true)
  })

  it("an expired or missing intent falls back to the session's own email, without a paid row", async () => {
    hoisted.db = freshDb({ intent: false })
    await deliver(checkoutCompleted("evt_step7_no_intent"))
    expect(hoisted.db.rowsOf("deep_assessments")).toHaveLength(0)
  })
})

/* ══ 7. Delayed and out-of-order delivery ════════════════════════════════ */

describe("delayed and out-of-order delivery", () => {
  it("a buyer with no account yet is not granted access by the webhook, and no trial is logged", async () => {
    hoisted.db = freshDb({ withProfile: false })
    const res = await deliver(checkoutCompleted())
    expect(res.status).toBe(200)
    // The paid row must still be written, and must carry the email — it is the
    // only thing that lets reconcileAccountAfterAuth grant the 30 days later.
    const rows = hoisted.db.rowsOf("deep_assessments")
    expect(rows).toHaveLength(1)
    expect(rows[0].email).toBe(BUYER)
    expect(logServerEvent.mock.calls.filter((c) => c[0] === "trial_started")).toHaveLength(0)
  })

  it("converges when the webhook lands after the questionnaire already created the row", async () => {
    // generate-deep-questions inserts the row first (no email, historically).
    hoisted.db!.rowsOf("deep_assessments").push({
      stripe_session_id: SESSION_ID,
      tier: "personal",
      free_scores: { overall: 56 },
      status: "questions_generated",
      questions: [{ q: "a question" }],
    })

    await deliver(checkoutCompleted())

    const rows = hoisted.db!.rowsOf("deep_assessments")
    expect(rows).toHaveLength(1)
    expect(rows[0].email).toBe(BUYER)
    // The webhook must not destroy work the questionnaire already did.
    expect(rows[0].questions).toBeTruthy()
  })
})

/* ══ 8. Defect 2 — pinned, NOT repaired in Step 7 ════════════════════════ */

describe("PINNED CURRENT BEHAVIOUR: delayed-notification payment methods", () => {
  /*
   * This block documents what the code does today; it does not endorse it.
   *
   * `checkout.sessions.create` sets no `payment_method_types`, so the enabled
   * set is Stripe-dashboard-controlled and cannot be inspected from this
   * container. If every enabled method settles synchronously, this branch is
   * unreachable for V1. If any delayed-notification method (SEPA, iDEAL,
   * Bancontact, …) is reachable, a buyer pays €49 and NOTHING happens — and
   * this is promoted to a Step 7 blocker and repaired before closure.
   *
   * The runbook item that decides it is mandatory:
   * docs/v1-step7-commercial-runbook.md, step R2.
   */
  it("an unpaid completion is recorded as processed, so it is never revisited", async () => {
    await deliver(
      checkoutCompleted("evt_async_pending", { payment_status: "unpaid" }),
    )
    expect(hoisted.db!.rowsOf("stripe_processed_events").map((r) => r.event_id)).toContain(
      "evt_async_pending",
    )
  })

  it("checkout.session.async_payment_succeeded does nothing at all", async () => {
    await deliver(
      checkoutCompleted("evt_async_ok", {}, "checkout.session.async_payment_succeeded"),
    )
    expect(hoisted.db!.rowsOf("deep_assessments")).toHaveLength(0)
    expect(hoisted.db!.rowsOf("profiles")[0].membership_tier).toBe("free")
    expect(logServerEvent.mock.calls.filter((c) => c[0] === "report_purchased")).toHaveLength(0)
  })
})
