/* ── Full Report Generation ──────────────────────────────────────────── */

import type { AssessmentResult, PillarInsight } from "./assessment-scoring"
import type { PillarKey } from "./assessment-data"

/* ── Types ──────────────────────────────────────────────────────────── */

export interface FoodRecommendation {
  food: string
  emoji: string
  why: string
  howToUse: string
}

export interface PillarDeepDive {
  pillar: PillarKey
  label: string
  score: number
  color: string
  gradient: string
  icon: string
  summary: string
  foods: FoodRecommendation[]
  reduce: { food: string; reason: string }[]
}

export interface PersonalisedFood {
  food: string
  emoji: string
  pillars: PillarKey[]
  impact: string
  priority: "high" | "medium"
}

export interface WeekPlan {
  week: number
  title: string
  focus: string
  habits: { habit: string; detail: string }[]
}

export interface FullReport {
  deepDives: PillarDeepDive[]
  top12Foods: PersonalisedFood[]
  thirtyDayPlan: WeekPlan[]
}

/* ── Per-pillar food data ───────────────────────────────────────────── */

const PILLAR_DEEP_DIVES: Record<
  PillarKey,
  Omit<PillarDeepDive, "score" | "pillar" | "summary">
> = {
  diversity: {
    label: "Diversity",
    color: "var(--icon-lime)",
    gradient: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))",
    icon: "Leaf",
    foods: [
      {
        food: "Leeks",
        emoji: "🌿",
        why: "Rich in inulin-type fructans that selectively feed Bifidobacterium — one of the most researched beneficial gut bacteria.",
        howToUse: "Add to soups, stir-fries, or roast alongside other vegetables.",
      },
      {
        food: "Purple cabbage",
        emoji: "🫐",
        why: "Anthocyanins give it deep colour and act as prebiotic compounds that support microbial diversity while reducing gut inflammation.",
        howToUse: "Shred raw into salads, lightly pickle, or ferment as kraut.",
      },
      {
        food: "Jerusalem artichoke",
        emoji: "🌻",
        why: "One of the highest natural sources of inulin — a fibre your gut bacteria ferment into beneficial short-chain fatty acids.",
        howToUse: "Roast or steam. Introduce gradually — it's potent at first.",
      },
      {
        food: "Flaxseeds",
        emoji: "🌾",
        why: "Contain both soluble and insoluble fibre, plus lignans that support hormonal balance and gut barrier integrity.",
        howToUse: "Ground and added to porridge, smoothies, or baked goods. Whole seeds pass undigested.",
      },
      {
        food: "Edamame",
        emoji: "🫘",
        why: "A complete plant protein with fibre and isoflavones that feed specific microbial strains linked to metabolic health.",
        howToUse: "Snack on steamed, add to rice bowls, or blend into dips.",
      },
      {
        food: "Dandelion greens",
        emoji: "🌱",
        why: "Among the richest dietary sources of inulin per gram. Also bitter compounds that stimulate digestive enzymes.",
        howToUse: "Use in salads, sauté with garlic, or blend into green smoothies.",
      },
    ],
    reduce: [
      {
        food: "Ultra-processed snacks",
        reason: "Typically high in refined carbohydrates and emulsifiers (e.g. carboxymethylcellulose) that disrupt the gut mucosal layer and reduce microbial richness over time.",
      },
      {
        food: "Juice in place of whole fruit",
        reason: "Removes the fibre matrix — the part that feeds your microbiome. The sugar arrives quickly without the buffering effect of whole fruit.",
      },
    ],
  },

  feeding: {
    label: "Feeding",
    color: "var(--icon-green)",
    gradient: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))",
    icon: "Wheat",
    foods: [
      {
        food: "Black beans",
        emoji: "🫘",
        why: "Exceptionally high in resistant starch and soluble fibre — the combination that fuels the highest short-chain fatty acid production in the colon.",
        howToUse: "Use in stews, tacos, grain bowls, or blend into dips. Canned is fine.",
      },
      {
        food: "Oats (rolled or steel-cut)",
        emoji: "🌾",
        why: "Beta-glucan in oats has some of the strongest evidence for increasing beneficial Lactobacillus and Bifidobacterium populations.",
        howToUse: "Overnight oats, warm porridge, or blended into smoothies. Cook, then cool for extra resistant starch.",
      },
      {
        food: "Green banana or plantain",
        emoji: "🍌",
        why: "Unripe bananas contain resistant starch type 2 — survives digestion intact and becomes fuel for butyrate-producing bacteria in the colon.",
        howToUse: "Slice into smoothies, or boil green plantain as a starchy side.",
      },
      {
        food: "Lentils",
        emoji: "🍲",
        why: "High protein, high fibre, low glycaemic — and one of the best studied legumes for increasing Faecalibacterium prausnitzii, a butyrate producer linked to reduced inflammation.",
        howToUse: "Red lentil soup, dal, lentil bolognese, or cold in salads.",
      },
      {
        food: "Whole grain rye bread",
        emoji: "🍞",
        why: "Arabinoxylans in rye are among the most potent prebiotic fibres, outperforming wheat in studies measuring microbial diversity.",
        howToUse: "Replace standard bread with dense rye for your main meals.",
      },
      {
        food: "Sweet potato",
        emoji: "🍠",
        why: "Rich in soluble fibre and beta-carotene, with a fibre profile that feeds multiple microbial strains simultaneously.",
        howToUse: "Roast, steam, or mash. Cooled sweet potato has higher resistant starch.",
      },
    ],
    reduce: [
      {
        food: "White bread and pasta as staples",
        reason: "Rapidly digested, leaving little substrate for gut bacteria. Not harmful occasionally, but when they replace whole grains, the microbiome misses the fibre it depends on.",
      },
      {
        food: "Frequent alcohol",
        reason: "Disrupts the gut barrier and reduces populations of Akkermansia muciniphila — a keystone species that maintains gut lining integrity.",
      },
    ],
  },

  adding: {
    label: "Adding",
    color: "var(--icon-teal)",
    gradient: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))",
    icon: "FlaskConical",
    foods: [
      {
        food: "Live natural yoghurt",
        emoji: "🥛",
        why: "Contains Lactobacillus bulgaricus and Streptococcus thermophilus — well-studied strains that survive digestion and measurably shift microbial composition.",
        howToUse: "Breakfast with fruit and seeds, as a sauce base, or with spices as a dip.",
      },
      {
        food: "Sauerkraut (unpasteurised)",
        emoji: "🥬",
        why: "Naturally fermented cabbage contains hundreds of millions of live bacteria per gram — including Lactobacillus plantarum, linked to immune modulation.",
        howToUse: "1–2 tablespoons alongside meals. Refrigerated, unpasteurised versions only.",
      },
      {
        food: "Kefir",
        emoji: "🍶",
        why: "The most extensively studied fermented food for food system health — contains 30+ bacterial and yeast strains, and has shown effects on anxiety, inflammation, and lactose tolerance.",
        howToUse: "Drink 150–200ml daily or use as a base for smoothies and overnight oats.",
      },
      {
        food: "Kimchi",
        emoji: "🌶️",
        why: "Traditional Korean fermented vegetables — contains Leuconostoc mesenteroides and Lactobacillus kimchii, with emerging evidence for metabolic and immune benefits.",
        howToUse: "Add to grain bowls, eggs, noodles, or eat as a side dish.",
      },
      {
        food: "Miso paste",
        emoji: "🍜",
        why: "Fermented soy with a diverse microbial profile, plus glutamate that supports gut barrier function. Also contains B vitamins produced during fermentation.",
        howToUse: "Dissolve in warm (not boiling) water for broth. Add to dressings or marinades.",
      },
      {
        food: "Kombucha (low sugar)",
        emoji: "🍵",
        why: "Fermented tea containing organic acids and live cultures. Lower-sugar versions provide the microbial benefit without the glycaemic spike.",
        howToUse: "Drink 150–200ml with or between meals. Choose brands with <5g sugar per 100ml.",
      },
    ],
    reduce: [
      {
        food: "Pasteurised fermented products",
        reason: "Pasteurisation kills the live cultures that give fermented foods their gut benefit. Yoghurts and krauts labelled 'heat-treated' after fermentation provide no live bacteria.",
      },
      {
        food: "Antibiotic use without probiotic follow-up",
        reason: "Antibiotics significantly disrupt microbial communities. If antibiotics are necessary, adding fermented foods daily during and after the course helps speed recovery of microbial diversity.",
      },
    ],
  },

  consistency: {
    label: "Consistency",
    color: "var(--icon-yellow)",
    gradient: "linear-gradient(135deg, var(--icon-yellow), var(--icon-orange))",
    icon: "Clock",
    foods: [
      {
        food: "Porridge oats (morning anchor)",
        emoji: "🥣",
        why: "A reliable breakfast that feeds the morning microbial peak — gut bacteria are most active in the first few hours after waking. Oats also stabilise blood sugar, reducing cravings that break later meal patterns.",
        howToUse: "Make the same way each morning to build an automatic habit.",
      },
      {
        food: "Eggs",
        emoji: "🥚",
        why: "Versatile, fast to prepare, and nutritionally dense — making them ideal for the meals most likely to be skipped or replaced by something processed.",
        howToUse: "Use as the protein anchor of your most skipped meal.",
      },
      {
        food: "Frozen vegetables",
        emoji: "🥦",
        why: "Flash-frozen within hours of harvest — often nutritionally superior to 'fresh' produce that's been in transit. Removes the planning barrier that leads to skipped vegetables.",
        howToUse: "Keep a variety in the freezer for instant additions to any meal.",
      },
      {
        food: "Canned legumes",
        emoji: "🥫",
        why: "No prep time, long shelf life, and nutritionally equivalent to cooked from dry. Remove the friction that stops legumes from becoming a consistent habit.",
        howToUse: "Keep 3–4 varieties in the cupboard for instant protein-fibre additions.",
      },
      {
        food: "Nuts (mixed)",
        emoji: "🥜",
        why: "Pre-portioned, shelf-stable snack that stabilises blood sugar between meals — reducing the erratic hunger spikes that lead to poor food choices.",
        howToUse: "30g as a mid-morning or afternoon snack. Pre-portion into small containers.",
      },
      {
        food: "Herbal tea (chamomile or ginger)",
        emoji: "🫖",
        why: "Building a post-meal tea ritual creates a consistent wind-down signal after eating — supporting parasympathetic activation that aids digestion.",
        howToUse: "Brew after your evening meal as a consistent closing ritual.",
      },
    ],
    reduce: [
      {
        food: "Meal skipping",
        reason: "Each skipped meal disrupts the microbial circadian rhythm. Your gut bacteria anticipate feeding patterns — irregular inputs reduce the efficiency of digestion and nutrient absorption even when you do eat.",
      },
      {
        food: "Late-night eating as a habit",
        reason: "The gut microbiome operates on a circadian schedule. Consistent late eating shifts microbial composition toward strains associated with weight gain and metabolic disruption.",
      },
    ],
  },

  feeling: {
    label: "Feeling",
    color: "var(--icon-orange)",
    gradient: "linear-gradient(135deg, var(--icon-yellow), var(--icon-orange))",
    icon: "Heart",
    foods: [
      {
        food: "Ginger root",
        emoji: "🫚",
        why: "Gingerols have well-documented effects on gastric motility — helping food move through the digestive tract more efficiently and reducing bloating and discomfort.",
        howToUse: "Fresh in hot water, grated into stir-fries, or blended into smoothies.",
      },
      {
        food: "Bone broth",
        emoji: "🍖",
        why: "Glycine and glutamine in bone broth are the primary building blocks of the intestinal lining — directly supporting gut barrier integrity and reducing permeability.",
        howToUse: "Drink as a warm broth, use as a soup base, or add to cooking liquids.",
      },
      {
        food: "Turmeric (with black pepper)",
        emoji: "🌿",
        why: "Curcumin has strong evidence for reducing gut inflammation markers. Black pepper increases bioavailability by 2,000%. The combination targets the gut-immune interface.",
        howToUse: "Golden milk, curries, or a pinch in any warm dish. Always with pepper.",
      },
      {
        food: "Walnuts",
        emoji: "🫘",
        why: "Polyphenols in walnuts feed Lactobacillus and Bifidobacterium — strains strongly linked to reduced anxiety, improved mood, and gut-brain axis signalling.",
        howToUse: "6–8 whole walnuts as a daily snack or scattered over breakfast.",
      },
      {
        food: "Dark chocolate (85%+)",
        emoji: "🍫",
        why: "Flavanols in high-percentage dark chocolate feed beneficial bacteria and support nitric oxide production, which improves blood flow to the gut lining.",
        howToUse: "2–3 squares after a meal. Focus on 85%+ to maximise polyphenol content.",
      },
      {
        food: "Fennel",
        emoji: "🌿",
        why: "Anethole in fennel has antispasmodic properties — relaxing smooth muscle in the gut wall, which reduces cramping, bloating, and post-meal discomfort.",
        howToUse: "Raw in salads, roasted as a side, or fennel seed tea after meals.",
      },
    ],
    reduce: [
      {
        food: "FODMAPs during flares (onion, garlic, wheat)",
        reason: "High-FODMAP foods ferment rapidly in the gut. If bloating and discomfort are consistent, a short-term low-FODMAP trial can identify specific triggers — then gradually reintroduce to find your threshold.",
      },
      {
        food: "Eating while distracted or stressed",
        reason: "The gut and brain share a direct bidirectional connection. Eating in an activated, rushed state reduces digestive enzyme output and slows gastric motility — worsening bloating and discomfort regardless of what you eat.",
      },
    ],
  },
}

