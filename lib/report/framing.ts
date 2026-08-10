import { band, type Band } from "@/lib/report/build-food-system-report"
import {
  normalizeToBiotics,
  orderedByNeed,
  PATHWAY_LABEL,
  type BioticScoreKey,
  type IncomingSubScores,
} from "@/lib/report/subscores"

/**
 * How a report should talk to this customer.
 *
 * Deliberately NOT the same thing as the overall band. `computeOverall`
 * (lib/assessment-scoring.ts) is `0.4·pre + 0.2·pro + 0.4·post` with a floor of
 * 20 per pillar, so a customer who eats no fermented food at all — probiotics
 * 0, floored to 20 — still scores ~72 with decent fibre and rhythm and lands in
 * the "strong" band. Keying maintenance copy on the overall band alone told
 * that customer their 20/100 pathway was "well supported", "not a weakness to
 * fix" and "doesn't need fixing", on a page that prints Probiotics 20/100 three
 * sections later. The report contradicted itself.
 *
 *   protect  — strong overall AND no strained pathway. Maintenance framing.
 *   mixed    — strong overall BUT the priority pathway is strained. Names the
 *              strong foundation AND the under-supported pathway. Never claims
 *              everything is fine.
 *   building — middling overall.
 *   early    — low overall. One manageable starting point.
 *
 * `mixed` exists so that no copy branch anywhere can be reached by a profile
 * whose weakest pathway contradicts the sentence it is about to read.
 *
 * This lives in its own module because TWO surfaces need the same decision and
 * must not drift: the fallback report body (lib/fallback-paid-report.ts) and
 * the paid report's hero headline (components/assessment/paid-report-client.tsx).
 * One definition, both callers.
 */
export type Framing = "protect" | "mixed" | "building" | "early"

export function framingFor(overallBand: Band, priorityBand: Band): Framing {
  if (overallBand === "strong") return priorityBand === "strained" ? "mixed" : "protect"
  if (overallBand === "building") return "building"
  return "early"
}

/** Same shape the rest of the report layer accepts, aliases and all. */
type SubScoreInput = IncomingSubScores | null | undefined

/**
 * The framing for a set of scores, derived the same way everywhere: the
 * priority pathway is the lowest-scoring one per `orderedByNeed`, and both it
 * and the overall score are banded with the shared `band()` thresholds.
 */
export function framingForScores(
  overall: number,
  subScores: SubScoreInput,
): { framing: Framing; priorityPathway: BioticScoreKey; priorityScore: number } | null {
  // Null rather than a zero-filled default: a caller that cannot resolve real
  // pathway scores must not be handed a confident "your thinnest pathway is X".
  // Defaulting to zeros would band every pathway as strained and put an
  // invented claim in the headline.
  const biotics = normalizeToBiotics(subScores)
  if (!biotics) return null

  const [priorityPathway, priorityScore] = orderedByNeed(biotics)[0]

  return {
    framing: framingFor(band(overall), band(priorityScore)),
    priorityPathway,
    priorityScore,
  }
}

/**
 * The hero headline for the paid report.
 *
 * WHY THIS EXISTS — the hero renders `freeScores.profile.tagline`, which comes
 * from `getProfile` (lib/assessment-scoring.ts). `getProfile` keys purely on the
 * OVERALL score, and its `>= 80` branch returns "Your answers point to all three
 * pathways being well supported." Because probiotics carries only 20% of the
 * weighted total and is floored at 20, that branch is reachable with a strained
 * probiotics pathway: pre 95 / pro 25 / post 95 scores 81. Such a customer got a
 * hero claiming all three pathways are well supported, directly above a "Your
 * Pattern" card correctly telling them Probiotics is under-supported at 25/100.
 *
 * `getProfile` is NOT changed to fix this: it serves the free results page, the
 * emails and the share card, and re-banding it would move copy on all of them.
 * Instead the correction is applied here, in the report composition layer, where
 * the same `Framing` that drives the report body also decides the headline. On
 * `mixed` — and only on `mixed` — the generic tagline is replaced with one that
 * names both facts.
 *
 * The override is applied to every `mixed` profile rather than only the `>= 80`
 * branch on purpose: that makes "the hero agrees with the opening" true by
 * construction, instead of true for the bands that happened to be tested.
 */
export function heroTaglineFor(freeScores: {
  overall: number
  subScores: SubScoreInput
  profile: { tagline?: string | null }
}): string | null {
  const fallback = freeScores.profile?.tagline?.trim() || null
  const resolved = framingForScores(freeScores.overall, freeScores.subScores)

  // Unresolvable scores, or any framing that getProfile already describes
  // honestly — keep the authored tagline.
  if (!resolved || resolved.framing !== "mixed") return fallback

  return `A strong overall base, with ${PATHWAY_LABEL[resolved.priorityPathway]} the thinnest part of your answers.`
}
