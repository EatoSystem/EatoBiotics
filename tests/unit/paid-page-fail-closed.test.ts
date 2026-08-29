/**
 * The two paid PAGES must fail closed too — not just the API routes.
 *
 * Phase 0 replaced `!process.env.STRIPE_SECRET_KEY` in
 * generate-deep-questions and submit-deep-assessment, and I reported that
 * `app/assessment/deep/page.tsx` and `app/assessment/report/page.tsx` gated on
 * `isCheckoutSessionSettled` with no bypass. That was wrong. Both carried:
 *
 *     if (!process.env.STRIPE_SECRET_KEY) return <PaidUI />
 *
 * ABOVE the settled check — so a missing secret rendered the paid Consultation
 * and Report UI, and the settled check never ran. The API routes were closed
 * while the pages that front them stayed open.
 *
 * A policy consumed at the wrong point in a file is indistinguishable from no
 * policy, and only calling the page can tell.
 *
 * ── Two harness notes, both load-bearing ─────────────────────────────────────
 *
 * 1. NODE_ENV is never stubbed to "production" here. Doing so breaks vitest's
 *    JSX runtime (`jsxDEV is not a function`), and a page that throws for that
 *    reason looks exactly like a page that refused — so the first version of
 *    this file had "refusal" tests passing on a crash. Production-like runtimes
 *    are simulated with VERCEL_ENV instead, which is what the policy consults
 *    first anyway. The no-Vercel/NODE_ENV=production row is covered directly in
 *    paid-flow-policy.test.ts, where no rendering is involved.
 *
 * 2. Every refusal asserts NEXT_REDIRECT specifically. "It threw" is not
 *    evidence of a working gate.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { UNVERIFIED_PAID_FLOW_FLAG } from "@/lib/paid-flow-policy"

const mockRetrieveSession = vi.fn()

vi.mock("@/lib/stripe-server", () => ({
  stripe: { checkout: { sessions: { retrieve: (...a: unknown[]) => mockRetrieveSession(...a) } } },
}))
vi.mock("@/lib/supabase", () => ({ getSupabase: () => null }))
vi.mock("@/lib/supabase-server", () => ({ getUser: () => Promise.resolve(null) }))
vi.mock("@/lib/membership", () => ({ getUserMembershipTier: () => Promise.resolve("free") }))

const SESSION = "cs_test_page_1"

type PageModule = { default: (props: never) => Promise<unknown> }
type Attempt =
  | { rendered: true }
  | { rendered: false; reason: string }

async function attempt(load: () => Promise<PageModule>, params: Record<string, string>): Promise<Attempt> {
  const mod = await load()
  try {
    await mod.default({ searchParams: Promise.resolve(params) } as never)
    return { rendered: true }
  } catch (err) {
    return { rendered: false, reason: (err as Error)?.message ?? String(err) }
  }
}

/** Refused BY REDIRECT — not by crashing, which would prove nothing. */
function expectRedirected(out: Attempt, what: string) {
  expect(out.rendered, `${what} must not render`).toBe(false)
  if (!out.rendered) {
    expect(out.reason, `${what} must refuse by redirect, not by throwing: ${out.reason}`).toContain(
      "NEXT_REDIRECT",
    )
  }
}

const deepPage = () => import("@/app/assessment/deep/page") as unknown as Promise<PageModule>
const reportPage = () => import("@/app/assessment/report/page") as unknown as Promise<PageModule>

beforeEach(() => {
  vi.clearAllMocks()
  vi.resetModules()
  // Stripe absent — the condition that used to GRANT access.
  vi.stubEnv("STRIPE_SECRET_KEY", "")
  vi.stubEnv("VERCEL_ENV", "")
  mockRetrieveSession.mockRejectedValue(new Error("No API key provided"))
})
afterEach(() => vi.unstubAllEnvs())

describe("missing Stripe alone cannot open a paid page", () => {
  it("refuses the Consultation page", async () => {
    // No flag. Stripe missing. This is the exact request that used to render
    // the paid Consultation UI with mock scores.
    expectRedirected(await attempt(deepPage, { session_id: SESSION }), "the Consultation")
  })

  it("refuses the paid Report page", async () => {
    expectRedirected(await attempt(reportPage, { session_id: SESSION }), "the paid Report")
  })

  it("refuses both on Vercel production even with the flag set", async () => {
    // The flag cannot override the real deployment.
    vi.stubEnv(UNVERIFIED_PAID_FLOW_FLAG, "true")
    vi.stubEnv("VERCEL_ENV", "production")
    expectRedirected(await attempt(deepPage, { session_id: SESSION }), "the Consultation")
    vi.resetModules()
    expectRedirected(await attempt(reportPage, { session_id: SESSION }), "the paid Report")
  })

  it("refuses both on an unrecognised deployment environment", async () => {
    // An unknown VERCEL_ENV is not a licence to guess.
    vi.stubEnv(UNVERIFIED_PAID_FLOW_FLAG, "true")
    vi.stubEnv("VERCEL_ENV", "staging")
    expectRedirected(await attempt(deepPage, { session_id: SESSION }), "the Consultation")
    vi.resetModules()
    expectRedirected(await attempt(reportPage, { session_id: SESSION }), "the paid Report")
  })
})

describe("the explicitly-allowed development flow still works", () => {
  it("renders both pages with the flag set on a non-production runtime", async () => {
    // The point of the policy is to keep development usable while closing the
    // accidental grant. If this fails, the fix has over-corrected.
    vi.stubEnv(UNVERIFIED_PAID_FLOW_FLAG, "true")
    vi.stubEnv("VERCEL_ENV", "development")
    expect((await attempt(deepPage, { session_id: SESSION })).rendered).toBe(true)
    vi.resetModules()
    expect((await attempt(reportPage, { session_id: SESSION })).rendered).toBe(true)
  })

  it("renders on Vercel preview with the flag set", async () => {
    vi.stubEnv(UNVERIFIED_PAID_FLOW_FLAG, "true")
    vi.stubEnv("VERCEL_ENV", "preview")
    expect((await attempt(deepPage, { session_id: SESSION })).rendered).toBe(true)
  })

  it("refuses on Vercel preview when the flag is absent", async () => {
    // Non-production is not consent — the opt-in is the other half.
    vi.stubEnv("VERCEL_ENV", "preview")
    expectRedirected(await attempt(deepPage, { session_id: SESSION }), "the Consultation")
  })
})

describe("the explicit demo path stays isolated", () => {
  it("renders ?demo=true without Stripe and without the flag", async () => {
    // demo=true is a deliberate request for mock data, checked before the
    // policy. Closing the accidental grant must not take the intentional one
    // with it.
    expect((await attempt(deepPage, { demo: "true" })).rendered).toBe(true)
  })

  it("does not open the real session flow for a demo-shaped request", async () => {
    // The isolation that matters: a session id with no demo flag is still
    // refused, so demo mode is not a route into a real buyer's Consultation.
    expectRedirected(await attempt(deepPage, { session_id: SESSION }), "the Consultation")
  })
})
