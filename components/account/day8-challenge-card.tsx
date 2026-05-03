"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowRight, X, Flame } from "lucide-react"

/* ── Day 8 Challenge Card ────────────────────────────────────────────────
   Shown on the Overview tab after the 7-day guide has ended.
   Re-engages free users with a 30-day challenge offer and upgrade prompt.
   Dismissable — persisted via localStorage.
────────────────────────────────────────────────────────────────────── */

const PILLAR_CHALLENGES: Record<string, {
  label: string
  challenge: string
  description: string
  week2: string
  week3: string
  week4: string
}> = {
  adding: {
    label: "Live Foods",
    challenge: "30-Day Fermented Foods Challenge",
    description: "You added fermented foods daily for 7 days. Now compound it. 30 days of consistent probiotic intake is enough to measurably shift your microbiome diversity.",
    week2: "Rotate your fermented sources — don't rely on just one",
    week3: "Pair each ferment with a prebiotic food",
    week4: "Try a new fermented food you've never had before",
  },
  diversity: {
    label: "Plant Diversity",
    challenge: "30-Day 20-Plant Challenge",
    description: "You started counting plants. Now aim for 20 different species every week for 30 days — the threshold where gut microbiome diversity begins to measurably improve.",
    week2: "Aim for 15 different plant species this week",
    week3: "Try one cuisine you've never cooked before",
    week4: "Hit 20 species in a single week — your baseline shifts here",
  },
  feeding: {
    label: "Feeding",
    challenge: "30-Day Fibre Foundation Challenge",
    description: "You anchored meals with fibre for 7 days. Sustaining this for 30 days is where Bifidobacterium populations begin to establish — and your digestion notices.",
    week2: "Add a second fibre source to your main meal every day",
    week3: "Include a legume at least 4 times this week",
    week4: "Check: have you had a fibre-rich food at every main meal?",
  },
  consistency: {
    label: "Consistency",
    challenge: "30-Day Eating Rhythm Challenge",
    description: "You protected your meal timing for 7 days. 30 days is where circadian rhythm feeding becomes automatic — your gut starts preparing enzymes before you've even eaten.",
    week2: "Lock in a consistent 12-hour eating window",
    week3: "Plan every week's meals on Sunday — no decision fatigue",
    week4: "Your timing is now a habit. Build on it.",
  },
  feeling: {
    label: "Body Awareness",
    challenge: "30-Day Food Journal Challenge",
    description: "You observed your patterns for 7 days. 30 days of food-mood tracking gives you personalised data no test can provide — you learn your own gut's language.",
    week2: "Start connecting specific foods to specific feelings",
    week3: "Identify 3 foods that consistently help or harm",
    week4: "Write your personal gut food map — the foods that work for you",
  },
}

interface Day8ChallengeCardProps {
  weakestPillar: string | null
  profileColor: string
  membershipTier: "free" | "trial" | "member" | "grow" | "restore" | "transform"
  userId: string
}

export function Day8ChallengeCard({
  weakestPillar,
  profileColor,
  membershipTier,
  userId,
}: Day8ChallengeCardProps) {
  const storageKey = `eatobiotics_day8_dismissed_${userId}`
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === "undefined") return false
    return !!localStorage.getItem(storageKey)
  })

  if (dismissed) return null

  const program = weakestPillar
    ? (PILLAR_CHALLENGES[weakestPillar] ?? PILLAR_CHALLENGES.adding)
    : PILLAR_CHALLENGES.adding

  const isFree = membershipTier === "free"

  function dismiss() {
    localStorage.setItem(storageKey, "1")
    setDismissed(true)
  }

  return (
    <div className="rounded-2xl border border-border bg-background overflow-hidden">
      {/* Gradient top */}
      <div
        className="h-1 w-full"
        style={{ background: `linear-gradient(90deg, ${profileColor}, color-mix(in srgb, ${profileColor} 50%, var(--icon-teal)))` }}
      />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <Flame size={16} style={{ color: "var(--icon-orange)" }} />
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              7-Day Starter Complete 🎉
            </p>
          </div>
          <button
            onClick={dismiss}
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-border/50"
          >
            <X size={13} className="text-muted-foreground" />
          </button>
        </div>

        <h3 className="font-serif text-base font-semibold text-foreground leading-snug mb-2">
          {program.challenge}
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed mb-4">
          {program.description}
        </p>

        {/* Week roadmap */}
        <div className="space-y-2 mb-4">
          {[
            { week: "Week 2", action: program.week2 },
            { week: "Week 3", action: program.week3 },
            { week: "Week 4", action: program.week4 },
          ].map(({ week, action }) => (
            <div key={week} className="flex items-start gap-3">
              <span
                className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold text-white"
                style={{ background: profileColor }}
              >
                {week}
              </span>
              <p className="text-xs text-muted-foreground leading-relaxed pt-0.5">{action}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        {isFree ? (
          <div
            className="rounded-xl p-4"
            style={{ background: `color-mix(in srgb, ${profileColor} 6%, transparent)` }}
          >
            <p className="text-xs font-semibold text-foreground mb-1">
              Track your 30-day challenge with Grow
            </p>
            <p className="text-xs text-muted-foreground mb-3">
              Log your meals, watch your score move, and build a streak — €9.99/mo, cancel anytime.
            </p>
            <Link
              href="/pricing?feature=grow"
              className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:opacity-90"
              style={{ background: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))" }}
            >
              Start Grow <ArrowRight size={12} />
            </Link>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            Keep going — your score update is waiting. Log meals in the Meals tab to track your progress.
          </p>
        )}
      </div>
    </div>
  )
}
