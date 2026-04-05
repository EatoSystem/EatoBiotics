/* ── Family Assessment Questions ──────────────────────────────────────── */
// 15 questions: exactly 3 per pillar (5 pillars × 3 = 15).
// Reframed from individual → family perspective.
// Question IDs (q1–q15) and option values (0–3) match the individual
// assessment so all scoring functions from assessment-scoring.ts work unchanged.

import type { AssessmentQuestion } from "./assessment-data"

export type { PillarKey } from "./assessment-data"

export const FAMILY_QUESTIONS: AssessmentQuestion[] = [
  // ── Diversity (q1–q3) ─────────────────────────────────────────────
  {
    id: "q1",
    pillar: "diversity",
    sectionTitle: "Plant Diversity",
    index: 1,
    text: "How many different plant foods does your family eat in a typical week?",
    type: "single",
    options: [
      { value: 0, label: "1–5 plants", description: "A small set of familiar staples the family returns to each week" },
      { value: 1, label: "6–12 plants", description: "Some variety across vegetables, fruit, or grains" },
      { value: 2, label: "13–20 plants", description: "A decent spread across several different categories" },
      { value: 3, label: "21 or more", description: "Your family actively seeks plant variety every single week" },
    ],
  },
  {
    id: "q2",
    pillar: "diversity",
    sectionTitle: "Plant Diversity",
    index: 2,
    text: "How often do your family's meals include foods from at least three different plant categories — vegetables, fruit, legumes, grains, nuts, or seeds?",
    type: "single",
    options: [
      { value: 0, label: "Rarely", description: "Most meals are built around one or two plant foods" },
      { value: 1, label: "Sometimes", description: "It happens but isn't something the family thinks about" },
      { value: 2, label: "Often", description: "Most meals include a few different plant categories" },
      { value: 3, label: "Almost always", description: "Your family naturally eats across multiple plant categories at each meal" },
    ],
  },
  {
    id: "q3",
    pillar: "diversity",
    sectionTitle: "Plant Diversity",
    index: 3,
    text: "How intentionally does your family vary its food choices — rotating grains, trying different vegetables, or exploring unfamiliar plants?",
    type: "single",
    options: [
      { value: 0, label: "We eat the same things", description: "Family meals are very similar from week to week" },
      { value: 1, label: "Occasionally", description: "The family varies when something catches an eye" },
      { value: 2, label: "Deliberately", description: "You make a point of mixing things up regularly" },
      { value: 3, label: "Active habit", description: "Variety is something your family seeks out and prioritises every week" },
    ],
  },

  // ── Feeding (q4–q6) ───────────────────────────────────────────────
  {
    id: "q4",
    pillar: "feeding",
    sectionTitle: "Feeding Your Microbiome",
    index: 4,
    text: "How often do your family's meals include fibre-rich whole foods — vegetables, legumes, wholegrains, nuts, or seeds?",
    type: "single",
    options: [
      { value: 0, label: "Rarely", description: "Most family meals are refined or processed foods" },
      { value: 1, label: "Sometimes", description: "The family includes whole foods a few times a week" },
      { value: 2, label: "Often", description: "Most days include at least one fibre-rich meal" },
      { value: 3, label: "Almost always", description: "Whole foods are the foundation of most of what your family eats" },
    ],
  },
  {
    id: "q5",
    pillar: "feeding",
    sectionTitle: "Feeding Your Microbiome",
    index: 5,
    text: "How much of your family's daily food comes from processed or ultra-processed sources — packaged snacks, ready meals, refined bread, or fast food?",
    type: "single",
    options: [
      { value: 0, label: "Most meals", description: "Processed foods make up the majority of what the family eats" },
      { value: 1, label: "Several times a week", description: "Processed foods appear regularly in the family's week" },
      { value: 2, label: "Occasionally", description: "The family reaches for processed options now and then" },
      { value: 3, label: "Rarely or never", description: "Processed foods are uncommon in your family's eating" },
    ],
  },
  {
    id: "q6",
    pillar: "feeding",
    sectionTitle: "Feeding Your Microbiome",
    index: 6,
    text: "Does your family regularly eat prebiotic-rich foods — oats, garlic, onion, leeks, bananas, or asparagus?",
    type: "single",
    options: [
      { value: 0, label: "Not really", description: "These aren't foods the family thinks about or seeks out" },
      { value: 1, label: "A couple occasionally", description: "The family eats some of these but not as a conscious habit" },
      { value: 2, label: "Yes, a few regularly", description: "Several of these appear regularly in family meals" },
      { value: 3, label: "Multiple daily", description: "Prebiotic foods are a consistent part of the family's daily eating" },
    ],
  },

  // ── Adding (q7–q9) ────────────────────────────────────────────────
  {
    id: "q7",
    pillar: "adding",
    sectionTitle: "Live & Fermented Foods",
    index: 7,
    text: "How often does your family eat fermented or live-culture foods — yoghurt, kefir, kimchi, sauerkraut, miso, or similar?",
    type: "single",
    options: [
      { value: 0, label: "Rarely or never", description: "These foods don't feature in your family's current eating" },
      { value: 2, label: "Once or twice a week", description: "The family includes them occasionally" },
      { value: 3, label: "Most days", description: "At least one fermented food most days" },
      { value: 3, label: "Daily, intentionally", description: "Live or fermented foods are a deliberate daily family habit" },
    ],
  },
  {
    id: "q8",
    pillar: "adding",
    sectionTitle: "Live & Fermented Foods",
    index: 8,
    text: "When your family does eat fermented foods, how varied are the choices — rotating between different types?",
    type: "single",
    options: [
      { value: 0, label: "We don't eat them", description: "Fermented foods aren't part of the family routine" },
      { value: 2, label: "Just one type", description: "The family tends to stick to one fermented food" },
      { value: 3, label: "Two or three types", description: "The family rotates between a small selection" },
      { value: 3, label: "Actively rotate", description: "Your family intentionally varies fermented food choices across the week" },
    ],
  },
  {
    id: "q9",
    pillar: "adding",
    sectionTitle: "Live & Fermented Foods",
    index: 9,
    text: "How intentional is your family's approach to live and fermented foods — a planned daily habit, or more accidental when it happens?",
    type: "single",
    options: [
      { value: 0, label: "No habit at all", description: "It doesn't happen unless something comes up" },
      { value: 1, label: "Occasional and accidental", description: "It happens sometimes but not by design" },
      { value: 2, label: "Semi-intentional", description: "The family tries to include them but doesn't always manage it" },
      { value: 3, label: "Clear daily habit", description: "Your family deliberately includes live or fermented foods every day" },
    ],
  },

  // ── Consistency (q10–q12) ─────────────────────────────────────────
  {
    id: "q10",
    pillar: "consistency",
    sectionTitle: "Consistency & Rhythm",
    index: 10,
    text: "How would you describe your family's overall approach to eating?",
    type: "single",
    options: [
      { value: 0, label: "Reactive", description: "The family eats whatever is convenient when hunger hits" },
      { value: 1, label: "Occasional effort", description: "You try to eat well as a family, but it varies a lot day to day" },
      { value: 2, label: "Mostly intentional", description: "There's a general approach, with some flexibility" },
      { value: 3, label: "Consistently thoughtful", description: "The family eats with purpose and a clear sense of what works" },
    ],
  },
  {
    id: "q11",
    pillar: "consistency",
    sectionTitle: "Consistency & Rhythm",
    index: 11,
    text: "How consistent is your family's eating rhythm across the week — including weekends?",
    type: "single",
    options: [
      { value: 0, label: "Very unpredictable", description: "Meal timing and content vary wildly from day to day" },
      { value: 1, label: "Somewhat consistent", description: "Weekdays have some structure; weekends derail it" },
      { value: 2, label: "Mostly consistent", description: "There's a general family rhythm that holds most of the time" },
      { value: 3, label: "Highly consistent", description: "The family eats at similar times with similar patterns throughout the week" },
    ],
  },
  {
    id: "q12",
    pillar: "consistency",
    sectionTitle: "Consistency & Rhythm",
    index: 12,
    text: "How often does your family skip meals, eat very late, or rush through food without paying attention?",
    type: "single",
    options: [
      { value: 0, label: "Most days", description: "This describes a lot of the family's eating" },
      { value: 1, label: "A few times a week", description: "It happens regularly" },
      { value: 2, label: "Occasionally", description: "Now and then, but not the norm" },
      { value: 3, label: "Rarely", description: "The family generally protects meal time and eats together mindfully" },
    ],
  },

  // ── Feeling (q13–q15) ─────────────────────────────────────────────
  {
    id: "q13",
    pillar: "feeling",
    sectionTitle: "How Your Family Responds",
    index: 13,
    text: "How do your children typically feel in the hour or two after eating?",
    type: "single",
    options: [
      { value: 0, label: "Sluggish or uncomfortable", description: "Heavy, bloated, or tired after most meals" },
      { value: 1, label: "Variable", description: "Sometimes fine, sometimes not — hard to predict" },
      { value: 2, label: "Reasonably good", description: "Generally comfortable, with the occasional exception" },
      { value: 3, label: "Clear and energised", description: "They typically feel light, settled, and focused after eating" },
    ],
  },
  {
    id: "q14",
    pillar: "feeling",
    sectionTitle: "How Your Family Responds",
    index: 14,
    text: "How often do family members experience digestive discomfort — bloating, cramping, irregularity, or sensitivity?",
    type: "single",
    options: [
      { value: 0, label: "Frequently — most days", description: "Most days involve some level of digestive discomfort for someone" },
      { value: 1, label: "Sometimes — comes and goes", description: "Certain foods or stress trigger it" },
      { value: 2, label: "Rarely — minor and occasional", description: "Not something the family thinks about much" },
      { value: 3, label: "Almost never", description: "Digestion is consistently comfortable across the family" },
    ],
  },
  {
    id: "q15",
    pillar: "feeling",
    sectionTitle: "How Your Family Responds",
    index: 15,
    text: "How stable are your children's energy levels across the day — at home, at school, and into the evening?",
    type: "single",
    options: [
      { value: 0, label: "Very unstable", description: "Significant crashes, moodiness, or reliance on snacks to keep going" },
      { value: 1, label: "Somewhat stable", description: "Noticeable dips, but manageable" },
      { value: 2, label: "Mostly stable", description: "Good energy most of the day, with minor fluctuation" },
      { value: 3, label: "Consistently steady", description: "The children rarely experience noticeable energy dips throughout the day" },
    ],
  },
]
