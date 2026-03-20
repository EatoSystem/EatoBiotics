"use client"

import { useState } from "react"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { FullReportClient } from "./full-report-client"
import type { AssessmentResult } from "@/lib/assessment-scoring"

// Demo result — "Emerging Balance" profile, overall 58
const DEMO_RESULT: AssessmentResult = {
  overall: 58,
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

type DemoTier = "starter" | "full" | "premium"

const TABS: { id: DemoTier; label: string; price: string; color: string }[] = [
  { id: "starter", label: "Starter", price: "€20", color: "var(--icon-green)" },
  { id: "full", label: "Full Report", price: "€40", color: "var(--icon-teal)" },
  { id: "premium", label: "Premium", price: "€50", color: "var(--icon-orange)" },
]

export function DemoClient() {
  const [activeTier, setActiveTier] = useState<DemoTier>("starter")

  return (
    <div className="min-h-screen bg-background">
      {/* ── Demo banner ───────────────────────────────────────────────── */}
      <div className="sticky top-[57px] z-50 border-b border-border bg-background/95 backdrop-blur-sm">
        {/* Back link */}
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-6 py-3">
          <Link
            href="/assessment"
            className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft size={13} />
            Back to Assessment
          </Link>
          <div className="rounded-full border border-[var(--icon-yellow)]/40 bg-[var(--icon-yellow)]/8 px-3 py-1 text-xs font-semibold text-[var(--icon-yellow)]">
            Demo — Sample Data
          </div>
        </div>

        {/* Tier tabs */}
        <div className="mx-auto max-w-3xl px-6 pb-3">
          <div className="flex items-center gap-2">
            <p className="shrink-0 text-xs font-semibold text-muted-foreground mr-2">Report tier:</p>
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTier(tab.id)}
                className={cn(
                  "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all",
                  activeTier === tab.id
                    ? "border-transparent text-white"
                    : "border-border text-muted-foreground hover:border-foreground/20 hover:text-foreground"
                )}
                style={activeTier === tab.id ? { background: tab.color } : undefined}
              >
                {tab.label}
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                    activeTier === tab.id ? "bg-white/20 text-white" : "bg-border text-muted-foreground"
                  )}
                >
                  {tab.price}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Report content ────────────────────────────────────────────── */}
      <FullReportClient tier={activeTier} demoResult={DEMO_RESULT} />
    </div>
  )
}
