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
 * The result is what tests hash, and what a later phase would persist.
 */

function canonicalise(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalise)
  if (value === null || typeof value !== "object") return value
  const source = value as Record<string, unknown>
  const out: Record<string, unknown> = {}
  for (const key of Object.keys(source).sort()) {
    // `undefined` is dropped rather than serialised, so an optional field that
    // is absent and one that is explicitly undefined cannot differ.
    if (source[key] === undefined) continue
    out[key] = canonicalise(source[key])
  }
  return out
}

/** Deterministic, key-sorted JSON. Stable across builds for equal input. */
export function serialiseReport(report: PersonalFoodSystemReportV1): string {
  return JSON.stringify(canonicalise(report), null, 2)
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
