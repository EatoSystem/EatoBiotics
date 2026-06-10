import type {
  StabilityAnswers,
  SafetyFlags,
  StabilityScore,
  StabilityBand,
  StabilityCategoryScores,
} from "./types"
import { SAFETY_QUESTIONS } from "./questions"

const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n))
const round = (n: number) => Math.round(n)

export const STABILITY_BANDS: { band: StabilityBand; min: number; color: string; blurb: string }[] = [
  { band: "High Instability",     min: 0,  color: "var(--icon-orange)", blurb: "Your gut feels unpredictable right now. Small, steady changes — and a chat with your GP if anything is new or worsening — can help you build a more stable base." },
  { band: "Moderate Instability", min: 40, color: "var(--icon-yellow)", blurb: "There's a foundation to build on. A few focused habits around fibre, hydration, and routine could meaningfully steady your days." },
  { band: "Improving Stability",  min: 60, color: "var(--icon-lime)",   blurb: "You're trending in the right direction. Keep reinforcing what's working and tighten one or two patterns." },
  { band: "Strong Stability",     min: 80, color: "var(--icon-green)",   blurb: "Your gut is in a stable, predictable place. Maintain your rhythm and keep tracking to hold the line." },
]

function bandFor(total: number): StabilityBand {
  let band: StabilityBand = "High Instability"
  for (const b of STABILITY_BANDS) if (total >= b.min) band = b.band
  return band
}

export function bandMeta(band: StabilityBand) {
  return STABILITY_BANDS.find((b) => b.band === band) ?? STABILITY_BANDS[0]
}

/* Stool form contribution (0–9), best at Bristol 3–4. */
const STOOL_FORM_POINTS: Record<number, number> = { 1: 3, 2: 6, 3: 9, 4: 9, 5: 6, 6: 3, 7: 1 }

/**
 * Compute the EatoBiotics Stability Score from assessment answers + safety flags.
 * Educational only — not a diagnosis.
 */
