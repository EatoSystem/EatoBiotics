"use client"

import { useState } from "react"
import { ArrowRight, Check, Star, FileText, Layers, Sparkles } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { MissionNote } from "./mission-note"
import type { AssessmentResult } from "@/lib/assessment-scoring"

interface PaymentCTAProps {
  result: AssessmentResult
}

type Tier = "starter" | "full" | "premium"

const TIERS = [
  {
    id: "starter" as Tier,
    name: "Starter Insights",
    price: "€20",
    cents: 2000,
    description: "Your score, profile, and the first steps to take.",
    badge: null,
    icon: FileText,
    bannerGradient: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))",
    color: "var(--icon-green)",
    highlights: [
      { emoji: "🎯", text: "Your full profile description" },
      { emoji: "🥦", text: "Top 5 priority foods for your score" },
      { emoji: "📅", text: "7-day daily starter action plan" },
    ],
    features: [
      "Score ring + full profile description",
      "Your top 5 priority foods",
      "All 5 pillar scores in one view",
      "7-day daily starter action plan",
      "The 3 biotics explained: your quick reference",
      "Printable score card",
    ],
    cta: "Get Starter Report",
  },
  {
    id: "full" as Tier,
    name: "Full Report",
    price: "€40",
    cents: 4000,
    description: "Deep-dive into every pillar with a 30-day plan.",
    badge: "Most Popular",
    icon: Layers,
    bannerGradient: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))",
    color: "var(--icon-teal)",
    highlights: [
      { emoji: "🔬", text: "Pillar-by-pillar deep-dives" },
      { emoji: "🗓️", text: "30-day rebuilding plan (4 weeks)" },
      { emoji: "🔄", text: "5 easy food swaps for your weakest pillar" },
    ],
    features: [
      "Everything in Starter",
      "Pillar-by-pillar deep-dives",
      "6 food recommendations per pillar",
      "Your top 12 foods ranked by impact",
      "5 easy food swaps for your weakest pillar",
      "30-day rebuilding plan (4 weeks)",
      "Gut health habit tracker (print-ready)",
      "Your personalised retest date",
    ],
    cta: "Get Full Report",
  },
  {
    id: "premium" as Tier,
    name: "Premium Report",
    price: "€50",
    cents: 5000,
    description: "The complete programme — recipes, supplements, and a 90-day tracker.",
    badge: null,
    icon: Sparkles,
    bannerGradient: "linear-gradient(135deg, var(--icon-yellow), var(--icon-orange))",
    color: "var(--icon-orange)",
    highlights: [
      { emoji: "🍽️", text: "Meal timing guide + 3 recipes" },
      { emoji: "📆", text: "90-day milestone tracker" },
      { emoji: "🧠", text: "Gut-brain connection insights" },
    ],
    features: [
      "Everything in Full Report",
      "Personalised meal timing guide",
      "Seasonal food guide (spring foods now)",
      "Weekly shopping list (30 items)",
      "Biotic supplement considerations",
      "Gut-brain connection: what your scores reveal",
      "12-month seasonal food calendar",
      "90-day milestone tracker",
      "3 Biotic Kitchen starter recipes",
    ],
    cta: "Get Premium Report",
  },
]

