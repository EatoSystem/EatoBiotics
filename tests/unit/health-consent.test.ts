/**
 * Affirmative consent before health-derived data is stored.
 *
 * `app/privacy/page.tsx` §2 calls assessment responses sensitive personal data
 * and says we handle them with additional care. Nothing asked the person first,
 * and nothing recorded that they had agreed — so that sentence described an
 * intention rather than a lawful basis.
 *
 * The scope is every entry point that stores health-derived answers, not only
 * the paid one: the three free assessments write scores against an email in
 * `leads`, and the waitlist quiz writes a Food System profile and sub-scores to
 * the same table. Whether money changed hands is not what makes the data
 * sensitive, so it is not what decides where consent is required.
 */
import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"
import { readFileSync, readdirSync, statSync } from "node:fs"
import { join } from "node:path"
import {
  HEALTH_CONSENT_FIELD,
  HEALTH_CONSENT_SOURCES,
  type HealthConsentSource,
  HEALTH_CONSENT_STATEMENT,
  HEALTH_CONSENT_VERSION,
  hasHealthConsent,
  healthConsentStatementHash,
  recordHealthConsent,
} from "@/lib/health-consent"

const mockGetSupabase = vi.fn()
vi.mock("@/lib/supabase", () => ({ getSupabase: () => mockGetSupabase() }))
vi.mock("@/lib/supabase-server", () => ({ getUser: () => Promise.resolve(null) }))
const mockCheckoutCreate = vi.fn()
vi.mock("@/lib/stripe-server", () => ({
  stripe: { checkout: { sessions: { create: (...a: unknown[]) => mockCheckoutCreate(...a) } } },
}))
vi.mock("@/lib/email/send", () => ({ sendEmail: vi.fn().mockResolvedValue({ ok: true }) }))
vi.mock("@/lib/statsig-server", () => ({ logServerEvent: vi.fn() }))
vi.mock("@/lib/rate-limit", () => ({
  rateLimit: () => ({ allowed: true, remaining: 5, retryAfterSeconds: 0 }),
  getClientIp: () => "127.0.0.1",
  rateLimitResponse: (r: { retryAfterSeconds: number }) => ({
    body: { error: "Too many requests." },
    init: { status: 429, headers: { "Retry-After": String(r.retryAfterSeconds) } },
  }),
}))

function makeClient() {
  const writes: { table: string; payload: unknown }[] = []
  const from = (table: string) => {
    const chain: Record<string, unknown> = {}
    for (const m of ["select", "eq", "update", "upsert", "order", "limit"]) chain[m] = () => chain
    chain.insert = (payload: unknown) => {
      writes.push({ table, payload })
      return chain
    }
    chain.maybeSingle = () => Promise.resolve({ data: null, error: null })
    chain.single = () => Promise.resolve({ data: null, error: null })
    chain.then = (resolve: (v: unknown) => void) => resolve({ data: null, error: null })
    return chain
  }
  return { client: { from }, writes }
}

