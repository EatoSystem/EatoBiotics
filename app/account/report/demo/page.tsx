import type { Metadata } from "next"
import { ReportClient } from "../[id]/report-client"
import type { WeeklyReportJson } from "@/app/api/weekly-report/generate/route"

export const metadata: Metadata = {
  title: "Sample Weekly Report — EatoBiotics",
  description: "A sample EatoBiotics weekly food system report showing biotics scores, patterns, and personalised actions.",
  robots: "noindex",
}

/* ─────────────────────────────────────────────────────────────────────────
   Full demo WeeklyReportJson — realistic Week 8 data
   ───────────────────────────────────────────────────────────────────────── */
const DEMO_REPORT: WeeklyReportJson = {
  weekStarting:        "2025-05-05",
  weekNumber:          8,
  mealCount:           9,
  averageScore:        73,
  previousWeekAverage: 68,

  pillars: { prebiotic: 71, probiotic: 23, postbiotic: 48 },

  bestMeal:    { name: "Chicken, roasted veg & kefir",    score: 81, date: "2025-05-11" },
  weakestMeal: { name: "White toast & peanut butter",     score: 34, date: "2025-05-07" },

  weekSummaryTitle: "Your Best Week for Plant Diversity",

  narrative:
    "Week 8 was your strongest week for plant variety since you started. You hit 9 different plants across your meals — asparagus, garlic, oats, mixed leaves, lentils, berries, broccoli, kimchi, and walnuts — and your prebiotic score reflects that directly at 71. " +
    "Your probiotic score of 23 is still the area with the most room to grow. You included a live fermented food on only 2 of 7 days, which limits how much your beneficial bacteria can multiply and colonise. The good news: adding kefir or live yoghurt to just 4 days next week would move your probiotic score into the mid-30s. " +
    "Your postbiotic score of 48 is solid — the short-chain fatty acids your bacteria are producing are a direct result of your prebiotic consistency. Keep feeding them and the postbiotic number will follow.",

  pullQuote:
    "Your food system showed real momentum this week. Plant diversity was your strongest area — 9 different plants, your best showing in a month.",

  patterns: [
    "Strong mid-week meals (Mon–Thu averaged 79) followed by a dip at the weekend — Saturday scored 41.",
    "Fermented foods appeared on only 2 out of 7 days, holding your probiotic score below its potential.",
    "Prebiotic consistency is your current competitive advantage — oats and garlic appearing multiple times is driving your gut bacteria diversity.",
  ],

  pillarInsights: {
    prebiotic:  "Your prebiotic score of 71 is your strongest pillar. Oats (Monday, Wednesday), garlic (Tuesday, Thursday), and asparagus (Sunday) are your core prebiotic drivers. Consistency here is what's building your microbiome diversity over time.",
    probiotic:  "23 is below where your food pattern should take you. You had kimchi on Sunday and kefir on Thursday — two strong choices — but 5 days without a live food source limits colonisation. Target 4 days with live fermented food next week.",
    postbiotic: "48 is a healthy postbiotic score and reflects good short-chain fatty acid production from your prebiotic intake. As you push probiotic frequency higher, this number will naturally follow — the bacteria need to be there to produce the postbiotics.",
  },

  focusAction:  "Add a fermented food to 4 out of 7 dinners this week — kefir, kimchi, live yoghurt, or sauerkraut all count. Pick one and make it the default.",
  stretchGoal:  "Hit 10 different plant varieties across the week. You managed 9 this week — one more is very achievable with a handful of seeds on your yoghurt or a new vegetable at one meal.",

  mealsThisWeek: [
    { id: "d1", name: "Porridge with berries & walnuts",       type: "Breakfast", score: 74, date: "2025-05-05" },
    { id: "d2", name: "Lentil soup with sourdough",            type: "Lunch",     score: 69, date: "2025-05-06" },
    { id: "d3", name: "Salmon, asparagus & roasted garlic",    type: "Dinner",    score: 78, date: "2025-05-07" },
    { id: "d4", name: "White toast & peanut butter",           type: "Breakfast", score: 34, date: "2025-05-07" },
    { id: "d5", name: "Chicken stir-fry with broccoli",        type: "Dinner",    score: 72, date: "2025-05-08" },
    { id: "d6", name: "Greek yoghurt, oats & mixed berries",   type: "Breakfast", score: 77, date: "2025-05-09" },
    { id: "d7", name: "Mackerel on rye with mixed leaves",     type: "Lunch",     score: 76, date: "2025-05-10" },
    { id: "d8", name: "Pasta, garlic & roasted veg",           type: "Dinner",    score: 70, date: "2025-05-10" },
    { id: "d9", name: "Chicken, roasted veg & kefir",          type: "Dinner",    score: 81, date: "2025-05-11" },
  ],
}

/* ─────────────────────────────────────────────────────────────────────────
   Page — no auth required (static demo, not a real DB report)
   ───────────────────────────────────────────────────────────────────────── */
export default function DemoReportPage() {
  return (
    <div className="min-h-screen bg-background pt-[57px]">
      <ReportClient
        reportId="demo"
        weekStarting="2025-05-05"
        content=""
        reportJson={DEMO_REPORT}
        memberName="Jason"
        demoMode={true}
      />
    </div>
  )
}
