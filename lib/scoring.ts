import type { BioticType, Food } from "./foods"

/* ── Score bands ──────────────────────────────────────────────────────── */

export interface ScoreBand {
  label: string
  color: string
  min: number
}

export const SCORE_BANDS: ScoreBand[] = [
  { label: "Exceptional", color: "var(--icon-green)", min: 80 },
  { label: "Excellent", color: "var(--icon-teal)", min: 60 },
  { label: "Good", color: "var(--icon-yellow)", min: 40 },
  { label: "Fair", color: "var(--icon-orange)", min: 20 },
  { label: "Getting Started", color: "var(--muted-foreground)", min: 0 },
]

export function getScoreBand(score: number): ScoreBand {
  return SCORE_BANDS.find((b) => score >= b.min) ?? SCORE_BANDS[SCORE_BANDS.length - 1]
}

/* ── Diminishing-return point tables ──────────────────────────────────── */

const POINTS: Record<BioticType, number[]> = {
  prebiotic: [5, 4, 4, 3, 2, 2, 2, 2, 2, 2],
  probiotic: [6, 5, 4, 3, 2, 2, 2, 2, 2, 2],
  postbiotic: [4, 3, 3, 2, 2, 2, 2, 2, 2, 2],
  protein: [3, 3, 2, 2, 1, 1, 1, 1, 1, 1],
  all: [3, 2, 2, 1, 1, 1, 1, 1, 1, 1],
}

function bioticPoints(type: BioticType, count: number): number {
  const table = POINTS[type] ?? POINTS.all
  let total = 0
  for (let i = 0; i < count; i++) {
    total += table[Math.min(i, table.length - 1)]
  }
  return total
}

/* ── Plant bonus (scaled to max +20) ──────────────────────────────────── */

const PLANT_THRESHOLDS = [
  { count: 25, bonus: 4 },
  { count: 20, bonus: 4 },
  { count: 15, bonus: 3 },
  { count: 10, bonus: 3 },
  { count: 5, bonus: 2 },
]

function plantBonus(plantCount: number): number {
  let total = 0
  for (const { count, bonus } of PLANT_THRESHOLDS) {
    if (plantCount >= count) total += bonus
  }
  return total
}

/* ── Biotic breakdown ─────────────────────────────────────────────────── */

export interface BioticBreakdown {
  prebiotic: number
  probiotic: number
  postbiotic: number
  protein: number
}

/* ── Main scoring function ────────────────────────────────────────────── */

export interface ScoreResult {
  score: number
  band: ScoreBand
  breakdown: BioticBreakdown
  diversityBonus: number
  plantBonus: number
  basePoints: number
  suggestions: string[]
}

const PLANT_CATEGORIES = new Set([
  "Vegetables",
  "Fruit",
  "Grains & Legumes",
  "Nuts & Seeds",
  "Herbs & Spices",
  "Sea Vegetables",
])

export function calculateBioticsScore(foods: Food[]): ScoreResult {
  // Count foods per biotic type
  const counts: Record<string, number> = {
    prebiotic: 0,
    probiotic: 0,
    postbiotic: 0,
    protein: 0,
  }

  const categories = new Set<string>()
  let plantCount = 0

  for (const food of foods) {
    const type = food.biotic === "all" ? "protein" : food.biotic
    counts[type] = (counts[type] || 0) + 1
    categories.add(food.category)
    if (PLANT_CATEGORIES.has(food.category)) plantCount++
  }

  // Base points per biotic type
  const breakdown: BioticBreakdown = {
    prebiotic: bioticPoints("prebiotic", counts.prebiotic),
    probiotic: bioticPoints("probiotic", counts.probiotic),
    postbiotic: bioticPoints("postbiotic", counts.postbiotic),
    protein: bioticPoints("protein", counts.protein),
  }

  const basePoints =
    breakdown.prebiotic + breakdown.probiotic + breakdown.postbiotic + breakdown.protein

  // Diversity bonus: +2 per unique food category (max +16)
  const divBonus = Math.min(categories.size * 2, 16)

  // Plant bonus: scaled up to +20
  const pBonus = plantBonus(plantCount)

  const score = Math.min(basePoints + divBonus + pBonus, 100)
  const band = getScoreBand(score)
  const suggestions = generateSuggestions(counts, categories, plantCount, foods)

  return {
    score,
    band,
    breakdown,
    diversityBonus: divBonus,
    plantBonus: pBonus,
    basePoints,
    suggestions,
  }
}

/* ── Suggestion engine ────────────────────────────────────────────────── */

function generateSuggestions(
  counts: Record<string, number>,
  categories: Set<string>,
  plantCount: number,
  foods: Food[]
): string[] {
  const tips: string[] = []

  if (foods.length === 0) {
    return ["Add some foods to see your Biotics Score!"]
  }

  // Missing biotic types
  if (counts.prebiotic === 0) {
    tips.push("Add a prebiotic food like garlic, onions, or oats to feed your good bacteria.")
  }
  if (counts.probiotic === 0) {
    tips.push("Try a fermented food like yoghurt, kimchi, or kombucha for live probiotics.")
  }
  if (counts.postbiotic === 0) {
    tips.push(
      "Include a postbiotic-rich food like extra virgin olive oil, turmeric, or dark chocolate."
    )
  }
  if (counts.protein === 0) {
    tips.push("Add a quality protein source like salmon, eggs, or chickpeas.")
  }

  // Low diversity
  if (categories.size < 4 && foods.length >= 3) {
    tips.push("Try foods from more categories to boost your diversity bonus.")
  }

  // Plant count nudges
  if (plantCount < 5 && foods.length >= 3) {
    tips.push("Aim for at least 5 different plants to start earning your plant bonus.")
  } else if (plantCount >= 5 && plantCount < 15) {
    tips.push(`You have ${plantCount} plants — aim for 30 different plants each week!`)
  } else if (plantCount >= 15 && plantCount < 30) {
    tips.push(
      `Great progress with ${plantCount} plants! Keep going toward the 30-plant goal.`
    )
  }

  // Imbalanced biotics
  const maxBiotic = Math.max(counts.prebiotic, counts.probiotic, counts.postbiotic)
  const minBiotic = Math.min(counts.prebiotic, counts.probiotic, counts.postbiotic)
  if (maxBiotic > 0 && minBiotic === 0 && tips.length < 3) {
    tips.push("Balance all three biotic types for optimal gut support.")
  }

  return tips.slice(0, 3)
}
