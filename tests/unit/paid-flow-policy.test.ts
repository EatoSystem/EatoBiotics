/**
 * The bypass that used to be a missing secret.
 *
 * `app/api/generate-deep-questions` and `app/api/submit-deep-assessment` both
 * decided whether to skip payment verification with
 * `!process.env.STRIPE_SECRET_KEY`. That is fail-open on the money path: an
 * environment missing its Stripe key accepted the request body as authority for
 * the score, tier and lens, and persisted a `deep_assessments` row — which
 * reconcile-account.ts counts as proof of purchase when granting the 30-day
 * trial. A misconfiguration is not a grant.
 *
 * The matrix below is the whole contract. Every row that is not an explicit,
 * provably non-production runtime must be `false`.
 */
import { describe, it, expect } from "vitest"
import { isUnverifiedPaidFlowAllowed, UNVERIFIED_PAID_FLOW_FLAG } from "@/lib/paid-flow-policy"

/** Build an env without inheriting the runner's own NODE_ENV/VERCEL_ENV. */
function env(overrides: Record<string, string | undefined>): NodeJS.ProcessEnv {
  return overrides as NodeJS.ProcessEnv
}
const ON = { [UNVERIFIED_PAID_FLOW_FLAG]: "true" }

describe("the bypass is denied unless explicitly allowed AND provably non-production", () => {
  it("A — Vercel production + flag true + no Stripe key → denied", () => {
    // The flag cannot override the real deployment. A production env var set by
    // accident must not open the bypass on the live site.
    expect(isUnverifiedPaidFlowAllowed(env({ ...ON, VERCEL_ENV: "production" }))).toBe(false)
  })

  it("B — Vercel production + flag absent + no Stripe key → denied", () => {
    expect(isUnverifiedPaidFlowAllowed(env({ VERCEL_ENV: "production" }))).toBe(false)
  })

  it("C — Vercel preview + flag absent → denied", () => {
    // Non-production is not consent. The opt-in is the other half.
    expect(isUnverifiedPaidFlowAllowed(env({ VERCEL_ENV: "preview" }))).toBe(false)
  })

  it("D — Vercel preview + flag true → allowed", () => {
    expect(isUnverifiedPaidFlowAllowed(env({ ...ON, VERCEL_ENV: "preview" }))).toBe(true)
  })

  it("E — local development + flag true → allowed", () => {
    expect(isUnverifiedPaidFlowAllowed(env({ ...ON, NODE_ENV: "development" }))).toBe(true)
    expect(isUnverifiedPaidFlowAllowed(env({ ...ON, NODE_ENV: "test" }))).toBe(true)
    expect(isUnverifiedPaidFlowAllowed(env({ ...ON, VERCEL_ENV: "development" }))).toBe(true)
  })

  it("F — local development + flag absent → denied", () => {
    expect(isUnverifiedPaidFlowAllowed(env({ NODE_ENV: "development" }))).toBe(false)
    expect(isUnverifiedPaidFlowAllowed(env({ NODE_ENV: "test" }))).toBe(false)
  })

  it("G — unknown production-like runtime + flag true → denied", () => {
    // No VERCEL_ENV and NODE_ENV=production is exactly the shape of a
    // self-hosted production server. Nothing proves it is safe, so it is denied.
    expect(isUnverifiedPaidFlowAllowed(env({ ...ON, NODE_ENV: "production" }))).toBe(false)
    // An empty env proves nothing either.
    expect(isUnverifiedPaidFlowAllowed(env({ ...ON }))).toBe(false)
    // An unrecognised VERCEL_ENV value is not a licence to guess.
    expect(isUnverifiedPaidFlowAllowed(env({ ...ON, VERCEL_ENV: "staging" }))).toBe(false)
    expect(isUnverifiedPaidFlowAllowed(env({ ...ON, VERCEL_ENV: "" }))).toBe(false)
  })
})

describe("the flag itself", () => {
  it("accepts only the exact string 'true'", () => {
    // "1"/"yes"/"TRUE" are what a config accident looks like. None of them
    // should switch off payment verification.
    for (const value of ["1", "yes", "TRUE", "True", " true", "true ", ""]) {
      expect(
        isUnverifiedPaidFlowAllowed(env({ [UNVERIFIED_PAID_FLOW_FLAG]: value, NODE_ENV: "test" })),
        `${JSON.stringify(value)} must not enable the bypass`,
      ).toBe(false)
    }
  })

  it("is not readable by the browser", () => {
    // A NEXT_PUBLIC_ prefix would inline this into the client bundle and ship
    // the switch to every visitor.
    expect(UNVERIFIED_PAID_FLOW_FLAG.startsWith("NEXT_PUBLIC_")).toBe(false)
  })

  it("does not consult the Stripe key at all", () => {
    // The regression this file exists for: presence or absence of a secret must
    // not move the decision in either direction.
    const withKey = env({ ...ON, NODE_ENV: "test", STRIPE_SECRET_KEY: "sk_test_x" })
    const without = env({ ...ON, NODE_ENV: "test" })
    expect(isUnverifiedPaidFlowAllowed(withKey)).toBe(isUnverifiedPaidFlowAllowed(without))

    // And the old rule is genuinely gone: a missing key on a production-like
    // runtime is denied, where it used to be the thing that granted access.
    expect(isUnverifiedPaidFlowAllowed(env({ NODE_ENV: "production" }))).toBe(false)
  })

  it("defaults to false on a completely empty environment", () => {
    expect(isUnverifiedPaidFlowAllowed(env({}))).toBe(false)
  })
})
