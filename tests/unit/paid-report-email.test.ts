import { describe, it, expect } from "vitest"
import { buildPaidReportEmail } from "@/lib/email/paid-report-email"

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
