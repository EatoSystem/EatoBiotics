/**
 * /api/stripe/webhook — handler-level tests for the money-path boundary.
 *
 * Runs the real route handler in-process against an in-memory Supabase fake
 * that can be told to fail a specific table operation. Covers:
 *  - guard rails: secret configuration, signature verification, idempotency;
 *  - every handled event's state transition;
 *  - the invariant: an event whose required database write failed is answered
 *    500 and NOT recorded in stripe_processed_events, so Stripe retries it —
 *    and the retry completes the transition, is recorded once, and does not
 *    duplicate side effects (emails, analytics, subscription_events rows).
 */
import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"

/* ── In-memory Supabase fake ───────────────────────────────────────────── */
type Row = Record<string, unknown>
type DbError = { message: string; code?: string }
type Op = "select" | "insert" | "update" | "upsert"
type Result = { data: unknown; error: DbError | null }

let tables: Record<string, Row[]> = {}
/** Injected outcomes per `${table}.${op}`, consumed in call order; null = run normally. */
let failures: Record<string, Array<DbError | null>> = {}
/** Every write that reached the "database", in order. */
let writes: Array<{ table: string; op: Op; payload: Row }> = []

const TRANSIENT: DbError = { message: "connection reset by peer", code: "08006" }

/** Fail the next call of `op` on `table`, after letting `skip` calls through. */
function failNext(table: string, op: Op, { skip = 0, error = TRANSIENT }: { skip?: number; error?: DbError } = {}) {
  const queue = (failures[`${table}.${op}`] ??= [])
  for (let i = 0; i < skip; i++) queue.push(null)
  queue.push(error)
}

const PRIMARY_KEY: Record<string, string> = { stripe_processed_events: "event_id", deep_assessments: "stripe_session_id" }

function query(table: string) {
  let op: Op = "select"
  let payload: Row = {}
  let onConflict = ""
  const filters: Array<[string, unknown]> = []
  const rows = () => (tables[table] ??= [])
  const matching = () => rows().filter((r) => filters.every(([k, v]) => r[k] === v))

  function execute(mode: "many" | "single" | "maybeSingle"): Result {
    const failure = failures[`${table}.${op}`]?.shift() ?? null
    if (failure) return { data: null, error: failure }
    if (op === "select") {
      const found = matching()
      if (mode === "many") return { data: found, error: null }
      if (found.length === 1) return { data: { ...found[0] }, error: null }
      if (found.length === 0 && mode === "maybeSingle") return { data: null, error: null }
      return { data: null, error: { message: "JSON object requested, multiple (or no) rows returned", code: "PGRST116" } }
    }
    writes.push({ table, op, payload })
    if (op === "insert") {
      const pk = PRIMARY_KEY[table]
      if (pk && rows().some((r) => r[pk] === payload[pk])) {
        return { data: null, error: { message: "duplicate key value violates unique constraint", code: "23505" } }
      }
      rows().push({ ...payload })
    } else if (op === "update") {
      for (const r of matching()) Object.assign(r, payload)
    } else {
      const existing = rows().find((r) => r[onConflict] === payload[onConflict])
      if (existing) Object.assign(existing, payload)
      else rows().push({ ...payload })
    }
    return { data: null, error: null }
  }

  const builder = {
    select: () => builder,
    eq: (col: string, val: unknown) => { filters.push([col, val]); return builder },
    insert: (p: Row) => { op = "insert"; payload = p; return builder },
    update: (p: Row) => { op = "update"; payload = p; return builder },
    upsert: (p: Row, opts?: { onConflict?: string }) => {
      op = "upsert"; payload = p; onConflict = opts?.onConflict ?? ""; return builder
    },
    single: async () => execute("single"),
    maybeSingle: async () => execute("maybeSingle"),
    then: (resolve: (v: Result) => unknown, reject?: (e: unknown) => unknown) =>
      Promise.resolve(execute("many")).then(resolve, reject),
  }
  return builder
}

/* ── Module mocks ──────────────────────────────────────────────────────── */
type TestEvent = { id: string; type: string; data: { object: unknown } }
let constructResult: TestEvent | Error = new Error("not configured")

