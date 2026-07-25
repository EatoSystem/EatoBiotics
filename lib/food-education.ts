import { foods, type BioticType, type Food } from "@/lib/foods"

/**
 * Page-level educational content for the food library.
 *
 * Deliberately *not* per-food: nothing here requires authoring new fields across all
 * 48 foods. Pairings are derived from data that already exists (`Food.pairsWith`);
 * myths and quiz copy are written once and apply library-wide.
 *
 * Tone follows the Stability guardrails — educational and non-diagnostic. Nothing
 * here diagnoses, treats, or promises a clinical outcome.
 */

// ─── Myths ──────────────────────────────────────────────────────────────────

export interface FoodMyth {
  myth: string
  truth: string
}

export const FOOD_MYTHS: FoodMyth[] = [
  {
    myth: "All fibre is prebiotic fibre.",
    truth:
      "Only fermentable fibres — inulin, FOS, beta-glucan, resistant starch — reliably feed beneficial bacteria. Much cereal fibre mostly adds bulk, which is useful, but it isn't the same job.",
  },
  {
    myth: "Supplements beat fermented food.",
    truth:
      "A capsule delivers strains alone. Fermented food delivers them inside the fibre, polyphenols and food matrix they evolved alongside — usually at a fraction of the cost.",
  },
  {
    myth: "Miss a day and it all washes out.",
    truth:
      "Most fermented strains are transient by design; they do their work in transit rather than colonising permanently. Consistency over weeks matters far more than an unbroken daily streak.",
  },
  {
    myth: "The goal is killing bad bacteria.",
    truth:
      "The goal is diversity, not sterility. The number of different species in your gut is a more useful marker than the absence of any one of them — which is why widening the range of plants you eat tends to beat eliminating things.",
  },
  {
    myth: "Raw is always better.",
    truth:
      "Sometimes cooking creates the benefit. Cook a potato and cool it and you form resistant starch the raw version never had. Crushing garlic and waiting ten minutes before heat does something similar for allicin.",
  },
  {
    myth: "Gluten-free is automatically gut-friendly.",
    truth:
      "Unless you need to avoid gluten, swapping in refined gluten-free products often strips out exactly the fermentable fibre your bacteria were living on.",
  },
  {
    myth: "Postbiotics are a marketing word.",
    truth:
      "They're the actual output — short-chain fatty acids like butyrate, produced when bacteria ferment fibre. Prebiotics and probiotics are the inputs; postbiotics are the reason you bothered.",
  },
  {
    myth: "More protein always means better repair.",
    truth:
      "The gut lining does need amino acids. But protein without fermentable fibre leaves the bacteria that maintain that lining unfed — you supply the materials with no workforce.",
  },
]

// ─── Pairings ───────────────────────────────────────────────────────────────

export interface FoodPairing {
  a: Food
  b: Food
  reason: string
}

/** Why a given combination of biotic stages is worth eating together. */
const PAIRING_REASON: Record<string, string> = {
  "prebiotic|probiotic":
    "Fibre arrives with the very cultures that ferment it — the one-two punch the whole framework is built on.",
  "prebiotic|prebiotic":
    "Two different fibres feed two different bacterial families. Diversity in, diversity out.",
  "postbiotic|prebiotic":
    "Fermentable fibre and polyphenols reaching the colon together — fuel and raw material in one meal.",
  "prebiotic|protein":
    "Fibre for the microbes, amino acids for the lining they help maintain.",
  "postbiotic|probiotic":
    "Live cultures alongside the compounds their work produces.",
  "probiotic|protein":
    "Cultures to populate, protein to rebuild the wall they sit on.",
  "postbiotic|protein":
    "Anti-inflammatory compounds and repair material, working the same shift.",
  "postbiotic|postbiotic":
    "Two polyphenol sources compounding the same anti-inflammatory effect.",
  "probiotic|probiotic":
    "Different ferments carry different strains — variety is the entire point.",
  "protein|protein":
    "Two complete proteins covering the full amino-acid range.",
}

/**
 * Build pairings from the `pairsWith` data already in the library.
 *
 * De-duplicated by biotic *combination* — taking each food's first pairing yields
 * mostly prebiotic+probiotic, which makes every card repeat the same explanation.
 */
