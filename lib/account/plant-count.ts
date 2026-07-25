/* ── 30 Plants a Week — plant detection (pure, unit-tested) ────────────────
   Counts distinct plant foods a member has eaten this week by matching their
   logged meal names against a plant vocabulary. No new data is collected and
   no AI call is made — it reads what's already logged. Precision over recall:
   we match meal NAMES only (not AI insight prose, which may suggest foods they
   didn't eat), so the count never overstates. The famous target is 30 distinct
   plants per week (Spector/ZOE); herbs, spices, nuts, seeds, wholegrains and
   sea vegetables all count.

   Vocabulary = the app's own food dictionary (lib/foods.ts, the gut-health
   hero foods) PLUS a broad list of everyday plants below, because the
   dictionary is curated (no spinach, broccoli, carrot…) and on its own would
   silently undercount common vegetables.
──────────────────────────────────────────────────────────────────────── */

import { foods, type FoodCategory } from "@/lib/foods"

/** Categories that count as a "plant" for the 30-plants target. */
const PLANT_CATEGORIES: ReadonlySet<FoodCategory> = new Set<FoodCategory>([
  "Vegetables",
  "Fruit",
  "Grains & Legumes",
  "Herbs & Spices",
  "Sea Vegetables",
  "Nuts & Seeds",
])

export const PLANT_TARGET = 30

/** Everyday plants the curated dictionary doesn't cover. Canonical display names. */
const EXTRA_PLANTS: string[] = [
  // Vegetables
  "Spinach", "Kale", "Broccoli", "Cauliflower", "Carrot", "Tomato", "Cucumber",
  "Pepper", "Onion", "Courgette", "Zucchini", "Aubergine", "Eggplant", "Cabbage",
  "Lettuce", "Rocket", "Arugula", "Celery", "Beetroot", "Beet", "Radish", "Leek",
  "Pea", "Green bean", "Sweet potato", "Potato", "Squash", "Pumpkin", "Sweetcorn",
  "Corn", "Mushroom", "Asparagus", "Brussels sprout", "Spring onion", "Watercress",
  "Chard", "Pak choi", "Turnip", "Parsnip", "Shallot", "Okra", "Artichoke",
  // Fruit
  "Apple", "Banana", "Orange", "Strawberry", "Raspberry", "Blackberry", "Grape",
  "Pear", "Peach", "Plum", "Mango", "Pineapple", "Kiwi", "Melon", "Watermelon",
  "Avocado", "Lemon", "Lime", "Cherry", "Apricot", "Fig", "Date", "Pomegranate",
  "Grapefruit", "Nectarine", "Cranberry", "Blackcurrant", "Passionfruit", "Lychee",
  // Grains & legumes
  "Rice", "Oats", "Quinoa", "Barley", "Buckwheat", "Rye", "Wheat", "Bulgur",
  "Couscous", "Millet", "Freekeh", "Spelt", "Black bean", "Kidney bean",
  "Cannellini bean", "Butter bean", "Pinto bean", "Black-eyed pea", "Edamame",
  "Soybean", "Mung bean", "Fava bean", "Broad bean",
  // Nuts & seeds
  "Walnut", "Cashew", "Pistachio", "Hazelnut", "Pecan", "Peanut", "Macadamia",
  "Brazil nut", "Pumpkin seed", "Sunflower seed", "Chia", "Flaxseed", "Linseed",
  "Sesame", "Pine nut", "Hemp seed",
  // Herbs & spices
  "Basil", "Coriander", "Cilantro", "Parsley", "Mint", "Thyme", "Rosemary",
  "Oregano", "Sage", "Dill", "Chive", "Turmeric", "Cumin", "Cinnamon", "Paprika",
  "Chilli", "Cardamom", "Clove", "Nutmeg", "Fennel", "Tarragon", "Bay leaf",
  "Nigella", "Sumac", "Saffron",
]

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")

/** Singular stem of a word/phrase, for de-duping plural vs singular forms. */
function stemKey(w: string): string {
  w = w.toLowerCase().trim()
  if (w.endsWith("ies") && w.length > 4) return w.slice(0, -3) + "y"
  if (w.endsWith("es") && w.length > 4) return w.slice(0, -2)
  if (w.endsWith("s") && w.length > 3) return w.slice(0, -1)
  return w
}

/** Surface forms (singular + plural variants) to match in text. */
function wordForms(name: string): string[] {
  const base = name.toLowerCase().trim()
  const forms = new Set<string>([base, stemKey(base)])
  for (const f of [...forms]) {
    if (f.endsWith("y")) forms.add(f.slice(0, -1) + "ies")
    else if (/(o|s|x|ch|sh)$/.test(f)) forms.add(f + "es")
    else forms.add(f + "s")
  }
  return [...forms]
}

interface Term {
  form: string
  canonical: string
  key: string
  re: RegExp
}

/** Build the search vocabulary once: hero foods first (they win the canonical). */
const PLANT_TERMS: Term[] = (() => {
  const byKey = new Map<string, string>() // stemKey → canonical (first wins)
  const ordered: { canonical: string; key: string }[] = []

  const add = (name: string) => {
    const key = stemKey(name)
    if (byKey.has(key)) return
    byKey.set(key, name)
    ordered.push({ canonical: name, key })
  }

  for (const f of foods) if (PLANT_CATEGORIES.has(f.category)) add(f.name)
  for (const name of EXTRA_PLANTS) add(name)

  const terms: Term[] = []
  for (const { canonical, key } of ordered) {
    for (const form of wordForms(canonical)) {
      terms.push({ form, canonical, key, re: new RegExp(`\\b${escapeRegExp(form)}\\b`, "i") })
    }
  }
  // Longest form first so "sweet potato" beats "potato" on the same text.
  return terms.sort((a, b) => b.form.length - a.form.length)
})()

/**
 * Returns the distinct plant foods detected across the given meal names, in
 * first-seen order, plus the count. Singular/plural forms collapse to one.
 */
export function countUniquePlants(mealNames: (string | null | undefined)[]): {
  plants: string[]
  count: number
} {
  const found = new Map<string, string>() // stemKey → canonical
  for (const raw of mealNames) {
    if (!raw) continue
    const text = ` ${raw.toLowerCase()} `
    for (const t of PLANT_TERMS) {
      if (found.has(t.key)) continue
      if (t.re.test(text)) found.set(t.key, t.canonical)
    }
  }
  const plants = [...found.values()]
  return { plants, count: plants.length }
}
