/**
 * EatoBiotics — at-log-time meal memory (pure, deterministic).
 *
 * `detectPatterns` (patterns.ts) makes the Twin smarter on the dashboard;
 * this module makes it feel like it REMEMBERS at the exact moment a meal is
 * revealed — "that's the third time you've logged this", "your best score
 * yet". One line, first-person Twin voice, only when the history genuinely
 * supports it; null otherwise. Longitudinal memory is the moat a better
 * camera can't copy.
 */

export interface MemoryMeal {
  name: string | null
  score: number | null
  createdAt: string
}

const ORDINALS = ["first", "second", "third", "fourth", "fifth", "sixth", "seventh", "eighth", "ninth", "tenth"]

function ordinal(n: number): string {
  return ORDINALS[n - 1] ?? `${n}th`
}

function normaliseName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim()
}

const avg = (xs: number[]) => Math.round(xs.reduce((s, x) => s + x, 0) / xs.length)

/**
 * A single first-person memory line for a just-logged meal, derived from the
 * member's prior meals (`history` should NOT include the meal being revealed).
 * Priority: repeat meal → personal best → weekly rhythm. Null when nothing
 * honest to say.
 */
export function mealMemory(
  logged: { name: string | null; score: number | null },
  history: MemoryMeal[],
  now: Date = new Date()
): string | null {
  const score = logged.score
  const scored = history.filter((m): m is MemoryMeal & { score: number } => typeof m.score === "number")

  // 1. Repeat meal — I've seen this exact dish before.
  const key = logged.name ? normaliseName(logged.name) : ""
  if (key) {
    const prior = scored.filter((m) => m.name && normaliseName(m.name) === key)
    if (prior.length >= 1) {
      const nth = prior.length + 1
      const priorAvg = avg(prior.map((m) => m.score))
      const priorBest = Math.max(...prior.map((m) => m.score))
      if (typeof score === "number" && score > priorBest) {
        return `That's the ${ordinal(nth)} time you've shown me this — and your best version yet (previously ${priorBest}).`
      }
      return `That's the ${ordinal(nth)} time you've shown me this one — it's averaged ${priorAvg} so far. I remember.`
    }
  }

  // 2. Personal best across everything (needs a real history to beat).
  if (typeof score === "number" && scored.length >= 3) {
    const best = Math.max(...scored.map((m) => m.score))
    if (score > best) {
      return `${score} — the highest-scoring meal you've ever shown me. Your previous best was ${best}.`
    }
  }

  // 3. Weekly rhythm — this is the Nth meal in the last 7 days.
  const week = 7 * 86_400_000
  const thisWeek = history.filter((m) => now.getTime() - Date.parse(m.createdAt) < week).length + 1
  if (thisWeek >= 4) {
    return `That's meal ${thisWeek} this week — this is the rhythm where I learn you fastest.`
  }

  return null
}
