/**
 * EatoBiotics — longitudinal Twin patterns (pure, deterministic).
 *
 * The Twin visibly gets smarter over time: `detectPatterns` reads the member's
 * meal history (up to 30 days from twin-data) and reports only the patterns the
 * data genuinely supports — weekday/weekend gaps, what their best meals share,
 * repeat winners, fortnight food-pattern trends, and weekly rhythm. First-person
 * voice, never medical, silent rather than speculative.
 */

import type { AccountTwinMeal } from "@/lib/agent-loop/account-twin"
import { mealBehaviour, type MealBioticKey } from "@/lib/agent-loop/behaviour"

export interface TwinPattern {
  id: string
  title: string
  detail: string
  icon: "momentum" | "biotic" | "streak" | "meal"
}

/* ═══════════════════════════════════════════════════════════════════════════
   GATE 3.6 — the worst of the nine sites, and the last one anybody looked at.

   These titles render in the "what your Food System learned" feed on /account,
   which is V1_CORE. Before this they read:

     "Your Postbiotics climbed 8 points this week"
     "Your Postbiotics slipped 8 points this week"
     "Your best meals lean on Prebiotics"

   The first two are three prohibited things in one sentence: a personal
   Postbiotics state, a number attached to it, and a change claim across two
   weeks. Tranche 1 removed exactly that shape from the pre-launch reveal, 2A
   from /assessment/results, the share card and the generated OG image, and 2C
   from sequence-email.ts. It was still live here because no claims guard had
   ever read this file.

   ── THE NUMBER STAYS, AND THE REASON MATTERS ────────────────────────

   `fortnightTrend` computes a real delta between two averages of measured meal
   sub-scores over two defined seven-day windows. That is a change in REPORTED
   FOOD PATTERNS, which `COMPARISON_LANGUAGE` permits and which the product
   should say. What was never permitted is the Biotic as its subject.

   ── AND BIOTIC_HINT.postbiotic WAS A MECHANISM CLAIM ─────────────────

   It read "your meals feed the producers well" — friendly words for microbial
   production, which POSTBIOTICS_INFERENCE_BOUNDARY lists by name under
   `be-produced-by`. No regex catches it, because it names no Biotic; the pin
   below is what stops it coming back.

   ── REPORTED, NOT FIXED HERE ──────────────────────────────────

   `fortnightTrend` compares two windows with NO method-version check — the
   thing `canCompare` (lib/fss/engine/compare.ts) exists to refuse. It is sound
   today because both windows come from one instrument; it stops being sound
   the moment meal scoring changes version, silently. Wiring `canCompare` into
   the account surface is Gate 5 ("Reassess / What Changed") and would change
   what a live dashboard computes, so it does not belong inside a wording gate.
   ══════════════════════════════════════════════════════════════════════════ */

type BioticK = MealBioticKey

/**
 * The closing clause on the best-meals signal.
 *
 * Each names a food category the meal was actually scored on. `postbiotic`
 * no longer claims a meal fed anything: the bucket is polyphenol-rich and
 * resistant-starch foods (lib/biotics-prompt.ts:35), and no food is a
 * postbiotic.
 */
const BIOTIC_HINT: Record<BioticK, string> = {
  prebiotic: "plant variety is your superpower",
  probiotic: "fermented foods are your superpower",
  postbiotic: "polyphenol-rich foods are your superpower",
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
    title: `Your best meals lean on ${mealBehaviour(lead)}`,
    detail: `That is the common thread across your top-scoring meals — ${BIOTIC_HINT[lead]}.`,
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
        title: `Your meals climbed ${rounded} points on ${mealBehaviour(bestKey)} this week`,
        detail: "Compared with the week before — whatever changed, it's working.",
        icon: "momentum",
      }
    : {
        id: `trend-down-${bestKey}`,
        title: `Your meals slipped ${-rounded} points on ${mealBehaviour(bestKey)} this week`,
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
