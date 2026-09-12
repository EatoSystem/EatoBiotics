import type { PersonalFoodSystemReportV1 } from "@/lib/report/deterministic/report-types"
import { serialiseReport } from "@/lib/report/deterministic/serialise"

import { narrativeDigest } from "./digest"
import { canonicalPropositionOrder } from "./order"
import { committedPackForVersion } from "./internal/committed-packs"
import { renderPlanWithPack, type NarrativeRenderPlan } from "./internal/render"
import type { OptionalNarrativeLayerV1 } from "./types"

export type { NarrativeRenderPlan } from "./internal/render"

/**
 * Two separate proofs — Phase 4A-S3.
 *
 * ══ THE DISTINCTION THAT MATTERS ════════════════════════════════════════════
 *
 *   "this overlay is structurally bound to this Report"
 *   "this overlay is authorised to render narrative wording"
 *
 * These are not the same claim, and conflating them is how a correctly bound
 * but unauthorised overlay ends up on a page. `overlayMatchesReport` proves
 * only the first. It is NOT sufficient to render narrative, and nothing here
 * describes it as though it were.
 *
 * ══ AND THERE IS NO PACK ARGUMENT ═══════════════════════════════════════════
 *
 * `narrativeRenderPlan` used to take one, which meant the caller supplied the
 * authority. It now resolves the pack from the committed registry, by the
 * version the OVERLAY names — so the only packs that can contribute wording
 * are the ones in source control. A version nobody committed is unusable, and
 * unusable means the canonical Report renders.
 */

/* ══ Proof 1 — structural binding ══════════════════════════════════════════ */

/**
 * Is this overlay about this document?
 *
 * Digest, length, ids and per-position content digests. Nothing about
 * authority: a hand-built overlay naming a variant nobody reviewed passes this
 * happily, which is exactly why it is not the check a renderer uses.
 */
export function overlayMatchesReport(
  overlay: OptionalNarrativeLayerV1,
  report: PersonalFoodSystemReportV1,
): boolean {
  if (overlay.canonicalReportDigest !== narrativeDigest(serialiseReport(report))) return false
  const propositions = canonicalPropositionOrder(report)
  if (overlay.items.length !== propositions.length) return false
  for (let i = 0; i < propositions.length; i += 1) {
    const item = overlay.items[i]
    if (item.propositionId !== propositions[i].id) return false
    if (item.canonicalTextDigest !== narrativeDigest(propositions[i].text)) return false
  }
  return true
}

/* ══ Proof 2 — authority to render ═════════════════════════════════════════ */

export interface NarrativeRenderPlanInput {
  readonly overlay: OptionalNarrativeLayerV1
  readonly report: PersonalFoodSystemReportV1
}

/**
 * Decide, once, what every position renders.
 *
 * Resolves the committed pack the overlay names, then runs the full
 * authority check. `text[i]` is the exact string for canonical position `i` —
 * pack wording where a reviewed variant applies, canonical wording everywhere
 * else — so the renderer performs no join of its own.
 */
export function narrativeRenderPlan(input: NarrativeRenderPlanInput): NarrativeRenderPlan {
  const pack = committedPackForVersion(input.overlay.variantPackVersion)
  if (!pack) {
    /*
     * A version nobody committed, or a committed pack that no longer
     * validates. Both mean the same thing to a renderer, and neither is
     * recoverable by looking somewhere else — there is nowhere else to look.
     */
    return {
      usable: false,
      reason: "variant-pack-unknown",
      detail: `no committed pack for version "${input.overlay.variantPackVersion}"`,
    }
  }
  return renderPlanWithPack({ overlay: input.overlay, report: input.report, pack })
}
