import type {
  PersonalFoodSystemReportV1,
} from "@/lib/report/deterministic/report-types"
import type { ReportProposition } from "@/lib/report/deterministic/proposition"

/**
 * Canonical proposition order — Phase 4A-S3.
 *
 * ══ WHY THIS IS ITS OWN MODULE ══════════════════════════════════════════════
 *
 * The overlay must be exactly 1:1 with the Report, in canonical order. That
 * only means anything if "canonical order" has ONE definition — if the overlay
 * walked the document differently from the renderer, an item could be correct
 * and still land against the wrong sentence.
 *
 * So the walk below mirrors `customerFacingText` exactly, minus the strings
 * that are not propositions: section titles and loop beats are
 * `STRUCTURAL_COPY`, carry no proposition id, and are therefore outside the
 * 1:1 contract by construction — they are reviewed copy that no rewriter is
 * offered.
 */
export function canonicalPropositionOrder(
  report: PersonalFoodSystemReportV1,
): readonly ReportProposition[] {
  const out: ReportProposition[] = [
    ...report.systemSnapshot.propositions,
    ...report.priorityLever.propositions,
    ...report.thirtyDayLoop.map((step) => step.proposition),
    ...report.constraints.propositions,
  ]
  if (report.familyContext) out.push(...report.familyContext.propositions)
  if (report.quotation) out.push(report.quotation)
  return out
}
