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
    badge: null as string | null,
    icon: FileText,
    accentColor: "var(--icon-green)",
    accentGradient: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))",
    featured: false,
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
    badge: "Most Popular" as string | null,
    icon: Layers,
    accentColor: "var(--icon-teal)",
    accentGradient: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))",
    featured: true,
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
    badge: null as string | null,
    icon: Sparkles,
    accentColor: "var(--icon-orange)",
    accentGradient: "linear-gradient(135deg, var(--icon-yellow), var(--icon-orange))",
    featured: false,
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
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
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
          Your free score is the starting point. Choose how deep you want to go.
        </p>
      </div>

      {/* What happens next */}
      <div className="rounded-2xl border bg-card/60 px-5 py-4">
        <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
          What happens next
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-0">
          {[
            { n: "1", icon: "🫁", title: "Personal consultation", desc: "15–25 questions tailored to your score — symptoms, history, lifestyle, and goals" },
            { n: "2", icon: "🔬", title: "Report in ~2 minutes", desc: "Claude analyses your answers and generates your personalised report" },
            { n: "3", icon: "🗺️", title: "Your 90-day roadmap", desc: "A phased plan built around your specific gut profile and health goals" },
          ].map((step, i) => (
            <div key={step.n} className="flex items-start gap-3 sm:flex-1 sm:flex-col sm:items-center sm:text-center sm:px-3">
              <div className="flex items-center gap-3 sm:flex-col sm:gap-2 sm:items-center">
                <div
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white sm:h-8 sm:w-8"
                  style={{ background: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))" }}
                >
                  {step.n}
                </div>
                {i < 2 && (
                  <div className="hidden sm:block h-px w-full max-w-[60px] bg-border/60" />
                )}
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground">{step.title}</p>
                <p className="text-[11px] leading-snug text-muted-foreground mt-0.5">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tier cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {TIERS.map((tier) => {
          const Icon = tier.icon
          return (
            <div
              key={tier.id}
              className={cn(
                "relative flex flex-col rounded-2xl border bg-card overflow-hidden transition-all",
                tier.featured
                  ? "border-transparent shadow-xl ring-2 ring-[var(--icon-teal)]/40 scale-[1.02]"
                  : "border-border hover:border-foreground/20"
              )}
            >
              {/* Left accent bar */}
              <div
                className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl"
                style={{ background: tier.accentGradient }}
              />

              {/* Most Popular badge */}
              {tier.badge && (
                <div
                  className="absolute right-4 top-4 flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold text-white"
                  style={{ background: tier.accentGradient }}
                >
                  <Star size={9} className="fill-white" />
                  {tier.badge}
                </div>
              )}

              <div className="flex flex-1 flex-col p-5 pl-6">
                {/* Icon + name */}
                <div className="mb-4 flex items-center gap-2">
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-xl"
                    style={{ background: `color-mix(in srgb, ${tier.accentColor} 15%, transparent)` }}
                  >
                    <Icon size={15} style={{ color: tier.accentColor }} />
                  </div>
                  <span className="text-sm font-bold text-foreground">{tier.name}</span>
                </div>

                {/* Price */}
                <div className="mb-1 flex items-baseline gap-1.5">
                  <span className="text-5xl font-bold" style={{ color: tier.accentColor }}>
                    {tier.price}
                  </span>
                </div>
                <p className="mb-4 text-xs text-muted-foreground">one-off payment</p>

                <p className="mb-5 text-xs leading-snug text-muted-foreground">{tier.description}</p>

                {/* Features */}
                <ul className="mb-6 flex-1 space-y-2">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-xs text-foreground/80">
                      <Check
                        size={13}
                        className="mt-0.5 shrink-0"
                        style={{ color: tier.accentColor }}
                      />
                      {f}
                    </li>
                  ))}
                </ul>

                {/* CTA button */}
                <button
                  onClick={() => handlePurchase(tier.id)}
                  disabled={loading !== null}
                  className={cn(
                    "mb-2 flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60",
                    tier.featured ? "brand-gradient" : ""
                  )}
                  style={tier.featured ? undefined : { background: tier.accentGradient }}
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
        <div className="rounded-xl border border-destructive/30 bg-destructive/8 px-4 py-3 text-sm text-destructive">
          {error}
          {error.includes("not configured") && (
            <p className="mt-1 text-xs opacity-70">Add STRIPE_SECRET_KEY to .env.local to enable payments.</p>
          )}
        </div>
      )}

      <div className="space-y-2">
        <MissionNote variant="inline" />
        <p className="text-center text-xs text-muted-foreground/50">
          Instant access · No subscription · Secure payment via Stripe
        </p>
      </div>
    </div>
  )
}