/* ── Top food pool (all foods with pillar tags) ─────────────────────── */

const ALL_FOODS: PersonalisedFood[] = [
  { food: "Kefir", emoji: "🍶", pillars: ["adding", "feeling"], impact: "Most studied fermented food for gut microbiome diversity and gut-brain axis benefits.", priority: "high" },
  { food: "Black beans", emoji: "🫘", pillars: ["feeding", "diversity"], impact: "Top fibre and resistant starch source — maximises short-chain fatty acid production.", priority: "high" },
  { food: "Sauerkraut", emoji: "🥬", pillars: ["adding"], impact: "Hundreds of millions of live bacteria per gram; direct seeding of the microbiome.", priority: "high" },
  { food: "Oats", emoji: "🌾", pillars: ["feeding", "consistency"], impact: "Beta-glucan fibre with the strongest evidence for Bifidobacterium growth.", priority: "high" },
  { food: "Leeks", emoji: "🌿", pillars: ["diversity", "feeding"], impact: "Inulin-rich prebiotic that selectively feeds the most beneficial gut bacteria.", priority: "high" },
  { food: "Walnuts", emoji: "🥜", pillars: ["feeling", "diversity"], impact: "Polyphenols that feed beneficial bacteria and support gut-brain axis function.", priority: "high" },
  { food: "Live yoghurt", emoji: "🥛", pillars: ["adding", "consistency"], impact: "Easy daily fermented food with well-studied strains and high palatability.", priority: "high" },
  { food: "Lentils", emoji: "🍲", pillars: ["feeding", "diversity"], impact: "Best-studied legume for increasing butyrate-producing bacteria.", priority: "high" },
  { food: "Ginger", emoji: "🫚", pillars: ["feeling"], impact: "Clinically supported effects on gastric motility and gut comfort.", priority: "medium" },
  { food: "Sweet potato", emoji: "🍠", pillars: ["feeding", "consistency"], impact: "Feeds multiple microbial populations simultaneously with diverse fibre types.", priority: "medium" },
  { food: "Kimchi", emoji: "🌶️", pillars: ["adding", "diversity"], impact: "Diverse bacterial profile; emerging evidence for metabolic and immune benefits.", priority: "medium" },
  { food: "Dandelion greens", emoji: "🌱", pillars: ["diversity", "feeling"], impact: "Highest natural inulin concentration of any common food; also supports digestion.", priority: "medium" },
  { food: "Miso", emoji: "🍜", pillars: ["adding", "feeling"], impact: "Fermented with diverse organisms; glutamate supports gut barrier directly.", priority: "medium" },
  { food: "Flaxseeds", emoji: "🌾", pillars: ["diversity", "feeling"], impact: "Dual soluble/insoluble fibre plus lignans for gut barrier integrity.", priority: "medium" },
  { food: "Whole grain rye", emoji: "🍞", pillars: ["feeding", "consistency"], impact: "Arabinoxylans outperform wheat fibre for measurable microbial diversity gains.", priority: "medium" },
  { food: "Dark chocolate (85%+)", emoji: "🍫", pillars: ["feeling", "diversity"], impact: "Flavanols feed Lactobacillus and Bifidobacterium; also enjoyable to eat.", priority: "medium" },
]

