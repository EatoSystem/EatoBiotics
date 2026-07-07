/**
 * EatoBiotics — Digital Twin figure + video resolver.
 *
 * The account Digital Twin is personal, so its figure matches the customer
 * (male / female). This is the SINGLE place the figure image + hero-video paths
 * live. Unknown sex → the generic couple figure (still image; no per-sex video).
 */

export type TwinSex = "male" | "female" | null

/** Generic couple figure — the fallback when sex is unknown. */
export const TWIN_FIGURE_FALLBACK = "/images/couple-hero.png"

const FIGURE: Record<"male" | "female", string> = {
  male: "/images/twin-male.png",
  female: "/images/twin-female.png",
}

export function twinFigureSrc(sex: TwinSex): string {
  if (sex === "male") return FIGURE.male
  if (sex === "female") return FIGURE.female
  return TWIN_FIGURE_FALLBACK
}

/** The Remotion-rendered animated Digital Twin hero video for a given sex.
 *  Returns null when sex is unknown (the hero falls back to the still figure). */
export interface TwinVideo {
  mp4: string
  webm: string
  poster: string
}

export function twinVideo(sex: TwinSex): TwinVideo | null {
  if (sex !== "male" && sex !== "female") return null
  return {
    mp4: `/videos/dt-twin-${sex}.mp4`,
    webm: `/videos/dt-twin-${sex}.webm`,
    poster: `/videos/dt-twin-${sex}-poster.jpg`,
  }
}

/** Normalise an arbitrary stored value to a TwinSex. */
export function normaliseSex(value: unknown): TwinSex {
  return value === "male" || value === "female" ? value : null
}
