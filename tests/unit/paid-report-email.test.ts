import { describe, it, expect } from "vitest"
import { buildPaidReportEmail } from "@/lib/email/paid-report-email"
import { ADDON_KEYS, type AddonType } from "@/lib/addon-types"
import { SYSTEMS } from "@/lib/systems"
import { CLAIMS, DENIAL_BOILERPLATE } from "./helpers/marketing-language"

const base = {
  name: "Sam",
  tier: "personal" as const,
  overall: 72,
  profileType: "Balanced Builder",
  tagline: "On track.",
  subScores: { feed: 70, seed: 65, heal: 80 },
  topTrigger: "Fibre variety",
  topTriggerExplanation: "You'd benefit from more plant diversity.",
  sessionId: "sess_123",
}

describe("buildPaidReportEmail — PDF note copy", () => {
  it("pdfUrl present: no false 'attached' claim, a real download link, 7-day expiry mentioned, permanent CTA still present", () => {
    const pdfUrl = "https://storage.example.com/pdf-reports/sess_123.pdf?token=abc"
    const { html } = buildPaidReportEmail({ ...base, pdfUrl })

    expect(html).not.toContain("attached to this email")
    expect(html).toContain(`href="${pdfUrl}"`)
    expect(html).toContain("Download it here")
    expect(html).toMatch(/7 days/)
    expect(html).toContain('href="https://eatobiotics.com/assessment/report?session_id=sess_123"')
    expect(html).toContain("View Your Full Report")
  })

  it("pdfUrl null: points to the durable report page instead of promising a re-email", () => {
    const { html } = buildPaidReportEmail({ ...base, pdfUrl: null })

    expect(html).toContain("Your PDF is still being prepared. Your full report is already available on your report page")
    // The old copy promised a re-email that nothing ever sends — that lie is gone.
    expect(html).not.toContain("will be emailed to you shortly")
    expect(html).not.toContain("attached to this email")
    expect(html).not.toContain("Download it here")
  })

  it("no 'attached' wording anywhere in the email output, in either pdfUrl state", () => {
    const withPdf = buildPaidReportEmail({ ...base, pdfUrl: "https://storage.example.com/x.pdf" })
    const withoutPdf = buildPaidReportEmail({ ...base, pdfUrl: null })

    expect(withPdf.html.toLowerCase()).not.toContain("attached")
    expect(withoutPdf.html.toLowerCase()).not.toContain("attached")
  })
})

/**
 * The purchased lens, acknowledged in the delivery email.
 *
 * Before this, a customer who paid extra for a lens received an email
 * byte-identical to one who did not. The only way to discover the lens was to
 * open the report and reach chapter 07 — which reads, reasonably, as the add-on
 * having been lost.
 */
