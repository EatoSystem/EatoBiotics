/**
 * Reading a sealed Consultation the way v1 meant it — Phase 4A-S4.
 *
 * Structural decoders only. Nothing here resolves a bank, consults the Science
 * Contract, narrows a lens through today's add-on registry or asks whether a
 * question still exists. Those are questions about a LIVE Consultation, and a
 * Report that has already been persisted is not one.
 *
 * Every refusal is a value. A malformed seal is never repaired, never rebuilt
 * from the session's current answers, and never treated as absence.
 */

import {
  V1_FINALISATION_KEYS,
  V1_FINALISATION_KIND,
  V1_FINALISATION_SCHEMA_VERSION,
  V1_FOOD_GUIDANCE_KEYS,
  V1_CONSULTATION_FOUNDATIONS,
  V1_KNOWN_FINALISATION_VERSIONS,
  V1_KNOWN_SCIENCE_CONTRACT_VERSIONS,
  V1_PHASES,
  V1_PURCHASED_LENSES,
  V1_SNAPSHOT_KEYS,
  V1_SNAPSHOT_KIND,
  V1_SNAPSHOT_SCHEMA_VERSION,
  V1_STATE_KEYS,
  V1_STATE_KIND,
  V1_STATE_SCHEMA_VERSION,
} from "./v1-consultation-wire"
import type {
  HistoricalConsultationFinalisationV1,
  HistoricalSnapshotV1,
  HistoricalStateV1,
} from "./types"

/* ══ Shared primitives ═════════════════════════════════════════════════════ */

export const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v)

/** Exactly these keys — no more, no fewer. */
export const hasExactKeys = (v: Record<string, unknown>, keys: readonly string[]): boolean =>
  Object.keys(v).length === keys.length && keys.every((k) => k in v)

export const isNonEmptyString = (v: unknown): v is string =>
  typeof v === "string" && v.trim().length > 0

export const isStringArray = (v: unknown): v is string[] =>
  Array.isArray(v) && v.every(isNonEmptyString)

/** An ISO instant that round-trips. A string that merely looks like one is not. */
export const isInstant = (v: unknown): v is string =>
  typeof v === "string" && !Number.isNaN(Date.parse(v)) && new Date(v).toISOString() === v

const isAnswer = (v: unknown): boolean =>
  typeof v === "string" ||
  typeof v === "number" ||
  (Array.isArray(v) && v.every((x) => typeof x === "string"))

const isAnswerMap = (v: unknown): boolean =>
  isPlainObject(v) && Object.values(v).every(isAnswer)

/* ══ Snapshot ══════════════════════════════════════════════════════════════ */

export type HistoricalSnapshotResult =
  | { ok: true; snapshot: HistoricalSnapshotV1 }
  | { ok: false; reason: "malformed" }

export function decodeHistoricalSnapshotV1(value: unknown): HistoricalSnapshotResult {
  if (!isPlainObject(value)) return { ok: false, reason: "malformed" }
  if (!hasExactKeys(value, V1_SNAPSHOT_KEYS)) return { ok: false, reason: "malformed" }
  if (value.kind !== V1_SNAPSHOT_KIND) return { ok: false, reason: "malformed" }
  if (value.schemaVersion !== V1_SNAPSHOT_SCHEMA_VERSION) return { ok: false, reason: "malformed" }
  if (!isNonEmptyString(value.bankVersion)) return { ok: false, reason: "malformed" }
  if (!isNonEmptyString(value.bankFingerprint)) return { ok: false, reason: "malformed" }
  if (!(V1_CONSULTATION_FOUNDATIONS as readonly unknown[]).includes(value.foundation)) {
    return { ok: false, reason: "malformed" }
  }
  // An unrecognised lens is a REFUSAL, never `null`. The two mean opposite
  // things, and the second would quietly serve a lens-less handoff to somebody
  // who paid for one.
  if (!(V1_PURCHASED_LENSES as readonly unknown[]).includes(value.entitledLens)) {
    return { ok: false, reason: "malformed" }
  }
  if (!isNonEmptyString(value.createdAt)) return { ok: false, reason: "malformed" }

  return {
    ok: true,
    snapshot: {
      kind: value.kind,
      schemaVersion: value.schemaVersion,
      bankVersion: value.bankVersion,
      bankFingerprint: value.bankFingerprint,
      foundation: value.foundation as string,
      entitledLens: value.entitledLens as string | null,
      createdAt: value.createdAt,
    },
  }
}

