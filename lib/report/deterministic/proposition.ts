import {
  AGGREGATION_EVIDENCE_RULE,
  REPORT_COMPOSITION_BOUNDARY,
  aggregateEvidenceStatus,
  scienceContractFor,
  type AllowedReportUse,
  type ScienceEvidenceStatus,
} from "@/lib/consultation/science-contract"
import type { ConsultationReportTarget } from "@/lib/consultation/types"

import type { ReportCapability } from "./capabilities"
import {
  permissionFor,
  permitsUse,
  valueIsSilenced,
  valueRuleFor,
  type PermissionBasis,
} from "./permissions"

/**
 * The unit of authorised customer-facing truth — Phase 4A-S2.
 *
 * ══ THE QUESTION EVERY PROPOSITION MUST ANSWER ══════════════════════════════
 *
 *   WHY IS THIS ALLOWED TO EXIST?
 *
 * Mechanically, not in a review comment. A proposition carries the question
 * ids it came from, the semantic fields, which authority permits it, which
 * single use it exercises, which target it lands in, and which reviewed
 * template produced its words. If any of those cannot be supplied, the
 * proposition cannot be built — `buildProposition` returns a refusal instead.
 *
 * ══ WHY A CONSTRUCTOR AND NOT A LITERAL ═════════════════════════════════════
 *
 * Because a literal is a promise and a constructor is a check. Composition
 * code that could write `{ text: "…", allowedUse: "descriptive-recap" }`
 * directly would be asserting its own permission. Everything customer-facing
 * goes through the function below, and a guard asserts the composer never
 * builds the object shape by hand.
 *
 * ══ AGGREGATION ════════════════════════════════════════════════════════════
 *
 * A proposition may draw on more than one answer. When it does, the evidence
 * status is the WEAKEST of its sources (`aggregateEvidenceStatus`), and no
 * combination may produce a state in `AGGREGATION_EVIDENCE_RULE.cannotProduce`.
 * Four self-reports remain four self-reports.
 */

export type PropositionKind =
  | "recap"
  | "lever"
  | "loop-step"
  | "constraint"
  | "quotation"
  | "provenance"

export interface ReportProposition {
  /** Stable across builds. The narrative layer of a later phase addresses these. */
  readonly id: string
  readonly kind: PropositionKind
  readonly sourceQuestionIds: readonly string[]
  readonly sourceFields: readonly string[]
  readonly basis: PermissionBasis
  readonly allowedUse: AllowedReportUse
  readonly target: ConsultationReportTarget
  /** Which reviewed template produced the words, for content-pack provenance. */
  readonly templateId: string
  readonly text: string
  /** The weakest evidence status among the sources. */
  readonly evidenceStatus: ScienceEvidenceStatus
  readonly capability?: ReportCapability
}

export type PropositionRefusalReason =
  /** No source questions at all — an unsourced sentence. */
  | "no-source"
  /** A source question has no permission record. */
  | "no-permission-record"
  /** The record does not grant this use, or this target. */
  | "use-not-permitted"
  /** A contributing answer value is silenced at value level. */
  | "value-silenced"
  /** Sources disagree about which authority permits them. */
  | "mixed-basis"
  /** The text uses a framing the composition boundary prohibits. */
  | "prohibited-framing"
  /** The composition would assert a state aggregation cannot produce. */
  | "aggregation-upgrade"

export type PropositionResult =
  | { readonly ok: true; readonly proposition: ReportProposition }
  | { readonly ok: false; readonly reason: PropositionRefusalReason; readonly detail: string }

export interface PropositionInput {
  id: string
  kind: PropositionKind
  /** Non-empty. Every proposition traces to at least one answered question. */
  sourceQuestionIds: readonly string[]
  /** The answer values used, per question — checked against value rules. */
  sourceValues?: Readonly<Record<string, readonly string[]>>
  allowedUse: AllowedReportUse
  target: ConsultationReportTarget
  templateId: string
  text: string
  capability?: ReportCapability
}

