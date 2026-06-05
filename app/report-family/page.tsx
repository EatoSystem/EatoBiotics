import type { Metadata } from "next"
import { DemoReport, type DemoReportData } from "@/components/report/demo-report"

export const metadata: Metadata = {
  robots: { index: false },
  title: "Sample Report — The Food System Inside Your Family | EatoBiotics",
  description:
    "See a full sample EatoBiotics family gut health report — shared food habits, children's nutrition, collective scores, and a practical 30-day family plan.",
}

const FAMILY_DATA: DemoReportData = {
  theme: {
    accent: "var(--icon-yellow)",
    gradient: "linear-gradient(90deg, var(--icon-green), var(--icon-yellow))",
    label: "FAMILY REPORT — SAMPLE",
    title: "The Food System Inside Your Family",
  },
  heroImage: "/images/family-hero.png",
  score: 64,
  profile: "Growing Together",
  tagline:
    "Your family's food system has real shared strengths — a few targeted shifts will create compound benefits for everyone at the table.",
  opening:
    "A family food score of 64 is a genuinely positive starting point. Your household eats together, maintains breakfast habits, and includes a reasonable variety of fruit and vegetables. The primary opportunity is in what's missing from the shared plate — fermented and prebiotic-rich foods that would strengthen each family member's microbiome individually, while building a food culture that protects the next generation.",
  scoreInterpretation:
    "A family score of 64 reflects a household where the structural habits are in place but the nutritional depth needs expanding. You share mealtimes (a powerful determinant of children's long-term eating patterns), you eat fruit and vegetables regularly, and breakfast is consistent — these are the hardest habits to build and you already have them. The gap is in diversity and fermented foods. Most family diets rely on a core rotation of 10–15 foods; broadening this to 25–30 plant foods per week, and adding 1–2 fermented foods daily, will have a measurable impact on every family member's gut diversity within 30 days.",
  pillarScores: [
    {
      name: "Prebiotics",
      score: 68,
      color: "var(--icon-green)",
      description:
        "Your family eats a reasonable variety of plants, but tends to return to the same core foods week after week. Expanding variety — particularly across vegetables and legumes — is the main Prebiotics opportunity.",
    },
    {
      name: "Probiotics",
      score: 41,
      color: "var(--icon-orange)",
      description:
        "Fermented foods are largely absent from your family's regular diet. Children's microbiomes are especially responsive to live-culture foods, and this is the biggest gap to close.",
    },
    {
      name: "Postbiotics",
      score: 74,
      color: "var(--icon-teal)",
      description:
        "Your family's eating rhythm and recovery patterns are solid. Shared mealtimes and reasonably consistent sleep patterns support the gut's daily repair cycle.",
    },
  ],
  dailyImpact: [
    {
      icon: "👧",
      title: "Children's development",
      body: "Children's microbiomes are still forming. The bacterial diversity established before age 12 shapes immune function, mood regulation, and metabolic health for decades. What your family eats now has a long tail.",
    },
    {
      icon: "🧠",
      title: "Concentration & behaviour",
      body: "The gut-brain axis is especially active in children. A fibre-rich, fermented-food diet is directly associated with better focus, more stable mood, and reduced anxiety in school-age children.",
    },
    {
      icon: "🛡️",
      title: "Shared immunity",
      body: "70% of the immune system lives in the gut. A family that eats a diverse, probiotic-rich diet together builds shared microbial resilience — fewer illnesses, faster recovery, lower antibiotic need.",
    },
  ],
  scoreProjection: {
    projected: 79,
    timeline: "30 days",
    note: "Family scores reflect collective habits. Even one or two consistent changes across the whole household produce compound results for every family member simultaneously.",
    drivers: ["Daily live-culture yoghurt for all", "Legumes 4× per week", "25+ plant foods per week"],
  },
  pullQuote:
    "The habits children form before age 12 shape their microbiome for decades. What you put on the family table today is an investment in every family member's long-term health.",
  strengths: [
    {
      title: "Regular shared mealtimes",
      explanation:
        "Eating together as a family is one of the strongest predictors of children's long-term nutritional health. It shapes food preferences, portion awareness, and social eating patterns that persist into adulthood.",
    },
    {
      title: "Good fruit and vegetable variety",
      explanation:
        "Your household regularly includes a range of fresh produce. This provides a consistent supply of prebiotic fibre and polyphenols — the two key inputs your family's gut bacteria need most.",
    },
    {
      title: "Consistent breakfast habits",
      explanation:
        "All family members eat breakfast regularly. This supports gut circadian rhythm and ensures the microbiome receives a morning signal — breakfast-skipping disrupts gut motility and impacts children's concentration and mood.",
    },
  ],
  opportunities: [
    {
      title: "Fermented foods for children",
      explanation:
        "Children's microbiomes are still developing and are particularly responsive to probiotic-rich foods. Plain yoghurt, kefir, and mild fermented foods like soft cheese are easy family-friendly options that can make a significant difference.",
    },
    {
      title: "Fibre variety beyond fruit",
      explanation:
        "Your family's fibre intake leans heavily on fruit rather than a broader range of legumes, root vegetables, and wholegrains. Diversifying the fibre sources feeds a wider variety of bacterial species.",
    },
    {
      title: "Reducing ultra-processed snacks",
      explanation:
        "Your household relies on ultra-processed snacks more than 4 times per week. These displace prebiotic-rich alternatives and contain emulsifiers and additives that can disrupt the gut lining over time.",
    },
  ],
  keyInsight: {
    trigger:
      "Shared mealtimes are your family's biggest asset — the next step is what's on the plate.",
    explanation:
      "The research on family eating is clear: families who eat together have children with healthier gut microbiomes, better dietary diversity, and lower rates of digestive issues in adolescence. Your family already does this. What this means is that any change you make to the family meal — adding a fermented food, swapping a processed snack, introducing a new vegetable — will benefit every person at the table simultaneously. Your shared habit structure means your impact multiplier is higher than in households where members eat separately. One change, four people, four times the effect.",
  },
  deepInsight:
    "Family food systems are different from individual ones in one important way: the habits compound across people and across time. When a parent adds kefir to breakfast, a child who sees that daily becomes a teenager who considers fermented foods normal — and an adult who maintains the habit. The gut microbiome is partially inherited and partially shaped by shared food environments. What you eat together shapes your family's collective microbial community in ways that matter well beyond the dinner table.\n\nYour scores show a family that has the right architecture in place. The Postbiotics score of 74 tells us your household has consistent enough rhythms to support gut repair. The Prebiotics score of 68 tells us you're already giving your microbiomes something to work with. The gap — your Probiotics score of 41 — is the most specific and correctable. It's not about eating less or changing everything; it's about adding the missing biological inputs to a system that's otherwise functioning well.",
  sevenDayPlan: [
    {
      day: "Monday",
      action: "Serve plain full-fat yoghurt at breakfast for the whole family",
    },
    {
      day: "Tuesday",
      action: "Add one new vegetable to dinner that the family hasn't had this month",
    },
    {
      day: "Wednesday",
      action: "Make a lentil or chickpea dish — soup, dahl, or pasta sauce with red lentils",
    },
    {
      day: "Thursday",
      action: "Replace afternoon snacks with fruit + a small handful of mixed nuts",
    },
    {
      day: "Friday",
      action: "Try a family-friendly fermented food — mild kefir, live yoghurt smoothie, or soft mould-ripened cheese",
    },
    {
      day: "Saturday",
      action: "Cook with garlic and onion as a base — these are powerful prebiotics hidden in plain sight",
    },
    {
      day: "Sunday",
      action: "Eat your main meal at the table with no screens — make it a weekly ritual",
    },
  ],
  foods: [
    {
      emoji: "🫙",
      food: "Plain Full-Fat Yoghurt",
      why: "The most family-friendly fermented food — universally accepted by children, mild in flavour, and rich in Lactobacillus and Bifidobacterium strains. Given your low Probiotics score, this is the easiest daily win for the whole family.",
      howTo:
        "Serve at breakfast or as a snack. Full-fat, live-culture yoghurt only — check the label for 'live active cultures'. Add fruit or honey for children rather than buying flavoured versions (which contain too much sugar).",
      pillars: ["Probiotics"],
      compound: "Lactobacillus + Bifidobacterium strains",
      servingsPerWeek: 7,
      shopCategory: "Fermented",
    },
    {
      emoji: "🌾",
      food: "Oats",
      why: "Oats contain beta-glucan, a powerful prebiotic fibre that feeds beneficial gut bacteria in children and adults alike. They're also one of the most practical foods to serve a family consistently.",
      howTo:
        "Overnight oats, porridge, or oat-based pancakes. The slower-cooked the better — rolled oats over instant. Top with berries and a spoonful of yoghurt for a complete prebiotic + probiotic breakfast.",
      pillars: ["Prebiotics"],
      compound: "Beta-glucan fibre",
      servingsPerWeek: 5,
      shopCategory: "Grains",
    },
    {
      emoji: "🫘",
      food: "Lentils",
      why: "Lentils are a concentrated source of fermentable fibre and resistant starch — both critical for butyrate production, which protects the gut lining. They're also one of the easiest foods to hide in family-friendly recipes.",
      howTo:
        "Add red lentils to bolognese, soups, and curries — they dissolve and are undetectable to picky eaters. Aim for 3+ servings per week across the family.",
      pillars: ["Prebiotics", "Postbiotics"],
      compound: "Resistant starch + fermentable fibre",
      servingsPerWeek: 3,
      shopCategory: "Tins & Pulses",
    },
    {
      emoji: "🧄",
      food: "Garlic",
      why: "One of the richest sources of inulin-type fructans — prebiotic fibres that specifically feed Bifidobacterium, one of the most important bacterial genera for children's gut and immune development.",
      howTo:
        "Use as a base in almost everything. Two cloves of garlic in a sauce, soup, or stir-fry is enough to deliver a meaningful prebiotic dose. Raw garlic has a stronger effect — try adding to dressings.",
      pillars: ["Prebiotics"],
      compound: "Inulin-type fructans (FOS)",
      servingsPerWeek: 7,
      shopCategory: "Produce",
    },
    {
      emoji: "🫐",
      food: "Blueberries",
      why: "Blueberries are the highest-polyphenol berry commonly eaten by children. Polyphenols act as prebiotics, selectively feeding beneficial bacteria while reducing inflammatory bacterial species.",
      howTo:
        "Fresh or frozen — frozen blueberries are nutritionally equivalent and much cheaper. Add to yoghurt, oats, or smoothies. Aim for a handful (80g) per person, 3–4 times per week.",
      pillars: ["Prebiotics"],
      compound: "Anthocyanin polyphenols",
      servingsPerWeek: 4,
      shopCategory: "Produce",
    },
  ],
  foodPairings: [
    {
      food1: "Yoghurt",
      food2: "Oats",
      emoji1: "🫙",
      emoji2: "🌾",
      reason: "Live cultures + beta-glucan — oats provide the prebiotic fuel that yoghurt bacteria thrive on. Serving them together at breakfast amplifies both benefits and is one of the most evidence-backed breakfast combinations for family gut health.",
    },
    {
      food1: "Garlic",
      food2: "Lentils",
      emoji1: "🧄",
      emoji2: "🫘",
      reason: "FOS + resistant starch — two different prebiotic fibres feeding different bacterial species. Together they support a much wider range of your family's microbiome than either food achieves individually.",
    },
  ],
  roadmap: [
    {
      week: "Week 1",
      theme: "Family Foundations",
      focus: "Introduce live yoghurt daily and expand the family breakfast",
      actions: [
        "Serve live-culture yoghurt at breakfast every day this week",
        "Replace one packaged snack per day with fruit + nuts for the whole family",
        "Use garlic and onion as the base for every cooked dinner",
        "Eat at the table together for every family dinner this week",
      ],
    },
    {
      week: "Week 2",
      theme: "The Variety Push",
      focus: "Add new plant foods and introduce legumes at family meals",
      actions: [
        "Introduce lentils or chickpeas in at least three dinners this week",
        "Try one completely new vegetable as a family",
        "Add oats to breakfast rotation — porridge, overnight oats, or oat pancakes",
        "Try a second fermented food: kefir drinks, mild kimchi for adults, or tempeh",
      ],
    },
    {
      week: "Week 3",
      theme: "Build the Habit Loop",
      focus: "Make the new foods automatic and reduce ultra-processed options",
      actions: [
        "Clear one category of ultra-processed snack from the house this week",
        "Prep a batch of legumes or grain salad on Sunday for the week ahead",
        "Add a new vegetable to the family's regular rotation",
        "Involve children in one meal preparation — even washing vegetables counts",
      ],
    },
    {
      week: "Week 4",
      theme: "Family Rhythm",
      focus: "Consolidate and measure what's changed",
      actions: [
        "Maintain all habits from weeks 1–3",
        "Count how many different plant foods the family ate this week — aim for 25+",
        "Try a new family-friendly fermented recipe together",
        "Retake the assessment and compare your family's collective score",
      ],
    },
  ],
  closing:
    "What makes family gut health work is that you're not changing individual habits in isolation — you're changing the shared food environment that shapes everyone's relationship with food. Every fermented food you introduce, every new vegetable that appears at the table, every processed snack you replace becomes a quiet norm that children absorb and carry forward. Your family's food score of 64 is a foundation, not a ceiling. The plan above is designed to move you toward 75+ in 30 days by adding to what you already do well, not by dismantling it.",
}

export default function ReportFamilyPage() {
  return (
    <div className="min-h-screen bg-background pt-16">
      <DemoReport data={FAMILY_DATA} />
    </div>
  )
}
