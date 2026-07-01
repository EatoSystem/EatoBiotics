"use client"

/**
 * TwinHero — the premium "Your Digital Twin" hero at the top of the account.
 *
 * Shows the member's Digital Twin as a Remotion-rendered animated figure
 * (male/female by sex, played via HeroVideo; couple still-figure fallback when
 * unknown), with a live/learning pill, Food System Score, strongest + weakest
 * biotic, the single next best action, and the two primary CTAs. The "what your
 * Twin learned" feed lives in its own section (TwinLearnedToday), not here.
 */

import Link from "next/link"
import { HeroVideo } from "@/components/hero-video"
import { DigitalTwinFigure } from "@/components/digital-twin/parts"
import { ScoreRing } from "@/components/assessment/score-ring"
import { Target, ArrowRight, Utensils } from "lucide-react"
import type { FoodSystemDigitalTwin } from "@/lib/agent-loop/twin/twin-types"
import type { TwinVisualState } from "@/lib/account/twin-visual"
import type { TwinVideo } from "@/lib/account/twin-figure"
import type { BioticKey } from "@/lib/agent-loop/types"

const BIOTIC_NAME: Record<BioticKey, string> = {
  prebiotics: "Prebiotics",
  probiotics: "Probiotics",
  postbiotics: "Postbiotics",
}

export function TwinHero({
  twin,
  visual,
  figureSrc = "/images/couple-hero.png",
  video = null,
  learning = false,
  detailHref = "/account/twin",
  addMealHref = "/analyse",
}: {
  twin: FoodSystemDigitalTwin
  visual: TwinVisualState
  figureSrc?: string
  video?: TwinVideo | null
  learning?: boolean
  detailHref?: string
  addMealHref?: string
}) {
  const nba = twin.nextBestAction
  const strongest = twin.biotics.strongest
  const weakest = twin.biotics.weakest

  return (
    <div className="mx-auto max-w-5xl px-4 pt-5 md:px-8">
      <div className="overflow-hidden rounded-3xl" style={{ background: "white", border: "1px solid var(--border)", boxShadow: "0 8px 32px rgba(26,46,18,0.10)" }}>
        <div className="h-[3px]" style={{ background: "linear-gradient(90deg, var(--icon-lime), var(--icon-green), var(--icon-teal), var(--icon-yellow), var(--icon-orange))" }} />

        {/* ── Animated Digital Twin figure ── */}
        <div className="relative">
          {video ? (
            <HeroVideo
              posterSrc={video.poster}
              mp4Src={video.mp4}
              webmSrc={video.webm}
              alt="Your Food System Digital Twin"
              className="mx-auto block h-auto w-full max-w-[760px]"
            />
          ) : (
            <div className="py-4">
              <DigitalTwinFigure size={300} src={figureSrc} alt="Your Food System Digital Twin" showParticles={visual.particleDensity > 0.35} />
            </div>
          )}
          {/* live / learning pill */}
          <div className="absolute left-5 top-5 flex items-center gap-2 rounded-full bg-white/85 px-3 py-1.5 backdrop-blur" style={{ border: "1px solid var(--border)" }}>
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: "var(--icon-green)", animation: "pulse-ring 2s ease-in-out infinite" }} />
              <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: "var(--icon-green)" }} />
            </span>
            <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--icon-green)" }}>
              {learning ? "Learning…" : "Live"}
            </span>
          </div>
        </div>

        {/* ── Twin summary ── */}
        <div className="grid gap-6 border-t border-border p-6 md:grid-cols-[auto_1fr] md:items-center md:gap-8 md:p-8">
          <ScoreRing score={visual.ringScore} color="var(--icon-green)" gradientId="account-twin-hero-ring" profileType={visual.momentumLabel} className="relative mx-auto h-36 w-36 shrink-0 sm:h-40 sm:w-40" />

          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--muted-foreground)" }}>Your Digital Twin</p>
            <h2 className="mt-1 font-serif text-xl font-bold leading-snug md:text-2xl" style={{ color: "var(--foreground)" }}>
              Your Digital Twin has been learning about your Food System.
            </h2>

            {/* strongest + weakest biotic */}
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold" style={{ background: "color-mix(in srgb, var(--icon-green) 12%, white)", color: "var(--icon-green)" }}>
                Strongest · {BIOTIC_NAME[strongest]}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold" style={{ background: "color-mix(in srgb, var(--icon-orange) 12%, white)", color: "#a05a0a" }}>
                Biggest opportunity · {BIOTIC_NAME[weakest]}
              </span>
            </div>

            {/* next best action one-liner */}
            {nba && (
              <div className="mt-4 flex items-start gap-3 rounded-xl px-4 py-3" style={{ background: "linear-gradient(135deg, rgba(245,197,24,0.10), rgba(245,166,35,0.08))", border: "1px solid rgba(245,166,35,0.25)" }}>
                <Target size={14} style={{ color: "var(--icon-orange)", flexShrink: 0, marginTop: 2 }} />
                <div>
                  <p className="mb-0.5 text-[9px] font-bold uppercase tracking-widest" style={{ color: "var(--icon-orange)" }}>Your next best action</p>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--foreground)" }}>{nba.action}</p>
                </div>
              </div>
            )}

            {/* CTAs */}
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href={detailHref} className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90" style={{ background: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))", boxShadow: "0 3px 10px rgba(45,170,110,0.28)" }}>
                Open My Digital Twin <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href={addMealHref} className="inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-black/[0.03]" style={{ borderColor: "var(--icon-green)", color: "var(--icon-green)" }}>
                <Utensils className="h-4 w-4" /> Add Today&apos;s Meal
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