/* ── 30-day plan template (pillar-aware) ────────────────────────────── */

function buildWeeklyHabits(
  week: number,
  sortedInsights: PillarInsight[]
): { habit: string; detail: string }[] {
  const weakest = sortedInsights[0]?.pillar ?? "feeding"
  const second = sortedInsights[1]?.pillar ?? "diversity"

  const HABIT_POOLS: Record<PillarKey, string[][]> = {
    diversity: [
      ["Add one new plant per day", "Choose a vegetable, legume, seed, or grain you haven't eaten this week. Even a tablespoon of a new seed counts."],
      ["Count your weekly plants on Sunday", "Aim for 20+ different plant foods per week. Herbs, spices, and teas count. Most people are at 8–12 when they start."],
      ["Replace one familiar food with a new one", "Swap your usual grain or vegetable for something different. Keep a running list of plants you've tried."],
    ],
    feeding: [
      ["Anchor every main meal with a fibre source", "Legumes, whole grains, or 2+ vegetables. Make fibre-first the default, not the afterthought."],
      ["Prepare a batch of legumes for the week", "Cook or open a can of lentils, chickpeas, or black beans. Having them ready removes the biggest barrier to eating them."],
      ["Replace one refined-grain meal with whole grain", "Swap white rice for brown, white pasta for wholewheat, or white bread for rye. Do one at a time."],
    ],
    adding: [
      ["Add one fermented food to one meal daily", "Natural yoghurt at breakfast, sauerkraut with lunch, miso broth at dinner. Rotate them across the week."],
      ["Buy three fermented foods you haven't tried", "Kefir, kimchi, and kombucha are good starting points. Introduce one new one each week."],
      ["Make miso broth your daily snack or side", "Dissolve a teaspoon of miso paste in warm water. Takes 60 seconds and delivers live cultures."],
    ],
    consistency: [
      ["Set three fixed meal times and protect them", "Choose your usual breakfast, lunch, and dinner window. Within 30 minutes is close enough to stabilise your gut rhythm."],
      ["Prepare tomorrow's lunch tonight", "Reduce the friction on your most-skipped meal. A packed lunch removes the decision entirely."],
      ["Eat without screens for one meal per day", "Distraction-free eating activates the parasympathetic system — improving digestion of everything you eat that day."],
    ],
    feeling: [
      ["Add ginger or turmeric to one meal daily", "Both have direct effects on gut motility and inflammation. Add to soups, stir-fries, or warm water with lemon."],
      ["Sit for 5 minutes after your main meal", "Your gut works best when you're not immediately active after eating. Build in a brief digestive window."],
      ["Keep a one-word food journal for 3 days", "After each meal, note one word for how you feel an hour later. Patterns will emerge quickly."],
    ],
  }

  // Build 3 habits based on week and pillar priority
  const h1 = HABIT_POOLS[weakest][(week - 1) % 3]
  const h2 = HABIT_POOLS[second][(week - 1) % 3]
  const h3 = HABIT_POOLS["consistency"][(week - 1) % 3]

  return [
    { habit: h1[0], detail: h1[1] },
    { habit: h2[0], detail: h2[1] },
    { habit: h3[0], detail: h3[1] },
  ]
}