export function PaymentCTA({ result }: PaymentCTAProps) {
  const [loading, setLoading] = useState<Tier | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handlePurchase(tier: Tier) {
    setLoading(tier)
    setError(null)

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tier,
          overall: result.overall,
          profile: result.profile.type,
          subScores: result.subScores,
        }),
      })

      const data = await res.json()

      if (!res.ok || !data.url) {
        setError(data.error ?? "Could not start checkout. Please try again.")
        return
      }

      window.location.href = data.url
    } catch {
      setError("Network error. Please check your connection and try again.")
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="rounded-3xl border border-border bg-gradient-to-br from-secondary/40 to-background p-6 sm:p-8">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-[var(--icon-green)]/30 bg-[var(--icon-green)]/8 px-3 py-1 text-xs font-semibold text-[var(--icon-green)]">
          Choose Your Report
        </div>
        <h3 className="mt-3 font-serif text-2xl font-semibold text-foreground sm:text-3xl">
          Your{" "}
          <span style={{ color: result.profile.color }}>{result.profile.type}</span>{" "}
          score of{" "}
          <span style={{ color: result.profile.color }}>{result.overall}/100</span>{" "}
          unlocks a personalised plan
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground max-w-lg mx-auto">
          Your free results show where you stand. Your report shows you exactly what to eat,
          what to add, and a plan to get there.
        </p>
      </div>

      {/* Tier cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {TIERS.map((tier) => {
          const Icon = tier.icon
          return (
            <div
              key={tier.id}
              className={cn(
                "relative flex flex-col rounded-2xl border-2 bg-background overflow-hidden transition-all",
                tier.badge
                  ? "border-[var(--icon-teal)] shadow-lg shadow-[var(--icon-teal)]/10"
                  : "border-border hover:border-foreground/20"
              )}
            >
              {/* Gradient top banner */}
              <div
                className="flex items-center justify-between px-5 py-4"
                style={{ background: tier.bannerGradient }}
              >
                <div className="flex items-center gap-2">
                  <Icon size={18} className="text-white" />
                  <span className="text-sm font-bold text-white">{tier.name}</span>
                </div>
                {tier.badge && (
                  <div className="flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-1 text-[10px] font-bold text-white">
                    <Star size={9} className="fill-white" />
                    {tier.badge}
                  </div>
                )}
              </div>

              {/* Card content */}
              <div className="flex flex-1 flex-col p-5">
                {/* Price */}
                <div className="mb-4 flex items-baseline gap-1.5">
                  <span className="text-4xl font-bold text-foreground">{tier.price}</span>
                  <span className="text-xs text-muted-foreground">one-time</span>
                </div>

                <p className="mb-4 text-xs leading-snug text-muted-foreground">{tier.description}</p>

                {/* Visual highlights */}
                <div className="mb-4 space-y-2 rounded-xl bg-secondary/30 p-3">
                  {tier.highlights.map((h, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs font-medium text-foreground">
                      <span className="text-base">{h.emoji}</span>
                      {h.text}
                    </div>
                  ))}
                </div>

                {/* Full features */}
                <ul className="mb-5 flex-1 space-y-1.5">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-xs text-foreground/80">
                      <Check size={11} className="mt-0.5 shrink-0" style={{ color: tier.color }} />
                      {f}
                    </li>
                  ))}
                </ul>

                {/* CTA button */}
                <button
                  onClick={() => handlePurchase(tier.id)}
                  disabled={loading !== null}
                  className="mb-2 flex w-full items-center justify-center gap-2 rounded-full py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                  style={{ background: tier.bannerGradient }}
                >
                  {loading === tier.id ? (
                    <span className="flex items-center gap-2">
                      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Redirecting…
                    </span>
                  ) : (
                    <>
                      {tier.cta}
                      <ArrowRight size={14} />
                    </>
                  )}
                </button>

                {/* Preview link */}
                <Link
                  href={`/assessment/demo?tier=${tier.id}`}
                  className="text-center text-[11px] text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                >
                  Preview this tier →
                </Link>
              </div>
            </div>
          )
        })}
      </div>

      {error && (
        <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/8 px-4 py-3 text-sm text-destructive">
          {error}
          {error.includes("not configured") && (
            <p className="mt-1 text-xs opacity-70">Add STRIPE_SECRET_KEY to .env.local to enable payments.</p>
          )}
        </div>
      )}

      <div className="mt-5 space-y-2">
        <MissionNote variant="inline" />
        <p className="text-center text-xs text-muted-foreground/50">
          Instant access · No subscription · Secure payment via Stripe
        </p>
      </div>
    </div>
  )
}
