/**
 * The buyer's answers must not reach Stripe, and the report must still resolve.
 *
 * Checkout used to put the overall score, five sub-scores, profile type and
 * description, foundation, selected add-on and email into Stripe checkout
 * metadata, because the report page had to rebuild the report after the
 * redirect and Stripe was the only thing that survived it (#244). The summary
 * now lives in `paid_report_intents` and Stripe receives an opaque token.
 *
 * Three things are pinned here, and they fail for different reasons:
 *
 *  1. Checkout fails closed. The row is written BEFORE the session exists, so a
 *     failure costs nothing — no session, no payment page, no charge. Getting
 *     this backwards takes €49 for a report that can never be resolved.
 *  2. The token is not sufficient on its own. Lookups match token AND session
 *     id, so a leaked or replayed token resolves to nothing.
 *  3. Legacy sessions still decode. Anyone mid-checkout when this deployed has
 *     already paid and carries only the old chunked metadata.
 */
import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"
import type Stripe from "stripe"
import {
  encodePaidReportSummary,
  resolvePaidReportSummary,
  SUMMARY_TOKEN_KEY,
  type PaidReportIntentReader,
  type PaidReportSummary,
} from "@/lib/paid-report-session"

const mockCheckoutCreate = vi.fn()
vi.mock("@/lib/stripe-server", () => ({
  stripe: { checkout: { sessions: { create: (...a: unknown[]) => mockCheckoutCreate(...a) } } },
}))

const mockGetSupabase = vi.fn()
vi.mock("@/lib/supabase", () => ({ getSupabase: () => mockGetSupabase() }))

/* ── A client that records writes and can fail a named operation ────────── */
function makeClient(fail: { insert?: boolean; update?: boolean } = {}) {
  const writes: { table: string; method: string; payload: unknown }[] = []
  const from = (table: string) => {
    let failed = false
    const chain: Record<string, unknown> = {}
    for (const m of ["select", "eq"]) chain[m] = () => chain
    chain.insert = (payload: unknown) => {
      writes.push({ table, method: "insert", payload })
      failed = Boolean(fail.insert)
      return chain
    }
    chain.update = (payload: unknown) => {
      writes.push({ table, method: "update", payload })
      failed = Boolean(fail.update)
      return chain
    }
    const result = () => ({ data: null, error: failed ? { message: `${table} exploded` } : null })
    chain.then = (resolve: (v: unknown) => void) => resolve(result())
    chain.maybeSingle = () => Promise.resolve(result())
    return chain
  }
  return { client: { from }, writes }
}

const VALID_BODY = {
  tier: "personal",
  overall: 56,
  subScores: { feed: 44, seed: 66, heal: 67 },
  profile: {
    type: "Emerging Balance",
    tagline: "A tagline.",
    description: "A description with prose in it.",
    color: "var(--icon-lime)",
  },
  email: "buyer@example.com",
  foundationType: "you",
  selectedAddon: "glucose",
  acknowledgedImmediateSupply: true,
}

function jsonReq(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

async function postCheckout(body: unknown = VALID_BODY) {
  const { POST } = await import("@/app/api/checkout/route")
  return POST(jsonReq(body))
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_key")
  mockCheckoutCreate.mockResolvedValue({
    id: "cs_test_intent_1",
    url: "https://checkout.stripe.com/c/pay/cs_test_intent_1",
    livemode: false,
  })
})

/* ── 1. Checkout persists first, and fails closed ───────────────────────── */

