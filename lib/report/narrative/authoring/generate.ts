import type { ReportProposition } from "@/lib/report/deterministic/proposition"
import type { PersonalFoodSystemReportV1 } from "@/lib/report/deterministic/report-types"

import {
  isEligibleKind,
  type EligiblePropositionKind,
} from "../contract"
import { narrativeDigest } from "../digest"
import { canonicalPropositionOrder } from "../order"
import {
  NARRATIVE_PROMPT_VERSION,
  NARRATIVE_VALIDATOR_VERSION,
  type AuthoringRejectionReason,
} from "./contract"
import { projectForRewrite } from "./project"
import type { NarrativeRewriter } from "./rewriter"
import { validateRewrite, type NarrativeRejectionClass } from "./validate"

/**
 * Candidate generation — Phase 4A-S3, authoring.
 *
 * ══ THIS RUNS OFFLINE ═══════════════════════════════════════════════════════
 *
 * A person runs it, reads the output, and decides. It is not reachable from a
 * customer request: nothing under `lib/report/narrative/` outside this
 * directory imports it, and a guard asserts that the runtime modules may not
 * even name `NarrativeRewriter`.
 *
 * What it produces is a BATCH FOR REVIEW — candidates that survived the
 * deterministic screen, plus the ones that did not and why. Surviving the
 * screen earns a candidate a reader, nothing more. A candidate becomes usable
 * only when a human approves it and it is committed to the Reviewed Narrative
 * Variant Pack, together with its review evidence.
 *
 * ══ WHAT IS KEPT FROM THE OLD RUNTIME ORCHESTRATOR ══════════════════════════
 *
 * One operation per proposition, never batched, so a call cannot see a second
 * sentence and cross-proposition synthesis is structurally unavailable. A
 * bounded worker pool and a per-operation deadline, so a hung provider ends the
 * batch rather than the person's afternoon. No retries: asking again is asking
 * the same question until the answer changes.
 *
 * The quotation and the four loop beats are never generated for, at all.
 */

export interface NarrativeCandidate {
  readonly templateId: string
  readonly propositionKind: EligiblePropositionKind
  readonly canonicalTextDigest: string
  /** Shown to the reviewer beside the candidate. Offline only. */
  readonly canonicalText: string
  readonly candidateText: string
}

export interface NarrativeCandidateRejection {
  readonly templateId: string
  readonly canonicalText: string
  readonly reason: AuthoringRejectionReason
  readonly rejectionClass?: NarrativeRejectionClass
  readonly detail: string
}

export interface NarrativeCandidateBatch {
  readonly promptVersion: typeof NARRATIVE_PROMPT_VERSION
  readonly validatorVersion: typeof NARRATIVE_VALIDATOR_VERSION
  /** Survived the screen. Awaiting a human. */
  readonly candidates: readonly NarrativeCandidate[]
  /** Did not. Kept, because a screen nobody can audit is a screen nobody trusts. */
  readonly rejected: readonly NarrativeCandidateRejection[]
}

export interface GenerateNarrativeCandidatesInput {
  readonly report: PersonalFoodSystemReportV1
  readonly rewriter: NarrativeRewriter
  readonly concurrency?: number
  readonly timeoutMs?: number
}

const DEFAULT_CONCURRENCY = 4
const DEFAULT_TIMEOUT_MS = 15_000

type OneResult =
  | { readonly candidateText: string }
  | { readonly reason: AuthoringRejectionReason; readonly rejectionClass?: NarrativeRejectionClass; readonly detail: string }

async function generateOne(
  proposition: ReportProposition,
  rewriter: NarrativeRewriter,
  timeoutMs: number,
): Promise<OneResult> {
  const projected = projectForRewrite(proposition)
  if (!projected.ok) {
    return { reason: "rewriter-failed", detail: "the proposition is not eligible" }
  }

  let timer: ReturnType<typeof setTimeout> | undefined
  const TIMED_OUT = Symbol("timed-out")

  try {
    const deadline = new Promise<typeof TIMED_OUT>((resolve) => {
      timer = setTimeout(() => resolve(TIMED_OUT), timeoutMs)
    })
    const response = await Promise.race([rewriter.rewrite(projected.request), deadline])
    if (response === TIMED_OUT) return { reason: "rewriter-timeout", detail: "deadline exceeded" }

    // Nothing about a provider's output is trusted to be typed.
    const candidate = (response as { rewritten?: unknown } | null | undefined)?.rewritten
    const outcome = validateRewrite(proposition.text, candidate)
    if (!outcome.ok) {
      return {
        reason: outcome.reason,
        rejectionClass: outcome.rejectionClass,
        detail: outcome.detail,
      }
    }
    return { candidateText: candidate as string }
  } catch {
    // Every throw is one reason: the consequence is identical and the
    // difference is not this layer's to interpret.
    return { reason: "rewriter-failed", detail: "the rewriter threw" }
  } finally {
    if (timer !== undefined) clearTimeout(timer)
  }
}

export async function generateNarrativeCandidates(
  input: GenerateNarrativeCandidatesInput,
): Promise<NarrativeCandidateBatch> {
  const { report, rewriter } = input
  const concurrency = Math.max(1, input.concurrency ?? DEFAULT_CONCURRENCY)
  const timeoutMs = input.timeoutMs ?? DEFAULT_TIMEOUT_MS

  /*
   * Eligibility decided BEFORE the rewriter appears in the control flow. An
   * ineligible proposition is not in the work list, so it has no path to a
   * call — the customer's quotation never leaves the application even here.
   */
  const eligible = canonicalPropositionOrder(report).filter((p) => isEligibleKind(p.kind))

  const candidates: NarrativeCandidate[] = []
  const rejected: NarrativeCandidateRejection[] = []
  const results = new Array<OneResult | undefined>(eligible.length)

  let cursor = 0
  const worker = async (): Promise<void> => {
    for (;;) {
      const index = cursor
      cursor += 1
      if (index >= eligible.length) return
      results[index] = await generateOne(eligible[index], rewriter, timeoutMs)
    }
  }
  const workers: Promise<void>[] = []
  for (let i = 0; i < Math.min(concurrency, eligible.length); i += 1) workers.push(worker())
  await Promise.all(workers)

  eligible.forEach((proposition, index) => {
    const result = results[index]
    if (!result) return
    if ("candidateText" in result) {
      candidates.push({
        templateId: proposition.templateId,
        propositionKind: proposition.kind as EligiblePropositionKind,
        canonicalTextDigest: narrativeDigest(proposition.text),
        canonicalText: proposition.text,
        candidateText: result.candidateText,
      })
      return
    }
    rejected.push({
      templateId: proposition.templateId,
      canonicalText: proposition.text,
      reason: result.reason,
      ...(result.rejectionClass ? { rejectionClass: result.rejectionClass } : {}),
      detail: result.detail,
    })
  })

  return {
    promptVersion: NARRATIVE_PROMPT_VERSION,
    validatorVersion: NARRATIVE_VALIDATOR_VERSION,
    candidates,
    rejected,
  }
}
