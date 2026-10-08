import { band, type Band } from "@/lib/report/build-food-system-report"

/**
 * How a report should talk to this customer.
 *
 *   protect  — strong overall. Maintenance framing.
 *   building — middling overall.
 *   early    — low overall. One manageable starting point.
 *
 * This lives in its own module because TWO surfaces need the same decision and
 * must not drift: the fallback report body (lib/fallback-paid-report.ts) and
 * the paid report's hero headline (components/assessment/paid-report-client.tsx).
 * One definition, both callers.
 *
 * ══ 0R-6R · `mixed` IS RETIRED, AND THE REASONING IS WORTH KEEPING ═════════
 *
 * There was a fourth framing. `computeOverall` is `0.4·pre + 0.2·pro + 0.4·post`
 * with a floor of 20 per pillar, so a customer who eats no fermented food at all
 * still scores ~72 and bands "strong". `mixed` existed so that such a customer
 * was not told everything was fine on a page that printed Probiotics 20/100
 * three sections later. The report contradicted itself, and `mixed` was the
 * repair.
 *
 * Both halves of that contradiction are gone. The page no longer prints a
 * per-Biotic score anywhere, so there is no second statement to contradict —
 * and `mixed` could only be computed by banding the LOWEST of the three, which
 * is an argmin over scores no reviewer has authorised anyone to rank.
 *
 * The underlying weighting concern is real and is NOT fixed by this: a 20/100
 * probiotics input still contributes to a "strong" overall. That belongs to the
 * FSS methodology review, where weights are the subject, rather than to a copy
 * branch that routed around it.
 */
export type Framing = "protect" | "building" | "early"

/*
 * ══ 0R-6R · `Framing` KEYS ON THE OVERALL BAND ALONE ═══════════════════════
 *
 * It was `framingFor(overallBand, priorityBand)` where `priorityBand` was the
 * band of the LOWEST of the three sub-scores — an argmin, and therefore a
 * ranking, choosing which of four framings the paid Report was written in.
 *
 * The "mixed" branch existed only to tell a strong overall score apart from one
 * with a thin pathway underneath it. That distinction is exactly the comparison
 * no reviewer has authorised: the three sub-scores come from different question
 * sets, so "this one is the thin one" presupposes they are commensurable.
 *
 * The overall score is a single figure on one scale — the Biotics Score™ — and
 * banding it is the thing this function can honestly do.
 */
export function framingFor(overallBand: Band): Framing {
  if (overallBand === "strong") return "protect"
  if (overallBand === "building") return "building"
  return "early"
}

/**
 * The framing for a set of scores, derived the same way everywhere: the
 * priority pathway is the lowest-scoring one per `orderedByNeed`, and both it
 * and the overall score are banded with the shared `band()` thresholds.
 */
export function framingForScores(overall: number): { framing: Framing } {
  /*
   * 0R-6R · this took `subScores` and returned `priorityPathway` and
   * `priorityScore` beside the framing. Both were `orderedByNeed(biotics)[0]`.
   *
   * It also returned `null` when the three could not be resolved — a fail-closed
   * guard whose own comment read "a caller that cannot resolve real pathway
   * scores must not be handed a confident 'your thinnest pathway is X'". With
   * no thinnest pathway to hand out, there is nothing to fail closed about, and
   * the overall score is always present.
   */
  return { framing: framingFor(band(overall)) }
}

/*
 * ══ 0R-6R · THE HERO NO LONGER NAMES A THINNEST PATHWAY ════════════════════
 *
 * `heroTaglineFor` existed to fix a real disagreement, and the fix was itself a
 * ranking claim. On `mixed` framing it replaced the authored tagline with:
 *
 *     "A strong overall base, with ${PATHWAY_LABEL[priorityPathway]} the
 *      thinnest part of your answers."
 *
 * — at the top of the €49 Report, on `components/assessment/paid-report-client`.
 *
 * ── WHY REMOVING IT DOES NOT REOPEN WHAT IT FIXED ─────────────────────────
 *
 * The disagreement it was written for: `getProfile` keys purely on the overall
 * score, so its `>= 80` branch could say "all three pathways are well supported"
 * directly above a "Your Pattern" card reporting Probiotics at 25/100.
 *
 * That card is gone. Nothing in the Report states a per-Biotic score or band any
 * more, so there is no longer a second statement for the hero to contradict —
 * the two halves of the disagreement were removed in the same tranche, and this
 * one went with the one that made it necessary.
 *
 * `getProfile` is still NOT changed: it serves the free results page, the emails
 * and the share card, and re-banding it would move copy on all three.
 */
/*
 * ── AND THE FUNCTION STILL HAS A JOB, BECAUSE THE TRACE FOUND ONE ─────────
 *
 * Removing the `mixed` override exposed what it had been covering. For a high
 * scorer, `getProfile`'s tagline is:
 *
 *     "Your answers point to all three pathways being well supported."
 *
 * — a BAND WORD applied to this member's three Biotics, which the permanent
 * product rule prohibits in the same breath as a number or a bar. Before this
 * tranche the `mixed` branch replaced that sentence for exactly the cohort most
 * likely to see it, with a ranking sentence that was prohibited for a different
 * reason. Deleting the override without noticing would have swapped one
 * prohibited claim for another and called it a repair.
 *
 * So the Report-layer correction stays and is re-aimed: it no longer resolves a
 * contradiction, it REFUSES A CLAIM. `getProfile` is still not changed — it
 * feeds the free results page, the emails and the share card, and those surfaces
 * are a wider finding recorded in the register, not this tranche's.
 */
/*
 * Two shapes, and the second was found by reading the rendered Report.
 *
 *   >= 80   "Your answers point to all three pathways being well supported."
 *   >= 65   "A solid base in your answers, with one pathway thinner than the
 *            rest."
 *
 * The first is a band word over all three; the second is a RANKING with the
 * pathway left unnamed, which is the same claim with the subject elided. Both
 * come from `getProfile` (`lib/assessment-scoring.ts:110,120`), which also
 * feeds the free results page, the emails and the share card — a wider finding
 * recorded in the register. This boundary stops either reaching the paid
 * Report's hero.
 */
const PERSONAL_PATHWAY_STATE =
  /\ball three pathways\b[\s\S]{0,40}\b(?:well supported|being supported|are supported)\b|\bone(?: or two)? pathways?\b[\s\S]{0,30}\bthinner\b/i

export function heroTaglineFor(freeScores: {
  profile: { tagline?: string | null }
}): string | null {
  const authored = freeScores.profile?.tagline?.trim() || null
  if (!authored) return null
  // Null, not a substitute sentence: the hero falls back to the tier label,
  // and absence is the honest answer when the authored line cannot be shown.
  if (PERSONAL_PATHWAY_STATE.test(authored)) return null
  return authored
}
