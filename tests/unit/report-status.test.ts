/* ── Paid-report overall-status rule ──────────────────────────────────────
   Guards the core invariant of the report pipeline fix: a row is only
   "complete" when the report, PDF, and email all succeeded. A PDF or email
   failure must leave it "partial" so the paying customer isn't falsely marked
   delivered.
──────────────────────────────────────────────────────────────────────── */
import { describe, it, expect } from "vitest"
import { overallReportStatus } from "@/lib/report-status"

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
