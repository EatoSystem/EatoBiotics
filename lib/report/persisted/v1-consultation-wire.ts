/**
 * The frozen Consultation-v1 wire contract — Phase 4A-S4.
 *
 * ══ WHY THE LIVE READERS CANNOT SERVE A HISTORICAL REPORT ═══════════════════
 *
 * `readConsultationFinalisation` refuses unless the stored
 * `scienceContractVersion` equals the CURRENT `SCIENCE_CONTRACT_VERSION`, and
 * rebuilds its result using that constant.
 * `readDeterministicConsultationSnapshot` narrows `entitledLens` through the
 * CURRENT `asAddonType`. Both are correct for a live Consultation — a session
 * being resumed today must be understood in today's terms.
 *
 * Neither is correct for a Report that was persisted years ago. The day the
 * Science Contract is re-adjudicated to v1.1, or the add-on vocabulary gains or
 * loses a lens, every existing seal would stop reading — and a customer's paid
 * Report would vanish behind a refusal that has nothing to do with them.
 *
 * So the historical path reads Consultation v1 on v1's own terms, recorded
 * here as values. Nothing in this file is imported from anywhere, and an
 * agreement test asserts these decoders and the live readers still reach the
 * same verdicts TODAY. Divergence later is the whole point; divergence now
 * would be a bug.
 */

export const V1_SNAPSHOT_KIND = "deterministic-consultation"
export const V1_SNAPSHOT_SCHEMA_VERSION = 1

export const V1_STATE_KIND = "deterministic-consultation-state"
export const V1_STATE_SCHEMA_VERSION = 1
export const V1_PHASES = ["questions", "review", "ready-for-report"] as const

export const V1_FINALISATION_KIND = "deterministic-consultation-finalisation"
export const V1_FINALISATION_SCHEMA_VERSION = 1

export const V1_KNOWN_FINALISATION_VERSIONS = ["consultation-finalisation-v1"] as const
export const V1_KNOWN_SCIENCE_CONTRACT_VERSIONS = ["science-contract-v1.0"] as const

export const V1_CONSULTATION_FOUNDATIONS = ["you", "family"] as const

/**
 * The lens entitlements a v1 Consultation could have been sold.
 *
 * `null` is a real member — "no lens was purchased" — and is deliberately not
 * the fallback for an unrecognised value. Coercing an unknown lens to `null`
 * would silently serve a lens-less handoff to somebody who paid for one, which
 * is why the live reader refuses instead, and why this copy does too.
 */
export const V1_PURCHASED_LENSES = [
  null,
  "stability",
  "glucose",
  "mind",
  "performance",
] as const

/** The exact top-level shape of a v1 finalisation. No more, no fewer. */
export const V1_FINALISATION_KEYS = [
  "kind",
  "schemaVersion",
  "finalisationVersion",
  "bankVersion",
  "bankFingerprint",
  "scienceContractVersion",
  "foundation",
  "entitledLens",
  "applicableQuestionIds",
  "trustedAnswers",
  "trustedAnswersByField",
  "skippedOptionalQuestionIds",
  "foodGuidance",
  "finalisedAt",
] as const

/** Same rule one level down: the frozen safety state has no room for extras. */
export const V1_FOOD_GUIDANCE_KEYS = [
  "declaredConstraints",
  "safetyConstraints",
  "practicalConstraints",
  "knownAvoidances",
  "declaresNoConstraints",
  "constraintsUndisclosed",
  "requiresSpecificAvoidance",
  "unresolvedSpecificAvoidance",
] as const

export const V1_SNAPSHOT_KEYS = [
  "kind",
  "schemaVersion",
  "bankVersion",
  "bankFingerprint",
  "foundation",
  "entitledLens",
  "createdAt",
] as const

export const V1_STATE_KEYS = [
  "kind",
  "schemaVersion",
  "candidateAnswers",
  "touchedQuestionIds",
  "skippedOptionalQuestionIds",
  "currentQuestionId",
  "phase",
] as const
