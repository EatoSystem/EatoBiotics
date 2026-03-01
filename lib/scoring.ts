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

/* ── Per-food base points (diminishing within each biotic type) ──────── */

const BASE_POINTS = [8, 6, 4, 3, 2]

function bioticPoints(count: number): number {
  let total = 0
  for (let i = 0; i < count; i++) {
    total += BASE_POINTS[Math.min(i, BASE_POINTS.length - 1)]
  }
  return total
}

/* ── Balance bonus (covering biotic types — the biggest driver) ──────── */

//                     0 types  1 type  2 types  3 types  4 types
const BALANCE_BONUS = [0, 0, 10, 20, 30]

function balanceBonusForTypes(typesCount: number): number {
  return BALANCE_BONUS[Math.min(typesCount, BALANCE_BONUS.length - 1)]
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
  balanceBonus: number
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

const MAX_CATEGORY_BONUS = 12 // +2 per unique category, max 6 categories counted
const MAX_PLANT_BONUS = 8 // +2 per unique plant food, max 4 plants counted

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

  // Base points per biotic type (diminishing returns within each type)
  const breakdown: BioticBreakdown = {
    prebiotic: bioticPoints(counts.prebiotic),
    probiotic: bioticPoints(counts.probiotic),
    postbiotic: bioticPoints(counts.postbiotic),
    protein: bioticPoints(counts.protein),
  }

  const basePoints =
    breakdown.prebiotic + breakdown.probiotic + breakdown.postbiotic + breakdown.protein

  // Balance bonus: how many of the 4 biotic types are represented
  const typesRepresented = [
    counts.prebiotic,
    counts.probiotic,
    counts.postbiotic,
    counts.protein,
  ].filter((c) => c > 0).length

  const balBonus = balanceBonusForTypes(typesRepresented)

  // Category diversity bonus: +2 per unique food category (max +12)
  const divBonus = Math.min(categories.size * 2, MAX_CATEGORY_BONUS)

  // Plant diversity bonus: +2 per unique plant food (max +8)
  const pBonus = Math.min(plantCount * 2, MAX_PLANT_BONUS)

  const score = Math.min(basePoints + balBonus + divBonus + pBonus, 100)
  const band = getScoreBand(score)
  const suggestions = generateSuggestions(counts, categories, typesRepresented, foods)

  return {
    score,
    band,
    breakdown,
    balanceBonus: balBonus,
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
  typesRepresented: number,
  foods: Food[]
): string[] {
  const tips: string[] = []

  if (foods.length === 0) {
    return ["Add some foods to see your Biotics Score!"]
  }

  // Priority 1: Nudge toward missing biotic types (balance is the biggest driver)
  const missingTypes: string[] = []

  if (counts.prebiotic === 0) {
    missingTypes.push("prebiotic")
    tips.push("Add a prebiotic food like garlic, onions, or oats to feed your good bacteria.")
  }
  if (counts.probiotic === 0) {
    missingTypes.push("probiotic")
    tips.push("Try a fermented food like yoghurt, kimchi, or kombucha for live probiotics.")
  }
  if (counts.postbiotic === 0) {
    missingTypes.push("postbiotic")
    tips.push(
      "Include a postbiotic-rich food like turmeric, dark chocolate, or green tea."
    )
  }
  if (counts.protein === 0) {
    missingTypes.push("protein")
    tips.push("Add a quality protein source like salmon, eggs, or chickpeas.")
  }

  // Balance education — explain WHY balance matters
  if (typesRepresented < 4 && missingTypes.length > 0 && tips.length < 3) {
    const nextBonus =
      balanceBonusForTypes(typesRepresented + 1) - balanceBonusForTypes(typesRepresented)
    if (nextBonus > 0) {
      tips.push(
        `Adding a ${missingTypes[0]} food would unlock +${nextBonus} balance bonus points.`
      )
    }
  }

  // Priority 2: Category diversity
  if (categories.size < 4 && foods.length >= 3 && tips.length < 3) {
    tips.push("Try foods from more categories to boost your diversity bonus.")
  }

  // Priority 3: Imbalanced biotics (heavy on one type, missing others)
  const maxBiotic = Math.max(counts.prebiotic, counts.probiotic, counts.postbiotic)
  const minBiotic = Math.min(counts.prebiotic, counts.probiotic, counts.postbiotic)
  if (maxBiotic >= 3 && minBiotic === 0 && tips.length < 3) {
    tips.push(
      "Your gut benefits most when all three biotic types work together — try adding variety."
    )
  }

  return tips.slice(0, 3)
}
