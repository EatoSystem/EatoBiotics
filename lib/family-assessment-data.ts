/* ── Family Assessment Questions ──────────────────────────────────────── */
// A true household Food Culture assessment with five family-specific pillars:
//   Exposure (q1–q3) · Foundation (q4–q6) · Live Foods (q7–q9) ·
//   Rhythm (q10–q12) · Food Culture (q13–q15).
// Question IDs (q1–q15) and option values (0–3) drive the native 5-subscore
// engine in lib/family-assessment-scoring.ts. Context questions (ctx_*) below
// are NOT scored — they personalise recommendations and never lower the score.

import type { AssessmentQuestion } from "./assessment-data"

export type { PillarKey } from "./assessment-data"

export const FAMILY_QUESTIONS: AssessmentQuestion[] = [
  // ── Exposure (q1–q3) ──────────────────────────────────────────────
  {
    id: "q1",
    pillar: "exposure",
    sectionTitle: "Exposure",
    index: 1,
    text: "How many different plant foods does your family eat in a typical week?",
    type: "single",
    options: [
      { value: 0, label: "1–5 plants", description: "A small set of familiar staples the family returns to each week" },
      { value: 1, label: "6–12 plants", description: "Some variety across vegetables, fruit, or grains" },
      { value: 2, label: "13–20 plants", description: "A decent spread across several different categories" },
      { value: 3, label: "21 or more", description: "Your family actively meets plenty of plant variety each week" },
    ],
  },
  {
    id: "q2",
    pillar: "exposure",
    sectionTitle: "Exposure",
    index: 2,
    text: "How often are new or less-familiar foods offered to the family — even just to look at, smell, or try a small amount, with no pressure to finish?",
    type: "single",
    options: [
      { value: 0, label: "Rarely", description: "Meals stick closely to known favourites" },
      { value: 1, label: "Sometimes", description: "A new food shows up now and then" },
      { value: 2, label: "Often", description: "New foods are offered most weeks in a low-pressure way" },
      { value: 3, label: "Very often", description: "Trying small tastes of new foods is a normal, relaxed part of family eating" },
    ],
  },
  {
    id: "q3",
    pillar: "exposure",
    sectionTitle: "Exposure",
    index: 3,
    text: "When someone in the family is unsure about a food, how is it usually handled?",
    type: "single",
    options: [
      { value: 0, label: "It's dropped", description: "If it isn't liked once, the family tends not to revisit it" },
      { value: 1, label: "Tried once or twice", description: "It might reappear, but not deliberately" },
      { value: 2, label: "Offered again calmly", description: "Foods are re-offered over time without pressure" },
      { value: 3, label: "Patient repeated exposure", description: "The family knows tastes change and keeps offering gently over many tries" },
    ],
  },

  // ── Foundation (q4–q6) ────────────────────────────────────────────
  {
    id: "q4",
    pillar: "foundation",
    sectionTitle: "Foundation",
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
    pillar: "foundation",
    sectionTitle: "Foundation",
    index: 5,
    text: "How reliable are your family's everyday defaults — breakfasts, lunches, and snacks that include some protein and fibre rather than mostly refined or ultra-processed options?",
    type: "single",
    options: [
      { value: 0, label: "Mostly refined", description: "Everyday defaults lean heavily on packaged or ultra-processed foods" },
      { value: 1, label: "Patchy", description: "Some meals have a solid base; many don't" },
      { value: 2, label: "Mostly solid", description: "Most everyday defaults include some protein and fibre" },
      { value: 3, label: "Reliable", description: "The family's go-to meals and snacks are consistently nourishing" },
    ],
  },
  {
    id: "q6",
    pillar: "foundation",
    sectionTitle: "Foundation",
    index: 6,
    text: "Does your family regularly eat prebiotic-rich foods — oats, garlic, onion, leeks, bananas, or asparagus?",
    type: "single",
    options: [
      { value: 0, label: "Not really", description: "These aren't foods the family thinks about or seeks out" },
      { value: 1, label: "A couple occasionally", description: "The family eats some of these but not as a habit" },
      { value: 2, label: "Yes, a few regularly", description: "Several of these appear regularly in family meals" },
      { value: 3, label: "Multiple daily", description: "Prebiotic foods are a consistent part of the family's daily eating" },
    ],
  },

  // ── Live Foods (q7–q9) ────────────────────────────────────────────
  {
    id: "q7",
    pillar: "liveFoods",
    sectionTitle: "Live Foods",
    index: 7,
    text: "How often does your family eat fermented or live-culture foods — yoghurt, kefir, kimchi, sauerkraut, miso, or similar — where it suits each person's age and taste?",
    type: "single",
    options: [
      { value: 0, label: "Rarely or never", description: "These foods don't feature in your family's current eating" },
      { value: 1, label: "Now and then", description: "They show up occasionally, less than weekly" },
      { value: 2, label: "Once or twice a week", description: "The family includes them most weeks" },
      { value: 3, label: "Most days", description: "At least one fermented or live food most days" },
    ],
  },
  {
    id: "q8",
    pillar: "liveFoods",
    sectionTitle: "Live Foods",
    index: 8,
    text: "When your family does eat live or fermented foods, how varied are the choices?",
    type: "single",
    options: [
      { value: 0, label: "We don't eat them", description: "Fermented foods aren't part of the family routine" },
      { value: 1, label: "Just one type", description: "The family tends to stick to one fermented food" },
      { value: 2, label: "Two or three types", description: "The family rotates between a small selection" },
      { value: 3, label: "A real range", description: "Your family varies fermented food choices across the week" },
    ],
  },
  {
    id: "q9",
    pillar: "liveFoods",
    sectionTitle: "Live Foods",
    index: 9,
    text: "How settled is the live-foods habit in your home — an easy part of the routine, or something that only happens occasionally?",
    type: "single",
    options: [
      { value: 0, label: "No habit at all", description: "It doesn't happen unless something prompts it" },
      { value: 1, label: "Occasional", description: "It happens sometimes but not by design" },
      { value: 2, label: "Building", description: "The family is working it in but it isn't automatic yet" },
      { value: 3, label: "Settled habit", description: "Live or fermented foods are an easy, regular part of family life" },
    ],
  },

  // ── Rhythm (q10–q12) ──────────────────────────────────────────────
  {
    id: "q10",
    pillar: "rhythm",
    sectionTitle: "Rhythm",
    index: 10,
    text: "How predictable are your family's mealtimes across a normal week?",
    type: "single",
    options: [
      { value: 0, label: "Very unpredictable", description: "Meal timing changes a lot from day to day" },
      { value: 1, label: "Somewhat", description: "Weekdays have some structure; it varies" },
      { value: 2, label: "Mostly predictable", description: "There's a general family rhythm that holds most of the time" },
      { value: 3, label: "Highly predictable", description: "The family eats at broadly similar times through the week" },
    ],
  },
  {
    id: "q11",
    pillar: "rhythm",
    sectionTitle: "Rhythm",
    index: 11,
    text: "How often does the family share at least one meal together in a typical week?",
    type: "single",
    options: [
      { value: 0, label: "Rarely", description: "Shared meals are uncommon right now" },
      { value: 1, label: "Once or twice", description: "It happens occasionally" },
      { value: 2, label: "Several times", description: "Shared meals happen most days in some form" },
      { value: 3, label: "Most days", description: "Eating together is a normal part of the family rhythm" },
    ],
  },
  {
    id: "q12",
    pillar: "rhythm",
    sectionTitle: "Rhythm",
    index: 12,
    text: "How repeatable is your family's shopping and cooking routine — a few reliable meals and a loose plan, rather than starting from scratch each day?",
    type: "single",
    options: [
      { value: 0, label: "Day to day", description: "Most food decisions are last-minute" },
      { value: 1, label: "Loose", description: "Some repeated meals, but little planning" },
      { value: 2, label: "Mostly repeatable", description: "A handful of go-to meals and a rough weekly rhythm" },
      { value: 3, label: "Well-grooved", description: "Reliable defaults and an easy shopping/cooking routine" },
    ],
  },

  // ── Food Culture (q13–q15) ────────────────────────────────────────
  {
    id: "q13",
    pillar: "foodCulture",
    sectionTitle: "Food Culture",
    index: 13,
    text: "How relaxed are mealtimes in your home — free from pressure, bargaining, or conflict about what or how much is eaten?",
    type: "single",
    options: [
      { value: 0, label: "Often tense", description: "Food regularly involves pressure, negotiation, or stress" },
      { value: 1, label: "Sometimes tense", description: "Some meals are calm; others become a battle" },
      { value: 2, label: "Mostly relaxed", description: "Mealtimes are generally calm, with the odd flashpoint" },
      { value: 3, label: "Calm and low-pressure", description: "Eating is a relaxed, no-pressure part of family life" },
    ],
  },
  {
    id: "q14",
    pillar: "foodCulture",
    sectionTitle: "Food Culture",
    index: 14,
    text: "How involved are children (or other family members) in choosing, shopping for, or helping prepare food?",
    type: "single",
    options: [
      { value: 0, label: "Not involved", description: "Food is decided and made entirely by one person" },
      { value: 1, label: "Occasionally", description: "They help once in a while" },
      { value: 2, label: "Fairly often", description: "They regularly help choose or prepare something" },
      { value: 3, label: "Genuinely involved", description: "The family chooses, shops, and cooks together as a normal habit" },
    ],
  },
  {
    id: "q15",
    pillar: "foodCulture",
    sectionTitle: "Food Culture",
    index: 15,
    text: "Day to day, how confident and manageable does feeding your family feel — rather than stressful or overwhelming?",
    type: "single",
    options: [
      { value: 0, label: "Overwhelming", description: "Feeding the family often feels stressful or a struggle" },
      { value: 1, label: "Hard some days", description: "It's manageable at times, draining at others" },
      { value: 2, label: "Mostly manageable", description: "It feels doable most of the time" },
      { value: 3, label: "Confident", description: "Feeding the family feels calm, confident, and sustainable" },
    ],
  },
]

