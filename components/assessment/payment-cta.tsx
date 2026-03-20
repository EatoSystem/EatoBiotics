"use client"

import { useState } from "react"
import { ArrowRight, Check, Star } from "lucide-react"
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
    features: [
      "Score ring + full profile description",
      "Your top 5 priority foods",
      "All 5 pillar scores in one view",
      "7-day daily starter action plan",
      "The 3 biotics explained: your quick reference",
      "Printable score card",
    ],
    cta: "Get Starter Report",
    gradient: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))",
    color: "var(--icon-green)",
  },
  {
    id: "full" as Tier,
    name: "Full Report",
    price: "€40",
    cents: 4000,
    description: "Deep-dive into every pillar with a 30-day plan.",
    badge: "Most Popular",
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
    gradient: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))",
    color: "var(--icon-teal)",
  },
  {
    id: "premium" as Tier,
    name: "Premium Report",
    price: "€50",
    cents: 5000,
    description: "The complete programme — including meal timing, recipes, supplements, and a 90-day tracker.",
    badge: null,
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
    gradient: "linear-gradient(135deg, var(--icon-yellow), var(--icon-orange))",
    color: "var(--icon-orange)",
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
      <div className="mb-6 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-[var(--icon-green)]/30 bg-[var(--icon-green)]/8 px-3 py-1 text-xs font-semibold text-[var(--icon-green)]">
          Choose Your Report
        </div>
        <h3 className="mt-3 font-serif text-2xl font-semibold text-foreground sm:text-3xl">
          Unlock Your Full EatoBiotics Report
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground max-w-lg mx-auto">
          Your free results show where you stand. Your report shows you exactly what to eat, what to add, and a plan to get there.
        </p>
      </div>

      {/* Tier cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {TIERS.map((tier) => (
          <div
            key={tier.id}
            className={cn(
              "relative flex flex-col rounded-2xl border-2 bg-background p-5 transition-all",
              tier.badge
                ? "border-[var(--icon-teal)] shadow-sm"
                : "border-border"
            )}
          >
            {/* Popular badge */}
            {tier.badge && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <div className="flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold text-white" style={{ background: tier.gradient }}>
                  <Star size={10} className="fill-white" />
                  {tier.badge}
                </div>
              </div>
            )}

            {/* Tier info */}
            <div className="mb-4">
              <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: tier.color }}>
                {tier.name}
              </p>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-3xl font-bold text-foreground">{tier.price}</span>
                <span className="text-xs text-muted-foreground">one-time</span>
              </div>
              <p className="mt-1.5 text-xs leading-snug text-muted-foreground">{tier.description}</p>
            </div>

            {/* Features */}
            <ul className="mb-5 flex-1 space-y-2">
              {tier.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-xs text-foreground">
                  <Check size={12} className="mt-0.5 shrink-0" style={{ color: tier.color }} />
                  {f}
                </li>
              ))}
            </ul>

            {/* CTA */}
            <button
              onClick={() => handlePurchase(tier.id)}
              disabled={loading !== null}
              className={cn(
                "flex w-full items-center justify-center gap-2 rounded-full py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed",
                tier.badge ? "brand-gradient" : ""
              )}
              style={!tier.badge ? { background: tier.gradient } : undefined}
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
          </div>
        ))}
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