const mocks = vi.hoisted(() => ({
  sendEmail: vi.fn(async (_opts: unknown) => ({ ok: true })),
  logServerEvent: vi.fn(async (_name: string, _userId: string, _meta?: Record<string, string>) => {}),
  reportError: vi.fn(async (_context: string, _err: unknown) => {}),
  retrieveSubscription: vi.fn(async (_id: string) => ({ current_period_end: 1_900_000_000 })),
  resolvePaidReportSummary: vi.fn(async (): Promise<unknown> => null),
}))

vi.mock("@/lib/stripe-server", () => ({
  stripe: {
    webhooks: {
      constructEvent: () => {
        if (constructResult instanceof Error) throw constructResult
        return constructResult
      },
    },
    subscriptions: { retrieve: (id: string) => mocks.retrieveSubscription(id) },
  },
}))
vi.mock("@/lib/supabase", () => ({ getSupabase: () => ({ from: (table: string) => query(table) }) }))
vi.mock("@/lib/email/send", () => ({ sendEmail: (opts: unknown) => mocks.sendEmail(opts) }))
vi.mock("@/lib/statsig-server", () => ({
  logServerEvent: (name: string, userId: string, meta?: Record<string, string>) =>
    mocks.logServerEvent(name, userId, meta),
}))
vi.mock("@/lib/report-error", () => ({
  reportError: (context: string, err: unknown) => mocks.reportError(context, err),
}))
vi.mock("@/lib/email/welcome-subscription-email", () => ({ welcomeSubscriptionEmailHtml: () => "<p>welcome</p>" }))
vi.mock("@/lib/email/paid-onboarding-email", () => ({
  cancellationEmail: () => ({ subject: "Sorry to see you go", html: "<p>bye</p>" }),
}))
vi.mock("@/lib/paid-report-session", () => ({
  resolvePaidReportSummary: () => mocks.resolvePaidReportSummary(),
  isCheckoutSessionSettled: (s: { payment_status?: string }) =>
    s.payment_status === "paid" || s.payment_status === "no_payment_required",
}))
vi.mock("@/lib/membership", () => ({
  tierFromPriceId: (priceId: string) =>
    ({ price_member: "member", price_grow: "grow", price_transform: "transform" } as Record<string, string>)[priceId] ?? null,
  isFoundingMember: () => false,
}))
// decideTrialActivation (lib/auth/reconcile-account) is deliberately NOT mocked:
// the trial policy under test is the real one.

/* ── Helpers ───────────────────────────────────────────────────────────── */
const PERIOD_END = 1_900_000_000
const PERIOD_END_ISO = new Date(PERIOD_END * 1000).toISOString()
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000

const SUMMARY = {
  tier: "personal",
  overall: 62,
  subScores: { diversity: 60, feeding: 64 },
  profile: { type: "Builder", tagline: "t", description: "d" },
  email: "buyer@example.com",
}

async function deliver(event: TestEvent, headers: Record<string, string> = { "stripe-signature": "sig" }) {
  constructResult = event
  const { POST } = await import("@/app/api/stripe/webhook/route")
  const res = await POST(
    new NextRequest("http://localhost/api/stripe/webhook", { method: "POST", headers, body: "{}" }),
  )
  return { status: res.status, body: await res.json() }
}

const rowsOf = (table: string) => tables[table] ?? []
const profile = () => rowsOf("profiles").find((r) => r.id === "user-1")!
const processedIds = () => rowsOf("stripe_processed_events").map((r) => r.event_id)
const analytics = (name: string) => mocks.logServerEvent.mock.calls.filter((c) => c[0] === name).length
const writesTo = (table: string, op?: Op) => writes.filter((w) => w.table === table && (!op || w.op === op))

function checkoutCompleted(id: string, session: Row = {}): TestEvent {
  return {
    id,
    type: "checkout.session.completed",
    data: {
      object: {
        id: "cs_test_1",
        mode: "payment",
        payment_status: "paid",
        amount_total: 4900,
        currency: "eur",
        customer_details: { email: "buyer@example.com" },
        ...session,
      },
    },
  }
}

function subscriptionEvent(type: string, id: string, sub: Row = {}, priceId = "price_member"): TestEvent {
  return {
    id,
    type,
    data: {
      object: {
        id: "sub_1",
        customer: "cus_1",
        status: "active",
        created: 1_800_000_000,
        current_period_end: PERIOD_END,
        items: { data: [{ price: { id: priceId, unit_amount: 2499, currency: "eur", recurring: { interval: "month" } } }] },
        ...sub,
      },
    },
  }
}

