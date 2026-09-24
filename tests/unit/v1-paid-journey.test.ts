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

/** A checkout started an hour ago, expiring 24h after it was created.
 *  Floored to a whole second, because that is the resolution Stripe uses. */
const SESSION_CREATED = Math.floor((Date.now() - 60 * 60 * 1000) / 1000) * 1000
const SESSION_EXPIRES = SESSION_CREATED + 24 * 60 * 60 * 1000

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
    // Real sessions always carry this, and it IS the purchase record the
    // entitlement is anchored to — deliberately not the row's created_at,
    // which is only "when some writer got here first". Recent, because a
    // purchase whose 30 days have already elapsed correctly grants nothing.
    created: Math.floor(SESSION_CREATED / 1000),
    // The latest instant this checkout could have settled. The entitlement
    // anchors here, not at `created`, so a buyer who finished late is never
    // sold 30 days and given 29.
    expires_at: Math.floor(SESSION_EXPIRES / 1000),
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

const MEMBER_PRICE = "price_member_test"
const CUSTOMER = "cus_test_step7"
const SUB_ID = "sub_test_step7"
/** When the subscription was created — the founding-member and started-at source. */
const SUB_CREATED = Math.floor((Date.now() - 2 * 60 * 60 * 1000) / 1000)
const PERIOD_END = Math.floor((Date.now() + 25 * 24 * 60 * 60 * 1000) / 1000)

function subscriptionEvent(
  type: string,
  eventId: string,
  subOverrides: Record<string, unknown> = {},
) {
  return {
    id: eventId,
    object: "event",
    created: Math.floor(Date.now() / 1000),
    type,
    livemode: false,
    data: {
      object: {
        id: SUB_ID,
        object: "subscription",
        customer: CUSTOMER,
        status: "active",
        created: SUB_CREATED,
        current_period_end: PERIOD_END,
        items: { data: [{ price: { id: MEMBER_PRICE, unit_amount: 2499, currency: "eur", recurring: { interval: "month" } } }] },
        ...subOverrides,
      },
    },
  }
}

/** An account that already has a Stripe customer but no membership yet. */
function subscriptionDb() {
  return new PostgrestDouble({
    stripe_processed_events: { primaryKey: "event_id", rows: [] },
    profiles: {
      primaryKey: "id",
      rows: [
        {
          id: "user_1",
          email: BUYER,
          name: "A Buyer",
          stripe_customer_id: CUSTOMER,
          membership_tier: "free",
          membership_status: "inactive",
          stripe_subscription_id: null,
          membership_started_at: null,
          is_founding_member: false,
          membership_expires_at: null,
          trial_expires_at: null,
        },
      ],
    },
    subscription_events: { primaryKey: "id", rows: [] },
    deep_assessments: { primaryKey: "stripe_session_id", rows: [] },
  })
}