describe("checkout stores the summary server-side", () => {
  it("writes the intent before creating the Stripe session", async () => {
    const { client, writes } = makeClient()
    mockGetSupabase.mockReturnValue(client)

    const res = await postCheckout()
    expect(res.status).toBe(200)

    const insert = writes.find((w) => w.method === "insert")
    expect(insert?.table).toBe("paid_report_intents")
    const payload = insert!.payload as { token: string; summary: Record<string, unknown> }
    expect(payload.token).toMatch(/^[0-9a-f]{64}$/)
    expect(payload.summary).toMatchObject({ overall: 56, email: "buyer@example.com" })
  })

  it("binds the session id back to the intent", async () => {
    const { client, writes } = makeClient()
    mockGetSupabase.mockReturnValue(client)

    await postCheckout()

    const update = writes.find((w) => w.method === "update")
    // Readers match on token AND session id, so without this the token resolves
    // to nothing and the buyer's paid report is unreachable.
    expect(update?.payload).toEqual({ stripe_session_id: "cs_test_intent_1" })
  })

  it("refuses when the intent cannot be stored, before Stripe is called", async () => {
    const { client } = makeClient({ insert: true })
    mockGetSupabase.mockReturnValue(client)

    const res = await postCheckout()

    expect(res.status).toBe(503)
    expect(await res.json()).toMatchObject({ code: "checkout_unavailable" })
    // The consequential half: no session means no payment page, so nobody is
    // charged for a report whose summary was never stored.
    expect(mockCheckoutCreate).not.toHaveBeenCalled()
  })

  it("refuses when the bind fails, rather than returning a doomed checkout URL", async () => {
    const { client } = makeClient({ update: true })
    mockGetSupabase.mockReturnValue(client)

    const res = await postCheckout()

    expect(res.status).toBe(503)
    // The session exists but the buyer was never redirected, so an orphaned
    // session costs nothing. Returning the URL would take €49 for a report that
    // can never be resolved — the legacy metadata that used to back it up is no
    // longer written.
    expect(await res.json()).toMatchObject({ code: "checkout_unavailable" })
  })

  it("refuses when Supabase is not configured at all", async () => {
    mockGetSupabase.mockReturnValue(null)

    const res = await postCheckout()

    expect(res.status).toBe(503)
    expect(mockCheckoutCreate).not.toHaveBeenCalled()
  })

  it("sends Stripe nothing that describes the buyer", async () => {
    const { client } = makeClient()
    mockGetSupabase.mockReturnValue(client)

    await postCheckout()

    const [params] = mockCheckoutCreate.mock.calls[0] as [{ metadata: Record<string, string> }]
    const metadata = params.metadata

    // The real guarantee: an exact allowlist of keys. Nothing describing the
    // buyer can be present if only these four exist.
    expect(Object.keys(metadata).sort()).toEqual([
      "acknowledged_at",
      "acknowledged_immediate_supply",
      "report_tier",
      SUMMARY_TOKEN_KEY,
    ])

    // Distinctive values, scanned across the whole blob — none of these can
    // collide with hex or a timestamp.
    const blob = JSON.stringify(metadata)
    for (const leak of ["Emerging Balance", "A description with prose", "buyer@example.com", "glucose"]) {
      expect(blob, `Stripe metadata must not contain ${leak}`).not.toContain(leak)
    }

    // The score is two digits, and this used to be scanned against the whole
    // blob including the 64-hex `summary_token` and an ISO timestamp. That is a
    // coin flip rather than an assertion: a random 64-hex string contains any
    // given byte pair about 22% of the time, and it was measured failing 1 run
    // in 6 before this was fixed. Scan the fields that could actually carry a
    // score, and pin the two generated fields by SHAPE instead — which is a
    // stronger statement about them than a substring scan ever made.
    expect(metadata[SUMMARY_TOKEN_KEY]).toMatch(/^[0-9a-f]{64}$/)
    expect(metadata.acknowledged_at).toMatch(/^\d{4}-\d{2}-\d{2}T/)
    const describable = Object.entries(metadata)
      .filter(([k]) => k !== SUMMARY_TOKEN_KEY && k !== "acknowledged_at")
      .map(([, v]) => String(v))
      .join("|")
    expect(describable, "no metadata field may carry the buyer's score").not.toContain("56")
  })
})

/* ── 2. Resolution, including the adversarial cases ─────────────────────── */

const SUMMARY: PaidReportSummary = {
  tier: "personal",
  overall: 56,
  subScores: { feed: 44, seed: 66, heal: 67 },
  profile: { type: "Emerging Balance", tagline: "A tagline.", description: "A description." },
  email: "buyer@example.com",
  foundationType: "you",
  selectedAddon: "glucose",
}

/** A reader that only answers for one exact (token, session) pair. */
function readerFor(token: string, sessionId: string, summary: unknown = SUMMARY): PaidReportIntentReader {
  return {
    from: () => {
      const asked: Record<string, string> = {}
      const chain = {
        select: () => chain,
        eq: (column: string, value: string) => {
          asked[column] = value
          return chain
        },
        maybeSingle: () =>
          Promise.resolve(
            asked.token === token && asked.stripe_session_id === sessionId
              ? { data: { summary }, error: null }
              : { data: null, error: null },
          ),
      }
      return chain
    },
  } as unknown as PaidReportIntentReader
}