function invoiceEvent(type: string, id: string): TestEvent {
  return { id, type, data: { object: { id: "in_1", customer: "cus_1", subscription: "sub_1" } } }
}

/** A failed delivery must leave no acknowledgement behind and must be reported. */
function expectRetryable(res: { status: number; body: unknown }, eventId: string) {
  expect(res.status).toBe(500)
  expect(res.body).toEqual({ error: "Handler error" })
  expect(processedIds()).not.toContain(eventId)
  expect(mocks.reportError).toHaveBeenCalledWith("stripe-webhook", expect.any(Error))
}

function seedProfile(overrides: Row = {}) {
  tables.profiles = [{
    id: "user-1",
    email: "buyer@example.com",
    name: "Buyer",
    stripe_customer_id: "cus_1",
    membership_tier: "free",
    membership_status: "inactive",
    trial_expires_at: null,
    ...overrides,
  }]
}

beforeEach(() => {
  vi.useRealTimers()
  tables = {}
  failures = {}
  writes = []
  seedProfile()
  constructResult = new Error("signature verification failed")
  vi.clearAllMocks()
  mocks.resolvePaidReportSummary.mockResolvedValue(SUMMARY)
  process.env.STRIPE_WEBHOOK_SECRET = "whsec_test"
  process.env.RESEND_API_KEY = "re_test"
  process.env.EMAIL_FROM = "hello@example.com"
})

/* ── Guard rails ───────────────────────────────────────────────────────── */
describe("/api/stripe/webhook guard rails", () => {
  it("500s when STRIPE_WEBHOOK_SECRET is not configured", async () => {
    delete process.env.STRIPE_WEBHOOK_SECRET
    const res = await deliver(invoiceEvent("invoice.payment_failed", "evt_x"))
    expect(res.status).toBe(500)
    expect(writes).toEqual([])
  })

  it("400s when the stripe-signature header is missing", async () => {
    const res = await deliver(invoiceEvent("invoice.payment_failed", "evt_x"), {})
    expect(res.status).toBe(400)
    expect(res.body.error).toBe("Missing stripe-signature header")
    expect(writes).toEqual([])
  })

  it("400s when signature verification fails", async () => {
    const { POST } = await import("@/app/api/stripe/webhook/route")
    constructResult = new Error("No signatures found matching the expected signature")
    const res = await POST(
      new NextRequest("http://localhost/api/stripe/webhook", {
        method: "POST", headers: { "stripe-signature": "bad-sig" }, body: "{}",
      }),
    )
    expect(res.status).toBe(400)
    expect((await res.json()).error).toBe("Invalid signature")
    expect(writes).toEqual([])
  })

  it("dedupes an already-processed event without reprocessing or re-marking it", async () => {
    tables.stripe_processed_events = [{ event_id: "evt_1", event_type: "customer.subscription.deleted" }]
    const res = await deliver(subscriptionEvent("customer.subscription.deleted", "evt_1"))
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ received: true, deduped: true })
    expect(writes).toEqual([])
    expect(profile().membership_status).toBe("inactive")
  })

  it("acknowledges an unknown event type and records it as processed", async () => {
    const res = await deliver({ id: "evt_2", type: "some.future.event", data: { object: {} } })
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ received: true })
    expect(writesTo("stripe_processed_events")).toEqual([
      { table: "stripe_processed_events", op: "insert", payload: { event_id: "evt_2", event_type: "some.future.event" } },
    ])
  })

  it("still answers 200 when a concurrent delivery already recorded the event (23505)", async () => {
    failNext("stripe_processed_events", "insert", { error: { message: "duplicate key", code: "23505" } })
    const res = await deliver(invoiceEvent("invoice.payment_failed", "evt_3"))
    expect(res.status).toBe(200)
    expect(profile().membership_status).toBe("past_due")
  })

  it("answers 200 when only the processed-event marker fails: the required state is already applied", async () => {
    failNext("stripe_processed_events", "insert")
    const res = await deliver(invoiceEvent("invoice.payment_failed", "evt_4"))
    expect(res.status).toBe(200)
    expect(profile().membership_status).toBe("past_due")
    expect(processedIds()).toEqual([])
  })
})

