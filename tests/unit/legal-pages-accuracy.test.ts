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
import { copyOf } from "./helpers/marketing-language"
import { join } from "node:path"

const TERMS = readFileSync("app/terms/page.tsx", "utf8")
const PRIVACY = readFileSync("app/privacy/page.tsx", "utf8")
const CTA = readFileSync("components/assessment/immediate-start-request.tsx", "utf8")
const HEALTH_CONTROL = readFileSync("components/health-consent-checkbox.tsx", "utf8")
// The rendered copy, not the source. This control's doc comment quotes the
// retired waiver sentence in order to explain what replaced it, so a negative
// rule run against raw source fires on its own explanation. copyOf also joins
// wrapped JSX lines, which the positive rules need — the refund sentence spans
// three source lines.
const CTA_COPY = copyOf(CTA)

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

  it("states the 14-day full-refund policy, from purchase", () => {
    // This assertion used to require the OPPOSITE sentence — that the 14-day
    // right ends once supply begins. That position was argued from an
    // exception for digital content supplied immediately, and this product is
    // not supplied immediately: section 4 has always said the report is
    // created after the Consultation. EatoBiotics now refunds in full for 14
    // days from purchase instead, so the guard flips with the policy.
    expect(TERMS).toMatch(/within 14 days of purchase/)
    expect(TERMS).toMatch(/full refund/i)
  })

  it("does not claim the report is supplied at checkout", () => {
    expect(TERMS).not.toMatch(/made available immediately/i)
    expect(TERMS).not.toMatch(/lose (the|your) 14-day right/i)
    expect(TERMS).not.toMatch(/waiv\w* .{0,30}right to cancel/i)
  })

  it("does not tie the refund to report generation", () => {
    // The retired boundary. A buyer who finished the Consultation was told the
    // right no longer applied; under the new policy the only boundary is 14
    // days from purchase.
    expect(TERMS).not.toMatch(/before your report is generated/i)
    expect(TERMS).not.toMatch(/the 14-day right no longer applies/i)
  })

  it("keeps a statutory-rights savings clause and does not claim to be exhaustive", () => {
    // The policy is voluntary. Saying so is what stops it reading as a
    // restatement — or a ceiling — of what the law already gives.
    expect(TERMS).toMatch(/does not limit your statutory consumer rights/i)
    expect(TERMS).toMatch(/does not affect any rights you may have under consumer law/i)
  })

  it("promises no revocation mechanism that does not exist", () => {
    // There is no charge.refunded handler and no refund state on profiles, so
    // a refund does not automatically end access today. "may end" is the
    // honest tense until one exists.
    expect(TERMS).toMatch(/paid EatoBiotics access may end/)
    expect(TERMS).not.toMatch(/paid EatoBiotics access will end/)
  })

  it("gives a practical way to cancel without a special form", () => {
    expect(TERMS).toMatch(/hello@eatobiotics\.com/)
    expect(TERMS).toMatch(/there is no special form/i)
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

describe("the checkout asks two questions, and neither is a waiver", () => {
  it("asks to start now, and says the refund survives it", () => {
    // The per-caller wiring and the server-side refusal are covered in
    // checkout-acknowledgement.test.ts; this pins only that the control's copy
    // says what the Terms say it says.
    expect(CTA_COPY).toMatch(/Start my Personal Food System Consultation now/)
    expect(CTA_COPY).toMatch(/full refund if I cancel within 14 days of purchase/)
    expect(CTA, "the wire field the route checks").toContain("IMMEDIATE_START_FIELD")
  })

  it("no longer tells the buyer they give anything up", () => {
    expect(CTA_COPY).not.toMatch(/lose the 14-day right/i)
    expect(CTA_COPY).not.toMatch(/right to cancel/i)
    expect(CTA_COPY).not.toMatch(/acknowledgedImmediateSupply/)
  })

  it("collects the health consent through the shared control, not this one", () => {
    // Checkout was the one collection point that did not use the shared
    // control: it bundled the health consent into the withdrawal sentence and
    // then recorded the hash of HEALTH_CONSENT_STATEMENT — a statement the
    // buyer had never been shown. The hash exists to say what was agreed, so
    // showing different words defeats the record.
    expect(HEALTH_CONTROL).toContain("HEALTH_CONSENT_STATEMENT")
    expect(CTA_COPY, "the start request must not restate the health consent").not.toMatch(
      /health-related data/i,
    )
  })
})