/* ── Main export ────────────────────────────────────────────────────── */

export function generateFullReport(result: AssessmentResult): FullReport {
  const { subScores, insights } = result

  // Build deep dives with score-aware summaries
  const deepDives: PillarDeepDive[] = (
    Object.keys(PILLAR_DEEP_DIVES) as PillarKey[]
  ).map((key) => {
    const score = subScores[key]
    const meta = PILLAR_DEEP_DIVES[key]
    const insight = insights.find((i) => i.pillar === key)

    const summary =
      score >= 65
        ? (insight?.strength ?? `Your ${meta.label.toLowerCase()} score is strong — keep it consistent and explore ways to diversify further.`)
        : (insight?.opportunity ?? `Your ${meta.label.toLowerCase()} score has clear room to grow — the food recommendations below are your most direct lever.`)

    return { pillar: key, score, summary, ...meta }
  })

  // Sort deep dives weakest first (most actionable at top)
  deepDives.sort((a, b) => a.score - b.score)

  // Build personalised food list — prioritise foods that hit weakest pillars
  const sortedInsights = [...insights].sort((a, b) => a.score - b.score)
  const weakPillars = sortedInsights.slice(0, 3).map((i) => i.pillar)

  const scored = ALL_FOODS.map((f) => {
    const pillarHits = f.pillars.filter((p) => weakPillars.includes(p)).length
    const priorityScore = f.priority === "high" ? 2 : 1
    return { ...f, _score: pillarHits * 2 + priorityScore }
  })
  scored.sort((a, b) => b._score - a._score)
  const top12Foods = scored.slice(0, 12).map(({ _score: _, ...f }) => f)

  // Build 30-day plan
  const thirtyDayPlan: WeekPlan[] = [
    {
      week: 1,
      title: "Foundation",
      focus: "Establish your two non-negotiable daily habits and track them consistently.",
      habits: buildWeeklyHabits(1, sortedInsights),
    },
    {
      week: 2,
      title: "Build",
      focus: "Add your fermented foods routine and begin expanding your plant variety.",
      habits: buildWeeklyHabits(2, sortedInsights),
    },
    {
      week: 3,
      title: "Deepen",
      focus: "Push your diversity score up and fine-tune how your body feels after meals.",
      habits: buildWeeklyHabits(3, sortedInsights),
    },
    {
      week: 4,
      title: "Sustain",
      focus: "Lock in the habits that have worked and identify your next growth area.",
      habits: buildWeeklyHabits(4, sortedInsights),
    },
  ]

  return { deepDives, top12Foods, thirtyDayPlan }
}