/* ── checkout.session.completed ────────────────────────────────────────── */
describe("checkout.session.completed", () => {
  it("grants the 30-day trial, creates the deep_assessments row and records the event once", async () => {
    const before = Date.now()
    const res = await deliver(checkoutCompleted("evt_c1"))
    expect(res).toEqual({ status: 200, body: { received: true } })

    expect(profile()).toMatchObject({ membership_tier: "trial", membership_status: "active" })
    const expires = new Date(profile().trial_expires_at as string).getTime()
    expect(expires).toBeGreaterThanOrEqual(before + THIRTY_DAYS_MS)

    expect(rowsOf("deep_assessments")).toHaveLength(1)
    expect(rowsOf("deep_assessments")[0]).toMatchObject({
      stripe_session_id: "cs_test_1",
      email: "buyer@example.com",
      tier: "personal",
      status: "in_progress",
    })
    expect(processedIds()).toEqual(["evt_c1"])
    expect(analytics("report_purchased")).toBe(1)
    expect(analytics("trial_started")).toBe(1)
  })

  it("creates the row but writes no profile when the buyer has no account yet", async () => {
    mocks.resolvePaidReportSummary.mockResolvedValue({ ...SUMMARY, email: "new@example.com" })
    const res = await deliver(checkoutCompleted("evt_c2"))
    expect(res.status).toBe(200)
    expect(writesTo("profiles")).toEqual([])
    expect(rowsOf("deep_assessments")).toHaveLength(1)
    expect(processedIds()).toEqual(["evt_c2"])
    expect(analytics("report_purchased")).toBe(0)
  })

  it("treats an ambiguous email (two profiles, PGRST116) as no account, as before", async () => {
    tables.profiles.push({ ...profile(), id: "user-2" })
    const res = await deliver(checkoutCompleted("evt_c3"))
    expect(res.status).toBe(200)
    expect(writesTo("profiles")).toEqual([])
    expect(rowsOf("deep_assessments")).toHaveLength(1)
    expect(processedIds()).toEqual(["evt_c3"])
  })

  it("ignores subscription-mode and unsettled sessions", async () => {
    expect((await deliver(checkoutCompleted("evt_c4", { mode: "subscription" }))).status).toBe(200)
    expect((await deliver(checkoutCompleted("evt_c5", { payment_status: "unpaid" }))).status).toBe(200)
    expect(writes.filter((w) => w.table !== "stripe_processed_events")).toEqual([])
    expect(processedIds()).toEqual(["evt_c4", "evt_c5"])
  })

  it("never downgrades an existing subscriber to a trial", async () => {
    seedProfile({ membership_tier: "member", membership_status: "active" })
    const res = await deliver(checkoutCompleted("evt_c6"))
    expect(res.status).toBe(200)
    expect(profile()).toMatchObject({ membership_tier: "member", membership_status: "active" })
    expect(analytics("report_purchased")).toBe(1)
    expect(analytics("trial_started")).toBe(0)
  })

  it("trial write fails → 500, not recorded, nothing else written; the retry completes exactly once", async () => {
    failNext("profiles", "update")
    expectRetryable(await deliver(checkoutCompleted("evt_c7")), "evt_c7")
    expect(profile().membership_tier).toBe("free")
    expect(rowsOf("deep_assessments")).toEqual([])
    expect(analytics("report_purchased")).toBe(0)

    const retry = await deliver(checkoutCompleted("evt_c7"))
    expect(retry.status).toBe(200)
    expect(profile().membership_tier).toBe("trial")
    expect(rowsOf("deep_assessments")).toHaveLength(1)
    expect(processedIds()).toEqual(["evt_c7"])

    const redelivery = await deliver(checkoutCompleted("evt_c7"))
    expect(redelivery.body).toEqual({ received: true, deduped: true })
    expect(analytics("report_purchased")).toBe(1)
    expect(analytics("trial_started")).toBe(1)
  })

  it("deep_assessments insert fails → 500, not recorded; the retry creates the row and fires analytics once", async () => {
    vi.useFakeTimers({ toFake: ["Date"] })
    const t0 = Date.parse("2026-10-07T12:00:00.000Z")
    vi.setSystemTime(t0)
    failNext("deep_assessments", "insert")
    expectRetryable(await deliver(checkoutCompleted("evt_c8")), "evt_c8")
    // The trial write ran before the failure and is not rolled back.
    expect(profile()).toMatchObject({ membership_tier: "trial", trial_expires_at: new Date(t0 + THIRTY_DAYS_MS).toISOString() })
    expect(analytics("report_purchased")).toBe(0)

    // Stripe retries a minute later. decideTrialActivation re-grants from "now",
    // so the trial ends one minute later than it would have — the documented
    // residual of not rolling back the first write.
    vi.setSystemTime(t0 + 60_000)
    const retry = await deliver(checkoutCompleted("evt_c8"))
    vi.useRealTimers()
    expect(retry.status).toBe(200)
    expect(rowsOf("deep_assessments")).toHaveLength(1)
    expect(profile().trial_expires_at).toBe(new Date(t0 + 60_000 + THIRTY_DAYS_MS).toISOString())
    expect(processedIds()).toEqual(["evt_c8"])
    expect(analytics("report_purchased")).toBe(1)
    expect(analytics("trial_started")).toBe(1)
  })

  it("a retry re-asserts the session fields but never moves an assessment the buyer has progressed", async () => {
    failNext("profiles", "update")
    expectRetryable(await deliver(checkoutCompleted("evt_c10")), "evt_c10")

    // Before Stripe retries, the buyer opens the paid session: generate-deep-questions
    // creates the row and they start answering.
    tables.deep_assessments = [{
      stripe_session_id: "cs_test_1",
      email: "buyer@example.com",
      tier: "personal",
      free_scores: { overall: 62 },
      questions: ["q1"],
      answers: { q1: "a" },
      status: "questions_generated",
      updated_at: "2026-10-07T12:00:00.000Z",
    }]

    expect((await deliver(checkoutCompleted("evt_c10"))).status).toBe(200)
    expect(rowsOf("deep_assessments")).toHaveLength(1)
    expect(rowsOf("deep_assessments")[0]).toMatchObject({
      status: "questions_generated",
      updated_at: "2026-10-07T12:00:00.000Z",
      questions: ["q1"],
      answers: { q1: "a" },
      tier: "personal",
      free_scores: expect.objectContaining({ overall: 62, subScores: SUMMARY.subScores }),
    })
    expect(profile().membership_tier).toBe("trial")
    expect(processedIds()).toEqual(["evt_c10"])
  })

  it("existing row whose session-field update fails → 500, not recorded", async () => {
    tables.deep_assessments = [{ stripe_session_id: "cs_test_1", status: "questions_generated" }]
    failNext("deep_assessments", "update")
    expectRetryable(await deliver(checkoutCompleted("evt_c11")), "evt_c11")
  })

  it("profile lookup error → 500 before anything is written (not mistaken for 'no account')", async () => {
    failNext("profiles", "select")
    expectRetryable(await deliver(checkoutCompleted("evt_c9")), "evt_c9")
    expect(writes).toEqual([])

    expect((await deliver(checkoutCompleted("evt_c9"))).status).toBe(200)
    expect(profile().membership_tier).toBe("trial")
  })
})