/**
 * Does this sentence use a framing the Science Contract prohibits?
 *
 * Word-boundary matched and case-insensitive. `REPORT_COMPOSITION_BOUNDARY`
 * lists the framings that assert a finding rather than report a statement —
 * "We found", "This shows", "Your microbiome is". They are checked here rather
 * than only in a test, so a template can never route around composition.
 */
export function usesProhibitedFraming(text: string): string | null {
  const haystack = text.toLowerCase()
  for (const framing of REPORT_COMPOSITION_BOUNDARY.prohibitedFramings) {
    if (haystack.includes(framing.toLowerCase())) return framing
  }
  return null
}

/**
 * Build a proposition, or say precisely why it may not exist.
 *
 * Refusals are values. A composer that had to catch exceptions would be a
 * composer that could swallow one.
 */
export function buildProposition(input: PropositionInput): PropositionResult {
  const refuse = (reason: PropositionRefusalReason, detail: string): PropositionResult => ({
    ok: false,
    reason,
    detail,
  })

  if (input.sourceQuestionIds.length === 0) {
    return refuse("no-source", `${input.id} has no source question`)
  }

  const records = []
  for (const questionId of input.sourceQuestionIds) {
    const record = permissionFor(questionId)
    // No record is no permission — including for a question this build has
    // never heard of. There is no recap fallback.
    if (!record) {
      return refuse("no-permission-record", `${input.id}: ${questionId} has no permission record`)
    }
    if (!permitsUse(questionId, input.allowedUse, input.target)) {
      return refuse(
        "use-not-permitted",
        `${input.id}: ${questionId} does not permit ${input.allowedUse} → ${input.target}`,
      )
    }
    records.push(record)
  }

  /* ── Value-level denials ────────────────────────────────────────────── */
  for (const [questionId, values] of Object.entries(input.sourceValues ?? {})) {
    for (const value of values) {
      if (valueIsSilenced(questionId, value)) {
        return refuse(
          "value-silenced",
          `${input.id}: ${questionId}="${value}" — ${valueRuleFor(questionId, value)?.reason ?? "silenced"}`,
        )
      }
    }
  }

  /* ── One authority per proposition ──────────────────────────────────── */
  const kinds = new Set(records.map((r) => r.basis.kind))
  if (kinds.size > 1) {
    /*
     * A sentence resting on both a science adjudication and a product decision
     * has no single answer to "who permitted this", and the weaker authority
     * would be the one doing the work while the stronger one lent its name.
     * Split it into two propositions instead.
     */
    return refuse("mixed-basis", `${input.id} mixes science-adjudicated and product-operational sources`)
  }

  /* ── Aggregation does not upgrade evidence ──────────────────────────── */
  const statuses: ScienceEvidenceStatus[] = input.sourceQuestionIds.map((id) => {
    const contract = scienceContractFor(id)
    // A product-operational source is not adjudicated evidence at all. It is
    // treated as the weakest recognised status so it can never lift a
    // combination, and never claim more than the logistics it describes.
    return contract?.evidenceStatus ?? "CONTEXT_ONLY"
  })
  const evidenceStatus = aggregateEvidenceStatus(statuses)
  if (evidenceStatus === "PROHIBITED") {
    return refuse("aggregation-upgrade", `${input.id} aggregates to PROHIBITED`)
  }

  /* ── Framing ────────────────────────────────────────────────────────── */
  const framing = usesProhibitedFraming(input.text)
  if (framing) {
    return refuse("prohibited-framing", `${input.id} uses the prohibited framing "${framing}"`)
  }

  return {
    ok: true,
    proposition: {
      id: input.id,
      kind: input.kind,
      sourceQuestionIds: [...input.sourceQuestionIds],
      sourceFields: records.map((r) => r.answerField),
      basis: records[0].basis,
      allowedUse: input.allowedUse,
      target: input.target,
      templateId: input.templateId,
      text: input.text,
      evidenceStatus,
      capability: input.capability ?? records.find((r) => r.capability)?.capability,
    },
  }
}

/**
 * States no set of propositions may assert, whatever their sources.
 *
 * Re-exported from the contract rather than restated, so the list cannot drift
 * from the adjudicated one.
 */
export const CANNOT_BE_PRODUCED_BY_AGGREGATION = AGGREGATION_EVIDENCE_RULE.cannotProduce