/* ── Starter Report (€20) ───────────────────────────────────────────── */

export interface StarterFood {
  food: string
  emoji: string
  impact: string
}

export interface StarterDayPlan {
  day: number
  label: string
  habit: string
}

export interface StarterReport {
  top5Foods: StarterFood[]
  sevenDayPlan: StarterDayPlan[]
}

export function generateStarterReport(result: AssessmentResult): StarterReport {
  const { insights } = result
  const sortedInsights = [...insights].sort((a, b) => a.score - b.score)
  const weakPillars = sortedInsights.slice(0, 3).map((i) => i.pillar)

  // Rank ALL_FOODS same as generateFullReport, take top 5
  const scored = ALL_FOODS.map((f) => {
    const pillarHits = f.pillars.filter((p) => weakPillars.includes(p)).length
    const priorityScore = f.priority === "high" ? 2 : 1
    return { ...f, _score: pillarHits * 2 + priorityScore }
  })
  scored.sort((a, b) => b._score - a._score)
  const top5Foods: StarterFood[] = scored.slice(0, 5).map(({ food, emoji, impact }) => ({ food, emoji, impact }))

  // 7-day starter plan — one action per day cycling through weakest pillars
  const DAY_LABELS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
  const STARTER_HABITS: Record<string, string[]> = {
    diversity: [
      "Add one new plant food you haven't eaten this week — a different legume, vegetable, or seed.",
      "Count how many different plants you've eaten today. Herbs and spices count.",
      "Swap your usual grain for something different — rye, quinoa, or barley instead.",
    ],
    feeding: [
      "Start every meal today with a fibre source — legumes, vegetables, or whole grains before anything else.",
      "Add a handful of canned legumes to one of your meals. Rinse, drain, done.",
      "Replace one refined-grain food with its whole-grain equivalent today.",
    ],
    adding: [
      "Add one fermented food to a meal today — yoghurt, sauerkraut, kefir, or miso.",
      "Make a miso broth in 60 seconds: one teaspoon miso paste dissolved in warm water.",
      "Try a new fermented food you haven't had before this week.",
    ],
    consistency: [
      "Eat three meals today at roughly the same times as yesterday. No skipping.",
      "Prepare your lunch or dinner components the night before to remove the decision.",
      "Eat one meal today without a screen — phone away, present with your food.",
    ],
    feeling: [
      "Add ginger or turmeric to one meal or drink today.",
      "Sit for 5 minutes after your main meal before doing anything active.",
      "Note one word for how you feel one hour after each meal today.",
    ],
  }

  const pillarOrder = [
    sortedInsights[0]?.pillar ?? "feeding",
    sortedInsights[1]?.pillar ?? "diversity",
    sortedInsights[2]?.pillar ?? "adding",
    "consistency",
    sortedInsights[3]?.pillar ?? "feeling",
    sortedInsights[4]?.pillar ?? "feeding",
    "feeling",
  ]

  const sevenDayPlan: StarterDayPlan[] = DAY_LABELS.map((label, i) => {
    const pillar = pillarOrder[i] as string
    const habitPool = STARTER_HABITS[pillar] ?? STARTER_HABITS.consistency
    const habit = habitPool[i % habitPool.length]
    return { day: i + 1, label, habit: habit ?? "" }
  })

  return { top5Foods, sevenDayPlan }
}

