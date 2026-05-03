"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { ArrowRight, Star, FileText, Layers, Sparkles } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { FullReportClient } from "./full-report-client"
import type { AssessmentResult } from "@/lib/assessment-scoring"

// Demo result — "Emerging Balance" profile, overall 58
const DEMO_RESULT: AssessmentResult = {
  overall: 58,
  subScores: {
    prebiotics: 62,
    probiotics: 38,
    postbiotics: 67,
    feed: 62,
    seed: 38,
    heal: 67,
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
      score: 62,
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
      score: 67,
      strength:
        "Your food rhythm and recovery support are solid — your gut has the consistency and polyphenol-rich foods it needs to produce beneficial compounds and maintain resilience.",
      action:
        "Identify conditions that break your rhythm and pre-plan simple solutions. Add one polyphenol-rich food you don't currently eat — dark chocolate, walnuts, or extra-virgin olive oil.",
      icon: "Zap",
      color: "var(--icon-yellow)",
      gradient: "linear-gradient(135deg, var(--icon-yellow), var(--icon-orange))",
    },
  ],
  nextActions: [
    "This week: add one fermented food to at least one meal each day — live yoghurt with breakfast, miso broth with lunch, or a tablespoon of sauerkraut with dinner.",
    "This week: anchor every main meal with one fibre source. Lentils, oats, vegetables, wholegrains, or beans all count — even a small portion makes a difference.",
    "Identify conditions that break your rhythm and pre-plan simple solutions. Add one polyphenol-rich food you don't currently eat — dark chocolate, walnuts, or extra-virgin olive oil.",
  ],
  completedAt: Date.now(),
}

type DemoTier = "starter" | "full" | "premium"

const TIERS: {
  id: DemoTier
  label: string
  price: string
  color: string
  gradient: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  tagline: string
  keyFeature: string
}[] = [
  {
    id: "starter",
    label: "Starter",
    price: "€20",
    color: "var(--icon-green)",
    gradient: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))",
    icon: FileText,
    tagline: "Score, profile & first steps",
    keyFeature: "7-day daily action plan",
  },
  {
    id: "full",
    label: "Full Report",
    price: "€40",
    color: "var(--icon-teal)",
    gradient: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))",
    icon: Layers,
    tagline: "Deep-dive + 30-day plan",
    keyFeature: "Pillar-by-pillar analysis",
  },
  {
    id: "premium",
    label: "Premium",
    price: "€50",
    color: "var(--icon-orange)",
    gradient: "linear-gradient(135deg, var(--icon-yellow), var(--icon-orange))",
    icon: Sparkles,
    tagline: "Complete programme",
    keyFeature: "Recipes, calendar & 90-day tracker",
  },
]

