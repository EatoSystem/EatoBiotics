/**
 * EatoBiotics — "Your Food System This Week" story builder (pure, deterministic).
 *
 * Turns the twin's last 7 days into 5–6 full-screen story slides (the Monday
 * recap): intro, meals learned, best meal, biotic win, score trend, and next
 * week's one focus. The overlay component renders these; this builder holds
 * all the copy so it is unit-testable. First-person Twin voice, non-medical.
 */

import { detectPatterns } from "@/lib/account/patterns"
import type { AccountTwinMeal } from "@/lib/agent-loop/account-twin"
import type { FoodSystemDigitalTwin } from "@/lib/agent-loop/twin/twin-types"
import { behaviourFor } from "@/lib/agent-loop/behaviour"
import type { BioticKey } from "@/lib/agent-loop/types"

/**
 * The food category behind a key, for the week story.
 *
 * `"meals"` because `buildAccountTwin` — the only path that reaches this on
 * /account — builds the twin's biotics from averaged MEAL sub-scores, never
 * from assessment answers. Naming the assessment's dimensions here would
 * describe something the week story never looked at.
 */
const weekBehaviour = (key: BioticKey): string => behaviourFor(key, "meals")

export interface WeekStorySlide {
  key: string
  eyebrow: string
  /** The big serif line. */
  title: string
  /** Supporting line under the title. */
  detail: string
  /** Optional huge stat rendered above the title. */
  stat?: string
  accent: string
}

interface WeekMeal {
  name: string
  score: number
  createdAt: number
}

function weekMeals(twin: FoodSystemDigitalTwin): WeekMeal[] {
  const cutoff = Date.now() - 7 * 86_400_000
  return twin.observations
    .filter((o) => (o.kind === "meal_description" || o.kind === "meal_photo") && o.createdAt >= cutoff)
    .map((o) => ({
      name: String(o.value),
      score: Number((o.meta as { score?: number } | undefined)?.score ?? 0),
      createdAt: o.createdAt,
    }))
}

/*
 * GATE 3.6: this map existed to print the three Biotic names into the week
 * story — "Prebiotics led your week." / "Postbiotics is where I'd love more
 * help." Both are personal Biotic states, on /account. The week story is built
 * from averaged MEAL sub-scores, so the honest subject is the food category
 * those meals were scored on, and `mealBehaviour` is where that lives.
 */

export function buildWeekStory(twin: FoodSystemDigitalTwin): WeekStorySlide[] {
  const meals = weekMeals(twin)
  const delta = twin.progress.scoreDelta
  const score = Math.round(twin.currentScore.value)
  const strongest = twin.biotics.strongest
  const weakest = twin.biotics.weakest
  const slides: WeekStorySlide[] = []

  slides.push({
    key: "intro",
    eyebrow: "Your Food System This Week",
    title: "Here's what I learned about you this week.",
    detail: "30 seconds — tap to move through.",
    accent: "#A8E063",
  })

  slides.push(
    meals.length > 0
      ? {
          key: "meals",
          eyebrow: "Signals",
          stat: String(meals.length),
          title: meals.length === 1 ? "meal reached me this week" : "meals reached me this week",
          detail: "Every one of them taught me something about your Food System.",
          accent: "#4CB648",
        }
      : {
          key: "meals",
          eyebrow: "Signals",
          title: "A quiet week inside",
          detail: "No meals reached me this week — show me one tomorrow and I'll get back to learning.",
          accent: "#4CB648",
        },
  )

  if (meals.length > 0) {
    const best = [...meals].sort((a, b) => b.score - a.score)[0]
    slides.push({
      key: "best-meal",
      eyebrow: "Meal of the week",
      stat: String(best.score),
      title: best.name,
      detail: "Your strongest signal of the week — more like this one.",
      accent: "#F5C518",
    })
  }

  slides.push({
    key: "biotics",
    eyebrow: "Your three biotics",
    title: `${weekBehaviour(strongest)} led your week.`,
    detail: `${weekBehaviour(weakest)} is where I'd love more help — that's your biggest opportunity.`,
    accent: "#2DAA6E",
  })

  // Longitudinal pattern — the Twin noticing something specific about them.
  const patternMeals: AccountTwinMeal[] = twin.observations
    .filter((o) => o.kind === "meal_description" || o.kind === "meal_photo")
    .map((o) => {
      const meta = o.meta as { score?: number; biotics?: { prebiotic?: number; probiotic?: number; postbiotic?: number } } | undefined
      return {
        name: String(o.value),
        score: Number(meta?.score ?? 0),
        prebiotic: Number(meta?.biotics?.prebiotic ?? 0),
        probiotic: Number(meta?.biotics?.probiotic ?? 0),
        postbiotic: Number(meta?.biotics?.postbiotic ?? 0),
        createdAt: new Date(o.createdAt).toISOString(),
      }
    })
  const pattern = detectPatterns(patternMeals)[0]
  if (pattern) {
    slides.push({
      key: "pattern",
      eyebrow: "What I noticed",
      title: pattern.title,
      detail: pattern.detail,
      accent: "#7ED9A8",
    })
  }

  slides.push({
    key: "score",
    eyebrow: "Biotics Score™",
    stat: String(score),
    title:
      delta > 0
        ? `Up ${delta} since we met.`
        : delta < 0
          ? "Holding through a dip."
          : "Holding steady.",
    detail:
      delta > 0
        ? "That is what your answers said this time. Let us see whether it holds."
        : "Rhythm beats perfection. Next week we build again.",
    accent: "#A8E063",
  })

  if (twin.nextBestAction) {
    slides.push({
      key: "focus",
      eyebrow: "Next week · one focus",
      title: twin.nextBestAction.action,
      detail: "Just this one thing. I'll notice when it lands.",
      accent: "#F5A623",
    })
  }

  return slides
}