/* ── Premium Addons (€50 extras) ────────────────────────────────────── */

export interface MealTimingRule {
  title: string
  detail: string
}

export interface SeasonalFood {
  food: string
  emoji: string
  why: string
}

export interface ShoppingCategory {
  category: string
  items: string[]
}

export interface Milestone {
  month: number
  title: string
  goals: string[]
}

export interface BioticRecipe {
  name: string
  pillar: PillarKey
  prepTime: string
  ingredients: string[]
  method: string
}

export interface PremiumAddons {
  mealTiming: MealTimingRule[]
  seasonalFoods: SeasonalFood[]
  shoppingList: ShoppingCategory[]
  milestones: Milestone[]
  recipes: BioticRecipe[]
}

export function generatePremiumAddons(result: AssessmentResult): PremiumAddons {
  const { overall, insights } = result
  const sortedInsights = [...insights].sort((a, b) => a.score - b.score)
  const weakest = sortedInsights[0]?.pillar ?? "feeding"

  // Meal timing — varies by overall score range
  const mealTiming: MealTimingRule[] = overall >= 65
    ? [
        {
          title: "Maintain your eating window",
          detail: "You're doing well — keep your meals within a consistent 10–12 hour window each day. This supports your gut microbiome's circadian rhythm and prevents the metabolic disruption of late-night eating.",
        },
        {
          title: "Front-load your fibre",
          detail: "Eat your highest-fibre foods at breakfast and lunch when your digestive system is most active. Gut bacteria produce the most short-chain fatty acids in the morning hours.",
        },
        {
          title: "Leave 12 hours between dinner and breakfast",
          detail: "An overnight fast of 12 hours gives your gut lining time to repair and your microbial community time to reset. Even a modest fast protects gut barrier integrity.",
        },
      ]
    : overall >= 40
    ? [
        {
          title: "Set anchor times for your three main meals",
          detail: "Choose a consistent window for breakfast, lunch, and dinner — even just within 30 minutes of the same time daily. Your gut bacteria will begin anticipating and preparing digestive enzymes, improving absorption of everything you eat.",
        },
        {
          title: "Don't eat within 2 hours of sleep",
          detail: "Eating close to sleep disrupts the gut's rest-repair cycle. Your microbiome does active maintenance overnight — late meals interrupt this and are linked to reduced microbial diversity over time.",
        },
        {
          title: "Eat your largest meal mid-day, not at night",
          detail: "Digestive enzyme output and gut motility peak in the middle of the day. A lighter evening meal with your bigger fibre and protein load at lunch or mid-afternoon works with, not against, your gut's natural rhythm.",
        },
      ]
    : [
        {
          title: "Start with just one fixed meal time",
          detail: "If eating is currently erratic, don't try to fix everything at once. Pick your most reliable meal — usually breakfast — and make it happen at the same time every day for two weeks. One anchor creates a foundation.",
        },
        {
          title: "Don't skip breakfast",
          detail: "Skipping breakfast deprives your gut bacteria of their morning feed window. Even a small, fibre-rich breakfast — overnight oats, yoghurt with seeds — activates your gut microbiome after the overnight fast.",
        },
        {
          title: "Eat something every 4–5 hours",
          detail: "Large gaps between meals allow hunger to override food quality decisions. Consistent 4–5 hour eating intervals keep blood sugar stable and give gut bacteria a regular schedule to adapt to.",
        },
      ]

  // Seasonal foods — March/spring focus (project date is 2026-03-19)
  const seasonalFoods: SeasonalFood[] = [
    { food: "Purple sprouting broccoli", emoji: "🥦", why: "Peak season in late winter/early spring. Cruciferous vegetables contain glucosinolates that fuel sulphur-metabolising gut bacteria — a distinct microbial population often overlooked." },
    { food: "Wild garlic (ramsons)", emoji: "🌿", why: "Foraged spring green, available March–May. Contains allicin compounds that have prebiotic and antimicrobial properties — supporting beneficial bacteria while keeping pathogens in check." },
    { food: "Watercress", emoji: "🌱", why: "Spring's most nutrient-dense leaf. Polyphenols and nitrates support gut blood flow and feed Lactobacillus strains. Use raw to preserve heat-sensitive compounds." },
    { food: "Spring onions (scallions)", emoji: "🧅", why: "Rich in inulin-type fructans — the same prebiotic fibre found in leeks and garlic. Available year-round but at their sweetest in spring." },
    { food: "New season asparagus", emoji: "🌿", why: "British asparagus season begins in April. One of the richest dietary sources of inulin, with 2–3g of prebiotic fibre per 100g serving." },
    { food: "Radishes", emoji: "🌸", why: "Spring radishes contain sulphoraphane precursors and raffinose — a prebiotic oligosaccharide that specifically increases Bifidobacterium. Eat raw for maximum benefit." },
  ]

  // Shopping list — 30 items across 4 categories, tailored to weakest pillar
  const baseList: ShoppingCategory[] = [
    {
      category: "Fermented & Live",
      items: ["Live natural yoghurt (full-fat)", "Unpasteurised sauerkraut", "Kefir (plain, unsweetened)", "Miso paste (white or red)", "Kombucha (low sugar, <5g/100ml)", "Kimchi (refrigerated section)"],
    },
    {
      category: "Fibre & Whole Grains",
      items: ["Rolled oats (not quick oats)", "Whole grain rye bread", "Black beans (canned)", "Red lentils (dried)", "Chickpeas (canned)", "Barley (pearl or pot)", "Sweet potato", "Green banana or plantain"],
    },
    {
      category: "Fresh Produce",
      items: ["Leeks", "Purple cabbage", "Dandelion greens or chicory", "Watercress", "Fennel", "Ginger root (fresh)", "Spring onions"],
    },
    {
      category: "Pantry & Essentials",
      items: ["Flaxseeds (ground)", "Walnuts", "Mixed nuts (unsalted)", "Dark chocolate 85%+ (2–3 bars)", "Turmeric (ground)", "Black pepper (ground)", "Herbal teas (ginger, chamomile, fennel)", "Canned sardines or mackerel", "Extra virgin olive oil"],
    },
  ]

  // If weakest pillar is diversity, put diversity-boosting items first
  if (weakest === "diversity" || weakest === "adding") {
    // Reorder: fermented first, then fresh
    const reordered = [baseList[0], baseList[2], baseList[1], baseList[3]]
    return buildPremiumAddons(mealTiming, seasonalFoods, reordered, sortedInsights, weakest)
  }

  return buildPremiumAddons(mealTiming, seasonalFoods, baseList, sortedInsights, weakest)
}

