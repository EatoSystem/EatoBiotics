/**
 * The strict persisted-Report decoder — Phase 4A-S4.
 *
 * ══ WHY A CAST WOULD NOT DO ═════════════════════════════════════════════════
 *
 * `JSON.parse(text) as PersonalFoodSystemReportV1` turns every field below into
 * a promise kept by whatever happens to be in a database column. This document
 * is the thing a customer paid €49 for; a `safety` block read as `undefined` is
 * a Report served with no knowledge of an allergy.
 *
 * ══ WHY IT CONSULTS NOTHING LIVE ════════════════════════════════════════════
 *
 * Every value it checks against is frozen in `v1-wire.ts`. The bank registry,
 * the Science Contract, the permission registry, the content pack and the
 * capability registry all describe what a Report would mean if it were composed
 * today. A persisted Report was not composed today, and validating it against
 * any of them would make a paid artifact disappear the moment one moved.
 *
 * ══ WHAT IT REFUSES, AND WHAT IT NEVER DOES ═════════════════════════════════
 *
 * It refuses. It never coerces, never fills a default, never drops an unknown
 * key, and never hands back a partial document. The caller's response to every
 * refusal is to stop — not to recompose, because recomposing is how a Report
 * somebody already received gets quietly replaced.
 */

import {
  V1_ALLOWED_REPORT_USES,
  V1_BASIS_KINDS,
  V1_EVIDENCE_STATUSES,
  V1_FOOD_SAFETY_STATES,
  V1_FOUNDATIONS,
  V1_KNOWN_PRODUCER_IDENTITIES,
  V1_PRODUCT_OPERATIONAL_USES,
  V1_PROPOSITION_KINDS,
  V1_REPORT_CAPABILITIES,
  V1_REPORT_SCHEMA_VERSION,
  V1_REPORT_TARGETS,
  V1_SECTION_ROLES,
  V1_SOURCES_PER_PROPOSITION,
  v1QuestionAuthorityFor,
  type V1ProducerIdentity,
  type V1QuestionAuthority,
} from "./v1-wire"
import { hasExactKeys, isInstant, isNonEmptyString, isPlainObject, isStringArray } from "./decode-consultation"
import type {
  PersistedProvenanceV1,
  PersistedReportV1,
  PersistedSectionV1,
} from "./types"

export type PersistedReportRefusal =
  | "malformed"
  | "unsupported-schema"
  | "producer-identity-unknown"
  | "question-authority-mismatch"
  | "unknown-source-question"
  | "provenance-incoherent"
  | "cardinality-invalid"
  | "role-invalid"

export type PersistedReportResult =
  | { ok: true; report: PersistedReportV1; producer: V1ProducerIdentity }
  | { ok: false; reason: PersistedReportRefusal; detail: string }

const REPORT_KEYS = [
  "kind",
  "foundation",
  "systemSnapshot",
  "priorityLever",
  "thirtyDayLoop",
  "constraints",
  "safety",
  "provenance",
] as const
const OPTIONAL_REPORT_KEYS = ["familyContext", "quotation"] as const
const SECTION_KEYS = ["title", "propositions"] as const
const LOOP_STEP_KEYS = ["week", "beat", "proposition"] as const
const SAFETY_KEYS = ["state", "specificFoodsSuppressed", "suppressionReasons"] as const
const SAFETY_OPTIONAL_KEYS = ["note"] as const
const PROVENANCE_KEYS = [
  "reportSchemaVersion",
  "handoffId",
  "bankVersion",
  "bankFingerprint",
  "scienceContractVersion",
  "finalisationVersion",
  "reportUseRecordVersion",
  "composerVersion",
  "contentPackVersion",
  "capabilitiesAtCompose",
  "finalisedAt",
] as const
const PROPOSITION_KEYS = [
  "id",
  "kind",
  "sources",
  "sourceQuestionIds",
  "sourceFields",
  "basis",
  "allowedUse",
  "target",
  "templateId",
  "text",
  "evidenceStatus",
  "requiredCapabilities",
] as const
const SOURCE_KEYS = ["questionId", "value"] as const
const SA_BASIS_KEYS = ["kind", "contractVersion", "questionId"] as const
const PO_BASIS_KEYS = ["kind", "recordVersion", "approvedBy", "rationale"] as const