/* ── customer.subscription.created ─────────────────────────────────────── */
describe("customer.subscription.created", () => {
  const created = (id: string, priceId?: string) => subscriptionEvent("customer.subscription.created", id, {}, priceId)

  it("activates the membership, logs one subscription_events row, sends one welcome email", async () => {
    seedProfile({ membership_tier: "trial", trial_expires_at: "2099-01-01T00:00:00.000Z" })
    const res = await deliver(created("evt_s1"))
    expect(res.status).toBe(200)
    expect(profile()).toMatchObject({
      membership_tier: "member",
      membership_status: "active",
      stripe_subscription_id: "sub_1",
      membership_expires_at: PERIOD_END_ISO,
      is_founding_member: false,
      trial_expires_at: null,
    })
    expect(rowsOf("subscription_events")).toEqual([
      { user_id: "user-1", event_type: "subscribed", from_tier: null, to_tier: "member", stripe_event_id: "evt_s1" },
    ])
    expect(mocks.sendEmail).toHaveBeenCalledTimes(1)
    expect(analytics("subscription_started")).toBe(1)
    expect(processedIds()).toEqual(["evt_s1"])
  })

  it("acknowledges an unknown price or customer without writing state", async () => {
    expect((await deliver(created("evt_s2", "price_unknown"))).status).toBe(200)
    expect((await deliver(subscriptionEvent("customer.subscription.created", "evt_s3", { customer: "cus_unknown" }))).status).toBe(200)
    expect(writes.filter((w) => w.table !== "stripe_processed_events")).toEqual([])
    expect(processedIds()).toEqual(["evt_s2", "evt_s3"])
  })

  it("profile update fails → 500, no record/email/analytics; the retry does each exactly once", async () => {
    failNext("profiles", "update")
    expectRetryable(await deliver(created("evt_s4")), "evt_s4")
    expect(profile().membership_tier).toBe("free")
    expect(rowsOf("subscription_events")).toEqual([])
    expect(mocks.sendEmail).not.toHaveBeenCalled()
    expect(analytics("subscription_started")).toBe(0)

    expect((await deliver(created("evt_s4"))).status).toBe(200)
    expect((await deliver(created("evt_s4"))).body).toEqual({ received: true, deduped: true })
    expect(profile().membership_tier).toBe("member")
    expect(rowsOf("subscription_events")).toHaveLength(1)
    expect(mocks.sendEmail).toHaveBeenCalledTimes(1)
    expect(analytics("subscription_started")).toBe(1)
    expect(processedIds()).toEqual(["evt_s4"])
  })

  it("subscription_events insert fails → 500 before the email; the retry logs one row and sends one email", async () => {
    failNext("subscription_events", "insert")
    expectRetryable(await deliver(created("evt_s5")), "evt_s5")
    expect(mocks.sendEmail).not.toHaveBeenCalled()

    expect((await deliver(created("evt_s5"))).status).toBe(200)
    expect(profile().membership_tier).toBe("member")
    expect(rowsOf("subscription_events")).toHaveLength(1)
    expect(mocks.sendEmail).toHaveBeenCalledTimes(1)
    expect(analytics("subscription_started")).toBe(1)
  })

  it("customer lookup error → 500 (not mistaken for 'unknown customer')", async () => {
    failNext("profiles", "select")
    expectRetryable(await deliver(created("evt_s6")), "evt_s6")
    expect(writes).toEqual([])
  })

  it("a failed welcome email does not fail the event", async () => {
    mocks.sendEmail.mockRejectedValueOnce(new Error("resend down"))
    const res = await deliver(created("evt_s7"))
    expect(res.status).toBe(200)
    expect(processedIds()).toEqual(["evt_s7"])
  })
})