function buildPremiumAddons(
  mealTiming: MealTimingRule[],
  seasonalFoods: SeasonalFood[],
  shoppingList: ShoppingCategory[],
  sortedInsights: { pillar: PillarKey; score: number }[],
  weakest: PillarKey,
): PremiumAddons {
  const milestones: Milestone[] = [
    {
      month: 1,
      title: "Build the Foundation",
      goals: [
        "Establish consistent meal times for 5 out of 7 days per week",
        "Add one fermented food to at least one meal each day",
        "Reach 15+ different plant foods per week",
        "Complete a 3-day food-feeling journal to identify patterns",
      ],
    },
    {
      month: 2,
      title: "Deepen & Diversify",
      goals: [
        "Reach 25+ different plant foods per week",
        "Rotate through at least 3 different fermented foods weekly",
        "Anchor every main meal with a whole-food fibre source",
        "Notice and note one positive change in energy, digestion, or mood",
      ],
    },
    {
      month: 3,
      title: "Sustain & Refine",
      goals: [
        "Identify your two highest-impact daily habits and protect them",
        "Introduce one premium food from your seasonal or shopping guide",
        "Retake the assessment and compare your new scores",
        "Share one habit you've built with someone who'd benefit",
      ],
    },
  ]

  // Recipes — 3 biotic starter recipes, tailored to weakest pillar
  const RECIPE_POOL: Record<PillarKey, BioticRecipe> = {
    diversity: {
      name: "30-Plant Grain Bowl",
      pillar: "diversity",
      prepTime: "15 minutes",
      ingredients: [
        "½ cup cooked farro or barley",
        "2 tbsp black beans (canned)",
        "Handful watercress or rocket",
        "1 tbsp pumpkin seeds",
        "1 tbsp sunflower seeds",
        "¼ roasted red pepper",
        "1 tsp flaxseeds (ground)",
        "Drizzle of extra virgin olive oil",
        "Squeeze of lemon",
      ],
      method: "Layer grains in a bowl. Add beans, greens, and seeds. Drizzle with olive oil and lemon. Toss lightly. Each ingredient is a different plant — this bowl can hit 8+ plant varieties in one meal.",
    },
    feeding: {
      name: "Overnight Oats with Resistant Starch",
      pillar: "feeding",
      prepTime: "5 minutes (night before)",
      ingredients: [
        "80g rolled oats",
        "200ml kefir or live yoghurt",
        "1 tbsp chia seeds",
        "1 tbsp ground flaxseeds",
        "½ green (unripe) banana, sliced",
        "Handful of mixed berries",
        "1 tsp honey (optional)",
      ],
      method: "Mix oats, kefir, chia, and flaxseeds in a jar. Refrigerate overnight. In the morning, top with green banana and berries. Eating cold oats maximises resistant starch — the form that best feeds your colon bacteria.",
    },
    adding: {
      name: "Miso Ginger Broth Bowl",
      pillar: "adding",
      prepTime: "10 minutes",
      ingredients: [
        "1 tbsp white miso paste",
        "500ml warm water (not boiling)",
        "1 tsp fresh ginger, grated",
        "Handful of leafy greens (spinach, watercress)",
        "½ sheet nori, torn",
        "1 spring onion, sliced",
        "Drizzle of sesame oil",
        "Optional: 1 soft-boiled egg",
      ],
      method: "Dissolve miso in warm (not boiling) water to preserve live cultures. Add ginger, greens, and nori. Top with spring onion and sesame oil. Drink immediately. Use this as a quick lunch or afternoon snack — it delivers live cultures, prebiotic fibre, and minerals in under 10 minutes.",
    },
    consistency: {
      name: "5-Minute Lentil Lunch",
      pillar: "consistency",
      prepTime: "5 minutes",
      ingredients: [
        "1 can red lentils or green lentils (drained)",
        "2 tbsp live natural yoghurt",
        "½ tsp cumin",
        "½ tsp turmeric",
        "Pinch of black pepper",
        "Handful of baby spinach",
        "Drizzle of olive oil",
        "Squeeze of lemon",
      ],
      method: "Drain and rinse lentils. Mix with cumin, turmeric, and pepper. Stir in yoghurt. Plate on spinach. Drizzle olive oil and lemon. This is a 5-minute, no-cook lunch that delivers fibre, live cultures, and anti-inflammatory spices — designed to be your default 'no-plan' meal.",
    },
    feeling: {
      name: "Golden Gut Tonic",
      pillar: "feeling",
      prepTime: "5 minutes",
      ingredients: [
        "250ml warm oat milk or whole milk",
        "½ tsp turmeric (ground)",
        "¼ tsp ginger (ground or fresh grated)",
        "Pinch of black pepper (essential — increases curcumin absorption by 2,000%)",
        "½ tsp raw honey",
        "Pinch of cinnamon",
      ],
      method: "Warm the milk gently — don't boil. Whisk in turmeric, ginger, pepper, and cinnamon. Sweeten with honey. Drink warm before bed or after dinner. The black pepper is non-negotiable — without it, the curcumin in turmeric is barely absorbed.",
    },
  }

  const pillarOrder: PillarKey[] = ["adding", "diversity", "feeding", "consistency", "feeling"]
  const recipeKeys = [
    weakest,
    pillarOrder.find((p) => p !== weakest) ?? "feeding",
    "adding",
  ] as PillarKey[]

  const recipes = recipeKeys
    .filter((k, i, arr) => arr.indexOf(k) === i) // dedupe
    .slice(0, 3)
    .map((k) => RECIPE_POOL[k])
    .filter(Boolean) as BioticRecipe[]

  // Ensure we always have 3
  while (recipes.length < 3) {
    const fallback = pillarOrder.find((p) => !recipes.find((r) => r.pillar === p))
    if (fallback) recipes.push(RECIPE_POOL[fallback])
    else break
  }

  return { mealTiming, seasonalFoods, shoppingList, milestones, recipes }
}