/** The durable entitlement facts a crash must not be able to lose. */
function durableState(db: PostgrestDouble) {
  const p = db.rowsOf("profiles")[0]
  return {
    membership_tier: p.membership_tier,
    membership_status: p.membership_status,
    stripe_subscription_id: p.stripe_subscription_id,
    membership_started_at: p.membership_started_at,
    is_founding_member: p.is_founding_member,
    membership_expires_at: p.membership_expires_at,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.resetModules()
  process.env.STRIPE_WEBHOOK_SECRET = WEBHOOK_SECRET
  process.env.STRIPE_MEMBER_PRICE_ID = MEMBER_PRICE
  // Every subscription in these fixtures is created before the cutoff, so
  // founding-member status is a real benefit that a crash could destroy.
  process.env.FOUNDING_MEMBER_CUTOFF_DATE = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
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

  it("grants the 30-day access exactly once, measured from the settlement bound", async () => {
    await deliver(checkoutCompleted())
    const profile = hoisted.db!.rowsOf("profiles")[0]
    expect(profile.membership_tier).toBe("trial")
    expect(profile.membership_status).toBe("active")

    // Anchored at expires_at, so a buyer settling any time inside this session
    // receives at least the full 30 days they paid for.
    expect(new Date(profile.trial_expires_at as string).getTime()).toBe(
      SESSION_EXPIRES + 30 * 24 * 60 * 60 * 1000,
    )

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

/* ══ 9. The subscription lifecycle converges to Stripe truth ══════════════
 *
 * The atomic claim traded one failure for another: the old design lost nothing
 * on a crash (it duplicated on concurrency instead), while claim-first loses
 * whatever the handler had not yet done. For the €49 path that trade is fine —
 * the row is recreated and the entitlement is recovered at sign-in. For
 * subscriptions it was not: `is_founding_member`, `membership_started_at` and
 * `stripe_subscription_id` were written ONLY by `customer.subscription.created`.
 *
 * Process death is modelled as "the claim committed and the side effects never
 * ran" — which is exactly what it leaves behind, and what makes Stripe's retry
 * a no-op.
 */
describe("subscription state converges to Stripe, not to one historical event", () => {
  function claimAlreadyTaken(db: PostgrestDouble, eventId: string) {
    db.rowsOf("stripe_processed_events").push({ event_id: eventId, event_type: "customer.subscription.created" })
  }

  it("1. a lost `created` is fully repaired by a later `updated`", async () => {
    hoisted.db = subscriptionDb()
    claimAlreadyTaken(hoisted.db, "evt_sub_created")

    // Stripe retries the created event; it is deduped, so nothing happens.
    const retried = await deliver(subscriptionEvent("customer.subscription.created", "evt_sub_created"))
    expect(await retried.json()).toEqual({ received: true, deduped: true })
    expect(durableState(hoisted.db).membership_tier).toBe("free")

    // A later legitimate event repairs EVERY durable field.
    await deliver(subscriptionEvent("customer.subscription.updated", "evt_sub_updated"))

    expect(durableState(hoisted.db)).toEqual({
      membership_tier: "member",
      membership_status: "active",
      stripe_subscription_id: SUB_ID,
      membership_started_at: new Date(SUB_CREATED * 1000).toISOString(),
      is_founding_member: true,
      membership_expires_at: new Date(PERIOD_END * 1000).toISOString(),
    })
  })

  it("2. a replayed `created` does not duplicate or drift durable state", async () => {
    hoisted.db = subscriptionDb()
    await deliver(subscriptionEvent("customer.subscription.created", "evt_sub_c1"))
    const first = durableState(hoisted.db)

    // A genuine replay: same subscription, a different event id.
    await deliver(subscriptionEvent("customer.subscription.created", "evt_sub_c2"))

    expect(durableState(hoisted.db)).toEqual(first)
    expect(hoisted.db.rowsOf("profiles")).toHaveLength(1)
  })

  it("3. `updated` alone establishes the entitlement, with no `created` ever", async () => {
    hoisted.db = subscriptionDb()

    await deliver(subscriptionEvent("customer.subscription.updated", "evt_sub_only_update"))

    expect(durableState(hoisted.db)).toEqual({
      membership_tier: "member",
      membership_status: "active",
      stripe_subscription_id: SUB_ID,
      membership_started_at: new Date(SUB_CREATED * 1000).toISOString(),
      is_founding_member: true,
      membership_expires_at: new Date(PERIOD_END * 1000).toISOString(),
    })
  })

  it("4. a lost cancellation still converges to no access, with no further event", async () => {
    // Stripe sends NOTHING more about a deleted subscription, so there is no
    // later event to repair this one. Convergence has to come from data the
    // profile already holds.
    hoisted.db = subscriptionDb()

    // A member whose period has already ended (a cancel-at-period-end).
    const endedAt = new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString()
    Object.assign(hoisted.db.rowsOf("profiles")[0], {
      membership_tier: "member",
      membership_status: "active",
      stripe_subscription_id: SUB_ID,
      membership_expires_at: endedAt,
    })

    // The claim committed; the process died before the downgrade ran.
    hoisted.db.rowsOf("stripe_processed_events").push({
      event_id: "evt_sub_deleted",
      event_type: "customer.subscription.deleted",
    })
    const retried = await deliver(
      subscriptionEvent("customer.subscription.deleted", "evt_sub_deleted", { status: "canceled" }),
    )
    expect(await retried.json()).toEqual({ received: true, deduped: true })

    // The stored row is still, wrongly, "active member" — nothing downgraded it.
    const p = hoisted.db.rowsOf("profiles")[0]
    expect(p.membership_status).toBe("active")
    expect(p.membership_tier).toBe("member")

    // But it carries the paid-through date, and that is what the access check
    // bounds by, so the entitlement lapses anyway. That the read path turns
    // exactly this row into "free" is proven in
    // tests/unit/membership-convergence.test.ts.
    expect(p.membership_expires_at).toBe(endedAt)
    expect(new Date(p.membership_expires_at as string).getTime()).toBeLessThan(Date.now())
  })

  it("5. replaying `updated` after convergence is harmless", async () => {
    hoisted.db = subscriptionDb()
    await deliver(subscriptionEvent("customer.subscription.updated", "evt_u1"))
    const converged = durableState(hoisted.db)

    await deliver(subscriptionEvent("customer.subscription.updated", "evt_u2"))
    await deliver(subscriptionEvent("customer.subscription.updated", "evt_u3"))

    expect(durableState(hoisted.db)).toEqual(converged)
  })

  it("6. a lost `created` costs the welcome email and the analytics — and ONLY those", async () => {
    hoisted.db = subscriptionDb()
    claimAlreadyTaken(hoisted.db, "evt_sub_created")
    await deliver(subscriptionEvent("customer.subscription.created", "evt_sub_created"))
    await deliver(subscriptionEvent("customer.subscription.updated", "evt_sub_updated"))

    // ENTITLEMENT: fully recovered.
    expect(durableState(hoisted.db).membership_tier).toBe("member")
    expect(durableState(hoisted.db).is_founding_member).toBe(true)

    // COMMUNICATION and ANALYTICS: permanently lost, and asserted separately
    // so the two can never be conflated by a later reading. A welcome email is
    // a one-time message, not an entitlement; `subscription_started` is a
    // revenue event, not access.
    expect(sendEmail).not.toHaveBeenCalled()
    expect(logServerEvent.mock.calls.filter((c) => c[0] === "subscription_started")).toHaveLength(0)
  })

  it("a subscription ending does NOT erase a separately-bought €49 entitlement", async () => {
    // Two different purchases. A subscription lapsing says nothing about a
    // report someone bought on its own, and clearing the report's window here
    // would silently destroy access they paid €49 for.
    hoisted.db = subscriptionDb()
    const reportWindow = new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString()
    Object.assign(hoisted.db.rowsOf("profiles")[0], { trial_expires_at: reportWindow })

    await deliver(
      subscriptionEvent("customer.subscription.updated", "evt_sub_past_due", {
        status: "past_due",
      }),
    )

    expect(hoisted.db.rowsOf("profiles")[0].trial_expires_at).toBe(reportWindow)
    expect(hoisted.db.rowsOf("profiles")[0].membership_status).toBe("past_due")
  })

  it("a live subscription does supersede a pending report window", async () => {
    hoisted.db = subscriptionDb()
    Object.assign(hoisted.db.rowsOf("profiles")[0], {
      trial_expires_at: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
    })

    await deliver(subscriptionEvent("customer.subscription.updated", "evt_sub_active"))

    expect(hoisted.db.rowsOf("profiles")[0].trial_expires_at).toBeNull()
  })

  it("does not grant a membership for a price we do not sell", async () => {
    hoisted.db = subscriptionDb()
    await deliver(
      subscriptionEvent("customer.subscription.updated", "evt_unknown_price", {
        items: { data: [{ price: { id: "price_not_ours", currency: "eur" } }] },
      }),
    )
    expect(hoisted.db.rowsOf("profiles")[0].membership_tier).toBe("free")
  })
})
