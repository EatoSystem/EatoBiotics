/* ── Assessment Questions ────────────────────────────────────────────── */
// 15 questions across the 3 Biotics: Prebiotics, Probiotics, and Postbiotics.
// All questions are type "single" (radio/card select).
// IDs: q1–q15 in 3 Biotics order (Prebiotics → Probiotics → Postbiotics).

export type PillarKey =
  | "prebiotics"
  | "probiotics"
  | "postbiotics"
  | "feed"
  | "seed"
  | "heal"

export interface AnswerOption {
  label: string
  description: string
  value: number // 0–3
}

export interface AssessmentQuestion {
  id: string
  pillar: string // PillarKey for gut assessment; family/mind assessments may use their own keys
  sectionTitle: string
  index: number
  text: string
  type: "single" | "multi"
  options: AnswerOption[]
}

export const SECTION_COLORS: Record<string, string> = {
  // 3 Biotics section titles
  "Prebiotics — Plant Diversity": "var(--icon-lime)",
  "Prebiotics — Fibre & Whole Foods": "var(--icon-green)",
  "Probiotics — Fermented & Live Foods": "var(--icon-teal)",
  "Postbiotics — Consistency & Rhythm": "var(--icon-yellow)",
  "Postbiotics — Recovery & Resilience": "var(--icon-orange)",
  // Feed/Seed/Heal titles kept for localStorage backward compatibility
  "Feed — Plant Diversity": "var(--icon-lime)",
  "Feed — Fibre & Whole Foods": "var(--icon-green)",
  "Seed — Fermented & Live Foods": "var(--icon-teal)",
  "Heal — Consistency & Rhythm": "var(--icon-yellow)",
  "Heal — Recovery & Resilience": "var(--icon-orange)",
  // Legacy section titles (kept for localStorage backward compatibility)
  "Plant Diversity": "var(--icon-lime)",
  "Feeding Your Microbiome": "var(--icon-green)",
  "Live & Fermented Foods": "var(--icon-teal)",
  "Consistency & Rhythm": "var(--icon-yellow)",
  "How Your Body Responds": "var(--icon-orange)",
  "How Your Family Responds": "var(--icon-orange)",
  // Mind assessment section titles
  "Brain Nutrition": "var(--icon-lime)",
  "Brain Fuel": "var(--icon-green)",
  "Live Mind Foods": "var(--icon-teal)",
  "Mind Rhythm": "var(--icon-yellow)",
  "How Your Mind Responds": "var(--icon-orange)",
  // Legacy keys (kept for localStorage backwards compatibility)
  "Your Eating Foundation": "var(--icon-lime)",
  "Plant & Fibre Diversity": "var(--icon-lime)",
  "Balance & Rhythm": "var(--icon-yellow)",
  "Your Goals": "var(--icon-orange)",
}

