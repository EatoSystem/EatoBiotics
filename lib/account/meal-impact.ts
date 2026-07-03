/**
 * EatoBiotics — "What this meal does to your Food System" (pure, deterministic).
 *
 * Maps an analysed meal (the three biotic scores + the analyse-meal `tags` +
 * meal-name keywords) to visual impact rows the model can respond with:
 * probiotic network, fibre pathways, plant diversity, healthy fats, protein
 * balance, ultra-processed strain. Educational + non-medical ("supports",
 * "may strain") — every row carries its own "why this matters".
 */

export type ImpactLevel = "strong" | "moderate" | "low" | "strain"

export interface MealImpactInput {
  meal_name: string
  prebiotic_score: number
  probiotic_score: number
  postbiotic_score: number
  tags?: string[]
}

export interface MealImpactRow {
  key: string
  label: string
  level: ImpactLevel
  color: string
  /** One-line effect, e.g. "Probiotic network lights up". */
  effect: string
  /** The expandable "why this matters" micro-lesson. */
  why: string
}

const LIME = "#A8E063"
const GREEN = "#4CB648"
const TEAL = "#2DAA6E"
const YELLOW = "#F5C518"
const ORANGE = "#F5A623"

const levelFor = (score: number): ImpactLevel => (score >= 65 ? "strong" : score >= 40 ? "moderate" : "low")

const hasTag = (tags: string[], ...names: string[]) => names.some((n) => tags.includes(n))
const nameHas = (name: string, ...words: string[]) => {
  const n = name.toLowerCase()
  return words.some((w) => n.includes(w))
}

const UPF_WORDS = ["ultra-processed", "processed", "instant noodle", "soda", "candy", "sweets", "crisps", "chips", "fast food", "takeaway pizza", "hot dog", "nugget", "energy drink", "doughnut", "donut"]

export function mealImpact(input: MealImpactInput): MealImpactRow[] {
  const tags = input.tags ?? []
  const rows: MealImpactRow[] = []

  /* Probiotic network */
  const probioticBoost = hasTag(tags, "Probiotics", "Fermented Foods") || nameHas(input.meal_name, "kefir", "kimchi", "yoghurt", "yogurt", "kombucha", "sauerkraut", "miso", "tempeh")
  rows.push({
    key: "probiotic",
    label: "Probiotic network",
    level: probioticBoost ? "strong" : levelFor(input.probiotic_score),
    color: TEAL,
    effect: probioticBoost || input.probiotic_score >= 40 ? "Live cultures light up your probiotic network" : "Quiet on the probiotic side this time",
    why: "Fermented foods carry living microbes that join and diversify your inner community — one serving a day is one of the fastest levers your Food System has.",
  })

  /* Fibre / prebiotic pathways */
  const fibreBoost = hasTag(tags, "Prebiotics", "High Fibre") || nameHas(input.meal_name, "bean", "lentil", "oat", "chickpea", "wholegrain", "barley", "leek", "onion", "garlic", "asparagus")
  rows.push({
    key: "fibre",
    label: "Fibre pathways",
    level: fibreBoost ? "strong" : levelFor(input.prebiotic_score),
    color: LIME,
    effect: fibreBoost || input.prebiotic_score >= 40 ? "Prebiotic fibre flows down to feed your microbes" : "Not much fibre reached your microbes here",
    why: "Prebiotic fibre is the food your resident microbes actually eat. Beans, lentils, oats and a variety of plants keep those pathways glowing.",
  })

  /* Plant diversity / polyphenols */
  const plantBoost = hasTag(tags, "Plant Diversity", "Polyphenols", "Anti-inflammatory") || nameHas(input.meal_name, "berry", "berries", "greens", "salad", "veg", "spinach", "broccoli", "herbs")
  if (plantBoost) {
    rows.push({
      key: "plants",
      label: "Plant diversity",
      level: "strong",
      color: GREEN,
      effect: "Plant variety and polyphenols brighten the whole system",
      why: "Every different plant feeds a slightly different microbe. Variety — colours, herbs, berries — is the single strongest food signal for a thriving Food System.",
    })
  }

  /* Healthy fats */
  const fatsBoost = hasTag(tags, "Omega-3s") || nameHas(input.meal_name, "olive oil", "salmon", "mackerel", "sardine", "avocado", "walnut", "nuts", "seeds")
  if (fatsBoost) {
    rows.push({
      key: "fats",
      label: "Healthy fats",
      level: "strong",
      color: YELLOW,
      effect: "Omega-rich fats support the calm, steady side of the system",
      why: "Olive oil, oily fish, nuts and avocado bring fats associated with a calmer, better-supported system — they help the postbiotic follow-through land.",
    })
  }

  /* Protein balance */
  if (hasTag(tags, "Protein Rich") || nameHas(input.meal_name, "chicken", "fish", "salmon", "egg", "tofu", "beef", "protein")) {
    rows.push({
      key: "protein",
      label: "Protein balance",
      level: "moderate",
      color: ORANGE,
      effect: "Protein supports structure and steady fuel",
      why: "Protein steadies energy and supports repair — balance it with plants and fibre so your microbes eat as well as you do.",
    })
  }

  /* Ultra-processed strain */
  const strained = hasTag(tags, "Needs Work", "Low Biotics") || nameHas(input.meal_name, ...UPF_WORDS)
  if (strained && input.prebiotic_score < 40 && input.probiotic_score < 40) {
    rows.push({
      key: "strain",
      label: "Ultra-processed strain",
      level: "strain",
      color: ORANGE,
      effect: "This one may strain the system — a strain pulse, not a glow",
      why: "Heavily processed meals give your microbes little to work with and may strain the system's rhythm. No guilt — the next plant-rich meal starts the recovery.",
    })
  }

  /* Postbiotic potential — the follow-through */
  rows.push({
    key: "postbiotic",
    label: "Postbiotic potential",
    level: levelFor(input.postbiotic_score),
    color: YELLOW,
    effect:
      input.postbiotic_score >= 40
        ? "Well-fed microbes can give back — postbiotic potential rises"
        : "Low follow-through — feed the first two and this rises",
    why: "When fibre and live cultures are fed well, your microbes typically produce postbiotic compounds associated with comfort and steady energy — the system giving back.",
  })

  // Strongest signals first; strain always surfaces near the top.
  const order: Record<ImpactLevel, number> = { strain: 0, strong: 1, moderate: 2, low: 3 }
  return rows.sort((a, b) => order[a.level] - order[b.level])
}
