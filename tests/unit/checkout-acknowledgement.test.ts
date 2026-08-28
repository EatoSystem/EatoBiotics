/**
 * Express consent to immediate supply of digital content, on every path that
 * reaches Stripe.
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
import { join } from "node:path"

const mockCheckoutCreate = vi.fn()
vi.mock("@/lib/stripe-server", () => ({
  stripe: { checkout: { sessions: { create: (...a: unknown[]) => mockCheckoutCreate(...a) } } },
}))

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

describe("the checkout route requires express consent", () => {
  it("refuses when the acknowledgement is absent", async () => {
    const res = await post(VALID_BODY)

    expect(res.status).toBe(400)
    expect(await res.json()).toMatchObject({ code: "acknowledgement_required" })
    // The consequential half: no Stripe session, so no payment page exists and
    // nobody can be charged without having given consent.
    expect(mockCheckoutCreate).not.toHaveBeenCalled()
  })

  for (const value of [false, "true", 1, null]) {
    it(`refuses a non-true acknowledgement (${JSON.stringify(value)})`, async () => {
      // Strict `!== true`: the string "true" and a truthy 1 are what a sloppy
      // client sends, and neither is a person ticking a box.
      const res = await post({ ...VALID_BODY, acknowledgedImmediateSupply: value })

      expect(res.status).toBe(400)
      expect(mockCheckoutCreate).not.toHaveBeenCalled()
    })
  }

  it("proceeds when the acknowledgement is given", async () => {
    const res = await post({ ...VALID_BODY, acknowledgedImmediateSupply: true })

    expect(res.status).toBe(200)
    expect(mockCheckoutCreate).toHaveBeenCalledTimes(1)
  })

  it("records the consent on the Stripe session", async () => {
    await post({ ...VALID_BODY, acknowledgedImmediateSupply: true })

    const [params] = mockCheckoutCreate.mock.calls[0] as [{ metadata: Record<string, string> }]
    // The session outlives the request that created it, which is what makes it
    // a usable record of consent rather than a transient form state.
    expect(params.metadata.acknowledged_immediate_supply).toBe("true")
    expect(params.metadata.acknowledged_at).toMatch(/^\d{4}-\d{2}-\d{2}T/)
  })

  it("refuses before validating the assessment payload", async () => {
    // Ordering matters for the message the buyer sees: someone who has not
    // ticked the box should be told that, not handed a "complete the free
    // assessment" error that does not describe their situation.
    const res = await post({ tier: "personal" })

    expect(await res.json()).toMatchObject({ code: "acknowledgement_required" })
  })
})

/* ── Every caller, not just the one ─────────────────────────────────────── */

const CALLERS = [
  "components/assessment/personal-report-cta.tsx",
  "components/assessment/assessment-results.tsx",
]

describe("every live checkout caller asks for the acknowledgement", () => {
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
    it(`${file} sends the acknowledgement and blocks until it is ticked`, () => {
      const source = readFileSync(file, "utf8")
      // Must appear as a key in the request body, not merely be imported. A bare
      // `toContain("ACKNOWLEDGEMENT_FIELD")` matched the import line, so deleting
      // the field from the fetch body left this guard green — it passed against
      // exactly the defect it exists to catch.
      expect(source, "must send the field the route checks").toMatch(
        /\[ACKNOWLEDGEMENT_FIELD\]:\s*true/,
      )
      expect(source, "must render the shared control").toContain("WithdrawalAcknowledgement")
      // Unticked by default — a pre-ticked box is not consent.
      expect(source).toContain("useState(false)")
      expect(source, "the purchase button must be disabled until ticked").toMatch(
        /disabled=\{loading[^}]*\|\| !acknowledged\}/,
      )
    })
  }
})

describe("the acknowledgement copy is stated once", () => {
  it("names the consequence and the Stripe disclosure", () => {
    const control = readFileSync("components/assessment/withdrawal-acknowledgement.tsx", "utf8")
    expect(control).toMatch(/14-day right to cancel/)
    // Until PR B moves the summary out of Stripe metadata, the buyer is told
    // that it goes there. The copy has to describe today's behaviour.
    expect(control).toMatch(/sent to Stripe/)
  })
})