function session(metadata: Record<string, string>, id = "cs_1"): Stripe.Checkout.Session {
  return { id, metadata, client_reference_id: null } as unknown as Stripe.Checkout.Session
}

describe("resolving a summary", () => {
  it("reads the stored row for a matching token and session", async () => {
    const resolved = await resolvePaidReportSummary(
      session({ [SUMMARY_TOKEN_KEY]: "tok_a" }),
      readerFor("tok_a", "cs_1"),
    )
    expect(resolved).toMatchObject({ overall: 56, email: "buyer@example.com" })
  })

  it("returns null for a token that does not exist", async () => {
    const resolved = await resolvePaidReportSummary(
      session({ [SUMMARY_TOKEN_KEY]: "tok_unknown" }),
      readerFor("tok_a", "cs_1"),
    )
    expect(resolved).toBeNull()
  })

  it("returns null when a token is replayed against a different session", async () => {
    // The reason lookups match on both: a token lifted from one checkout must
    // not read the summary of another.
    const resolved = await resolvePaidReportSummary(
      session({ [SUMMARY_TOKEN_KEY]: "tok_a" }, "cs_someone_else"),
      readerFor("tok_a", "cs_1"),
    )
    expect(resolved).toBeNull()
  })

  it("returns null for a stored row that fails validation", async () => {
    // A hand-edited row must not put unvalidated values into a paid report.
    const resolved = await resolvePaidReportSummary(
      session({ [SUMMARY_TOKEN_KEY]: "tok_a" }),
      readerFor("tok_a", "cs_1", { tier: "personal", overall: "not a number" }),
    )
    expect(resolved).toBeNull()
  })

  it("falls back to legacy chunked metadata", async () => {
    // Sessions created before this shipped carry only the old metadata, and
    // their buyers have already paid.
    const encoded = encodePaidReportSummary(SUMMARY)
    const chunks = encoded.match(/.{1,500}/g) ?? []
    const metadata: Record<string, string> = { result_summary_parts: String(chunks.length) }
    chunks.forEach((chunk, i) => (metadata[`result_summary_${i}`] = chunk))

    const resolved = await resolvePaidReportSummary(session(metadata), readerFor("tok_a", "cs_1"))
    expect(resolved).toMatchObject({ overall: 56, selectedAddon: "glucose" })
  })

  it("falls back to legacy metadata when the row read errors", async () => {
    const encoded = encodePaidReportSummary(SUMMARY)
    const failing = {
      from: () => ({
        select: () => ({
          eq: () => ({ eq: () => ({ maybeSingle: () => Promise.reject(new Error("down")) }) }),
        }),
      }),
    } as unknown as PaidReportIntentReader

    const resolved = await resolvePaidReportSummary(
      session({ [SUMMARY_TOKEN_KEY]: "tok_a", result_summary: encoded }),
      failing,
    )
    // A transport error must not fail a report that is still readable another way.
    expect(resolved).toMatchObject({ overall: 56 })
  })

  it("returns null with no token, no legacy metadata and no client", async () => {
    expect(await resolvePaidReportSummary(session({}), null)).toBeNull()
  })
})

/* ── 3. The writer is gone, not merely unused ───────────────────────────── */

describe("the metadata writer cannot be reintroduced by accident", () => {
  it("is no longer exported", async () => {
    const mod = await import("@/lib/paid-report-session")
    expect(Object.keys(mod)).not.toContain("paidReportSummaryMetadata")
  })

  it("has no caller anywhere in the tree", async () => {
    const { readFileSync, readdirSync, statSync } = await import("node:fs")
    const { join } = await import("node:path")
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
        if (full.includes("paid-report-session")) continue
        if (readFileSync(full, "utf8").includes("paidReportSummaryMetadata(")) offenders.push(full)
      }
    }
    for (const root of ["app", "lib", "components"]) walk(root)
    expect(offenders, "nothing may write the summary into Stripe metadata").toEqual([])
  })
})
