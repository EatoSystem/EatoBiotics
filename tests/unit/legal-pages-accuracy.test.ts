/**
 * The legal pages must describe the product that exists.
 *
 * Terms section 4 described monthly/annual billing and discretionary refunds
 * while the live offer was a one-time €49 report; the Privacy Policy's list of
 * processors named five while the code called eight. Neither is the kind of
 * drift a reader can detect — which is exactly why it needs a guard rather than
 * a proofread.
 *
 * The processor check is derived by scanning for the SDK imports rather than
 * from a hand-written list, on the same principle as the schema-drift guard: a
 * hand-written list is a second thing to keep in sync, and it would have gone
 * stale in step with the page it is checking.
 */
import { describe, it, expect } from "vitest"
import { readFileSync, readdirSync, statSync } from "node:fs"
import { join } from "node:path"

const TERMS = readFileSync("app/terms/page.tsx", "utf8")
const PRIVACY = readFileSync("app/privacy/page.tsx", "utf8")
const CTA = readFileSync("components/assessment/payment-cta.tsx", "utf8")

/* ── Which processors does the code actually reach? ─────────────────────── */

/** import specifier (or env var) → the name that must appear in Privacy §5. */
const PROCESSOR_SIGNALS: { name: string; pattern: RegExp }[] = [
  { name: "Supabase", pattern: /@supabase\/(supabase-js|ssr)/ },
  { name: "Anthropic", pattern: /@anthropic-ai\/sdk/ },
  { name: "Stripe", pattern: /from "stripe"|@\/lib\/stripe-server/ },
  { name: "Resend", pattern: /from "resend"/ },
  { name: "OpenAI", pattern: /from "openai"|OPENAI_API_KEY/ },
  { name: "PostHog", pattern: /from "posthog-js/ },
  { name: "Statsig", pattern: /@statsig\/(js-client|react-bindings)|statsig-node/ },
  { name: "Vercel", pattern: /@vercel\/analytics/ },
]

function sourceFiles(): string[] {
  const out: string[] = []
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir)) {
      if (entry === "node_modules" || entry.startsWith(".")) continue
      const full = join(dir, entry)
      if (statSync(full).isDirectory()) walk(full)
      else if (/\.(ts|tsx)$/.test(entry)) out.push(full)
    }
  }
  for (const root of ["app", "lib", "components"]) walk(root)
  return out
}

const ALL_SOURCE = sourceFiles()
  .map((f) => readFileSync(f, "utf8"))
  .join("\n")

describe("the Privacy Policy names every processor the code uses", () => {
  it("lists each one in the third-parties section", () => {
    const missing = PROCESSOR_SIGNALS.filter(
      ({ name, pattern }) => pattern.test(ALL_SOURCE) && !PRIVACY.includes(name),
    ).map(({ name }) => name)

    // PostHog, Statsig and OpenAI were all reached by the code and named
    // nowhere on the page.
    expect(missing, "processors reached by the code but absent from the Privacy Policy").toEqual([])
  })

  it("is checking against signals that actually fire", () => {
    // Without this, a typo in a pattern would make the guard above pass by
    // finding nothing to check — the failure mode that makes drift guards
    // worthless.
    const detected = PROCESSOR_SIGNALS.filter(({ pattern }) => pattern.test(ALL_SOURCE))
    expect(detected.length).toBe(PROCESSOR_SIGNALS.length)
  })

  it("no longer says Stripe handles only subscription billing", () => {
    // The live offer is a one-time €49 report; describing Stripe as a
    // subscription processor misstated both the product and the processing.
    expect(PRIVACY).not.toContain("Handles all subscription billing")
  })
})

describe("the Terms describe the live offer", () => {
  it("leads with the one-time report rather than paid plans", () => {
    expect(TERMS).toMatch(/one-time/i)
    expect(TERMS).toMatch(/\\u20AC49|€49/)
    expect(TERMS, "the retired framing where every paid plan renews").not.toContain(
      "Paid plans are billed monthly or annually",
    )
  })

  it("carries the EU right-of-withdrawal position", () => {
    // Immediate supply of digital content requires express consent plus an
    // acknowledgement that the 14-day right is lost. Neither was stated.
    expect(TERMS).toMatch(/14-day right to cancel|right to cancel/i)
    expect(TERMS).toMatch(/statutory rights/i)
  })

  it("does not offer refunds only at our discretion", () => {
    expect(TERMS).not.toContain("We offer refunds at our discretion")
  })

  it("numbers its sections once each, in order", () => {
    // Two sections were inserted mid-document; this catches a duplicated or
    // skipped number from the renumbering.
    const numbers = [...TERMS.matchAll(/<Section title="(\d+)\./g)].map((m) => Number(m[1]))
    expect(numbers).toEqual(Array.from({ length: numbers.length }, (_, i) => i + 1))
  })
})

describe("the checkout acknowledgement the Terms promise exists", () => {
  it("is asked before payment can start", () => {
    // Terms section 4 says "you are asked at checkout". If that control did not
    // exist, the Terms would be making the same kind of untrue statement this
    // whole change is fixing.
    expect(CTA).toContain("acknowledged")
    expect(CTA).toMatch(/setAcknowledged/)
  })

  it("is unticked by default and blocks the purchase until ticked", () => {
    // A pre-ticked box is not consent.
    expect(CTA).toContain("useState(false)")
    expect(CTA).toMatch(/disabled=\{loading !== null \|\| !acknowledged\}/)
    expect(CTA).toMatch(/if \(!acknowledged\)/)
  })
})
