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
  PRODUCTION_CONTENT_PACK_ID,
  contentPackFor,
  isStructuralTemplateId,
  type StructuralTemplateId,
} from "./content-pack"
import {
  permissionFor,
  permitsUse,
  requiredCapabilitiesFor,
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
  /**
   * Every capability this proposition needs, DERIVED and immutable.
   *
   * A set rather than one value, because a single sentence can need more than
   * one gate — a named food described in Biotics language needs both — and a
   * single field would silently drop the second.
   */
  readonly requiredCapabilities: readonly ReportCapability[]
}

export type PropositionRefusalReason =
  /** The named content pack is not registered. */
  | "content-pack-unknown"
  /** The pack has no entry for this question and value — nobody decided. */
  | "content-unreviewed"
  /** The pack's entry is `null` — reviewed, and deliberately silent. */
  | "content-silent"
  /** A structural template id outside the pack's allow-list. */
  | "structural-id-unknown"
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

/**
 * Where a proposition's WORDS come from.
 *
 * ══ WHY THIS IS A UNION AND NOT A STRING ════════════════════════════════════
 *
 * Because `text` used to be an argument, and so did the template's
 * capabilities, and a caller could supply the first without the second. The
 * only way to close that is to stop accepting reviewed words at all: name the
 * disposition and let the authority that owns it say both what it reads and
 * what it costs.
 *
 * Three sources, because there are genuinely three:
 *
 *   `content-pack`  — reviewed wording, keyed by question and answer value.
 *                     The overwhelming majority, and the only one whose text
 *                     the caller never sees before construction.
 *   `proposition`   — a re-framing of a sentence already built and already
 *                     checked: the 30-day loop's four beats. It INHERITS its
 *                     source's capability requirements, because re-framing a
 *                     gated sentence does not ungate it.
 *   `structural`    — the customer's own prose, which no pack can hold.
 *                     Bounded by an allow-list of ids so it cannot become a
 *                     general route into unreviewed content.
 */
export type PropositionContent =
  | {
      readonly from: "content-pack"
      /** Defaults to the production pack. Tests may name a registered `test:` pack. */
      readonly packId?: string
      readonly questionId: string
      readonly value: string
    }
  | {
      readonly from: "proposition"
      readonly source: ReportProposition
      readonly templateIdSuffix: string
    }
  | {
      readonly from: "structural"
      readonly templateId: StructuralTemplateId
      readonly text: string
    }

export interface PropositionInput {
  id: string
  kind: PropositionKind
  /** Non-empty. Every proposition traces to at least one answered question. */
  sourceQuestionIds: readonly string[]
  /** The answer values used, per question — checked against value rules. */
  sourceValues?: Readonly<Record<string, readonly string[]>>
  allowedUse: AllowedReportUse
  target: ConsultationReportTarget
  /**
   * Deliberately NO `templateId`, `text` or `templateCapabilities`.
   *
   * The first version of this interface took a capability, and fell back to
   * the permission's own — so a caller could SUBSTITUTE `safetyNetting` for a
   * food sentence and pass the check while naming a food. The second removed
   * the substitution but still took the words and their gates as separate
   * arguments, so a caller could select the words and add no gate at all.
   *
   * Both holes have the same shape: an authority the caller was trusted to
   * relay. Now the caller relays nothing — it names a disposition, and the
   * pack, the target and the permission registry decide the rest.
   */
  content: PropositionContent
}

/** The words and the gates, established together by an authority. */
interface ResolvedContent {
  readonly templateId: string
  readonly text: string
  readonly requiresCapabilities: readonly ReportCapability[]
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
 * Establish the words and their capability requirements together.
 *
 * The single place either is decided. Returns a refusal reason rather than
 * throwing, so an unreviewed value and a deliberately silent one stay
 * distinguishable all the way up to the composer — the distinction the content
 * pack exists to make.
 */
function resolveContent(
  content: PropositionContent,
): { ok: true; resolved: ResolvedContent } | { ok: false; reason: PropositionRefusalReason; detail: string } {
  if (content.from === "content-pack") {
    const packId = content.packId ?? PRODUCTION_CONTENT_PACK_ID
    const pack = contentPackFor(packId)
    if (!pack) {
      return { ok: false, reason: "content-pack-unknown", detail: `no content pack "${packId}"` }
    }
    const disposition = pack.resolve(content.questionId, content.value)
    if (disposition === undefined) {
      return {
        ok: false,
        reason: "content-unreviewed",
        detail: `${packId}: ${content.questionId}="${content.value}" has no disposition`,
      }
    }
    if (disposition === null) {
      return {
        ok: false,
        reason: "content-silent",
        detail: `${packId}: ${content.questionId}="${content.value}" is reviewed and silent`,
      }
    }
    return {
      ok: true,
      resolved: {
        templateId: disposition.templateId,
        text: disposition.text,
        // FROM THE PACK. Not from the caller, and not defaulted to empty.
        requiresCapabilities: disposition.requiresCapabilities ?? [],
      },
    }
  }

  if (content.from === "proposition") {
    return {
      ok: true,
      resolved: {
        templateId: `${content.source.templateId}.${content.templateIdSuffix}`,
        text: content.source.text,
        // Inherited. A re-framing of a gated sentence is still gated — the
        // loop beat says the same thing four times, so it costs the same.
        requiresCapabilities: content.source.requiredCapabilities,
      },
    }
  }

  if (!isStructuralTemplateId(content.templateId)) {
    return {
      ok: false,
      reason: "structural-id-unknown",
      detail: `"${content.templateId}" is not a structural template id`,
    }
  }
  return {
    ok: true,
    resolved: { templateId: content.templateId, text: content.text, requiresCapabilities: [] },
  }
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

  /* ── The words, and what saying them costs ──────────────────────────── */
  /*
   * AFTER permission, value rules, authority and aggregation, deliberately.
   * Those refusals are about whether this sentence may exist at all; looking
   * up words for a sentence we are not permitted to say would report the
   * pack's opinion of a question the permission registry has already closed,
   * and the weaker reason would mask the stronger one.
   */
  const content = resolveContent(input.content)
  if (!content.ok) return refuse(content.reason, `${input.id}: ${content.detail}`)
  const { templateId, text, requiresCapabilities } = content.resolved

  /* ── Framing ────────────────────────────────────────────────────────── */
  const framing = usesProhibitedFraming(text)
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
      templateId,
      text,
      evidenceStatus,
      requiredCapabilities: requiredCapabilitiesFor({
        sourceQuestionIds: input.sourceQuestionIds,
        target: input.target,
        // The PACK's answer, relayed straight from the resolver. There is no
        // caller-facing argument that reaches this parameter.
        templateCapabilities: requiresCapabilities,
      }),
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
