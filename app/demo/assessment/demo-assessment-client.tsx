"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { AssessmentResults } from "@/components/assessment/assessment-results"
import type { AssessmentResult } from "@/lib/assessment-scoring"

// Demo data — "Emerging Balance" profile, overall 62
const DEMO_RESULT: AssessmentResult = {
  overall: 62,
  subScores: {
    prebiotics: 66,
    probiotics: 38,
    postbiotics: 72,
    feed: 66,
    seed: 38,
    heal: 72,
  },
  profile: {
    type: "Emerging Balance",
    tagline: "The building blocks are there. Consistency is the next step.",
    description:
      "You have awareness and some strong habits, but they haven't fully integrated into a reliable daily rhythm yet. Your gut system responds to consistency — even small, repeatable improvements in your Prebiotics, Probiotics, or Postbiotics scores compound quickly from here.",
    color: "var(--icon-lime)",
  },
  insights: [
    {
      pillar: "probiotics",
      label: "Probiotics",
      score: 38,
      opportunity:
        "Fermented and live foods are the most direct way to introduce new bacteria to your gut. Even one serving a day — yoghurt, miso, or a tablespoon of sauerkraut — makes a measurable difference within weeks.",
      action:
        "This week: add one fermented food to at least one meal each day — live yoghurt with breakfast, miso broth with lunch, or a tablespoon of sauerkraut with dinner.",
      icon: "Droplets",
      color: "var(--icon-teal)",
      gradient: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))",
    },
    {
      pillar: "prebiotics",
      label: "Prebiotics",
      score: 66,
      opportunity:
        "Your gut bacteria are hungry for more plant variety and fibre. A simple anchor at each meal — legumes, wholegrains, or vegetables — creates the consistent fuel your microbiome needs to do its best work.",
      action:
        "This week: anchor every main meal with one fibre source. Lentils, oats, vegetables, wholegrains, or beans all count — even a small portion makes a difference.",
      icon: "Leaf",
      color: "var(--icon-lime)",
      gradient: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))",
    },
    {
      pillar: "postbiotics",
      label: "Postbiotics",
      score: 72,
      strength:
        "Your food rhythm and recovery support are solid — your gut has the consistency and polyphenol-rich foods it needs to produce beneficial compounds and maintain resilience.",
      action:
        "Identify conditions that break your rhythm and pre-plan simple solutions. Add one polyphenol-rich food — dark chocolate, walnuts, or extra-virgin olive oil.",
      icon: "Zap",
      color: "var(--icon-yellow)",
      gradient: "linear-gradient(135deg, var(--icon-yellow), var(--icon-orange))",
    },
  ],
  nextActions: [
    "This week: add one fermented food to at least one meal each day — live yoghurt with breakfast, miso broth with lunch, or a tablespoon of sauerkraut with dinner.",
    "This week: anchor every main meal with one fibre source. Lentils, oats, vegetables, wholegrains, or beans all count — even a small portion makes a difference.",
    "Identify conditions that break your rhythm and pre-plan simple solutions. Add one polyphenol-rich food — dark chocolate, walnuts, or extra-virgin olive oil.",
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
