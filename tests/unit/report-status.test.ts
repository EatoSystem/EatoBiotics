/* ── Paid-report overall-status rule ──────────────────────────────────────
   Guards the core invariant of the report pipeline fix: a row is only
   "complete" when the report, PDF, and email all succeeded. A PDF or email
   failure must leave it "partial" so the paying customer isn't falsely marked
   delivered.
──────────────────────────────────────────────────────────────────────── */
import { describe, it, expect } from "vitest"
import { overallReportStatus, reportViewState } from "@/lib/report-status"

describe("overallReportStatus", () => {
  it("is complete only when report + pdf + email all succeed", () => {
    expect(overallReportStatus({ reportOk: true, pdfOk: true, emailOk: true })).toBe("complete")
  })

  it("is partial when the PDF fails", () => {
    expect(overallReportStatus({ reportOk: true, pdfOk: false, emailOk: true })).toBe("partial")
  })

  it("is partial when the email fails", () => {
    expect(overallReportStatus({ reportOk: true, pdfOk: true, emailOk: false })).toBe("partial")
  })

  it("is partial when report generation fails", () => {
    expect(overallReportStatus({ reportOk: false, pdfOk: true, emailOk: true })).toBe("partial")
  })
})

/* Guards the bounce-loop fix: a buyer whose report exists is always shown the
   report — a "partial" row (report saved, PDF/email delivery failed) must never
   send them back into the intake questionnaire. */
describe("reportViewState", () => {
  it("shows the report for a fully delivered row", () => {
    expect(reportViewState("complete", true)).toBe("view")
  })

  it("shows the report with a delivery notice for a partial row", () => {
    expect(reportViewState("partial", true)).toBe("view_delivery_pending")
  })

  it("shows the report with a delivery notice for a crashed analysing run that saved the report", () => {
    expect(reportViewState("analysing", true)).toBe("view_delivery_pending")
  })

  it("resumes the questionnaire only when no report exists yet", () => {
    expect(reportViewState("partial", false)).toBe("resume_questionnaire")
    expect(reportViewState("analysing", false)).toBe("resume_questionnaire")
    expect(reportViewState("in_progress", false)).toBe("resume_questionnaire")
    expect(reportViewState(null, false)).toBe("resume_questionnaire")
    expect(reportViewState(undefined, false)).toBe("resume_questionnaire")
  })
})
