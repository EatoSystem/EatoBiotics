/* ════════════════════════════════════════════════════════════════════════
   Score provenance — which method produced a number.

   ── The defect this exists to prevent is ALREADY LIVE ─────────────────────

   Two instruments write the same two production columns today:

     lib/quick-assessment.ts:204   5 items,  round(mean(values) / 3 × 100)
     lib/assessment-scoring.ts:60  15 items, round(sum / max × 100)

   Both land in `leads.overall_score` and `leads.sub_scores`, and NOTHING
   records which produced a row. `AssessmentResult` has no version field at
   all, and `sub_scores` already holds two different shapes.

   So this is not housekeeping ahead of a future problem. Comparing two
   existing rows is already unsafe, and adding a third model without
   provenance would make it unrecoverable.
   ════════════════════════════════════════════════════════════════════════ */

/** The five fields. All required — see `ScoreProvenance` below for why. */
export interface ScoreProvenance {
  readonly fssMethodVersion: string
  readonly assessmentVersion: string
  readonly questionSetVersion: string
  readonly calculationVersion: string
  readonly interpretationVersion: string
}

/**
 * What a score produced before provenance existed is called.
 *
 * Deliberately a distinct sentinel rather than an empty string, a null or a
 * guess. The generating method of a historical row CANNOT be known — the two
 * instruments above are indistinguishable once written — so the honest value
 * is "we do not know", said once, in a form nothing can mistake for a version.
 *
 * NOTHING BACKFILLS THIS. No historical row is read, rewritten or migrated.
 * It is a conceptual state for scores we encounter, not a column we set.
 */
export const LEGACY_UNVERSIONED = "legacy-unversioned" as const

export type MethodVersion = string | typeof LEGACY_UNVERSIONED

/** The candidate method. Not approved; see docs/fss/FSS_V1_SPEC.md. */
export const FSS_V1_PROVENANCE: ScoreProvenance = {
  fssMethodVersion: "fss-v1.0",
  assessmentVersion: "assessment-v1.0",
  questionSetVersion: "questions-v1.0",
  calculationVersion: "calc-v1.0",
  interpretationVersion: "interpretation-v1.0",
}

/** A score whose provenance is unknown, and which is therefore comparable with nothing. */
export const LEGACY_PROVENANCE: ScoreProvenance = {
  fssMethodVersion: LEGACY_UNVERSIONED,
  assessmentVersion: LEGACY_UNVERSIONED,
  questionSetVersion: LEGACY_UNVERSIONED,
  calculationVersion: LEGACY_UNVERSIONED,
  interpretationVersion: LEGACY_UNVERSIONED,
}

export function isLegacyUnversioned(p: ScoreProvenance): boolean {
  return p.fssMethodVersion === LEGACY_UNVERSIONED
}