/* ══ State ═════════════════════════════════════════════════════════════════ */

export type HistoricalStateResult =
  | { ok: true; state: HistoricalStateV1 }
  | { ok: false; reason: "malformed" }

export function decodeHistoricalStateV1(value: unknown): HistoricalStateResult {
  if (!isPlainObject(value)) return { ok: false, reason: "malformed" }
  if (!hasExactKeys(value, V1_STATE_KEYS)) return { ok: false, reason: "malformed" }
  if (value.kind !== V1_STATE_KIND) return { ok: false, reason: "malformed" }
  if (value.schemaVersion !== V1_STATE_SCHEMA_VERSION) return { ok: false, reason: "malformed" }
  if (!isPlainObject(value.candidateAnswers)) return { ok: false, reason: "malformed" }
  // An empty array satisfies `every`, so "no questions touched yet" passes
  // without a special case; a non-string member does not.
  if (!isStringArray(value.touchedQuestionIds)) return { ok: false, reason: "malformed" }
  if (!isStringArray(value.skippedOptionalQuestionIds)) return { ok: false, reason: "malformed" }
  if (value.currentQuestionId !== null && typeof value.currentQuestionId !== "string") {
    return { ok: false, reason: "malformed" }
  }
  if (!(V1_PHASES as readonly unknown[]).includes(value.phase)) {
    return { ok: false, reason: "malformed" }
  }

  return {
    ok: true,
    state: {
      kind: value.kind,
      schemaVersion: value.schemaVersion,
      candidateAnswers: value.candidateAnswers,
      touchedQuestionIds: value.touchedQuestionIds as string[],
      skippedOptionalQuestionIds: value.skippedOptionalQuestionIds as string[],
      currentQuestionId: value.currentQuestionId as string | null,
      phase: value.phase as string,
    },
  }
}

/* ══ Seal ══════════════════════════════════════════════════════════════════ */

export interface HistoricalSealColumns {
  consultation_finalisation?: unknown
  consultation_handoff_id?: unknown
}

export type HistoricalSeal =
  | { status: "unsealed" }
  | { status: "sealed"; handoffId: string; finalisation: unknown }
  | { status: "incoherent"; detail: string }

/**
 * The v1 seal predicate, restated by value.
 *
 * Deliberately a second implementation of `lib/consultation/seal.ts`, and the
 * duplication is the cost of the split: one says what "sealed" means for a
 * Consultation somebody is using today, this says what it meant for an artifact
 * already written. An agreement test pins them together for now; the day they
 * diverge, that is the historical contract holding still while the live one
 * moves, which is the entire point.
 */
export function readHistoricalSealV1(
  row: HistoricalSealColumns,
  state: Pick<HistoricalStateV1, "phase" | "currentQuestionId">,
): HistoricalSeal {
  const finalisation = row.consultation_finalisation
  const hasFinalisation = finalisation !== null && finalisation !== undefined
  const rawHandoff = row.consultation_handoff_id
  const handoffId =
    typeof rawHandoff === "string" && rawHandoff.trim().length > 0 ? rawHandoff : null
  const isReady = state.phase === "ready-for-report"

  if (!hasFinalisation && handoffId === null && !isReady) return { status: "unsealed" }

  if (rawHandoff !== null && rawHandoff !== undefined && handoffId === null) {
    return { status: "incoherent", detail: "handoff-not-a-string" }
  }

  if (!hasFinalisation || handoffId === null || !isReady) {
    return {
      status: "incoherent",
      detail: `finalisation=${hasFinalisation} handoff=${handoffId !== null} ready=${isReady}`,
    }
  }

  if (state.currentQuestionId !== null) {
    return { status: "incoherent", detail: "sealed-with-open-cursor" }
  }

  return { status: "sealed", handoffId, finalisation }
}

/* ══ Finalisation ══════════════════════════════════════════════════════════ */

