/**
 * The two things a buyer is asked at checkout, on every path that reaches
 * Stripe: consent to health-data processing, and a request to start now.
 *
 * They were one field until the 14-day full-refund policy landed. The old
 * single question asked for express consent to immediate supply of digital
 * content and told the buyer it ended their 14-day right to cancel — a
 * position this product could not support, because the report is created
 * AFTER the Consultation. EatoBiotics now refunds €49 in full for 14 days from
 * purchase regardless, so nothing is waived; and the health consent it also
 * stood in for now uses the shared control, so the statement hashed into the
 * consent record is the statement the buyer was shown.
 *
 * Terms sections 4 and 5 state that this is asked at checkout. The first
 * version of that change added a checkbox to `payment-cta.tsx` and nowhere
 * else. `payment-cta.tsx` turned out to be the one caller that was NOT live —
 * it hung off `premium-teaser.tsx`, which nothing rendered — so the checkbox
 * was added to dead code while both real paths went ungated, and the Terms
 * began asserting something untrue of every buyer. An unmet promise in the
 * Terms is a misrepresentation, where silence was merely an omission. Both dead
 * files are deleted; they also carried the retired €20/€40/€50 tier prices.
 *
 * The route check is the one that matters. A checkbox can be bypassed by
 * posting directly, and it leaves no record; the route refuses before Stripe is
 * called, and the session carries the consent afterwards.
 */
import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"
import { readFileSync, readdirSync, statSync } from "node:fs"
import { copyOf } from "./helpers/marketing-language"
import { join } from "node:path"

const mockCheckoutCreate = vi.fn()
vi.mock("@/lib/stripe-server", () => ({
  stripe: { checkout: { sessions: { create: (...a: unknown[]) => mockCheckoutCreate(...a) } } },
}))

/* Checkout writes the summary to paid_report_intents before creating a session
   (#244), so the route needs a client. Failure modes for that write have their
   own tests in paid-report-intents.test.ts; here it always succeeds. */
const mockGetSupabase = vi.fn()
vi.mock("@/lib/supabase", () => ({ getSupabase: () => mockGetSupabase() }))

function workingSupabase() {
  const from = () => {
    const chain: Record<string, unknown> = {}
    for (const m of ["select", "eq", "insert", "update"]) chain[m] = () => chain
    chain.then = (resolve: (v: unknown) => void) => resolve({ data: null, error: null })
    return chain
  }
  return { from }
}

const VALID_BODY = {
  tier: "personal",
  overall: 56,
  subScores: { feed: 44, seed: 66, heal: 67 },
  profile: {
    type: "Emerging Balance",
    tagline: "A tagline.",
    description: "A description.",
    color: "var(--icon-lime)",
  },
  email: "buyer@example.com",
  healthDataConsent: true,
}

function jsonReq(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_key")
  mockGetSupabase.mockReturnValue(workingSupabase())
  mockCheckoutCreate.mockResolvedValue({
    id: "cs_test_1",
    url: "https://checkout.stripe.com/c/pay/cs_test_1",
    livemode: false,
  })
})

async function post(body: unknown) {
  const { POST } = await import("@/app/api/checkout/route")
  return POST(jsonReq(body))
}

describe("the checkout route requires both answers", () => {
  it("refuses when the start request is absent", async () => {
    const res = await post(VALID_BODY)

    expect(res.status).toBe(400)
    expect(await res.json()).toMatchObject({ code: "immediate_start_required" })
    // The consequential half: no Stripe session, so no payment page exists and
    // nobody can be charged without having given consent.
    expect(mockCheckoutCreate).not.toHaveBeenCalled()
  })

  for (const value of [false, "true", 1, null]) {
    it(`refuses a non-true start request (${JSON.stringify(value)})`, async () => {
      // Strict `!== true`: the string "true" and a truthy 1 are what a sloppy
      // client sends, and neither is a person ticking a box.
      const res = await post({ ...VALID_BODY, requestedImmediateStart: value })

      expect(res.status).toBe(400)
      expect(mockCheckoutCreate).not.toHaveBeenCalled()
    })
  }

  it("refuses when the health consent is absent", async () => {
    // The half that used to ride along inside the immediate-supply sentence.
    // Checked first, and with the same code the waitlist and submit-lead
    // routes already return for it.
    const { healthDataConsent: _omitted, ...withoutConsent } = VALID_BODY
    const res = await post({ ...withoutConsent, requestedImmediateStart: true })

    expect(res.status).toBe(400)
    expect(await res.json()).toMatchObject({ code: "health_consent_required" })
    expect(mockCheckoutCreate).not.toHaveBeenCalled()
  })

  it("refuses the retired field shape outright, before Stripe", async () => {
    // A browser holding a stale bundle sends this. There is deliberately no
    // backwards-compatible alias: aliasing the retired field alone would not
    // help — the old client sends no health consent either — and aliasing it
    // for BOTH would let that client skip the health checkbox while the route
    // recorded a statement it never displayed, which is the defect being
    // fixed. The cost is bounded because this is refused before Stripe: the
    // buyer gets an error and a reload, never a charge.
    const { healthDataConsent: _omitted, ...stale } = VALID_BODY
    const res = await post({ ...stale, acknowledgedImmediateSupply: true })

    expect(res.status).toBe(400)
    expect(mockCheckoutCreate).not.toHaveBeenCalled()
  })

  it("proceeds when both are given", async () => {
    const res = await post({ ...VALID_BODY, requestedImmediateStart: true })

    expect(res.status).toBe(200)
    expect(mockCheckoutCreate).toHaveBeenCalledTimes(1)
  })

  it("records the start request on the Stripe session", async () => {
    await post({ ...VALID_BODY, requestedImmediateStart: true })

    const [params] = mockCheckoutCreate.mock.calls[0] as [{ metadata: Record<string, string> }]
    // The session outlives the request that created it, which is what makes it
    // a usable record of the request rather than transient form state.
    expect(params.metadata.requested_immediate_start).toBe("true")
    expect(params.metadata.requested_at).toMatch(/^\d{4}-\d{2}-\d{2}T/)
  })

  it("does not put the health consent in the payment processor", async () => {
    await post({ ...VALID_BODY, requestedImmediateStart: true })

    const [params] = mockCheckoutCreate.mock.calls[0] as [{ metadata: Record<string, string> }]
    // Its durable home is the `consents` table. Whether someone consented to
    // health-data processing is not a payment fact, and #244 exists because
    // buyer-describing data had drifted into Stripe once already.
    expect(Object.keys(params.metadata)).not.toContain("health_data_consent")
    expect(JSON.stringify(params.metadata)).not.toMatch(/healthDataConsent/)
  })

  it("refuses before validating the assessment payload", async () => {
    // Ordering matters for the message the buyer sees: someone who has not
    // ticked a box should be told that, not handed a "complete the free
    // assessment" error that does not describe their situation.
    const res = await post({ tier: "personal" })

    expect(await res.json()).toMatchObject({ code: "health_consent_required" })
  })
})

