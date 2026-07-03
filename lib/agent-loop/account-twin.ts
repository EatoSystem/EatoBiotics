/**
 * EatoBiotics — server-safe Account Twin assembler.
 *
 * Builds the deterministic `FoodSystemDigitalTwin` (the same read-model the
 * marketing/loop UI uses) from a signed-in member's real account data, so the
 * account can show a *live* Twin that reflects their current Food System and
 * "learns" as they log meals. Pure + SSR-safe: no React / network / localStorage.
 * Reuses `buildBaseline`, the engine (`createAgentLoopSession` + `runMealLoop`)
 * and `buildFoodSystemTwin` — no scoring/recommendation logic is duplicated here.
 */

import { getScoreBand } from "@/lib/scoring"
import { detectPatterns } from "@/lib/account/patterns"
import { buildBaseline } from "./baseline"
import { createAgentLoopSession, makeObservation, runLoop } from "./engine"
import { deterministicProvider } from "./providers/deterministic"
import { buildFoodSystemTwin } from "./twin/twin-builder"
import type { FoodSystemDigitalTwin } from "./twin/twin-types"

export interface AccountTwinMeal {
  name: string
  score: number
  prebiotic: number
  probiotic: number
  postbiotic: number
  createdAt: string
}

export interface AccountTwinInput {
  score: number | null
  previousScore: number | null
  profileType: string | null
  biotics: { prebiotic: number; probiotic: number; postbiotic: number } | null
  meals: AccountTwinMeal[]
  streak?: number
}

export type TwinFeedIcon = "meal" | "streak" | "momentum" | "biotic"

export interface TwinFeedEntry {
  id: string
  icon: TwinFeedIcon
  title: string
  detail: string
  at: string | null
}

export interface AccountTwinResult {
  twin: FoodSystemDigitalTwin
  feed: TwinFeedEntry[]
}

const BIOTIC_NAME = { prebiotic: "Prebiotics", probiotic: "Probiotics", postbiotic: "Postbiotics" } as const

/** Which biotic a meal most supported (for the "what your Food System learned" feed). */
function topBiotic(m: AccountTwinMeal): keyof typeof BIOTIC_NAME {
  const entries: [keyof typeof BIOTIC_NAME, number][] = [
    ["prebiotic", m.prebiotic],
    ["probiotic", m.probiotic],
    ["postbiotic", m.postbiotic],
  ]
  entries.sort((a, b) => b[1] - a[1])
  return entries[0][0]
}

/**
 * Assemble the member's live Digital Twin + a human-readable "learning" feed.
 * Async because the loop engine runs each meal through the (deterministic)
 * provider — fast + pure, no external calls.
 */
export async function buildAccountTwin(input: AccountTwinInput): Promise<AccountTwinResult> {
  const latest = input.score ?? 50
  const prev = input.previousScore

  // Baseline biotics: prefer the averaged meal biotics; else derive a neutral
  // triple from the overall score so a Twin still renders on day one.
  const b = input.biotics
  const bioticsInput = b
    ? { prebiotics: b.prebiotic, probiotics: b.probiotic, postbiotics: b.postbiotic }
    : { prebiotics: latest, probiotics: Math.max(0, latest - 20), postbiotics: latest }

  // If we know a previous score, anchor the baseline there and let an
  // assessment_update carry the score to "now" — giving a real, non-fabricated
  // improvement delta + momentum. Otherwise the baseline is the latest score.
  const baselineScore = prev != null ? prev : latest
  const baseline = buildBaseline({
    foundationKey: "you",
    score: baselineScore,
    scoreLabel: input.profileType ?? getScoreBand(baselineScore).label,
    biotics: bioticsInput,
    strengths: [],
    priorities: [],
  })

  let session = createAgentLoopSession(baseline, "foundation")

  // Seed the current score (only when it genuinely moved) so trends are real.
  if (prev != null && latest !== prev) {
    const obs = makeObservation("assessment_update", latest, { score: latest })
    session = (await runLoop(session, obs, deterministicProvider)).session
  }

  // Replay recent meals oldest → newest so the newest is the latest turn (and
  // thus drives the "next best action"). Cap for performance.
  const meals = [...input.meals]
    .sort((a, b2) => new Date(a.createdAt).getTime() - new Date(b2.createdAt).getTime())
    .slice(-20)
  for (const m of meals) {
    const obs = makeObservation("meal_description", m.name, {
      biotics: { prebiotic: m.prebiotic, probiotic: m.probiotic, postbiotic: m.postbiotic },
      score: m.score,
    })
    session = (await runLoop(session, obs, deterministicProvider)).session
  }

  const twin = buildFoodSystemTwin(session)
  const feed = buildFeed(input, twin)
  return { twin, feed }
}

/** The "what your Food System just learned" feed — newest first. */
function buildFeed(input: AccountTwinInput, twin: FoodSystemDigitalTwin): TwinFeedEntry[] {
  const feed: TwinFeedEntry[] = []
  const { momentum, scoreDelta } = twin.progress

  // Momentum headline — the Twin speaks in first person.
  feed.push({
    id: "momentum",
    icon: "momentum",
    title:
      momentum === "improving"
        ? `Momentum is building${scoreDelta > 0 ? ` — +${scoreDelta} since we met` : ""}`
        : momentum === "stalled"
          ? "I noticed things have slowed"
          : momentum === "starting"
            ? "I'm getting to know you"
            : "Holding steady — keep the rhythm",
    detail: `I've learned from ${twin.observations.length} signal${twin.observations.length === 1 ? "" : "s"} so far`,
    at: null,
  })

  // Longitudinal patterns — the Twin getting visibly smarter (max 2 per feed).
  for (const p of detectPatterns(input.meals).slice(0, 2)) {
    feed.push({ id: `pattern-${p.id}`, icon: p.icon, title: p.title, detail: p.detail, at: null })
  }

  // Streak.
  if ((input.streak ?? 0) >= 2) {
    feed.push({
      id: "streak",
      icon: "streak",
      title: `${input.streak}-day logging streak`,
      detail: "Consistency is the strongest signal I have",
      at: null,
    })
  }

  // Per-meal learning (newest first).
  const recent = [...input.meals]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6)
  for (const m of recent) {
    const tb = topBiotic(m)
    feed.push({
      id: `meal-${m.createdAt}-${m.name}`,
      icon: "biotic",
      title: m.name,
      detail: `This fed your ${BIOTIC_NAME[tb]} · meal score ${m.score}`,
      at: m.createdAt,
    })
  }

  return feed
}