export function calculateStabilityScore(a: StabilityAnswers, flags: SafetyFlags): StabilityScore {
  // ── Stool Stability (25) ──
  const freqPts = a.bmFrequency === 1 || a.bmFrequency === 2 ? 8 : a.bmFrequency === 0 ? 3 : 2
  const predPts = (a.predictable / 3) * 8
  const formPts = STOOL_FORM_POINTS[a.usualStool] ?? 5
  const stoolStability = clamp(freqPts + predPts + formPts, 0, 25)

  // ── Urgency & Control (25) ──
  let urgencyControl = 25
  urgencyControl -= a.urgencyFreq * 2          // 0..8
  urgencyControl -= a.accidentFreq * 2.5       // 0..10 (weighted)
  urgencyControl -= a.urgencySeverity * 0.6    // 0..3
  urgencyControl -= (3 - a.canDelay) * 1       // 0..3
  urgencyControl -= a.urgencyAfterMeals * 0.33 // 0..1
  urgencyControl = clamp(urgencyControl, 0, 25)

  // ── Food System (20) ──
  const good = a.vegVariety + a.fruitVariety + a.legumes + a.wholeGrains + a.fermented // 0..15
  const bad = a.ultraProcessed + a.sweeteners + Math.max(0, a.caffeine - 1) + a.alcohol * 0.5
  const foodSystem = clamp((good / 15) * 20 - Math.min(8, bad * 0.9), 0, 20)

  // ── Lifestyle (20) ──
  let lifestyle =
    (a.sleepQuality / 3) * 6 +
    ((4 - a.stress) / 4) * 6 +
    (a.movement / 3) * 4 +
    (a.hydration / 3) * 4
  lifestyle -= a.recentAntibiotics * 1 + a.medicationChanges * 0.5
  lifestyle = clamp(lifestyle, 0, 20)

  // ── Safety / Consistency (10) ──
  const redFlags = SAFETY_QUESTIONS.filter((q) => flags[q.id]).map((q) => q.label)
  let consistency = (a.predictable >= 2 ? 6 : a.predictable === 1 ? 3 : 1) + Math.max(0, 4 - a.accidentFreq)
  if (redFlags.length > 0) consistency = Math.min(consistency, 4)
  consistency = clamp(consistency, 0, 10)

  const categoryScores: StabilityCategoryScores = {
    stoolStability: round(stoolStability),
    urgencyControl: round(urgencyControl),
    foodSystem: round(foodSystem),
    lifestyle: round(lifestyle),
    consistency: round(consistency),
  }

  const totalScore = clamp(
    categoryScores.stoolStability + categoryScores.urgencyControl +
    categoryScores.foodSystem + categoryScores.lifestyle + categoryScores.consistency,
  )

  // ── Factor lists ──
  const risks: { p: number; text: string }[] = []
  if (redFlags.length) risks.push({ p: 100, text: "Red-flag symptoms present — please speak to a GP" })
  if (a.accidentFreq >= 2) risks.push({ p: 90, text: "Accident or leakage episodes" })
  if (a.usualStool <= 2 && a.accidentFreq >= 1) risks.push({ p: 85, text: "Possible constipation with overflow leakage" })
  if (a.urgencyFreq >= 3) risks.push({ p: 80, text: "Frequent bowel urgency" })
  if (a.usualStool >= 6) risks.push({ p: 70, text: "Loose stool pattern" })
  if (a.usualStool <= 2) risks.push({ p: 65, text: "Hard stools / possible constipation" })
  if (a.vegVariety + a.fruitVariety + a.legumes + a.wholeGrains <= 4) risks.push({ p: 55, text: "Low fibre diversity" })
  if (a.hydration <= 1) risks.push({ p: 50, text: "Low hydration" })
  if (a.caffeine >= 2) risks.push({ p: 45, text: "High caffeine intake" })
  if (a.stress >= 3) risks.push({ p: 42, text: "High stress" })
  if (a.sleepQuality <= 1) risks.push({ p: 40, text: "Poor sleep" })
  if (a.ultraProcessed >= 2) risks.push({ p: 35, text: "High ultra-processed food intake" })
  const topRiskFactors = risks.sort((x, y) => y.p - x.p).slice(0, 5).map((r) => r.text)

  const positiveFactors: string[] = []
  if (a.accidentFreq === 0) positiveFactors.push("No leakage episodes")
  if (a.usualStool === 3 || a.usualStool === 4) positiveFactors.push("Healthy stool form")
  if (a.predictable >= 2) positiveFactors.push("Predictable bowel routine")
  if (a.vegVariety + a.fruitVariety + a.legumes + a.wholeGrains >= 8) positiveFactors.push("Good plant diversity")
  if (a.fermented >= 2) positiveFactors.push("Regular fermented foods")
  if (a.hydration >= 2) positiveFactors.push("Good hydration")
  if (a.sleepQuality >= 2) positiveFactors.push("Good sleep")
  if (a.movement >= 2) positiveFactors.push("Regular movement")

  // ── Recommended next steps (gentle, non-prescriptive) ──
  const steps: string[] = []
  if (redFlags.length) steps.push("Speak with your GP about your red-flag symptoms before making big dietary changes.")
  if (a.vegVariety + a.fruitVariety + a.legumes + a.wholeGrains <= 4) steps.push("Add soluble fibre gradually — oats, bananas, cooked carrots — and increase plant variety week by week.")
  if (a.hydration <= 1) steps.push("Hydrate consistently through the day rather than in large bursts.")
  if (a.caffeine >= 2) steps.push("Track caffeine timing against urgency for the next 7 days.")
  if (a.usualStool >= 6) steps.push("Favour soluble fibre and steady meal timing; introduce changes one at a time.")
  if (a.usualStool <= 2) steps.push("Increase fibre and fluids together, and add a daily walk to support regularity.")
  if (a.movement <= 1) steps.push("Try a 10-minute walk after meals.")
  if (a.sleepQuality <= 1 || a.stress >= 3) steps.push("Protect sleep consistency and add a short daily wind-down for stress.")
  steps.push("Change one variable at a time so you can see what actually helps.")
  const recommendedNextSteps = steps.slice(0, 5)

  return {
    totalScore,
    band: bandFor(totalScore),
    categoryScores,
    topRiskFactors,
    positiveFactors,
    recommendedNextSteps,
    redFlags,
    createdAt: new Date().toISOString(),
  }
}
