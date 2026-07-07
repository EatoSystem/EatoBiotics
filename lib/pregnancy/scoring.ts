import type {
  PregnancyAnswers,
  PregnancySafetyFlags,
  PregnancyScore,
  PregnancyBand,
  PregnancyCategoryScores,
} from "./types"
import { PREGNANCY_SAFETY_QUESTIONS } from "./questions"

const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n))
const round = (n: number) => Math.round(n)

export const PREGNANCY_BANDS: { band: PregnancyBand; min: number; color: string; blurb: string }[] = [
  { band: "Building Foundations", min: 0,  color: "var(--icon-orange)", blurb: "There's plenty to build on. A few small, steady food habits — and your usual pregnancy care with your midwife or GP — can help you feel more nourished day to day." },
  { band: "Finding Rhythm",       min: 40, color: "var(--icon-yellow)", blurb: "A foundation is taking shape. Gently reinforcing meal rhythm, hydration, and variety could help your food patterns feel steadier." },
  { band: "Well Nourished",       min: 60, color: "var(--icon-lime)",   blurb: "Your food patterns broadly support general wellbeing. Keep doing what's working and tidy up one or two areas." },
  { band: "Strong & Steady",      min: 80, color: "var(--icon-green)",  blurb: "Your everyday food patterns are varied and steady. Keep your rhythm going and stay in touch with your usual pregnancy care." },
]

function bandFor(total: number): PregnancyBand {
  let band: PregnancyBand = "Building Foundations"
  for (const b of PREGNANCY_BANDS) if (total >= b.min) band = b.band
  return band
}

export function pregnancyBandMeta(band: PregnancyBand) {
  return PREGNANCY_BANDS.find((b) => b.band === band) ?? PREGNANCY_BANDS[0]
}

/**
 * Compute the food-first Pregnancy Food System support score. Educational and
 * NON-diagnostic — it reflects general-wellbeing food *patterns* only, never a
 * medical assessment of the pregnancy.
 */
export function calculatePregnancyScore(a: PregnancyAnswers, flags: PregnancySafetyFlags): PregnancyScore {
  // ── Plant diversity (25) ──
  const plantsRaw = a.vegVariety + a.fruitVariety + a.legumes + a.wholeGrains + a.fermented // 0..15
  const plantDiversity = clamp((plantsRaw / 15) * 25, 0, 25)

  // ── Meal rhythm (20) ──
  const rhythmRaw = a.regularMeals + a.breakfast + a.comfortEating // 0..9
  const mealRhythm = clamp((rhythmRaw / 9) * 20, 0, 20)

  // ── Hydration (15) ──
  const hydration = clamp((a.hydration / 3) * 15, 0, 15)

  // ── Nourishing variety (20) ──
  const nourishRaw = a.proteinFoods + a.calciumFoods + a.varietyGroups // 0..9
  const nourishingVariety = clamp((nourishRaw / 9) * 20, 0, 20)

  // ── Gentle moderation (20) ── start full, subtract for higher intakes
  let gentleModeration = 20
  gentleModeration -= a.ultraProcessed * 2.5      // 0..7.5
  gentleModeration -= a.sweetDrinks * 2           // 0..6
  gentleModeration -= Math.max(0, a.caffeine - 1) * 2.5 // 0..5 (1–2/day is neutral)
  gentleModeration = clamp(gentleModeration, 0, 20)

  const categoryScores: PregnancyCategoryScores = {
    plantDiversity: round(plantDiversity),
    mealRhythm: round(mealRhythm),
    hydration: round(hydration),
    nourishingVariety: round(nourishingVariety),
    gentleModeration: round(gentleModeration),
  }

  const totalScore = clamp(
    categoryScores.plantDiversity + categoryScores.mealRhythm + categoryScores.hydration +
    categoryScores.nourishingVariety + categoryScores.gentleModeration,
  )

  // ── Red-flag safety screen (signposting only — never scored) ──
  const redFlags = PREGNANCY_SAFETY_QUESTIONS.filter((q) => flags[q.id]).map((q) => q.label)

  // ── Priority areas (gentle, non-prescriptive) ──
  const risks: { p: number; text: string }[] = []
  if (plantsRaw <= 4) risks.push({ p: 90, text: "Low plant variety" })
  if (a.hydration <= 1) risks.push({ p: 80, text: "Low hydration" })
  if (a.regularMeals <= 1) risks.push({ p: 75, text: "Irregular meals" })
  if (a.proteinFoods <= 1) risks.push({ p: 70, text: "Few protein-containing foods" })
  if (a.breakfast <= 1) risks.push({ p: 60, text: "Often skipping the morning meal" })
  if (a.ultraProcessed >= 2) risks.push({ p: 55, text: "Higher ultra-processed foods" })
  if (a.sweetDrinks >= 2) risks.push({ p: 50, text: "Frequent sweetened drinks" })
  if (a.caffeine >= 2) risks.push({ p: 48, text: "Higher caffeine intake" })
  if (a.calciumFoods <= 1) risks.push({ p: 42, text: "Few dairy or fortified alternatives" })
  const priorityFactors = risks.sort((x, y) => y.p - x.p).slice(0, 5).map((r) => r.text)

  // ── Positives ──
  const positiveFactors: string[] = []
  if (plantsRaw >= 9) positiveFactors.push("Good plant variety")
  if (a.regularMeals >= 2) positiveFactors.push("Steady meal rhythm")
  if (a.hydration >= 2) positiveFactors.push("Well hydrated")
  if (a.proteinFoods >= 2) positiveFactors.push("Regular protein-containing foods")
  if (a.varietyGroups >= 2) positiveFactors.push("Varied plates")
  if (a.fermented >= 2) positiveFactors.push("Regular fermented foods")
  if (a.caffeine <= 1 && a.sweetDrinks <= 1) positiveFactors.push("Gentle with caffeine & sweet drinks")

  // ── Next steps (food-first, general wellbeing) ──
  const steps: string[] = []
  if (redFlags.length) steps.push("Contact your midwife, GP, or maternity unit about the symptoms you flagged before changing anything else.")
  if (plantsRaw <= 4) steps.push("Add one extra colour of veg or fruit to a meal each week to widen your plant variety.")
  if (a.hydration <= 1) steps.push("Keep a water bottle nearby and sip steadily through the day rather than in big bursts.")
  if (a.regularMeals <= 1 || a.breakfast <= 1) steps.push("Anchor a gentle, regular breakfast — even something small on tougher mornings.")
  if (a.proteinFoods <= 1) steps.push("Aim to include a protein-containing food (eggs, beans, fish, tofu, dairy) at most meals.")
  if (a.ultraProcessed >= 2 || a.sweetDrinks >= 2) steps.push("Swap one ultra-processed snack or sweet drink for a whole-food option a few times a week.")
  steps.push("Change one thing at a time, and bring any food questions to your midwife or GP.")
  const recommendedNextSteps = steps.slice(0, 5)

  return {
    totalScore,
    band: bandFor(totalScore),
    categoryScores,
    priorityFactors,
    positiveFactors,
    recommendedNextSteps,
    redFlags,
    createdAt: new Date().toISOString(),
  }
}
