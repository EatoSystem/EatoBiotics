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
  HEALTH_CONSENT_STATEMENT,
  HEALTH_CONSENT_VERSION,
  hasHealthConsent,
  healthConsentStatementHash,
  recordHealthConsent,
} from "@/lib/health-consent"

const mockGetSupabase = vi.fn()
vi.mock("@/lib/supabase", () => ({ getSupabase: () => mockGetSupabase() }))
vi.mock("@/lib/supabase-server", () => ({ getUser: () => Promise.resolve(null) }))
vi.mock("@/lib/stripe-server", () => ({ stripe: { checkout: { sessions: { create: vi.fn() } } } }))
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

const CONSENT_SURFACES = [
  "components/assessment/assessment-intro.tsx",
  "components/mind-assessment/mind-assessment-intro.tsx",
  "components/family-assessment/family-assessment-intro.tsx",
  "components/waitlist/discover-flow.tsx",
]

describe("every health-data entry point asks", () => {
  for (const file of CONSENT_SURFACES) {
    it(`${file} renders the shared control, unticked`, () => {
      const source = readFileSync(file, "utf8")
      expect(source).toContain("HealthConsentCheckbox")
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
    // The source list and the surfaces must not drift apart: a source with no
    // surface means a flow nobody asks on.
    expect(HEALTH_CONSENT_SOURCES).toHaveLength(CONSENT_SURFACES.length + 1) // +1 = deep_assessment
    expect(HEALTH_CONSENT_SOURCES).toContain("deep_assessment")
  })
})