/* ── customer.subscription.updated ─────────────────────────────────────── */
describe("customer.subscription.updated", () => {
  const updated = (id: string, sub: Row = {}) => subscriptionEvent("customer.subscription.updated", id, sub)

  it("records an upgrade with its tier change and analytics event", async () => {
    seedProfile({ membership_tier: "grow", membership_status: "active" })
    const res = await deliver(updated("evt_u1"))
    expect(res.status).toBe(200)
    expect(profile()).toMatchObject({ membership_tier: "member", membership_status: "active", membership_expires_at: PERIOD_END_ISO })
    expect(rowsOf("subscription_events")).toEqual([
      { user_id: "user-1", event_type: "upgraded", from_tier: "grow", to_tier: "member", stripe_event_id: "evt_u1" },
    ])
    expect(analytics("subscription_upgraded")).toBe(1)
  })

  it("maps a status-only change without a tier-change analytics event", async () => {
    seedProfile({ membership_tier: "member", membership_status: "active" })
    expect((await deliver(updated("evt_u2", { status: "past_due" }))).status).toBe(200)
    expect(profile().membership_status).toBe("past_due")
    expect(rowsOf("subscription_events")[0]).toMatchObject({ event_type: "updated" })
    expect(analytics("subscription_upgraded") + analytics("subscription_downgraded")).toBe(0)
  })

  it("profile update fails → 500, not recorded; the retry applies the upgrade once", async () => {
    seedProfile({ membership_tier: "grow", membership_status: "active" })
    failNext("profiles", "update")
    expectRetryable(await deliver(updated("evt_u3")), "evt_u3")
    expect(profile().membership_tier).toBe("grow")
    expect(rowsOf("subscription_events")).toEqual([])
    expect(analytics("subscription_upgraded")).toBe(0)

    expect((await deliver(updated("evt_u3"))).status).toBe(200)
    expect((await deliver(updated("evt_u3"))).body).toEqual({ received: true, deduped: true })
    expect(profile().membership_tier).toBe("member")
    expect(rowsOf("subscription_events")).toHaveLength(1)
    expect(analytics("subscription_upgraded")).toBe(1)
    expect(processedIds()).toEqual(["evt_u3"])
  })

  it("ignores a late update for a subscription the profile has since replaced", async () => {
    seedProfile({ membership_tier: "member", membership_status: "active", stripe_subscription_id: "sub_new" })
    expect((await deliver(updated("evt_u5", { status: "canceled" }))).status).toBe(200)
    expect(profile()).toMatchObject({ membership_status: "active", stripe_subscription_id: "sub_new" })
    expect(writesTo("profiles")).toEqual([])
    expect(rowsOf("subscription_events")).toEqual([])
    expect(processedIds()).toEqual(["evt_u5"])
  })

  it("current-tier read error → 500 before the profile is written", async () => {
    failNext("profiles", "select", { skip: 1 }) // the customer lookup succeeds; the tier read fails
    expectRetryable(await deliver(updated("evt_u4")), "evt_u4")
    expect(writes).toEqual([])
  })
})