export const QUESTIONS: AssessmentQuestion[] = [
  // ── Prebiotics — Plant Diversity (q1–q3) ──────────────────────────
  {
    id: "q1",
    pillar: "prebiotics",
    sectionTitle: "Prebiotics — Plant Diversity",
    index: 1,
    text: "How many different plant foods do you eat in a typical week?",
    type: "single",
    options: [
      { value: 0, label: "1–5 plants", description: "A small set of familiar staples I return to each week" },
      { value: 1, label: "6–12 plants", description: "Some variety across vegetables, fruit, or grains" },
      { value: 2, label: "13–20 plants", description: "A decent spread across several different categories" },
      { value: 3, label: "21 or more", description: "I actively seek plant variety every single week" },
    ],
  },
  {
    id: "q2",
    pillar: "prebiotics",
    sectionTitle: "Prebiotics — Plant Diversity",
    index: 2,
    text: "How often do your meals include foods from at least three different plant categories — vegetables, fruit, legumes, grains, nuts, or seeds?",
    type: "single",
    options: [
      { value: 0, label: "Rarely", description: "Most meals are built around one or two plant foods" },
      { value: 1, label: "Sometimes", description: "It happens but isn't something I think about" },
      { value: 2, label: "Often", description: "Most meals include a few different plant categories" },
      { value: 3, label: "Almost always", description: "I naturally eat across multiple plant categories at each meal" },
    ],
  },
  {
    id: "q3",
    pillar: "prebiotics",
    sectionTitle: "Prebiotics — Plant Diversity",
    index: 3,
    text: "How intentionally do you vary your food choices — rotating grains, trying different vegetables, or exploring unfamiliar plants?",
    type: "single",
    options: [
      { value: 0, label: "I eat the same things", description: "My meals are very similar from week to week" },
      { value: 1, label: "Occasionally", description: "I vary when I think of it or something catches my eye" },
      { value: 2, label: "Deliberately", description: "I make a point of mixing things up regularly" },
      { value: 3, label: "Active habit", description: "Variety is something I seek out and prioritise every week" },
    ],
  },

  // ── Prebiotics — Fibre & Whole Foods (q4–q6) ─────────────────────
  {
    id: "q4",
    pillar: "prebiotics",
    sectionTitle: "Prebiotics — Fibre & Whole Foods",
    index: 4,
    text: "How often do your meals include fibre-rich whole foods — vegetables, legumes, wholegrains, nuts, or seeds?",
    type: "single",
    options: [
      { value: 0, label: "Rarely", description: "Most meals are refined or processed foods" },
      { value: 1, label: "Sometimes", description: "I include whole foods a few times a week" },
      { value: 2, label: "Often", description: "Most days include at least one fibre-rich meal" },
      { value: 3, label: "Almost always", description: "Whole foods are the foundation of most of what I eat" },
    ],
  },
  {
    id: "q5",
    pillar: "prebiotics",
    sectionTitle: "Prebiotics — Fibre & Whole Foods",
    index: 5,
    text: "How much of your daily food comes from processed or ultra-processed sources — packaged snacks, ready meals, refined bread, or fast food?",
    type: "single",
    options: [
      { value: 0, label: "Most meals", description: "Processed foods make up the majority of what I eat" },
      { value: 1, label: "Several times a week", description: "Processed foods appear regularly in my week" },
      { value: 2, label: "Occasionally", description: "I reach for processed options now and then" },
      { value: 3, label: "Rarely or never", description: "Processed foods are uncommon in my eating" },
    ],
  },
  {
    id: "q6",
    pillar: "prebiotics",
    sectionTitle: "Prebiotics — Fibre & Whole Foods",
    index: 6,
    text: "Do you regularly eat prebiotic-rich foods — oats, garlic, onion, leeks, bananas, or asparagus?",
    type: "single",
    options: [
      { value: 0, label: "Not really", description: "These aren't foods I think about or seek out" },
      { value: 1, label: "A couple occasionally", description: "I eat some of these but not as a conscious habit" },
      { value: 2, label: "Yes, a few regularly", description: "Several of these appear regularly in my meals" },
      { value: 3, label: "Multiple daily", description: "Prebiotic foods are a consistent part of my daily eating" },
    ],
  },

  // ── Probiotics — Fermented & Live Foods (q7–q9) ──────────────────
  {
    id: "q7",
    pillar: "probiotics",
    sectionTitle: "Probiotics — Fermented & Live Foods",
    index: 7,
    text: "How often do you eat fermented or live-culture foods — yoghurt, kefir, kimchi, sauerkraut, miso, kombucha, or similar?",
    type: "single",
    options: [
      { value: 0, label: "Rarely or never", description: "These foods don't feature in my current eating" },
      { value: 2, label: "Once or twice a week", description: "I include them occasionally" },
      { value: 3, label: "Most days", description: "At least one fermented food most days" },
      { value: 3, label: "Daily, intentionally", description: "Live or fermented foods are a deliberate daily habit" },
    ],
  },
  {
    id: "q8",
    pillar: "probiotics",
    sectionTitle: "Probiotics — Fermented & Live Foods",
    index: 8,
    text: "When you do eat fermented foods, how varied are your choices — rotating between different types?",
    type: "single",
    options: [
      { value: 0, label: "I don't eat them", description: "Fermented foods aren't part of my routine" },
      { value: 2, label: "Just one type", description: "I tend to stick to one fermented food if I eat any" },
      { value: 3, label: "Two or three types", description: "I rotate between a small selection" },
      { value: 3, label: "I actively rotate", description: "I intentionally vary my fermented food choices across the week" },
    ],
  },
  {
    id: "q9",
    pillar: "probiotics",
    sectionTitle: "Probiotics — Fermented & Live Foods",
    index: 9,
    text: "How intentional is your approach to live and fermented foods — a planned daily habit, or more accidental when it happens?",
    type: "single",
    options: [
      { value: 0, label: "No habit at all", description: "It doesn't happen unless something comes up" },
      { value: 1, label: "Occasional and accidental", description: "It happens sometimes but not by design" },
      { value: 2, label: "Semi-intentional", description: "I try to include them but don't always manage it" },
      { value: 3, label: "Clear daily habit", description: "I deliberately include live or fermented foods every day" },
    ],
  },

  // ── Postbiotics — Consistency & Rhythm (q10–q12) ─────────────────
  {
    id: "q10",
    pillar: "postbiotics",
    sectionTitle: "Postbiotics — Consistency & Rhythm",
    index: 10,
    text: "How would you describe your overall approach to eating?",
    type: "single",
    options: [
      { value: 0, label: "Reactive", description: "I eat whatever is convenient when hunger hits" },
      { value: 1, label: "Occasional effort", description: "I try to eat well, but it varies a lot day to day" },
      { value: 2, label: "Mostly intentional", description: "I have a general approach, with some flexibility" },
      { value: 3, label: "Consistently thoughtful", description: "I eat with purpose and a clear sense of what works for me" },
    ],
  },
  {
    id: "q11",
    pillar: "postbiotics",
    sectionTitle: "Postbiotics — Consistency & Rhythm",
    index: 11,
    text: "How consistent is your eating rhythm across the week — including weekends?",
    type: "single",
    options: [
      { value: 0, label: "Very unpredictable", description: "Meal timing and content vary wildly from day to day" },
      { value: 1, label: "Somewhat consistent", description: "Weekdays have some structure; weekends derail it" },
      { value: 2, label: "Mostly consistent", description: "I have a general rhythm that holds most of the time" },
      { value: 3, label: "Highly consistent", description: "I eat at similar times with similar patterns throughout the week" },
    ],
  },
  {
    id: "q12",
    pillar: "postbiotics",
    sectionTitle: "Postbiotics — Consistency & Rhythm",
    index: 12,
    text: "How often do you skip meals, eat very late, or rush through food without paying attention?",
    type: "single",
    options: [
      { value: 0, label: "Most days", description: "This describes a lot of my eating" },
      { value: 1, label: "A few times a week", description: "It happens regularly" },
      { value: 2, label: "Occasionally", description: "Now and then, but not the norm" },
      { value: 3, label: "Rarely", description: "I generally protect my meal time and eat mindfully" },
    ],
  },

  // ── Postbiotics — Recovery & Resilience (q13–q15) ────────────────
  {
    id: "q13",
    pillar: "postbiotics",
    sectionTitle: "Postbiotics — Recovery & Resilience",
    index: 13,
    text: "How do you typically feel in the hour or two after eating?",
    type: "single",
    options: [
      { value: 0, label: "Sluggish or uncomfortable", description: "Heavy, bloated, or tired after most meals" },
      { value: 1, label: "Variable", description: "Sometimes fine, sometimes not — hard to predict" },
      { value: 2, label: "Reasonably good", description: "Generally comfortable, with the occasional exception" },
      { value: 3, label: "Clear and energised", description: "I typically feel light, stable, and focused after eating" },
    ],
  },
  {
    id: "q14",
    pillar: "postbiotics",
    sectionTitle: "Postbiotics — Recovery & Resilience",
    index: 14,
    text: "How often do you experience digestive discomfort — bloating, cramping, irregularity, or sensitivity?",
    type: "single",
    options: [
      { value: 0, label: "Frequently — most days", description: "Most days involve some level of digestive discomfort" },
      { value: 1, label: "Sometimes — comes and goes", description: "Certain foods or stress trigger it" },
      { value: 2, label: "Rarely — minor and occasional", description: "Not something I think about much" },
      { value: 3, label: "Almost never", description: "My digestion is consistently comfortable" },
    ],
  },
  {
    id: "q15",
    pillar: "postbiotics",
    sectionTitle: "Postbiotics — Recovery & Resilience",
    index: 15,
    text: "How stable is your energy level across the day?",
    type: "single",
    options: [
      { value: 0, label: "Very unstable", description: "Significant crashes, reliance on caffeine, or mid-afternoon collapse" },
      { value: 1, label: "Somewhat stable", description: "Noticeable dips, but I manage through" },
      { value: 2, label: "Mostly stable", description: "Good energy most of the day, with minor fluctuation" },
      { value: 3, label: "Consistently steady", description: "I rarely notice energy dips throughout the day" },
    ],
  },
]