/** Exactly the required keys, plus any subset of the optional ones. */
function hasKeysWithOptional(
  v: Record<string, unknown>,
  required: readonly string[],
  optional: readonly string[],
): boolean {
  const actual = Object.keys(v)
  if (!required.every((k) => k in v)) return false
  return actual.every((k) => required.includes(k) || optional.includes(k))
}

const includes = (list: readonly unknown[], v: unknown): boolean => list.includes(v)

function bad(reason: PersistedReportRefusal, detail: string): PersistedReportResult {
  return { ok: false, reason, detail }
}

/* ══ Propositions ══════════════════════════════════════════════════════════ */

interface PropositionContext {
  readonly authority: Readonly<Record<string, V1QuestionAuthority>>
  readonly role: { readonly kind: string; readonly target: string }
  readonly where: string
}

function checkProposition(value: unknown, ctx: PropositionContext): PersistedReportResult | null {
  const where = ctx.where
  if (!isPlainObject(value)) return bad("malformed", `${where}: not an object`)
  if (!hasExactKeys(value, PROPOSITION_KEYS)) return bad("malformed", `${where}: unexpected key set`)

  if (!isNonEmptyString(value.id)) return bad("malformed", `${where}: id`)
  if (!isNonEmptyString(value.templateId)) return bad("malformed", `${where}: templateId`)
  if (!isNonEmptyString(value.text)) return bad("malformed", `${where}: text`)

  if (!includes(V1_PROPOSITION_KINDS, value.kind)) return bad("malformed", `${where}: kind`)
  if (!includes(V1_ALLOWED_REPORT_USES, value.allowedUse)) return bad("malformed", `${where}: allowedUse`)
  if (!includes(V1_REPORT_TARGETS, value.target)) return bad("malformed", `${where}: target`)
  if (!includes(V1_EVIDENCE_STATUSES, value.evidenceStatus)) {
    return bad("malformed", `${where}: evidenceStatus`)
  }

  /*
   * The document ROLE. Every value above is a legal v1 value on its own, which
   * is exactly why the pair has to be pinned to the position: a recap sitting
   * where the lever goes, or a constraint labelled `thirtyDayLoop`, describes a
   * document this producer never assembled.
   */
  if (value.kind !== ctx.role.kind) {
    return bad("role-invalid", `${where}: kind "${String(value.kind)}" is not "${ctx.role.kind}" here`)
  }
  if (value.target !== ctx.role.target) {
    return bad("role-invalid", `${where}: target "${String(value.target)}" is not "${ctx.role.target}" here`)
  }

  /* ── Sources ──────────────────────────────────────────────────────────── */
  if (!Array.isArray(value.sources)) return bad("malformed", `${where}: sources`)
  if (value.sources.length !== V1_SOURCES_PER_PROPOSITION) {
    return bad(
      "cardinality-invalid",
      `${where}: ${value.sources.length} sources; this producer emits exactly ${V1_SOURCES_PER_PROPOSITION}`,
    )
  }
  const sources: { questionId: string; value: string }[] = []
  for (const [i, raw] of value.sources.entries()) {
    if (!isPlainObject(raw)) return bad("malformed", `${where}: sources[${i}]`)
    if (!hasExactKeys(raw, SOURCE_KEYS)) return bad("malformed", `${where}: sources[${i}] key set`)
    if (!isNonEmptyString(raw.questionId)) return bad("malformed", `${where}: sources[${i}].questionId`)
    if (!isNonEmptyString(raw.value)) return bad("malformed", `${where}: sources[${i}].value`)
    sources.push({ questionId: raw.questionId, value: raw.value })
  }

  if (!isStringArray(value.sourceQuestionIds)) return bad("malformed", `${where}: sourceQuestionIds`)
  const derivedIds = sources.map((s) => s.questionId)
  if (
    value.sourceQuestionIds.length !== derivedIds.length ||
    value.sourceQuestionIds.some((id, i) => id !== derivedIds[i])
  ) {
    return bad("provenance-incoherent", `${where}: sourceQuestionIds disagree with sources`)
  }

  if (!isStringArray(value.sourceFields)) return bad("malformed", `${where}: sourceFields`)
  if (value.sourceFields.length !== sources.length) {
    return bad("provenance-incoherent", `${where}: sourceFields length`)
  }

  /* ── Authority ────────────────────────────────────────────────────────── */
  for (const [i, source] of sources.entries()) {
    const authority = ctx.authority[source.questionId]
    if (!authority) {
      return bad("unknown-source-question", `${where}: sources[${i}] "${source.questionId}"`)
    }
    if (value.sourceFields[i] !== authority.answerField) {
      return bad("provenance-incoherent", `${where}: sourceFields[${i}] is not this question's field`)
    }
  }

  const primary = ctx.authority[sources[0].questionId]
  const basis = value.basis
  if (!isPlainObject(basis)) return bad("malformed", `${where}: basis`)
  if (!includes(V1_BASIS_KINDS, basis.kind)) return bad("malformed", `${where}: basis.kind`)
  if (basis.kind !== primary.basisKind) {
    return bad(
      "question-authority-mismatch",
      `${where}: basis "${String(basis.kind)}" but "${sources[0].questionId}" is "${primary.basisKind}"`,
    )
  }

  if (primary.basisKind === "science-adjudicated") {
    if (!hasExactKeys(basis, SA_BASIS_KEYS)) return bad("malformed", `${where}: basis key set`)
    if (basis.contractVersion !== primary.contractVersion) {
      return bad("question-authority-mismatch", `${where}: basis.contractVersion`)
    }
    if (basis.questionId !== primary.basisQuestionId || basis.questionId !== sources[0].questionId) {
      return bad("question-authority-mismatch", `${where}: basis.questionId`)
    }
  } else {
    if (!hasExactKeys(basis, PO_BASIS_KEYS)) return bad("malformed", `${where}: basis key set`)
    if (basis.recordVersion !== primary.recordVersion) {
      return bad("question-authority-mismatch", `${where}: basis.recordVersion`)
    }
    if (basis.approvedBy !== "product") {
      return bad("question-authority-mismatch", `${where}: basis.approvedBy`)
    }
    if (basis.rationale !== primary.rationale) {
      return bad("question-authority-mismatch", `${where}: basis.rationale`)
    }
    // The category invariant, restated by value: a product-operational
    // authority never licensed a use that reads an answer as a signal.
    if (!includes(V1_PRODUCT_OPERATIONAL_USES, value.allowedUse)) {
      return bad("question-authority-mismatch", `${where}: allowedUse under a product-operational basis`)
    }
  }

  /* ── Capabilities ─────────────────────────────────────────────────────── */
  if (!Array.isArray(value.requiredCapabilities)) {
    return bad("malformed", `${where}: requiredCapabilities`)
  }
  const caps = value.requiredCapabilities
  if (!caps.every((c) => includes(V1_REPORT_CAPABILITIES, c))) {
    return bad("malformed", `${where}: unknown capability`)
  }
  if (new Set(caps).size !== caps.length) {
    return bad("malformed", `${where}: duplicate capability`)
  }

  return null
}