export function DemoClient() {
  const searchParams = useSearchParams()
  const [activeTier, setActiveTier] = useState<DemoTier>(() => {
    // This runs client-side only
    return "starter"
  })

  useEffect(() => {
    const tierParam = searchParams.get("tier") as DemoTier | null
    if (tierParam && ["starter", "full", "premium"].includes(tierParam)) {
      setActiveTier(tierParam)
    }
  }, [searchParams])

  return (
    <div className="min-h-screen bg-background">
      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-border px-6 pb-12 pt-28 sm:pt-32">
        {/* Subtle background */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            background: "radial-gradient(ellipse at 50% 0%, var(--icon-teal), transparent 60%)",
          }}
        />

        <div className="relative mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--icon-yellow)]/40 bg-[var(--icon-yellow)]/8 px-3 py-1 text-xs font-semibold text-[var(--icon-yellow)]">
            <Star size={10} className="fill-[var(--icon-yellow)]" />
            Demo — Sample Report Data
          </div>

          <h1 className="mt-5 font-serif text-3xl font-semibold text-foreground sm:text-4xl">
            See Your Report Before You Buy
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-muted-foreground sm:text-base">
            Explore all three report tiers using our demo profile:{" "}
            <span className="font-semibold text-foreground">Emerging Balance</span>, score{" "}
            <span className="font-semibold text-foreground">58/100</span>. Switch tiers below to see
            exactly what you get at each level.
          </p>
        </div>

        {/* Tier selector cards */}
        <div className="mx-auto mt-8 grid max-w-2xl gap-3 sm:grid-cols-3">
          {TIERS.map((tier) => {
            const Icon = tier.icon
            const isActive = activeTier === tier.id
            return (
              <button
                key={tier.id}
                onClick={() => {
                  setActiveTier(tier.id)
                  window.history.replaceState(null, "", `/assessment/demo?tier=${tier.id}`)
                }}
                className={cn(
                  "flex flex-col items-start gap-2 rounded-2xl border-2 p-4 text-left transition-all",
                  isActive
                    ? "border-transparent shadow-md"
                    : "border-border bg-background hover:border-foreground/20"
                )}
                style={isActive ? { background: tier.gradient, borderColor: "transparent" } : undefined}
              >
                <div className="flex w-full items-center justify-between">
                  <Icon
                    size={18}
                    className={isActive ? "text-white" : "text-muted-foreground"}
                  />
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-xs font-bold",
                      isActive ? "bg-white/20 text-white" : "bg-border text-muted-foreground"
                    )}
                  >
                    {tier.price}
                  </span>
                </div>
                <div>
                  <p
                    className={cn(
                      "text-sm font-bold",
                      isActive ? "text-white" : "text-foreground"
                    )}
                  >
                    {tier.label}
                  </p>
                  <p
                    className={cn(
                      "text-xs leading-snug",
                      isActive ? "text-white/80" : "text-muted-foreground"
                    )}
                  >
                    {tier.tagline}
                  </p>
                </div>
              </button>
            )
          })}
        </div>

        {/* Take real assessment CTA */}
        <div className="mx-auto mt-6 max-w-2xl flex items-center justify-center gap-3">
          <p className="text-xs text-muted-foreground">Want your real results?</p>
          <Link
            href="/assessment"
            className="flex items-center gap-1.5 text-xs font-semibold text-[var(--icon-teal)] hover:underline"
          >
            Take the free assessment
            <ArrowRight size={12} />
          </Link>
        </div>
      </section>

      {/* ── Sticky tier switcher (compact) ────────────────────────────── */}
      <div className="sticky top-[57px] z-50 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-3xl items-center gap-4 px-6 py-2.5">
          <span className="shrink-0 text-xs font-semibold text-muted-foreground">Viewing:</span>
          <div className="flex items-center gap-2">
            {TIERS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTier(tab.id)
                  window.history.replaceState(null, "", `/assessment/demo?tier=${tab.id}`)
                }}
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
          <div className="ml-auto rounded-full border border-[var(--icon-yellow)]/40 bg-[var(--icon-yellow)]/8 px-2.5 py-1 text-[10px] font-semibold text-[var(--icon-yellow)]">
            Demo data
          </div>
        </div>
      </div>

      {/* ── Report content ────────────────────────────────────────────── */}
      <FullReportClient tier={activeTier} demoResult={DEMO_RESULT} />

      {/* ── Bottom CTA ────────────────────────────────────────────────── */}
      <section className="border-t border-border bg-secondary/10 px-6 py-20">
        <div className="mx-auto max-w-xl text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            This was demo data
          </p>
          <h2 className="mt-4 font-serif text-2xl font-semibold text-foreground sm:text-3xl">
            Ready to discover your own score?
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            The free assessment takes 5 minutes. Your personalised results — with your real score
            and profile — will be sent to your inbox instantly.
          </p>
          <div className="mt-7">
            <Link
              href="/assessment"
              className="brand-gradient inline-flex items-center gap-2 rounded-full px-8 py-3.5 text-base font-semibold text-white transition-opacity hover:opacity-90"
            >
              Begin My Free Assessment
              <ArrowRight size={18} />
            </Link>
          </div>
          <p className="mt-3 text-xs text-muted-foreground/50">
            Free · 5 minutes · No credit card required
          </p>
        </div>
      </section>
    </div>
  )
}
