import { createHash } from "node:crypto"

import type { ReportProposition } from "@/lib/report/deterministic/proposition"
import type { PersonalFoodSystemReportV1 } from "@/lib/report/deterministic/report-types"
import { serialiseReport } from "@/lib/report/deterministic/serialise"

import {
  NARRATIVE_CONTRACT_VERSION,
  NARRATIVE_PROMPT_VERSION,
  NARRATIVE_VALIDATOR_VERSION,
  isEligibleKind,
  ineligibleReasonFor,
  type NarrativeFallbackReason,
} from "./contract"
import { canonicalPropositionOrder } from "./order"
import { projectForRewrite } from "./project"
import {
  NARRATIVE_LAYER_KIND,
  type NarrativeItem,
  type NarrativeRewriter,
  type OptionalNarrativeLayerV1,
} from "./types"
import { validateRewrite } from "./validate"

/**
 * The overlay orchestrator — Phase 4A-S3.
 *
 * ══ THE CONTRACT IN ONE LINE ════════════════════════════════════════════════
 *
 * One item per canonical proposition, in canonical order, always — and every
 * item that is not an accepted rewrite is `canonical-only` with a typed reason.
 * There is no path from here to a failed Report. The worst thing this function
 * can do is return an overlay in which nothing was accepted, which is exactly
 * the S2 Report.
 *
 * ══ WHY COMPLETENESS IS THE INVARIANT, NOT A NICETY ═════════════════════════
 *
 * A sparse overlay would have to be joined to the Report by index or by id at
 * render time, and a join is a place where the wrong sentence can be labelled
 * with the wrong rewrite. A total, ordered overlay makes that join positional
 * and checkable: same length, same order, same ids, or the renderer ignores it.
 *
 * ══ WHY NOTHING IS RETRIED ══════════════════════════════════════════════════
 *
 * A validation rejection is a judgement about the returned wording, not a
 * transient error, and asking again is asking the same question until the
 * answer changes. Falling back costs nothing: the canonical sentence was
 * already approved, and the customer sees a correct Report either way.
 */

function sha256(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex")
}

export interface BuildNarrativeOverlayInput {
  readonly report: PersonalFoodSystemReportV1
  /**
   * The injected seam. S3 wires no provider — every caller today supplies a
   * deterministic fake, and the live one belongs to the later runtime boundary.
   */
  readonly rewriter: NarrativeRewriter
  /**
   * Off unless a caller says otherwise.
   *
   * S3 does not activate narrative, and a default of `true` would mean the
   * layer switched itself on the moment somebody imported it. Disabled is not
   * a degraded mode: it produces a complete overlay of canonical-only items.
   */
  readonly enabled?: boolean
  /** How many rewrite operations may be in flight. One operation each, never batched. */
  readonly concurrency?: number
  /** Per-operation deadline. Exceeded is `rewriter-timeout`, never an error. */
  readonly timeoutMs?: number
}

const DEFAULT_CONCURRENCY = 4
const DEFAULT_TIMEOUT_MS = 15_000

/**
 * One rewrite operation, resolved to a status. Never rejects.
 *
 * The success shape is `{ accepted }` and not `{ text }` deliberately: a
 * guard asserts that no module except `project.ts` constructs an object
 * shaped like the wire payload, and an internal result that happened to look
 * like one would make that guard unable to tell the difference.
 */
async function rewriteOne(
  proposition: ReportProposition,
  rewriter: NarrativeRewriter,
  timeoutMs: number,
): Promise<{ readonly accepted: string } | { readonly reason: NarrativeFallbackReason }> {
  /*
   * Eligibility was decided by the caller before this function was reached.
   * `projectForRewrite` decides it again, independently, because the payload
   * and the decision to send one must not be able to disagree — see project.ts.
   */
  const projected = projectForRewrite(proposition)
  if (!projected.ok) return { reason: projected.reason }

  let timer: ReturnType<typeof setTimeout> | undefined
  const TIMED_OUT = Symbol("timed-out")

  try {
    const deadline = new Promise<typeof TIMED_OUT>((resolve) => {
      timer = setTimeout(() => resolve(TIMED_OUT), timeoutMs)
    })
    const response = await Promise.race([rewriter.rewrite(projected.request), deadline])
    if (response === TIMED_OUT) return { reason: "rewriter-timeout" }

    // A response of the wrong shape is malformed, not a crash. `unknown` is
    // deliberate: nothing about a provider's output is trusted to be typed.
    const candidate = (response as { rewritten?: unknown } | null | undefined)?.rewritten
    const outcome = validateRewrite(proposition.text, candidate)
    if (!outcome.ok) return { reason: outcome.reason }
    return { accepted: candidate as string }
  } catch {
    // Anything thrown — a network error, a provider SDK, a fake in a test — is
    // one reason, because the consequence is identical and the difference is
    // not the narrative layer's to interpret.
    return { reason: "rewriter-failed" }
  } finally {
    if (timer !== undefined) clearTimeout(timer)
  }
}