export function getFoodPairings(limit = 6): FoodPairing[] {
  const byName = new Map(foods.map((food) => [food.name.toLowerCase(), food]))
  const usedCombos = new Set<string>()
  const usedFoods = new Set<string>()
  const pairings: FoodPairing[] = []

  for (const food of foods) {
    if (pairings.length >= limit) break
    if (usedFoods.has(food.slug)) continue

    for (const partnerName of food.pairsWith) {
      const partner = byName.get(partnerName.toLowerCase())
      if (!partner || partner.slug === food.slug || usedFoods.has(partner.slug)) continue

      const combo = [food.biotic, partner.biotic].sort().join("|")
      if (usedCombos.has(combo)) continue

      usedCombos.add(combo)
      usedFoods.add(food.slug)
      usedFoods.add(partner.slug)
      pairings.push({
        a: food,
        b: partner,
        reason:
          PAIRING_REASON[combo] ??
          "Two foods that complement each other across the biotic stages.",
      })
      break
    }
  }

  return pairings
}

// ─── Quiz ───────────────────────────────────────────────────────────────────

export type QuizBiotic = Extract<BioticType, "prebiotic" | "probiotic" | "postbiotic">

export interface QuizOption {
  label: string
  /** 0 = well covered, 4 = biggest gap. */
  score: number
}

export interface QuizQuestion {
  biotic: QuizBiotic
  question: string
  options: QuizOption[]
}

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    biotic: "probiotic",
    question: "How often do you eat fermented food — kefir, kimchi, sauerkraut, live yogurt?",
    options: [
      { label: "Most days", score: 0 },
      { label: "A couple of times a week", score: 1 },
      { label: "Rarely", score: 3 },
      { label: "Never", score: 4 },
    ],
  },
  {
    biotic: "prebiotic",
    question: "How many different plants do you eat in a typical week?",
    options: [
      { label: "Thirty or more", score: 0 },
      { label: "Fifteen to thirty", score: 1 },
      { label: "Under fifteen", score: 3 },
      { label: "I couldn't guess", score: 4 },
    ],
  },
  {
    biotic: "postbiotic",
    question: "How often do you eat oily fish, olive oil, berries or dark chocolate?",
    options: [
      { label: "Daily", score: 0 },
      { label: "Several times a week", score: 1 },
      { label: "Occasionally", score: 3 },
      { label: "Almost never", score: 4 },
    ],
  },
]

export interface QuizResult {
  /** Coverage of the weakest stage, 0–100. High is good. */
  coverage: number
  biotic: QuizBiotic
  title: string
  body: string
  /** True when no stage shows a meaningful gap. */
  balanced: boolean
}

const GAP_COPY: Record<QuizBiotic, string> = {
  prebiotic:
    "Your bacteria are under-fed. Fermentable fibre is the input everything else depends on — the prebiotic foods in the library are the place to start.",
  probiotic:
    "You're feeding well but seeding rarely. One fermented food a day is the single highest-leverage change available to you.",
  postbiotic:
    "You're light on the polyphenols and omega-3s linked to butyrate production. The postbiotic foods in the library are where to look.",
}

/**
 * Score the quiz.
 *
 * Reported as **coverage, not deficit** — answering well must produce a high number.
 * (An earlier build showed a perfect set of answers as "0%", which reads backwards.)
 */
export function scoreQuiz(answers: { biotic: QuizBiotic; score: number }[]): QuizResult {
  const totals = new Map<QuizBiotic, number>()
  for (const answer of answers) {
    totals.set(answer.biotic, (totals.get(answer.biotic) ?? 0) + answer.score)
  }

  const [biotic, worstScore] = [...totals.entries()].sort((a, b) => b[1] - a[1])[0]
  const maxScore = 4
  const coverage = Math.round((1 - worstScore / maxScore) * 100)
  const balanced = coverage >= 75

  return {
    coverage,
    biotic,
    balanced,
    title: balanced ? "Well covered" : `${capitalise(biotic)} gap`,
    body: balanced
      ? "No obvious gap across the three stages. Keep the range wide — variety is what the library is built for."
      : GAP_COPY[biotic],
  }
}

function capitalise(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}