function checkSection(
  value: unknown,
  ctx: Omit<PropositionContext, "where">,
  where: string,
): PersistedReportResult | null {
  if (!isPlainObject(value)) return bad("malformed", `${where}: not an object`)
  if (!hasExactKeys(value, SECTION_KEYS)) return bad("malformed", `${where}: key set`)
  if (typeof value.title !== "string") return bad("malformed", `${where}: title`)
  if (!Array.isArray(value.propositions)) return bad("malformed", `${where}: propositions`)
  for (const [i, p] of value.propositions.entries()) {
    const failure = checkProposition(p, { ...ctx, where: `${where}.propositions[${i}]` })
    if (failure) return failure
  }
  return null
}

/* ══ Provenance ════════════════════════════════════════════════════════════ */

function matchProducer(p: PersistedProvenanceV1): V1ProducerIdentity | undefined {
  return V1_KNOWN_PRODUCER_IDENTITIES.find(
    (identity) =>
      identity.composerVersion === p.composerVersion &&
      identity.scienceContractVersion === p.scienceContractVersion &&
      identity.finalisationVersion === p.finalisationVersion &&
      identity.reportUseRecordVersion === p.reportUseRecordVersion &&
      identity.contentPackVersion === p.contentPackVersion &&
      identity.bankVersion === p.bankVersion &&
      identity.bankFingerprint === p.bankFingerprint &&
      Object.keys(p.capabilitiesAtCompose).length ===
        Object.keys(identity.capabilitiesAtCompose).length &&
      (Object.keys(identity.capabilitiesAtCompose) as (keyof typeof identity.capabilitiesAtCompose)[]).every(
        (key) => p.capabilitiesAtCompose[key] === identity.capabilitiesAtCompose[key],
      ),
  )
}

