import type { ReportProposition } from "@/lib/report/deterministic/proposition"

import { isEligibleKind } from "../contract"
import type { NarrativeRewriteRequest } from "./rewriter"

/**
 * The projection — Phase 4A-S3, authoring.
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
 * module constructs a `NarrativeRewriteRequest`.
 *
 * ══ WHY ELIGIBILITY IS CHECKED HERE AS WELL AS BEFORE ═══════════════════════
 *
 * The generator decides eligibility before it ever reaches this function, so a
 * quotation or a loop beat is never projected. This second check is not
 * belt-and-braces politeness: it means removing the generator's check does not,
 * on its own, put a customer's own words on the wire. Two independent places
 * must be wrong at once.
 */

export type ProjectionResult =
  | { readonly ok: true; readonly request: NarrativeRewriteRequest }
  | { readonly ok: false; readonly reason: "ineligible-kind" }

export function projectForRewrite(proposition: ReportProposition): ProjectionResult {
  if (!isEligibleKind(proposition.kind)) return { ok: false, reason: "ineligible-kind" }

  /*
   * One field, read by name. Not a spread, not a pick helper, not a mapped
   * type over the proposition — each of those grows silently when the
   * proposition grows, and the field added tomorrow would ship on the wire
   * without anybody choosing to send it.
   */
  const request: NarrativeRewriteRequest = { text: proposition.text }
  return { ok: true, request: Object.freeze(request) }
}
