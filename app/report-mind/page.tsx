import type { Metadata } from "next"
import { DemoReport, type DemoReportData } from "@/components/report/demo-report"

export const metadata: Metadata = {
  title: "Sample Report — The Food System Inside Your Mind | EatoBiotics",
  description:
    "See a full sample EatoBiotics gut-brain report — how your food system affects mood, focus, and mental clarity, with targeted foods and a 30-day mind-gut plan.",
}

const MIND_DATA: DemoReportData = {
  theme: {
    accent: "var(--icon-teal)",
    gradient: "linear-gradient(90deg, var(--icon-teal), var(--icon-green))",
    label: "MIND REPORT — SAMPLE",
    title: "The Food System Inside Your Mind",
  },
  heroImage: "/images/mind-hero.png",
  score: 59,
  profile: "Foggy Foundations",
  tagline:
    "Your gut-brain connection is sending signals — tune in to the right foods and your mood, clarity, and energy can shift noticeably.",
  opening:
    "A Mind score of 59 tells a specific story: a gut system that is partially functional but not yet producing the neurochemical output your brain and mood depend on. You have awareness of the food-mood link and some consistent eating habits — but the key biological inputs that drive serotonin, dopamine, and GABA production through the gut are largely absent from your diet. This is correctable, and the shift can be felt within weeks.",
  scoreInterpretation:
    "Your score of 59 reflects a gut-brain axis that is underperforming relative to its potential. Approximately 90–95% of the body's serotonin is produced in the gut — by bacteria that require specific prebiotic and probiotic inputs to function. Your Prebiotics score (62) suggests your diet includes some of the right plant foods, but not with enough variety or consistency. Your Probiotics score (38) indicates that the bacterial populations responsible for serotonin and GABA synthesis are not being actively supported. Your Postbiotics score (64) points to a gut environment that's under low-level inflammatory stress — a common finding in people who report mood instability, afternoon energy crashes, or difficulty concentrating. The good news is that the gut-brain axis is highly responsive to targeted dietary change. Studies consistently show measurable mood improvements within 3–4 weeks of a diet optimised for gut microbial diversity.",
  pillarScores: [
    {
      name: "Prebiotics",
      score: 62,
      color: "var(--icon-green)",
      description:
        "Your diet includes some plant diversity, but your intake of the specific prebiotic fibres that feed serotonin-producing bacteria is inconsistent. Tryptophan-rich plant foods are particularly underrepresented.",
    },
    {
      name: "Probiotics",
      score: 38,
      color: "var(--icon-orange)",
      description:
        "Your intake of fermented and probiotic-rich foods is very low. The bacteria responsible for synthesising neurotransmitters — including Lactobacillus and Bifidobacterium strains — are not being actively replenished.",
    },
    {
      name: "Postbiotics",
      score: 64,
      color: "var(--icon-teal)",
      description:
        "Your gut shows signs of low-level chronic stress — likely driven by irregular eating patterns and elevated cortisol. Gut barrier integrity affects brain inflammation, mood regulation, and sleep quality.",
    },
  ],
  dailyImpact: [
    {
      icon: "🌫️",
      title: "Brain fog & focus",
      body: "The inflammatory signals produced by a low-diversity gut directly cross the blood-brain barrier and impair cognitive clarity. A stronger Probiotics score correlates with measurably sharper focus and faster recall.",
    },
    {
      icon: "🌊",
      title: "Mood stability",
      body: "Your gut produces 90–95% of your body's serotonin. A Probiotics score of 38 means that production is significantly below optimal. Closing this gap reduces mood volatility — not through willpower, but biology.",
    },
    {
      icon: "🌙",
      title: "Sleep depth",
      body: "Serotonin is the precursor to melatonin. When gut serotonin production is low, sleep onset is slower and deep-sleep phases are shorter. Improving your Probiotics score is one of the most direct routes to better sleep.",
    },
  ],
  scoreProjection: {
    projected: 74,
    timeline: "30 days",
    note: "Mind scores tend to improve more gradually than You scores because the gut-brain axis requires consistent bacterial repopulation over several weeks. This projection assumes daily adherence to the plan.",
    drivers: ["Daily fermented food (kefir/yoghurt)", "Omega-3 rich foods 3× per week", "Screens-off meals daily"],
  },
  pullQuote:
    "90% of your serotonin is produced in your gut — not your brain. Mood, clarity, and mental energy begin at the dinner table, not the pharmacy.",
  strengths: [
    {
      title: "Awareness of the food-mood link",
      explanation:
        "You're already conscious of how food affects how you feel — this self-awareness makes you significantly more likely to act on targeted dietary recommendations and notice the effects when they appear.",
    },
    {
      title: "Some dietary consistency",
      explanation:
        "Your eating patterns have enough regularity to support the gut's circadian rhythm. This is more important for mental clarity than most people realise — irregular meal timing disrupts the gut clock and compounds mood instability.",
    },
    {
      title: "Adequate hydration habits",
      explanation:
        "Your fluid intake is reasonable. Good hydration supports the mucosal layer of the gut lining — the first barrier between your microbiome and your bloodstream — and affects both energy and cognitive function.",
    },
  ],
  opportunities: [
    {
      title: "Serotonin-pathway foods",
      explanation:
        "Your diet is low in foods that support the tryptophan → serotonin pathway: eggs, oily fish, dark leafy greens, walnuts, and bananas. These provide the raw materials your gut bacteria need to produce the neurotransmitters that directly affect mood and sleep.",
    },
    {
      title: "Stress and eating rhythm",
      explanation:
        "Your cortisol patterns appear elevated at mealtimes — you frequently eat in high-stress conditions or rush meals. Elevated cortisol suppresses the parasympathetic nervous system needed for optimal digestion and nutrient absorption.",
    },
    {
      title: "Sleep-gut connection",
      explanation:
        "Your sleep and gut health are in a feedback loop. Poor gut microbiome diversity reduces melatonin precursor production; poor sleep degrades gut barrier integrity. You need to address both together rather than treating them as separate issues.",
    },
  ],
  keyInsight: {
    trigger:
      "Your gut is producing significantly less serotonin than it could — targeted food choices can change this within weeks.",
    explanation:
      "The gut produces roughly 90% of your body's serotonin. This serotonin doesn't cross the blood-brain barrier directly — but it regulates gut motility, influences the vagus nerve, and affects the systemic inflammatory state that your brain is bathed in. Your Probiotics score of 38 means the bacterial populations most responsible for this production — Lactobacillus rhamnosus, Bifidobacterium longum, and Lactobacillus helveticus — are not being regularly introduced through your diet. The clinical research on this is unusually consistent: supplementing these strains (or eating foods that contain them) for 4 weeks produces measurable reductions in anxiety, improvements in sleep onset, and better mood stability. You don't need to understand the mechanism — you just need to eat the foods.",
  },
  deepInsight:
    "What makes the gut-brain connection both compelling and practical is that it operates on a two-way street. The brain influences what and how you eat (stress eating, appetite suppression, cravings) — but the gut equally influences how your brain functions. The vagus nerve, which carries 80% of signals upward from gut to brain rather than the other way around, is the primary highway. The quality of your microbiome determines the quality of those signals.\n\nYour score pattern — low Probiotics, moderate Prebiotics, moderate Postbiotics — is characteristic of someone who has the dietary intention but not yet the microbial diversity. You're eating reasonably but not providing your gut with the specific bacterial inputs that the brain pathway depends on. This isn't a failure of effort; it's a knowledge gap. The five foods in this report, and the 30-day plan, are designed specifically to close it. The expected experience: fewer afternoon energy dips, improved sleep quality, and a more stable baseline mood — not a dramatic transformation, but a meaningful, sustainable shift.",
  sevenDayPlan: [
    {
      day: "Monday",
      action: "Eat two eggs at breakfast — one of the richest dietary sources of tryptophan and choline",
    },
    {
      day: "Tuesday",
      action: "Add a handful of walnuts as an afternoon snack — they contain ALA omega-3 and serotonin precursors",
    },
    {
      day: "Wednesday",
      action: "Eat a portion of oily fish (salmon, mackerel, or sardines) — the DHA directly supports brain membrane function",
    },
    {
      day: "Thursday",
      action: "Add a large handful of spinach or dark leafy greens to a meal — rich in folate for neurotransmitter synthesis",
    },
    {
      day: "Friday",
      action: "Eat a banana before bed — natural tryptophan + magnesium supports melatonin production",
    },
    {
      day: "Saturday",
      action: "Introduce live-culture yoghurt or kefir — start seeding the serotonin-producing bacterial strains",
    },
    {
      day: "Sunday",
      action: "Eat your meals away from screens, sitting down — activate the parasympathetic state needed for gut-brain signalling",
    },
  ],
  foods: [
    {
      emoji: "🍫",
      food: "Dark Chocolate (70%+)",
      why: "Dark chocolate is one of the most polyphenol-rich foods available. It feeds Lactobacillus and Bifidobacterium strains, reduces cortisol levels, and contains theobromine and magnesium — both linked to improved mood and reduced anxiety.",
      howTo:
        "20–30g of 70%+ dark chocolate daily. The higher the percentage, the lower the sugar and the stronger the prebiotic effect. Keep it as an afternoon snack rather than after dinner to avoid affecting sleep.",
      pillars: ["Prebiotics", "Postbiotics"],
      compound: "Flavanol polyphenols + magnesium",
      servingsPerWeek: 7,
      shopCategory: "Pantry",
    },
    {
      emoji: "🥜",
      food: "Walnuts",
      why: "Walnuts are uniquely high in ALA (plant-based omega-3) and contain serotonin itself — one of the few foods that does. They also contain ellagitannins, which gut bacteria convert into urolithins — potent anti-inflammatory compounds that reduce brain inflammation.",
      howTo:
        "A small handful (6–8 walnuts) as an afternoon snack, or added to porridge and salads. Don't roast them — heat degrades the ALA content. Raw or lightly toasted is best.",
      pillars: ["Prebiotics", "Postbiotics"],
      compound: "ALA omega-3 + ellagitannins",
      servingsPerWeek: 5,
      shopCategory: "Nuts & Seeds",
    },
    {
      emoji: "🍌",
      food: "Banana",
      why: "Bananas are a concentrated source of tryptophan (serotonin precursor), vitamin B6 (essential for serotonin synthesis), and resistant starch (when slightly unripe) — a prebiotic that feeds the bacteria that process tryptophan.",
      howTo:
        "Eat a slightly underripe banana (yellow with green tips) for maximum resistant starch. Great before bed with a small amount of nut butter — the combination supports melatonin production overnight.",
      pillars: ["Prebiotics"],
      compound: "Resistant starch + tryptophan + B6",
      servingsPerWeek: 4,
      shopCategory: "Produce",
    },
    {
      emoji: "🥚",
      food: "Eggs",
      why: "Eggs are the richest whole-food source of choline — a precursor to acetylcholine, the neurotransmitter most associated with memory and focus. They also provide complete tryptophan and tyrosine (dopamine precursor).",
      howTo:
        "Two eggs at breakfast, 4–5 times per week. Poached or soft-boiled preserves the most nutrients. Pair with dark leafy greens for the full neurotransmitter-support package.",
      pillars: ["Postbiotics"],
      compound: "Choline + tryptophan + tyrosine",
      servingsPerWeek: 5,
      shopCategory: "Proteins",
    },
    {
      emoji: "🥬",
      food: "Spinach",
      why: "Spinach is one of the highest dietary sources of folate — a B vitamin essential for the methylation cycle that produces serotonin, dopamine, and norepinephrine. Low folate is directly correlated with depression risk.",
      howTo:
        "A large handful (60–80g) in meals — wilts down considerably when cooked. Add to eggs, pasta, soups, or blend into smoothies where it's essentially undetectable in flavour.",
      pillars: ["Prebiotics", "Postbiotics"],
      compound: "Folate (methylation support)",
      servingsPerWeek: 5,
      shopCategory: "Produce",
    },
  ],
  foodPairings: [
    {
      food1: "Eggs",
      food2: "Spinach",
      emoji1: "🥚",
      emoji2: "🥬",
      reason: "Choline + folate — together they provide the full methylation cycle needed for serotonin and dopamine synthesis. This is the most direct dietary route to neurotransmitter production available from whole foods.",
    },
    {
      food1: "Banana",
      food2: "Dark Chocolate",
      emoji1: "🍌",
      emoji2: "🍫",
      reason: "Tryptophan + polyphenols — banana provides the serotonin precursor; dark chocolate provides the prebiotic environment for the gut bacteria that convert tryptophan into active serotonin. One without the other is significantly less effective.",
    },
  ],
  roadmap: [
    {
      week: "Week 1",
      theme: "Calm the Signals",
      focus: "Introduce the foundation gut-brain foods and begin reducing cortisol at meals",
      actions: [
        "Eat eggs at breakfast every day — the choline and tryptophan baseline matters from day one",
        "Add walnuts or dark chocolate as your afternoon snack daily",
        "Eat one meal per day without screens, sitting down, with at least 20 minutes",
        "Start a kefir or live yoghurt habit at breakfast",
      ],
    },
    {
      week: "Week 2",
      theme: "Probiotic Pathway",
      focus: "Begin actively seeding the serotonin-producing bacterial strains",
      actions: [
        "Eat fermented foods (kefir, yoghurt, kimchi) twice daily — morning and evening",
        "Add spinach or dark leafy greens to at least one meal every day",
        "Eat oily fish (salmon, mackerel, sardines) twice this week",
        "Introduce a banana at bedtime on 4 nights — track sleep quality",
      ],
    },
    {
      week: "Week 3",
      theme: "Build the Brain-Gut Loop",
      focus: "Consolidate the neurochemical inputs and add stress-reduction practices",
      actions: [
        "Add a 10-minute walk after your main meal every day — vagus nerve stimulation",
        "Expand your plant variety to 25+ different plants this week",
        "Include a tryptophan-rich food (eggs, fish, banana, dark chocolate) at every meal",
        "Reduce caffeine after 2pm — this directly improves gut-brain overnight repair",
      ],
    },
    {
      week: "Week 4",
      theme: "Mind-Gut Optimise",
      focus: "Measure the shifts and embed the habits long-term",
      actions: [
        "Maintain all habits from weeks 1–3 without exception",
        "Notice and log any changes in afternoon energy, sleep onset, or mood baseline",
        "Try one entirely new fermented food you haven't eaten before",
        "Retake the assessment — your Mind score should have shifted meaningfully",
      ],
    },
  ],
  closing:
    "The gut-brain connection is not a metaphor or a wellness trend — it is a biological fact, and your score reflects where yours currently sits. A score of 59 is not a diagnosis of anything; it is a measurement of a correctable gap. The five foods in this report directly address the bacterial and nutritional deficit your gut-brain axis is experiencing. The 30-day plan provides the structure. The expected outcome is not a transformation — it's a recalibration. More stable energy. Better sleep. A mood baseline that feels a little more solid. That is what closing a Probiotics score gap of this kind tends to produce. Follow the plan, retake the assessment, and see for yourself.",
}

export default function ReportMindPage() {
  return (
    <div className="min-h-screen bg-background pt-16">
      <DemoReport data={MIND_DATA} />
    </div>
  )
}
