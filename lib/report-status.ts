/* ── Paid-report pipeline status ──────────────────────────────────────────
   The €49 report is delivered in three stages: generate the report, render +
   upload the PDF, and email it. Each stage records its own status/error on the
   `deep_assessments` row (Migration 33) so a partial failure is never hidden.

   The overall `status` is only "complete" when ALL THREE stages succeeded —
   otherwise it stays "partial" so the row is diagnosable and a re-run can retry
   just the failed stages. This pure helper centralises that rule so it can be
   unit tested without a DB.
──────────────────────────────────────────────────────────────────────── */

export type ReportStageOutcome = {
  /** The report JSON was produced (a deterministic fallback still counts). */
  reportOk: boolean
  /** The PDF was generated AND uploaded to storage. */
  pdfOk: boolean
  /** The report email was accepted by the provider. */
  emailOk: boolean
}

export type OverallReportStatus = "complete" | "partial"

/** "complete" only when every delivery stage succeeded; otherwise "partial". */
export function overallReportStatus(o: ReportStageOutcome): OverallReportStatus {
  return o.reportOk && o.pdfOk && o.emailOk ? "complete" : "partial"
}
