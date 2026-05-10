import type { Metadata } from "next"
import { DemoReport, type DemoReportData } from "@/components/report/demo-report"

export const metadata: Metadata = {
  title: "Sample Report — The Food System Inside You | EatoBiotics",
  description:
    "See a full sample EatoBiotics personal gut health report — your Prebiotics · Probiotics · Postbiotics scores, key insights, 7-day plan, 5 foods, and a 30-day roadmap.",
}

const YOU_DATA: DemoReportData = {
  theme: {
    accent: "var(--icon-green)",
    gradient: "linear-gradient(90deg, var(--icon-lime), var(--icon-green))",
    label: "YOUR REPORT — SAMPLE",
    title: "The Food System Inside You",
  },
  heroImage: "/images/hero-gut.png",
  score: 68,
  profile: "Emerging Balance",
  tagline:
    "Your gut system is developing real momentum — you have genuine strengths to build on and clear levers to pull.",
  opening:
    "Your food system is further along than most. A score of 68 places you in the top third of people who take this assessment, and your Prebiotics and Postbiotics scores are particularly strong. The opportunity ahead is focused and specific: your Probiotics score is the single biggest gap, and closing it will lift everything else.",
  scoreInterpretation:
    "A score of 68 reflects a gut system that functions reasonably well day-to-day but is operating below its potential. You eat a good variety of plant foods (Prebiotics: 72) and your body shows signs of recovery and rhythm (Postbiotics: 78), but your intake of fermented and probiotic-rich foods is noticeably low (Probiotics: 45). This creates a one-sided system — you're feeding the microbiome but not actively seeding it with the bacterial diversity it needs to thrive. The good news is that Probiotics is the most responsive pillar to targeted dietary change. Small, consistent additions can produce measurable shifts within 2–4 weeks.",
  pillarScores: [
    {
      name: "Prebiotics",
      score: 72,
      color: "var(--icon-green)",
      description:
        "Your plant diversity and fibre intake are solid. You're regularly including a good range of vegetables, legumes, and whole grains — this is the foundation your microbiome feeds on.",
    },
    {
      name: "Probiotics",
      score: 45,
      color: "var(--icon-orange)",
      description:
        "Your intake of fermented and probiotic-rich foods is your biggest gap. You rarely consume foods like kefir, yoghurt, kimchi, or miso — the living foods that actively introduce bacterial diversity.",
    },
    {
      name: "Postbiotics",
      score: 78,
      color: "var(--icon-teal)",
      description:
        "Your gut shows good recovery patterns. Your meal timing is relatively consistent, and you're not reporting significant digestive discomfort — signs that your gut lining and rhythm are in reasonable shape.",
    },
  ],
  dailyImpact: [
    {
      icon: "⚡",
      title: "Energy levels",
      body: "Your mid-afternoon energy dip is directly linked to your Probiotics gap. A low-diversity microbiome produces less butyrate — the short-chain fatty acid that stabilises blood sugar and sustains energy between meals.",
    },
    {
      icon: "🫁",
      title: "Digestive comfort",
      body: "Occasional bloating or sluggish digestion after meals is a common signal of an under-seeded gut. Adding fermented foods reduces this noticeably within 2–3 weeks for most people.",
    },
    {
      icon: "😴",
      title: "Sleep quality",
      body: "Your gut produces 90% of your body's serotonin — the precursor to melatonin. A stronger Probiotics score means better serotonin production, better melatonin, and deeper sleep.",
    },
  ],
  scoreProjection: {
    projected: 83,
    timeline: "30 days",
    note: "This projection is based on your current pattern. Scores are recalculated from your actual assessment answers — this is an estimate based on typical improvement rates for your profile type.",
    drivers: ["Daily fermented food habit", "Prebiotic vegetable at every meal", "Consistent meal timing"],
  },
  pullQuote:
    "Your gut system is more responsive to change than most people realise. The right inputs, consistently applied, produce results that are both measurable and felt.",
  strengths: [
    {
      title: "Strong plant variety",
      explanation:
        "You consistently eat a wide range of plant foods across the week. Diversity is the single most important driver of a healthy microbiome, and you're already doing this well.",
    },
    {
      title: "Consistent meal timing",
      explanation:
        "Your meals follow a relatively predictable daily rhythm. This supports your gut's circadian biology and reduces the inflammatory stress caused by irregular eating patterns.",
    },
    {
      title: "Fibre awareness",
      explanation:
        "You're already eating fibre-rich foods as a regular part of your diet. This feeds the beneficial bacteria in your colon and supports the production of short-chain fatty acids — key for gut lining health.",
    },
  ],
  opportunities: [
    {
      title: "Fermented food frequency",
      explanation:
        "You rarely or never include fermented foods in your diet. This is the most direct way to introduce beneficial bacteria — even one serving of kefir, kimchi, or live yoghurt daily can shift your Probiotics score significantly.",
    },
    {
      title: "Probiotic variety",
      explanation:
        "When you do eat fermented foods, you tend to rely on one type. Different fermented foods contain different bacterial strains — variety here matters as much as consistency.",
    },
    {
      title: "Post-meal rest habits",
      explanation:
        "Your answers suggest you often move quickly after eating or eat in high-stress situations. The gut needs a brief period of parasympathetic activity after meals to optimise digestion and absorption.",
    },
  ],
  keyInsight: {
    trigger:
      "Your plant diversity is a genuine foundation — fermented foods are your single biggest lever.",
    explanation:
      "Most people with a Probiotics score below 50 also score low on Prebiotics, which makes the fix harder and slower. You don't have that problem. You already eat the plant foods that create the environment for beneficial bacteria to thrive — you just need to start introducing them. The effect of adding fermented foods to an already fibre-rich diet is amplified compared to someone starting from zero. You're in a particularly strong position to see rapid improvement.",
  },
  deepInsight:
    "What your scores reveal is a food system that's doing the right things structurally but missing a key biological input. Think of your gut like a garden: you're watering regularly and the soil is in good condition (Prebiotics + Postbiotics), but you haven't been planting seeds (Probiotics). The structure is there — the flora just needs to be populated.\n\nThis pattern is more common than you might think, especially in people who eat healthily but have grown up in cultures or households where fermented foods aren't a staple. It's not a sign of poor habits overall — it's a specific blind spot. The encouraging truth is that this is the easiest gap to close. Unlike fibre intake or meal timing (which require sustained habit change), fermented foods can be added as a simple daily addition to what you already eat.",
  sevenDayPlan: [
    {
      day: "Monday",
      action: "Add 150ml of plain kefir or live-culture yoghurt to your breakfast",
    },
    {
      day: "Tuesday",
      action: "Include a prebiotic vegetable at lunch — garlic, onion, leek, or asparagus",
    },
    {
      day: "Wednesday",
      action: "Try a tablespoon of kimchi or sauerkraut alongside your evening meal",
    },
    {
      day: "Thursday",
      action: "Eat a mixed legume dish — lentil soup, chickpea salad, or similar",
    },
    {
      day: "Friday",
      action: "Replace one processed snack with a handful of mixed nuts and seeds",
    },
    {
      day: "Saturday",
      action: "Cook a meal using miso paste — miso soup, miso-glazed salmon, or a miso dressing",
    },
    {
      day: "Sunday",
      action: "Sit down for your meals without screens. Give your gut 10 quiet minutes to digest",
    },
  ],
  foods: [
    {
      emoji: "🥛",
      food: "Kefir",
      why: "Kefir contains 30–50 strains of beneficial bacteria and yeasts — far more than standard probiotic supplements. Given your low Probiotics score, this is your highest-impact starting food.",
      howTo:
        "Drink 150–200ml plain (unsweetened) kefir at breakfast or as a mid-morning snack. Goat's milk kefir is gentler if you're new to it.",
      pillars: ["Probiotics"],
      compound: "30–50 bacterial strains + yeasts",
      servingsPerWeek: 7,
      shopCategory: "Fermented",
    },
    {
      emoji: "🫙",
      food: "Sauerkraut",
      why: "Live sauerkraut (unpasteurised, from the fridge) is one of the richest sources of Lactobacillus strains. It also supports stomach acid production, which complements your Postbiotics score.",
      howTo:
        "Start with 1 tablespoon alongside meals, 3–4 times a week. Look for refrigerated, unpasteurised sauerkraut — the jarred shelf-stable versions are heat-treated and contain no live cultures.",
      pillars: ["Probiotics", "Prebiotics"],
      compound: "Lactobacillus plantarum",
      servingsPerWeek: 4,
      shopCategory: "Fermented",
    },
    {
      emoji: "🌱",
      food: "Jerusalem Artichoke",
      why: "One of the highest-inulin vegetables available. Inulin is a prebiotic fibre that specifically feeds Bifidobacterium — the bacteria most strongly associated with gut health and mood support.",
      howTo:
        "Roast or steam and add to salads or grain bowls. Start with a small portion (50g) as inulin can cause bloating until your gut adapts — increase gradually over 2–3 weeks.",
      pillars: ["Prebiotics"],
      compound: "Inulin (high-FOS)",
      servingsPerWeek: 3,
      shopCategory: "Produce",
    },
    {
      emoji: "🫘",
      food: "Chickpeas",
      why: "A versatile prebiotic powerhouse. Chickpeas contain resistant starch and fermentable fibre that feed the butyrate-producing bacteria your gut lining depends on.",
      howTo:
        "Use in salads, curries, or roast them for a snack. Canned chickpeas are fine — rinse well. Aim for 3–4 servings per week.",
      pillars: ["Prebiotics", "Postbiotics"],
      compound: "Resistant starch + fermentable fibre",
      servingsPerWeek: 4,
      shopCategory: "Tins & Pulses",
    },
    {
      emoji: "🍜",
      food: "Miso",
      why: "Miso is a fermented soybean paste containing beneficial Aspergillus oryzae and lactic acid bacteria. It also provides glutamate, which supports the gut lining.",
      howTo:
        "Dissolve a teaspoon in warm (not boiling) water for a quick miso broth, or use as a marinade or dressing base. Don't boil it — heat destroys the live cultures.",
      pillars: ["Probiotics", "Postbiotics"],
      compound: "Aspergillus oryzae + lactic acid bacteria",
      servingsPerWeek: 5,
      shopCategory: "Pantry",
    },
  ],
  foodPairings: [
    {
      food1: "Kefir",
      food2: "Jerusalem Artichoke",
      emoji1: "🥛",
      emoji2: "🌱",
      reason: "Probiotic + prebiotic — a clinical synbiotic pairing. The bacteria in kefir feed on the inulin in artichoke, multiplying and diversifying your microbiome far beyond what either food achieves alone.",
    },
    {
      food1: "Chickpeas",
      food2: "Sauerkraut",
      emoji1: "🫘",
      emoji2: "🫙",
      reason: "Resistant starch + live cultures — chickpeas provide the fermentable fuel; sauerkraut supplies the bacteria to ferment it. Together they maximise butyrate production for gut lining repair.",
    },
  ],
  roadmap: [
    {
      week: "Week 1",
      theme: "Probiotic Foundation",
      focus: "Introduce your first two fermented foods consistently",
      actions: [
        "Add kefir or live yoghurt to breakfast every day",
        "Include sauerkraut or kimchi alongside one meal per day",
        "Eat a prebiotic vegetable (garlic, onion, leek, asparagus) every day",
        "Log how you feel — energy, digestion, mood — in a simple note",
      ],
    },
    {
      week: "Week 2",
      theme: "Deepen the Variety",
      focus: "Add more fermented food types and expand your prebiotic range",
      actions: [
        "Try a new fermented food you haven't eaten before (tempeh, miso, kombucha)",
        "Increase your legume intake to 4+ servings this week",
        "Add Jerusalem artichoke or chicory root to two meals",
        "Start sitting down for meals without screens at least once a day",
      ],
    },
    {
      week: "Week 3",
      theme: "Build the Rhythm",
      focus: "Establish consistent daily habits and support your Postbiotics pillar",
      actions: [
        "Set a consistent daily eating window — try 8am–7pm",
        "Add a 10-minute walk after your largest meal every day",
        "Eat fermented foods at breakfast and dinner to cover the full day",
        "Reduce ultra-processed foods to fewer than 3 servings this week",
      ],
    },
    {
      week: "Week 4",
      theme: "Optimise & Reflect",
      focus: "Consolidate the changes and prepare to retest",
      actions: [
        "Maintain all habits from weeks 1–3",
        "Add one entirely new plant food you've never eaten before",
        "Review your notes from week 1 — track any changes in energy or digestion",
        "Take the EatoBiotics assessment again to see how your score has shifted",
      ],
    },
  ],
  closing:
    "Your starting point is genuinely strong. A score of 68 with high Prebiotics and Postbiotics scores means you're not starting from scratch — you're filling a specific gap in an otherwise functional system. The 30-day roadmap above is designed to close that gap methodically, without overhauling everything you're already doing well. Focus on the Probiotics pillar first. Your gut will respond faster than you expect.",
}

export default function ReportYouPage() {
  return (
    <div className="min-h-screen bg-background pt-16">
      <DemoReport data={YOU_DATA} />
    </div>
  )
}