/* ══ The decoder ═══════════════════════════════════════════════════════════ */

export function decodePersistedReportV1(value: unknown): PersistedReportResult {
  if (!isPlainObject(value)) return bad("malformed", "report: not an object")
  if (value.kind !== V1_REPORT_SCHEMA_VERSION) return bad("unsupported-schema", "report.kind")
  if (!hasKeysWithOptional(value, REPORT_KEYS, OPTIONAL_REPORT_KEYS)) {
    return bad("malformed", "report: unexpected key set")
  }
  if (!includes(V1_FOUNDATIONS, value.foundation)) return bad("malformed", "report.foundation")

  /* ── Provenance and producer identity, before any content ─────────────── */
  const prov = value.provenance
  if (!isPlainObject(prov)) return bad("malformed", "provenance")
  if (!hasExactKeys(prov, PROVENANCE_KEYS)) return bad("malformed", "provenance: key set")
  if (prov.reportSchemaVersion !== V1_REPORT_SCHEMA_VERSION) {
    return bad("unsupported-schema", "provenance.reportSchemaVersion")
  }
  // The document says what it is in two places, and they must agree.
  if (prov.reportSchemaVersion !== value.kind) {
    return bad("provenance-incoherent", "kind and provenance.reportSchemaVersion disagree")
  }
  for (const key of [
    "handoffId",
    "bankVersion",
    "bankFingerprint",
    "scienceContractVersion",
    "finalisationVersion",
    "reportUseRecordVersion",
    "composerVersion",
    "contentPackVersion",
  ]) {
    if (!isNonEmptyString(prov[key])) return bad("malformed", `provenance.${key}`)
  }
  if (!isInstant(prov.finalisedAt)) return bad("malformed", "provenance.finalisedAt")
  if (!isPlainObject(prov.capabilitiesAtCompose)) {
    return bad("malformed", "provenance.capabilitiesAtCompose")
  }
  if (!Object.values(prov.capabilitiesAtCompose).every((v) => typeof v === "boolean")) {
    return bad("malformed", "provenance.capabilitiesAtCompose values")
  }

  const provenance = prov as unknown as PersistedProvenanceV1
  const producer = matchProducer(provenance)
  if (!producer) {
    return bad(
      "producer-identity-unknown",
      `no known producer emitted composer="${provenance.composerVersion}" bank="${provenance.bankVersion}" pack="${provenance.contentPackVersion}"`,
    )
  }

  const authority = v1QuestionAuthorityFor(provenance.reportUseRecordVersion)
  if (!authority) {
    return bad(
      "producer-identity-unknown",
      `no question authority for "${provenance.reportUseRecordVersion}"`,
    )
  }

  /* ── Sections, each pinned to its document role ───────────────────────── */
  const snapshotFail = checkSection(value.systemSnapshot, { authority, role: V1_SECTION_ROLES.systemSnapshot }, "systemSnapshot")
  if (snapshotFail) return snapshotFail
  const leverFail = checkSection(value.priorityLever, { authority, role: V1_SECTION_ROLES.priorityLever }, "priorityLever")
  if (leverFail) return leverFail
  const constraintsFail = checkSection(value.constraints, { authority, role: V1_SECTION_ROLES.constraints }, "constraints")
  if (constraintsFail) return constraintsFail

  const snapshot = value.systemSnapshot as unknown as PersistedSectionV1
  const lever = value.priorityLever as unknown as PersistedSectionV1

  /* ── Cardinality ──────────────────────────────────────────────────────── */
  if (lever.propositions.length > 1) {
    return bad("cardinality-invalid", `priorityLever holds ${lever.propositions.length} propositions`)
  }
  // The composer refuses when both are empty, so a document with nothing in
  // either is not one it produced.
  if (snapshot.propositions.length === 0 && lever.propositions.length === 0) {
    return bad("cardinality-invalid", "neither systemSnapshot nor priorityLever holds anything")
  }

  /* ── The loop: none, or all four in order ─────────────────────────────── */
  if (!Array.isArray(value.thirtyDayLoop)) return bad("malformed", "thirtyDayLoop")
  if (value.thirtyDayLoop.length !== 0 && value.thirtyDayLoop.length !== 4) {
    return bad("cardinality-invalid", `thirtyDayLoop holds ${value.thirtyDayLoop.length} steps`)
  }
  for (const [i, step] of value.thirtyDayLoop.entries()) {
    if (!isPlainObject(step)) return bad("malformed", `thirtyDayLoop[${i}]`)
    if (!hasExactKeys(step, LOOP_STEP_KEYS)) return bad("malformed", `thirtyDayLoop[${i}] key set`)
    if (step.week !== i + 1) return bad("cardinality-invalid", `thirtyDayLoop[${i}].week`)
    if (!isNonEmptyString(step.beat)) return bad("malformed", `thirtyDayLoop[${i}].beat`)
    const failure = checkProposition(step.proposition, {
      authority,
      role: V1_SECTION_ROLES.thirtyDayLoop,
      where: `thirtyDayLoop[${i}].proposition`,
    })
    if (failure) return failure
  }

  /* ── Safety ───────────────────────────────────────────────────────────── */
  const safety = value.safety
  if (!isPlainObject(safety)) return bad("malformed", "safety")
  if (!hasKeysWithOptional(safety, SAFETY_KEYS, SAFETY_OPTIONAL_KEYS)) {
    return bad("malformed", "safety: key set")
  }
  if (!includes(V1_FOOD_SAFETY_STATES, safety.state)) return bad("malformed", "safety.state")
  if (typeof safety.specificFoodsSuppressed !== "boolean") {
    return bad("malformed", "safety.specificFoodsSuppressed")
  }
  if (!isStringArray(safety.suppressionReasons)) return bad("malformed", "safety.suppressionReasons")
  if ("note" in safety && !isNonEmptyString(safety.note)) return bad("malformed", "safety.note")

  /* ── Household and quotation ──────────────────────────────────────────── */
  if ("familyContext" in value) {
    if (value.foundation !== "family") {
      return bad("role-invalid", "familyContext on a personal Report")
    }
    const failure = checkSection(
      value.familyContext,
      { authority, role: V1_SECTION_ROLES.familyContext },
      "familyContext",
    )
    if (failure) return failure
  }
  if ("quotation" in value) {
    const failure = checkProposition(value.quotation, {
      authority,
      role: V1_SECTION_ROLES.quotation,
      where: "quotation",
    })
    if (failure) return failure
  }

  return { ok: true, report: value as unknown as PersistedReportV1, producer }
}
