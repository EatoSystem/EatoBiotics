/**
 * EatoBiotics — "Inside You" chapter builder.
 *
 * Pure, deterministic builder that turns the member's FoodSystemDigitalTwin into
 * the four chapters of the animated "How the Food System inside you works"
 * explainer (You eat → Prebiotics feed → Probiotics work → Postbiotics power you).
 * Each chapter carries the member's real biotic level so the Remotion composition
 * and the chapter pills are personalized. Free of React/Remotion so it is
 * unit-testable and identical on server and client.
 */

import type { FoodSystemDigitalTwin } from "@/lib/agent-loop/twin/twin-types"

export const INSIDE_YOU_FPS = 30
/** Frames per chapter (~5s each). */
export const INSIDE_YOU_CHAPTER_FRAMES = 150

export type InsideYouChapterKey = "eat" | "prebiotics" | "probiotics" | "postbiotics"

export interface InsideYouChapter {
  key: InsideYouChapterKey
  /** Short pill label. */
  label: string
  /** Chapter headline shown in the animation. */
  title: string
  /** One-sentence narration under the headline. */
  narration: string
  /** The member's live value for this chapter (0–100), null when unknown. */
  value: number | null
  /** What the value is, e.g. "Your prebiotic level today". */
  valueLabel: string
  /** One-line takeaway shown under the player for the active chapter. */
  takeaway: string
  /** First frame of this chapter in the composition. */
  fromFrame: number
  durationInFrames: number
}

/** Total composition length (all four chapters). */
export const INSIDE_YOU_DURATION_FRAMES = INSIDE_YOU_CHAPTER_FRAMES * 4

/** Reads naturally after "Your … level is". */
function level(v: number | null): string {
  if (v == null) return "still learning"
  if (v >= 70) return "strong"
  if (v >= 45) return "building"
  return "running low"
}

export function buildInsideYouChapters(twin: FoodSystemDigitalTwin): InsideYouChapter[] {
  const pre = twin.biotics.prebiotics.score
  const pro = twin.biotics.probiotics.score
  const post = twin.biotics.postbiotics.score
  const score = Math.round(twin.currentScore.value)

  const defs: Omit<InsideYouChapter, "fromFrame" | "durationInFrames">[] = [
    {
      key: "eat",
      label: "You eat",
      title: "Every meal is a message",
      narration:
        "Each plate you build sends instructions to the living Food System inside you — your Food System listens to every one.",
      value: score,
      valueLabel: "Your Food System Score today",
      takeaway: `Your Food System has learned from ${twin.observations.length} signal${twin.observations.length === 1 ? "" : "s"} so far — every meal teaches it more.`,
    },
    {
      key: "prebiotics",
      label: "Prebiotics feed",
      title: "Fibre feeds the living system inside you",
      narration:
        "Prebiotic fibres from plants travel down to feed the trillions of microbes that call you home.",
      value: pre,
      valueLabel: "Your prebiotic level today",
      takeaway: `Your prebiotic level is ${level(pre)} — plant variety is what moves it.`,
    },
    {
      key: "probiotics",
      label: "Probiotics work",
      title: "Live cultures join the community",
      narration:
        "Fermented foods add live microbes that work alongside your own — a busier, more diverse inner community.",
      value: pro,
      valueLabel: "Your probiotic level today",
      takeaway: `Your probiotic level is ${level(pro)} — one fermented food a day supports it.`,
    },
    {
      key: "postbiotics",
      label: "Postbiotics power",
      title: "Your microbes give back",
      narration:
        "Well-fed microbes produce postbiotic compounds associated with steady energy, comfort and resilience.",
      value: post,
      valueLabel: "Your postbiotic level today",
      takeaway: `Your postbiotic level is ${level(post)} — it follows when the first two are fed well.`,
    },
  ]

  return defs.map((d, i) => ({
    ...d,
    fromFrame: i * INSIDE_YOU_CHAPTER_FRAMES,
    durationInFrames: INSIDE_YOU_CHAPTER_FRAMES,
  }))
}

/** Which chapter a given frame belongs to (for pill highlighting). */
export function chapterIndexAtFrame(frame: number): number {
  return Math.min(3, Math.max(0, Math.floor(frame / INSIDE_YOU_CHAPTER_FRAMES)))
}