/* ── Every caller, not just the one ─────────────────────────────────────── */

const CALLERS = [
  "components/assessment/personal-report-cta.tsx",
  "components/assessment/assessment-results.tsx",
]

describe("every live checkout caller asks both questions", () => {
  it("finds exactly the callers this test knows about", () => {
    // If a fourth caller appears, the per-file assertions below would still pass
    // while the new path went ungated — the same failure that let two of three
    // paths ship unchecked. This fails instead.
    const sources = ["app", "components", "lib"]
    const found: string[] = []
    const walk = (dir: string) => {
      for (const entry of readdirSync(dir)) {
        if (entry === "node_modules" || entry.startsWith(".")) continue
        const full = join(dir, entry)
        if (statSync(full).isDirectory()) {
          walk(full)
          continue
        }
        if (!/\.(ts|tsx)$/.test(entry)) continue
        if (full.startsWith(join("app", "api", "checkout"))) continue
        if (readFileSync(full, "utf8").includes('"/api/checkout"')) found.push(full)
      }
    }
    for (const root of sources) walk(root)
    expect(found.sort()).toEqual([...CALLERS].sort())
  })

  for (const file of CALLERS) {
    it(`${file} sends both fields and blocks until both are ticked`, () => {
      const source = readFileSync(file, "utf8")
      // Must appear as keys in the request body, not merely be imported. A bare
      // `toContain("ACKNOWLEDGEMENT_FIELD")` matched the import line, so deleting
      // the field from the fetch body left this guard green — it passed against
      // exactly the defect it exists to catch.
      expect(source, "must send the start field the route checks").toMatch(
        /\[IMMEDIATE_START_FIELD\]:\s*true/,
      )
      expect(source, "must send the health consent field the route checks").toMatch(
        /\[HEALTH_CONSENT_FIELD\]:\s*true/,
      )
      // Matched as RENDERED JSX with its props, not as a bare identifier. The
      // first version of this rule used toContain("HealthConsentCheckbox") and
      // sabotage case 5 walked straight through it: deleting the render line
      // leaves the import, the import contains the name, the guard stays green.
      // That is the same defect the comment above records for
      // ACKNOWLEDGEMENT_FIELD — written into this file once already, and
      // repeated here anyway.
      expect(source, "must render the start request").toMatch(
        /<ImmediateStartRequest\s+checked=/,
      )
      // The shared control, not a local restatement: the statement it renders is
      // the one hashed into the consent record.
      expect(source, "must render the shared health control").toMatch(
        /<HealthConsentCheckbox\s+checked=/,
      )
      // Both unticked by default — a pre-ticked box is neither a request nor
      // consent.
      expect(source).toContain("const [startNow, setStartNow] = useState(false)")
      expect(source).toContain("const [healthConsent, setHealthConsent] = useState(false)")
      expect(source, "the purchase button must be disabled until both are ticked").toMatch(
        /disabled=\{loading \|\| !healthConsent \|\| !startNow\}/,
      )
      expect(source, "the retired field must not survive in a caller").not.toMatch(
        /acknowledgedImmediateSupply|ACKNOWLEDGEMENT_FIELD/,
      )
    })
  }
})

describe("the start-request copy is stated once", () => {
  it("asks to start, names the refund, and says where the answers stay", () => {
    const control = copyOf(
      readFileSync("components/assessment/immediate-start-request.tsx", "utf8"),
    )
    // This asserted /14-day right to cancel/ until the refund policy replaced
    // the waiver. Inverted rather than deleted: the sentence must not come
    // back, and the rule that used to require it now forbids it.
    expect(control).not.toMatch(/right to cancel/i)
    expect(control).toMatch(/Start my Personal Food System Consultation now/)
    expect(control).toMatch(/full refund if I cancel within 14 days of purchase/)
    // This used to assert the opposite — that the copy told the buyer their
    // scores went to Stripe — because at the time they did. #244 moved the
    // summary into paid_report_intents, so the honest statement changed with
    // the behaviour rather than lagging behind it.
    expect(control).toMatch(/stay with EatoBiotics/)
    // The health statement moved to the shared control, which renders
    // HEALTH_CONSENT_STATEMENT — the text that is hashed into the record.
    expect(control, "the health consent is not restated here").not.toMatch(
      /health-related data/,
    )
    const shared = readFileSync("components/health-consent-checkbox.tsx", "utf8")
    expect(shared).toContain("HEALTH_CONSENT_STATEMENT")
  })
})
