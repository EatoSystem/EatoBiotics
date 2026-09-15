/**
 * What a decoded historical artifact is — Phase 4A-S4.
 *
 * ══ STRICT IN, PERMISSIVE OUT ═══════════════════════════════════════════════
 *
 * The live `PersonalFoodSystemReportV1` pins two fields to literal types —
 * `kind` and `provenance.composerVersion` — and `PermissionBasis` pins three
 * more. That strictness is right at CONSTRUCTION: the composer must not be able
 * to stamp a version it did not build under.
 *
 * It is wrong at READ. A Report persisted by `composer-v2` is still a valid
 * artifact after `composer-v3` ships, and a type that says otherwise would make
 * the correct historical behaviour untypeable. So the decoder returns these
 * types, whose version-valued fields are `string`, and whose VALUES are
 * constrained by the frozen producer identity instead — which is the honest
 * place for that rule, because it is a fact about which builds existed.
 *
 * ══ WHY THE BRIDGE BELOW IS NOT DECORATION ══════════════════════════════════
 *
 * Two structural definitions of one document is exactly how two definitions
 * drift apart. `tsc` is made to prove, on every build, that anything the live
 * composer can produce is a valid persisted artifact. If a field is added to
 * the live Report and not here, the bridge stops compiling — which is the
 * failure arriving at the moment somebody could still act on it.
 *
 * The direction matters and only one direction is asserted. Live → persisted
 * must hold. Persisted → live must NOT: that is the widening, and asserting it
 * would defeat the purpose.
 */

/* ══ The persisted Report ══════════════════════════════════════════════════ */

export interface PersistedPropositionSourceV1 {
  readonly questionId: string
  readonly value: string
}

export type PersistedPermissionBasisV1 =
  | {
      readonly kind: "science-adjudicated"
      readonly contractVersion: string
      readonly questionId: string
    }
  | {
      readonly kind: "product-operational"
      readonly recordVersion: string
      readonly approvedBy: "product"
      readonly rationale: string
    }

export interface PersistedPropositionV1 {
  readonly id: string
  readonly kind: string
  readonly sources: readonly PersistedPropositionSourceV1[]
  readonly sourceQuestionIds: readonly string[]
  readonly sourceFields: readonly string[]
  readonly basis: PersistedPermissionBasisV1
  readonly allowedUse: string
  readonly target: string
  readonly templateId: string
  readonly text: string
  readonly evidenceStatus: string
  readonly requiredCapabilities: readonly string[]
}

export interface PersistedSectionV1 {
  readonly title: string
  readonly propositions: readonly PersistedPropositionV1[]
}

export interface PersistedLoopStepV1 {
  readonly week: 1 | 2 | 3 | 4
  readonly beat: string
  readonly proposition: PersistedPropositionV1
}

export interface PersistedSafetyV1 {
  readonly state: string
  readonly note?: string
  readonly specificFoodsSuppressed: boolean
  readonly suppressionReasons: readonly string[]
}

export interface PersistedProvenanceV1 {
  readonly reportSchemaVersion: string
  readonly handoffId: string
  readonly bankVersion: string
  readonly bankFingerprint: string
  readonly scienceContractVersion: string
  readonly finalisationVersion: string
  readonly reportUseRecordVersion: string
  readonly composerVersion: string
  readonly contentPackVersion: string
  readonly capabilitiesAtCompose: Readonly<Record<string, boolean>>
  readonly finalisedAt: string
}

export interface PersistedReportV1 {
  readonly kind: string
  readonly foundation: string
  readonly systemSnapshot: PersistedSectionV1
  readonly priorityLever: PersistedSectionV1
  readonly thirtyDayLoop: readonly PersistedLoopStepV1[]
  readonly constraints: PersistedSectionV1
  readonly safety: PersistedSafetyV1
  readonly familyContext?: PersistedSectionV1
  readonly quotation?: PersistedPropositionV1
  readonly provenance: PersistedProvenanceV1
}

/* ══ The historical finalisation ═══════════════════════════════════════════ */

export interface HistoricalFoodGuidanceV1 {
  readonly declaredConstraints: readonly string[]
  readonly safetyConstraints: readonly string[]
  readonly practicalConstraints: readonly string[]
  readonly knownAvoidances: readonly string[]
  readonly declaresNoConstraints: boolean
  readonly constraintsUndisclosed: boolean
  readonly requiresSpecificAvoidance: boolean
  readonly unresolvedSpecificAvoidance: boolean
}

export type HistoricalAnswerV1 = string | number | readonly string[]

/**
 * A v1 finalisation, read on v1's terms.
 *
 * Its own type, never `ConsultationFinalisation` and never a cast to one. The
 * live type's `scienceContractVersion` is pinned to today's constant, so
 * calling a historical payload one of those would be a claim the payload does
 * not make — and the compiler would stop checking the difference exactly where
 * it matters most.
 */
export interface HistoricalConsultationFinalisationV1 {
  readonly kind: string
  readonly schemaVersion: number
  readonly finalisationVersion: string
  readonly bankVersion: string
  readonly bankFingerprint: string
  readonly scienceContractVersion: string
  readonly foundation: string
  readonly entitledLens: string | null
  readonly applicableQuestionIds: readonly string[]
  readonly trustedAnswers: Readonly<Record<string, HistoricalAnswerV1>>
  readonly trustedAnswersByField: Readonly<Record<string, HistoricalAnswerV1>>
  readonly skippedOptionalQuestionIds: readonly string[]
  readonly foodGuidance: HistoricalFoodGuidanceV1
  readonly finalisedAt: string
}

export interface HistoricalSnapshotV1 {
  readonly kind: string
  readonly schemaVersion: number
  readonly bankVersion: string
  readonly bankFingerprint: string
  readonly foundation: string
  readonly entitledLens: string | null
  readonly createdAt: string
}

export interface HistoricalStateV1 {
  readonly kind: string
  readonly schemaVersion: number
  readonly candidateAnswers: Readonly<Record<string, unknown>>
  readonly touchedQuestionIds: readonly string[]
  readonly skippedOptionalQuestionIds: readonly string[]
  readonly currentQuestionId: string | null
  readonly phase: string
}

/* ══ WHERE THE COMPILE-TIME BRIDGE LIVES ══════════════════════════════════
 *
 * Not here. Two structural definitions of one document is how two definitions
 * drift apart, so `tsc` is made to prove that everything the live composer can
 * build is a valid persisted artifact — but the assertion needs the LIVE types,
 * and importing those here would make this module reach into
 * `lib/report/deterministic/` and `lib/consultation/`, which is precisely what
 * the historical boundary forbids. A type-only import is erased at runtime and
 * would still be a dependency in the module graph, and a guard that has to
 * carve out an exception is a guard with a hole in it.
 *
 * So the bridge lives in `tests/unit/consultation-report-wire-v1.test.ts`,
 * where importing both sides is exactly right. `tsc` type-checks the test
 * suite, and the gate runs `tsc`, so the assertion is enforced on every build.
 */