/**
 * Build the overlay.
 *
 * Never throws, never mutates the Report, never persists anything, and never
 * needs to know who the customer is.
 */
export async function buildNarrativeOverlay(
  input: BuildNarrativeOverlayInput,
): Promise<OptionalNarrativeLayerV1> {
  const { report, rewriter } = input
  const enabled = input.enabled === true
  const concurrency = Math.max(1, input.concurrency ?? DEFAULT_CONCURRENCY)
  const timeoutMs = input.timeoutMs ?? DEFAULT_TIMEOUT_MS

  const propositions = canonicalPropositionOrder(report)

  /*
   * Eligibility for EVERY proposition, decided up front and in one place,
   * BEFORE any rewriter exists in the control flow. A proposition that is not
   * eligible has no path to a call: it is not in the work list at all.
   */
  const outcomes: (NarrativeFallbackReason | null)[] = propositions.map((proposition) => {
    if (!enabled) return "narrative-disabled"
    if (!isEligibleKind(proposition.kind)) {
      return ineligibleReasonFor(proposition.kind) ?? "narrative-disabled"
    }
    return null
  })

  const pending: number[] = []
  for (let i = 0; i < propositions.length; i += 1) {
    if (outcomes[i] === null) pending.push(i)
  }

  const accepted = new Map<number, string>()

  /*
   * A bounded pool of workers over the pending indices. Each worker takes the
   * next index and issues exactly ONE operation for it. Two propositions are
   * never combined into one call, so a call physically cannot see a second
   * sentence — cross-proposition synthesis is unavailable rather than
   * prohibited. Results are written by index, so the overlay's order is the
   * document's order no matter what order the calls finish in.
   */
  let cursor = 0
  const worker = async (): Promise<void> => {
    for (;;) {
      const slot = cursor
      cursor += 1
      if (slot >= pending.length) return
      const index = pending[slot]
      const result = await rewriteOne(propositions[index], rewriter, timeoutMs)
      if ("accepted" in result) accepted.set(index, result.accepted)
      else outcomes[index] = result.reason
    }
  }
  /*
   * Built with a plain loop rather than the array constructor helper, so that
   * the guard banning the Supabase table selector from this directory can be
   * a blunt substring check instead of a regex trying to tell two unrelated
   * method names apart. (Spelled around rather than out, because a guard that
   * matched the sentence explaining it would be decoration.)
   */
  const workers: Promise<void>[] = []
  for (let i = 0; i < Math.min(concurrency, pending.length); i += 1) workers.push(worker())
  await Promise.all(workers)

  const items: NarrativeItem[] = propositions.map((proposition, index) => {
    const canonicalTextDigest = sha256(proposition.text)
    const narrativeText = accepted.get(index)
    if (narrativeText !== undefined) {
      return {
        propositionId: proposition.id,
        canonicalTextDigest,
        status: "accepted",
        narrativeText,
      }
    }
    return {
      propositionId: proposition.id,
      canonicalTextDigest,
      status: "canonical-only",
      // Every non-accepted item has a reason. The fallback here is not a
      // default worth reaching: it means an outcome slot was left null with no
      // accepted text, which the completeness tests assert cannot happen.
      fallbackReason: outcomes[index] ?? "narrative-disabled",
    }
  })

  return {
    kind: NARRATIVE_LAYER_KIND,
    narrativeContractVersion: NARRATIVE_CONTRACT_VERSION,
    promptVersion: NARRATIVE_PROMPT_VERSION,
    validatorVersion: NARRATIVE_VALIDATOR_VERSION,
    canonicalReportDigest: sha256(serialiseReport(report)),
    items,
  }
}

/**
 * The renderer's precondition, written down where it can be tested.
 *
 * An overlay is only usable against the document it was built from, and only
 * if it is still exactly 1:1 with it. This is the check a future renderer must
 * pass before reading a single narrative sentence; failing it means render the
 * canonical Report, which is always correct.
 */
export function overlayMatchesReport(
  overlay: OptionalNarrativeLayerV1,
  report: PersonalFoodSystemReportV1,
): boolean {
  if (overlay.canonicalReportDigest !== sha256(serialiseReport(report))) return false
  const propositions = canonicalPropositionOrder(report)
  if (overlay.items.length !== propositions.length) return false
  for (let i = 0; i < propositions.length; i += 1) {
    const item = overlay.items[i]
    if (item.propositionId !== propositions[i].id) return false
    if (item.canonicalTextDigest !== sha256(propositions[i].text)) return false
  }
  return true
}
