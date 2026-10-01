/**
 * EatoBiotics — "Inside You" chapter builder.
 *
 * Pure, deterministic builder that turns the member's FoodSystemDigitalTwin into
 * the four chapters of the animated "How the Food System inside you works"
 * explainer (You eat → Prebiotics feed → Probiotics work → Postbiotics power you).
 * The three Biotic chapters are EDUCATION and carry no personal number — see
 * `value` below. Only the opening chapter shows a figure, and that figure is
 * the overall Biotics Score™. Free of React/Remotion so it is unit-testable
 * and identical on server and client.
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
  /**
   * The member's value for this chapter, or null when there is none.
   *
   * ── GATE 3.6: ONLY THE OVERALL SCORE EVER FILLS THIS ────────────────
   *
   * The three Biotic chapters used to carry `twin.biotics.<key>.score` with
   * labels "Your prebiotic level today", "Your probiotic level today", "Your
   * postbiotic level today", and takeaways reading "Your postbiotic level is
   * running low". `inside-you-journey.tsx:199-202` rendered the number and the
   * label together, on /account. That is three personal Biotic states with
   * numbers and band words — the claim
   * POSTBIOTICS_INFERENCE_BOUNDARY prohibits by name.
   *
   * They are now `null`, which the renderer already handles by showing
   * nothing, because nothing a person tells us measures them. The `eat`
   * chapter keeps its value: that is the overall Biotics Score™, a result the
   * product computes and is entitled to show.
   */
  value: number | null
  /** What the value is — empty for a chapter that has none. */
  valueLabel: string
  /** One-line takeaway shown under the player for the active chapter. */
  takeaway: string
  /** First frame of this chapter in the composition. */
  fromFrame: number
  durationInFrames: number
}

/** Total composition length (all four chapters). */
export const INSIDE_YOU_DURATION_FRAMES = INSIDE_YOU_CHAPTER_FRAMES * 4

export function buildInsideYouChapters(twin: FoodSystemDigitalTwin): InsideYouChapter[] {
  const score = Math.round(twin.currentScore.value)

  const defs: Omit<InsideYouChapter, "fromFrame" | "durationInFrames">[] = [
    {
      key: "eat",
      label: "You eat",
      title: "Every meal is a message",
      narration:
        "Each plate you build sends instructions to the living Food System inside you — your Food System listens to every one.",
      value: score,
      valueLabel: "Your Biotics Score™ today",
      takeaway: `Your Food System has learned from ${twin.observations.length} signal${twin.observations.length === 1 ? "" : "s"} so far — every meal teaches it more.`,
    },
    {
      key: "prebiotics",
      label: "Prebiotics feed",
      title: "Fibre feeds the living system inside you",
      narration:
        "Prebiotic fibres from plants travel down to feed the trillions of microbes that call you home.",
      value: null,
      valueLabel: "",
      takeaway:
        "Plant variety is what moves this one — more different plants across the week, not more of the same one.",
    },
    {
      key: "probiotics",
      label: "Probiotics work",
      title: "A fermented food arrives",
      narration:
        "Foods transformed by fermentation — yoghurt, kefir, kimchi, sauerkraut, miso. Whether live microorganisms survive to be eaten depends on the food and how it is made.",
      value: null,
      valueLabel: "",
      takeaway: "One fermented food a day is the whole behaviour here.",
    },
    {
      key: "postbiotics",
      label: "Postbiotics power",
      title: "Your microbes give back",
      narration:
        "Well-fed microbes produce postbiotic compounds associated with steady energy, comfort and resilience.",
      value: null,
      valueLabel: "",
      takeaway:
        "This is the one you cannot eat and we do not score. It follows from the first two.",
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
