import { CONSULTATION_QUESTION_BANK } from "@/lib/consultation/question-bank"
import { resolveApplicableQuestions } from "@/lib/consultation/applicability"
import {
  prepareConsultationFinalisation,
  type ConsultationFinalisation,
} from "@/lib/consultation/finalisation"
import {
  createDeterministicConsultationSnapshot,
  DETERMINISTIC_STATE_KIND,
  DETERMINISTIC_STATE_SCHEMA_VERSION,
  type DeterministicConsultationState,
} from "@/lib/consultation/session-envelope"
import type { ConsultationAnswers, ConsultationFoundation } from "@/lib/consultation/types"
import { composePersonalFoodSystemReport } from "@/lib/report/deterministic/compose"
import type { PersonalFoodSystemReportV1 } from "@/lib/report/deterministic/report-types"
import { isEligibleKind, type EligiblePropositionKind } from "@/lib/report/narrative/contract"
import { narrativeDigest } from "@/lib/report/narrative/digest"
import { canonicalPropositionOrder } from "@/lib/report/narrative/order"
import {
  bindingKey,
  type NarrativeVariantPackV1,
  type ReviewedNarrativeVariant,
} from "@/lib/report/narrative/variant-pack"
import {
  buildOverlayWithTestPack,
  renderPlanWithTestPack,
  testNarrativeVariantPack,
} from "@/lib/report/narrative/testing/pack-seam"
import type {
  NarrativeRewriteRequest,
  NarrativeRewriteResponse,
  NarrativeRewriter,
} from "@/lib/report/narrative/authoring/rewriter"

/**
 * Shared fixtures for the Phase 4A-S3 narrative suite.
 *
 * Reports are composed by the REAL S2 composer from real answers through the
 * real finalisation builder — the same path a sealed row takes. A hand-written
 * Report literal would let the narrative layer be tested against a shape that
 * never occurs, which is how a layer passes its own tests and fails in
 * production.
 *
 * Variant packs here are TEST packs, and reach the runtime only through
 * `testing/pack-seam.ts` — the public entry points take no pack argument at
 * all, so there is no parameter a test pack could travel through. The seam is
 * importable only from `tests/`, and a guard walks the repo to prove it.
 *
 * The production pack is empty and mechanically required to stay empty while
 * the gate is OPEN, so the machinery could not otherwise be exercised.
 *
 * Rewriters are FAKES. S3 wires no provider, and they are reachable only from
 * the authoring tests.
 */

const AT = new Date("2026-09-10T09:00:00.000Z")
const HANDOFF = "11111111-1111-4111-8111-111111111111"

export function completeAnswers(
  foundation: ConsultationFoundation,
  overrides: ConsultationAnswers = {},
): ConsultationAnswers {
  const answers: ConsultationAnswers = { ...overrides }
  for (let pass = 0; pass < 4; pass += 1) {
    for (const q of resolveApplicableQuestions({
      questions: CONSULTATION_QUESTION_BANK,
      context: { foundation },
      answers,
    })) {
      if (q.id in answers) continue
      if (q.type === "single") answers[q.id] = q.options![0].value
      else if (q.type === "multi") answers[q.id] = [q.options![0].value]
      else if (q.type === "textarea") answers[q.id] = "Fewer rushed mornings."
      else answers[q.id] = q.min ?? 0
    }
  }
  return answers
}

export function finalise(
  foundation: ConsultationFoundation,
  overrides: ConsultationAnswers = {},
): ConsultationFinalisation {
  const snapshot = createDeterministicConsultationSnapshot({
    foundation,
    entitledLens: null,
    now: AT,
  })
  const state: DeterministicConsultationState = {
    kind: DETERMINISTIC_STATE_KIND,
    schemaVersion: DETERMINISTIC_STATE_SCHEMA_VERSION,
    candidateAnswers: completeAnswers(foundation, overrides),
    touchedQuestionIds: [],
    skippedOptionalQuestionIds: [],
    currentQuestionId: null,
    phase: "review",
  }
  const result = prepareConsultationFinalisation({ snapshot, state, finalisedAt: AT })
  if (!result.ok) throw new Error(`fixture did not finalise: ${result.reason}`)
  return result.finalisation
}

