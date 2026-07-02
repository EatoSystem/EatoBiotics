/**
 * EatoBiotics — "Your Week Inside" story builder (pure, deterministic).
 *
 * Turns the twin's last 7 days into 5–6 full-screen story slides (the Monday
 * recap): intro, meals learned, best meal, biotic win, score trend, and next
 * week's one focus. The overlay component renders these; this builder holds
 * all the copy so it is unit-testable. First-person Twin voice, non-medical.
 */

import type { FoodSystemDigitalTwin } from "@/lib/agent-loop/twin/twin-types"

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

const BIOTIC_LABEL = { prebiotics: "Prebiotics", probiotics: "Probiotics", postbiotics: "Postbiotics" } as const

export function buildWeekStory(twin: FoodSystemDigitalTwin): WeekStorySlide[] {
  const meals = weekMeals(twin)
  const delta = twin.progress.scoreDelta
  const score = Math.round(twin.currentScore.value)
  const strongest = twin.biotics.strongest
  const weakest = twin.biotics.weakest
  const slides: WeekStorySlide[] = []

  slides.push({
    key: "intro",
    eyebrow: "Your Week Inside",
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
    title: `${BIOTIC_LABEL[strongest]} led your week.`,
    detail: `${BIOTIC_LABEL[weakest]} is where I'd love more help — that's your biggest opportunity.`,
    accent: "#2DAA6E",
  })

  slides.push({
    key: "score",
    eyebrow: "Food System Score",
    stat: String(score),
    title:
      delta > 0
        ? `Up ${delta} since we met.`
        : delta < 0
          ? "Holding through a dip."
          : "Holding steady.",
    detail:
      delta > 0
        ? "Your meals are moving the number — I can feel the momentum."
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