/* ── customer.subscription.deleted ─────────────────────────────────────── */
describe("customer.subscription.deleted", () => {
  const deleted = (id: string) => subscriptionEvent("customer.subscription.deleted", id)

  it("downgrades to free/cancelled, logs one row, sends one cancellation email", async () => {
    seedProfile({ membership_tier: "member", membership_status: "active", stripe_subscription_id: "sub_1" })
    const res = await deliver(deleted("evt_d1"))
    expect(res.status).toBe(200)
    expect(profile()).toMatchObject({
      membership_tier: "free",
      membership_status: "cancelled",
      stripe_subscription_id: null,
      membership_expires_at: PERIOD_END_ISO,
    })
    expect(rowsOf("subscription_events")).toEqual([
      { user_id: "user-1", event_type: "cancelled", from_tier: "member", to_tier: "free", stripe_event_id: "evt_d1" },
    ])
    expect(mocks.sendEmail).toHaveBeenCalledTimes(1)
    expect(analytics("subscription_cancelled")).toBe(1)
    expect(processedIds()).toEqual(["evt_d1"])
  })

  it("profile update fails → 500, no email/analytics/record; the retry does each exactly once", async () => {
    seedProfile({ membership_tier: "member", membership_status: "active", stripe_subscription_id: "sub_1" })
    failNext("profiles", "update")
    expectRetryable(await deliver(deleted("evt_d2")), "evt_d2")
    expect(profile().membership_tier).toBe("member")
    expect(mocks.sendEmail).not.toHaveBeenCalled()
    expect(analytics("subscription_cancelled")).toBe(0)
    expect(rowsOf("subscription_events")).toEqual([])

    expect((await deliver(deleted("evt_d2"))).status).toBe(200)
    expect((await deliver(deleted("evt_d2"))).body).toEqual({ received: true, deduped: true })
    expect(profile().membership_status).toBe("cancelled")
    expect(rowsOf("subscription_events")).toHaveLength(1)
    expect(rowsOf("subscription_events")[0]).toMatchObject({ from_tier: "member" })
    expect(mocks.sendEmail).toHaveBeenCalledTimes(1)
    expect(analytics("subscription_cancelled")).toBe(1)
    expect(processedIds()).toEqual(["evt_d2"])
  })
})

