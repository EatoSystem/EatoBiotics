/**
 * The authoring seam — Phase 4A-S3.
 *
 * ══ WHERE THIS IS AND IS NOT ════════════════════════════════════════════════
 *
 * This interface exists so candidate wording can be GENERATED offline, by a
 * person running a batch, with a real provider or a fake. It is imported by
 * nothing at runtime, and a guard asserts that: the runtime modules may not so
 * much as name `NarrativeRewriter`.
 *
 * S3 wires no provider at all. Every test supplies a deterministic fake, so
 * provider independence is structural rather than promised.
 *
 * ══ THE PAYLOAD IS STILL MINIMAL ════════════════════════════════════════════
 *
 * Moving generation offline does not make disclosure acceptable. One approved
 * sentence goes out and one string comes back — no ids, no answers, no
 * metadata — because the sentences being restyled are the customer's reported
 * words either way, and the quotation is excluded at both ends of the process.
 */

/**
 * Everything that leaves the application, for one candidate.
 *
 * One field. Not a proposition id, not an opaque handle, not a question id,
 * not an answer value, not a section, not a kind, not a capability, not a
 * correlation id. With one operation per proposition the caller already knows
 * which proposition a call belongs to — the promise IS the correlation — so
 * any identifier would be disclosure with no purpose.
 *
 * `ReportProposition` is deliberately NOT accepted here. It carries
 * `sources[]` (the raw answer values, and for a quotation the customer's whole
 * free text), `sourceFields`, `basis`, `templateId` and `requiredCapabilities`.
 * Passing one would hand over the answers.
 */
export interface NarrativeRewriteRequest {
  readonly text: string
}

/**
 * Everything that comes back.
 *
 * No identifier either, so "the rewriter named the wrong proposition" is not a
 * failure mode to validate against — it cannot be expressed.
 */
export interface NarrativeRewriteResponse {
  readonly rewritten: string
}

export interface NarrativeRewriter {
  rewrite(request: NarrativeRewriteRequest): Promise<NarrativeRewriteResponse>
}