function post(url: string, body: unknown): NextRequest {
  return new NextRequest(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

let supabase = makeClient()
beforeEach(() => {
  vi.clearAllMocks()
  supabase = makeClient()
  mockGetSupabase.mockReturnValue(supabase.client)
  vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_key")
  mockCheckoutCreate.mockResolvedValue({
    id: "cs_test_1",
    url: "https://checkout.stripe.com/c/pay/cs_test_1",
    livemode: false,
  })
})

/* ── The statement and its record ───────────────────────────────────────── */

describe("what was agreed is recoverable", () => {
  it("pins the hash of the current statement to its version", () => {
    // If this fails, the statement text changed. Bump HEALTH_CONSENT_VERSION
    // and update this hash — that is the point. A consent record that does not
    // say WHAT was agreed lets a later copy edit silently reinterpret every
    // consent already given.
    expect(HEALTH_CONSENT_VERSION).toBe("2026-08-28.1")
    expect(healthConsentStatementHash()).toBe(
      healthConsentStatementHash(HEALTH_CONSENT_STATEMENT),
    )
    expect(healthConsentStatementHash()).toMatch(/^[0-9a-f]{64}$/)
  })

  it("names the processors the statement claims", () => {
    // The statement is the thing people actually read, so it has to be true of
    // the code: Supabase stores it, Anthropic generates the report.
    expect(HEALTH_CONSENT_STATEMENT).toContain("Supabase")
    expect(HEALTH_CONSENT_STATEMENT).toContain("Anthropic")
    expect(HEALTH_CONSENT_STATEMENT).toMatch(/withdraw consent/i)
  })

  it("gives a different hash for different text", () => {
    // Guards against a constant-returning stub passing the pin above.
    expect(healthConsentStatementHash("something else")).not.toBe(healthConsentStatementHash())
  })
})

describe("hasHealthConsent", () => {
  it("accepts only an explicit true", () => {
    expect(hasHealthConsent(true)).toBe(true)
    // The string "true" and a truthy 1 are what a sloppy client sends; neither
    // is a person ticking a box.
    for (const value of ["true", 1, "yes", {}, [], undefined, null, false]) {
      expect(hasHealthConsent(value), `${JSON.stringify(value)} must not count`).toBe(false)
    }
  })
})

describe("recordHealthConsent", () => {
  it("writes the version, the hash and the source", async () => {
    const ok = await recordHealthConsent(supabase.client, {
      email: "Person@Example.com",
      source: "assessment_gut",
    })

    expect(ok).toBe(true)
    const row = supabase.writes.find((w) => w.table === "consents")!.payload as Record<string, unknown>
    expect(row).toMatchObject({
      email: "person@example.com",
      kind: "health_processing",
      document_version: HEALTH_CONSENT_VERSION,
      source: "assessment_gut",
    })
    expect(row.statement_hash).toBe(healthConsentStatementHash())
  })

  it("refuses to write a record that identifies nobody", async () => {
    // Matches the CHECK on the table. A consent attached to neither an email
    // nor a user is not a record of anything.
    expect(await recordHealthConsent(supabase.client, { source: "waitlist" })).toBe(false)
    expect(supabase.writes).toHaveLength(0)
  })

  it("never throws, and reports failure", async () => {
    const exploding = { from: () => ({ insert: () => Promise.reject(new Error("down")) }) }
    await expect(
      recordHealthConsent(exploding, { email: "a@b.com", source: "waitlist" }),
    ).resolves.toBe(false)
  })
})

/* ── Enforced where the data is written ─────────────────────────────────── */

describe("the routes require consent before storing health data", () => {
  it("submit-lead refuses without it and writes nothing", async () => {
    const { POST } = await import("@/app/api/submit-lead/route")
    const res = await POST(
      post("http://localhost/api/submit-lead", {
        name: "Test",
        email: "a@b.com",
        ageBracket: "40–49",
      }),
    )

    expect(res.status).toBe(400)
    expect(await res.json()).toMatchObject({ code: "health_consent_required" })
    expect(supabase.writes).toHaveLength(0)
  })

  it("submit-lead records the consent alongside the lead", async () => {
    const { POST } = await import("@/app/api/submit-lead/route")
    await POST(
      post("http://localhost/api/submit-lead", {
        name: "Test",
        email: "a@b.com",
        ageBracket: "40–49",
        assessmentType: "mind",
        [HEALTH_CONSENT_FIELD]: true,
      }),
    )

    const consent = supabase.writes.find((w) => w.table === "consents")
    expect(consent, "the consent must be recorded, not just checked").toBeTruthy()
    expect((consent!.payload as { source: string }).source).toBe("assessment_mind")
  })

  it("waitlist refuses a quiz result without consent", async () => {
    const { POST } = await import("@/app/api/waitlist/route")
    const res = await POST(
      post("http://localhost/api/waitlist", {
        email: "a@b.com",
        result: { overall: 55, subScores: {}, profile: { type: "X" } },
      }),
    )

    expect(res.status).toBe(400)
    expect(await res.json()).toMatchObject({ code: "health_consent_required" })
  })

  /* Checkout was the one route this file never covered, which is how the
     Mind/Family gap survived: the consent was checked but its RECORD depended
     on an email nothing was sending. Asserting the check without the row is
     the shape of test that misses that. */
  const CHECKOUT_BODY = {
    tier: "personal",
    overall: 56,
    subScores: { feed: 44, seed: 66, heal: 67 },
    profile: { type: "Emerging Balance", tagline: "A tagline.", description: "A description." },
  }

  async function postCheckout(body: Record<string, unknown>) {
    const { POST } = await import("@/app/api/checkout/route")
    return POST(post("http://localhost/api/checkout", body))
  }

  it("checkout records the consent against the buyer's email", async () => {
    const res = await postCheckout({
      ...CHECKOUT_BODY,
      email: "Buyer@Example.com",
      [HEALTH_CONSENT_FIELD]: true,
      requestedImmediateStart: true,
    })

    expect(res.status).toBe(200)
    const consent = supabase.writes.find((w) => w.table === "consents")
    expect(consent, "the tick must leave a record, not just pass a check").toBeTruthy()
    expect(consent!.payload).toMatchObject({
      email: "buyer@example.com",
      kind: "health_processing",
      source: "deep_assessment",
    })
    // The hash of the statement actually rendered — checkout shows the shared
    // HealthConsentCheckbox, so the record and the screen agree.
    expect((consent!.payload as { statement_hash: string }).statement_hash).toBe(
      healthConsentStatementHash(),
    )
  })

  it("checkout refuses without the consent and writes nothing", async () => {
    const res = await postCheckout({
      ...CHECKOUT_BODY,
      email: "buyer@example.com",
      requestedImmediateStart: true,
    })

    expect(res.status).toBe(400)
    expect(await res.json()).toMatchObject({ code: "health_consent_required" })
    expect(supabase.writes).toHaveLength(0)
    expect(mockCheckoutCreate, "no payment page may exist").not.toHaveBeenCalled()
  })

  it("checkout still refuses without the immediate-start request", async () => {
    // The other half of the split contract. Threading an email through must
    // not weaken either check.
    const res = await postCheckout({
      ...CHECKOUT_BODY,
      email: "buyer@example.com",
      [HEALTH_CONSENT_FIELD]: true,
    })

    expect(res.status).toBe(400)
    expect(await res.json()).toMatchObject({ code: "immediate_start_required" })
    expect(supabase.writes.find((w) => w.table === "consents")).toBeUndefined()
  })

  it("checkout still completes, without a record, when no email is available", async () => {
    // Pinned as the honest current behaviour rather than left implicit. A
    // consent row needs an identifier (the `consents` CHECK requires an email
    // or a user id), so with neither there is nothing to write — and refusing
    // the purchase over it would be a policy change, not a bug fix. If a third
    // caller ever arrives with no email, this test says what happens.
    const res = await postCheckout({
      ...CHECKOUT_BODY,
      [HEALTH_CONSENT_FIELD]: true,
      requestedImmediateStart: true,
    })

    expect(res.status).toBe(200)
    expect(supabase.writes.find((w) => w.table === "consents")).toBeUndefined()
  })

  it("checkout sends the payment processor no consent data", async () => {
    await postCheckout({
      ...CHECKOUT_BODY,
      email: "buyer@example.com",
      [HEALTH_CONSENT_FIELD]: true,
      requestedImmediateStart: true,
    })

    const [params] = mockCheckoutCreate.mock.calls[0] as [{ metadata: Record<string, string> }]
    // The record belongs in `consents`. Whether someone consented to
    // health-data processing is not a payment fact.
    expect(Object.keys(params.metadata)).not.toContain("health_data_consent")
    expect(JSON.stringify(params.metadata)).not.toMatch(/healthDataConsent|health_processing/)
  })

  it("waitlist still accepts a bare email signup", async () => {
    // A bare { email } carries no health data, so requiring consent there would
    // be asking for permission to process something we are not processing.
    const { POST } = await import("@/app/api/waitlist/route")
    const res = await POST(post("http://localhost/api/waitlist", { email: "a@b.com" }))

    expect(res.status).toBe(200)
    expect(supabase.writes.find((w) => w.table === "consents")).toBeUndefined()
  })
})

/* ── Every surface asks ─────────────────────────────────────────────────── */

/**
 * Every surface that asks, mapped to the source it records under.
 *
 * This was a bare list of the four intros, with the count asserted as
 * `SOURCES.length === SURFACES.length + 1` and a comment reading
 * "+1 = deep_assessment" — i.e. one source with no surface, because checkout
 * folded its consent into the withdrawal acknowledgement instead of rendering
 * the shared control. That stopped being true when checkout was split into two
 * questions. Arithmetic standing in for a relationship goes stale silently;
 * naming the relationship does not.
 */
const CONSENT_SURFACES: Record<string, HealthConsentSource> = {
  "components/assessment/assessment-intro.tsx": "assessment_gut",
  "components/mind-assessment/mind-assessment-intro.tsx": "assessment_mind",
  "components/family-assessment/family-assessment-intro.tsx": "assessment_family",
  "components/waitlist/discover-flow.tsx": "waitlist",
  // Both checkout callers. They reach /api/checkout, which records
  // deep_assessment.
  "components/assessment/assessment-results.tsx": "deep_assessment",
  "components/assessment/personal-report-cta.tsx": "deep_assessment",
}

describe("every health-data entry point asks", () => {
  for (const file of Object.keys(CONSENT_SURFACES)) {
    it(`${file} renders the shared control, unticked`, () => {
      const source = readFileSync(file, "utf8")
      // Matched as rendered JSX with its props. `toContain` on the bare name
      // matches the import line, so deleting the render leaves it green —
      // a sabotage case walked through exactly that in the previous pass.
      expect(source).toMatch(/<HealthConsentCheckbox\s+checked=/)
      expect(source).toContain("useState(false)")
    })
  }

  it("uses one statement, not a paraphrase per surface", () => {
    // A control copied into some surfaces and reworded in others produces a
    // Privacy Policy that is true of part of the product. The statement lives
    // in lib/health-consent.ts and nowhere else.
    const offenders: string[] = []
    const walk = (dir: string) => {
      for (const entry of readdirSync(dir)) {
        if (entry === "node_modules" || entry.startsWith(".")) continue
        const full = join(dir, entry)
        if (statSync(full).isDirectory()) {
          walk(full)
          continue
        }
        if (!/\.(ts|tsx)$/.test(entry)) continue
        if (full === join("lib", "health-consent.ts")) continue
        if (readFileSync(full, "utf8").includes("may process my answers about my food")) {
          offenders.push(full)
        }
      }
    }
    for (const root of ["app", "components", "lib"]) walk(root)
    expect(offenders, "the consent statement must come from lib/health-consent.ts").toEqual([])
  })

  it("covers every source the code can record", () => {
    // A source with no surface is a flow nobody asks on; a surface recording a
    // source that does not exist is a row that will never validate. Both
    // directions, by name rather than by count.
    const covered = new Set(Object.values(CONSENT_SURFACES))
    expect([...covered].sort()).toEqual([...HEALTH_CONSENT_SOURCES].sort())
  })
})
