"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowRight, X, Target, Zap, Heart, Shield, RefreshCw } from "lucide-react"

/* ── Welcome Screen ──────────────────────────────────────────────────────
   Shown on first account visit (or until dismissed).
   Replaces the cold dashboard open with a genuinely personal welcome.
   Persisted via localStorage — once dismissed it never shows again.
────────────────────────────────────────────────────────────────────── */

const GOAL_ICONS: Record<string, React.ReactNode> = {
  digestion: <span className="text-xl">🫁</span>,
  energy:    <Zap size={18} style={{ color: "var(--icon-yellow)" }} />,
  mood:      <Heart size={18} style={{ color: "var(--icon-teal)" }} />,
  immunity:  <Shield size={18} style={{ color: "var(--icon-green)" }} />,
  recovery:  <RefreshCw size={18} style={{ color: "var(--icon-lime)" }} />,
}

const GOAL_PLANS: Record<string, { headline: string; steps: string[] }> = {
  digestion: {
    headline: "Your digestion plan starts with live foods",
    steps: [
      "Add one fermented food daily — yogurt, kefir, or sauerkraut",
      "Anchor every meal with a fibre source to feed beneficial bacteria",
      "Track how you feel after meals to spot patterns",
    ],
  },
  energy: {
    headline: "Your energy plan starts with timing",
    steps: [
      "Eat your first meal within 1 hour of waking",
      "Add a prebiotic-rich food to breakfast (oats, banana, garlic)",
      "Avoid blood sugar spikes by pairing carbs with protein or fat",
    ],
  },
  mood: {
    headline: "Your mood plan starts with serotonin foods",
    steps: [
      "Add a fermented food daily — 90% of serotonin is made in your gut",
      "Increase plant variety to 20+ species per week for microbiome richness",
      "Note how your mood shifts 2 hours after eating each day",
    ],
  },
  immunity: {
    headline: "Your immunity plan starts with diversity",
    steps: [
      "Aim for 20+ different plant species per week",
      "Add a probiotic food daily to seed beneficial gut bacteria",
      "Include omega-3 rich foods (salmon, walnuts, flaxseed) 3× per week",
    ],
  },
  recovery: {
    headline: "Your recovery plan starts with gut repair",
    steps: [
      "Prioritise anti-inflammatory foods: berries, leafy greens, olive oil",
      "Add bone broth or collagen-rich foods to support gut lining",
      "Establish consistent meal timing to reset your gut rhythm",
    ],
  },
}

const PILLAR_LABELS: Record<string, string> = {
  diversity:   "Plant Diversity",
  feeding:     "Feeding",
  adding:      "Live Foods",
  consistency: "Consistency",
  feeling:     "Feeling",
}

const PILLAR_ACTIONS: Record<string, string> = {
  diversity:   "Add one new plant species to today's meals",
  feeding:     "Anchor every meal with a fibre-rich whole food",
  adding:      "Add one fermented food to today's meals",
  consistency: "Set three fixed meal times and protect them today",
  feeling:     "Note how you feel 1 hour after each meal today",
}

interface WelcomeScreenProps {
  firstName: string
  score: number | null
  profileType: string | null
  profileColor: string
  profileTagline: string
  weakestPillar: string | null
  healthGoals: string[] | null
  onDismiss: () => void
}

export function WelcomeScreen({
  firstName,
  score,
  profileType,
  profileColor,
  profileTagline,
  weakestPillar,
  healthGoals,
  onDismiss,
}: WelcomeScreenProps) {
  const primaryGoal = healthGoals?.[0] ?? null
  const goalPlan = primaryGoal ? GOAL_PLANS[primaryGoal] : null
  const weakestLabel = weakestPillar ? PILLAR_LABELS[weakestPillar] : null
  const weakestAction = weakestPillar ? PILLAR_ACTIONS[weakestPillar] : null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center bg-foreground/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-3xl bg-background overflow-hidden shadow-2xl">
        {/* Gradient header */}
        <div
          className="relative overflow-hidden px-6 pb-8 pt-6"
          style={{ background: "linear-gradient(135deg, var(--icon-lime) 0%, var(--icon-green) 35%, var(--icon-teal) 70%, var(--icon-yellow) 100%)" }}
        >
          <div className="pointer-events-none absolute inset-0" style={{ background: "rgba(0,0,0,0.25)" }} />
          <button
            onClick={onDismiss}
            className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full transition-colors hover:bg-white/20"
            style={{ color: "rgba(255,255,255,0.6)" }}
          >
            <X size={15} />
          </button>
          <div className="relative">
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.6)" }}>
              Welcome to your account
            </p>
            <h2 className="mt-1 font-serif text-2xl font-semibold sm:text-3xl" style={{ color: "white" }}>
              {score != null
                ? `${firstName}, your score is ${score}/100`
                : `Welcome, ${firstName}`}
            </h2>
            {profileType && (
              <p className="mt-1 text-sm" style={{ color: "rgba(255,255,255,0.7)" }}>
                {profileTagline}
              </p>
            )}
          </div>
        </div>

        <div className="px-6 py-5 space-y-5">

          {/* Weakest pillar spotlight */}
          {weakestPillar && (
            <div
              className="rounded-2xl border p-4"
              style={{
                borderColor: `color-mix(in srgb, ${profileColor} 30%, transparent)`,
                background: `color-mix(in srgb, ${profileColor} 6%, transparent)`,
              }}
            >
              <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: profileColor }}>
                Your #1 focus area — {weakestLabel}
              </p>
              <p className="text-sm leading-relaxed text-foreground font-medium">
                Today&apos;s action: {weakestAction}
              </p>
            </div>
          )}

          {/* Goal plan */}
          {goalPlan && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                {primaryGoal && GOAL_ICONS[primaryGoal]}
                <p className="text-sm font-semibold text-foreground">{goalPlan.headline}</p>
              </div>
              <ul className="space-y-2">
                {goalPlan.steps.map((step, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-xs text-muted-foreground">
                    <span
                      className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[9px] font-bold text-white mt-0.5"
                      style={{ background: profileColor }}
                    >
                      {i + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* No goal set */}
          {!goalPlan && (
            <div className="rounded-2xl border border-dashed border-border p-4">
              <div className="flex items-center gap-2 mb-2">
                <Target size={15} className="text-muted-foreground" />
                <p className="text-sm font-semibold text-foreground">Set your health goal</p>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                Tell us what you&apos;re working on — digestion, energy, mood, immunity, or recovery — and we&apos;ll personalise your account around it.
              </p>
              <Link
                href="/account/goals"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground hover:underline"
              >
                Set your goal <ArrowRight size={12} />
              </Link>
            </div>
          )}

          {/* CTA */}
          <button
            onClick={onDismiss}
            className="brand-gradient w-full rounded-full py-3.5 text-sm font-semibold text-white shadow-lg shadow-icon-green/25 transition-all hover:opacity-90"
          >
            Take me to my account
          </button>

          <p className="text-center text-xs text-muted-foreground/50">
            You can always find this summary in your Overview tab
          </p>
        </div>
      </div>
    </div>
  )
}

/* ── Hook: manage first-visit state ────────────────────────────────── */

export function useFirstVisit(userId: string) {
  const key = `eatobiotics_welcomed_${userId}`
  const [show, setShow] = useState(false)

  useEffect(() => {
    const alreadySeen = localStorage.getItem(key)
    if (!alreadySeen) setShow(true)
  }, [key])

  function dismiss() {
    localStorage.setItem(key, "1")
    setShow(false)
  }

  return { show, dismiss }
}
