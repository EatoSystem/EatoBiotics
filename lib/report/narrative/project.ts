import type { ReportProposition } from "@/lib/report/deterministic/proposition"

import { isEligibleKind, ineligibleReasonFor, type NarrativeFallbackReason } from "./contract"
import type { NarrativeRewriteRequest } from "./types"

/**
 * The projection — Phase 4A-S3.
 *
 * ══ THE ONE PLACE A PAYLOAD IS BUILT ════════════════════════════════════════
 *
 * Everything that leaves the application passes through this function, and it
 * reads exactly one field of one proposition. That is the whole privacy
 * argument: not "the prompt asks the model not to look at the id", but "the id
 * was never in the request".
 *
 * A `ReportProposition` carries `sources[]` — the raw answer values, and for a
 * quotation the customer's entire free text — plus `sourceQuestionIds`,
 * `sourceFields`, `basis`, `evidenceStatus`, `templateId`, `target`, `kind` and
 * `requiredCapabilities`. Handing one to a rewriter would hand over the
 * answers. So a proposition goes IN and a `{ text }` comes OUT, and no other
 * module in this directory constructs a `NarrativeRewriteRequest`.
 *
 * ══ WHY NOT EVEN AN OPAQUE HANDLE ═══════════════════════════════════════════
 *
 * Because one rewrite operation is issued per proposition, the caller already
 * knows which proposition a call belongs to — the promise IS the correlation.
 * An id would be disclosure buying nothing, and its absence makes "the response
 * named the wrong proposition" unrepresentable rather than something to check.
 *
 * ══ WHY ELIGIBILITY IS CHECKED HERE AS WELL AS BEFORE ═══════════════════════
 *
 * The orchestrator decides eligibility before it ever reaches this function, so
 * a quotation or a loop beat is never projected. This second check is not
 * belt-and-braces politeness: it means that removing the orchestrator's check
 * does not, on its own, put a customer's own words on the wire. Two independent
 * places must be wrong at once, and the behavioural tests assert zero rewriter
 * invocations for both excluded kinds regardless of which one is broken.
 */

export type ProjectionResult =
  | { readonly ok: true; readonly request: NarrativeRewriteRequest }
  | { readonly ok: false; readonly reason: NarrativeFallbackReason }

export function projectForRewrite(proposition: ReportProposition): ProjectionResult {
  if (!isEligibleKind(proposition.kind)) {
    // `ineligibleReasonFor` is total over the kind union, but a kind that is
    // neither eligible nor one of the two named exclusions must still not be
    // sent, so the null case refuses rather than falling through.
    return { ok: false, reason: ineligibleReasonFor(proposition.kind) ?? "narrative-disabled" }
  }

  /*
   * One field, read by name. Not a spread, not a pick helper, not a mapped
   * type over the proposition — each of those grows silently when the
   * proposition grows, and the field added tomorrow would ship on the wire
   * without anybody choosing to send it.
   */
  const request: NarrativeRewriteRequest = { text: proposition.text }
  return { ok: true, request: Object.freeze(request) }
}
