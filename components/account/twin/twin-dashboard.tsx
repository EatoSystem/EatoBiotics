"use client"

/**
 * TwinDashboard — the dedicated /account/twin experience.
 *
 * Composes the member's living Twin from the shared FoodSystemDigitalTwin: an
 * enlarged living figure (re-tintable by lens), the live loop stage, the three
 * biotics, trends + memory, the learning feed, and the lens switcher. Kept live
 * via useTwinRealtime (Realtime + visibility refresh). Reuses the agent-loop
 * components that already consume the twin directly.
 */

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Target, Activity, TrendingUp, Flame, Leaf, Sparkles } from "lucide-react"
import { DigitalTwinFigure } from "@/components/digital-twin/parts"
import { ScoreRing } from "@/components/assessment/score-ring"
import {
  AgentLoopTimeline,
  FoodSystemLoopCard,
  FoodSystemMemoryPanel,
  BioticsProgressPanel,
} from "@/components/agent-loop"
import { TwinLenses, type LensDef } from "./twin-lenses"
import { useTwinRealtime } from "./use-twin-realtime"
import { auraGradientForBiotic } from "@/lib/account/twin-visual"
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
}: {
  twin: FoodSystemDigitalTwin
  visual: TwinVisualState
  feed: TwinFeedEntry[]
  lenses: LensDef[]
  userId: string | null
  /** Twin figure image (male/female by the member's sex; defaults to the couple). */
  figureSrc?: string
}) {
  useTwinRealtime(userId)
  const [lens, setLens] = useState(lenses[0]?.key ?? "foundation")
  const activeLens = lenses.find((l) => l.key === lens) ?? lenses[0]
  const aura = auraGradientForBiotic(activeLens.focusBiotic, visual.confidence)
  const nba = twin.nextBestAction

  return (
    <div className="min-h-screen bg-background pt-[57px]">
      <div className="mx-auto max-w-5xl px-5 py-8 md:px-8">
        {/* header */}
        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <Link href="/account" className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground">
              <ArrowLeft size={12} /> Account
            </Link>
            <h1 className="mt-1 font-serif text-2xl font-bold md:text-3xl" style={{ color: "var(--foreground)" }}>
              Your Digital Twin
            </h1>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold" style={{ background: "color-mix(in srgb, var(--icon-green) 10%, white)", color: "var(--icon-green)", border: "1px solid var(--border)" }}>
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: "var(--icon-green)", animation: "pulse-ring 2s ease-in-out infinite" }} />
              <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: "var(--icon-green)" }} />
            </span>
            Live &amp; learning
          </span>
        </div>

        {/* hero — living figure (lens-tinted) + score */}
        <div className="overflow-hidden rounded-2xl" style={{ background: "white", border: "1px solid var(--border)", boxShadow: "0 8px 32px rgba(26,46,18,0.10)" }}>
          <div className="h-[3px]" style={{ background: "linear-gradient(90deg, var(--icon-lime), var(--icon-green), var(--icon-teal), var(--icon-yellow), var(--icon-orange))" }} />
          <div className="flex flex-col items-center gap-6 p-6 md:flex-row md:items-center md:gap-10 md:p-8">
            <div className="relative shrink-0">
              <div
                aria-hidden
                className="eb-aura pointer-events-none absolute left-1/2 top-1/2 h-[115%] w-[115%] -translate-x-1/2 -translate-y-1/2 rounded-full"
                style={{ background: aura, opacity: 0.55 + 0.45 * visual.confidence, animationDuration: `${visual.pulseSec}s` }}
              />
              <DigitalTwinFigure size={240} src={figureSrc} alt="Your Food System Digital Twin" showParticles={visual.particleDensity > 0.35} />
            </div>
            <div className="flex flex-1 flex-col items-center gap-5 sm:flex-row sm:items-center">
              <ScoreRing score={visual.ringScore} color="var(--icon-green)" gradientId="twin-page-ring" profileType={visual.momentumLabel} className="relative h-40 w-40 shrink-0" />
              <div className="min-w-0 flex-1 text-center sm:text-left">
                <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--muted-foreground)" }}>Food System Score · {visual.momentumLabel}</p>
                <h2 className="mt-1 font-serif text-xl font-bold leading-snug" style={{ color: "var(--foreground)" }}>
                  Learning about your food system, constantly.
                </h2>
                {nba && (
                  <div className="mt-4 flex items-start gap-3 rounded-xl px-4 py-3" style={{ background: "linear-gradient(135deg, rgba(245,197,24,0.10), rgba(245,166,35,0.08))", border: "1px solid rgba(245,166,35,0.25)" }}>
                    <Target size={14} style={{ color: "var(--icon-orange)", flexShrink: 0, marginTop: 2 }} />
                    <div>
                      <p className="mb-0.5 text-[9px] font-bold uppercase tracking-widest" style={{ color: "var(--icon-orange)" }}>Your Twin&apos;s next best action</p>
                      <p className="text-sm leading-relaxed" style={{ color: "var(--foreground)" }}>{nba.action}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* lenses */}
        <div className="mt-8">
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