/* ── Context questions (NOT scored) ───────────────────────────────────────
 * These personalise the recommendations the family sees. They never change the
 * pillar scores or overall score — a tight budget or a picky eater shapes advice,
 * it does not lower how the family is doing. */
export const FAMILY_CONTEXT_QUESTIONS: AssessmentQuestion[] = [
  {
    id: "ctx_household",
    pillar: "context",
    sectionTitle: "About your family",
    index: 1,
    text: "How many people are in your household?",
    type: "single",
    options: [
      { value: 0, label: "1–2", description: "" },
      { value: 1, label: "3–4", description: "" },
      { value: 2, label: "5–6", description: "" },
      { value: 3, label: "7+", description: "" },
    ],
  },
  {
    id: "ctx_ages",
    pillar: "context",
    sectionTitle: "About your family",
    index: 2,
    text: "Which best describes the ages in your home?",
    type: "single",
    options: [
      { value: 0, label: "Young children", description: "Mostly under 5s" },
      { value: 1, label: "School-age children", description: "A mix of primary / secondary ages" },
      { value: 2, label: "Teens", description: "Older children and teenagers" },
      { value: 3, label: "Adults only", description: "No children at home" },
    ],
  },
  {
    id: "ctx_picky",
    pillar: "context",
    sectionTitle: "About your family",
    index: 3,
    text: "How would you describe fussy or selective eating in your home?",
    type: "single",
    options: [
      { value: 0, label: "Very selective", description: "Strong preferences make new foods hard" },
      { value: 1, label: "Somewhat", description: "A few reliable battles" },
      { value: 2, label: "A little", description: "Generally open with some exceptions" },
      { value: 3, label: "Adventurous", description: "Happy to try most things" },
    ],
  },
  {
    id: "ctx_budget",
    pillar: "context",
    sectionTitle: "About your family",
    index: 4,
    text: "How much does food budget shape your weekly choices?",
    type: "single",
    options: [
      { value: 0, label: "Tight budget", description: "Cost is a major factor in most decisions" },
      { value: 1, label: "Careful", description: "We watch spending but have some room" },
      { value: 2, label: "Comfortable", description: "Budget rarely limits choices" },
      { value: 3, label: "Flexible", description: "Budget isn't a big constraint" },
    ],
  },
  {
    id: "ctx_time",
    pillar: "context",
    sectionTitle: "About your family",
    index: 5,
    text: "How much time is realistically available for cooking on a normal day?",
    type: "single",
    options: [
      { value: 0, label: "Very little", description: "Quick, low-effort meals only" },
      { value: 1, label: "Some", description: "15–30 minutes most days" },
      { value: 2, label: "A fair amount", description: "Time to cook properly most days" },
      { value: 3, label: "Plenty", description: "Cooking from scratch is easy to fit in" },
    ],
  },
  {
    id: "ctx_schoolmeals",
    pillar: "context",
    sectionTitle: "About your family",
    index: 6,
    text: "How much does your family rely on school meals or packed lunchboxes?",
    type: "single",
    options: [
      { value: 0, label: "Heavily", description: "Most weekday lunches are school meals or lunchboxes" },
      { value: 1, label: "Often", description: "Several days a week" },
      { value: 2, label: "Sometimes", description: "Now and then" },
      { value: 3, label: "Rarely", description: "Most meals are eaten at home" },
    ],
  },
  {
    id: "ctx_goal",
    pillar: "context",
    sectionTitle: "About your family",
    index: 7,
    text: "What's your family's main food goal right now?",
    type: "single",
    options: [
      { value: 0, label: "More variety", description: "Widen what everyone will eat" },
      { value: 1, label: "Calmer mealtimes", description: "Less pressure and conflict around food" },
      { value: 2, label: "Steadier routine", description: "More predictable meals and planning" },
      { value: 3, label: "Healthier defaults", description: "Upgrade everyday meals and snacks" },
    ],
  },
]
