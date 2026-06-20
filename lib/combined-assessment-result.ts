/**
 * Pure merge logic for foundation + add-on assessment results.
 *
 * A final EatoBiotics report is always one foundation (You / Family) plus an
 * optional add-on (Mind / Glucose / Stability / Performance). This module turns
 * the two normalised summaries into a single coherent, non-diagnostic report —
 * explaining what each score says and how the food-system baseline supports the
 * add-on area. No React / storage deps, so it is fully unit-testable.
 */

import { disclaimerFor } from "@/lib/assessment-disclaimers"
import type {
  AddonResult,
  AssessmentSummaryLike,
  CombinedResult,
  ConfidenceLabel,
  FoundationKey,
  FoundationResult,
  SubScore,
} from "@/lib/assessment-types"

/** "EatoBiotics" reads better than "You" in a report title. */
function foundationLabel(key: FoundationKey): string {
  return key === "family" ? "Family" : "EatoBiotics"
}

function dedupe(items: string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const item of items) {
    const trimmed = item.trim()
    if (!trimmed || seen.has(trimmed)) continue
    seen.add(trimmed)
    out.push(trimmed)
  }
  return out
}

function strengthOf(s: AssessmentSummaryLike): string {
  return s.strengths[0] ?? "your overall pattern"
}

function opportunityOf(s: AssessmentSummaryLike): string {
  return s.priorities[0] ?? "one steady next step"
}

function actionOf(s: AssessmentSummaryLike): string {
  return s.sevenDay[0] ?? "Pick one small, repeatable change for this week."
}

function eduSummaryOf(s: AssessmentSummaryLike): string {
  return (
    s.bandDescription ??
    `Your ${s.label} score is a snapshot of how your current patterns support this area — a starting point, not a verdict.`
  )
}

function subscoresOf(s: AssessmentSummaryLike): SubScore[] {
  return s.subscores ?? []
}

function toFoundationResult(
  f: AssessmentSummaryLike,
  confidenceLabel: ConfidenceLabel,
): FoundationResult {
  return {
    foundationType: f.key as FoundationKey,
    score: f.score,
    band: f.bandLabel,
    subscores: subscoresOf(f),
    strongestArea: strengthOf(f),
    biggestOpportunity: opportunityOf(f),
    weeklyAction: actionOf(f),
    confidenceLabel,
    educationalSummary: eduSummaryOf(f),
  }
}

function toAddonResult(a: AssessmentSummaryLike): AddonResult {
  const safetyFlags = a.safetyFlags && a.safetyFlags.length ? a.safetyFlags : undefined
  return {
    addonType: a.key as AddonResult["addonType"],
    score: a.score,
    band: a.bandLabel,
    subscores: subscoresOf(a),
    strongestArea: strengthOf(a),
    biggestOpportunity: opportunityOf(a),
    weeklyAction: actionOf(a),
    ...(safetyFlags ? { safetyFlags } : {}),
    educationalSummary: eduSummaryOf(a),
  }
}

/** Plain-language read on how strong the food-system baseline is. */
function baselineStrength(score: number): "strong" | "developing" | "early" {
  if (score >= 65) return "strong"
  if (score >= 45) return "developing"
  return "early"
}

function buildFoundationInfluence(
  foundation: AssessmentSummaryLike,
  addon: AssessmentSummaryLike | null,
): string {
  const base = foundationLabel(foundation.key as FoundationKey).toLowerCase()
  const area = addon ? addon.label.toLowerCase() : "everything you build next"
  switch (baselineStrength(foundation.score)) {
    case "strong":
      return `Your ${base} food-system baseline is a genuine strength — a steady base like this gives your ${area} focus the best chance to take hold.`
    case "developing":
      return `Your food-system baseline is coming together. Strengthening it alongside your ${area} focus lets the two reinforce each other.`
    default:
      return `Your food-system baseline is still being built. Starting there gives your ${area} efforts firmer ground to stand on.`
  }
}

