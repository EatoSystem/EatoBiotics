import { canonicalSerialise } from "../canonical-json"

import type { PersonalFoodSystemReportV1 } from "./report-types"

/**
 * Canonical serialisation — Phase 4A-S2.
 *
 * ══ WHY NOT JSON.stringify ══════════════════════════════════════════════════
 *
 * Because `JSON.stringify` preserves key INSERTION order, and insertion order
 * is an accident of how an object literal was written. Two composers that
 * produce semantically identical Reports would serialise differently if one
 * happened to build `{ title, propositions }` and the other
 * `{ propositions, title }` — and the determinism guarantee would then be
 * testing the composer's typing habits rather than its output.
 *
 * So keys are sorted at every level. Arrays keep their order, because array
 * order in this Report is meaningful everywhere: bank order for recaps,
 * precedence for the lever, week order for the loop.
 *
 * The result is what tests hash, and what Phase 4A-S4 persists.
 *
 * The algorithm itself now lives in `lib/report/canonical-json.ts` — a
 * zero-import leaf — because the persisted Report decoder returns a type that
 * is deliberately NOT assignable to `PersonalFoodSystemReportV1`, and both must
 * produce identical bytes. One algorithm, two callers, no cast. Nothing about
 * the rules changed; the two golden digests prove it.
 */

/** Deterministic, key-sorted JSON. Stable across builds for equal input. */
export function serialiseReport(report: PersonalFoodSystemReportV1): string {
  return canonicalSerialise(report)
}

/**
 * Every customer-facing sentence, in render order.
 *
 * Used by the claims guards, which need the prose rather than the structure —
 * and by any check asking "does this Report contain the word X", which must
 * not accidentally match a template id or a question id.
 */
export function customerFacingText(report: PersonalFoodSystemReportV1): readonly string[] {
  const out: string[] = [
    report.systemSnapshot.title,
    ...report.systemSnapshot.propositions.map((p) => p.text),
    report.priorityLever.title,
    ...report.priorityLever.propositions.map((p) => p.text),
    ...report.thirtyDayLoop.flatMap((s) => [s.beat, s.proposition.text]),
    report.constraints.title,
    ...report.constraints.propositions.map((p) => p.text),
  ]
  if (report.safety.note) out.push(report.safety.note)
  if (report.familyContext) {
    out.push(report.familyContext.title, ...report.familyContext.propositions.map((p) => p.text))
  }
  if (report.quotation) out.push(report.quotation.text)
  return out
}
