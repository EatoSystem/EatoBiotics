/**
 * EatoBiotics — longitudinal Twin patterns (pure, deterministic).
 *
 * The Twin visibly gets smarter over time: `detectPatterns` reads the member's
 * meal history (up to 30 days from twin-data) and reports only the patterns the
 * data genuinely supports — weekday/weekend gaps, what their best meals share,
 * repeat winners, fortnight biotic trends, and weekly rhythm. First-person
 * voice, never medical, silent rather than speculative.
 */

import type { AccountTwinMeal } from "@/lib/agent-loop/account-twin"

export interface TwinPattern {
  id: string
  title: string
  detail: string
  icon: "momentum" | "biotic" | "streak" | "meal"
}

const BIOTIC_LABEL = { prebiotic: "Prebiotics", probiotic: "Probiotics", postbiotic: "Postbiotics" } as const
type BioticK = keyof typeof BIOTIC_LABEL

const BIOTIC_HINT: Record<BioticK, string> = {
  prebiotic: "plant variety is your superpower",
  probiotic: "fermented foods are your superpower",
  postbiotic: "your meals feed the producers well",
}

const avg = (xs: number[]) => xs.reduce((s, x) => s + x, 0) / xs.length

const isWeekend = (iso: string) => {
  const d = new Date(iso).getDay()
  return d === 0 || d === 6
}

const dayOf = (iso: string) => new Date(iso).toISOString().slice(0, 10)

function normaliseName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim()
}

/** 1. Weekday vs weekend average gap (needs ≥3 meals on each side, gap ≥5). */
function weekendGap(meals: AccountTwinMeal[]): TwinPattern | null {
  const wd = meals.filter((m) => !isWeekend(m.createdAt)).map((m) => m.score)
  const we = meals.filter((m) => isWeekend(m.createdAt)).map((m) => m.score)
  if (wd.length < 3 || we.length < 3) return null
  const gap = Math.round(avg(wd) - avg(we))
  if (Math.abs(gap) < 5) return null
  return gap > 0
    ? {
        id: "weekend-dip",
        title: `I noticed your weekends dip ${gap} points`,
        detail: "Your weekday meals score higher — one weekend swap would close most of the gap.",
        icon: "momentum",
      }
    : {
        id: "weekend-lift",
        title: `Your weekends run ${-gap} points stronger`,
        detail: "Whatever you do at weekends, your weekdays would love some of it.",
        icon: "momentum",
      }
}

/** 2. What the top-3 meals share (their dominant biotic). Needs ≥3 meals. */
function bestMealSignal(meals: AccountTwinMeal[]): TwinPattern | null {
  if (meals.length < 3) return null
  const top = [...meals].sort((a, b) => b.score - a.score).slice(0, 3)
  const totals: Record<BioticK, number> = { prebiotic: 0, probiotic: 0, postbiotic: 0 }
  for (const m of top) {
    totals.prebiotic += m.prebiotic
    totals.probiotic += m.probiotic
    totals.postbiotic += m.postbiotic
  }
  const lead = (Object.keys(totals) as BioticK[]).sort((a, b) => totals[b] - totals[a])[0]
  return {
    id: `best-lean-${lead}`,
    title: `Your best meals lean on ${BIOTIC_LABEL[lead]}`,
    detail: `Across your top-scoring meals, ${BIOTIC_LABEL[lead].toLowerCase()} lead the way — ${BIOTIC_HINT[lead]}.`,
    icon: "biotic",
  }
}

/** 3. A repeat winner: the same meal ≥2× with average score ≥70. */
function repeatWinner(meals: AccountTwinMeal[]): TwinPattern | null {
  const groups = new Map<string, AccountTwinMeal[]>()
  for (const m of meals) {
    const k = normaliseName(m.name)
    if (!k) continue
    groups.set(k, [...(groups.get(k) ?? []), m])
  }
  let best: { name: string; score: number; count: number } | null = null
  for (const g of groups.values()) {
    if (g.length < 2) continue
    const a = avg(g.map((m) => m.score))
    if (a >= 70 && (!best || a > best.score)) best = { name: g[0].name, score: Math.round(a), count: g.length }
  }
  if (!best) return null
  return {
    id: "repeat-winner",
    title: `"${best.name}" keeps delivering`,
    detail: `You've logged it ${best.count} times at an average of ${best.score} — a proven winner worth keeping in rotation.`,
    icon: "meal",
  }
}

/** 4. Fortnight biotic trend: last 7 days vs the 7 before (needs ≥3 meals each, ±6). */
function fortnightTrend(meals: AccountTwinMeal[], now: number): TwinPattern | null {
  const week = 7 * 86_400_000
  const recent = meals.filter((m) => now - new Date(m.createdAt).getTime() < week)
  const prior = meals.filter((m) => {
    const age = now - new Date(m.createdAt).getTime()
    return age >= week && age < 2 * week
  })
  if (recent.length < 3 || prior.length < 3) return null
  const keys: BioticK[] = ["prebiotic", "probiotic", "postbiotic"]
  let bestKey: BioticK | null = null
  let bestDelta = 0
  for (const k of keys) {
    const d = avg(recent.map((m) => m[k])) - avg(prior.map((m) => m[k]))
    if (Math.abs(d) > Math.abs(bestDelta)) {
      bestDelta = d
      bestKey = k
    }
  }
  if (!bestKey || Math.abs(bestDelta) < 6) return null
  const rounded = Math.round(bestDelta)
  return rounded > 0
    ? {
        id: `trend-up-${bestKey}`,
        title: `Your ${BIOTIC_LABEL[bestKey]} climbed ${rounded} points this week`,
        detail: "Compared with the week before — whatever changed, it's working.",
        icon: "momentum",
      }
    : {
        id: `trend-down-${bestKey}`,
        title: `Your ${BIOTIC_LABEL[bestKey]} slipped ${-rounded} points this week`,
        detail: "Compared with the week before — one targeted meal would bring it back.",
        icon: "biotic",
      }
}

/** 5. Weekly rhythm: meals on ≥4 distinct days in the last 7. */
function weeklyRhythm(meals: AccountTwinMeal[], now: number): TwinPattern | null {
  const week = 7 * 86_400_000
  const days = new Set(
    meals.filter((m) => now - new Date(m.createdAt).getTime() < week).map((m) => dayOf(m.createdAt)),
  )
  if (days.size < 4) return null
  return {
    id: "rhythm",
    title: `You've shown me meals on ${days.size} of the last 7 days`,
    detail: "That rhythm is exactly how I learn what actually works for you.",
    icon: "streak",
  }
}

/**
 * All supported patterns, strongest-signal first. `now` is injectable for tests.
 */
export function detectPatterns(meals: AccountTwinMeal[], now: number = Date.now()): TwinPattern[] {
  if (meals.length === 0) return []
  const out: (TwinPattern | null)[] = [
    fortnightTrend(meals, now),
    weekendGap(meals),
    bestMealSignal(meals),
    repeatWinner(meals),
    weeklyRhythm(meals, now),
  ]
  return out.filter((p): p is TwinPattern => p !== null)
}
