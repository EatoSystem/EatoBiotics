/* ── Mind Assessment Questions ──────────────────────────────────────── */
// A food-pattern reflection tool for mental energy, clarity, and focus — NOT a
// mental-health screening or diagnosis. Five Mind-specific pillars:
//   Plant & Polyphenol Diversity (q1–q3) · Brain Fuel (q4–q6) ·
//   Live Foods (q7–q9) · Rhythm (q10–q12) · Mind Response (q13–q15).
// Language is careful and non-deterministic ("may support", "is associated with").

import type { AssessmentQuestion } from "./assessment-data"

export const MIND_QUESTIONS: AssessmentQuestion[] = [
  // ── Plant & Polyphenol Diversity (q1–q3) ──────────────────────────
  {
    id: "q1",
    pillar: "plantDiversity",
    sectionTitle: "Plant & Polyphenol Diversity",
    index: 1,
    text: "How many different plant foods do you eat in a typical week? (Plant variety may help support the gut bacteria involved in mood and focus.)",
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
    pillar: "plantDiversity",
    sectionTitle: "Plant & Polyphenol Diversity",
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
    pillar: "plantDiversity",
    sectionTitle: "Plant & Polyphenol Diversity",
    index: 3,
    text: "How often do you include colourful foods — berries, leafy greens, herbs, and brightly coloured vegetables?",
    type: "single",
    options: [
      { value: 0, label: "Rarely", description: "Colour isn't something I think about on my plate" },
      { value: 1, label: "Occasionally", description: "A few colourful foods here and there" },
      { value: 2, label: "Most days", description: "I usually have something colourful each day" },
      { value: 3, label: "Every day, lots", description: "Colourful, polyphenol-rich foods feature at most meals" },
    ],
  },

  // ── Brain Fuel (q4–q6) ────────────────────────────────────────────
  {
    id: "q4",
    pillar: "brainFuel",
    sectionTitle: "Brain Fuel",
    index: 4,
    text: "How often do your meals include fibre-rich whole foods — vegetables, legumes, wholegrains, nuts, or seeds? (Fibre-rich foods may support the gut bacteria linked to steady energy.)",
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
    pillar: "brainFuel",
    sectionTitle: "Brain Fuel",
    index: 5,
    text: "How much of your daily food comes from processed or ultra-processed sources — packaged snacks, ready meals, refined bread, or fast food? (A diet high in these may be associated with inflammatory patterns that can affect energy and clarity.)",
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
    pillar: "brainFuel",
    sectionTitle: "Brain Fuel",
    index: 6,
    text: "How reliably do you start the day with a nourishing breakfast that includes some protein and fibre, rather than skipping it or grabbing something refined?",
    type: "single",
    options: [
      { value: 0, label: "Rarely", description: "I usually skip breakfast or grab something quick and refined" },
      { value: 1, label: "Sometimes", description: "It depends on the day" },
      { value: 2, label: "Most days", description: "I usually have a reasonable breakfast" },
      { value: 3, label: "Almost always", description: "A breakfast with protein and fibre is a steady habit" },
    ],
  },

  // ── Live Foods (q7–q9) ────────────────────────────────────────────
  {
    id: "q7",
    pillar: "liveFoods",
    sectionTitle: "Live Foods",
    index: 7,
    text: "How often do you eat fermented or live-culture foods — yoghurt, kefir, kimchi, sauerkraut, miso, kombucha, or similar? (These may support the microbial diversity associated with steadier mood.)",
    type: "single",
    options: [
      { value: 0, label: "Rarely or never", description: "These foods don't feature in my current eating" },
      { value: 1, label: "Now and then", description: "Less than weekly" },
      { value: 2, label: "Once or twice a week", description: "I include them most weeks" },
      { value: 3, label: "Most days", description: "At least one fermented food most days" },
    ],
  },
  {
    id: "q8",
    pillar: "liveFoods",
    sectionTitle: "Live Foods",
    index: 8,
    text: "When you do eat fermented foods, how varied are your choices — rotating between different types?",
    type: "single",
    options: [
      { value: 0, label: "I don't eat them", description: "Fermented foods aren't part of my routine" },
      { value: 1, label: "Just one type", description: "I tend to stick to one fermented food if I eat any" },
      { value: 2, label: "Two or three types", description: "I rotate between a small selection" },
      { value: 3, label: "I actively rotate", description: "I intentionally vary my fermented food choices across the week" },
    ],
  },
  {
    id: "q9",
    pillar: "liveFoods",
    sectionTitle: "Live Foods",
    index: 9,
    text: "How settled is your live-foods habit — an easy part of your routine, or more occasional?",
    type: "single",
    options: [
      { value: 0, label: "No habit at all", description: "It doesn't happen unless something comes up" },
      { value: 1, label: "Occasional", description: "It happens sometimes but not by design" },
      { value: 2, label: "Building", description: "I try to include them but don't always manage it" },
      { value: 3, label: "Settled habit", description: "Live or fermented foods are an easy daily part of my eating" },
    ],
  },

  // ── Rhythm (q10–q12) ──────────────────────────────────────────────
  {
    id: "q10",
    pillar: "rhythm",
    sectionTitle: "Rhythm",
    index: 10,
    text: "How would you describe your overall approach to eating? (Regular eating patterns may support the daily rhythms involved in mood and energy.)",
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
    pillar: "rhythm",
    sectionTitle: "Rhythm",
    index: 11,
    text: "How consistent is your eating rhythm across the week — including weekends? (Irregular eating may be associated with less stable energy and mood.)",
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
    pillar: "rhythm",
    sectionTitle: "Rhythm",
    index: 12,
    text: "How often do you rely on caffeine, skip meals, eat very late, or drink alcohol in a way that affects how you feel the next day? (These patterns may be associated with less steady energy and focus.)",
    type: "single",
    options: [
      { value: 0, label: "Most days", description: "This describes a lot of my week" },
      { value: 1, label: "A few times a week", description: "It happens regularly" },
      { value: 2, label: "Occasionally", description: "Now and then, but not the norm" },
      { value: 3, label: "Rarely", description: "I generally keep these in check" },
    ],
  },

  // ── Mind Response (q13–q15) ───────────────────────────────────────
  {
    id: "q13",
    pillar: "mindResponse",
    sectionTitle: "Mind Response",
    index: 13,
    text: "How is your mental clarity and focus in the hour or two after eating?",
    type: "single",
    options: [
      { value: 0, label: "Foggy and heavy", description: "I regularly feel mentally slow or unfocused after meals" },
      { value: 1, label: "Variable", description: "Sometimes clear, sometimes foggy — hard to predict" },
      { value: 2, label: "Reasonably clear", description: "Generally focused, with the occasional exception" },
      { value: 3, label: "Sharp and energised", description: "I typically feel clear-headed and focused after eating" },
    ],
  },
  {
    id: "q14",
    pillar: "mindResponse",
    sectionTitle: "Mind Response",
    index: 14,
    text: "How often do you notice cravings or energy crashes that pull your focus or mood down during the day?",
    type: "single",
    options: [
      { value: 0, label: "Most days", description: "Cravings or crashes regularly affect how I feel" },
      { value: 1, label: "Often", description: "Several times a week" },
      { value: 2, label: "Sometimes", description: "Now and then" },
      { value: 3, label: "Rarely", description: "My energy and focus stay fairly even" },
    ],
  },
  {
    id: "q15",
    pillar: "mindResponse",
    sectionTitle: "Mind Response",
    index: 15,
    text: "How well does your focus and mental energy hold through the afternoon — roughly 2–4pm?",
    type: "single",
    options: [
      { value: 0, label: "Major crash", description: "I regularly hit a wall — heavy fatigue, hard to concentrate" },
      { value: 1, label: "Noticeable dip", description: "I manage through but feel a clear drop in sharpness" },
      { value: 2, label: "Mild fluctuation", description: "A slight dip but I stay reasonably productive" },
      { value: 3, label: "Stays steady", description: "My focus remains consistent through the afternoon" },
    ],
  },
]
