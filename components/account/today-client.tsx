"use client"

import Link from "next/link"
import { Camera, Dumbbell, Activity, ArrowRight, ChevronRight, LayoutDashboard } from "lucide-react"
import { DailyLoopCard, type DailyLoopData } from "@/components/account/daily-loop-card"

interface TodayClientProps {
  firstName: string | null
  dailyLoop: DailyLoopData
  todayMealCount: number
  score: number | null
  glp1: { active: boolean; proteinToday: number | null; proteinTarget: number | null }
  stability: { active: boolean; loggedToday: boolean; eventsToday: number; stabilityScore: number | null }
}

function greeting(): string {
  const h = new Date().getHours()
  if (h < 12) return "Good morning"
  if (h < 18) return "Good afternoon"
  return "Good evening"
}

function ProteinRing({ value, target }: { value: number; target: number }) {
  const pct = target > 0 ? Math.min(1, value / target) : 0
  const r = 26, circ = 2 * Math.PI * r
  return (
    <div className="relative h-16 w-16 shrink-0">
      <svg width="64" height="64" viewBox="0 0 64 64" className="-rotate-90">
        <circle cx="32" cy="32" r={r} fill="none" stroke="var(--border)" strokeWidth="6" />
        <circle cx="32" cy="32" r={r} fill="none" stroke={pct >= 1 ? "var(--icon-green)" : "var(--icon-lime)"} strokeWidth="6" strokeLinecap="round" strokeDasharray={`${pct * circ} ${circ}`} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-xs font-bold tabular-nums" style={{ color: "var(--foreground)" }}>{value}</div>
    </div>
  )
}

export function TodayClient(props: TodayClientProps) {
  const { firstName, dailyLoop, todayMealCount, score, glp1, stability } = props
  const today = new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })

  return (
    <div className="mx-auto max-w-xl px-5 py-8">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {greeting()}{firstName ? `, ${firstName}` : ""}.
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">{today}</p>
        </div>
        {score != null && (
          <Link href="/account" className="rounded-2xl border border-border bg-card px-3 py-2 text-center transition-colors hover:border-[color:var(--icon-green)]">
            <div className="font-serif text-xl font-bold leading-none text-foreground">{score}</div>
            <div className="mt-0.5 text-[9px] uppercase tracking-wide text-muted-foreground">Score</div>
          </Link>
        )}
      </div>

      {/* Streak + today's focus (reused daily-loop card) */}
      <div className="mt-5">
        <DailyLoopCard data={dailyLoop} firstName={firstName} />
      </div>

      {/* Log a meal — the core daily action */}
      <Link href="/analyse" className="group mt-5 block overflow-hidden rounded-3xl border border-black/[0.06] bg-white shadow-[0_10px_36px_-16px_rgba(26,46,18,0.2)] transition-all hover:-translate-y-0.5">
        <div className="h-1.5 w-full" style={{ background: "linear-gradient(90deg, var(--icon-lime), var(--icon-green), var(--icon-teal))" }} />
        <div className="flex items-center gap-4 p-5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white shadow-sm" style={{ background: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))" }}>
            <Camera size={22} />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="font-serif text-lg font-bold text-foreground">Log a meal</h2>
            <p className="text-sm text-muted-foreground">
              {todayMealCount > 0 ? `${todayMealCount} logged today — add another to keep your streak.` : "Analyse a meal to start today's streak."}
            </p>
          </div>
          <ArrowRight size={18} className="shrink-0 text-icon-green transition-transform group-hover:translate-x-0.5" />
        </div>
      </Link>

      {/* Trackers the member actually uses */}
      {(glp1.active || stability.active) && (
        <>
          <p className="mt-7 px-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">Your trackers</p>
          <div className="mt-3 space-y-3">
            {glp1.active && (
              <Link href="/account/glp1" className="group flex items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm transition-colors hover:border-[color:var(--icon-green)]">
                {glp1.proteinTarget ? (
                  <ProteinRing value={glp1.proteinToday ?? 0} target={glp1.proteinTarget} />
                ) : (
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white shadow-sm" style={{ background: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))" }}><Dumbbell size={20} /></div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-icon-orange">GLP-1 Companion</p>
                  <p className="text-sm font-semibold text-foreground">
                    {glp1.proteinTarget ? `${glp1.proteinToday ?? 0} / ${glp1.proteinTarget}g protein today` : "Log today's protein"}
                  </p>
                </div>
                <ChevronRight size={16} className="shrink-0 text-icon-green" />
              </Link>
            )}
            {stability.active && (
              <Link href="/stability/tracker" className="group flex items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm transition-colors hover:border-[color:var(--icon-green)]">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white shadow-sm" style={{ background: "linear-gradient(135deg, var(--icon-yellow), var(--icon-orange))" }}><Activity size={20} /></div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-icon-orange">EatoBiotics Stability</p>
                  <p className="text-sm font-semibold text-foreground">
                    {stability.loggedToday ? `Logged today${stability.eventsToday ? ` · ${stability.eventsToday} event${stability.eventsToday === 1 ? "" : "s"}` : ""}` : "Track today's gut stability"}
                  </p>
                </div>
                <ChevronRight size={16} className="shrink-0 text-icon-green" />
              </Link>
            )}
          </div>
        </>
      )}

      {/* Full dashboard */}
      <Link href="/account" className="mt-7 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
        <LayoutDashboard size={14} /> Open full dashboard
      </Link>
    </div>
  )
}
