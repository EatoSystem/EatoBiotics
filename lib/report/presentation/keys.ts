/**
 * Structural render keys — Phase 4B-S2.
 *
 * ══ WHY NOT `proposition.id` ════════════════════════════════════════════════
 *
 * A renderer needs a stable key per rendered sentence, for list reconciliation
 * and for anchors. The obvious candidate is `ReportProposition.id`, and the S1
 * exposure policy forbids it: it is engine identity, it travels in the
 * persisted canonical Report, and once it reaches a DOM attribute it is in
 * screenshots, bug reports and browser history.
 *
 * The frozen decision was to generate keys from the canonical SECTION and
 * ORDINAL instead. That costs nothing, because canonical order is frozen — the
 * composer emits sections and propositions in a fixed sequence — so position is
 * exactly as stable as the id would have been, and carries no engine meaning.
 *
 * These keys are PRESENTATION ONLY. They are never persisted, never compared
 * against anything in the canonical Report, and never authority.
 */

/**
 * The canonical regions, in the order a Report presents them.
 *
 * A closed union rather than free strings, so a typo produces a build failure
 * instead of a duplicate key that React reports at runtime as a missing one.
 */
export type PresentationRegion =
  | "snapshot"
  | "lever"
  | "loop"
  | "constraints"
  | "family"
  | "quotation"
  | "safety"
  | "closing"

/**
 * `region:ordinal`, or a bare region for the regions that hold exactly one
 * thing. Deterministic from position alone.
 */
export function renderKey(region: PresentationRegion, ordinal?: number): string {
  return ordinal === undefined ? region : `${region}:${ordinal}`
}
