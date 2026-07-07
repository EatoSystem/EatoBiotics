"use client"

/**
 * Digital Twin Overview sections:
 *  - TwinLearnedToday  → "What Your Food System Learned Today" (the learning feed as cards)
 *  - TwinNextAction    → the single next best action (reuses NextBestActionCard,
 *                        with local complete/skip acknowledgement — no backend write yet)
 *  - TwinScorePanel    → premium Food System Score (ScoreRing + trend + biotics)
 * All read from the shared FoodSystemDigitalTwin. Brand palette, non-medical tone.
 */

import { useState } from "react"
import { TrendingUp, Flame, Leaf, Sparkles, Check } from "lucide-react"
import { NextBestActionCard } from "@/components/agent-loop"
import { BioticsProgressPanel } from "@/components/agent-loop"
import { ScoreRing } from "@/components/assessment/score-ring"
import type { FoodSystemDigitalTwin } from "@/lib/agent-loop/twin/twin-types"
import type { TwinVisualState } from "@/lib/account/twin-visual"
import type { TwinFeedEntry } from "@/lib/agent-loop/account-twin"

const FEED_ICON = { momentum: TrendingUp, streak: Flame, biotic: Leaf, meal: Sparkles } as const

function timeAgo(iso: string | null): string {
  if (!iso) return ""
  const h = Math.round((Date.now() - new Date(iso).getTime()) / 3_600_000)
  if (h < 1) return "just now"
  if (h < 24) return `${h}h ago`
  const d = Math.round(h / 24)
  return d === 1 ? "yesterday" : `${d}d ago`
}

function SectionHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="mb-4">
      <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--icon-green)" }}>{eyebrow}</p>
      <h3 className="mt-1 font-serif text-xl font-bold" style={{ color: "var(--foreground)" }}>{title}</h3>
    </div>
  )
}

/* ── What Your Food System Learned Today ──────────────────────────────────── */
export function TwinLearnedToday({ feed }: { feed: TwinFeedEntry[] }) {
  if (!feed.length) return null
  const [top, ...rest] = feed
  const TopIcon = FEED_ICON[top.icon] ?? Sparkles
  return (
    <section className="mx-auto max-w-5xl px-4 pt-8 md:px-8">
      <SectionHeading eyebrow="Learning" title="What your Food System learned today" />

      {/* Insight of the day — the one thing to remember */}
      <div
        className="flex items-start gap-4 rounded-2xl p-5"
        style={{
          background: "linear-gradient(135deg, color-mix(in srgb, var(--icon-green) 9%, white), color-mix(in srgb, var(--icon-yellow) 7%, white))",
          border: "1px solid color-mix(in srgb, var(--icon-green) 35%, white)",
          boxShadow: "0 4px 24px rgba(76,182,72,0.12)",
        }}
      >
        <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white" style={{ background: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))", boxShadow: "0 4px 14px rgba(76,182,72,0.35)" }}>
          <TopIcon size={16} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--icon-green)" }}>Insight of the day</p>
          <p className="mt-1 font-serif text-base font-bold leading-snug" style={{ color: "var(--foreground)" }}>{top.title}</p>
          <p className="mt-0.5 text-sm leading-snug" style={{ color: "var(--muted-foreground)" }}>{top.detail}</p>
        </div>
        {top.at && <span className="shrink-0 text-[10px]" style={{ color: "var(--muted-foreground)" }}>{timeAgo(top.at)}</span>}
      </div>

      {rest.length > 0 && (
        <div className="mt-2.5 grid gap-2.5 sm:grid-cols-2">
          {rest.slice(0, 6).map((e) => {
            const Icon = FEED_ICON[e.icon] ?? Sparkles
            return (
              <div key={e.id} className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4" style={{ boxShadow: "0 2px 12px rgba(26,46,18,0.05)" }}>
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full" style={{ background: "color-mix(in srgb, var(--icon-green) 12%, white)", color: "var(--icon-green)" }}>
                  <Icon size={14} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold leading-snug" style={{ color: "var(--foreground)" }}>{e.title}</p>
                  <p className="mt-0.5 text-xs leading-snug" style={{ color: "var(--muted-foreground)" }}>{e.detail}</p>
                </div>
                {e.at && <span className="shrink-0 text-[10px]" style={{ color: "var(--muted-foreground)" }}>{timeAgo(e.at)}</span>}
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}

/* ── Your Next Best Action ─────────────────────────────────────────── */
export function TwinNextAction({ twin, bare = false }: { twin: FoodSystemDigitalTwin; bare?: boolean }) {
  const [status, setStatus] = useState<"open" | "done" | "skipped">("open")
  const nba = twin.nextBestAction
  if (!nba) return null

  return (
    <section className={bare ? "min-w-0" : "mx-auto max-w-5xl px-4 pt-8 md:px-8"}>
      <SectionHeading eyebrow="Today's Focus" title="Your Next Best Action" />
      {status === "open" ? (
        <NextBestActionCard
          recommendation={nba}
          onComplete={() => setStatus("done")}
          onSkip={() => setStatus("skipped")}
        />
      ) : (
        <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-5" style={{ boxShadow: "0 2px 12px rgba(26,46,18,0.05)" }}>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white" style={{ background: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))" }}>
            <Check className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
              {status === "done" ? "Nice — your Food System noted that." : "No problem — it'll suggest this again."}
            </p>
            <button onClick={() => setStatus("open")} className="mt-0.5 text-xs font-semibold underline underline-offset-2" style={{ color: "var(--icon-green)" }}>
              Undo
            </button>
          </div>
        </div>
      )}
      <p className="mt-2 px-1 text-[11px] leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
        EatoBiotics provides food-first guidance for general wellbeing and is not medical advice.
      </p>
    </section>
  )
}

/* ── Your Food System Score ────────────────────────────────────────── */
export function TwinScorePanel({ twin, visual }: { twin: FoodSystemDigitalTwin; visual: TwinVisualState }) {
  const delta = twin.progress.scoreDelta
  const deltaLabel = delta > 0 ? `+${delta} since baseline` : delta < 0 ? `${delta} since baseline` : "Holding at baseline"
  return (
    <section className="mx-auto max-w-5xl px-4 pt-8 md:px-8">
      <SectionHeading eyebrow="Food System Score" title="Your Food System, today" />
      <div className="grid gap-5 lg:grid-cols-[auto_1fr] lg:items-center">
        <div className="flex flex-col items-center rounded-2xl border border-border bg-card p-6" style={{ boxShadow: "0 2px 12px rgba(26,46,18,0.05)" }}>
          <ScoreRing score={visual.ringScore} color="var(--icon-green)" gradientId="account-twin-score-ring" profileType={visual.momentumLabel} className="relative h-44 w-44" />
          <div className="mt-3 flex items-center gap-2">
            <span className="rounded-full px-3 py-1 text-xs font-bold text-white" style={{ background: delta >= 0 ? "linear-gradient(135deg,#4CB648,#2DAA6E)" : "linear-gradient(135deg,#F5C518,#F5A623)" }}>{deltaLabel}</span>
          </div>
        </div>
        <BioticsProgressPanel biotics={twin.biotics} />
      </div>
    </section>
  )
}
