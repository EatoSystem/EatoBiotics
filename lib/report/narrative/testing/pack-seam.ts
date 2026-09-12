import type { PersonalFoodSystemReportV1 } from "@/lib/report/deterministic/report-types"

import { buildOverlayWithPack } from "../internal/build"
import { renderPlanWithPack, type NarrativeRenderPlan } from "../internal/render"
import type { OptionalNarrativeLayerV1 } from "../types"
import {
  NARRATIVE_VARIANT_PACK_KIND,
  TEST_NARRATIVE_VARIANT_PACK_PREFIX,
  type NarrativeVariantPackV1,
  type ReviewedNarrativeVariant,
} from "../variant-pack"

/**
 * The test seam — Phase 4A-S3.
 *
 * ══ WHY A SEPARATE MODULE, AND NOT A FLAG ═══════════════════════════════════
 *
 * The production pack is empty and mechanically required to stay empty while
 * the Narrative Acceptance Gate is OPEN, so the runtime machinery cannot be
 * exercised at all without a non-empty pack from somewhere. That "somewhere"
 * is the thing to be careful about: while the test-pack constructor sat beside
 * the production types, a caller could build a `test:` pack and hand it to the
 * same public path that serves a customer's Report.
 *
 * The isolation is therefore STRUCTURAL rather than conditional:
 *
 *   · the public entry points take no pack argument at all, so there is no
 *     parameter through which a test pack could reach them;
 *   · the pack-taking implementations live in `internal/`, importable only by
 *     those entry points and by this file;
 *   · this file is importable only from `tests/`, and a guard walks the repo
 *     to prove it.
 *
 * Deliberately NOT `NODE_ENV`. An environment variable is a runtime condition,
 * and a runtime condition is one misconfiguration away from being true in
 * production. A module nothing in `lib/` or `app/` imports cannot be reached
 * however the process is started.
 */

/** Build a `test:` pack, refusing anything that could pass for production. */
export function testNarrativeVariantPack(
  version: string,
  variants: readonly ReviewedNarrativeVariant[],
): NarrativeVariantPackV1 {
  if (!version.startsWith(TEST_NARRATIVE_VARIANT_PACK_PREFIX)) {
    throw new Error(
      `refusing to build variant pack "${version}": test pack versions must begin with "${TEST_NARRATIVE_VARIANT_PACK_PREFIX}"`,
    )
  }
  return { kind: NARRATIVE_VARIANT_PACK_KIND, version, variants }
}

/** The production build path, against a test pack. Tests only. */
export function buildOverlayWithTestPack(input: {
  readonly report: PersonalFoodSystemReportV1
  readonly pack: NarrativeVariantPackV1
  readonly enabled?: boolean
}): OptionalNarrativeLayerV1 {
  return buildOverlayWithPack({
    report: input.report,
    pack: input.pack,
    enabled: input.enabled === true,
  })
}

/**
 * The production render path, against a test pack. Tests only.
 *
 * Note what this does NOT skip: every authority check in `renderPlanWithPack`
 * still runs. The seam supplies a pack; it does not excuse one.
 */
export function renderPlanWithTestPack(input: {
  readonly overlay: OptionalNarrativeLayerV1
  readonly report: PersonalFoodSystemReportV1
  readonly pack: NarrativeVariantPackV1
}): NarrativeRenderPlan {
  return renderPlanWithPack(input)
}