function buildFirst7Days(
  foundation: AssessmentSummaryLike,
  addon: AssessmentSummaryLike | null,
): string[] {
  const safetyAction =
    addon?.safetyFlags && addon.safetyFlags.length
      ? "Speak with a GP about the symptoms you flagged before changing anything else."
      : null
  const merged = [
    ...(safetyAction ? [safetyAction] : []),
    ...foundation.sevenDay.slice(0, 1),
    ...(addon ? addon.sevenDay : []),
    ...foundation.sevenDay.slice(1),
  ]
  const out = dedupe(merged).slice(0, 5)
  return out.length ? out : [actionOf(foundation)]
}

function buildNext30Days(
  foundation: AssessmentSummaryLike,
  addon: AssessmentSummaryLike | null,
): string[] {
  if (addon?.thirtyDay && addon.thirtyDay.length) return addon.thirtyDay.slice(0, 4)
  const source = addon ?? foundation
  const derived = dedupe(source.priorities.slice(0, 3).map((p) => `Keep building on: ${p}`))
  if (derived.length) return derived
  return dedupe(foundation.priorities.slice(0, 3).map((p) => `Keep building on: ${p}`))
}

function buildCombinedSummary(
  foundation: AssessmentSummaryLike,
  addon: AssessmentSummaryLike | null,
  foundationInfluence: string,
  first7Days: string[],
): string {
  const parts: string[] = []
  if (addon?.safetyFlags && addon.safetyFlags.length) {
    parts.push(
      "Before anything else: some of your answers point to symptoms that deserve medical attention — please speak with a GP.",
    )
  }
  parts.push(
    `Your ${foundationLabel(foundation.key as FoundationKey)} foundation scored ${foundation.score} — ${foundation.bandLabel}. ${eduSummaryOf(foundation)}`,
  )
  if (addon) {
    parts.push(
      `Your ${addon.label} focus scored ${addon.score} — ${addon.bandLabel}. ${eduSummaryOf(addon)}`,
    )
  }
  parts.push(foundationInfluence)
  if (first7Days[0]) parts.push(`Start here: ${first7Days[0]}`)
  return parts.join(" ")
}

function buildReportTitle(
  foundation: AssessmentSummaryLike,
  addon: AssessmentSummaryLike | null,
): string {
  const base = foundationLabel(foundation.key as FoundationKey)
  return addon ? `Your ${base} + ${addon.label} Report` : `Your ${base} Report`
}

export interface BuildCombinedOptions {
  /** Defaults to "Snapshot" — a single sitting with no tracked history yet. */
  confidenceLabel?: ConfidenceLabel
}

/**
 * Merge a foundation summary with an optional add-on summary into a single
 * coherent, non-diagnostic combined report.
 */
export function buildCombinedResult(
  foundation: AssessmentSummaryLike,
  addon: AssessmentSummaryLike | null,
  opts: BuildCombinedOptions = {},
): CombinedResult {
  if (foundation.kind !== "foundation") {
    throw new Error(
      `buildCombinedResult requires a foundation summary; got "${foundation.key}" (${foundation.kind}). Add-ons cannot form a final report on their own.`,
    )
  }

  const foundationInfluence = buildFoundationInfluence(foundation, addon)
  const first7Days = buildFirst7Days(foundation, addon)
  const next30Days = buildNext30Days(foundation, addon)

  return {
    reportTitle: buildReportTitle(foundation, addon),
    foundationResult: toFoundationResult(foundation, opts.confidenceLabel ?? "Snapshot"),
    addonResult: addon ? toAddonResult(addon) : null,
    combinedSummary: buildCombinedSummary(foundation, addon, foundationInfluence, first7Days),
    foundationInfluence,
    first7Days,
    next30Days,
    disclaimer: disclaimerFor(addon ? addon.key : foundation.key),
  }
}
