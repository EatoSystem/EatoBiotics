"use client"

const GOAL_PILLARS: Record<string, {
  primary: string; secondary: string; label: string; insight: string; action: string
}> = {
  digestion: {
    primary: "feeding", secondary: "adding", label: "Digestion",
    insight: "Your gut microbiome health for digestion depends on consistent fibre (Feeding) and live cultures (Live Foods).",
    action: "Combine a prebiotic food and a probiotic food in your next meal.",
  },
  energy: {
    primary: "consistency", secondary: "diversity", label: "Energy",
    insight: "Stable energy comes from eating rhythm (Consistency) and the diversity of plants feeding your gut.",
    action: "Eat your first meal within 1 hour of waking, then add a new plant species at lunch.",
  },
  mood: {
    primary: "adding", secondary: "diversity", label: "Mood",
    insight: "90–95% of serotonin is made in your gut. Live Foods and Plant Diversity are your mood levers.",
    action: "Add a fermented food to today's meals — this directly feeds your gut-brain pathway.",
  },
  immunity: {
    primary: "diversity", secondary: "feeding", label: "Immunity",
    insight: "Gut immune function depends on microbial diversity. 20+ plant species per week is the evidence-based threshold.",
    action: "Count your plant species from the past 3 days and aim to add 2 more tomorrow.",
  },
  recovery: {
    primary: "feeding", secondary: "consistency", label: "Recovery",
    insight: "Gut repair requires consistent fibre delivery and regular meal timing for overnight microbiome restoration.",
    action: "Eat a fibre-rich meal 2+ hours before sleep to give your gut bacteria what they need overnight.",
  },
}

const PILLAR_LABELS: Record<string, string> = {
  diversity: "Plant Diversity", feeding: "Feeding", adding: "Live Foods",
  consistency: "Consistency", feeling: "Body Awareness",
}

interface GoalProgressCardProps {
  healthGoals: string[] | null
  subScores: Record<string, number> | null
  profileColor: string
  membershipTier: "free" | "trial" | "member" | "grow" | "restore" | "transform"
}

export function GoalProgressCard({ healthGoals, subScores, profileColor }: GoalProgressCardProps) {
  const primaryGoal = healthGoals?.[0] ?? null
  const goalConfig = primaryGoal ? (GOAL_PILLARS[primaryGoal] ?? null) : null

  if (!goalConfig || !subScores) return null

  const primaryScore = Math.round(subScores[goalConfig.primary] ?? 0)
  const secondaryScore = Math.round(subScores[goalConfig.secondary] ?? 0)
  const avgScore = Math.round((primaryScore + secondaryScore) / 2)
  const status = avgScore >= 70 ? "Strong foundation" : avgScore < 50 ? "Focus needed" : "Building"
  const statusColor = avgScore >= 70 ? "var(--icon-green)" : avgScore < 50 ? "var(--icon-orange)" : "var(--icon-teal)"

  return (
    <div className="rounded-2xl border border-border bg-background overflow-hidden">
      <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, ${profileColor}, color-mix(in srgb, ${profileColor} 40%, var(--icon-teal)))` }} />
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-0.5">Your Goal</p>
            <h3 className="font-serif text-base font-semibold" style={{ color: profileColor }}>{goalConfig.label}</h3>
          </div>
          <span className="shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold" style={{ background: `color-mix(in srgb, ${statusColor} 12%, transparent)`, color: statusColor }}>
            {status}
          </span>
        </div>

        <div className="space-y-3 mb-4">
          {([
            { key: goalConfig.primary, score: primaryScore, isPrimary: true },
            { key: goalConfig.secondary, score: secondaryScore, isPrimary: false },
          ] as Array<{ key: string; score: number; isPrimary: boolean }>).map(({ key, score, isPrimary }) => (
            <div key={key}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground">{PILLAR_LABELS[key] ?? key}</span>
                <span className="text-xs font-bold tabular-nums text-foreground">{score}<span className="text-muted-foreground font-normal">/100</span></span>
              </div>
              <div className="h-2 w-full rounded-full bg-secondary">
                <div className="h-2 rounded-full transition-all" style={{ width: `${score}%`, background: isPrimary ? profileColor : `color-mix(in srgb, ${profileColor} 60%, var(--icon-teal))` }} />
              </div>
            </div>
          ))}
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed mb-3">{goalConfig.insight}</p>

        <div className="rounded-xl px-4 py-3 text-sm leading-relaxed" style={{ background: `color-mix(in srgb, ${profileColor} 6%, transparent)`, borderLeft: `3px solid ${profileColor}` }}>
          <span className="font-semibold text-foreground">Today&apos;s action: </span>
          <span className="text-muted-foreground">{goalConfig.action}</span>
        </div>
      </div>
    </div>
  )
}
