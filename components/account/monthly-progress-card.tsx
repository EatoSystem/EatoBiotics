"use client"

import { useState } from "react"
import { TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp } from "lucide-react"

const PILLAR_LABELS: Record<string, string> = {
  diversity: "Plant Diversity", feeding: "Feeding", adding: "Live Foods",
  consistency: "Consistency", feeling: "Body Awareness",
}

const PILLAR_NEXT_ACTIONS: Record<string, string> = {
  adding:      "Add a fermented food to every meal this month — not just when you remember",
  diversity:   "Hit 20 different plant species per week this month — track it every Sunday",
  feeding:     "Include a legume at least 4 times per week — it's the single biggest prebiotic move",
  consistency: "Lock in a 12-hour eating window this month — your gut clock will stabilise within 2 weeks",
  feeling:     "Log one feeling word after each main meal — by week 4 you'll have a personal food map",
}

interface MonthlyProgressCardProps {
  membershipTier: "grow" | "restore" | "transform"
  analysisCount: number
  trendDirection: "up" | "stable" | "down"
  bestStreak: number
  currentScore: number | null
  previousScore: number | null
  weakestPillar: string | null
  monthlyReviewContent?: string | null
}

export function MonthlyProgressCard({
  membershipTier, analysisCount, trendDirection, bestStreak,
  currentScore, previousScore, weakestPillar, monthlyReviewContent,
}: MonthlyProgressCardProps) {
  const [expanded, setExpanded] = useState(false)
  const monthLabel = new Date().toLocaleDateString("en-IE", { month: "long", year: "numeric" })
  const scoreDelta = currentScore != null && previousScore != null
    ? Math.round(currentScore) - Math.round(previousScore) : null

  const trendColor = trendDirection === "up" ? "var(--icon-green)" : trendDirection === "down" ? "var(--icon-orange)" : "var(--muted-foreground)"
  const trendBg = trendDirection === "up" ? "color-mix(in srgb, var(--icon-green) 10%, transparent)" : trendDirection === "down" ? "color-mix(in srgb, var(--icon-orange) 10%, transparent)" : "var(--secondary)"

  return (
    <div className="rounded-2xl border border-border bg-background overflow-hidden">
      <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, var(--icon-lime), var(--icon-green), var(--icon-teal))" }} />
      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Monthly Progress</p>
            <h3 className="font-serif text-base font-semibold text-foreground">{monthLabel}</h3>
          </div>
          <div className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold" style={{ background: trendBg, color: trendColor }}>
            {trendDirection === "up" ? <TrendingUp size={12} /> : trendDirection === "down" ? <TrendingDown size={12} /> : <Minus size={12} />}
            <span className="ml-1">{trendDirection === "up" ? "Improving" : trendDirection === "down" ? "Needs focus" : "Holding steady"}</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-4">
          {([
            { label: "Meals logged", value: analysisCount.toString(), sub: "last 90 days" },
            { label: "Best streak", value: `${bestStreak}d`, sub: "consecutive days" },
            { label: "Score delta", value: scoreDelta != null ? `${scoreDelta > 0 ? "+" : ""}${scoreDelta}` : "—", sub: "vs last assessment", color: scoreDelta != null ? (scoreDelta > 0 ? "var(--icon-green)" : scoreDelta < 0 ? "var(--icon-orange)" : undefined) : undefined },
          ] as Array<{ label: string; value: string; sub: string; color?: string }>).map(({ label, value, sub, color }) => (
            <div key={label} className="rounded-xl bg-secondary/40 p-3 text-center">
              <p className="text-lg font-bold tabular-nums text-foreground" style={color ? { color } : undefined}>{value}</p>
              <p className="text-[10px] font-semibold text-muted-foreground mt-0.5">{label}</p>
              <p className="text-[9px] text-muted-foreground/50">{sub}</p>
            </div>
          ))}
        </div>

        {membershipTier === "transform" && monthlyReviewContent && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Your AI Monthly Review</p>
            <div className="rounded-xl bg-secondary/30 p-4">
              <p className="font-serif text-sm leading-relaxed text-foreground">
                {expanded ? monthlyReviewContent : `${monthlyReviewContent.slice(0, 280)}${monthlyReviewContent.length > 280 ? "…" : ""}`}
              </p>
              {monthlyReviewContent.length > 280 && (
                <button onClick={() => setExpanded(e => !e)} className="mt-2 flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors">
                  {expanded ? <><ChevronUp size={12} /> Show less</> : <><ChevronDown size={12} /> Read full review</>}
                </button>
              )}
            </div>
          </div>
        )}

        {(membershipTier === "grow" || membershipTier === "restore") && weakestPillar && (
          <div className="rounded-xl p-3.5" style={{ background: "color-mix(in srgb, var(--icon-green) 6%, transparent)", borderLeft: "3px solid var(--icon-green)" }}>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "var(--icon-green)" }}>
              This month&apos;s focus — {PILLAR_LABELS[weakestPillar] ?? weakestPillar}
            </p>
            <p className="text-sm text-foreground leading-relaxed">{PILLAR_NEXT_ACTIONS[weakestPillar] ?? "Focus on your weakest pillar this month."}</p>
          </div>
        )}

        {membershipTier !== "transform" && (
          <p className="mt-3 text-xs text-muted-foreground/50 text-center">Keep going — your score moves when your habits do.</p>
        )}
      </div>
    </div>
  )
}