describe("customer.subscription.deleted — superseded subscriptions", () => {
  it("a retried cancellation of an old subscription does not revoke a newer one", async () => {
    seedProfile({ membership_tier: "member", membership_status: "active", stripe_subscription_id: "sub_1" })
    failNext("subscription_events", "insert")
    expectRetryable(await deliver(subscriptionEvent("customer.subscription.deleted", "evt_d3")), "evt_d3")
    expect(profile().membership_status).toBe("cancelled")

    // Before Stripe retries, the customer subscribes again.
    const resubscribe = subscriptionEvent("customer.subscription.created", "evt_d3_new", { id: "sub_2" })
    expect((await deliver(resubscribe)).status).toBe(200)
    expect(profile()).toMatchObject({ membership_tier: "member", membership_status: "active", stripe_subscription_id: "sub_2" })

    const emailsBefore = mocks.sendEmail.mock.calls.length
    expect((await deliver(subscriptionEvent("customer.subscription.deleted", "evt_d3"))).status).toBe(200)
    expect(profile()).toMatchObject({ membership_tier: "member", membership_status: "active", stripe_subscription_id: "sub_2" })
    expect(mocks.sendEmail.mock.calls.length).toBe(emailsBefore)
    expect(analytics("subscription_cancelled")).toBe(0)
    expect(processedIds()).toEqual(["evt_d3_new", "evt_d3"])
  })
})

/* ── invoice.payment_failed ────────────────────────────────────────────── */
describe("invoice.payment_failed", () => {
  const failed = (id: string) => invoiceEvent("invoice.payment_failed", id)

  it("marks the membership past_due and logs payment_failed", async () => {
    seedProfile({ membership_tier: "member", membership_status: "active" })
    expect((await deliver(failed("evt_f1"))).status).toBe(200)
    expect(profile().membership_status).toBe("past_due")
    expect(rowsOf("subscription_events")).toEqual([
      { user_id: "user-1", event_type: "payment_failed", from_tier: null, to_tier: null, stripe_event_id: "evt_f1" },
    ])
    expect(processedIds()).toEqual(["evt_f1"])
  })

  it("profile update fails → 500, not recorded; the retry completes", async () => {
    seedProfile({ membership_tier: "member", membership_status: "active" })
    failNext("profiles", "update")
    expectRetryable(await deliver(failed("evt_f2")), "evt_f2")
    expect(profile().membership_status).toBe("active")
    expect(rowsOf("subscription_events")).toEqual([])

    expect((await deliver(failed("evt_f2"))).status).toBe(200)
    expect(profile().membership_status).toBe("past_due")
    expect(rowsOf("subscription_events")).toHaveLength(1)
    expect(processedIds()).toEqual(["evt_f2"])
  })

  it("subscription_events insert fails → 500; the retry logs exactly one row", async () => {
    failNext("subscription_events", "insert")
    expectRetryable(await deliver(failed("evt_f3")), "evt_f3")
    expect((await deliver(failed("evt_f3"))).status).toBe(200)
    expect((await deliver(failed("evt_f3"))).body).toEqual({ received: true, deduped: true })
    expect(rowsOf("subscription_events")).toHaveLength(1)
    expect(processedIds()).toEqual(["evt_f3"])
  })
})

/* ── invoice.payment_succeeded ─────────────────────────────────────────── */
describe("invoice.payment_succeeded", () => {
  const succeeded = (id: string) => invoiceEvent("invoice.payment_succeeded", id)

  it("reactivates the membership and extends it to the subscription's period end", async () => {
    seedProfile({ membership_tier: "member", membership_status: "past_due" })
    expect((await deliver(succeeded("evt_p1"))).status).toBe(200)
    expect(mocks.retrieveSubscription).toHaveBeenCalledWith("sub_1")
    expect(profile()).toMatchObject({ membership_status: "active", membership_expires_at: PERIOD_END_ISO })
    expect(processedIds()).toEqual(["evt_p1"])
  })

  it("profile update fails → 500, not recorded; the retry reactivates", async () => {
    seedProfile({ membership_tier: "member", membership_status: "past_due" })
    failNext("profiles", "update")
    expectRetryable(await deliver(succeeded("evt_p2")), "evt_p2")
    expect(profile().membership_status).toBe("past_due")

    expect((await deliver(succeeded("evt_p2"))).status).toBe(200)
    expect(profile().membership_status).toBe("active")
    expect(processedIds()).toEqual(["evt_p2"])
  })

  it("a Stripe API failure fetching the subscription → 500, not recorded", async () => {
    mocks.retrieveSubscription.mockRejectedValueOnce(new Error("stripe unavailable"))
    expectRetryable(await deliver(succeeded("evt_p3")), "evt_p3")
    expect(writesTo("profiles")).toEqual([])
  })
})
