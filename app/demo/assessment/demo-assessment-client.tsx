"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { AssessmentResults } from "@/components/assessment/assessment-results"
import type { AssessmentResult } from "@/lib/assessment-scoring"

// Same demo data as /assessment/demo — Emerging Balance, 58/100
const DEMO_RESULT: AssessmentResult = {
  overall: 62,
  subScores: {
    diversity: 55,
    feeding: 68,
    adding: 38,
    consistency: 72,
    feeling: 58,
  },
  profile: {
    type: "Emerging Balance",
    tagline: "The building blocks are there. Consistency is the next step.",
    description:
      "You have awareness and some strong habits, but they haven't fully integrated into a reliable daily pattern yet. Your gut system responds to consistency — even small, repeatable improvements compound quickly. You're closer to a strong foundation than you might think.",
    color: "var(--icon-lime)",
  },
  insights: [
    {
      pillar: "adding",
      label: "Adding",
      score: 38,
      opportunity:
        "Fermented and live-culture foods are among the most direct ways to introduce beneficial bacteria into your gut ecosystem. Even one daily serving makes a measurable difference over time.",
      action:
        "This week: add one fermented food to at least one meal each day — natural yoghurt with breakfast, miso broth with lunch, or a tablespoon of sauerkraut with dinner.",
      icon: "FlaskConical",
      color: "var(--icon-teal)",
      gradient: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))",
    },
    {
      pillar: "diversity",
      label: "Diversity",
      score: 55,
      opportunity:
        "Different plants feed different bacterial species. Expanding beyond your current plant range, even by adding 2–3 new foods per week, meaningfully increases microbial richness.",
      action:
        "This week: introduce one unfamiliar plant food each day — a new bean, a different leafy green, or a vegetable you haven't eaten recently.",
      icon: "Leaf",
      color: "var(--icon-lime)",
      gradient: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))",
    },
    {
      pillar: "feeling",
      label: "Feeling",
      score: 58,
      opportunity:
        "How you feel after eating — energy, digestion, and mental clarity — is one of the most direct windows into your gut health.",
      action:
        "This week: note how you feel one hour after each meal for three days — just one word.",
      icon: "Heart",
      color: "var(--icon-orange)",
      gradient: "linear-gradient(135deg, var(--icon-yellow), var(--icon-orange))",
    },
    {
      pillar: "feeding",
      label: "Feeding",
      score: 68,
      strength:
        "You're consistently feeding your gut bacteria the fibre-rich whole foods they need — the raw material your microbiome converts into short-chain fatty acids.",
      action:
        "Diversify your fibre sources. Add resistant starch (cooled potato, green banana) or new legumes to hit different microbial populations.",
      icon: "Wheat",
      color: "var(--icon-green)",
      gradient: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))",
    },
    {
      pillar: "consistency",
      label: "Consistency",
      score: 72,
      strength:
        "Your eating rhythm is one of your biggest assets. Consistent meal timing allows your microbiome to anticipate and prepare — improving digestion and nutrient absorption.",
      action:
        "Identify the conditions that break your rhythm (travel, late meetings, social eating) and pre-plan one simple solution for each scenario.",
      icon: "Clock",
      color: "var(--icon-yellow)",
      gradient: "linear-gradient(135deg, var(--icon-yellow), var(--icon-orange))",
    },
  ],
  nextActions: [
    "This week: add one fermented food to at least one meal each day — natural yoghurt with breakfast, miso broth with lunch, or a tablespoon of sauerkraut with dinner.",
    "This week: introduce one unfamiliar plant food each day — a new bean, a different leafy green, or a vegetable you haven't eaten recently.",
    "This week: note how you feel one hour after each meal for three days — just one word.",
  ],
  completedAt: Date.now(),
}

export function DemoAssessmentClient() {
  return (
    <>
      {/* Demo banner */}
      <div className="sticky top-[57px] z-50 border-b border-[var(--icon-yellow)]/20 bg-[var(--icon-yellow)]/8 px-4 py-2.5">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4">
          <p className="text-xs font-semibold text-[var(--icon-yellow)]">
            ⚡ Demo results — these are sample data, not your real score
          </p>
          <Link
            href="/assessment"
            className="flex shrink-0 items-center gap-1 text-xs font-semibold text-[var(--icon-green)] hover:underline"
          >
            Take the real assessment
            <ArrowRight size={11} />
          </Link>
        </div>
      </div>

      {/* Full real results component — no lead email so SaveResultsCard is hidden */}
      <AssessmentResults
        result={DEMO_RESULT}
        onRetake={() => { window.location.href = "/assessment" }}
      />
    </>
  )
}
