"use client"

/**
 * TwinDashboard — the dedicated /account/twin experience.
 *
 * Cinematic structure: a dark full-bleed TwinStage (luminous orb figure,
 * constellation hotspots, score cockpit) → the dark Inside You cinema band →
 * light content (lenses, the live loop, biotics, memory, trends, learning
 * feed). Kept live via useTwinRealtime (Realtime + visibility refresh); a new
 * meal fires the MealReactionBurst over the orb so the Twin visibly learns.
 * Reuses the agent-loop components that already consume the twin directly.
 */

import { useCallback, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Activity, TrendingUp, Flame, Leaf, Sparkles } from "lucide-react"
import {
  AgentLoopTimeline,
  FoodSystemLoopCard,
  FoodSystemMemoryPanel,
  BioticsProgressPanel,
} from "@/components/agent-loop"
import { TwinLenses, type LensDef } from "./twin-lenses"
import { TwinStage } from "./twin-stage"
import { QuickLog } from "./quick-log"
import { InsideYouSection } from "./inside-you"
import { Journey } from "./journey"
import { ForecastCard } from "./forecast"
import { AskTwin } from "./ask-twin"
import { WeekStoryButton } from "./week-story"
import { useTwinRealtime } from "./use-twin-realtime"
import type { FoodSystemDigitalTwin } from "@/lib/agent-loop/twin/twin-types"
import type { TwinVisualState } from "@/lib/account/twin-visual"
import type { TwinVideo } from "@/lib/account/twin-figure"
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

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--icon-green)" }}>
      {children}
    </p>
  )
}

export function TwinDashboard({
  twin,
  visual,
  feed,
  lenses,
  userId,
  figureSrc = "/images/couple-hero.png",
  video = null,
  demo = false,
  streak = 0,
  consultHref = "/account/consult",
}: {
  twin: FoodSystemDigitalTwin
  visual: TwinVisualState
  feed: TwinFeedEntry[]
  lenses: LensDef[]
  userId: string | null
  /** Twin figure image (male/female by the member's sex; defaults to the couple). */
  figureSrc?: string
  /** Per-sex Remotion twin video, when known. */
  video?: TwinVideo | null
  /** Demo mode: shows a "Simulate a meal" button so the reaction is previewable. */
  demo?: boolean
  streak?: number
  consultHref?: string
}) {
  const [mealBurst, setMealBurst] = useState(0)
  const onNewMeal = useCallback(() => setMealBurst((k) => k + 1), [])
  useTwinRealtime(userId, onNewMeal)
  const [lens, setLens] = useState(lenses[0]?.key ?? "foundation")
  const [quickLogOpen, setQuickLogOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background pt-[57px]">
      {/* dark page header — blends into the stage below */}
      <div style={{ background: "#0B1607" }}>
        <div className="mx-auto flex max-w-6xl items-end justify-between gap-3 px-4 pt-6 md:px-8">
          <div>
            <Link href="/account" className="inline-flex items-center gap-1 text-xs transition-colors hover:text-white" style={{ color: "rgba(253,251,247,0.55)" }}>
              <ArrowLeft size={12} /> Account
            </Link>
            <h1 className="mt-1 font-serif text-2xl font-bold md:text-3xl" style={{ color: "#FDFBF7" }}>
              Your Digital Twin
            </h1>
          </div>
          <WeekStoryButton twin={twin} variant="dark" />
        </div>
      </div>

      {/* the cinematic stage */}
      <TwinStage
        twin={twin}
        visual={visual}
        figureSrc={figureSrc}
        video={video}
        detailHref={null}
        demo={demo}
        burstKey={mealBurst}
        onSimulateMeal={demo ? onNewMeal : undefined}
        onAddMeal={() => setQuickLogOpen(true)}
      />

      {/* quick-log (mock in demo — no API); a new meal fires the stage burst */}
      <QuickLog open={quickLogOpen} onClose={() => setQuickLogOpen(false)} onLearned={onNewMeal} mock={demo} />

      {/* the Inside You cinema band */}
      <InsideYouSection twin={twin} />

      {/* journey + what-if (light, full-width sections) */}
      <Journey twin={twin} streak={streak} />
      <ForecastCard twin={twin} />
      <AskTwin twin={twin} consultHref={consultHref} />

      {/* light content */}
      <div className="mx-auto max-w-5xl px-5 py-8 md:px-8">
        {/* lenses */}
        <div>
          <SectionLabel>One Twin · many lenses</SectionLabel>
          <TwinLenses lenses={lenses} selected={lens} onSelect={setLens} biotics={twin.biotics} />
        </div>

        {/* the loop, live */}
        <div className="mt-8">
          <SectionLabel>The loop, live</SectionLabel>
          <div className="rounded-2xl border border-border bg-card p-5" style={{ boxShadow: "0 4px 20px rgba(26,46,18,0.06)" }}>
            <AgentLoopTimeline currentStage={twin.currentStage} />
          </div>
          <div className="mt-4">
            <FoodSystemLoopCard twin={twin} />
          </div>
        </div>

        {/* biotics + memory */}
        <div className="mt-8 grid gap-5 lg:grid-cols-2">
          <div>
            <SectionLabel>Your three biotics</SectionLabel>
            <BioticsProgressPanel biotics={twin.biotics} />
          </div>
          <div>
            <SectionLabel>Progress &amp; memory</SectionLabel>
            <FoodSystemMemoryPanel twin={twin} />
          </div>
        </div>

        {/* trends */}
        {twin.trends.length > 0 && (
          <div className="mt-8">
            <SectionLabel>Trends</SectionLabel>
            <div className="grid gap-3 sm:grid-cols-2">
              {twin.trends.map((t) => (
                <div key={t.label} className="flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{t.label}</p>
                    <p className="text-xs text-muted-foreground">{t.detail}</p>
                  </div>
                  <span className="rounded-full px-2.5 py-1 text-xs font-bold" style={{
                    background: t.direction === "up" ? "rgba(168,224,99,0.18)" : t.direction === "down" ? "rgba(245,166,35,0.14)" : "var(--muted)",
                    color: t.direction === "up" ? "#2d7a24" : t.direction === "down" ? "#a05a0a" : "var(--muted-foreground)",
                  }}>
                    {t.direction === "up" ? "↑" : t.direction === "down" ? "↓" : "→"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* learning feed */}
        <div className="mt-8">
          <div className="mb-3 flex items-center gap-1.5">
            <Activity size={12} style={{ color: "var(--icon-green)" }} />
            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--icon-green)" }}>What your Twin has learned</p>
          </div>
          <div className="space-y-1.5">
            {feed.map((e) => {
              const Icon = FEED_ICON[e.icon] ?? Sparkles
              return (
                <div key={e.id} className="flex items-start gap-2.5 rounded-lg px-3 py-2.5" style={{ background: "color-mix(in srgb, var(--icon-green) 5%, white)", border: "1px solid var(--border)" }}>
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full" style={{ background: "color-mix(in srgb, var(--icon-green) 12%, white)", color: "var(--icon-green)" }}>
                    <Icon size={12} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold" style={{ color: "var(--foreground)" }}>{e.title}</p>
                    <p className="text-[11px] leading-snug" style={{ color: "var(--muted-foreground)" }}>{e.detail}</p>
                  </div>
                  {e.at && <span className="shrink-0 text-[10px]" style={{ color: "var(--muted-foreground)" }}>{timeAgo(e.at)}</span>}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
