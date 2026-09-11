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
  STRUCTURAL_COPY,
  contentPackFor,
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

/**
 * One answer this sentence rests on — the question AND the value together.
 *
 * ══ WHY A TUPLE AND NOT TWO PARALLEL LISTS ══════════════════════════════════
 *
 * Because the constructor used to take `sourceQuestionIds` and an OPTIONAL
 * `sourceValues` map, and resolve the words from a separate `{questionId,
 * value}` pair. Three descriptions of one fact, reconciled nowhere: a caller
 * could take permission and provenance from question A while the sentence came
 * from question B, and the Report would record an origin that was not true.
 * The optional map was worse still — omitting it skipped every value-level
 * rule for the value that actually produced the words.
 *
 * A source is now one indivisible fact, and the PRIMARY one is derived from
 * the content rather than supplied beside it.
 */
export interface PropositionSource {
  readonly questionId: string
  /**
   * The exact value the words came from. Never absent.
   *
   * ══ WHY NOT `string | null` ═════════════════════════════════════════════
   *
   * It was, for one round, to describe a contributing question that supplied
   * no enumerated value — and that possibility was a fail-open. The
   * value-level rules could only run where a value existed, so a source
   * recorded with `null` was a source whose rules were never evaluated. A
   * caller could name `core_rhythm_recent_change_v1` with no value and record
   * it as contributing while `health-event` — `no-proposition` at value
   * level — went unchecked.
   *
   * Rejecting `null` would not have been the fix: an arbitrary valid value
   * from an unrelated answer passes every rule and is still a false record.
   * The fix was removing caller-authored sources altogether, which leaves no
   * derivation that can produce a value-less source. Narrowing the type
   * records that, and turns "unreachable" into "unrepresentable".
   *
   * A later multi-source mechanism that genuinely needs a value-less source
   * must widen this back deliberately, and be reviewed for exactly the hole
   * above when it does.
   */
  readonly value: string
}

