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
const CTA = readFileSync("components/assessment/withdrawal-acknowledgement.tsx", "utf8")

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

  it("says the assessment data no longer reaches Stripe, and is right", () => {
    // #244 removed it. This guard used to require the OPPOSITE — that the
    // policy name every field Stripe received — and it failed the moment the
    // code stopped sending them, which is exactly what it was for: the copy
    // cannot quietly keep describing a world the code has left.
    expect(PRIVACY).toMatch(/not sent to Stripe/)

    // And the claim has to be true of the code. paidReportSummaryMetadata was
    // the only writer; it is deleted, and nothing may call it.
    const session = readFileSync("lib/paid-report-session.ts", "utf8")
    expect(session).not.toMatch(/export function paidReportSummaryMetadata/)
    const checkout = readFileSync("app/api/checkout/route.ts", "utf8")
    expect(checkout).toContain("SUMMARY_TOKEN_KEY")
    expect(checkout, "the summary must be persisted, not sent").toContain("paid_report_intents")
  })

  it("describes payment as the one-time report plus optional membership", () => {
    // The live offer is a one-time purchase. Three places described it as
    // subscription billing, which misstated both the product and what Stripe
    // processes: the third-party entry, the payment-data category, and the
    // "how we use your data" list.
    expect(PRIVACY).not.toContain("Subscription and payment information")
    expect(PRIVACY).not.toContain("Process your subscription payments")
  })

  it("says the same thing at checkout as it does on the policy page", () => {
    // The two texts have to agree. They previously drifted in the other
    // direction — the policy listed seven fields while checkout named two — and
    // they must not now drift back, with one page claiming the data stays and
    // the other still describing it as sent.
    expect(CTA).toMatch(/stay with EatoBiotics/)
    expect(CTA).not.toMatch(/sub-scores|profile type and its description/)
    expect(PRIVACY).toMatch(/not sent to Stripe/)
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

describe("the last-updated dates move with the content", () => {
  it("both pages carry the same date", () => {
    const dateOf = (source: string) => source.match(/const LAST_UPDATED = "([^"]+)"/)?.[1]
    const privacy = dateOf(PRIVACY)
    const terms = dateOf(TERMS)
    expect(privacy).toBeTruthy()
    // Both were rewritten in the same change, so a mismatch means one was edited
    // and its date left behind — the drift that makes a policy date meaningless.
    expect(terms).toBe(privacy)
  })

  it("is not the date that predated this rewrite", () => {
    // Substantive changes landed in both documents: the one-time offer, the
    // right of withdrawal, three added processors. A stale date tells readers
    // nothing changed.
    expect(PRIVACY).not.toContain('LAST_UPDATED = "15 May 2025"')
    expect(TERMS).not.toContain('LAST_UPDATED = "15 May 2025"')
  })
})

describe("the checkout acknowledgement the Terms promise exists", () => {
  it("states the consequence the Terms describe", () => {
    // Terms sections 4 and 5 say the buyer is asked at checkout. The per-caller
    // wiring and the server-side refusal are covered in
    // checkout-acknowledgement.test.ts; this only pins that the control's copy
    // says what the Terms say it says.
    expect(CTA).toMatch(/14-day right to cancel/)
    expect(CTA).toContain("ACKNOWLEDGEMENT_FIELD")
  })
})
