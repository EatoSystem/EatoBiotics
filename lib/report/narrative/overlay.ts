import type { PersonalFoodSystemReportV1 } from "@/lib/report/deterministic/report-types"

import { buildOverlayWithPack } from "./internal/build"
import { currentCommittedPack } from "./registry"
import type { OptionalNarrativeLayerV1 } from "./types"

/**
 * The public way to build an overlay — Phase 4A-S3.
 *
 * ══ THERE IS NO PACK ARGUMENT, AND THAT IS THE WHOLE POINT ══════════════════
 *
 * This function used to take one. Review found what that meant: the caller
 * supplied the object that was supposed to establish authority, and pack
 * validation accepts any `test:`-prefixed version, so anybody could assemble a
 * variant with a real template, a real role, the correct digest and arbitrary
 * wording, hand it in, and have it render.
 *
 * The pack is now resolved from the committed registry — a frozen array in a
 * reviewed source file. A caller can decide WHETHER to build an overlay. It
 * cannot decide what wording exists.
 *
 * Tests that need a non-empty pack go through `testing/pack-seam.ts`, which no
 * production module may import and which only files under `tests/` do.
 */

export interface BuildNarrativeOverlayInput {
  readonly report: PersonalFoodSystemReportV1
  /**
   * Off unless a caller says otherwise.
   *
   * S3 does not activate narrative, and a default of `true` would mean the
   * layer switched itself on the moment somebody imported it. Disabled is not
   * a degraded mode: it produces a complete overlay of canonical-only items.
   *
   * Kept even though the committed pack is empty — two independent off
   * switches, and the one that does not depend on the pack's contents is the
   * one a deploy can reason about.
   */
  readonly enabled?: boolean
}

export function buildNarrativeOverlay(
  input: BuildNarrativeOverlayInput,
): OptionalNarrativeLayerV1 {
  return buildOverlayWithPack({
    report: input.report,
    pack: currentCommittedPack(),
    enabled: input.enabled === true,
  })
}
