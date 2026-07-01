/**
 * EatoBiotics — Living Twin figure resolver.
 *
 * The account Twin is personal, so its figure should match the customer (male /
 * female). This is the SINGLE place the figure image paths live.
 *
 * NOTE (wire-now-art-later): the single-figure artwork doesn't exist yet, so both
 * MALE and FEMALE currently point at the couple placeholder. When the art is added
 * to /public/images, flip the two constants below to the real files — nothing else
 * needs to change:
 *   const MALE   = "/images/twin-male.png"
 *   const FEMALE = "/images/twin-female.png"
 */

export type TwinSex = "male" | "female" | null

/** Generic couple figure — used as the fallback when sex is unknown, and (for
 *  now) as the placeholder for both sexes until single-figure art is provided. */
export const TWIN_FIGURE_FALLBACK = "/images/couple-hero.png"

const MALE = TWIN_FIGURE_FALLBACK // → "/images/twin-male.png" when art is added
const FEMALE = TWIN_FIGURE_FALLBACK // → "/images/twin-female.png" when art is added

export function twinFigureSrc(sex: TwinSex): string {
  if (sex === "male") return MALE
  if (sex === "female") return FEMALE
  return TWIN_FIGURE_FALLBACK
}

/** Normalise an arbitrary stored value to a TwinSex. */
export function normaliseSex(value: unknown): TwinSex {
  return value === "male" || value === "female" ? value : null
}
