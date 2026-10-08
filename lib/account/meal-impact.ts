/**
 * EatoBiotics — "What this meal does to your Food System" (pure, deterministic).
 *
 * Maps an analysed meal's OBSERVABLE signals — the analyse-meal `tags` and
 * meal-name keywords — to the impact rows the QuickLog result and the Meal
 * Reveal render: fibre, plant diversity, healthy fats, protein balance,
 * ultra-processed strain. Educational and non-medical; every row carries its
 * own "why this matters".
 *
 * ══ 0R-5 · THE PER-BIOTIC PIPELINE IS GONE ══════════════════════════════════
 *
 * This module was `P0-SCIENCE-05`'s second producer, recorded in
 * `biotic-claims.test.ts`'s ledger for one sentence it shares with `ritual.ts`.
 * The trace found the sentence was the small part. On live `/account`, inside
 * the QuickLog result and the Meal Reveal, it produced:
 *
 *   Probiotic network    [STRONG LIFT]
 *   A fermented food lights up your probiotic network
 *
 *   Postbiotic potential [MODERATE]
 *   Well-fed microbes can give back — postbiotic potential rises
 *
 * Four prohibited forms in one pipeline: a Biotic-named personal ROW, a BAND
 * WORD derived from `input.probiotic_score`, a possessive biological MECHANISM,
 * and — in `probioticBoost` — a fermented food classified as a personal
 * probiotic effect from a tag, which the standing constraints forbid by name.
 *
 * Every number behind it was genuine. That is the point of the tranche:
 * TRUTHFUL INPUTS CAN STILL PRODUCE AN UNTRUTHFUL PRODUCT CLAIM.
 *
 * ── WHAT WAS REMOVED, AND WHAT DELIBERATELY WAS NOT ───────────────────────
 *
 *   gone    the `probiotic` and `postbiotic` rows, whole
 *   gone    the three `*_score` fields, from the INPUT CONTRACT — the
 *           `sequence-email.ts` precedent: a field this still accepted would be
 *           an invitation to derive from it again
 *   gone    `levelFor`, the score→band ladder
 *   gone    the strain row's `prebiotic_score < 40 && probiotic_score < 40`
 *           gate; an ultra-processed meal is observable on its own
 *   gone    "Prebiotic fibre flows down to feed your microbes" (also a
 *           fibre-is-prebiotic category claim) and "the postbiotic
 *           follow-through"
 *   kept    fibre, plants, fats, protein, strain — all read from tags and the
 *           meal name, which is what the product can actually see
 *
 * NO RENAMED PROXY. The removed rows are not reappearing as "microbiome
 * support", "gut network" or any other biological-state label. There is no row
 * standing in for them, because there is nothing measured to put in one.
 */

export type ImpactLevel = "strong" | "moderate" | "low" | "strain"

export interface MealImpactInput {
  meal_name: string
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
// TEAL went with the probiotic row it coloured.
const YELLOW = "#F5C518"
const ORANGE = "#F5A623"

const hasTag = (tags: string[], ...names: string[]) => names.some((n) => tags.includes(n))
const nameHas = (name: string, ...words: string[]) => {
  const n = name.toLowerCase()
  return words.some((w) => n.includes(w))
}

const UPF_WORDS = ["ultra-processed", "processed", "instant noodle", "soda", "candy", "sweets", "crisps", "chips", "fast food", "takeaway pizza", "hot dog", "nugget", "energy drink", "doughnut", "donut"]

export function mealImpact(input: MealImpactInput): MealImpactRow[] {
  const tags = input.tags ?? []
  const rows: MealImpactRow[] = []

  /*
   * Fermented food is OBSERVABLE and stays observable: it is a fact about the
   * plate. What is gone is the row that turned it into a statement about the
   * member — see the header. Nothing replaces it.
   */

  /* Fibre — read from the tags and the meal name, not from a score. */
  const fibreBoost = hasTag(tags, "High Fibre") || nameHas(input.meal_name, "bean", "lentil", "oat", "chickpea", "wholegrain", "barley", "leek", "onion", "garlic", "asparagus")
  rows.push({
    key: "fibre",
    label: "Fibre",
    level: fibreBoost ? "strong" : "low",
    color: LIME,
    effect: fibreBoost ? "Beans, grains or vegetables brought fibre to this plate" : "Not much fibre in this one",
    why: "Fibre is what plants bring to a meal. Beans, lentils, oats, wholegrains and a wide variety of vegetables are the richest everyday sources.",
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
      why: "Olive oil, oily fish, nuts and avocado bring fats associated with a calmer, better-supported system.",
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
  if (strained) {
    rows.push({
      key: "strain",
      label: "Ultra-processed strain",
      level: "strain",
      color: ORANGE,
      effect: "This one may strain the system — a strain pulse, not a glow",
      why: "Heavily processed meals give your microbes little to work with and may strain the system's rhythm. No guilt — the next plant-rich meal starts the recovery.",
    })
  }

  // Strongest signals first; strain always surfaces near the top.
  const order: Record<ImpactLevel, number> = { strain: 0, strong: 1, moderate: 2, low: 3 }
  return rows.sort((a, b) => order[a.level] - order[b.level])
}
