import { describe, it, expect, vi, beforeEach } from "vitest"

/**
 * Paid fulfilment must fail closed when Supabase is unavailable.
 *
 * Two surfaces, one rule: someone whose checkout Stripe has confirmed as settled
 * must never be handed generic content or a false success just because the
 * database cannot be read.
 *
 *  - `app/assessment/report/page.tsx` used to fall through to `FullReportClient`
 *    — the tier-shaped report built from none of their answers. It looked like
 *    fulfilment while substituting someone else's report for theirs.
 *  - `POST /api/submit-deep-assessment` used to skip every write and return
 *    `ok: true`, having paid for a Claude call, uploaded a PDF and emailed the
 *    customer, with no row to hang any of it on.
 *
 * The page is an async server component, so it is exercised the way it actually
 * runs: called as a function with its collaborators mocked, and the returned
 * React element inspected. That is a real render decision, not a source grep.
 */

/* ── Mocks ──────────────────────────────────────────────────────────────── */
const mockGetSupabase = vi.fn()
const mockSessionsRetrieve = vi.fn()
const mockGetUser = vi.fn()
const mockGetUserMembershipTier = vi.fn()

vi.mock("@/lib/supabase", () => ({ getSupabase: () => mockGetSupabase() }))
vi.mock("@/lib/stripe-server", () => ({
  stripe: { checkout: { sessions: { retrieve: (...a: unknown[]) => mockSessionsRetrieve(...a) } } },
}))
vi.mock("@/lib/supabase-server", () => ({ getUser: () => mockGetUser() }))
vi.mock("@/lib/membership", () => ({
  getUserMembershipTier: (...a: unknown[]) => mockGetUserMembershipTier(...a),
}))

const SESSION_ID = "cs_test_paid_report_unavailable"

/**
 * A settled paid session, built with the real encoder rather than hand-rolled
 * metadata — `getPaidReportSummaryFromSession` reads a base64 `result_summary`
 * blob and returns null for anything else, which would send the page down the
 * redirect path and quietly test nothing.
 */
async function settledSession() {
  const { encodePaidReportSummary } = await import("@/lib/paid-report-session")
  return {
    payment_status: "paid",
    metadata: {
      result_summary: encodePaidReportSummary({
        tier: "personal",
        overall: 58,
        subScores: { prebiotics: 62, probiotics: 38, postbiotics: 55 },
        profile: {
          type: "The Rebuilder",
          tagline: "Steady progress",
          description: "desc",
        },
      }),
    },
  }
}

beforeEach(async () => {
  vi.clearAllMocks()
  vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_key") // paid mode, not the dev bypass
  mockSessionsRetrieve.mockResolvedValue(await settledSession())
  mockGetUser.mockResolvedValue(null)
  mockGetUserMembershipTier.mockResolvedValue("free")
})

describe("the paid report page fails closed without Supabase", () => {
  it("renders the unavailable notice, not the generic full report", async () => {
    mockGetSupabase.mockReturnValue(null)

    const { default: ReportPage } = await import("@/app/assessment/report/page")
    const { PaidReportUnavailable } = await import(
      "@/components/assessment/paid-report-unavailable"
    )
    const { FullReportClient } = await import("@/components/assessment/full-report-client")

    const element = (await ReportPage({
      searchParams: Promise.resolve({ session_id: SESSION_ID }),
    })) as { type?: unknown }

    expect(
      element.type,
      "a paying customer must not be shown the generic tier report",
    ).not.toBe(FullReportClient)
    expect(element.type).toBe(PaidReportUnavailable)
  })

  it("does not redirect the buyer back into the questionnaire", async () => {
    // Redirecting implies the purchase did not register. `redirect()` throws a
    // NEXT_REDIRECT-digest error, so reaching a returned element proves it did
    // not happen.
    mockGetSupabase.mockReturnValue(null)

    const { default: ReportPage } = await import("@/app/assessment/report/page")

    const element = (await ReportPage({
      searchParams: Promise.resolve({ session_id: SESSION_ID }),
    })) as { type?: unknown }

    expect(element).toBeTruthy()
    expect(element.type).toBeTruthy()
  })
})

describe("the unavailable notice tells the buyer the truth", () => {
  it("confirms the payment and does not claim the report is lost", async () => {
    const { PaidReportUnavailable } = await import(
      "@/components/assessment/paid-report-unavailable"
    )
    const { renderToStaticMarkup } = await import("react-dom/server")
    const html = renderToStaticMarkup(PaidReportUnavailable())

    // The question the customer actually has at this moment.
    expect(html).toMatch(/payment went through/i)
    expect(html).toMatch(/report is safe/i)

    // Must not imply loss, failure, or that they need to start again.
    expect(html).not.toMatch(/lost|failed|start again|retake|questionnaire/i)

    // A way forward that is not "refresh and hope".
    expect(html).toMatch(/\/account/)
    expect(html).toMatch(/mailto:/)
  })
})
