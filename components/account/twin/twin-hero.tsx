"use client"

/**
 * TwinHero — the member's Living Digital Twin at the top of the account Overview.
 *
 * Renders the derived `FoodSystemDigitalTwin` as a living figure whose aura/score
 * reflect the member's current Food System, beside a "what your Twin just learned"
 * feed. It is presentational: the server assembles the twin (buildAccountTwin) and
 * computes the visual state (twinVisualState); after a meal is logged the dashboard
 * calls router.refresh() so the Twin re-derives and visibly updates.
 */

import { DigitalTwinFigure } from "@/components/digital-twin/parts"
import Link from "next/link"
import { ScoreRing } from "@/components/assessment/score-ring"
import { ScoreBar } from "@/components/account/dashboard-parts"
import { TrendingUp, Flame, Leaf, Target, Sparkles, Activity, ArrowRight } from "lucide-react"
import type { FoodSystemDigitalTwin } from "@/lib/agent-loop/twin/twin-types"
import type { TwinVisualState } from "@/lib/account/twin-visual"
import type { TwinFeedEntry } from "@/lib/agent-loop/account-twin"

const FEED_ICON = {
  momentum: TrendingUp,
  streak: Flame,
  biotic: Leaf,
  meal: Sparkles,
} as const

function timeAgo(iso: string | null): string {
  if (!iso) return ""
  const diff = Date.now() - new Date(iso).getTime()
  const h = Math.round(diff / 3_600_000)
  if (h < 1) return "just now"
  if (h < 24) return `${h}h ago`
  const d = Math.round(h / 24)
  return d === 1 ? "yesterday" : `${d}d ago`
}

export function TwinHero({
  twin,
  visual,
  feed,
  learning = false,
  detailHref = "/account/twin",
  figureSrc = "/images/couple-hero.png",
}: {
  twin: FoodSystemDigitalTwin
  visual: TwinVisualState
  feed: TwinFeedEntry[]
  /** Briefly true right after a meal log while the server re-derives. */
  learning?: boolean
  /** Where "Open full Twin" links (demo overrides to /demo/account/twin). */
  detailHref?: string
  /** Twin figure image (male/female by the member's sex; defaults to the couple). */
  figureSrc?: string
}) {
  const nba = twin.nextBestAction

  return (
    <div className="mx-auto max-w-5xl px-4 pt-5 md:px-8">
      <div className="overflow-hidden rounded-2xl" style={{ background: "white", border: "1px solid var(--border)", boxShadow: "0 8px 32px rgba(26,46,18,0.10)" }}>
        {/* gradient top accent */}
        <div className="h-[3px]" style={{ background: "linear-gradient(90deg, var(--icon-lime), var(--icon-green), var(--icon-teal), var(--icon-yellow), var(--icon-orange))" }} />

        <div className="flex flex-col gap-6 p-5 md:flex-row md:p-7">
          {/* ── Left: living figure + score ── */}
          <div className="flex shrink-0 flex-col items-center md:w-[300px]">
            <div className="mb-1 flex items-center gap-2 self-start">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: "var(--icon-green)", animation: "pulse-ring 2s ease-in-out infinite" }} />
                <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: "var(--icon-green)" }} />
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--icon-green)" }}>
                {learning ? "Learning…" : "Live"}
              </span>
            </div>

            <div className="relative">
              {/* state-driven aura behind the figure */}
              <div
                aria-hidden
                className="eb-aura pointer-events-none absolute left-1/2 top-1/2 h-[112%] w-[112%] -translate-x-1/2 -translate-y-1/2 rounded-full"
                style={{ background: visual.auraGradient, opacity: 0.55 + 0.45 * visual.confidence, animationDuration: `${visual.pulseSec}s` }}
              />
              <DigitalTwinFigure
                size={220}
                src={figureSrc}
                alt="Your living Food System Digital Twin"
                showParticles={visual.particleDensity > 0.35}
              />
            </div>

            {/* score ring */}
            <div className="mt-2">
              <ScoreRing
                score={visual.ringScore}
                color="var(--icon-green)"
                gradientId="account-twin-ring"
                profileType={visual.momentumLabel}
                className="relative mx-auto h-32 w-32"
              />
            </div>
          </div>

          {/* ── Right: what the Twin knows + is learning ── */}
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--muted-foreground)" }}>
              Your Living Twin
            </p>
            <h2 className="mt-1 font-serif text-xl font-bold leading-snug md:text-2xl" style={{ color: "var(--foreground)" }}>
              Learning about your food system, constantly.
            </h2>

            {/* biotic balance */}
            <div className="mt-4 space-y-2">
              <ScoreBar label="Prebiotic"  score={twin.biotics.prebiotics.score} />
              <ScoreBar label="Probiotic"  score={twin.biotics.probiotics.score} />
              <ScoreBar label="Postbiotic" score={twin.biotics.postbiotics.score} />
            </div>

            {/* next best action */}
            {nba && (
              <div className="mt-4 flex items-start gap-3 rounded-xl px-4 py-3"
                style={{ background: "linear-gradient(135deg, rgba(245,197,24,0.10), rgba(245,166,35,0.08))", border: "1px solid rgba(245,166,35,0.25)" }}>
                <Target size={14} style={{ color: "var(--icon-orange)", flexShrink: 0, marginTop: 2 }} />
                <div>
                  <p className="mb-0.5 text-[9px] font-bold uppercase tracking-widest" style={{ color: "var(--icon-orange)" }}>
                    Your Twin&apos;s next best action
                  </p>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--foreground)" }}>{nba.action}</p>
                </div>
              </div>
            )}

            {/* learning feed */}
            <div className="mt-5">
              <div className="mb-2 flex items-center gap-1.5">
                <Activity size={12} style={{ color: "var(--icon-green)" }} />
                <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: "var(--icon-green)" }}>
                  What your Twin just learned
                </p>
              </div>
              <div className="space-y-1.5">
                {feed.slice(0, 5).map((e) => {
                  const Icon = FEED_ICON[e.icon] ?? Sparkles
                  return (
                    <div key={e.id} className="flex items-start gap-2.5 rounded-lg px-3 py-2" style={{ background: "color-mix(in srgb, var(--icon-green) 5%, white)", border: "1px solid var(--border)" }}>
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

              <Link href={detailHref} className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold" style={{ color: "var(--icon-green)" }}>
                Open your full Living Twin <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