export function reportFor(
  foundation: ConsultationFoundation,
  overrides: ConsultationAnswers = {},
): PersonalFoodSystemReportV1 {
  const result = composePersonalFoodSystemReport({
    finalisation: finalise(foundation, overrides),
    handoffId: HANDOFF,
  })
  if (!result.ok) throw new Error(`fixture did not compose: ${result.reason} — ${result.detail}`)
  return result.report
}

/* ══ Reviewed variant packs, for tests only ════════════════════════════════ */

/**
 * A reviewed variant for every eligible proposition in a Report.
 *
 * Deduplicated by BINDING, not by text: the priority lever and its recap twin
 * carry byte-identical wording in different roles, and each role is reviewed
 * separately, so each gets its own variant. That is the property the binding
 * exists to express, and building the fixture any other way would hide it.
 */
export function testPackForReport(
  report: PersonalFoodSystemReportV1,
  options: {
    readonly version?: string
    readonly restyle?: (text: string, kind: EligiblePropositionKind) => string
  } = {},
): NarrativeVariantPackV1 {
  const restyle = options.restyle ?? ((text) => text.replace("You told us", "You reported"))
  const byBinding = new Map<string, ReviewedNarrativeVariant>()

  for (const proposition of canonicalPropositionOrder(report)) {
    if (!isEligibleKind(proposition.kind)) continue
    const variant: ReviewedNarrativeVariant = {
      templateId: proposition.templateId,
      propositionKind: proposition.kind,
      canonicalTextDigest: narrativeDigest(proposition.text),
      variantId: `v-${byBinding.size + 1}`,
      narrativeText: restyle(proposition.text, proposition.kind),
    }
    const key = bindingKey(variant)
    if (!byBinding.has(key)) byBinding.set(key, variant)
  }

  return testNarrativeVariantPack(
    options.version ?? "test:narrative-variant-pack",
    [...byBinding.values()],
  )
}

/** An empty test pack — the shape of production, without production's identity. */
export function emptyTestPack(version = "test:empty"): NarrativeVariantPackV1 {
  return testNarrativeVariantPack(version, [])
}

/* ══ Authoring fakes ═══════════════════════════════════════════════════════ */

export interface RecordingRewriter extends NarrativeRewriter {
  /** Every payload that was handed over, in call order. */
  readonly calls: NarrativeRewriteRequest[]
}

/**
 * Records what it was sent and returns whatever `reply` says.
 *
 * The recorder is the strongest guard in the authoring suite: the privacy
 * claim is not "the payload builder looks minimal", it is "here is every
 * object that crossed the boundary, and this is all that was in them".
 */
export function recordingRewriter(
  reply: (request: NarrativeRewriteRequest) => unknown = (r) => ({ rewritten: r.text }),
): RecordingRewriter {
  const calls: NarrativeRewriteRequest[] = []
  return {
    calls,
    async rewrite(request: NarrativeRewriteRequest): Promise<NarrativeRewriteResponse> {
      calls.push(request)
      return reply(request) as NarrativeRewriteResponse
    },
  }
}

/** Returns the sentence unchanged — the model's always-acceptable answer. */
export function echoRewriter(): RecordingRewriter {
  return recordingRewriter((r) => ({ rewritten: r.text }))
}

/** Throws. Every throw is one reason, because the consequence is identical. */
export function throwingRewriter(): RecordingRewriter {
  return recordingRewriter(() => {
    throw new Error("provider exploded")
  })
}

/** Never resolves, so a deadline is the only way out. */
export function hangingRewriter(): RecordingRewriter {
  const calls: NarrativeRewriteRequest[] = []
  return {
    calls,
    rewrite(request: NarrativeRewriteRequest): Promise<NarrativeRewriteResponse> {
      calls.push(request)
      return new Promise<NarrativeRewriteResponse>(() => {})
    },
  }
}

/** Applies a transformation to the sentence — the adversarial shape. */
export function mutatingRewriter(mutate: (text: string) => string): RecordingRewriter {
  return recordingRewriter((r) => ({ rewritten: mutate(r.text) }))
}

/* ══ The production paths, driven with a test pack ═════════════════════════ */

/**
 * These go through the SAME implementations the public entry points call —
 * `buildOverlayWithPack` and `renderPlanWithPack` — so a test exercises the
 * real authority checks. The seam supplies a pack; it excuses nothing.
 */
export const buildTestOverlay = buildOverlayWithTestPack
export const renderTestPlan = renderPlanWithTestPack
