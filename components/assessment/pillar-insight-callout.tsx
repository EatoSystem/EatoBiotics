"use client"

import type { PillarInsight } from "@/lib/assessment-scoring"

/* ── Pillar Insight Callout ─────────────────────────────────────────────
   Shown at the top of results, BEFORE the score ring.
   Surfaces the single most impactful truth about the user's weakest pillar.
   This is the "oh my god, that's me" moment.
────────────────────────────────────────────────────────────────────── */

const PILLAR_REVEALS: Record<string, { headline: string; body: string; emoji: string }> = {
  diversity: {
    emoji: "🌿",
    headline: "Your gut is working with a narrow plant range.",
    body: "Plant variety is the #1 driver of microbiome richness. Each new plant species feeds a different family of gut bacteria — and your score suggests you're working with a smaller range than your gut needs to thrive. The fix is simpler than you think.",
  },
  feeding: {
    emoji: "🍽️",
    headline: "Your gut bacteria are running low on fuel.",
    body: "Fibre from whole plants is the primary food source for your gut bacteria. Without it, they can't produce the short-chain fatty acids that regulate your immune system, mood, and energy. Your score shows this is the gap that matters most right now.",
  },
  adding: {
    emoji: "🦠",
    headline: "Your microbiome is missing its most direct input.",
    body: "Fermented foods are the only dietary source that directly seeds your gut with live bacteria. Without them, your microbiome has to rely entirely on what grows slowly from fibre alone. Even one serving a day creates a measurable shift within weeks.",
  },
  consistency: {
    emoji: "⏱️",
    headline: "Your gut's biggest enemy is unpredictability.",
    body: "Your microbiome runs on rhythm. When meal timing is irregular, gut bacteria can't anticipate and prepare — which means even good food choices deliver less benefit than they should. This is often the highest-leverage change you can make.",
  },
  feeling: {
    emoji: "💚",
    headline: "Your body is trying to tell you something.",
    body: "How you feel after eating — energy levels, digestion, mental clarity — is direct feedback from your gut-brain axis. Your score suggests these signals are inconsistent. Tracking one word after each meal for three days usually reveals the pattern.",
  },
}

interface PillarInsightCalloutProps {
  insights: PillarInsight[]
}

export function PillarInsightCallout({ insights }: PillarInsightCalloutProps) {
  const weakest = insights[0] // already sorted weakest-first
  if (!weakest) return null

  const reveal = PILLAR_REVEALS[weakest.pillar]
  if (!reveal) return null

  return (
    <div
      className="rounded-2xl border p-5 sm:p-6"
      style={{
        borderColor: `color-mix(in srgb, ${weakest.color} 30%, transparent)`,
        background: `color-mix(in srgb, ${weakest.color} 6%, transparent)`,
      }}
    >
      <div className="flex items-start gap-4">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xl"
          style={{ background: weakest.gradient }}
        >
          <span>{reveal.emoji}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p
            className="font-serif text-base font-semibold leading-snug sm:text-lg"
            style={{ color: weakest.color }}
          >
            {reveal.headline}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {reveal.body}
          </p>
          <div className="mt-3 flex items-center gap-2">
            <div
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: weakest.color }}
            />
            <p className="text-xs font-semibold" style={{ color: weakest.color }}>
              Weakest pillar: {weakest.label} — {weakest.score}/100
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