describe("buildPaidReportEmail — the purchased lens", () => {
  const NAMES: Record<AddonType, string> = {
    stability: "Stability",
    glucose: "Glucose",
    mind: "Mind",
    performance: "Performance",
  }

  it.each(ADDON_KEYS)("%s is named next to the report CTA", (addon) => {
    const { html } = buildPaidReportEmail({ ...base, pdfUrl: null, selectedAddon: addon })

    expect(html).toContain(`<strong style="color: #2f7f6f;">${NAMES[addon]}</strong> lens is included`)
    // Beside the CTA, not buried after the footer.
    expect(html.indexOf("View Your Full Report")).toBeLessThan(html.indexOf("lens is included"))
    // The name matches the catalogue the report chapter itself uses.
    expect(NAMES[addon]).toBe(SYSTEMS[addon].label)
  })

  it.each(ADDON_KEYS)("%s claims nothing beyond inclusion", (addon) => {
    const { html } = buildPaidReportEmail({ ...base, pdfUrl: null, selectedAddon: addon })
    const line = html.slice(html.indexOf("lens is included") - 400, html.indexOf("lens is included") + 200)

    // No second report, no measurement, no diagnosis, no promised outcome.
    expect(line).not.toMatch(/separate report|second report|your results? for/i)
    expect(line).not.toMatch(/measure|reading|level|score/i)
    expect(line).not.toMatch(/diagnos|treat|cure/i)
    expect(line).not.toMatch(/will (improve|fix|reduce|increase)|guarantee/i)
  })

  it("no add-on renders no lens block at all", () => {
    const { html } = buildPaidReportEmail({ ...base, pdfUrl: null })
    expect(html).not.toContain("lens is included")
    expect(html).not.toMatch(/undefined|\[object Object\]/)
  })

  it("no add-on output is byte-identical to a null add-on", () => {
    const omitted = buildPaidReportEmail({ ...base, pdfUrl: null })
    const explicitNull = buildPaidReportEmail({ ...base, pdfUrl: null, selectedAddon: null })
    expect(explicitNull.html).toBe(omitted.html)
    expect(explicitNull.subject).toBe(omitted.subject)
  })

  it.each([
    ["unknown key", "recovery"],
    ["empty string", ""],
    ["nonsense", "'; DROP TABLE--"],
    ["numeric", 7 as unknown as string],
    ["object", { evil: true } as unknown as string],
  ])("malformed metadata (%s) behaves exactly like no add-on", (_label, value) => {
    const omitted = buildPaidReportEmail({ ...base, pdfUrl: null })
    const { html } = buildPaidReportEmail({ ...base, pdfUrl: null, selectedAddon: value })

    expect(html).toBe(omitted.html)
    expect(html).not.toContain("lens is included")
    expect(html).not.toMatch(/undefined|null|\[object Object\]|recovery/)
  })

  it("the subject line is untouched by the add-on", () => {
    const plain = buildPaidReportEmail({ ...base, pdfUrl: null }).subject
    for (const addon of ADDON_KEYS) {
      expect(buildPaidReportEmail({ ...base, pdfUrl: null, selectedAddon: addon }).subject).toBe(plain)
    }
  })

  it.each(ADDON_KEYS)("%s keeps both the durable report link and the 7-day PDF link", (addon) => {
    const pdfUrl = "https://storage.example.com/pdf-reports/sess_123.pdf?token=abc"
    const { html } = buildPaidReportEmail({ ...base, pdfUrl, selectedAddon: addon })

    expect(html).toContain('href="https://eatobiotics.com/assessment/report?session_id=sess_123"')
    expect(html).toContain(`href="${pdfUrl}"`)
    expect(html).toMatch(/7 days/)
  })

  /**
   * The real marketing-language corpus, over the new wording. This is the same
   * guard the report copy runs under — a health claim is no less a claim for
   * being in an email.
   */
  it.each(ADDON_KEYS)("%s: the real CLAIMS rules pass over the new wording", (addon) => {
    const { html, subject } = buildPaidReportEmail({ ...base, pdfUrl: null, selectedAddon: addon })

    // Scoped to what this change ADDED — the lens line and the subject.
    //
    // Running the corpus over the whole email flags one PRE-EXISTING sentence
    // in the pdfUrl-null branch: "the PDF download will appear there as soon as
    // it is ready" trips the `promise` rule on "will appear". That is a promise
    // about a button, not about anybody's health, and it shipped long before
    // this branch — so it is reported rather than silently swept into scope
    // here. See `the pre-existing promise phrase is still there` below, which
    // pins it so a future cleanup is a deliberate act.
    const lensLine = html.slice(
      Math.max(0, html.indexOf("lens is included") - 300),
      html.indexOf("lens is included") + 200,
    )
    const plain = `${subject} ${lensLine.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ")}`
      .replace(DENIAL_BOILERPLATE, " ")

    const hits: string[] = []
    for (const [rule, pattern] of CLAIMS) {
      const m = plain.match(pattern)
      if (m) hits.push(`${rule}: "${m[0]}"`)
    }
    expect(hits, hits.join("\n")).toEqual([])
  })

  it("adding a lens introduces no new CLAIMS hit anywhere in the email", () => {
    const flags = (h: string) => {
      const plain = h.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").replace(DENIAL_BOILERPLATE, " ")
      return CLAIMS.filter(([, p]) => p.test(plain)).map(([r]) => r).sort()
    }
    const without = flags(buildPaidReportEmail({ ...base, pdfUrl: null }).html)
    for (const addon of ADDON_KEYS) {
      const withLens = flags(buildPaidReportEmail({ ...base, pdfUrl: null, selectedAddon: addon }).html)
      // Whatever the baseline already trips, the lens must not add to it.
      expect(withLens, addon).toEqual(without)
    }
  })

  it("the pre-existing promise phrase is still there, and is about a button", () => {
    // Documented, not fixed, in this change. If someone reworks the PDF note,
    // this fails and they get to decide deliberately.
    const { html } = buildPaidReportEmail({ ...base, pdfUrl: null })
    expect(html).toContain("the PDF download will appear there as soon as it is ready")
  })

  it("there is no plain-text variant to keep in sync", () => {
    // buildPaidReportEmail returns { subject, html } only. If a text/ variant is
    // ever added, the lens line has to be added there too — this pins that.
    const out = buildPaidReportEmail({ ...base, pdfUrl: null, selectedAddon: "mind" })
    expect(Object.keys(out).sort()).toEqual(["html", "subject"])
  })
})