export type HistoricalFinalisationRefusal =
  | "malformed"
  | "unsupported-version"
  | "identity-mismatch"

export type HistoricalFinalisationResult =
  | { ok: true; finalisation: HistoricalConsultationFinalisationV1 }
  | { ok: false; reason: HistoricalFinalisationRefusal }

function isFoodGuidance(v: unknown): boolean {
  if (!isPlainObject(v)) return false
  if (!hasExactKeys(v, V1_FOOD_GUIDANCE_KEYS)) return false
  const arrays = [
    "declaredConstraints",
    "safetyConstraints",
    "practicalConstraints",
    "knownAvoidances",
  ]
  const booleans = [
    "declaresNoConstraints",
    "constraintsUndisclosed",
    "requiresSpecificAvoidance",
    "unresolvedSpecificAvoidance",
  ]
  return (
    arrays.every((k) => isStringArray(v[k])) &&
    booleans.every((k) => typeof v[k] === "boolean")
  )
}

/**
 * Read a v1 finalisation, on v1's terms.
 *
 * `snapshot` is not optional here, unlike the live reader's. On the historical
 * path the snapshot has always just been decoded from the same row, and the
 * four immutable facts they share — foundation, entitled lens, bank version,
 * bank fingerprint — are the only evidence that this payload belongs to this
 * Consultation at all. Making the check optional would make it skippable.
 */
export function decodeHistoricalFinalisationV1(
  value: unknown,
  snapshot: Pick<
    HistoricalSnapshotV1,
    "foundation" | "entitledLens" | "bankVersion" | "bankFingerprint"
  >,
): HistoricalFinalisationResult {
  if (!isPlainObject(value)) return { ok: false, reason: "malformed" }
  if (value.kind !== V1_FINALISATION_KIND) return { ok: false, reason: "malformed" }

  // Version before shape: a payload from a future contract is not malformed,
  // and calling it that sends whoever debugs it hunting for corruption.
  if (value.schemaVersion !== V1_FINALISATION_SCHEMA_VERSION) {
    return { ok: false, reason: "unsupported-version" }
  }
  if (!(V1_KNOWN_FINALISATION_VERSIONS as readonly unknown[]).includes(value.finalisationVersion)) {
    return { ok: false, reason: "unsupported-version" }
  }
  if (
    !(V1_KNOWN_SCIENCE_CONTRACT_VERSIONS as readonly unknown[]).includes(value.scienceContractVersion)
  ) {
    return { ok: false, reason: "unsupported-version" }
  }

  if (!hasExactKeys(value, V1_FINALISATION_KEYS)) return { ok: false, reason: "malformed" }
  if (!isNonEmptyString(value.bankVersion)) return { ok: false, reason: "malformed" }
  if (!isNonEmptyString(value.bankFingerprint)) return { ok: false, reason: "malformed" }
  if (!(V1_CONSULTATION_FOUNDATIONS as readonly unknown[]).includes(value.foundation)) {
    return { ok: false, reason: "malformed" }
  }
  if (!(V1_PURCHASED_LENSES as readonly unknown[]).includes(value.entitledLens)) {
    return { ok: false, reason: "malformed" }
  }
  if (!isStringArray(value.applicableQuestionIds)) return { ok: false, reason: "malformed" }
  if (!isAnswerMap(value.trustedAnswers)) return { ok: false, reason: "malformed" }
  if (!isAnswerMap(value.trustedAnswersByField)) return { ok: false, reason: "malformed" }
  if (!isStringArray(value.skippedOptionalQuestionIds)) return { ok: false, reason: "malformed" }
  if (!isFoodGuidance(value.foodGuidance)) return { ok: false, reason: "malformed" }
  if (!isInstant(value.finalisedAt)) return { ok: false, reason: "malformed" }

  if (
    value.foundation !== snapshot.foundation ||
    value.entitledLens !== snapshot.entitledLens ||
    value.bankVersion !== snapshot.bankVersion ||
    value.bankFingerprint !== snapshot.bankFingerprint
  ) {
    return { ok: false, reason: "identity-mismatch" }
  }

  return {
    ok: true,
    finalisation: value as unknown as HistoricalConsultationFinalisationV1,
  }
}