export interface ReportProposition {
  /** Stable across builds. The narrative layer of a later phase addresses these. */
  readonly id: string
  readonly kind: PropositionKind
  /**
   * Every answer behind this sentence, the PRIMARY one first.
   *
   * The primary is the source the reviewed template was resolved from. It is
   * derived, so it is always present and always agrees with the words.
   */
  readonly sources: readonly PropositionSource[]
  /** Derived from `sources`, for callers that only care which questions. */
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
  /** A quotation was asked for with nothing to quote. */
  | "quotation-empty"
  /** A content route that is not reachable through this constructor. */
  | "content-route-unavailable"
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
 * Two sources, and each one also SETTLES THE PROVENANCE:
 *
 *   `content-pack`  — reviewed wording, keyed by question and answer value.
 *                     That key is simultaneously the primary source, so the
 *                     words and the origin cannot be different answers.
 *   `proposition`   — a re-framing of a sentence already built and already
 *                     checked: the 30-day loop's four beats. It inherits its
 *                     source's sources AND its capability requirements,
 *                     because re-framing a gated sentence does not ungate it
 *                     and does not re-attribute it.
 *
 * There was a third, `structural`, which took an allow-listed template id and
 * ARBITRARY TEXT with arbitrary kind, use, target and provenance. The
 * allow-list constrained the id and nothing else. It existed for exactly one
 * thing — quoting the customer's own answer — so that one thing now has its
 * own constructor (`buildQuotationProposition`) and the general route is gone.
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

/**
 * The quotation route, reachable ONLY through `buildQuotationProposition`.
 *
 * Not part of `PropositionContent` and not exported, so no caller can name
 * it. `buildProposition` additionally refuses it at runtime — a type that is
 * merely unexported is closed to honest callers and open to a cast, and this
 * is the route whose whole purpose is that it cannot be reached generically.
 */
interface QuotationContent {
  readonly from: "quotation"
  /** The customer's own trimmed answer. The only variable part of a quotation. */
  readonly answer: string
}

type InternalContent = PropositionContent | QuotationContent

export interface PropositionInput {
  id: string
  kind: PropositionKind
  allowedUse: AllowedReportUse
  target: ConsultationReportTarget
  /**
   * Deliberately NO `templateId`, `text`, `templateCapabilities`,
   * `sourceQuestionIds` or `sourceValues`.
   *
   * Every removal closed the same shape of hole — an authority the caller was
   * trusted to relay faithfully:
   *
   *   1. a `capability` the caller chose, so `safetyNetting` could stand in
   *      for a food sentence's gate;
   *   2. the words and their gates as separate arguments, so the words could
   *      be selected and the gate simply not added;
   *   3. the provenance as a separate argument from the content, so the
   *      recorded origin could be a different answer from the one the
   *      sentence came from — and an optional value map whose omission
   *      skipped the value-level rules entirely.
   *
   * The caller now names ONE identity. The pack, the target, the permission
   * registry and this constructor derive everything else from it.
   */
  content: PropositionContent
  /*
   * Deliberately NO `additionalSources` either.
   *
   * The round before this one derived the PRIMARY source from the content and
   * left secondary sources as a caller-supplied array. That kept the same
   * invariant broken one field further along: the sentence's own origin was
   * established by an authority, and everything else recorded beside it was
   * merely claimed.
   *
   * Nothing used it. Every composer call site passes `content` alone, so the
   * only consumers were the tests exercising the field itself — a hole with
   * no feature behind it.
   *
   * If genuine multi-source wording is ever needed, the mechanism is a
   * content identity that owns its whole source set, or a constructor over
   * already-built propositions that DERIVES the union of theirs. Neither is
   * a caller handing over tuples, and neither is designed here, because S2
   * does not need it.
   */
}

/** The words and the gates, established together by an authority. */
interface ResolvedContent {
  readonly templateId: string
  readonly text: string
  readonly requiresCapabilities: readonly ReportCapability[]
}

/**
 * The answers a content identity IS — derived, never supplied.
 *
 * ══ WHY THIS IS SEPARATE FROM RESOLVING THE WORDS ═══════════════════════════
 *
 * Because the provenance is knowable without the pack, and it has to be: the
 * permission records and the value-level rules are checked against it, and
 * those refusals must be reported ahead of anything the pack has to say. A
 * value the registry has silenced should refuse as `value-silenced` whether
 * or not the pack also happens to be silent about it — the stronger authority
 * names the reason.
 *
 * Both branches are total and neither consults the caller: a pack identity is
 * its own source, and a re-framing carries the sources of the sentence it
 * re-frames.
 */
function primarySourcesOf(content: InternalContent): readonly PropositionSource[] {
  if (content.from === "content-pack") {
    return [{ questionId: content.questionId, value: content.value }]
  }
  if (content.from === "quotation") {
    // The answer IS the source value, and the words are built from it — so
    // the recorded provenance and the sentence cannot describe different
    // things here either.
    return [{ questionId: QUOTATION_QUESTION_ID, value: content.answer }]
  }
  return content.source.sources
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
  content: InternalContent,
): { ok: true; resolved: ResolvedContent } | { ok: false; reason: PropositionRefusalReason; detail: string } {
  if (content.from === "quotation") {
    return {
      ok: true,
      resolved: {
        templateId: QUOTATION_TEMPLATE_ID,
        // Reviewed lead-in, versioned with the pack, plus the customer's own
        // words inside quotation marks. Assembled here and nowhere else.
        text: `${STRUCTURAL_COPY.quotationLeadIn} \u201c${content.answer}\u201d`,
        requiresCapabilities: [],
      },
    }
  }

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

  return {
    ok: true,
    resolved: {
      templateId: `${content.source.templateId}.${content.templateIdSuffix}`,
      text: content.source.text,
      // Inherited, all three. A re-framing of a gated sentence is still
      // gated, says the same thing, and came from the same answers — the loop
      // beat repeats the lever, so it cannot repeat it under another name.
      requiresCapabilities: content.source.requiredCapabilities,
    },
  }
}

/**
 * Build a proposition, or say precisely why it may not exist.
 *
 * Refusals are values. A composer that had to catch exceptions would be a
 * composer that could swallow one.
 */
export function buildProposition(input: PropositionInput): PropositionResult {
  /*
   * The quotation route is refused here at RUNTIME, not merely left out of
   * the exported type. An unexported variant is closed to an honest caller
   * and open to a cast, and this is precisely the route whose purpose is that
   * it cannot be reached generically. `buildQuotationProposition` goes to the
   * core directly.
   */
  if (input.content.from !== "content-pack" && input.content.from !== "proposition") {
    return {
      ok: false,
      reason: "content-route-unavailable",
      detail: `${input.id}: that content route is not reachable through buildProposition`,
    }
  }
  return buildPropositionCore(input)
}

function buildPropositionCore(
  input: Omit<PropositionInput, "content"> & { content: InternalContent },
): PropositionResult {
  const refuse = (reason: PropositionRefusalReason, detail: string): PropositionResult => ({
    ok: false,
    reason,
    detail,
  })

  /* ── Provenance, derived from the content identity ──────────────────── */
  /*
   * THE WHOLE SOURCE SET, derived. Nothing is appended, because there is no
   * argument through which anything could be. The authority that established
   * the sentence is the authority that establishes where it came from.
   */
  const sources: readonly PropositionSource[] = primarySourcesOf(input.content)

  if (sources.length === 0) {
    /*
     * Unreachable: every branch of `primarySourcesOf` is total and returns at
     * least one source. Kept because it is the invariant, not the branch,
     * that matters — a future content route that returned nothing would
     * refuse here rather than emit an unattributed sentence.
     */
    return refuse("no-source", `${input.id} has no source question`)
  }

  const sourceQuestionIds = sources.map((source) => source.questionId)

  const records = []
  for (const questionId of sourceQuestionIds) {
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
  /*
   * Over the BOUND sources, unconditionally. Two shapes used to let a rule
   * go unevaluated and both are gone: an optional value map whose omission
   * skipped every rule, and a nullable source value that skipped the rule
   * for that source. Every recorded source now has a value, and every value
   * is checked.
   *
   * `health-event` is the case that makes this matter — `no-proposition` at
   * value level because the Science Contract withdrew reported health
   * history, and previously reachable by simply not declaring it.
   */
  for (const { questionId, value } of sources) {
    if (valueIsSilenced(questionId, value)) {
      return refuse(
        "value-silenced",
        `${input.id}: ${questionId}="${value}" — ${valueRuleFor(questionId, value)?.reason ?? "silenced"}`,
      )
    }
  }

  /* ── One authority per proposition ──────────────────────────────────── */
  /*
   * Currently unreachable, and kept on purpose.
   *
   * Every proposition now has exactly one derived source, so two bases
   * cannot meet in one sentence and aggregation has nothing to weaken. Both
   * checks below guard the multi-source mechanism a later phase may add —
   * the moment a constructor unions several propositions' sources, this is
   * what stops a product decision borrowing an adjudication's authority.
   *
   * This is the opposite call from the priority precedence audit, which
   * deleted its unreachable rules. Those were product decisions that read as
   * live while being dead. These are safety invariants whose entire value is
   * firing when the shape they guard returns, and rebuilding them later,
   * under deadline, is how they come back weaker.
   */
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
  const statuses: ScienceEvidenceStatus[] = sourceQuestionIds.map((id) => {
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
      sources,
      sourceQuestionIds,
      sourceFields: records.map((r) => r.answerField),
      basis: records[0].basis,
      allowedUse: input.allowedUse,
      target: input.target,
      templateId,
      text,
      evidenceStatus,
      requiredCapabilities: requiredCapabilitiesFor({
        sourceQuestionIds,
        target: input.target,
        // The PACK's answer, relayed straight from the resolver. There is no
        // caller-facing argument that reaches this parameter.
        templateCapabilities: requiresCapabilities,
      }),
    },
  }
}

/* ══ The quotation ═════════════════════════════════════════════════════════ */

/** Fixed by contract, not by argument. */
export const QUOTATION_QUESTION_ID = "core_intentions_success_v1"
export const QUOTATION_TEMPLATE_ID: StructuralTemplateId = "intentions.success.quotation"

/**
 * Quote the customer's own answer — the ONLY route to a quotation.
 *
 * ══ WHY THIS IS A CONSTRUCTOR AND NOT A CONTENT VARIANT ═════════════════════
 *
 * There used to be a `structural` content variant taking an allow-listed
 * template id and ARBITRARY TEXT, alongside a caller-supplied kind, use,
 * target and provenance. The allow-list constrained the id and nothing else,
 * so the single sentence it existed for was wrapped in a general-purpose
 * route into unreviewed wording attributed to any question at all.
 *
 * It exists for one thing, so it is one thing. Everything here is fixed:
 *
 *   source question  core_intentions_success_v1
 *   kind             quotation
 *   allowed use      descriptive-recap
 *   target           systemSnapshot
 *   template id      intentions.success.quotation
 *   lead-in          reviewed, versioned copy from the content pack
 *
 * The ONLY variable portion is the customer's own trusted answer, and it is
 * reproduced inside quotation marks rather than described. Nothing here reads
 * it: it selects no template, no priority, no section and no other sentence
 * anywhere in the composer.
 *
 * ══ A NARROWED ENTRY POINT, NOT A BYPASS ════════════════════════════════════
 *
 * It delegates to `buildProposition` via the same permission, value-rule,
 * authority, aggregation and framing checks as everything else. If the
 * permission record for the success question ever stopped granting
 * descriptive-recap to systemSnapshot, this would refuse like any other
 * proposition.
 */
export function buildQuotationProposition(input: { answer: string }): PropositionResult {
  const answer = input.answer.trim()
  if (answer.length === 0) {
    // An empty quotation would attribute silence to the customer.
    return {
      ok: false,
      reason: "quotation-empty",
      detail: `${QUOTATION_TEMPLATE_ID}: there is nothing to quote`,
    }
  }
  return buildPropositionCore({
    id: QUOTATION_TEMPLATE_ID,
    kind: "quotation",
    allowedUse: "descriptive-recap",
    target: "systemSnapshot",
    content: { from: "quotation", answer },
  })
}

/**
 * States no set of propositions may assert, whatever their sources.
 *
 * Re-exported from the contract rather than restated, so the list cannot drift
 * from the adjudicated one.
 */
export const CANNOT_BE_PRODUCED_BY_AGGREGATION = AGGREGATION_EVIDENCE_RULE.cannotProduce
