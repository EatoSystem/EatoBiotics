"use client"

/**
 * ThisWeekClient — "Your Food System This Week", the weekly-review experience.
 *
 * A premium-documentary scroll: a dark hero (score + delta), then the week's
 * story told as chaptered bands (buildWeekStory slides — signals, meal of the
 * week, biotics, what I noticed, score trend, next focus), each accented in the
 * brand palette. "Play as story" opens the existing fullscreen WeekStory. One
 * of the three experiences (Today · This Week · My Food System). Non-medical.
 */

import Link from "next/link"
import { ArrowLeft, ArrowRight } from "lucide-react"
import { ExperienceNav } from "@/components/account/experience-nav"
import { WeekStoryButton } from "./week-story"
import { MilestoneRail } from "./journey"
import { buildWeekStory } from "@/lib/account/week-story"
import { useCountUp } from "./use-count-up"
import type { FoodSystemDigitalTwin } from "@/lib/agent-loop/twin/twin-types"

export function ThisWeekClient({ twin, streak = 0, consultHref = "/account/consult" }: { twin: FoodSystemDigitalTwin; streak?: number; consultHref?: string }) {
  const slides = buildWeekStory(twin)
  const score = useCountUp(Math.round(twin.currentScore.value))
  const delta = twin.progress.scoreDelta
  const focus = twin.nextBestAction

  return (
    <div className="min-h-screen pt-[57px]" style={{ background: "#FDFBF7" }}>
      {/* dark hero */}
      <section className="relative overflow-hidden" style={{ background: "linear-gradient(175deg, #0B1607 0%, #122208 55%, #16290F 100%)" }}>
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -right-32 top-0 h-[420px] w-[420px] rounded-full" style={{ background: "radial-gradient(circle, rgba(168,224,99,0.14) 0%, transparent 65%)" }} />
          <div className="absolute -left-24 bottom-0 h-[360px] w-[360px] rounded-full" style={{ background: "radial-gradient(circle, rgba(245,197,24,0.10) 0%, transparent 65%)" }} />
        </div>
        <div className="relative mx-auto max-w-4xl px-5 pb-10 pt-6 md:px-8">
          <div className="flex items-center justify-between gap-3">
            <Link href="/account" className="inline-flex items-center gap-1 text-xs transition-colors hover:text-white" style={{ color: "rgba(253,251,247,0.55)" }}>
              <ArrowLeft size={12} /> Account
            </Link>
            <WeekStoryButton twin={twin} variant="dark" />
          </div>
          <div className="mt-4"><ExperienceNav variant="dark" /></div>

          <p className="eb-reveal mt-8 text-[11px] font-bold uppercase tracking-[0.22em]" style={{ color: "#A8E063" }}>Your Food System This Week</p>
          <h1 className="eb-reveal mt-2 max-w-2xl font-serif text-3xl font-bold leading-tight md:text-4xl" style={{ color: "#FDFBF7", animationDelay: "80ms" }}>
            Here&apos;s how you&apos;re changing.
          </h1>
          <div className="eb-reveal mt-5 flex flex-wrap items-end gap-x-4 gap-y-2" style={{ animationDelay: "160ms" }}>
            <div className="flex items-baseline gap-2">
              <span className="font-serif text-6xl font-bold leading-none md:text-7xl" style={{ color: "#FDFBF7" }}>{score}</span>
              <span className="text-base font-semibold" style={{ color: "rgba(253,251,247,0.4)" }}>/100</span>
            </div>
            <span
              className="mb-1.5 rounded-full px-3 py-1 text-xs font-bold"
              style={
                delta >= 0
                  ? { background: "rgba(168,224,99,0.16)", color: "#A8E063", border: "1px solid rgba(168,224,99,0.35)" }
                  : { background: "rgba(245,166,35,0.14)", color: "#F5C518", border: "1px solid rgba(245,197,24,0.35)" }
              }
            >
              {delta > 0 ? `▲ +${delta} this week` : delta < 0 ? `▼ ${delta} this week` : "Holding steady"}
            </span>
          </div>
        </div>
      </section>

      {/* the long arc — where this week sits in the whole journey */}
      <div className="mx-auto max-w-3xl px-5 pt-8 md:px-8">
        <div className="rounded-2xl border bg-white p-5" style={{ borderColor: "var(--border)", boxShadow: "0 4px 20px rgba(26,46,18,0.06)" }}>
          <MilestoneRail twin={twin} streak={streak} bare />
        </div>
      </div>

      {/* the week's story — chaptered bands */}
      <div className="mx-auto max-w-3xl px-5 pb-10 pt-6 md:px-8">
        <div className="space-y-3">
          {slides
            .filter((s) => s.key !== "intro")
            .map((s, i) => (
              <div
                key={s.key}
                className="eb-reveal overflow-hidden rounded-2xl border bg-white p-6"
                style={{ borderColor: "var(--border)", boxShadow: "0 4px 20px rgba(26,46,18,0.06)", animationDelay: `${i * 80}ms` }}
              >
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ background: s.accent, boxShadow: `0 0 10px ${s.accent}` }} />
                  <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--muted-foreground)" }}>{s.eyebrow}</p>
                </div>
                <div className="mt-2 flex items-baseline gap-3">
                  {s.stat && <span className="font-serif text-4xl font-bold leading-none" style={{ color: s.accent }}>{s.stat}</span>}
                  <h2 className="font-serif text-lg font-bold leading-snug" style={{ color: "var(--foreground)" }}>{s.title}</h2>
                </div>
                <p className="mt-1.5 text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>{s.detail}</p>
              </div>
            ))}
        </div>

        {/* next week's one focus → ask/consult bridge */}
        {focus && (
          <div className="mt-8 overflow-hidden rounded-2xl p-6" style={{ background: "linear-gradient(135deg, rgba(245,197,24,0.10), rgba(245,166,35,0.08))", border: "1px solid rgba(245,166,35,0.3)" }}>
            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#a05a0a" }}>Next week · one focus</p>
            <p className="mt-1.5 font-serif text-lg font-bold leading-snug" style={{ color: "var(--foreground)" }}>{focus.action}</p>
            <Link href={consultHref} className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold" style={{ color: "var(--icon-green)" }}>
              Ask your Food System about this <ArrowRight size={14} />
            </Link>
          </div>
        )}

        <p className="mt-6 text-center text-[11px] leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
          EatoBiotics provides food-first guidance for general wellbeing and is not medical advice.
        </p>
      </div>
    </div>
  )
}
